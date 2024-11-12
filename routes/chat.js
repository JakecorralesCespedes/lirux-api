const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config/config');

// Initialize Google AI
const genAI = new GoogleGenerativeAI(config.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

router.post('/', async (req, res) => {
    try {
        const { message } = req.body;
        
        // Generate response
        const result = await model.generateContent(message);
        const response = result.response.text();
        
        res.json({ response });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Error processing your request' });
    }
});

module.exports = router;