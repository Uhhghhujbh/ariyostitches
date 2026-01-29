
import { db } from './lib/firebase-admin.js';
import { withMiddleware } from './lib/middleware.js';
import { sanitizeString } from './lib/validators.js';

const handler = async (req, res) => {
    // GET /api/layaways?phone=x&email=y
    if (req.method === 'GET') {
        const { phone, email } = req.query;
        if (!phone && !email) {
            return res.status(400).json({ error: 'Phone or email required' });
        }

        try {
            let query = db.collection('layaways');
            if (phone) query = query.where('customer.phone', '==', phone);
            else query = query.where('customer.email', '==', email);

            const snapshot = await query.get();
            const layaways = [];
            snapshot.forEach(doc => layaways.push({ id: doc.id, ...doc.data() }));

            // Sort manually since we did a where query
            layaways.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            return res.status(200).json(layaways);
        } catch (error) {
            return res.status(500).json({ error: 'Failed to fetch layaways' });
        }
    }

    // POST /api/layaways (Create)
    if (req.method === 'POST') {
        const data = req.body;

        // Basic validation
        if (!data.totalAmount || !data.customer || !data.service) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        try {
            const newLayaway = {
                service: {
                    name: sanitizeString(data.service.name),
                    description: sanitizeString(data.service.description)
                },
                customer: {
                    name: sanitizeString(data.customer.name),
                    email: data.customer.email,
                    phone: data.customer.phone
                },
                totalAmount: Number(data.totalAmount),
                paidAmount: 0,
                remainingAmount: Number(data.totalAmount),
                payments: [],
                status: 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const docRef = await db.collection('layaways').add(newLayaway);
            return res.status(201).json({ id: docRef.id, ...newLayaway });
        } catch (error) {
            return res.status(500).json({ error: 'Failed to create layaway' });
        }
    }


    // PUT /api/layaways?id=xyz (Record Payment)
    if (req.method === 'PUT') {
        const { id } = req.query;
        const { amount, paymentRef } = req.body;

        if (!id || !amount || !paymentRef) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        try {
            const layawayRef = db.collection('layaways').doc(id);
            const layawayDoc = await layawayRef.get();

            if (!layawayDoc.exists) {
                return res.status(404).json({ error: 'Layaway not found' });
            }

            const layaway = layawayDoc.data();

            // Verify payment if not already verified (backend check)
            // Ideally verify against Flutterwave here too, similar to orders
            // For now assuming passed paymentRef is valid or verifying it:
            // Implementation of verification:
            // ... verify logic ...

            const newPaidAmount = layaway.paidAmount + Number(amount);
            const newRemainingAmount = layaway.totalAmount - newPaidAmount;
            const isCompleted = newRemainingAmount <= 0;

            const newPayment = {
                amount: Number(amount),
                paymentRef,
                date: new Date().toISOString()
            };

            await layawayRef.update({
                paidAmount: newPaidAmount,
                remainingAmount: Math.max(0, newRemainingAmount),
                payments: [...(layaway.payments || []), newPayment],
                status: isCompleted ? 'completed' : 'active',
                updatedAt: new Date().toISOString()
            });

            return res.status(200).json({ success: true, completed: isCompleted });
        } catch (error) {
            return res.status(500).json({ error: 'Failed to record payment' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
};

export default withMiddleware(handler);
