declare namespace NodeJS {
    interface ProcessEnv {
      BLUESKY_USERNAME: string;
      BLUESKY_PASSWORD: string;
      BLUESKY_FEED: string;
      BLUESKY_ACCEPTLANGUAGE: string;
      OPENAI_API_KEY: string;
      OPENAI_CLASSIFICATION_MODEL: string;
      CLASSIFICATION_CATEGORY: string;
      POSTS_TO_DOWNLOAD: number;
    }
  }