//! Test scaffolding shared across service crates.
//!
//! Phase 1 adds Testcontainers-backed Postgres/Neo4j/NATS fixtures and a
//! `TestApp` helper that drives routers without binding a port.

pub fn init_tracing() {
    let _ = tracing_subscriber::fmt()
        .with_env_filter("info")
        .with_test_writer()
        .try_init();
}
