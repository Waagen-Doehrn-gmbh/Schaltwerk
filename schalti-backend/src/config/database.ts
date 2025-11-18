import { Pool, PoolConfig } from "pg";
import { config } from "./env";

const poolConfig: PoolConfig = {
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Wenn DATABASE_URL vorhanden ist, verwende diese
if (config.database.url) {
  poolConfig.connectionString = config.database.url;
}

export const pool = new Pool(poolConfig);

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

// Test Connection
pool.query("SELECT NOW()", (err, _res) => {
  if (err) {
    console.error("Database connection error:", err);
  } else {
    console.log("Database connected successfully");
  }
});

