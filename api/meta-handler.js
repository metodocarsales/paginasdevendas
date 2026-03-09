// api/meta-handler.js
const crypto = require('crypto');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Apenas POST permitido' });

  const PIXEL_ID = '932261095827857';
  const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN; // Configure no painel da Vercel

  const { eventName, email, value, currency, testCode } = req.body;

  // Função para transformar dados em SHA256 (Exigência da Meta) [cite: 100]
  const hash = (str) => str ? crypto.createHash('sha256').update(str.trim().toLowerCase()).digest('hex') : null;

  const payload = {
    data: [{
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000), // Timestamp Unix em segundos [cite: 89]
      action_source: "website", // [cite: 60]
      event_source_url: req.headers.referer,
      user_data: {
        em: email ? [hash(email)] : [], // E-mail com hash [cite: 66]
        client_ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress, // [cite: 62]
        client_user_agent: req.headers['user-agent'] // [cite: 63]
      },
      custom_data: { // [cite: 72]
        value: value || 0,
        currency: currency || 'BRL'
      }
    }]
  };

  // Se você estiver testando, a Meta exige o código de teste [cite: 125]
  if (testCode) payload.test_event_code = testCode;

  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
