const express = require('express')
const qrcode = require('qrcode')
const cors = require('cors')
const { Storage } = require('@google-cloud/storage')

const app = express()

app.use(cors())

const CLOUD_BUCKET = process.env.CLOUD_BUCKET
const storage = new Storage()

app.post('/', async (req, res) => {
  const gcsBucket = storage.bucket('watershed-qrcodes')
  const gcsFileName = Date.now() + '-qr.png'
  const gcsFile = gcsBucket.file(gcsFileName)

  const message = req.query.message

  if (!message) {
    res.status(400).json({ data: { error: 'Please enter a message' } })
  }

  const stream = gcsFile.createWriteStream({
    metadata: {
      contentType: 'image/png',
    },
  })

  stream.on('error', err => {
    return res.status(500).json({ data: { error: err.message } })
  })

  stream.on('finish', () => {
    gcsFile.makePublic().then(() => {
      const publicUrl = getPublicUrl(gcsFileName)
      res.status(201).json({ data: { url: publicUrl } })
    })
  })

  const dataUrl = await qrcode.toFileStream(stream, message)
})

function getPublicUrl(filename) {
  return `https://storage.googleapis.com/${CLOUD_BUCKET}/${filename}`
}

exports.generateqr = app
