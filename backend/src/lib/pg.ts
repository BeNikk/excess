import { Client } from "pg";

export const client = new Client({
  host: "localhost",
  port: 5433,
  user: "postgres",
  password: "password",
  database: "postgres",
});
