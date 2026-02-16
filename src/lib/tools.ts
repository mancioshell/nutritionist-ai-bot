import { google } from "googleapis";
import { fetchTranscript } from "youtube-transcript-plus";

export interface VideoInfo {
  videoId: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnails: any;
  transcript?: string;
}

const GOOGLE_API_KEY = process.env.YOUTUBE_API_KEY;

export const getVideoInformationListByChannelAndTopic = async (args: {
  channelId: string;
  topic: string;
}): Promise<VideoInfo[]> => {
  const { channelId, topic } = args;

  console.debug(
    `Fetching videos for channelId: ${channelId} and topic: ${topic}`,
  );

  const youtube = google.youtube({
    version: "v3",
    // auth: process.env.YOUTUBE_API_KEY,
    auth: GOOGLE_API_KEY,
  });

  let allVideos: VideoInfo[] = [];
  let nextPageToken: string | undefined = undefined;

  do {
    try {
      const searchResponse: any = await youtube.search.list({
        part: ["snippet"],
        channelId: channelId,
        q: topic,
        type: ["video"],
        maxResults: 50,
        pageToken: nextPageToken,
        order: "relevance",
      });

      let items = searchResponse.data.items || [];
      nextPageToken = searchResponse.data.nextPageToken || undefined;

      console.debug(
        `Fetched ${items.length} videos for topic "${topic}" on channel ${channelId}.` +
          ` Next page token: ${nextPageToken}`,
      );

      let videos = items
        .filter((video: any) => video.id?.videoId)
        .map((video: any) => {
          return {
            videoId: video.id.videoId,
            title: video.snippet?.title || "",
            description: video.snippet?.description || "",
            publishedAt: video.snippet?.publishedAt || "",
            thumbnails: video.snippet?.thumbnails,
          };
        });

      allVideos = allVideos.concat(videos);
    } catch (error) {
      console.error("Error trying to fetch videos:", error);
      break;
    }
  } while (nextPageToken);

  return allVideos;
};

export const getVideoTranscriptByVideoId = async (args: {
  videoId: string;
}): Promise<string> => {
  const { videoId } = args;

  console.debug(`Fetching transcript for videoId: ${videoId}`);
  try {
    const transcriptEntries = await fetchTranscript(videoId);
    const transcriptText = transcriptEntries
      .map((entry: any) => entry.text)
      .join(" ");
    console.debug(
      `Fetched transcript for video ${videoId}, length: ${transcriptText.length} characters.`,
    );
    return transcriptText;
  } catch (error) {
    console.error(`Error fetching transcript for video ${videoId}:`, error);
    return "";
  }
};
