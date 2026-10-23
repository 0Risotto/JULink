//! Typed internal clients used for service-to-service calls.
//!
//! The gateway never uses these. They exist so feature services can call each
//! other without hand-rolling `reqwest` boilerplate.

use julink_common::error::AppError;
use reqwest::{Client, Method, Url};
use serde::{Serialize, de::DeserializeOwned};

#[derive(Clone)]
pub struct ServiceClient {
    base_url: Url,
    http: Client,
}

impl ServiceClient {
    pub fn new(base_url: &str) -> anyhow::Result<Self> {
        let base_url = Url::parse(base_url)?;
        Ok(Self {
            base_url,
            http: julink_common::http::client(),
        })
    }

    pub fn url(&self, path: &str) -> anyhow::Result<Url> {
        Ok(self.base_url.join(path.trim_start_matches('/'))?)
    }

    pub async fn get<T>(&self, path: &str) -> Result<T, AppError>
    where
        T: DeserializeOwned,
    {
        self.send(Method::GET, path, Option::<&()>::None).await
    }

    /// Like `get`, but returns `None` for a 404 instead of an upstream error.
    pub async fn get_optional<T>(&self, path: &str) -> Result<Option<T>, AppError>
    where
        T: DeserializeOwned,
    {
        let url = self.url(path).map_err(AppError::Internal)?;

        let response = self.http.get(url).send().await?;
        if response.status() == reqwest::StatusCode::NOT_FOUND {
            return Ok(None);
        }
        if !response.status().is_success() {
            let status = response.status();
            let detail = response.text().await.unwrap_or_default();
            return Err(AppError::Upstream(format!(
                "{status} from {}: {detail}",
                self.base_url
            )));
        }

        Ok(Some(response.json::<T>().await?))
    }

    pub async fn post<B, T>(&self, path: &str, body: &B) -> Result<T, AppError>
    where
        B: Serialize + ?Sized,
        T: DeserializeOwned,
    {
        self.send(Method::POST, path, Some(body)).await
    }

    async fn send<B, T>(&self, method: Method, path: &str, body: Option<&B>) -> Result<T, AppError>
    where
        B: Serialize + ?Sized,
        T: DeserializeOwned,
    {
        let url = self.url(path).map_err(AppError::Internal)?;

        let mut request = self.http.request(method, url);
        if let Some(body) = body {
            request = request.json(body);
        }

        let response = request.send().await?;
        if !response.status().is_success() {
            let status = response.status();
            let detail = response.text().await.unwrap_or_default();
            return Err(AppError::Upstream(format!(
                "{status} from {}: {detail}",
                self.base_url
            )));
        }

        Ok(response.json::<T>().await?)
    }
}
