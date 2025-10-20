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

const twilioClientWhatsapp = Twilio(
    process.env.TWILIO_ACCOUNT_SID_WHATSAPP,
    process.env.TWILIO_AUTH_TOKEN_WHATSAPP
)

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

            // New: Get dropdown values
            const firstName = fields.first_name?.[0] || "";
            const phone = fields.phone?.[0] || "";
            // Get delivery method from form
            const service = fields.service?.[0] || fields.deliveryMethod?.[0]; // Default to SMS if not provided

            console.log("Dropdown values:", { firstName, phone, service });
            console.log("Button Selection:", buttonSelection);
            console.log("Input Text:", inputText);
            

            let mediaUrl = fields.mediaUrl?.[0] || null;
            let mediaUrlToSend = [mediaUrl,]
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
            // Use service variable for delivery method
            const deliveryMethod = service;
            // Use phone and firstName for recipient info
            let recipientName = firstName;
            let recipientPhone = phone || process.env.MY_PHONE_NUMBER;

            // If no dropdown option selected, use manual entry
            if (!firstName && !phone && fields.manualName?.[0] && fields.manualPhone?.[0]) {
                recipientName = fields.manualName[0];
                recipientPhone = fields.manualPhone[0];
            }

            if (deliveryMethod.toLowerCase() === 'whatsapp') {
                console.log("Sending WhatsApp via Twilio to", recipientPhone);
                await twilioClientWhatsapp.messages.create({
                    from: process.env.TWILIO_NUMBER_WHATSAPP,
                    to: `whatsapp:${recipientPhone}`,
                    body: `Summary for ${recipientName}:\n${summary}`,
                    ...(mediaUrl ? { mediaUrl: mediaUrlToSend } : {}),
                });
            } else {
                console.log("Sending SMS via Twilio to", recipientPhone);
                await twilioClient.messages.create({
                    from: process.env.TWILIO_NUMBER,
                    to: recipientPhone,
                    body: `Summary for ${recipientName}:\n${summary}`,
                    ...(mediaUrl ? { mediaUrl: mediaUrlToSend } : {}),
                });
            }

            return res.status(200).json({ success: true });
        } catch (error) {
            console.error("Error sending Twilio message:", error);
            return res.status(500).json({ error: error.message });
        }
    });
}