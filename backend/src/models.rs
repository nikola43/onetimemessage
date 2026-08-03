use chrono::NaiveDateTime;
use diesel::prelude::*;
use serde::{Deserialize, Serialize};

use crate::schema::secrets;

#[derive(Queryable, Selectable, Serialize, Debug)]
#[diesel(table_name = secrets)]
#[diesel(check_for_backend(diesel::mysql::Mysql))]
pub struct Secret {
    pub id: String,
    pub encrypted_content: Vec<u8>,
    pub nonce: String,
    pub passphrase_hash: Option<String>,
    pub expires_at: NaiveDateTime,
    pub created_at: NaiveDateTime,
    pub view_count: i32,
    pub max_views: i32,
    pub is_burned: bool,
    pub burn_after_reading: bool,
}

#[derive(Insertable)]
#[diesel(table_name = secrets)]
pub struct NewSecret {
    pub id: String,
    pub encrypted_content: Vec<u8>,
    pub nonce: String,
    pub passphrase_hash: Option<String>,
    pub expires_at: NaiveDateTime,
    pub max_views: i32,
    pub burn_after_reading: bool,
}

#[derive(Deserialize, Debug)]
pub struct CreateSecretRequest {
    pub content: String,
    pub passphrase: Option<String>,
    pub ttl_seconds: Option<i64>,
    pub max_views: Option<i32>,
    pub burn_after_reading: Option<bool>,
}

#[derive(Serialize, Debug)]
pub struct CreateSecretResponse {
    pub id: String,
    pub expires_at: String,
    pub share_url: String,
}

#[derive(Deserialize, Debug)]
pub struct ViewSecretRequest {
    pub passphrase: Option<String>,
}

#[derive(Serialize, Debug)]
pub struct ViewSecretResponse {
    pub content: String,
    pub is_burned: bool,
    pub views_remaining: i32,
}

#[derive(Serialize, Debug)]
pub struct SecretMetadata {
    pub exists: bool,
    pub requires_passphrase: bool,
    pub expires_at: Option<String>,
    pub is_burned: bool,
}

#[derive(Serialize, Debug)]
pub struct ErrorResponse {
    pub error: String,
    pub code: String,
}
