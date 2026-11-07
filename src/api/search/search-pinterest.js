const axios = require('axios');
const https = require('https');
const crypto = require('crypto');

const BASE_URL = "https://pinterest-seven-xi.vercel.app";

// pinterest-seven-xi.vercel.app fails the TLS handshake under Node's newer
// OpenSSL defaults ("SSL alert number 40 / handshake failure"). This agent
// lowers the security level and allows legacy renegotiation so the
// handshake succeeds. Reused across all outbound calls to that backend.
const backendAgent = new https.Agent({
    rejectUnauthorized: true,
    secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
    ciphers: "DEFAULT@SECLEVEL=1"
});

// Vercel backend returns download_url as a relative path (e.g. "/api/dl/...")
// for video results; make it a full URL so clients can hit it directly.
function withFullDownloadUrl(item) {
    if (item.download_url && !item.download_url.startsWith("http")) {
        return { ...item, download_url: `${BASE_URL}${item.download_url}` };
    }
    return item;
}
function extractErrorDetail(err) {
    const data = err.response?.data;
    if (data && typeof data === "object" && typeof data.detail === "string") {
        return data.detail;
    }
    return null;
}

module.exports = function (app) {
    async function handleSearch(req, res, mode) {
        const { quary, limit: limitRaw } = req.query;
        if (!quary) {
            return res.status(400).json({ status: false, error: 'Query (quary) is required' });
        }

        let limit = parseInt(limitRaw, 10);
        if (!Number.isFinite(limit)) limit = 10;
        limit = Math.min(10, Math.max(1, limit));

        // The backend's own /api/video route already appends "video" to the
        // query server-side, so we just pass the query through as-is here.
        const endpoint = mode === 'video' ? '/api/video' : '/api/img';

        try {
            const doSearch = () =>
                axios.get(`${BASE_URL}${endpoint}`, {
                    params: { quary, limit },
                    timeout: 60000,
                    httpsAgent: backendAgent
                });

            let { data } = await doSearch();
            let results = Array.isArray(data) ? data : data.results;

            if (!results || !results.length) {
                // one retry — Render free tier cold start / transient empty scrape
                ({ data } = await doSearch());
                results = Array.isArray(data) ? data : data.results;
            }

            if (!results || !results.length) {
                return res.status(404).json({ status: false, error: `No ${mode} results found for "${quary}"` });
            }

            return res.status(200).json({
                status: true,
                mode,
                query: quary,
                result: results.map(withFullDownloadUrl)
            });
        } catch (error) {
            const detail = extractErrorDetail(error);
            return res.status(500).json({ status: false, error: detail || error.message });
        }
    }

    // GET /pinterest/video?quary=<query>&limit=1-10
    app.get('/pinterest/video', (req, res) => handleSearch(req, res, 'video'));

    // GET /pinterest/img?quary=<query>&limit=1-10
    app.get('/pinterest/img', (req, res) => handleSearch(req, res, 'image'));

    // GET /search/pinterest/download?url=<direct or relative download_url>&filename=<optional>
    app.get('/search/pinterest/download', async (req, res) => {
        const { url, filename } = req.query;
        if (!url) {
            return res.status(400).json({ status: false, error: 'url is required' });
        }

        try {
            const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
            const response = await axios.get(fullUrl, {
                responseType: 'stream',
                timeout: 90000,
                validateStatus: (s) => s === 200,
                httpsAgent: backendAgent
            });

            const name = filename || 'pinterest-media';
            const contentType = response.headers['content-type'] || 'application/octet-stream';
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `inline; filename="${name}"`);
            response.data.pipe(res);
        } catch (error) {
            const detail = extractErrorDetail(error);
            return res.status(500).json({ status: false, error: detail || error.message });
        }
    });
};
