export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  const STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY;
  if (!STRIPE_SECRET_KEY) {
    return new Response(
      JSON.stringify({ error: 'Stripe is not configured.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid request body.' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { price_type } = body;

  // Map price type to Stripe Price ID
  const priceMap = {
    first: env.STRIPE_PRICE_FIRST,
    regular: env.STRIPE_PRICE_REGULAR,
  };

  const priceId = priceMap[price_type];
  if (!priceId) {
    return new Response(
      JSON.stringify({ error: 'Invalid price type.' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Determine base URL for success/cancel
  const origin = new URL(request.url).origin;

  // Create Stripe Checkout Session via API
  const stripeParams = new URLSearchParams();
  stripeParams.append('mode', 'payment');
  stripeParams.append('line_items[0][price]', priceId);
  stripeParams.append('line_items[0][quantity]', '1');
  stripeParams.append('success_url', `${origin}/?checkout=success`);
  stripeParams.append('cancel_url', `${origin}/?checkout=cancel`);
  stripeParams.append('shipping_address_collection[allowed_countries][0]', 'JP');
  stripeParams.append('payment_method_types[0]', 'card');
  stripeParams.append('payment_method_types[1]', 'konbini');
  stripeParams.append('payment_method_types[2]', 'paypay');

  try {
    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: stripeParams.toString(),
    });

    const session = await stripeRes.json();

    if (!stripeRes.ok) {
      return new Response(
        JSON.stringify({ error: session.error?.message || 'Stripe API error.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: 'Failed to connect to payment service.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
