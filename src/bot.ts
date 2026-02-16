import "dotenv/config";

import { fastify } from "fastify";
import { CopilotClient } from "@github/copilot-sdk";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { Bot, Context, SessionFlavor, webhookCallback } from "grammy";
import { handleSession, resetSession } from "./lib/index.js";

interface SessionData {}

type BotContext = Context & SessionFlavor<SessionData>;

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token)
  throw new Error("TELEGRAM_BOT_TOKEN environment variable not found.");

const bot = new Bot<BotContext>(token);

const client = new CopilotClient({
  logLevel: "debug",
});

bot.catch((err) => {
  console.error("Error in bot:", err);
});

bot.command("reset", async (ctx) => {
  await resetSession(client, ctx.chat.id.toString());
  await ctx.reply("Session reset. You can start a new conversation now.");
});

bot.on("message:text", async (ctx) => {
  await bot.api.sendChatAction(ctx.chat.id, "typing");

  const interval = setInterval(async () => {
    await bot.api.sendChatAction(ctx.chat.id, "typing");
  }, 5000);

  console.debug("Received message:", ctx.message.text);
  const response = await handleSession(
    client,
    ctx.message.text,
    ctx.chat.id.toString(),
  );

  clearInterval(interval);

  await ctx.reply(response);
});

const server = fastify();

server.post(
  `/api/bot`,
  webhookCallback(bot, "fastify", {
    timeoutMilliseconds: 300_000, // 5 minutes
  }),
);

await server.listen({ port: 3000, host: "0.0.0.0" });
