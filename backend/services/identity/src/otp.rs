use std::env;

use anyhow::Result;
use hmac::{Hmac, Mac};
use rand::{Rng, RngCore, rngs::OsRng};
use sha2::Sha256;

pub const PURPOSE_REGISTER: &str = "register";
pub const PURPOSE_PASSWORD_RESET: &str = "password_reset";

type HmacSha256 = Hmac<Sha256>;

#[derive(Clone)]
pub struct OtpHasher {
    secret: Vec<u8>,
}

impl OtpHasher {
    pub fn new(secret: Vec<u8>) -> Self {
        Self { secret }
    }

    /// `OTP_SECRET` is required outside development. In dev, a random
    /// per-process secret is generated so local OTPs still verify.
    pub fn from_env(is_dev: bool) -> Result<Self> {
        if let Ok(secret) = env::var("OTP_SECRET") {
            if !secret.is_empty() {
                return Ok(Self::new(secret.into_bytes()));
            }
        }

        if !is_dev {
            anyhow::bail!("OTP_SECRET must be set outside development");
        }

        let mut secret = vec![0_u8; 32];
        OsRng.fill_bytes(&mut secret);
        tracing::warn!("OTP_SECRET is not set; using an ephemeral development secret");
        Ok(Self::new(secret))
    }

    pub fn hash(&self, email: &str, purpose: &str, code: &str) -> String {
        let mut mac = HmacSha256::new_from_slice(&self.secret)
            .expect("HMAC-SHA256 accepts keys of any length");
        mac.update(email.to_ascii_lowercase().as_bytes());
        mac.update(b":");
        mac.update(purpose.as_bytes());
        mac.update(b":");
        mac.update(code.as_bytes());
        hex::encode(mac.finalize().into_bytes())
    }

    pub fn verify(&self, email: &str, purpose: &str, code: &str, stored_hash: &str) -> bool {
        let Ok(expected) = hex::decode(stored_hash) else {
            return false;
        };

        let mut mac = HmacSha256::new_from_slice(&self.secret)
            .expect("HMAC-SHA256 accepts keys of any length");
        mac.update(email.to_ascii_lowercase().as_bytes());
        mac.update(b":");
        mac.update(purpose.as_bytes());
        mac.update(b":");
        mac.update(code.as_bytes());
        mac.verify_slice(&expected).is_ok()
    }
}

pub fn generate_code() -> String {
    let mut rng = rand::thread_rng();
    format!("{:06}", rng.gen_range(0..1_000_000_u32))
}

pub fn validate_purpose(purpose: &str) -> Result<&'static str> {
    match purpose {
        PURPOSE_REGISTER => Ok(PURPOSE_REGISTER),
        PURPOSE_PASSWORD_RESET => Ok(PURPOSE_PASSWORD_RESET),
        other => Err(anyhow::anyhow!("unsupported OTP purpose `{other}`")),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn code_is_six_digits() {
        for _ in 0..100 {
            let code = generate_code();
            assert_eq!(code.len(), 6);
            assert!(code.chars().all(|character| character.is_ascii_digit()));
        }
    }

    #[test]
    fn hashes_and_verifies_codes() {
        let hasher = OtpHasher::new(b"test-secret".to_vec());
        let hash = hasher.hash("Student@Example.com", PURPOSE_REGISTER, "123456");

        assert_ne!(hash, "123456");
        assert!(hasher.verify("student@example.com", PURPOSE_REGISTER, "123456", &hash));
        assert!(!hasher.verify("student@example.com", PURPOSE_REGISTER, "654321", &hash));
        assert!(!hasher.verify("other@example.com", PURPOSE_REGISTER, "123456", &hash));
        assert!(!hasher.verify(
            "student@example.com",
            PURPOSE_PASSWORD_RESET,
            "123456",
            &hash
        ));
    }
}
