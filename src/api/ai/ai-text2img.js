const axios = require('axios');

const API_BASE = "https://qwen-api-gq76.onrender.com/text2img";

module.exports = function (app) {
    async function generateImage(prompt) {
        const params = new URLSearchParams();
        params.set('prompt', prompt);

        const { data } = await axios.get(`${API_BASE}?${params.toString()}`, { timeout: 120000 });
        return data;
    }

    // GET /ai/text2img?prompt=<text>
    app.get('/ai/text2img', async (req, res) => {
        try {
            const { prompt } = req.query;
            if (!prompt) {
                return res.status(400).json({ status: false, error: 'prompt is required' });
            }

            const data = await generateImage(prompt);
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
