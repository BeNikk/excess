// fetching from binance stream and publishing it to websocket server.
import { createClient } from "redis";
import { Client } from "pg";
async function main() {
  try {
    const client = new Client({
      host: "localhost",
      port: 5433,
      user: "postgres",
      password: "password",
      database: "postgres",
    });
    await client.connect();
    console.log("Connected to TimescaleDB!");
    const publisher = createClient();
    publisher.connect();
    publisher.on("error", () => {
      console.log("Connection error from Redis in polling");
    });

    const binanceStream = new WebSocket(
      "wss://stream.binance.com:9443/stream?streams=btcusdt@trade/solusdt@trade/ethusdt@trade"
    );
    binanceStream.onopen = () => {
      console.log("Connected to binance stream");
    };
    binanceStream.onmessage = async (data) => {
      const dataReceived = JSON.parse(data.data).data;
      console.log(dataReceived);
      const buy = dataReceived.p + 0.05 * dataReceived.p;
      const sell = dataReceived.p - 0.05 * dataReceived.p;
      const symbol = dataReceived.s;
      const time = dataReceived.T;
      const volume = dataReceived.q;
      const price = dataReceived.p;
      publisher.publish("price", JSON.stringify({ buy, sell, symbol, time }));
      try {
        await client.query(
          "INSERT INTO ticks(time, symbol, price, volume) VALUES (to_timestamp($1 / 1000.0), $2, $3, $4)",
          [time, symbol, price, volume]
        );
        console.log("Data inserted");
      } catch (err) {
        console.error("Error inserting tick into DB:", err);
      }
    };

    binanceStream.onclose = () => {
      console.log("Binance stream connection closed");
    };
  } catch (error) {
    console.log("Error in Price poller", error);
  }
}

main();
