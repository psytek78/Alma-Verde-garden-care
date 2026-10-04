declare global {
  interface CloudflareEnv {
    DB: D1Database;
    PHOTOS: R2Bucket;
  }
}

export {};
