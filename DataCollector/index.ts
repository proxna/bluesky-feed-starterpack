import * as dotenv from "dotenv";
import { BskyAgent } from '@atproto/api';
import * as fs from "fs";
import * as path from "path";

import { fileURLToPath } from "url";
import { OpenAI } from "openai";

dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;
const openai = new OpenAI({ apiKey });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function classifyText(text: string): Promise<string> {
  const prompt = `Your task is to classify whether a given text is related to the topic of ${process.env.CLASSIFICATION_CATEGORY}.
                    The text can be written in either Polish or English, so make sure to analyze it regardless of the language. Here is the text for evaluation:
                    ${text}
                    Your response should be either Yes or No."\n\n""`;

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_CLASSIFICATION_MODEL,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 3,
    temperature: 0.0
  });

  const reply = response.choices[0]?.message?.content?.trim();
  return reply === "Yes" ? "Yes" : "No";
}

function delay(ms: number) {
  return new Promise( resolve => setTimeout(resolve, ms) );
}

function saveTextToFile(text: string, classification: string) {
  const folderName = path.join(__dirname, classification);
  
  if (!fs.existsSync(folderName)) {
    fs.mkdirSync(folderName);
  }

  const filePath = path.join(folderName, `text_${Date.now()}.txt`);
  fs.writeFileSync(filePath, text, "utf8");
  console.log(`Saved file: ${filePath}`);
}

async function processTexts(texts : string[]) {
  for (let i = 0; i < texts.length; i++) {
    await delay(500);
    console.clear();
    console.log("Processing texts: %d", i / texts.length);

    const text = texts[i];
    try {
      console.log(`Classification of text: "${text}"`);
      
      const classification = await classifyText(text);
      console.log(`Class: ${classification}`);
      
      saveTextToFile(text, classification);
    } catch (error) {
      console.error(`Processing error "${text}":`, error);
    }
  }
}

const agent = new BskyAgent({
    service: 'https://bsky.social',
});

await agent.login({ identifier: process.env.BLUESKY_USERNAME!, password: process.env.BLUESKY_PASSWORD!});

let nextPage : string | undefined = "";

let postsArray: string[] = [];

let feeds = process.env.BLUESKY_FEED.split(',');

console.log(feeds);

for (let i = 0; i < feeds.length; i++) {
  let postsToDownload = process.env.POSTS_TO_DOWNLOAD;

  while(postsToDownload > 0){
    const { data } = await agent.app.bsky.feed.getFeed(
        {
          feed: feeds[i],
          limit: 100,
          cursor: nextPage,
        },
        {
          headers: {
            "Accept-Language": process.env.BLUESKY_ACCEPTLANGUAGE,
          },
        },
      );
      data.feed.forEach(post => {
         const textObj : { text? : string } = post.post.record;
         if (textObj.text !== undefined)
            postsArray.push(textObj.text);   
        });
      postsToDownload-=100;
      nextPage = data.cursor;
  }
}

let uniquePosts = postsArray.filter((n, i) => postsArray.indexOf(n) === i);

processTexts(uniquePosts).then(() => {
  console.log("Process completed!");
}).catch((error) => {
  console.error("Error:", error);
});