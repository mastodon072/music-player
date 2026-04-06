/**
 * Generates simple sine-wave WAV files for simulator testing.
 * Run once with: node scripts/generate-test-audio.js
 */

const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;
const DURATION = 8; // seconds
const CHANNELS = 1;
const BITS = 16;

function generateWav(filePath, notes) {
  const numSamples = SAMPLE_RATE * DURATION;
  const dataSize = numSamples * CHANNELS * (BITS / 8);
  const buffer = Buffer.alloc(44 + dataSize);
  let o = 0;

  // RIFF header
  buffer.write('RIFF', o); o += 4;
  buffer.writeUInt32LE(36 + dataSize, o); o += 4;
  buffer.write('WAVE', o); o += 4;

  // fmt chunk
  buffer.write('fmt ', o); o += 4;
  buffer.writeUInt32LE(16, o); o += 4;
  buffer.writeUInt16LE(1, o); o += 2;  // PCM
  buffer.writeUInt16LE(CHANNELS, o); o += 2;
  buffer.writeUInt32LE(SAMPLE_RATE, o); o += 4;
  buffer.writeUInt32LE(SAMPLE_RATE * CHANNELS * BITS / 8, o); o += 4;
  buffer.writeUInt16LE(CHANNELS * BITS / 8, o); o += 2;
  buffer.writeUInt16LE(BITS, o); o += 2;

  // data chunk
  buffer.write('data', o); o += 4;
  buffer.writeUInt32LE(dataSize, o); o += 4;

  // PCM samples — cycle through notes
  const noteDuration = DURATION / notes.length;
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const noteIndex = Math.min(Math.floor(t / noteDuration), notes.length - 1);
    const freq = notes[noteIndex];
    // Fade in/out each note over 50ms to avoid clicks
    const noteT = t - noteIndex * noteDuration;
    const fade = Math.min(noteT / 0.05, 1, (noteDuration - noteT) / 0.05);
    const sample = Math.sin(2 * Math.PI * freq * t) * 0.6 * fade * 32767;
    buffer.writeInt16LE(Math.round(sample), o);
    o += 2;
  }

  fs.writeFileSync(filePath, buffer);
  console.log(`  Created ${path.basename(filePath)}`);
}

const outDir = path.join(__dirname, '../assets/audio');
fs.mkdirSync(outDir, { recursive: true });

const tracks = [
  { file: 'test-1.wav', notes: [261, 294, 329, 349] },   // C D E F
  { file: 'test-2.wav', notes: [392, 440, 494, 523] },   // G A B C
  { file: 'test-3.wav', notes: [349, 392, 440, 392] },   // F G A G
  { file: 'test-4.wav', notes: [523, 494, 440, 392] },   // C B A G (descending)
  { file: 'test-5.wav', notes: [261, 329, 392, 523] },   // C E G C (major arpeggio)
];

console.log('Generating test audio files…');
for (const t of tracks) {
  generateWav(path.join(outDir, t.file), t.notes);
}
console.log('Done. Files written to assets/audio/');
