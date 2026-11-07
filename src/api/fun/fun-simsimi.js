const axios = require('axios');

// Upstream Simsimi API (Render-hosted) — this file proxies to it.
// This app itself is deployed at base "https://rx.agi.bd", so the routes
// below (mounted at /fun/...) are exactly what the "baby" command calls:
//   simsim = "https://rx.agi.bd/fun"  ->  `${simsim}/teach`, `${simsim}/edit`, etc.
const API_ROOT = "https://simsimi-api-hapc.onrender.com";

module.exports = function (app) {
    async function upstreamGet(path, params = {}) {
        const usp = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== "") usp.set(k, v);
        });
        const qs = usp.toString();
        const { data } = await axios.get(`${API_ROOT}${path}${qs ? `?${qs}` : ""}`, { timeout: 30000 });
        return data;
    }

    async function upstreamPost(path, body = {}) {
        const { data } = await axios.post(`${API_ROOT}${path}`, body, { timeout: 30000 });
        return data;
    }

    async function upstreamDelete(path, params = {}) {
        const usp = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== "") usp.set(k, v);
        });
        const qs = usp.toString();
        const { data } = await axios.delete(`${API_ROOT}${path}${qs ? `?${qs}` : ""}`, { timeout: 30000 });
        return data;
    }

    // ==========================
    //   GET /fun/simsimi?text=&senderID=&threadID=&senderName=
    //   -> used by deliverSimsimiResponse (data.response / data.reaction / data.rateLimited)
    // ==========================
    app.get('/fun/simsimi', async (req, res) => {
        try {
            const { text, senderID, threadID, senderName } = req.query;
            if (!text) return res.status(400).json({ response: "❌ Provide text" });

            const data = await upstreamGet('/simsimi', { text, senderID, threadID, senderName });
            res.status(200).json(data); // { response, reaction } or { response:null, rateLimited:true }
        } catch (error) {
            res.status(500).json({ response: "⚠️ Server error occurred.", error: error.message });
        }
    });

    // ==========================
    //   GET /fun/teach?ask=&ans=&senderID=&senderName=
    //   -> used by "baby teach [Q] - [A]" (reads data.message)
    // ==========================
    app.get('/fun/teach', async (req, res) => {
        try {
            const { ask, ans, senderID, senderName } = req.query;
            if (!ask || !ans) return res.status(400).json({ message: "❌ Provide ask and ans" });

            const data = await upstreamGet('/teach', { ask, ans, senderID, senderName });
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ message: `⚠️ Server error occurred: ${error.message}` });
        }
    });

    // ==========================
    //   GET /fun/teachReact?ask=&emoji=&senderName=
    //   -> used by "baby react [Q] - [Emoji]" (reads data.message)
    // ==========================
    app.get('/fun/teachReact', async (req, res) => {
        try {
            const { ask, emoji, senderName } = req.query;
            if (!ask || !emoji) return res.status(400).json({ message: "❌ Provide ask and emoji" });

            const data = await upstreamGet('/teachReact', { ask, emoji, senderName });
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ message: `⚠️ Server error occurred: ${error.message}` });
        }
    });

    // ==========================
    //   GET /fun/edit?ask=&old=&new=
    //   -> used by "baby edit [Q] - [Old] - [New]" (reads data.message)
    // ==========================
    app.get('/fun/edit', async (req, res) => {
        try {
            const { ask, old, new: updated } = req.query;
            if (!ask || !old || !updated) return res.status(400).json({ message: "❌ Provide ask, old and new" });

            const data = await upstreamGet('/edit', { ask, old, new: updated });
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ message: `⚠️ Server error occurred: ${error.message}` });
        }
    });

    // ==========================
    //   GET /fun/delete?ask=&ans=   (single reply delete)
    //   -> used by "baby remove/rm [Q] - [A]" (reads data.message)
    // ==========================
    app.get('/fun/delete', async (req, res) => {
        try {
            const { ask, ans } = req.query;
            if (!ask || !ans) return res.status(400).json({ message: "❌ Provide ask and ans" });

            const data = await upstreamGet('/delete', { ask, ans });
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ message: `⚠️ Server error occurred: ${error.message}` });
        }
    });

    // ==========================
    //   GET /fun/deleteByReply?reply=
    //   -> used by "baby del" (reply-to-wrong-answer) (reads data.message)
    // ==========================
    app.get('/fun/deleteByReply', async (req, res) => {
        try {
            const { reply } = req.query;
            if (!reply) return res.status(400).json({ success: false, message: "❌ Provide reply text" });

            const data = await upstreamGet('/deleteByReply', { reply });
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ success: false, message: `⚠️ Server error occurred: ${error.message}` });
        }
    });

    // ==========================
    //   POST /fun/keepOnly   body: { ask, keepIndexes: [1,2,...] }
    //   -> used by the "msg" number-select flow (reads data.message)
    // ==========================
    app.post('/fun/keepOnly', async (req, res) => {
        try {
            const { ask, keepIndexes } = req.body || {};
            if (!ask || !Array.isArray(keepIndexes) || keepIndexes.length === 0) {
                return res.status(400).json({ success: false, message: "❌ Provide ask and keepIndexes[]" });
            }

            const data = await upstreamPost('/keepOnly', { ask, keepIndexes });
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ success: false, message: `⚠️ Server error occurred: ${error.message}` });
        }
    });

    // ==========================
    //   GET /fun/list
    //   -> used by "baby list" (reads data.totalQuestions)
    //   ⚠️ note: upstream only returns { totalQuestions }, no totalReplies —
    //   the command's "totalReplies" line will print undefined either way
    // ==========================
    app.get('/fun/list', async (req, res) => {
        try {
            const data = await upstreamGet('/list');
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ message: `⚠️ Server error occurred: ${error.message}` });
        }
    });

    // ==========================
    //   GET /fun/simsimi-list?ask=
    //   -> used by "baby msg [trigger]" (reads data.replies / data.total)
    // ==========================
    app.get('/fun/simsimi-list', async (req, res) => {
        try {
            const { ask } = req.query;
            if (!ask) return res.status(400).json({ message: "❌ Provide a trigger" });

            const data = await upstreamGet('/simsimi-list', { ask });
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ message: `⚠️ Server error occurred: ${error.message}` });
        }
    });

    // ==========================
    //   SETTING (autoTeach on/off, per-thread or global)
    //   GET  /fun/setting?threadID=   -> used inside onChat to check autoTeach
    //   POST /fun/setting body:{autoTeach, threadID?} -> used by "baby autoteach on/off [global]"
    // ==========================
    app.get('/fun/setting', async (req, res) => {
        try {
            const { threadID } = req.query;
            const data = await upstreamGet('/setting', { threadID });
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ message: `⚠️ Server error occurred: ${error.message}` });
        }
    });

    app.post('/fun/setting', async (req, res) => {
        try {
            const { autoTeach, threadID } = req.body || {};
            const data = await upstreamPost('/setting', { autoTeach, threadID });
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ message: `⚠️ Server error occurred: ${error.message}` });
        }
    });

    // ==========================
    //   EXTRA upstream endpoints — not called by baby.js right now, kept
    //   here so another command can use them later
    // ==========================
    app.delete('/fun/deleteTrigger', async (req, res) => {
        try {
            const { trigger } = req.query;
            if (!trigger) return res.status(400).json({ message: "❌ Provide trigger" });
            const data = await upstreamDelete('/deleteTrigger', { trigger });
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ message: `⚠️ Server error occurred: ${error.message}` });
        }
    });

    app.delete('/fun/deleteAsk', async (req, res) => {
        try {
            const { ask } = req.query;
            if (!ask) return res.status(400).json({ message: "❌ Provide ask" });
            const data = await upstreamDelete('/deleteAsk', { ask });
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ message: `⚠️ Server error occurred: ${error.message}` });
        }
    });

    app.delete('/fun/deleteAnswer', async (req, res) => {
        try {
            const { ask, answer } = req.query;
            if (!ask || !answer) return res.status(400).json({ message: "❌ Provide ask and answer" });
            const data = await upstreamDelete('/deleteAnswer', { ask, answer });
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ message: `⚠️ Server error occurred: ${error.message}` });
        }
    });

    app.post('/fun/findQuestion', async (req, res) => {
        try {
            const { answer } = req.body || {};
            if (!answer) return res.status(400).json({ message: "Provide answer" });
            const data = await upstreamPost('/findQuestion', { answer });
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ message: `⚠️ Server error occurred: ${error.message}` });
        }
    });

    app.get('/fun/categories', async (req, res) => {
        try {
            const { limit } = req.query;
            const data = await upstreamGet('/categories', { limit });
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ message: `⚠️ Server error occurred: ${error.message}` });
        }
    });

    app.get('/fun/status', async (req, res) => {
        try {
            const data = await upstreamGet('/status');
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ taughtQuestions: 0, message: `⚠️ Server error occurred: ${error.message}` });
        }
    });
};
