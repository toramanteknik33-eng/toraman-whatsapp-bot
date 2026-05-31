import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

const TOKEN = "WHATSAPP_ACCESS_TOKEN";
const PHONE_NUMBER_ID = "1095261063678751";
const OPENAI_API_KEY = "OPENAI_KEY";

// webhook doğrulama
app.get("/webhook", (req, res) => {
  const verify_token = "toraman123";

  if (
    req.query["hub.mode"] &&
    req.query["hub.verify_token"] === verify_token
  ) {
    return res.status(200).send(req.query["hub.challenge"]);
  }

  res.sendStatus(403);
});

// mesaj alma
app.post("/webhook", async (req, res) => {
  const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

  if (!message) return res.sendStatus(200);

  const userText = message.text.body;
  const from = message.from;

  try {
    const ai = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Sen Toraman Teknik müşteri temsilcisisin. Klima ve beyaz eşya arızalarına teknik cevap ver."
          },
          { role: "user", content: userText }
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
    console.log(err);
    res.sendStatus(200);
  }
});

app.listen(3000, () => console.log("Bot çalışıyor"));
