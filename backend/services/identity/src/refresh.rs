use base64::{Engine, engine::general_purpose::URL_SAFE_NO_PAD};
use rand::RngCore;
use sha2::{Digest, Sha256};

/// Opaque refresh token. Only its SHA-256 hash is persisted, so a database
/// leak does not expose usable tokens.
pub fn generate() -> String {
    let mut bytes = [0_u8; 32];
    rand::rngs::OsRng.fill_bytes(&mut bytes);
    URL_SAFE_NO_PAD.encode(bytes)
}

pub fn hash(token: &str) -> String {
    hex::encode(Sha256::digest(token.as_bytes()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tokens_are_unique_and_hashable() {
        let first = generate();
        let second = generate();

        assert_ne!(first, second);
        assert!(first.len() >= 40);
        assert_eq!(hash(&first), hash(&first));
        assert_ne!(hash(&first), hash(&second));
    }
}
