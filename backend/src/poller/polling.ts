// fetching from binance stream and publishing it to websocket server.
import { createClient } from 'redis';

function main() {
  try {
    const publisher = createClient();
    publisher.connect();
    publisher.on("error",()=>{
        console.log("Connection error from Redis in polling");
    })

    const binanceStream = new WebSocket(
      "wss://stream.binance.com:9443/stream?streams=btcusdt@trade"
    );
    binanceStream.onopen = () => {
      console.log("Connected to binance stream");
    };
    binanceStream.onmessage = (data) => {
        const dataReceived = JSON.parse(data.data).data;
        console.log(dataReceived);
        const buy = dataReceived.p + 0.05*dataReceived.p;
        const sell = dataReceived.p - 0.05*dataReceived.p; 
        const symbol = dataReceived.s;
        const time  = dataReceived.T;
        publisher.publish("price",JSON.stringify({buy,sell,symbol,time}));
    }
    binanceStream.onclose = () =>{
        console.log("Binance stream connection closed");
    }
  } catch (error) {
    console.log("Error in Price poller", error);
  }
}

main();

