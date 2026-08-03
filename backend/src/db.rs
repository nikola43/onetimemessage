use diesel::mysql::MysqlConnection;
use diesel::r2d2::{self, ConnectionManager};
use std::env;

pub type DbPool = r2d2::Pool<ConnectionManager<MysqlConnection>>;

pub fn establish_connection_pool() -> DbPool {
    let database_url = env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");

    let manager = ConnectionManager::<MysqlConnection>::new(database_url);

    r2d2::Pool::builder()
        .max_size(15)
        .min_idle(Some(5))
        .build(manager)
        .expect("Failed to create database pool")
}

pub fn get_connection(pool: &DbPool) -> r2d2::PooledConnection<ConnectionManager<MysqlConnection>> {
    pool.get().expect("Failed to get database connection from pool")
}
