import OpenAI from "openai";
import multiparty from "multiparty";
import fs from "fs";
import { File } from "node:buffer"; // ✅ polyfill
if (!globalThis.File) {
  globalThis.File = File;
}

export const config = {
  api: {
    bodyParser: false, // Disables Next's default body parser
  },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Parse the incoming form (with audio)
  const form = new multiparty.Form();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form parse error:", err);
      return res.status(500).json({ error: "Form parse error" });
    }

    try {
      const filePath = files.file[0].path;

      // 1️⃣ Transcribe the audio
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: "gpt-4o-mini-transcribe",
      });

      // 2️⃣ Summarize the transcript
      const summary = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a summerization bot for aura readings. All summarizations will be done in the second person, using your/you statements. Please summerize the following conversation clearly and concisely, making sure to capture details about the colors.",
          },
          {
            role: "user",
            content: transcription.text,
          },
        ],
      });

      // 3️⃣ Send the result back
      return res.status(200).json({
        text: transcription.text,
        summary: summary.choices[0].message.content,
      });
    } catch (error) {
      console.error("Processing error:", error);
      return res.status(500).json({ error: error.message });
    }
  });
}