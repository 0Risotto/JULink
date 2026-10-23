//! Shared building blocks for every JULink service.
//!
//! Services are deliberately thin: they own their routes and data, while this
//! crate provides configuration, errors, tracing, health checks, metrics and
//! the HTTP server bootstrap.

pub mod auth;
pub mod config;
pub mod db;
pub mod error;
pub mod health;
pub mod http;
pub mod metrics;
pub mod pagination;
pub mod service;
pub mod shutdown;
pub mod telemetry;

pub use error::{AppError, AppResult};
