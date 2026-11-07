const axios = require('axios');

const API_BASE = "https://work-1-rirzttnowzvubxgp.prod-runtime.all-hands.dev/api/ffinfo";

module.exports = function (app) {
    // GET /game/ffinfo?uid=<numeric uid>
    app.get('/game/ffinfo', async (req, res) => {
        const { uid } = req.query;

        if (!uid) {
            return res.status(400).json({ status: false, error: 'uid is required' });
        }
        if (!/^\d+$/.test(uid)) {
            return res.status(400).json({ status: false, error: 'uid must contain numbers only' });
        }

        try {
            const { data } = await axios.get(API_BASE, {
                params: { uid },
                timeout: 30000
            });

            if (!data || (!data.name && !data.uid)) {
                return res.status(404).json({ status: false, error: 'No info found for this UID' });
            }

            res.status(200).json({
                status: true,
                result: data
            });
        } catch (error) {
            res.status(500).json({ status: false, error: error.message });
        }
    });
};
