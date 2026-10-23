use std::collections::BTreeSet;

/// Extract `#hashtags` from post text. Tags are lowercased, deduplicated and
/// limited to 50 characters.
pub fn extract(body: &str) -> Vec<String> {
    let mut tags = BTreeSet::new();

    for word in body.split_whitespace() {
        let candidate = word.trim_matches(|character: char| {
            !(character.is_alphanumeric() || character == '_' || character == '#')
        });

        let Some(tag) = candidate.strip_prefix('#') else {
            continue;
        };

        if tag.is_empty()
            || tag.chars().count() > 50
            || !tag
                .chars()
                .all(|character| character.is_alphanumeric() || character == '_')
        {
            continue;
        }

        tags.insert(tag.to_lowercase());
    }

    tags.into_iter().collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn extracts_deduplicates_and_lowercases() {
        assert_eq!(
            extract("Hello #Rust world, #rust and #JULink!"),
            vec!["julink".to_string(), "rust".to_string()]
        );
    }

    #[test]
    fn ignores_invalid_tags() {
        assert!(extract("# heading").is_empty());
        assert!(extract("#has-dash").is_empty());
        assert!(extract("#").is_empty());
    }
}
