import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { readdir, unlink } from "fs/promises";
import { join } from "path";
import { uploadVideo } from "./telegram";

const { INPUT, VIDEOS_DIR } = process.env;

let child: ChildProcessWithoutNullStreams;

process.on("SIGINT", () => {
  console.log("Received SIGINT");
  child.kill("SIGINT");
});

process.on("SIGTERM", () => {
  console.log("Received SIGTERM");
  child.kill("SIGTERM");
});

function startRecording(loop = true) {
  const fn = `${getDateStr(new Date())}.mp4`,
    fullFn = join(VIDEOS_DIR, fn);

  const clipMinutes = Number(process.env.CLIP_MINUTES) || 15;

  const [hh, mm, ss] = [
    Math.floor(clipMinutes / 60),
    Math.floor(clipMinutes % 60),
    (clipMinutes * 60) % 60,
  ].map((e) => e.toString().padStart(2, "0"));

  child = spawn("sh", [
    "-c",
    `ffmpeg -i "${INPUT}" -c:v copy -t ${hh}:${mm}:${ss} -vcodec libx264 "${fullFn}"`,
  ]);

  child.stdout.on("data", (b) => console.log(b.toString()));
  child.stderr.on("data", (b) => console.error(b.toString()));

  child.on("error", (err) => {
    console.log(err);
  });

  child.on("spawn", () => {
    console.log(`Starting ${fn}`);
  });

  child.on("exit", (code, signal) => {
    console.log(`Child process exited with code ${code} and signal ${signal}`);

    readdir(VIDEOS_DIR).then((files) => {
      // delete files older than 24 hours, knowing that files are named with ISO date
      const maxDiff = 1000 * 60 * 60 * 24;
      const now = new Date();

      files
        .filter((f) => f.endsWith(".mp4"))
        .forEach((file) => {
          const fileDate = parseDate(file.replace(".mp4", ""));
          const diff = Number(now) - Number(fileDate);

          new Date().toLocaleDateString("it-IT");
          if (diff > maxDiff) {
            console.log(`Deleting ${file}`);
            unlink(join(VIDEOS_DIR, file));
          }
        });
    });

    if (code === 0) uploadVideo(fullFn);

    if (loop && code === 0) startRecording();
  });
}

/** Transforms a date into an OS acceptable string */
function getDateStr(date: Date) {
  return [
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
  ]
    .map((e) => e.toString())
    .map((e) => (e.length === 1 ? `0${e}` : e))
    .join("-");
}

/** Transforms an OS-acceptable date string to an actual Date */
function parseDate(dateStr: string) {
  const [year, month, day, hour, minute, second] = dateStr
    .split("-")
    .map((n) => parseInt(n));
  return new Date(year, month - 1, day, hour, minute, second);
}

startRecording();
