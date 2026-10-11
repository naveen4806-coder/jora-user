// Jora payment gateway boundary. Secrets must only exist in Vercel Environment Variables.
// Required later: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET and PAYMENTS_LIVE_ENABLED=true.
// Do not enable this route until it calculates the total from Jora's trusted server-side cart/order record.
export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method not allowed.' });
  }

  const configured = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  const enabled = process.env.PAYMENTS_LIVE_ENABLED === 'true';

  if (!configured || !enabled) {
    return res.status(503).json({
      code: 'PAYMENT_SETUP_REQUIRED',
      message: 'Online payment is not configured yet. Add Razorpay keys privately in Vercel and complete server-side order validation before enabling it.'
    });
  }

  // Intentionally blocked until Jora has a trusted order store.
  // Never create a Razorpay order using only totals sent from the browser.
  return res.status(501).json({
    code: 'ORDER_VALIDATION_REQUIRED',
    message: 'Connect this route to Jora server-side order validation before creating a payment order.'
  });
}
