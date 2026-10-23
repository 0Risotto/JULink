//! Versioned event contracts shared by every service.
//!
//! Subjects are additive: bump the `.vN` suffix when a payload changes in a
//! breaking way and let consumers migrate at their own pace.

pub mod dto;
pub mod events;

pub use dto::{MediaView, Page, PostView, UserSummary};
pub use events::{
    EventEnvelope, SUBJECT_USER_CREATED, SUBJECT_USER_DELETED, SUBJECT_USER_UPDATED, UserChanged,
};
