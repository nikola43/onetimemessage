# OneTimeMessage

A high-performance, production-ready, self-destructing message service with **military-grade AES-256-GCM encryption**.

## Features

- **Military-Grade Encryption**: AES-256-GCM authenticated encryption (same standard used by governments)
- **Self-Destructing Messages**: Secrets automatically destroyed after viewing
- **Passphrase Protection**: Optional PBKDF2-HMAC-SHA256 passphrase (100k iterations)
- **Rate Limiting**: Built-in brute-force protection
- **High Performance**: Built on may_minihttp (#1 in TechEmpower benchmarks)
- **OpenAPI Documentation**: Full Swagger UI and OpenAPI 3.1 spec
- **Modern UI**: Professional Next.js frontend with responsive design
- **Production Ready**: Comprehensive logging, health checks, and security headers

## Tech Stack

### Backend
- **Rust 1.86+** - Memory-safe, high-performance
- **may_minihttp** - Fastest web framework (TechEmpower Round 23)
- **Diesel ORM** - Type-safe database queries
- **MySQL 8.0** - Reliable relational database
- **ring** - Military-grade cryptography (AES-256-GCM, PBKDF2)

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS v4** - Modern utility-first styling

## Quick Start

### Using Docker Compose (Recommended)

1. Clone and setup:
```bash
cd onetimemessage
cp .env.example .env
```

2. Generate encryption key:
```bash
openssl rand -hex 32
```

3. Update `.env`:
```env
MYSQL_ROOT_PASSWORD=your-secure-root-password
MYSQL_PASSWORD=your-secure-db-password
ENCRYPTION_KEY=your-64-character-hex-key
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8080
```

4. Start all services:
```bash
docker compose up -d
```

5. Access:
   - **Frontend**: http://localhost:3000
   - **API**: http://localhost:8080
   - **Swagger UI**: http://localhost:8080/docs
   - **Health Check**: http://localhost:8080/health

## API Documentation

Full interactive documentation available at http://localhost:8080/docs

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check with DB status |
| GET | `/docs` | Swagger UI |
| GET | `/api/docs` | OpenAPI 3.1 spec (JSON) |
| GET | `/api/stats` | Server statistics |
| POST | `/api/secrets` | Create a new secret |
| GET | `/api/secrets/{id}/metadata` | Get secret metadata |
| POST | `/api/secrets/{id}` | View/reveal a secret |
| DELETE | `/api/secrets/{id}` | Burn a secret |

### Create Secret

```bash
curl -X POST http://localhost:8080/api/secrets \
  -H "Content-Type: application/json" \
  -d '{
    "content": "My secret message",
    "passphrase": "optional-password",
    "ttl_seconds": 86400
  }'
```

Response:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "expires_at": "2024-01-15T12:00:00Z",
  "share_url": "http://localhost:3000/secret/550e8400-e29b-41d4-a716-446655440000"
}
```

### View Secret

```bash
curl -X POST http://localhost:8080/api/secrets/{id} \
  -H "Content-Type: application/json" \
  -d '{"passphrase": "optional-password"}'
```

## Security

### Encryption
| Property | Value |
|----------|-------|
| Algorithm | AES-256-GCM |
| Key Size | 256 bits |
| Nonce | 96 bits (random per encryption) |
| Authentication | Built-in (GCM mode) |

### Passphrase Hashing
| Property | Value |
|----------|-------|
| Algorithm | PBKDF2-HMAC-SHA256 |
| Iterations | 100,000 |
| Salt | 128 bits (random) |
| Output | 256 bits |

### Rate Limiting
| Endpoint | Limit |
|----------|-------|
| General | 100/min per IP |
| Create Secret | 20/min per IP |
| View Secret | 10/min per IP per secret |

### Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Content-Security-Policy: default-src 'none'`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Cache-Control: no-store, no-cache, must-revalidate, private`

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | MySQL connection string | Required |
| `ENCRYPTION_KEY` | 64-char hex key (256 bits) | Required |
| `SERVER_HOST` | Server bind address | `0.0.0.0` |
| `SERVER_PORT` | Server port | `8080` |
| `FRONTEND_URL` | Frontend URL for share links | `http://localhost:3000` |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | `*` |
| `NEXT_PUBLIC_API_URL` | API URL for frontend | `http://localhost:8080` |

## Development

### Backend
```bash
cd backend
cargo install diesel_cli --no-default-features --features mysql
diesel migration run
cargo run
```

### Frontend
```bash
cd frontend
pnpm install
pnpm dev
```

## Production Deployment

### Security Checklist
- [ ] Generate strong encryption key (store securely)
- [ ] Configure HTTPS (nginx/traefik reverse proxy)
- [ ] Set `ALLOWED_ORIGINS` to your domain
- [ ] Use strong MySQL passwords
- [ ] Enable MySQL SSL connections
- [ ] Configure firewall rules
- [ ] Set up monitoring and alerting
- [ ] Configure log aggregation

### Recommended Architecture
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Nginx/    │     │   Backend   │     │   MySQL     │
│   Traefik   │────▶│   (Rust)    │────▶│   8.0       │
│   (HTTPS)   │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
       │
       ▼
┌─────────────┐
│  Frontend   │
│  (Next.js)  │
└─────────────┘
```

## Performance

Using may_minihttp, the backend achieves exceptional performance:
- **1,327,378 requests/second** in TechEmpower benchmarks
- Coroutine-based concurrency
- Zero-copy HTTP parsing
- Minimal memory footprint

## License

MIT License

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and test
4. Submit a pull request
