use serde::Deserialize;

fn default_limit() -> u32 {
    20
}

/// Keyset pagination input. `cursor` is opaque to clients and should encode
/// `(created_at, id)` once the read paths are implemented.
#[derive(Debug, Clone, Deserialize)]
pub struct PageQuery {
    pub cursor: Option<String>,
    #[serde(default = "default_limit")]
    pub limit: u32,
}

impl PageQuery {
    pub fn limit(&self) -> u32 {
        self.limit.clamp(1, 100)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn clamps_limit() {
        assert_eq!(
            PageQuery {
                cursor: None,
                limit: 0
            }
            .limit(),
            1
        );
        assert_eq!(
            PageQuery {
                cursor: None,
                limit: 500
            }
            .limit(),
            100
        );
        assert_eq!(
            PageQuery {
                cursor: None,
                limit: 25
            }
            .limit(),
            25
        );
    }
}
