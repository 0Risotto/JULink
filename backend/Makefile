.PHONY: check fmt clippy test build identity gateway compose-up compose-full compose-down

check:
	cargo check --workspace --locked

fmt:
	cargo fmt --all

clippy:
	cargo clippy --workspace --all-targets --locked -- -D warnings

test:
	cargo test --workspace --locked

build:
	cargo build --workspace --locked

identity:
	cargo run -p julink-identity

gateway:
	cargo run -p julink-gateway

compose-up:
	docker compose -f deploy/compose.yml up --build

compose-full:
	docker compose -f deploy/compose.yml --profile full up --build

compose-down:
	docker compose -f deploy/compose.yml down
