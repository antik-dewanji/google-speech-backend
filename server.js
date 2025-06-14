// server.js - Node.js backend for Google Speech-to-Text (Hybrid Ready)

const express = require('express');
const fs = require('fs');
const cors = require('cors');
const speech = require('@google-cloud/speech');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = 5000;

// Enable CORS for frontend requests
app.use(cors());

// Multer setup for audio uploads
const upload = multer({ dest: 'uploads/' });

// Google Cloud Speech client initialization
const client = new speech.SpeechClient({
  keyFilename: 'google-credentials.json' // Make sure this JSON exists and is valid
});

// Health Check
app.get('/', (req, res) => {
  res.send('🎧 Google Speech API Backend Running');
});

// Transcription route
app.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    const filename = req.file.path;
    const file = fs.readFileSync(filename);
    const audioBytes = file.toString('base64');

    const audio = { content: audioBytes };

    // Get language from query or fallback to English
    const languageCode = req.query.lang || 'en-US';

    const config = {
      encoding: 'LINEAR16',
      sampleRateHertz: 16000,
      languageCode,
    };

    const request = {
      audio: audio,
      config: config,
    };

    const [response] = await client.recognize(request);
    const transcription = response.results
      .map(result => result.alternatives[0].transcript)
      .join('\n');

    fs.unlinkSync(filename); // Remove temporary file
    res.json({ transcript: transcription });
  } catch (err) {
    console.error('Transcription error:', err);
    res.status(500).json({ error: 'Failed to transcribe audio.' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Google Speech Backend listening at http://localhost:${PORT}`);
});
