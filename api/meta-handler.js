const crypto = require('crypto');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Método não permitido');

  const { eventName, userData, customData, testEventCode } = req.body;
  const PIXEL_ID = '932261095827857'; // Seu ID já configurado
  const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

  // Função interna para o Hash SHA256 obrigatório 
  const sha256 = (str) => crypto.createHash('sha256').update(str.trim().toLowerCase()).digest('hex');

  const payload = {
    data: [{
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000), // Timestamp Unix em segundos [cite: 89, 133]
      action_source: "website", // Obrigatório para eventos web [cite: 60, 95]
      event_source_url: req.headers.referer,
      user_data: {
        em: userData.email ? [sha256(userData.email)] : [], // E-mail com hash [cite: 64, 66]
        client_ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        client_user_agent: req.headers['user-agent']
      },
      custom_data: customData || {} // Valores e moedas [cite: 72, 84]
    }]
  };

  // Se você incluir o código de teste no disparo, ele ativa o modo debug [cite: 125, 139]
  if (testEventCode) payload.test_event_code = testEventCode;

  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
