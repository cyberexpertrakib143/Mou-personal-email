const axios = require('axios');

const API_BASE = "https://qwen-api-gq76.onrender.com/edit";

module.exports = function (app) {
    async function editImage(image, prompt, image2) {
        const params = new URLSearchParams();
        params.set('image', image);
        if (image2) params.set('image2', image2);
        params.set('prompt', prompt);

        const { data } = await axios.get(`${API_BASE}?${params.toString()}`, { timeout: 120000 });
        return data;
    }

    // GET /ai/qwen-edit?image=<url>&prompt=<text>&image2=<url optional>
    app.get('/ai/qwen-edit', async (req, res) => {
        try {
            const { image, prompt, image2 } = req.query;
            if (!image || !prompt) {
                return res.status(400).json({ status: false, error: 'image and prompt are required' });
            }

            const data = await editImage(image, prompt, image2);
            const imageUrl = data && data.success && typeof data.imageUrl === 'string' ? data.imageUrl : null;

            if (!imageUrl) {
                const errMsg = (data && (data.error || data.message)) || 'Unknown reason';
                return res.status(502).json({ status: false, error: errMsg });
            }

            res.status(200).json({
                status: true,
                result: imageUrl
            });
        } catch (error) {
            res.status(500).json({ status: false, error: error.message });
        }
    });
};
