import { getDb } from './lib/firebase-admin.js';
import { withMiddleware, requireAdmin } from './lib/middleware.js';
import { validateProduct, sanitizeString } from './lib/validators.js';

const handler = async (req, res) => {
    // GET /api/products - Public endpoint
    if (req.method === 'GET') {
        try {
            const snapshot = await getDb().collection('products').orderBy('created_at', 'desc').get();
            const products = [];
            snapshot.forEach(doc => {
                products.push({ id: doc.id, ...doc.data() });
            });
            return res.status(200).json(products);
        } catch (error) {
            console.error('Products GET Error:', error);
            return res.status(500).json({ error: 'Failed to fetch products' });
        }
    }

    // POST /api/products - Admin only
    if (req.method === 'POST') {
        if (!requireAdmin(req, res)) return;

        const data = req.body;
        const validationErrors = validateProduct(data);
        if (validationErrors.length > 0) {
            return res.status(400).json({ error: 'Validation failed', details: validationErrors });
        }

        try {
            const newProduct = {
                name: sanitizeString(data.name),
                price: Number(data.price),
                description: sanitizeString(data.description || ''),
                image_url: data.image_url.trim(), // Already validated by validateProduct
                created_at: new Date().toISOString()
            };

            const docRef = await getDb().collection('products').add(newProduct);
            console.log('✅ Product added:', docRef.id, newProduct.name);
            return res.status(201).json({ id: docRef.id, ...newProduct });
        } catch (error) {
            console.error('Products POST Error:', error);
            return res.status(500).json({ error: 'Failed to add product' });
        }
    }

    // DELETE /api/products?id=xyz - Admin only
    if (req.method === 'DELETE') {
        if (!requireAdmin(req, res)) return;

        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'Missing product ID' });

        try {
            await getDb().collection('products').doc(id).delete();
            console.log('✅ Product deleted:', id);
            return res.status(200).json({ success: true });
        } catch (error) {
            console.error('Products DELETE Error:', error);
            return res.status(500).json({ error: 'Failed to delete product' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
};

export default withMiddleware(handler);
