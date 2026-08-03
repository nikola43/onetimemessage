# Build stage
FROM rust:1.86-slim-bookworm AS builder

WORKDIR /app

# Install dependencies for MySQL
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    default-libmysqlclient-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy manifests
COPY Cargo.toml ./

# Create dummy main.rs to build dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs

# Build dependencies
RUN cargo build --release
RUN rm src/main.rs

# Copy source
COPY src ./src

# Run tests
RUN touch src/main.rs && cargo test --release

# Build application
RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    default-mysql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy binary from builder
COPY --from=builder /app/target/release/onetimemessage-backend /app/onetimemessage-backend

# Expose port
EXPOSE 8080

# Run the binary
CMD ["/app/onetimemessage-backend"]
