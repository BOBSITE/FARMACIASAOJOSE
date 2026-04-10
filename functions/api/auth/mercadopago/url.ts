export const onRequestGet: PagesFunction<any> = async (context) => {
  const { request, env } = context;
  const clientId = env.MERCADOPAGO_CLIENT_ID;

  if (!clientId) {
    return new Response(JSON.stringify({ error: "MERCADOPAGO_CLIENT_ID not configured" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;
  const redirectUri = `${origin}/api/auth/mercadopago/callback`;

  const authUrl = `https://auth.mercadopago.com.br/authorization?client_id=${clientId}&response_type=code&platform_id=mp&redirect_uri=${encodeURIComponent(redirectUri)}`;

  return new Response(JSON.stringify({ url: authUrl }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
