import multiparty from "multiparty";
import fs from "fs";
import path from "path";
import Twilio from "twilio";

export const config = {
  api: {
    bodyParser: false, // Needed for multiparty
  },
};

const twilioClient = Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = new multiparty.Form();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form parse error:", err);
      return res.status(500).json({ error: "Form parse error" });
    }

    try {
      const summary = fields.summary?.[0] || "No summary provided";
      const notes = fields.notes?.[0] || "";

      let mediaUrl = null;

      if (files.photo && files.photo[0]) {
        // ✅ In production, you’d upload this to a public URL (like Vercel Blob or S3)
        // For now, just simulate:
        mediaUrl = "https://example.com/path/to/uploaded/photo.jpg";
      }

      const message = await twilioClient.messages.create({
        from: process.env.TWILIO_NUMBER,
        to: process.env.MY_PHONE_NUMBER, // or use a field
        body: `New Session Summary:\n\n${summary}\n\nNotes:\n${notes}`,
        ...(mediaUrl ? { mediaUrl: [mediaUrl] } : {}),
      });

      return res.status(200).json({ success: true, sid: message.sid });
    } catch (error) {
      console.error("Error sending Twilio message:", error);
      return res.status(500).json({ error: error.message });
    }
  });
}