import { withMiddleware } from './lib/middleware.js';
import { getDb } from './lib/firebase-admin.js';

export default withMiddleware(async (req, res) => {
    const db = getDb();

    if (req.method === 'POST') {
        const { customer, items, totalAmount, downPayment, paymentRef, installments } = req.body;

        if (!customer?.phone || !customer?.email || !items?.length || !totalAmount || !downPayment || !paymentRef) {
            return res.status(400).json({ error: 'Missing required layaway fields' });
        }

        const txResponse = await fetch(
            `https://api.flutterwave.com/v3/transactions/${paymentRef}/verify`,
            { headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` } }
        );
        const txData = await txResponse.json();

        if (txData.status !== 'success' || txData.data?.status !== 'successful') {
            return res.status(400).json({ error: 'Payment verification failed' });
        }

        const layawayId = `LAY-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

        await db.collection('layaways').doc(layawayId).set({
            layawayId,
            customer,
            items,
            totalAmount: Number(totalAmount),
            downPayment: Number(downPayment),
            remainingBalance: Number(totalAmount) - Number(downPayment),
            installments: installments || 3,
            payments: [{
                amount: Number(downPayment),
                ref: String(paymentRef),
                date: Date.now(),
                type: 'down_payment',
            }],
            status: 'active',
            createdAt: Date.now(),
        });

        return res.status(201).json({ success: true, layawayId });
    }

    if (req.method === 'GET') {
        const { id, phone, email } = req.query;

        if (id) {
            const doc = await db.collection('layaways').doc(id).get();
            if (!doc.exists) return res.status(404).json({ error: 'Layaway not found' });
            return res.status(200).json({ id: doc.id, ...doc.data() });
        }

        if (phone || email) {
            let query = db.collection('layaways');
            if (phone) query = query.where('customer.phone', '==', phone);
            if (email) query = query.where('customer.email', '==', email.toLowerCase());
            const snap = await query.get();
            const results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            return res.status(200).json(results);
        }

        return res.status(400).json({ error: 'Provide an ID, phone, or email' });
    }

    if (req.method === 'PUT') {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'Layaway ID required' });

        const { amount, paymentRef: pRef } = req.body;
        if (!amount || !pRef) return res.status(400).json({ error: 'Amount and payment reference required' });

        const doc = await db.collection('layaways').doc(id).get();
        if (!doc.exists) return res.status(404).json({ error: 'Layaway not found' });

        const data = doc.data();
        const newBalance = data.remainingBalance - Number(amount);

        const update = {
            remainingBalance: Math.max(0, newBalance),
            payments: [...(data.payments || []), {
                amount: Number(amount),
                ref: String(pRef),
                date: Date.now(),
                type: 'installment',
            }],
        };

        if (newBalance <= 0) update.status = 'completed';

        await db.collection('layaways').doc(id).update(update);
        return res.status(200).json({ success: true, remainingBalance: Math.max(0, newBalance) });
    }

    return res.status(405).json({ error: 'Method not allowed' });
});
