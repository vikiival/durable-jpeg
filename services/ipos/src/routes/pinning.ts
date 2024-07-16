import { Hono } from 'hono'
import { HonoEnv } from '../utils/constants'
import { vValidator } from '@hono/valibot-validator'
import { blob, object, union, array } from 'valibot'
import {
  getUint8ArrayFromFile,
  getObjectSize,
  getDirectoryCID,
} from '../utils/format'
import { getS3 } from '../utils/s3'
import Hash from 'ipfs-only-hash'

const app = new Hono<HonoEnv>()

app.post('/pinJson', vValidator('json', object({})), async (c) => {
  const body = await c.req.json()
  const type = 'application/json'
  const s3 = getS3(c)

  const content = JSON.stringify(body)
  const cid = await Hash.of(content)

  await s3.putObject({
    Body: content,
    Bucket: c.env.FILEBASE_BUCKET_NAME,
    Key: cid,
    ContentType: type,
  })

  await c.env.BUCKET.put(cid, new Blob([content], { type }))

  return c.json(
    getPinResponse({
      cid: cid,
      type: type,
      size: getObjectSize(body),
    }),
  )
})

const fileRequiredMessage = 'File is required'
const fileKey = 'file'

type PinFIle = { [fileKey]: File } | { [fileKey]: File[] }

const pinFileRequestSchema = object({
  [fileKey]: union([
    blob(fileRequiredMessage),
    array(blob(fileRequiredMessage)),
  ]),
})

app.post('/pinFile', vValidator('form', pinFileRequestSchema), async (c) => {
  const body = (await c.req.parseBody({ all: true })) as PinFIle

  const files = await Promise.all(
    ([[body[fileKey]]].flat(2).filter(Boolean) as File[]).map(async (file) => ({
      file,
      content: await getUint8ArrayFromFile(file),
    })),
  )

  const hasMultipleFiles = files.length > 1
  const s3 = getS3(c)

  let directoryCId: string | undefined

  if (hasMultipleFiles) {
    directoryCId = await getDirectoryCID({ files, c })
  }

  const addedFiles: { file: File; cid: any }[] = await Promise.all(
    files.map(async ({ file, content }) => {
      try {
        const cid = await Hash.of(content)
        const prefix = directoryCId ? `${directoryCId}/` : ''

        await s3.putObject({
          Body: content,
          Bucket: c.env.FILEBASE_BUCKET_NAME,
          Key: `${prefix}${cid}`,
          ContentType: file.type,
        })

        console.log('File added', cid)
        return { file, cid }
      } catch (error) {
        throw new Error(`Failed to add file ${file.name}: ${error?.message}`)
      }
    }),
  )

  const { cid: addedFileCid, file } = addedFiles[0]
  let cid = addedFileCid
  let type = file.type

  if (hasMultipleFiles) {
    cid = directoryCId
    type = 'directory'
  }

  return c.json(
    getPinResponse({
      cid: cid.toString(),
      type: type,
      size: Number('0'),
    }),
  )
})

const getPinResponse = (value: {
  cid: string
  type: string
  size: number
}) => ({
  ok: true,
  value,
})

export { app as pinning }