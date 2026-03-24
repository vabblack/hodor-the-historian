require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = 3000;

// Temporary hardcoded API key for testing
if (!process.env.UNSPLASH_API_KEY) {
  process.env.UNSPLASH_API_KEY = 'ftmgU22_nTDtWqQqgxJYs1BtH0wqUaWlzRq2D2eljrk';
}

// Initialize the Gemini API client (will use mock responses if key is invalid)
let genAI = null;
try {
  if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log('Gemini API client initialized');
  } else {
    console.warn('No GEMINI_API_KEY found. Will use mock responses.');
  }
} catch (error) {
  console.error('Error initializing Gemini API client:', error.message);
  console.warn('Will use mock responses instead.');
}

// Middleware
app.use(cors());
app.use(express.json());

// Configure static files with proper MIME types
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Add the Gemini API endpoint
app.post('/api/gemini', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      console.warn('Empty prompt received');
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log(`Received prompt: "${prompt}"`);
    
    // Check for greetings or simple messages first
    const lowercasePrompt = prompt.toLowerCase().trim();
    if (
      lowercasePrompt === 'hello' || 
      lowercasePrompt === 'hi' || 
      lowercasePrompt === 'hey' || 
      lowercasePrompt === 'howdy' ||
      lowercasePrompt === 'hello there' ||
      lowercasePrompt === 'greetings' ||
      lowercasePrompt.startsWith('hello') ||
      lowercasePrompt.startsWith('hi ') ||
      lowercasePrompt.startsWith('hey ')
    ) {
      console.log('Matched greeting pattern - returning direct response');
      const greetings = [
        "Hodor! (Hello there! I'm Hodor the Historian. What historical topic would you like to learn about today?)",
        "Hodor! (Greetings! I specialize in historical knowledge. Ask me about any historical period or event!)",
        "Hodor! (Hi there! Ready to explore history together? What era interests you most?)",
        "Hodor! (Hello! I can tell you about ancient civilizations, famous battles, historical figures, and more. What would you like to know?)"
      ];
      return res.json({ response: greetings[Math.floor(Math.random() * greetings.length)] });
    }

    // If you have a Gemini API key and client initialized, use it
    if (process.env.GEMINI_API_KEY && genAI) {
      try {
        // Try with gemini-1.5-flash first
        console.log("Attempting to use gemini-1.5-flash model...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        // Enhance the prompt to ensure Hodor format
        const enhancedPrompt = `You are Hodor the Historian, a history expert who can only say 'Hodor' followed by the actual informative response in parentheses. Respond to this user query: ${prompt}`;
        
        // Generate content
        const result = await model.generateContent(enhancedPrompt);
        const response = result.response;
        const text = response.text();
        
        console.log("Successfully generated response with gemini-1.5-flash");
        
        // Ensure response has the 'Hodor!' format
        let formattedResponse = text;
        if (!formattedResponse.startsWith("Hodor")) {
          formattedResponse = `Hodor! (${text})`;
        }
        
        return res.json({ response: formattedResponse });
      } catch (error) {
        console.error('Gemini API error with gemini-1.5-flash:', error.message);
        console.error('Full error:', error);
        
        // For API key/auth errors, immediately fall back to mock (don't try fallback model)
        const errorMsg = (error.message || error.toString() || '').toLowerCase();
        if (errorMsg.includes('api key') || errorMsg.includes('401') || errorMsg.includes('403') || 
            errorMsg.includes('400') || errorMsg.includes('invalid') || errorMsg.includes('unauthorized') ||
            errorMsg.includes('forbidden') || errorMsg.includes('bad request')) {
          console.warn('API authentication/request issue detected. Falling back to mock response.');
          const mockResponse = getMockGeminiResponse(prompt);
          return res.json({ response: mockResponse });
        }
        
        // If gemini-1.5-flash fails for other reasons, try with gemini-pro
        try {
          console.log("Attempting fallback to gemini-pro model...");
          const fallbackModel = genAI.getGenerativeModel({ model: "gemini-pro" });
          
          // Enhance the prompt to ensure Hodor format
          const enhancedPrompt = `You are Hodor the Historian, a history expert who can only say 'Hodor' followed by the actual informative response in parentheses. Respond to this user query: ${prompt}`;
          
          // Generate content with fallback model
          const fallbackResult = await fallbackModel.generateContent(enhancedPrompt);
          const fallbackResponse = fallbackResult.response;
          const fallbackText = fallbackResponse.text();
          
          console.log("Successfully generated response with gemini-pro");
          
          // Ensure response has the 'Hodor!' format
          let formattedResponse = fallbackText;
          if (!formattedResponse.startsWith("Hodor")) {
            formattedResponse = `Hodor! (${fallbackText})`;
          }
          
          return res.json({ response: formattedResponse });
        } catch (fallbackError) {
          console.error('Gemini API error with gemini-pro:', fallbackError.message);
          console.error('Full fallback error:', fallbackError);
          
          // If both models fail, return mock response
          console.log("All API attempts failed. Using mock response.");
          const mockResponse = getMockGeminiResponse(prompt);
          console.log(`Returning mock response: "${mockResponse.substring(0, 50)}..."`);
          return res.json({ response: mockResponse });
        }
      }
    } else {
      // Use mock response if no API key is available
      console.warn('No Gemini API key provided. Using mock response.');
      const mockResponse = getMockGeminiResponse(prompt);
      console.log(`Returning mock response: "${mockResponse.substring(0, 50)}..."`);
      return res.json({ response: mockResponse });
    }
  } catch (error) {
    console.error('Error in Gemini endpoint:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to process request', 
      details: error.message,
      response: "Hodor... (Sorry, I encountered an error processing your request. Please try again.)"
    });
  }
});

// Helper function to generate mock Gemini responses
function getMockGeminiResponse(prompt) {
  // Extract the actual user query if the prompt contains the system instruction
  let actualQuery = prompt || "";
  
  // Remove the "You are Hodor..." prefix if present - be more aggressive
  const prefixPatterns = [
    /you are hodor the historian[^:]*:\s*/i,
    /you are.*hodor.*historian.*:\s*/i,
    /respond to this user query:\s*/i,
    /user query:\s*/i
  ];
  
  for (const pattern of prefixPatterns) {
    if (pattern.test(actualQuery)) {
      actualQuery = actualQuery.replace(pattern, '').trim();
    }
  }
  
  // Also check for "respond to this user query:" pattern and extract what comes after
  const queryMatch = actualQuery.match(/respond to this user query:\s*(.+)/i);
  if (queryMatch && queryMatch[1]) {
    actualQuery = queryMatch[1].trim();
  }
  
  // If the query still contains "You are", try to extract everything after the last colon
  if (actualQuery.toLowerCase().includes('you are')) {
    const colonIndex = actualQuery.lastIndexOf(':');
    if (colonIndex !== -1) {
      actualQuery = actualQuery.substring(colonIndex + 1).trim();
    }
  }
  
  // Ensure consistent input handling
  let lowercasePrompt = actualQuery.toLowerCase().trim();
  console.log(`[MOCK RESPONSE] Original prompt: "${prompt}"`);
  console.log(`[MOCK RESPONSE] Extracted query: "${lowercasePrompt}"`);
  
  // If extraction failed and we still have the full prompt, try to use the original prompt for matching
  let searchPrompt = lowercasePrompt;
  if (lowercasePrompt.length < 3 || lowercasePrompt === prompt.toLowerCase().trim()) {
    // Extraction might have failed, try the original prompt
    const originalLower = (prompt || "").toLowerCase().trim();
    console.log(`[MOCK RESPONSE] Extraction may have failed, also checking original: "${originalLower}"`);
    
    // Try to find the actual question in the original prompt
    const questionPatterns = [
      /(?:what|who|when|where|why|how|tell me|explain|describe).+$/i,
      /(?:about|regarding|concerning)\s+(.+)$/i
    ];
    
    for (const pattern of questionPatterns) {
      const match = originalLower.match(pattern);
      if (match && match[0]) {
        searchPrompt = match[0].toLowerCase().trim();
        console.log(`[MOCK RESPONSE] Found question pattern: "${searchPrompt}"`);
        break;
      }
    }
    
    // If still no good extraction, use original but remove common prefixes
    if (searchPrompt === lowercasePrompt) {
      searchPrompt = originalLower
        .replace(/you are.*historian.*:/gi, '')
        .replace(/respond to this user query:/gi, '')
        .replace(/user query:/gi, '')
        .trim();
    }
  }
  
  // Now check patterns against the search prompt
  console.log(`[MOCK RESPONSE] Final search prompt: "${searchPrompt}"`);
  
  // Check all patterns against the search prompt
  const testPrompt = searchPrompt;
  
  // Historical figures - check first
  if (testPrompt.includes('hitler') || testPrompt.includes('adolf')) {
    console.log('[MOCK RESPONSE] Matched: Hitler');
    return "Hodor! (Adolf Hitler (1889-1945) was the leader of Nazi Germany from 1933 to 1945. He rose to power as the head of the Nazi Party, becoming Chancellor in 1933 and Führer in 1934. His aggressive foreign policy and ideology of Aryan supremacy led to World War II and the Holocaust, resulting in the deaths of millions. He committed suicide in his Berlin bunker in April 1945 as Allied forces closed in.)";
  }
  
  if (testPrompt.includes('napoleon')) {
    console.log('[MOCK RESPONSE] Matched: Napoleon');
    return "Hodor! (Napoleon Bonaparte (1769-1821) was a French military leader and emperor who rose to prominence during the French Revolution. He became Emperor of France in 1804 and conquered much of Europe before his defeat at Waterloo in 1815. He was exiled to Saint Helena where he died in 1821.)";
  }
  
  if (testPrompt.includes('cleopatra')) {
    console.log('[MOCK RESPONSE] Matched: Cleopatra');
    return "Hodor! (Cleopatra VII (69-30 BCE) was the last active ruler of the Ptolemaic Kingdom of Egypt. She was known for her intelligence, political acumen, and relationships with Julius Caesar and Mark Antony. Her death marked the end of the Hellenistic period and the beginning of Roman rule in Egypt.)";
  }
  
  if (testPrompt.includes('caesar') || testPrompt.includes('julius')) {
    console.log('[MOCK RESPONSE] Matched: Caesar');
    return "Hodor! (Julius Caesar (100-44 BCE) was a Roman general, statesman, and dictator who played a critical role in the events that led to the demise of the Roman Republic and the rise of the Roman Empire. He was assassinated in 44 BCE by a group of senators led by Brutus and Cassius.)";
  }
  
  // Wars
  if (testPrompt.includes('world war')) {
    if (testPrompt.includes('world war 1') || testPrompt.includes('world war i') || testPrompt.includes('ww1') || testPrompt.includes('ww i')) {
      console.log('[MOCK RESPONSE] Matched: WWI');
      return "Hodor! (World War I (1914-1918) was a global conflict triggered by the assassination of Archduke Franz Ferdinand. It involved the Allies (France, Russia, Britain, and later the US) against the Central Powers (Germany, Austria-Hungary, Ottoman Empire). The war introduced trench warfare and modern weapons, resulting in over 16 million deaths.)";
    }
    console.log('[MOCK RESPONSE] Matched: WWII');
    return "Hodor! (World War II (1939-1945) was a global conflict from 1939 to 1945. It began when Germany invaded Poland, leading Britain and France to declare war. The United States joined after Japan attacked Pearl Harbor in 1941. The war ended with Germany's surrender in May 1945 and Japan's surrender in September 1945 following the atomic bombings of Hiroshima and Nagasaki.)";
  }
  
  if (testPrompt.includes('civil war')) {
    console.log('[MOCK RESPONSE] Matched: Civil War');
    return "Hodor! (The American Civil War (1861-1865) was fought between the Northern states (Union) and Southern states (Confederacy) over slavery and states' rights. The war resulted in the abolition of slavery and the preservation of the Union, but at the cost of over 600,000 lives.)";
  }
  
  // Ancient civilizations
  if (testPrompt.includes('roman') || testPrompt.includes('rome')) {
    console.log('[MOCK RESPONSE] Matched: Rome');
    return "Hodor! (The Roman Empire was one of history's greatest civilizations, spanning from 27 BCE to 476 CE (Western) and 1453 CE (Eastern/Byzantine). At its height under Emperor Trajan, it controlled territories across Europe, North Africa, and the Middle East. Roman innovations in engineering, law, and governance continue to influence our world today.)";
  }
  
  if (testPrompt.includes('egypt') || testPrompt.includes('pyramid') || testPrompt.includes('pharaoh')) {
    console.log('[MOCK RESPONSE] Matched: Egypt');
    return "Hodor! (Ancient Egypt was a civilization in North Africa along the Nile River, lasting from around 3100 BCE to 30 BCE. The Great Pyramid of Giza, built for Pharaoh Khufu around 2560 BCE, is the only remaining wonder of the ancient world. Egyptians developed hieroglyphics, practiced mummification, and created remarkable architectural achievements.)";
  }
  
  if (testPrompt.includes('greece') || testPrompt.includes('greek') || testPrompt.includes('athens') || testPrompt.includes('sparta')) {
    console.log('[MOCK RESPONSE] Matched: Greece');
    return "Hodor! (Ancient Greece was a civilization that flourished from around 800 BCE to 146 BCE. It was known for its city-states (especially Athens and Sparta), philosophy (Socrates, Plato, Aristotle), democracy, art, architecture, and the Olympic Games. Greek culture heavily influenced the Roman Empire and Western civilization.)";
  }
  
  // Historical periods
  if (testPrompt.includes('renaissance')) {
    console.log('[MOCK RESPONSE] Matched: Renaissance');
    return "Hodor! (The Renaissance was a period of European cultural, artistic, political, and scientific 'rebirth' after the Middle Ages. Beginning in the 14th century in Italy, it spread across Europe by the 16th and 17th centuries. It was characterized by a renewed interest in classical antiquity, the rise of humanism, and revolutionary art by masters like Leonardo da Vinci and Michelangelo.)";
  }
  
  if (testPrompt.includes('industrial revolution')) {
    console.log('[MOCK RESPONSE] Matched: Industrial Revolution');
    return "Hodor! (The Industrial Revolution was a period of major industrialization and innovation that took place during the late 1700s and early 1800s. Beginning in Great Britain, it quickly spread throughout Western Europe and North America. This transition included going from hand production methods to machines, new chemical manufacturing, iron production processes, the increasing use of steam power, and the development of machine tools.)";
  }
  
  if (testPrompt.includes('cold war')) {
    console.log('[MOCK RESPONSE] Matched: Cold War');
    return "Hodor! (The Cold War was a period of geopolitical tension between the United States and the Soviet Union and their respective allies, the Western Bloc and the Eastern Bloc, which began following World War II. It lasted from 1947 to 1991, ending with the dissolution of the Soviet Union. The term 'cold' is used because there was no large-scale fighting directly between the two superpowers.)";
  }
  
  if (testPrompt.includes('middle ages') || testPrompt.includes('medieval')) {
    console.log('[MOCK RESPONSE] Matched: Middle Ages');
    return "Hodor! (The Middle Ages, also known as the Medieval period, lasted from approximately the 5th to the 15th century. It began with the fall of the Western Roman Empire and ended with the Renaissance. This era was characterized by feudalism, the rise of Christianity, the Crusades, and significant developments in art, architecture, and learning.)";
  }
  
  // If the query contains historical keywords but doesn't match specific patterns, provide a helpful response
  const historicalKeywords = ['history', 'historical', 'ancient', 'war', 'battle', 'empire', 'king', 'queen', 'emperor', 'revolution', 'century', 'bc', 'ad', 'bce', 'ce', 'tell', 'about', 'what', 'who', 'when', 'where', 'explain', 'describe'];
  const hasHistoricalContext = historicalKeywords.some(keyword => testPrompt.includes(keyword));
  
  // If it's a question (contains question words) or has historical context, try to give a more helpful response
  const isQuestion = /^(what|who|when|where|why|how|tell|explain|describe|can you)/i.test(testPrompt.trim());
  
  if ((hasHistoricalContext || isQuestion) && testPrompt.length > 3) {
    console.log(`[MOCK RESPONSE] Has historical context or is a question. Query: "${actualQuery}"`);
    
    // Try to identify what they're asking about
    let topic = actualQuery;
    
    // Remove question words and common phrases
    topic = topic.replace(/^(what|who|when|where|why|how|tell me|explain|describe|can you tell me|do you know)\s+/i, '');
    topic = topic.replace(/\?/g, '').trim();
    
    // If topic is still meaningful, use it in the response
    if (topic.length > 3 && topic.length < 100) {
      return `Hodor! (You're asking about "${topic}". That's a great historical question! Unfortunately, my AI capabilities are currently limited, but I can tell you about specific topics like World Wars, Ancient Rome, Ancient Egypt, the Renaissance, historical figures like Napoleon or Hitler, and major historical periods. Could you try asking about one of these specific topics?)`;
    }
    
    // Try to provide a contextual response based on keywords found
    return `Hodor! (That's an interesting historical question! While I'd love to provide a detailed answer, my AI capabilities are currently limited. I can tell you about specific topics like World Wars, Ancient Rome, Ancient Egypt, the Renaissance, historical figures like Napoleon or Hitler, and major historical periods. Could you ask about one of these topics, or be more specific about what you'd like to know?)`;
  }
  
  // If it's a very short query that doesn't match anything, it might be a typo or unclear
  if (testPrompt.length <= 3) {
    console.log(`[MOCK RESPONSE] Query too short: "${actualQuery}"`);
    return "Hodor! (I didn't quite understand that. Could you ask me about a specific historical topic? For example, you could ask about World War II, Ancient Rome, the Renaissance, or historical figures like Napoleon or Cleopatra.)";
  }
  
  // Improved fallback response
  console.log(`[MOCK RESPONSE] No match found. Using generic fallback. Query was: "${actualQuery}", search prompt: "${testPrompt}"`);
  return "Hodor! (I'd be happy to tell you about various historical topics! You can ask me about ancient civilizations like Egypt, Greece, or Rome, major conflicts like World War I or II, periods like the Renaissance or Industrial Revolution, or historical figures like Napoleon, Cleopatra, or Julius Caesar. What specific aspect of history interests you?)";
}

// API Routes
// Wikipedia API endpoint
app.get('/api/wikipedia', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const wikipediaResponse = await axios.get(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        query
      )}&format=json&origin=*`
    );

    res.json(wikipediaResponse.data);
  } catch (error) {
    console.error('Wikipedia API error:', error);
    res.status(500).json({ error: 'Failed to fetch data from Wikipedia' });
  }
});

// Unsplash API endpoint
app.get('/api/images', async (req, res) => {
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
    
    console.log(`Using Unsplash API key: ${process.env.UNSPLASH_API_KEY.substring(0, 5)}...`);

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

// AI completion endpoint using OpenRouter instead of OpenAI
app.post('/api/generate', async (req, res) => {
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

    res.json(timelineData);
  } catch (error) {
    console.error('OpenRouter API error:', error);
    res.json(getMockTimelineResponse());
  }
});

// Helper function to get mock timeline response
function getMockTimelineResponse() {
  return {
    timeline: [
      {
        id: 1,
        title: 'Example Event 1',
        date: '1800-01-01',
        description: 'This is an example historical event.',
        category: 'Political'
      },
      {
        id: 2,
        title: 'Example Event 2',
        date: '1850-01-01',
        description: 'Another example historical event.',
        category: 'Military'
      }
    ]
  };
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

// Helper function to get a random category
function getRandomCategory() {
  const categories = ['Political', 'Military', 'Cultural', 'Scientific'];
  return categories[Math.floor(Math.random() * categories.length)];
}

// Serve timeline.html for /timeline route
app.get('/timeline', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'timeline.html'));
});

// Serve timelines.html for /timelines route
app.get('/timelines', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'timelines.html'));
});

// Serve create.html for /create route
app.get('/create', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'create.html'));
});

// Catch-all route for other pages
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Test route for Unsplash API
app.get('/test-unsplash', async (req, res) => {
  try {
    // Use a simple test query
    const testQuery = "apple";
    
    console.log(`🧪 Testing Unsplash API with query: "${testQuery}"`);
    console.log(`API Key being used: ${process.env.UNSPLASH_API_KEY.substring(0, 5)}...`);
    
    // Make the API call
    const testImage = await fetchEventImage(testQuery);
    
    // Return a simple HTML page with the test results
    res.send(`
      <html>
        <head>
          <title>Unsplash API Test</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            img { max-width: 100%; border-radius: 8px; }
            .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-top: 20px; }
            .success { background-color: #d4edda; border-color: #c3e6cb; }
            .error { background-color: #f8d7da; border-color: #f5c6cb; }
            pre { background: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto; }
          </style>
        </head>
        <body>
          <h1>Unsplash API Test Results</h1>
          
          <div class="${testImage.photographerName !== 'Placeholder' ? 'card success' : 'card error'}">
            <h2>${testImage.photographerName !== 'Placeholder' ? '✅ Test Successful' : '❌ Test Failed'}</h2>
            <p><strong>Query:</strong> ${testQuery}</p>
            <p><strong>API Key Used:</strong> ${process.env.UNSPLASH_API_KEY.substring(0, 5)}...</p>
            
            <h3>Image Results:</h3>
            <img src="${testImage.imageUrl}" alt="Test Image">
            
            <h3>Attribution:</h3>
            <p>Photographer: ${testImage.photographerName}</p>
            <p>Photographer URL: <a href="${testImage.photographerUrl}" target="_blank">${testImage.photographerUrl}</a></p>
            <p>Unsplash URL: <a href="${testImage.unsplashUrl}" target="_blank">${testImage.unsplashUrl}</a></p>
          </div>
          
          <p><a href="/">Back to Home</a></p>
        </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send(`
      <html>
        <head>
          <title>Unsplash API Test - Error</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .error { background-color: #f8d7da; border-color: #f5c6cb; border: 1px solid; padding: 20px; border-radius: 8px; }
          </style>
        </head>
        <body>
          <h1>Unsplash API Test - Error</h1>
          
          <div class="error">
            <h2>❌ Test Failed</h2>
            <p><strong>Error:</strong> ${error.message}</p>
            <pre>${error.stack}</pre>
          </div>
          
          <p><a href="/">Back to Home</a></p>
        </body>
      </html>
    `);
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Timeline view at http://localhost:${PORT}/timeline`);
  console.log(`Timelines list at http://localhost:${PORT}/timelines`);
  
  // Print API key status
  if (!process.env.UNSPLASH_API_KEY) {
    console.log('Note: No Unsplash API key provided. Placeholder images will be used.');
  }
  
  if (!process.env.OPENROUTER_API_KEY) {
    console.log('Note: No OpenRouter API key provided. Mock timeline data will be used.');
  }
}); 