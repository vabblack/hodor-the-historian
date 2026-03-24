// Generate API endpoint
const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();

// Import the fetchEventImage function from images.js
const imagesRouter = require('./images');

// Helper function to fetch image from Unsplash or return placeholder
async function fetchEventImage(query) {
  try {
    if (!query) {
      console.warn('No query provided for image search.');
      return getDefaultImageData('Missing Query');
    }
    
    console.log(`🔍 Fetching Unsplash image for: "${query}"`);
    
    // Check if we have an API key
    if (!process.env.UNSPLASH_API_KEY) {
      console.warn('No Unsplash API key provided. Using placeholder image.');
      return getDefaultImageData(query);
    }
    
    // If we have an API key, try to use the Unsplash API
    const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;
    console.log(`Making request to: ${unsplashUrl}`);
    
    const unsplashResponse = await axios.get(
      unsplashUrl,
      {
        headers: {
          Authorization: `Client-ID ${process.env.UNSPLASH_API_KEY}`
        },
        timeout: 5000 // 5 second timeout
      }
    );

    if (unsplashResponse.data && unsplashResponse.data.results && unsplashResponse.data.results.length > 0) {
      const image = unsplashResponse.data.results[0];
      console.log(`✅ Successfully found image for "${query}" by ${image.user.name}`);
      return {
        imageUrl: image.urls.regular,
        photographerName: image.user.name,
        photographerUrl: image.user.links.html,
        unsplashUrl: image.links.html // Link to the image page on Unsplash
      };
    } else {
      console.warn(`⚠️ No Unsplash image found for query: "${query}". Using placeholder.`);
      return getDefaultImageData(query);
    }
  } catch (error) {
    console.error(`❌ Unsplash API error for query "${query}":`, error.message);
    // Return placeholder on error
    return getDefaultImageData(query);
  }
}

// Helper function to generate default/placeholder image data
function getDefaultImageData(query) {
  return {
    imageUrl: `https://via.placeholder.com/800x600/4f46e5/ffffff?text=${encodeURIComponent(query.substring(0, 30) || 'Image')}`, // Using via.placeholder.com
    photographerName: 'Placeholder',
    photographerUrl: '#',
    unsplashUrl: '#'
  };
}

// Helper function to get a random category
function getRandomCategory() {
  const categories = ['Political', 'Military', 'Cultural', 'Scientific'];
  return categories[Math.floor(Math.random() * categories.length)];
}

// Helper function to create a structured response from unstructured text
function createStructuredResponse(text) {
  // Simple parsing logic to extract events
  const events = [];
  const lines = text.split('\n');
  let currentEvent = null;
  
  for (const line of lines) {
    if (line.includes('**') || line.match(/^\d+\./)) {
      // This looks like an event title
      if (currentEvent) {
        events.push(currentEvent);
      }
      
      const titleMatch = line.match(/\*\*(.*?)\*\*|^\d+\.\s*(.*)/);
      const title = titleMatch ? (titleMatch[1] || titleMatch[2]) : 'Unknown Event';
      
      // Try to extract a date from the title
      const dateMatch = title.match(/(\d{4})/);
      const date = dateMatch ? `${dateMatch[1]}-01-01` : '1800-01-01';
      
      currentEvent = {
        id: events.length + 1,
        title: title.replace(/^\d+\.\s*/, ''),
        date: date,
        description: '',
        category: getRandomCategory()
      };
    } else if (currentEvent && line.trim() !== '') {
      // This looks like a description
      currentEvent.description += line.trim() + ' ';
    }
  }
  
  // Add the last event
  if (currentEvent) {
    events.push(currentEvent);
  }
  
  // If we couldn't parse any events, create a default
  if (events.length === 0) {
    events.push({
      id: 1,
      title: 'Generated Event',
      date: '1800-01-01',
      description: text.substring(0, 200),
      category: 'Political'
    });
  }
  
  return { timeline: events };
}

// Helper function to get mock timeline response
function getMockTimelineResponse() {
  return {
    timeline: [
      {
        id: 1,
        title: 'Example Event 1',
        date: '1800-01-01',
        description: 'This is an example historical event.',
        category: 'Political',
        imageUrl: 'https://via.placeholder.com/800x600/4f46e5/ffffff?text=Example+Event+1'
      },
      {
        id: 2,
        title: 'Example Event 2',
        date: '1850-01-01',
        description: 'Another example historical event.',
        category: 'Military',
        imageUrl: 'https://via.placeholder.com/800x600/4f46e5/ffffff?text=Example+Event+2'
      },
      {
        id: 3,
        title: 'Example Event 3',
        date: '1900-01-01',
        description: 'A third example historical event.',
        category: 'Cultural',
        imageUrl: 'https://via.placeholder.com/800x600/4f46e5/ffffff?text=Example+Event+3'
      },
      {
        id: 4,
        title: 'Example Event 4',
        date: '1950-01-01',
        description: 'A fourth example historical event.',
        category: 'Scientific',
        imageUrl: 'https://via.placeholder.com/800x600/4f46e5/ffffff?text=Example+Event+4'
      },
      {
        id: 5,
        title: 'Example Event 5',
        date: '2000-01-01',
        description: 'A fifth example historical event.',
        category: 'Political',
        imageUrl: 'https://via.placeholder.com/800x600/4f46e5/ffffff?text=Example+Event+5'
      }
    ]
  };
}

// Create a route to handle generate requests
router.post('/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Check if we have an OpenRouter API key
    if (!process.env.OPENROUTER_API_KEY) {
      console.warn('No OpenRouter API key provided. Using mock timeline response.');
      return res.json(getMockTimelineResponse());
    }

    // Function to make API request with retries
    const makeRequest = async (retries = 3) => {
      try {
        const openRouterResponse = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: "mistralai/mistral-nemo",
            messages: [
              {
                role: "user",
                content: `Create a historical timeline for "${prompt}" with 5-7 key events. 
                Format the response as a valid JSON object with this structure:
                {
                  "timeline": [
                    {
                      "id": 1,
                      "title": "Event Title",
                      "date": "YYYY-MM-DD",
                      "description": "Event description",
                      "category": "Political|Military|Cultural|Scientific"
                    }
                  ]
                }`
              }
            ]
          },
          {
            headers: {
              "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
              "Content-Type": "application/json"
            },
            timeout: 30000 // 30 second timeout
          }
        );

        return openRouterResponse;
      } catch (error) {
        if (retries > 0 && (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT')) {
          console.log(`Retrying OpenRouter API request. Attempts remaining: ${retries - 1}`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
          return makeRequest(retries - 1);
        }
        throw error;
      }
    };

    // Make the API request with retries
    const openRouterResponse = await makeRequest();

    // Extract the AI response text
    const responseText = openRouterResponse.data.choices[0].message.content;
    
    // Find and parse the JSON portion of the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    let timelineData;
    
    if (jsonMatch) {
      try {
        const jsonStr = jsonMatch[0].replace(/[\u201C\u201D]/g, '"'); // Replace smart quotes
        timelineData = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('Error parsing JSON from OpenRouter response:', parseError);
        timelineData = createStructuredResponse(responseText);
      }
    } else {
      timelineData = createStructuredResponse(responseText);
    }

    // --- New Image Fetching Logic ---
    if (timelineData && timelineData.timeline && Array.isArray(timelineData.timeline)) {
      // Use Promise.all to fetch images concurrently
      const imageFetchPromises = timelineData.timeline.map(async (event) => {
        // Use event title as the primary search query, fallback to description if needed
        const searchQuery = event.title || event.description || prompt || 'History Event'; 
        const imageData = await fetchEventImage(searchQuery);
        // Add image data to the event object
        event.imageUrl = imageData.imageUrl;
        event.photographerName = imageData.photographerName;
        event.photographerUrl = imageData.photographerUrl;
        event.unsplashUrl = imageData.unsplashUrl;
        return event; // Return the modified event
      });
      
      // Wait for all image fetches to complete
      timelineData.timeline = await Promise.all(imageFetchPromises);
    }
    // --- End New Image Fetching Logic ---

    console.log(`Generated timeline for "${prompt}" with ${timelineData.timeline.length} events`);
    res.json(timelineData);
  } catch (error) {
    console.error('Error generating timeline:', error);
    console.log('Falling back to mock timeline data');
    return res.json(getMockTimelineResponse());
  }
});

module.exports = router; 