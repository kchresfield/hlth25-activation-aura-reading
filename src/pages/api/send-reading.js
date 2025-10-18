import multiparty from "multiparty";
import fs from "fs";
import path from "path";
import Twilio from "twilio";
import { put } from "@vercel/blob";

export const config = {
    api: {
        bodyParser: false, // Needed for multiparty
    },
};

const twilioClient = Twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

function colorUrl(color) {
    switch (color.toLowerCase()) {
        case 'violet':
            return 'https://hlth25-assets-images-5490.twil.io/violet.jpeg';
        case 'indigo':
            return 'https://hlth25-assets-images-5490.twil.io/indigo.jpeg';
        case 'blue':
            return 'https://hlth25-assets-images-5490.twil.io/blue.jpeg';
        case 'green':
            return 'https://hlth25-assets-images-5490.twil.io/green.jpeg';
        case 'yellow':
            return 'https://hlth25-assets-images-5490.twil.io/yellow.jpeg';
        case 'orange':
            return 'https://hlth25-assets-images-5490.twil.io/orange.jpeg';
        case 'red':
            return 'https://hlth25-assets-images-5490.twil.io/red.jpeg';
        case 'pink':
            return 'https://hlth25-assets-images-5490.twil.io/pink.jpeg';
        case 'magenta':
            return 'https://hlth25-assets-images-5490.twil.io/magenta.jpeg';
        case 'turquoise':
            return 'https://hlth25-assets-images-5490.twil.io/turquoise.jpeg';
        case 'tan':
            return 'https://hlth25-assets-images-5490.twil.io/tan.jpeg';
        case 'white':
            return 'https://hlth25-assets-images-5490.twil.io/white.jpeg';
        default:
            return null;
    }
}

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
            const buttonSelection = fields.buttonSelection?.[0] || "";
            const inputText = fields.inputText?.[0] || "";
            let arr = JSON.parse(buttonSelection);
            
            console.log("Button Selection:", buttonSelection);
            console.log("Input Text:", inputText);

            let mediaUrl = fields.mediaUrl?.[0] || null;
            let mediaUrlToSend=[mediaUrl,]
            arr.forEach(color => {
                mediaUrlToSend.unshift(colorUrl(color));
            });

            console.log("mediaUrlToSend ", mediaUrlToSend)

            if (files.photo && files.photo[0]) {
                const file = files.photo[0];
                const fileStream = fs.createReadStream(file.path);
                // Upload to Vercel Blob
                const blob = await put(file.originalFilename, fileStream, { access: "public" });
                mediaUrl = blob.url;
            }

            console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!Media URL:", mediaUrl);
            const message = await twilioClient.messages.create({
                from: process.env.TWILIO_NUMBER,
                to: process.env.MY_PHONE_NUMBER,
                body: `Summary:\n${summary}\n`,
                ...(mediaUrl ? { mediaUrl: mediaUrlToSend } : {}),
            });

            return res.status(200).json({ success: true, /*sid: message.sid*/ });
        } catch (error) {
            console.error("Error sending Twilio message:", error);
            return res.status(500).json({ error: error.message });
        }
    });
}