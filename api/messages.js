import { withMiddleware, requireAdmin } from './lib/middleware.js';
import { getDb } from './lib/firebase-admin.js';
import { clean, validateMessage } from './lib/validators.js';

export default withMiddleware(async (req, res) => {
    const db = getDb();

    if (req.method === 'GET') {
        if (!requireAdmin(req, res)) return;
        const snap = await db.collection('messages').orderBy('createdAt', 'desc').get();
        const messages = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        return res.status(200).json(messages);
    }

    if (req.method === 'POST') {
        const errors = validateMessage(req.body);
        if (errors.length) return res.status(400).json({ error: errors.join(', ') });

        await db.collection('messages').add({
            name: clean(req.body.name, 100),
            email: req.body.email.trim().toLowerCase(),
            phone: clean(req.body.phone || '', 20),
            message: clean(req.body.message, 2000),
            read: false,
            createdAt: Date.now(),
        });
        return res.status(201).json({ success: true });
    }

    if (req.method === 'PUT') {
        if (!requireAdmin(req, res)) return;
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'Message ID required' });
        await db.collection('messages').doc(id).update({ read: true });
        return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
        if (!requireAdmin(req, res)) return;
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'Message ID required' });
        await db.collection('messages').doc(id).delete();
        return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
});
