import {ChildProcessWithoutNullStreams, spawn} from 'child_process'
import { readdir, unlink } from 'fs/promises'
import { join } from 'path'

const VIDEOS_DIR = '/home/agvideo/Videos'
const INPUT = 'rtmp://10.0.0.2/live'

let child: ChildProcessWithoutNullStreams

process.on('SIGINT', () => {
  console.log('Received SIGINT')
  child.kill('SIGINT')
})

process.on('SIGTERM', () => {
  console.log('Received SIGTERM')
  child.kill('SIGTERM')
})

function startRecording(loop = true) {
  const fn = `${getDateStr(new Date())}.mp4`

  child = spawn('sh', ['-c', `ffmpeg -i "${INPUT}" -c:v copy -t 00:15:00 -vcodec libx264 "${join(VIDEOS_DIR, fn)}"`])

  child.stdout.on('data', b => console.log(b.toString()))
  child.stderr.on('data', b => console.error(b.toString()))

  child.on('error', err => {
    console.log(err)
  })

  child.on('spawn', () => {
    console.log(`Starting ${fn}`)
  })

  child.on('exit', (code, signal) => {
    console.log(`Child process exited with code ${code} and signal ${signal}`)

    readdir(VIDEOS_DIR).then(files => {
      // delete files older than 24 hours, knowing that files are named with ISO date
      const maxDiff = 1000 * 60 * 60 * 24
      const now = new Date()

      files.filter(f => f.endsWith('.mp4')).forEach(file => {
        const fileDate = parseDate(file.replace('.mp4', ''))
        const diff = Number(now) - Number(fileDate)

        new Date().toLocaleDateString('it-IT')
        if (diff > maxDiff) {
          console.log(`Deleting ${file}`)
          unlink(join(VIDEOS_DIR, file))
        }
      })
    })

    if (loop)
      startRecording()
  })
}

/** Transforms a date into an OS acceptable string */
function getDateStr(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`
}

/** Transforms an OS-acceptable date string to an actual Date */
function parseDate(dateStr: string) {
  const [year, month, day, hour, minute, second] = dateStr.split('-').map(n => parseInt(n))
  return new Date(year, month, day, hour, minute, second)
}

startRecording()
