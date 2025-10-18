import multiparty from "multiparty";
import fs from "fs";
import { createReadStream } from "fs";
import { put } from "@vercel/blob";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = new multiparty.Form();

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: "Form parse error" });

    try {
      const file = files.photo[0];
      const fileStream = createReadStream(file.path);


      // Upload to Vercel Blob
      const blob = await put(`uploads/${Date.now()}-${file.originalFilename}`, fileStream, { access: "public", addRandomSuffix: true });

      // blob.url is the public URL
      return res.status(200).json({ url: blob.url });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }
  });
}