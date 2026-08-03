//! OpenAPI specification for the OneTimeMessage API

/// Returns the OpenAPI specification as a string
pub fn get_openapi_spec() -> String {
    serde_json::json!({
        "openapi": "3.1.0",
        "info": {
            "title": "OneTimeMessage API",
            "description": "A secure, self-destructing message API with military-grade AES-256-GCM encryption.",
            "version": "1.0.0",
            "license": {
                "name": "MIT",
                "url": "https://opensource.org/licenses/MIT"
            }
        },
        "servers": [
            {
                "url": "http://localhost:8080",
                "description": "Development server"
            }
        ],
        "tags": [
            { "name": "secrets", "description": "Secret management" },
            { "name": "health", "description": "Health check endpoints" }
        ],
        "paths": {
            "/health": {
                "get": {
                    "tags": ["health"],
                    "summary": "Health check",
                    "operationId": "healthCheck",
                    "responses": {
                        "200": {
                            "description": "Service is healthy",
                            "content": {
                                "application/json": {
                                    "schema": { "$ref": "#/components/schemas/HealthResponse" }
                                }
                            }
                        }
                    }
                }
            },
            "/api/secrets": {
                "post": {
                    "tags": ["secrets"],
                    "summary": "Create a new secret",
                    "operationId": "createSecret",
                    "requestBody": {
                        "required": true,
                        "content": {
                            "application/json": {
                                "schema": { "$ref": "#/components/schemas/CreateSecretRequest" }
                            }
                        }
                    },
                    "responses": {
                        "201": {
                            "description": "Secret created",
                            "content": {
                                "application/json": {
                                    "schema": { "$ref": "#/components/schemas/CreateSecretResponse" }
                                }
                            }
                        },
                        "400": { "description": "Invalid request" },
                        "429": { "description": "Rate limit exceeded" }
                    }
                }
            },
            "/api/secrets/{id}/metadata": {
                "get": {
                    "tags": ["secrets"],
                    "summary": "Get secret metadata",
                    "operationId": "getSecretMetadata",
                    "parameters": [{
                        "name": "id",
                        "in": "path",
                        "required": true,
                        "schema": { "type": "string", "format": "uuid" }
                    }],
                    "responses": {
                        "200": {
                            "description": "Metadata retrieved",
                            "content": {
                                "application/json": {
                                    "schema": { "$ref": "#/components/schemas/SecretMetadata" }
                                }
                            }
                        }
                    }
                }
            },
            "/api/secrets/{id}": {
                "post": {
                    "tags": ["secrets"],
                    "summary": "View a secret",
                    "operationId": "viewSecret",
                    "parameters": [{
                        "name": "id",
                        "in": "path",
                        "required": true,
                        "schema": { "type": "string", "format": "uuid" }
                    }],
                    "requestBody": {
                        "content": {
                            "application/json": {
                                "schema": { "$ref": "#/components/schemas/ViewSecretRequest" }
                            }
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "Secret retrieved",
                            "content": {
                                "application/json": {
                                    "schema": { "$ref": "#/components/schemas/ViewSecretResponse" }
                                }
                            }
                        },
                        "403": { "description": "Passphrase required or invalid" },
                        "404": { "description": "Secret not found" },
                        "410": { "description": "Secret has been destroyed" },
                        "429": { "description": "Rate limit exceeded" }
                    }
                },
                "delete": {
                    "tags": ["secrets"],
                    "summary": "Burn a secret",
                    "operationId": "burnSecret",
                    "parameters": [{
                        "name": "id",
                        "in": "path",
                        "required": true,
                        "schema": { "type": "string", "format": "uuid" }
                    }],
                    "responses": {
                        "200": { "description": "Secret burned" },
                        "404": { "description": "Secret not found" }
                    }
                }
            },
            "/api/stats": {
                "get": {
                    "tags": ["health"],
                    "summary": "Server statistics",
                    "operationId": "getStats",
                    "responses": {
                        "200": {
                            "description": "Statistics",
                            "content": {
                                "application/json": {
                                    "schema": { "$ref": "#/components/schemas/StatsResponse" }
                                }
                            }
                        }
                    }
                }
            }
        },
        "components": {
            "schemas": {
                "CreateSecretRequest": {
                    "type": "object",
                    "required": ["content"],
                    "properties": {
                        "content": { "type": "string", "description": "Secret content (max 1MB)" },
                        "passphrase": { "type": "string", "description": "Optional passphrase" },
                        "ttl_seconds": { "type": "integer", "description": "TTL in seconds (60-2592000)", "default": 604800 },
                        "max_views": { "type": "integer", "description": "Max views", "default": 1 },
                        "burn_after_reading": { "type": "boolean", "default": true }
                    }
                },
                "CreateSecretResponse": {
                    "type": "object",
                    "properties": {
                        "id": { "type": "string", "format": "uuid" },
                        "expires_at": { "type": "string", "format": "date-time" },
                        "share_url": { "type": "string", "format": "uri" }
                    }
                },
                "ViewSecretRequest": {
                    "type": "object",
                    "properties": {
                        "passphrase": { "type": "string" }
                    }
                },
                "ViewSecretResponse": {
                    "type": "object",
                    "properties": {
                        "content": { "type": "string" },
                        "is_burned": { "type": "boolean" },
                        "views_remaining": { "type": "integer" }
                    }
                },
                "SecretMetadata": {
                    "type": "object",
                    "properties": {
                        "exists": { "type": "boolean" },
                        "requires_passphrase": { "type": "boolean" },
                        "expires_at": { "type": "string", "format": "date-time", "nullable": true },
                        "is_burned": { "type": "boolean" }
                    }
                },
                "HealthResponse": {
                    "type": "object",
                    "properties": {
                        "status": { "type": "string", "enum": ["ok", "degraded", "error"] },
                        "version": { "type": "string" },
                        "uptime_seconds": { "type": "integer" },
                        "database": { "type": "string" }
                    }
                },
                "StatsResponse": {
                    "type": "object",
                    "properties": {
                        "version": { "type": "string" },
                        "uptime_seconds": { "type": "integer" },
                        "secrets_created": { "type": "integer" },
                        "secrets_viewed": { "type": "integer" },
                        "active_secrets": { "type": "integer" },
                        "encryption": { "type": "string" }
                    }
                },
                "ErrorResponse": {
                    "type": "object",
                    "properties": {
                        "error": { "type": "string" },
                        "code": { "type": "string" }
                    }
                }
            }
        }
    }).to_string()
}

/// HTML page for Swagger UI
pub const SWAGGER_UI_HTML: &str = r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OneTimeMessage API Documentation</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
    <style>
        body { margin: 0; padding: 0; background: #1a1a2e; }
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info .title { color: #6366f1; }
        .swagger-ui { background: #1a1a2e; }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
        window.onload = () => {
            window.ui = SwaggerUIBundle({
                url: '/api/docs',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIBundle.SwaggerUIStandalonePreset
                ],
                layout: "BaseLayout"
            });
        };
    </script>
</body>
</html>"#;
