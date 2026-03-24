// Images API endpoint
const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();

// Create a route to handle image requests
router.get('/images', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    // Check if we have an API key
    if (!process.env.UNSPLASH_API_KEY) {
      console.warn('No Unsplash API key provided. Using mock image response.');
      // Return a mock response instead of failing
      return res.json({
        results: [
          {
            urls: {
              regular: `https://via.placeholder.com/800x600?text=${encodeURIComponent(query)}`
            }
          }
        ]
      });
    }

    console.log(`Fetching image for query: "${query}"`);

    // If we have an API key, try to use the Unsplash API
    const unsplashResponse = await axios.get(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1`,
      {
        headers: {
          Authorization: `Client-ID ${process.env.UNSPLASH_API_KEY}`
        }
      }
    );

    res.json(unsplashResponse.data);
  } catch (error) {
    console.error('Unsplash API error:', error);
    // Return a placeholder image instead of an error
    res.json({
      results: [
        {
          urls: {
            regular: `https://via.placeholder.com/800x600?text=${encodeURIComponent(req.query.query || 'Image Unavailable')}`
          }
        }
      ]
    });
  }
});

module.exports = router; 