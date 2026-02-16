export const dynamic = "force-dynamic";

export const fetchCache = "force-no-store";

import { Bot, webhookCallback } from "grammy";
import "dotenv/config";

const token = process.env.TELEGRAM_BOT_TOKEN;
const env = process.env.ENV || "PROD";

console.log("Starting bot with environment:", env);
console.log("Using Telegram Bot Token:", token ? "Provided" : "Not Provided");

if (!token)
  throw new Error("TELEGRAM_BOT_TOKEN environment variable not found.");

const bot = new Bot(token);

bot.on("message:text", async (ctx) => {
  console.log("Received message:", ctx.message.text);
  await ctx.reply(ctx.message.text);
});

if (env === "LOCAL") {
  console.log("Running in local mode.");
  bot.start();
}

export const POST =
  env === "LOCAL" ? undefined : webhookCallback(bot, "std/http");
