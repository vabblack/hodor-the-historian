// Timeline View JavaScript

// Constants for image handling

// --- Data for constructing API queries ---
// Use these keywords to guide Pexels API searches
const WWII_EVENT_KEYWORDS = {
  'German Invasion of Poland': 'WWII German invasion Poland 1939', 
  'France Surrenders': 'WWII France surrender Compiègne 1940', 
  'Operation Barbarossa': 'WWII Operation Barbarossa Eastern Front 1941', 
  'Pearl Harbor Attack': 'WWII Pearl Harbor attack naval 1941', 
  'Battle of Midway': 'WWII Battle of Midway naval Pacific 1942', 
  'D-Day': 'WWII D-Day Normandy landing 1944', 
  'V-E Day': 'WWII V-E Day victory Europe celebration 1945', 
  'Atomic Bombing of Hiroshima': 'WWII Hiroshima atomic bomb Japan 1945', 
  'Japanese Surrender': 'WWII Japanese surrender USS Missouri 1945' 
};

const SPACE_RACE_EVENT_KEYWORDS = {
    'Sputnik 1 Launch': 'Sputnik 1 satellite launch 1957',
    'Yuri Gagarin First Human in Space': 'Yuri Gagarin Vostok 1 space flight 1961',
    'Kennedy\'s Moon Shot Speech': 'Kennedy moon landing speech congress 1961',
    'Apollo 11 Moon Landing': 'Apollo 11 moon landing lunar module 1969',
    'Apollo-Soyuz Test Project': 'Apollo Soyuz handshake space dock 1975'
};

const CATEGORY_KEYWORDS = {
  'military': 'WWII military battle historical', 
  'political': 'historical political leaders diplomacy meeting', 
  'cultural': 'historical culture society impact event', 
  'scientific': 'historical science technology discovery',
  'milestone': 'historical achievement milestone event'
};

// Default fallback image URLs (used ONLY if API fails)
const DEFAULT_WWII_IMAGE_URL = 'https://images.pexels.com/photos/159448/war-veteran-war-world-war-the-grandfather-159448.jpeg?auto=compress&cs=tinysrgb&w=800';
const DEFAULT_SPACE_RACE_IMAGE_URL = 'https://images.pexels.com/photos/586056/pexels-photo-586056.jpeg?auto=compress&cs=tinysrgb&w=800';

// Replacements for non-timeline images (e.g., on index page)
const DIRECT_REPLACEMENTS = {
  'American Revolution': 'https://images.pexels.com/photos/3551227/pexels-photo-3551227.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Evolution of Computing': 'https://images.pexels.com/photos/5474028/pexels-photo-5474028.jpeg?auto=compress&cs=tinysrgb&w=800'
  // Add others if needed for index/timelines pages
};

// Debug mode flag
const DEBUG_MODE = true; // Enable logging

// Utility function for controlled logging
function debugLog(message, error = false) {
  if (DEBUG_MODE || error) {
    console[error ? 'error' : 'log'](message);
  }
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', initializeTimeline);

async function initializeTimeline() {
  debugLog("Initializing dynamic timeline view...");
  addLoadingStyles(); // Ensure loading styles are present

  const timelineTitleElement = document.getElementById('timelineTitle');
  const timelineTopic = timelineTitleElement ? timelineTitleElement.textContent.trim() : 'Unknown Topic';
  debugLog(`Timeline topic detected: ${timelineTopic}`);

  const timelineContainer = document.getElementById('timelineContainer');
  const loadingIndicator = document.getElementById('timeline-loading');
  const timelineContent = document.getElementById('timeline-content');

  if (!timelineContainer || !loadingIndicator || !timelineContent) {
    debugLog("Essential timeline elements not found in DOM.", true);
    return;
  }

  // Show loading indicator immediately
  loadingIndicator.style.display = 'flex';
  timelineContent.style.display = 'none'; // Hide content area initially

  try {
    // Fetch timeline data from the backend
    const timelineData = await fetchTimelineData(timelineTopic);

    // *** ADDED CONSOLE LOG HERE ***
    console.log("--- Fetched Timeline Data ---");
    console.dir(timelineData); // Use console.dir for better object inspection
    // *** END ADDED CONSOLE LOG ***

    if (timelineData && timelineData.timeline && timelineData.timeline.length > 0) {
      debugLog(`Received ${timelineData.timeline.length} events from backend.`);
      // Render the events using the fetched data
      renderTimelineEvents(timelineData.timeline);
      // Show the content now that it's rendered
      showTimelineContent();
    } else {
      debugLog("No valid timeline data received from backend or timeline is empty.", true);
      // Display a message indicating no data or an error
      timelineContent.innerHTML = '<p class="text-center text-gray-600 py-8">Could not load timeline events. Please try again later.</p>';
      showTimelineContent(); // Show the error message
    }

    // Setup UI interactions (filters, dark mode, etc.)
    setupInteractions();

  } catch (error) {
    debugLog(`Error initializing timeline: ${error.message}`, true);
    // Display a generic error message
    timelineContent.innerHTML = '<p class="text-center text-red-600 py-8">An error occurred while loading the timeline. Please check the console for details.</p>';
    showTimelineContent(); // Show the error message
  } finally {
     // Hide loading indicator regardless of outcome
     loadingIndicator.style.display = 'none';
  }
}

// --- Timeline Data Fetching ---
async function fetchTimelineData(topic) {
  debugLog(`Fetching timeline data for topic: "${topic}" from /api/generate`);
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: topic }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    debugLog("Successfully fetched data from /api/generate:", data);
    return data; // Expected format: { timeline: [...] }

  } catch (error) {
    debugLog(`Error fetching timeline data from backend: ${error.message}`, true);
    throw error; // Re-throw error to be caught by initializeTimeline
  }
}

// --- Timeline Rendering ---
function renderTimelineEvents(events) {
  const timelineContent = document.getElementById('timeline-content');
  const timelineContainer = document.getElementById('timelineContainer'); // Needed for alternating classes

  if (!timelineContent || !timelineContainer) {
      debugLog("Timeline content or container element not found for rendering.", true);
      return;
  }

  // Clear existing placeholder content (except the timeline line)
  timelineContent.innerHTML = '<div class="timeline-line"></div>'; // Keep the central line

  let side = 'left'; // Start with left

  events.forEach((event, index) => {
    const eventElement = document.createElement('div');
    eventElement.classList.add('timeline-event', `timeline-${side}`);
    eventElement.dataset.category = event.category?.toLowerCase() || 'general'; // Use lowercase for category data attribute

    // Map categories to colors/icons (adjust as needed)
    const categoryInfo = getCategoryInfo(event.category);

    eventElement.innerHTML = `
      <div class="timeline-content">
        <div class="timeline-dot" style="background-color: ${categoryInfo.color};"></div>
        <div class="timeline-date">${formatDate(event.date)}</div>
        <div class="timeline-card">
          <div class="timeline-image">
            <!-- Image SRC and attribution now set directly -->
            <img 
              src="${event.imageUrl || ''}" 
              alt="${event.title || 'Timeline event image'}" 
              class="w-full h-48 object-cover" 
              onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='none';"
            >
            <!-- Image Attribution -->
            ${event.imageUrl && event.photographerName !== 'Placeholder' ? `
            <p class="image-attribution text-xs text-gray-400 p-1 bg-black bg-opacity-50 absolute bottom-0 left-0 w-full">
              Photo by <a href="${event.photographerUrl}?utm_source=history_weaver&utm_medium=referral" target="_blank" rel="noopener noreferrer" class="underline hover:text-white">${event.photographerName}</a>
              on <a href="${event.unsplashUrl}?utm_source=history_weaver&utm_medium=referral" target="_blank" rel="noopener noreferrer" class="underline hover:text-white">Unsplash</a>
            </p>` : ''}
          </div>
          <div class="timeline-card-content">
            <div class="mb-2">
              <span class="timeline-category-badge" style="background-color: ${categoryInfo.badgeBg}; color: ${categoryInfo.badgeColor};">
                <i class="fas ${categoryInfo.icon} mr-1"></i> ${event.category || 'General'}
              </span>
            </div>
            <h3 class="timeline-event-title">${event.title}</h3>
            <p class="timeline-event-description">${event.description}</p>
            <div class="mt-4 flex justify-end">
              <button class="text-indigo-600 hover:text-indigo-800 text-sm flex items-center learn-more-btn" data-event-id="${event.id || index}">
                <i class="fas fa-info-circle mr-1"></i> Learn more
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    timelineContent.appendChild(eventElement);

    // Add 'visible' class with a staggered delay for animation
    setTimeout(() => {
        eventElement.classList.add('visible');
    }, 100 * (index + 1)); // Stagger by 100ms per item

    // Alternate sides for traditional timeline view
    side = side === 'left' ? 'right' : 'left';
  });
}

// Helper to get style info based on category
function getCategoryInfo(category) {
    const defaultInfo = { color: '#9CA3AF', icon: 'fa-calendar-alt', badgeBg: '#F3F4F6', badgeColor: '#4B5563' }; // Gray default
    if (!category) return defaultInfo;

    switch (category.toLowerCase()) {
        case 'political': return { color: '#3B82F6', icon: 'fa-landmark', badgeBg: '#DBEAFE', badgeColor: '#1E40AF' }; // Blue
        case 'military': return { color: '#EF4444', icon: 'fa-fighter-jet', badgeBg: '#FEE2E2', badgeColor: '#B91C1C' }; // Red
        case 'cultural': return { color: '#A855F7', icon: 'fa-theater-masks', badgeBg: '#F3E8FF', badgeColor: '#7E22CE' }; // Purple
        case 'scientific': return { color: '#10B981', icon: 'fa-flask', badgeBg: '#D1FAE5', badgeColor: '#065F46' }; // Green
        case 'milestone': return { color: '#FBBF24', icon: 'fa-flag-checkered', badgeBg: '#FEF3C7', badgeColor: '#92400E' }; // Yellow/Amber
        default: return defaultInfo;
    }
}

// Helper to format dates (optional, adjust as needed)
function formatDate(dateString) {
    // Basic check if it looks like YYYY-MM-DD
    if (/^\\d{4}-\\d{2}-\\d{2}$/.test(dateString)) {
        try {
            const date = new Date(dateString + 'T00:00:00Z'); // Treat as UTC to avoid timezone issues
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
        } catch (e) {
            debugLog(`Error formatting date ${dateString}: ${e.message}`);
            return dateString; // Return original if parsing fails
        }
    }
    return dateString; // Return original if not in expected format
}

// --- Image Handling (API Focused) ---

// Function to replace direct Unsplash/Pexels images (if any, outside timeline)
function replaceDirectExternalImages() {
  const allImages = document.querySelectorAll('img:not(.timeline-image img)'); // Select images NOT in timeline cards
  let replacedCount = 0;
  
  allImages.forEach((img, index) => {
    try {
      const src = img.src || '';
      const alt = img.alt || '';

      // Check for external image hosts we want to replace
      if (src.includes('unsplash.com') || (src.includes('pexels.com') && !src.startsWith('data:'))) {
         debugLog(`Found direct external image (alt: "${alt}"). Replacing.`);
         replacedCount++;
         // Prioritize direct replacement map if alt matches
         if (alt && DIRECT_REPLACEMENTS[alt]) {
             img.src = DIRECT_REPLACEMENTS[alt];
             img.onerror = () => setDefaultImage(img); 
         } else {
             // If no direct replacement, fetch based on alt text using API
             img.classList.add('loading');
             let query = alt ? alt + ' historical' : 'historical background'; // Use alt or a generic term
             fetchAndSetImageFromAPI(img, query);
         }
      }
    } catch (error) {
      debugLog(`Error replacing direct external image ${index}: ${error.message}`, true);
    }
  });
  
  if (replacedCount > 0) {
     debugLog(`Attempted replacement for ${replacedCount} direct external images.`);
  }
}

// --- UI Interaction & Display ---

function showTimelineContent() {
  const loadingIndicator = document.getElementById('timeline-loading');
  const timelineContent = document.getElementById('timeline-content');

  if (loadingIndicator) loadingIndicator.style.display = 'none';
  if (timelineContent) {
      timelineContent.classList.remove('hidden'); // Explicitly remove the hidden class
      timelineContent.style.display = 'block'; // Ensure it's displayed as a block
  }
  debugLog("Timeline content displayed.");
}

// --- Event Handling Setup ---
function setupInteractions() {
  debugLog("Setting up interactive UI elements...");
  setupCategoryFilters();
  setupTimePeriodFilter();
  setupLearnMoreButtons();
  setupDownloadButton();
  setupEditButton();
  setupDarkMode();
  setupMobileMenu();
  setupChatModal();
  setupShareButton();
}

// Add this new function to handle dynamically added learn more buttons
function setupLearnMoreButtons() {
    const timelineContent = document.getElementById('timeline-content');
    if (timelineContent) {
        timelineContent.addEventListener('click', function(event) {
            const button = event.target.closest('.learn-more-btn');
            if (button) {
                const eventId = button.dataset.eventId;
                // Find the corresponding event data if needed (might require storing data)
                const eventTitleElement = button.closest('.timeline-card-content')?.querySelector('.timeline-event-title');
                const eventTitle = eventTitleElement ? eventTitleElement.textContent : `event ID ${eventId}`;
                debugLog(`Learn more clicked for: ${eventTitle}`);
                // Simple alert for now
                alert(`Learn more functionality for "${eventTitle}" is not yet implemented.`);
            }
        });
        debugLog("Learn more button listeners setup.");
    }
}

// Add this new function (if not already present)
function setupTimePeriodFilter() {
    const filter = document.getElementById('timePeriodFilter');
    if (filter) {
        filter.addEventListener('change', handleFiltering);
        debugLog("Time period filter setup.");
    }
}

// Add this new function (if not already present)
function setupDownloadButton() {
    const btn = document.getElementById('downloadTimelineBtn');
    if (btn) {
        btn.addEventListener('click', () => {
             debugLog("Download timeline button clicked.");
             // The actual download functionality is now implemented in timeline.html
        });
        debugLog("Download button listener setup.");
    }
}

// Add this new function (if not already present)
function setupEditButton() {
    const btn = document.getElementById('editTimelineBtn');
    if (btn) {
        btn.addEventListener('click', () => {
             debugLog("Edit timeline button clicked.");
             alert("Edit functionality not implemented yet.");
             // Future: Redirect to edit page or enable inline editing
        });
        debugLog("Edit button listener setup.");
    }
}

// Add this new function (if not already present)
function setupDarkMode() {
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  if (!darkModeToggle) return;

  // Apply dark mode by default
  if (localStorage.getItem('darkMode') === null) {
    localStorage.setItem('darkMode', 'enabled');
  }

  // Apply dark mode on initial load if set (now default)
  if (localStorage.getItem('darkMode') === 'enabled') {
    document.body.classList.add('dark-mode');
    const icon = darkModeToggle.querySelector('i');
    if (icon) {
      icon.classList.remove('fa-moon');
      icon.classList.add('fa-sun');
    }
  }

  darkModeToggle.addEventListener('click', function() {
    document.body.classList.toggle('dark-mode');
    const icon = this.querySelector('i');
    if (!icon) return;

    if (document.body.classList.contains('dark-mode')) {
      icon.classList.remove('fa-moon');
      icon.classList.add('fa-sun');
      localStorage.setItem('darkMode', 'enabled');
      debugLog("Dark mode enabled");
    } else {
      icon.classList.remove('fa-sun');
      icon.classList.add('fa-moon');
      localStorage.setItem('darkMode', 'disabled');
      debugLog("Dark mode disabled");
    }
  });
  debugLog("Dark mode toggle setup.");
}

function setupMobileMenu() {
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');

  if (!mobileMenuBtn || !mobileMenu) {
      debugLog("Mobile menu button or menu not found.");
      return;
  }

  mobileMenuBtn.addEventListener('click', function() {
    mobileMenu.classList.toggle('hidden');
    debugLog(`Mobile menu toggled: ${mobileMenu.classList.contains('hidden') ? 'Hidden' : 'Visible'}`);
  });
  debugLog("Mobile menu setup.");
}

function setupChatModal() {
  const elements = {
    toggleBtn: document.getElementById('chat-toggle-btn'),
    aiChatBtn: document.getElementById('aiChatBtn'), // Button in the header
    closeBtn: document.getElementById('close-chat-btn'),
    modal: document.getElementById('chat-modal'),
    form: document.getElementById('chat-form'),
    messages: document.getElementById('chat-messages'),
    input: document.getElementById('chat-input')
  };

  if (!elements.modal) {
      debugLog("Chat modal element not found.");
      return;
  }

  const openChat = () => {
      elements.modal.classList.remove('hidden');
      debugLog("Chat modal opened.");
  };
  const closeChat = () => {
      elements.modal.classList.add('hidden');
      debugLog("Chat modal closed.");
  };

  if (elements.toggleBtn) {
    elements.toggleBtn.addEventListener('click', openChat);
  }
  if (elements.aiChatBtn) { // Listener for the header button
    elements.aiChatBtn.addEventListener('click', openChat);
  }
  if (elements.closeBtn) {
    elements.closeBtn.addEventListener('click', closeChat);
  }
  if (elements.form) {
    elements.form.addEventListener('submit', handleChatSubmit);
  }
  debugLog("Chat modal setup.");
}

// Needs to be defined for setupChatModal
function handleChatSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('chat-input');
  const chatMessages = document.getElementById('chat-messages');
  if (!input || !chatMessages) {
      debugLog("Chat input or messages element not found for submit.", true);
      return;
  }

  const message = input.value.trim();
  if (!message) return;

  debugLog(`User message submitted: "${message}"`);

  // Display user message
  chatMessages.innerHTML += `
    <div class="mb-4 flex justify-end">
      <div class="bg-indigo-600 text-white rounded-lg p-3 max-w-xs md:max-w-md">
        <p>${message}</p>
      </div>
    </div>
  `;

  input.value = '';
  chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll down

  // Add placeholder for AI response
   const thinkingMessage = `
    <div class="mb-4 flex ai-thinking">
      <div class="flex-shrink-0 mr-2">
        <div class="bg-indigo-100 rounded-full p-2">
          <i class="fas fa-robot text-indigo-600"></i>
        </div>
      </div>
      <div class="bg-gray-100 rounded-lg p-3 max-w-xs md:max-w-md">
        <p>Thinking...</p>
      </div>
    </div>
  `;
  chatMessages.innerHTML += thinkingMessage;
  chatMessages.scrollTop = chatMessages.scrollHeight;

  // Simulate fetching AI response (replace with actual API call if needed)
  // For now, it just gives a canned response.
  const timelineTopic = document.getElementById('timelineTitle')?.textContent || 'this timeline';
  setTimeout(() => {
      const thinkingElement = chatMessages.querySelector('.ai-thinking');
      if(thinkingElement) thinkingElement.remove(); // Remove "Thinking..."

      chatMessages.innerHTML += `
      <div class="mb-4 flex">
        <div class="flex-shrink-0 mr-2">
          <div class="bg-indigo-100 rounded-full p-2">
            <i class="fas fa-robot text-indigo-600"></i>
          </div>
        </div>
        <div class="bg-gray-100 rounded-lg p-3 max-w-xs md:max-w-md">
          <p>Okay, let's talk about "${timelineTopic}". What specific questions do you have about the events?</p>
        </div>
      </div>
    `;
      chatMessages.scrollTop = chatMessages.scrollHeight;
      debugLog("Simulated AI response added to chat.");
  }, 1500);
}

// --- Filters ---
function setupCategoryFilters() {
  const filterContainer = document.querySelector('.flex.flex-wrap.gap-2'); // Adjust selector if needed
  if (filterContainer) {
      // Use event delegation on the container
      filterContainer.addEventListener('click', (event) => {
          const button = event.target.closest('.category-filter');
          if (button) {
              button.classList.toggle('active'); // Add 'active' class styling in CSS
              handleFiltering();
          }
      });
      debugLog("Category filter event listener setup using delegation.");
  } else {
      debugLog("Category filter container not found.");
  }
}

// Consolidated filtering logic
function handleFiltering() {
    debugLog("Applying filters...");
    const timelineContent = document.getElementById('timeline-content');
    if (!timelineContent) return;

    const events = timelineContent.querySelectorAll('.timeline-event');

    // Get active category filters
    const activeCategoryButtons = document.querySelectorAll('.category-filter.active');
    const activeCategories = Array.from(activeCategoryButtons).map(btn => btn.dataset.category);

    // Get time period filter value
    const timePeriodFilter = document.getElementById('timePeriodFilter');
    const selectedPeriod = timePeriodFilter ? timePeriodFilter.value : 'all';

    events.forEach(event => {
        const eventCategory = event.dataset.category;
        const eventDateString = event.querySelector('.timeline-date')?.textContent || '';
        const eventYear = parseInt(eventDateString.match(/\\d{4}/)?.[0], 10); // Extract year

        // Category filtering
        const categoryMatch = activeCategories.length === 0 || activeCategories.includes(eventCategory);

        // Time period filtering
        let periodMatch = selectedPeriod === 'all';
        if (!isNaN(eventYear)) {
            if (selectedPeriod === '1950s' && eventYear >= 1950 && eventYear <= 1959) periodMatch = true;
            if (selectedPeriod === '1960s' && eventYear >= 1960 && eventYear <= 1969) periodMatch = true;
            if (selectedPeriod === '1970s' && eventYear >= 1970 && eventYear <= 1979) periodMatch = true;
            // Add more periods if needed
        }


        // Show/hide based on filters
        if (categoryMatch && periodMatch) {
            event.style.display = ''; // Show event
        } else {
            event.style.display = 'none'; // Hide event
        }
    });

    debugLog(`Filtering complete. Active categories: [${activeCategories.join(', ')}], Period: ${selectedPeriod}`);
}


// --- Share, Download, Edit, etc. ---
function setupShareButton() {
  const shareButton = document.getElementById('shareTimelineBtn');
  if (shareButton) {
    shareButton.addEventListener('click', () => {
      const url = window.location.href;
      const title = document.getElementById('timelineTitle')?.textContent || 'Timeline';
      if (navigator.share) {
        navigator.share({
          title: `HistoryWeaver: ${title}`,
          text: `Check out this timeline: ${title}`,
          url: url,
        })
        .then(() => debugLog('Successful share'))
        .catch((error) => debugLog('Error sharing:', error));
      } else {
        // Fallback for browsers that don't support navigator.share
        navigator.clipboard.writeText(url).then(() => {
          showToast('Timeline link copied to clipboard!');
        }, (err) => {
          debugLog('Could not copy URL: ', err);
          alert('Could not copy link. Please copy it manually from the address bar.');
        });
      }
    });
    debugLog("Share button setup.");
  }
}

// --- Toast Notifications ---
function showToast(message, duration = 3000) {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');
  if (!toast || !toastMessage) return;

  toastMessage.textContent = message;
  toast.classList.remove('hidden');
  toast.classList.add('opacity-100'); // Fade in effect if using Tailwind transitions

  setTimeout(() => {
    toast.classList.add('hidden');
    toast.classList.remove('opacity-100');
  }, duration);
}

// Make sure PEXELS_API_KEY is REMOVED from here if not needed for other image fetching
// const PEXELS_API_KEY = 'YOUR_PEXELS_KEY'; // REMOVE THIS - Should not be exposed client-side

// Ensure event keywords are still useful for image fetching context if needed
// const WWII_EVENT_KEYWORDS = { ... };
// const SPACE_RACE_EVENT_KEYWORDS = { ... };
// const CATEGORY_KEYWORDS = { ... };
// const DEFAULT_WWII_IMAGE_URL = '...';
// const DEFAULT_SPACE_RACE_IMAGE_URL = '...';
// const DIRECT_REPLACEMENTS = { ... };

// Add/modify style injection for loading state
function addLoadingStyles() {
  if (document.getElementById('timeline-loading-styles')) return; // Already added

  const style = document.createElement('style');
  style.id = 'timeline-loading-styles';
  style.textContent = `
    .timeline-image img.loading {
      filter: blur(5px);
      opacity: 0.6;
      transition: filter 0.3s ease, opacity 0.3s ease;
      background-color: #e5e7eb; /* Light gray background while loading */
    }
    /* Style for the main loading indicator */
    #timeline-loading {
       /* Ensure it's displayed correctly */
       display: flex;
       /* Add any other styles if needed */
    }
  `;
  document.head.appendChild(style);
  debugLog("Loading indicator styles added.");
}

// ... rest of the existing code ... 