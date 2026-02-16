import { CopilotClient, defineTool } from "@github/copilot-sdk";
import * as readline from "readline";
import {
  getVideoInformationListByChannelAndTopic,
  getVideoTranscriptByVideoId,
} from "./tools.js";

import { z } from "zod";

const CHANNEL_ID = process.env.CHANNEL_ID;

const GetVideoInformationListByChannelAndTopicSchema = z.object({
  channelId: z
    .string()
    .describe("The ID of the YouTube channel to fetch videos from."),
  topic: z.string().describe("The topic to search for in the YouTube channel."),
});

const getVideoInformationListByChannelAndTopicTool = defineTool<
  typeof GetVideoInformationListByChannelAndTopicSchema
>("get_video_information_list_by_channel_and_topic", {
  description: `
      Fetches video information from a specific YouTube channel based on a given topic.
      The tool takes a channel ID and a topic as input, and returns a list of video information objects that are relevant to the topic from the specified channel.
      Each video information object includes the video ID, title, description, published date, and thumbnails.
      `,
  parameters: z.toJSONSchema(GetVideoInformationListByChannelAndTopicSchema),

  handler: async (args) => {
    const parsed = GetVideoInformationListByChannelAndTopicSchema.parse(args);
    return getVideoInformationListByChannelAndTopic(parsed);
  },
});

const GetVideoTranscriptByVideoIdSchema = z.object({
  videoId: z
    .string()
    .describe("The ID of the YouTube video to fetch the transcript for."),
});

const getVideoTranscriptByVideoIdTool = defineTool<
  typeof GetVideoTranscriptByVideoIdSchema
>("get_video_transcript_by_video_id", {
  description: `
      Fetches the transcript of a YouTube video based on its video ID.
      The tool takes a video ID as input and returns the transcript of the specified YouTube video.
      The transcript is returned as a string, which may include timestamps and speaker labels if available.
      `,
  parameters: z.toJSONSchema(GetVideoTranscriptByVideoIdSchema),

  handler: async (args) => {
    const parsed = GetVideoTranscriptByVideoIdSchema.parse(args);
    return getVideoTranscriptByVideoId(parsed);
  },
});

const client = new CopilotClient({
  logLevel: "debug",
});

const session = await client.createSession({
  model: "claude-opus-4.5",
  streaming: true,
  systemMessage: {
    content: `
      You are a helpful assistant expert in Nutrition.
            In particular, your source of truth is a YouTube channel of a famous biologist and nutritionist.
            The YouTube channel id you should search into is ${CHANNEL_ID}.

            Your goal is to:

            1)  Take user questions, extract the topic, and search into the channel for relevant videos about that topic.
                Topic should be a phrase of 2-3 words, for example "vitamin C", "omega 3", "intermittent fasting", etc.

            2)  Based on the videos you found, choose only the most relevant videos (maximum 5) based on their relevance to the topic and fetch their transcripts.

            3)  Analyze the transcript to extract key information and insights related to the user's question.           

            You can use the get_video_information_list_by_channel_and_topic tool to fetch video information.
            You can use the get_video_transcript_by_video_id tool to fetch the transcript of a video based on its ID.

            ALWAYS use the tools when you need to fetch information from the channel, NEVER make up information by yourself.

            ALWAYS be as concise as possible in your answers, providing only the most relevant information to answer the user's question.
            DON'T disclose the name of the channel or the fact that you are fetching information from it, just provide the answer to the user's question based on the information you find in the videos.
      `,
  },

  tools: [
    getVideoInformationListByChannelAndTopicTool,
    getVideoTranscriptByVideoIdTool,
  ],
});

session.on("assistant.message_delta", (event) => {
  process.stdout.write(event.data.deltaContent);
});

// const response = await session.sendAndWait({
//   prompt: "Qual'è la dose giornaliera di Vitamina C consigliata per un adulto?",
// });

// const response = await session.sendAndWait({
//   prompt: "Qual'è la dose giornaliera di Vitamina D consigliata per un adulto?",
// });

// console.log(response?.data.content);

// await client.stop();
// process.exit(0);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const prompt = () => {
  rl.question("You: ", async (input) => {
    if (input.toLowerCase() === "exit") {
      await client.stop();
      rl.close();
      return;
    }

    process.stdout.write("Assistant: ");
    await session.sendAndWait({ prompt: input });
    console.log("\n");
    prompt();
  });
};

prompt();
