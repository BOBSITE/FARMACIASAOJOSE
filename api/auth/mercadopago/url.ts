export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  const clientId = process.env.MERCADOPAGO_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ error: "Missing Mercado Pago Client ID" });
  }

  const host = req.headers.host;
  const protocol = host?.includes('localhost') ? 'http' : 'https';
  const redirectUri = `${protocol}://${host}/api/auth/mercadopago/callback`;
  
  const authUrl = `https://auth.mercadopago.com.br/authorization?client_id=${clientId}&response_type=code&platform_id=mp&redirect_uri=${encodeURIComponent(redirectUri)}`;

  return res.status(200).json({ url: authUrl });
}
