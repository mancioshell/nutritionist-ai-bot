import ngrok from "@ngrok/ngrok";

import "dotenv/config";
import { Bot } from "grammy";

async function startDev() {
  console.log(process.env.NGROK_AUTH_TOKEN);
  await ngrok.authtoken(process.env.NGROK_AUTH_TOKEN!);
  const listener = await ngrok.forward({
    proto: "http",
    addr: 3000,
    domain: process.env.NGROK_DOMAIN,
  });

  const url = listener.url();
  console.log(`Server is publicly accessible at ${url}`);

  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token)
    throw new Error("TELEGRAM_BOT_TOKEN environment variable not found.");

  const bot = new Bot(token);
  await bot.api.setWebhook(`${url}/api/bot`);

  process.stdin.resume();
}

startDev();
