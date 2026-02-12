import { withMiddleware } from './lib/middleware.js';

export default withMiddleware(async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { transaction_id } = req.body;
    if (!transaction_id) return res.status(400).json({ error: 'Transaction ID required' });

    const response = await fetch(
        `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
        { headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` } }
    );
    const data = await response.json();

    if (data.status === 'success' && data.data?.status === 'successful') {
        return res.status(200).json({
            verified: true,
            amount: data.data.amount,
            currency: data.data.currency,
            ref: data.data.tx_ref,
        });
    }

    return res.status(400).json({ verified: false, error: 'Payment not verified' });
});
