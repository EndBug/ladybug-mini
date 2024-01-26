declare module "bun" {
  interface Env {
    INPUT: string;
    VIDEOS_DIR: string;
    TELEGRAM_TOKEN: string;
    TELEGRAM_CHAT_ID: string;
  }
}
