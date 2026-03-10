import axios from 'axios';

// Use as variáveis do seu painel da Meta
const FACEBOOK_API_VERSION = 'v25.0'; // Atualizado conforme aviso do log
const PHONE_NUMBER_ID = '1044995358689333'; 
const ACCESS_TOKEN = 'EAARw5ZA8jIZCsBQ73haUC4jN7TZBI5ZBce3ti6RRFRgWZAPY3NsfkZCZCHoSPowUNrgRx56QrRc5DF7rbagxSWZBeGnEgAP91V5bfNztQnu7dcZAHzLxQh9WpfWaSBEquqc09PzccGC0sRNqZA1oSc2dGkoA7OobGLWVkqAqh26GynB6ZCpAOt3RSrK7ChtTflRdSXQVOZA8nfBY0Nm8jufwdb07TxUP7ou3gn72vxbb79xPqAgNCTG3GMMvlr9uPn1vZC3ZBraFJdUNVZB0IJuVkueWFydEQ4iMl88HaYL4RIxPQZDZD';

export const sendWhatsAppText = async (to: string, message: string) => {
  try {
    // Sênior: Garantimos que o número tenha o formato internacional sem caracteres especiais
    const cleanNumber = to.replace(/\D/g, '');

    const url = `https://graph.facebook.com/${FACEBOOK_API_VERSION}/${PHONE_NUMBER_ID}/messages`;

    const data = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanNumber,
      type: "text",
      text: { body: message }
    };

    const config = {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const response = await axios.post(url, data, config);
    console.log("✅ WHATSAPP ENVIADO:", response.data.messages[0].id);
    return response.data;

  } catch (error: any) {
    // Log detalhado para capturar o "motivo real" da rejeição da Meta
    if (error.response) {
      console.error("❌ ERRO WHATSAPP API (DETALHADO):", {
        status: error.response.status,
        data: error.response.data.error
      });
    } else {
      console.error("❌ ERRO NO FLUXO WHATSAPP:", error.message);
    }
    throw error;
  }
};

export const sendProductWithButton = async (to: string, product: any) => {
    const url = `https://graph.facebook.com/v21.0/${process.env.PHONE_NUMBER_ID}/messages`;
    
    const data = {
        messaging_product: "whatsapp",
        to: to,
        type: "interactive",
        interactive: {
            type: "button",
            body: {
                text: `✅ *${product.nome_peca}*\n🚗 ${product.modelo_veiculo}\n💰 *R$ ${product.preco}*`
            },
            action: {
                buttons: [
                    { type: "reply", reply: { id: `add_${product.id}`, title: "🛒 Adicionar" } },
                    { type: "reply", reply: { id: `checkout`, title: "💳 Finalizar Compra" } }
                ]
            }
        }
    };

    await axios.post(url, data, { headers: { 'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}` } });
};