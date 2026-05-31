import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

// 🔐 AYARLAR
const VERIFY_TOKEN = "toraman123";
const TOKEN = "WHATSAPP_ACCESS_TOKEN";
const PHONE_NUMBER_ID = "1095261063678751";
const OPENAI_API_KEY = "OPENAI_KEY";

// 🔍 WEBHOOK DOĞRULAMA (Meta burayı kontrol eder)
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

// 📩 MESAJ ALMA
app.post("/webhook", async (req, res) => {
  try {
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message) return res.sendStatus(200);

    const from = message.from;
    const text = message.text?.body || "";

    // 🤖 OPENAI CEVAP
    const ai = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Sen Toraman Teknik müşteri temsilcisisin. Klima, beyaz eşya ve teknik servis sorularına kısa, net ve teknik cevap ver."
          },
          { role: "user", content: text }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const reply = ai.data.choices[0].message.content;

    // 📲 WHATSAPP CEVAP GÖNDER
    await axios.post(
      `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: from,
        text: { body: reply }
      },
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.sendStatus(200);
  } catch (err) {
    console.log("HATA:", err.message);
    res.sendStatus(200);
  }
});

// 🚀 SERVER START (RENDER UYUMLU)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Toraman Teknik bot çalışıyor:", PORT);
});
