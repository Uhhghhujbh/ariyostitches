
import axios from 'axios';
import { withMiddleware } from './lib/middleware.js';

const handler = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { transaction_id } = req.body;
    if (!transaction_id) {
        return res.status(400).json({ error: 'Transaction ID is required' });
    }

    try {
        const response = await axios.get(
            `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`
                }
            }
        );

        const { status, data } = response.data;

        if (status === 'success' && data.status === 'successful') {
            return res.status(200).json({
                success: true,
                amount: data.amount,
                currency: data.currency,
                customer: data.customer,
                tx_ref: data.tx_ref
            });
        } else {
            return res.status(400).json({ success: false, error: 'Payment verification failed' });
        }
    } catch (error) {
        console.error('Payment Verification Error:', error.response?.data || error.message);
        return res.status(500).json({ error: 'Verification server error' });
    }
};

export default withMiddleware(handler);
