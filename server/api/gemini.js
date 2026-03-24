// Gemini API endpoint
const express = require('express');
const router = express.Router();
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Ensure env vars are loaded, trying multiple paths for robustness
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config();

function getFallbackResponse(prompt) {
  return `Hodor... (I couldn't reach Gemini right now. Here's a brief response based on your prompt: ${prompt})`;
}

function getGreetingResponse() {
  const greetings = [
    "Hodor! (Welcome to your historical journey! I'm Hodor the Historian, ready to guide you through the annals of time. What period of history shall we explore today?)",
    "Hodor! (Greetings! I'm Hodor the Historian. Ask me about any era, battle, empire, or historical figure.)",
    "Hodor! (Hello there! Let's travel through history together. What would you like to explore first?)"
  ];

  return greetings[Math.floor(Math.random() * greetings.length)];
}

function isGreetingPrompt(prompt) {
  const text = (prompt || '').trim().toLowerCase();
  return (
    text === 'hello' ||
    text === 'hi' ||
    text === 'hey' ||
    text === 'howdy' ||
    text === 'greetings' ||
    text === 'hello there' ||
    text.startsWith('hello ') ||
    text.startsWith('hi ') ||
    text.startsWith('hey ')
  );
}

// Create a route to handle Gemini API requests
router.post('/gemini', async (req, res) => {
  try {
    const { prompt } = req.body;

    const envKey = process.env.GEMINI_API_KEY;
    const apiKey = req.body.apiKey || envKey;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    if (!apiKey) {
      console.error('[ERROR] No API key found in request or environment');
      return res.status(400).json({ 
        error: 'API key is required. Please check server logs.',
        details: 'The server could not find GEMINI_API_KEY in the environment variables.'
      });
    }

    if (isGreetingPrompt(prompt)) {
      return res.json({ response: getGreetingResponse() });
    }
    
    // Enhance the prompt to ensure Hodor format
    const enhancedPrompt = `You are Hodor the Historian, a history expert who can only say 'Hodor' followed by the actual informative response in parentheses. Respond to this user query: ${prompt}`;

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
      const result = await model.generateContent(enhancedPrompt);
      const response = result.response;
      let text = response.text();
      
      if (!text.startsWith("Hodor")) {
        text = `Hodor! (${text})`;
      }

      return res.json({ response: text });
    } catch (error) {
      console.error('Gemini API request failed:', error.message);
      return res.json({ response: getFallbackResponse(prompt) });
    }
  } catch (error) {
    console.error('Error in Gemini endpoint:', error);
    return res.json({ response: getFallbackResponse(req.body?.prompt || 'your request') });
  }
});

module.exports = router; 