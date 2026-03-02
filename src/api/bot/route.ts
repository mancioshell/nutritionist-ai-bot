import "dotenv/config";

import { approveAll, CopilotClient, defineTool } from "@github/copilot-sdk";

// const client = new CopilotClient();
// const clientSession = await client.createSession({
//   onPermissionRequest: approveAll,
//   model: "gpt-4.1",
// });

// const response = await clientSession.sendAndWait({ prompt: "What is 2 + 2?" });
// console.log(response?.data.content);

// await client.stop();
// process.exit(0);

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { Bot, Context, session, SessionFlavor, webhookCallback } from "grammy";
import { Redis } from "@upstash/redis";
import { RedisAdapter } from "@grammyjs/storage-redis";
import { handler } from "@/lib";

interface SessionData {
  messages: string[];
}

type BotContext = Context & SessionFlavor<SessionData>;

const redis = Redis.fromEnv({
  automaticDeserialization: false,
});

const client = new CopilotClient({
  logLevel: "debug",
});

const storage = new RedisAdapter({ instance: redis });

const token = process.env.TELEGRAM_BOT_TOKEN;
const env = process.env.ENV || "PROD";

console.log("Starting bot with environment:", env);
console.log("Using Telegram Bot Token:", token ? "Provided" : "Not Provided");

if (!token)
  throw new Error("TELEGRAM_BOT_TOKEN environment variable not found.");

const bot = new Bot<BotContext>(token);
bot.use(session({ storage }));

bot.catch((err) => {
  console.error("Error in bot:", err);
});

bot.on("message:text", async (ctx) => {
  console.log("Received message:", ctx.message.text);
  const response = await handler(
    client,
    ctx.message.text,
    ctx.chat.id.toString(),
  );
  await ctx.reply(response);
});

if (env === "LOCAL") {
  console.log("Running in local mode.");
  bot.start();
}

export const POST =
  env === "LOCAL" ? undefined : webhookCallback(bot, "std/http");
