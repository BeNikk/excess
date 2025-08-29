import express, { type Request, type Response } from "express";
import { client } from "../lib/pg";
const app = express();
import { createClient } from "redis";
import { randomUUIDv7 } from "bun";
const subscribers = createClient();
subscribers.connect();
console.log("subscriber connected");
app.use(express.json());

let buyPriceBTC:number;
let sellPriceBTC:number;
subscribers.subscribe("price", (data) => {
  const price = JSON.parse(data);
  buyPriceBTC = price.buy;
  sellPriceBTC = price.sell;
  OPEN_ORDERS.forEach((order:any) => {
    const loss = sellPriceBTC*(order.quantity) - (order.bought_price);
    if(loss>0.9*order.margin){
      closeOrder(order.orderId);
    }
  });
});
function closeOrder(orderId:string){
  //remove from open orders array
  let newArray = OPEN_ORDERS.filter((obj:any) => obj.orderId !== orderId);
  OPEN_ORDERS = newArray;
  console.log(OPEN_ORDERS);

}
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

const USERS_ARRAY = [{
  userId:1,
  balances:{
    usd:10000,
    locked:0
  }
}];
let OPEN_ORDERS:any = [];

app.post("/buy",(req:Request,res:Response)=>{
  const { userId, symbol, quantity, leverage, margin } = req.body;
  let user = USERS_ARRAY.find((u)=>u.userId == userId);
  if(!user){
    res.json({message:"User not found"});
    return;
  }
  const accountBalance = user.balances.usd;
  let priceOfSymbol = buyPriceBTC;
  const lockedPrice = margin;
  if(user.balances.usd<=margin){
    res.json({message:"Not enough balance"});
  }
  user.balances.locked += lockedPrice;
  user.balances.usd -= lockedPrice;

  const actualPriceOfAssetBought = margin*leverage;
  console.log("btcprice",priceOfSymbol);
  console.log("margin",margin);
  console.log("leverage",leverage);

  OPEN_ORDERS.push({
    orderId:randomUUIDv7(),
    userId,
    type:"buy",
    asset:symbol,
    locked:margin,
    leverage,
    quantity:margin*leverage/Number(priceOfSymbol),
    bought_price : actualPriceOfAssetBought

  })
  console.log(OPEN_ORDERS);
  return res.json({accountBalance: user.balances});

});
app.listen(3000, () => {
  console.log("Server running on port 3000");
});


