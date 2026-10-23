use std::sync::Arc;

use anyhow::{Context, Result};
use lettre::{
    AsyncSmtpTransport, AsyncTransport, Message, Tokio1Executor,
    message::{Mailbox, header::ContentType},
    transport::smtp::authentication::Credentials,
};

use crate::config::SmtpConfig;

#[derive(Clone)]
pub struct EmailService {
    backend: EmailBackend,
}

#[derive(Clone)]
enum EmailBackend {
    Smtp {
        transport: Arc<AsyncSmtpTransport<Tokio1Executor>>,
        from: Mailbox,
    },
    Log,
}

impl EmailService {
    pub fn from_config(config: &SmtpConfig, allow_log_backend: bool) -> Result<Self> {
        let Some(host) = config.host.as_deref() else {
            if !allow_log_backend {
                anyhow::bail!(
                    "SMTP_HOST is required outside development; refusing to log OTPs in production"
                );
            }
            tracing::warn!("SMTP_HOST is not set; OTP emails will be logged instead of sent");
            return Ok(Self {
                backend: EmailBackend::Log,
            });
        };

        let from: Mailbox = config
            .from
            .parse()
            .with_context(|| format!("invalid SMTP_FROM mailbox `{}`", config.from))?;

        let builder = if config.port == 465 {
            AsyncSmtpTransport::<Tokio1Executor>::relay(host)?
        } else {
            AsyncSmtpTransport::<Tokio1Executor>::starttls_relay(host)?
        };

        let mut builder = builder.port(config.port);
        if let (Some(username), Some(password)) = (&config.username, &config.password) {
            builder = builder.credentials(Credentials::new(username.clone(), password.clone()));
        }

        Ok(Self {
            backend: EmailBackend::Smtp {
                transport: Arc::new(builder.build()),
                from,
            },
        })
    }

    pub async fn send_otp(&self, to: &str, code: &str, purpose: &str) -> Result<()> {
        let (subject, intro) = match purpose {
            crate::otp::PURPOSE_REGISTER => (
                "Verify your JULink email",
                "Use this code to verify your JULink account:",
            ),
            crate::otp::PURPOSE_PASSWORD_RESET => (
                "Reset your JULink password",
                "Use this code to reset your JULink password:",
            ),
            _ => ("Your JULink code", "Use this code to continue:"),
        };

        let body = format!(
            "{intro}\n\n    {code}\n\nThe code expires in 10 minutes. \
             If you did not request it, you can ignore this email.\n"
        );

        match &self.backend {
            EmailBackend::Log => {
                tracing::info!(
                    email = to,
                    code,
                    purpose,
                    "OTP generated (log email backend)"
                );
                Ok(())
            }
            EmailBackend::Smtp { transport, from } => {
                let message = Message::builder()
                    .from(from.clone())
                    .to(to
                        .parse()
                        .with_context(|| format!("invalid recipient `{to}`"))?)
                    .subject(subject)
                    .header(ContentType::TEXT_PLAIN)
                    .body(body)?;

                transport
                    .send(message)
                    .await
                    .with_context(|| format!("could not send OTP email to {to}"))?;
                Ok(())
            }
        }
    }
}
