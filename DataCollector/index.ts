import * as dotenv from "dotenv";
import { BskyAgent } from '@atproto/api';
import { FeedViewPost } from "@atproto/api/dist/client/types/app/bsky/feed/defs";
import * as fs from "fs";
import * as readline from "readline";
import * as path from "path";

import { fileURLToPath } from "url";

// Simulate __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

const folders = ["Y", "N"];
folders.forEach((folder) => {
  const folderPath = path.join(__dirname, folder);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
  }
});

// Function to prompt user for input
const askUser = (question: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.toUpperCase()));
  });
};

// Main function to process items
const processItems = async (textItems : string[]) => {
  for (let i = 0; i < textItems.length; i++) {
    const text = textItems[i];
    console.log(`\nProcessing item ${i + 1}: "${text}"`);

    let userInput = "";
    while (userInput !== "Y" && userInput !== "N") {
      userInput = await askUser("Do you want to save this in folder 'Y' or 'N'? (Y/N): ");
      if (userInput !== "Y" && userInput !== "N") {
        console.log("Invalid input. Please enter 'Y' or 'N'.");
      }
    }

    // Define file path and write file
    const folderPath = path.join(__dirname, userInput);
    const fileName = `item_${i + 1}.txt`;
    const filePath = path.join(folderPath, fileName);

    fs.writeFileSync(filePath, text);
    console.log(`File saved to: ${filePath}`);
  }

  console.log("\nAll items processed!");
  rl.close();
};

dotenv.config();

const agent = new BskyAgent({
    service: 'https://bsky.social',
});

await agent.login({ identifier: process.env.BLUESKY_USERNAME!, password: process.env.BLUESKY_PASSWORD!});

let nextPage : string | undefined = "";

let postsArray: string[] = [];

let postsToDownload = 2000;

while(postsToDownload > 0){
    const { data } = await agent.app.bsky.feed.getFeed(
        {
          feed: "at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot",
          limit: 100,
          cursor: nextPage,
        },
        {
          headers: {
            "Accept-Language": "pl,en",
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

await processItems(postsArray);

