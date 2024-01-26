import { Telegraf } from "telegraf";

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

export function uploadVideo(fn: string, caption: string) {
  bot.telegram.sendVideo(
    process.env.TELEGRAM_CHAT_ID,
    {
      source: fn,
    },
    {
      caption,
    }
  );
}

bot.launch();

process.once("SIGINT", () => {
  bot.stop("SIGINT");
  process.exit(0);
});
process.once("SIGTERM", () => {
  bot.stop("SIGTERM");
  process.exit(0);
});
