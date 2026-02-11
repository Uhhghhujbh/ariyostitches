// ===================================
// /api/verify-payment — Flutterwave Verification
// ===================================
// POST → verify a Flutterwave transaction

import axios from 'axios';
import { withMiddleware } from './lib/middleware.js';

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { transaction_id } = req.body;
    if (!transaction_id) {
        return res.status(400).json({ error: 'Transaction ID required' });
    }

    try {
        const flwRes = await axios.get(
            `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
            { headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` } }
        );

        const { status, data } = flwRes.data;
        if (status === 'success' && data.status === 'successful') {
            return res.status(200).json({
                success: true,
                amount: data.amount,
                currency: data.currency,
                customer: data.customer,
                tx_ref: data.tx_ref,
            });
        }

        return res.status(400).json({ error: 'Payment verification failed' });
    } catch (err) {
        console.error('[verify-payment] Error:', err.message);
        return res.status(500).json({ error: 'Verification failed' });
    }
}

export default withMiddleware(handler);
