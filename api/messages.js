
import { getDb } from './lib/firebase-admin.js';
import { withMiddleware, requireAdmin } from './lib/middleware.js';
import { validateEmail, sanitizeString } from './lib/validators.js';

const handler = async (req, res) => {
    // POST /api/messages (Submit Message)
    if (req.method === 'POST') {
        const { name, email, phone, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        if (!validateEmail(email)) {
            return res.status(400).json({ error: 'Invalid email' });
        }

        try {
            const newMessage = {
                name: sanitizeString(name),
                email: email,
                phone: sanitizeString(phone),
                message: sanitizeString(message),
                createdAt: new Date().toISOString(),
                read: false
            };

            const docRef = await getDb().collection('messages').add(newMessage);
            return res.status(201).json({ id: docRef.id, message: 'Message sent successfully' });
        } catch (error) {
            console.error('Message Submission Error:', error);
            return res.status(500).json({
                error: 'Failed to send message',
                details: error.message,
                code: error.code
            });
        }
    }

    // AUTH REQUIRED FOR REMAINING METHODS
    if (!requireAdmin(req, res)) return;

    // GET /api/messages (List all)
    if (req.method === 'GET') {
        try {
            const snapshot = await getDb().collection('messages').orderBy('createdAt', 'desc').get();
            const messages = [];
            snapshot.forEach(doc => messages.push({ id: doc.id, ...doc.data() }));
            return res.status(200).json(messages);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    // PUT /api/messages?id=xyz (Mark as Read)
    if (req.method === 'PUT') {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'Missing ID' });

        try {
            await getDb().collection('messages').doc(id).update({ read: true });
            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: 'Failed to update message' });
        }
    }

    // DELETE /api/messages?id=xyz
    if (req.method === 'DELETE') {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'Missing ID' });

        try {
            await getDb().collection('messages').doc(id).delete();
            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: 'Failed to delete message' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
};

export default withMiddleware(handler);
