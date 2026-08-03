// @generated automatically by Diesel CLI.

diesel::table! {
    secrets (id) {
        #[max_length = 36]
        id -> Varchar,
        encrypted_content -> Mediumblob,
        #[max_length = 32]
        nonce -> Varchar,
        #[max_length = 128]
        passphrase_hash -> Nullable<Varchar>,
        expires_at -> Datetime,
        created_at -> Datetime,
        view_count -> Integer,
        max_views -> Integer,
        is_burned -> Bool,
        burn_after_reading -> Bool,
    }
}
