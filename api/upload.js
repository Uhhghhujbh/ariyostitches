// This endpoint is no longer needed since we use URL-only uploads
// Keeping for backward compatibility but it now just validates URLs

import { withMiddleware, requireAdmin } from './lib/middleware.js';
import { validateImageUrl } from './lib/validators.js';

export const config = {
    api: {
        bodyParser: true, // Now using JSON, not form data
    },
};

const handler = async (req, res) => {
    // Only POST allowed
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // AUTH: Admin Only
    if (!requireAdmin(req, res)) return;

    const { image_url } = req.body;

    if (!image_url) {
        return res.status(400).json({ error: 'image_url is required' });
    }

    // Validate the URL
    const validation = validateImageUrl(image_url);
    if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
    }

    // Return the validated URL
    return res.status(200).json({ url: validation.url });
};

export default withMiddleware(handler);
