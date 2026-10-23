# syntax=docker/dockerfile:1

FROM rust:1.99-slim AS chef
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*
RUN cargo install cargo-chef --locked
WORKDIR /app

FROM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS builder
COPY --from=planner /app/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json
COPY . .
ARG SERVICE
RUN test -n "$SERVICE" && cargo build --release --locked --bin "$SERVICE"

FROM debian:bookworm-slim AS runtime
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --system --uid 10001 --no-create-home julink

ARG SERVICE
COPY --from=builder "/app/target/release/${SERVICE}" /usr/local/bin/service

USER 10001
ENTRYPOINT ["/usr/local/bin/service"]
