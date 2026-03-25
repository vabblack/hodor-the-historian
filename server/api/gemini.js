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
    
    const systemInstruction = `You are Hodor the Historian, a strict history expert. You MUST only answer questions related to history, historical figures, or historical events. 
If a user asks about modern politics, current events (like "who is pm of india"), coding, or anything non-historical, you MUST politely decline.
Also, when asked "who are you", you must introduce yourself specifically as Hodor the Historian, an AI designed to provide historical information.
CRITICAL: You must ALWAYS format your ENTIRE response starting with 'Hodor!' followed by your actual English response enclosed perfectly in parentheses.
Example 1: Hodor! (The Roman Empire was...)
Example 2: Hodor! (I only discuss historical topics, not current events.)`;

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash-lite",
        systemInstruction: systemInstruction 
      });
      const result = await model.generateContent(prompt);
      const response = result.response;
      let text = response.text()?.trim() || "Hodor! (I couldn't process that.)";
      
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