import express, { type Request, type Response } from "express";
import { client } from "../lib/pg";
const app = express();

app.use(express.json());
client
  .connect()
  .then(() => console.log("Connected to TimescaleDB"))
  .catch((err) => console.error("DB connection error:", err));

app.get("/candles", async (req: Request, res: Response) => {
  const { time, symbol } = req.query;

  let viewName = "";
  if (time === "1m") viewName = "candles1m";
  else if (time === "5m") viewName = "candles5m";
  else if (time === "1h") viewName = "candles1h";
  else return res.status(400).json({ error: "Invalid time parameter" });

  try {
    let query = `SELECT * FROM ${viewName}`;
    const params: any[] = [];

    if (symbol) {
      query += " WHERE symbol = $1";
      params.push(symbol);
    }

    query += " ORDER BY bucket DESC";

    const result = await client.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching candles:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
