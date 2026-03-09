// server/src/whatsappClient.ts
import axios from 'axios';

const WA_PHONE_NUMBER_ID = process.env.WA_PHONE_NUMBER_ID;
const CLOUD_API_ACCESS_TOKEN = process.env.CLOUD_API_ACCESS_TOKEN;

export async function sendWhatsAppText(to: string, body: string) {
  if (!WA_PHONE_NUMBER_ID || !CLOUD_API_ACCESS_TOKEN) {
    console.error('WhatsApp Cloud API não configurada (env).');
    return;
  }

  const url = `https://graph.facebook.com/v16.0/${WA_PHONE_NUMBER_ID}/messages`;

  await axios.post(
    url,
    {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body },
    },
    {
      headers: {
        Authorization: `Bearer ${CLOUD_API_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  );
}
