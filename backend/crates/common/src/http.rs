use std::time::Duration;

use reqwest::Client;

/// Internal service-to-service HTTP client.
///
/// Compression is disabled so the gateway can forward `Content-Encoding`
/// untouched when proxying upstream responses.
pub fn client() -> Client {
    Client::builder()
        .connect_timeout(Duration::from_secs(2))
        .timeout(Duration::from_secs(10))
        .pool_max_idle_per_host(32)
        .no_gzip()
        .no_brotli()
        .no_deflate()
        .build()
        .expect("failed to build HTTP client")
}
