// HistoryWeaver - Main Application JavaScript

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

function initApp() {
    // DOM elements - only initialize what exists
    const elements = {
        chatMessages: document.getElementById('chatMessages'),
        userInput: document.getElementById('userInput'),
        sendButton: document.getElementById('sendButton'),
        timelineDisplay: document.getElementById('timelineDisplay'),
        timelineChart: document.getElementById('timelineChart'),
        eventDetails: document.getElementById('eventDetails'),
        eventTitle: document.getElementById('eventTitle'),
        eventDate: document.getElementById('eventDate'),
        eventDescription: document.getElementById('eventDescription'),
        eventImage: document.getElementById('eventImage'),
        eventMap: document.getElementById('eventMap')
    };

    // Initialize chat functionality only if chat elements exist
    if (elements.sendButton && elements.userInput && elements.chatMessages) {
        initializeChat(elements);
    }

    // Initialize timeline display if elements exist
    if (elements.timelineDisplay || elements.timelineChart) {
        initializeTimeline(elements);
    }

    // Initialize local storage for user preferences if not already set
    if (!localStorage.getItem('historyWeaverPrefs')) {
        localStorage.setItem('historyWeaverPrefs', JSON.stringify({
            theme: 'dark',
            favoriteEras: [],
            savedTimelines: []
        }));
    }
}

function initializeChat(elements) {
    const { sendButton, userInput, chatMessages } = elements;

    // Add event listeners for chat
    sendButton.addEventListener('click', () => handleUserInput(elements));
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleUserInput(elements);
    });
}

function initializeTimeline(elements) {
    const { timelineDisplay, timelineChart } = elements;
    // Timeline specific initialization can go here
    // This will be called only if timeline elements exist
}

// Update handleUserInput to use elements object
async function handleUserInput(elements) {
    const { userInput, chatMessages } = elements;
    const userQuery = userInput.value.trim();
    if (!userQuery) return;

    // Add user message to chat
    addMessageToChat(userQuery, 'user', chatMessages);
    
    // Clear input
    userInput.value = '';

    // Add loading message
    const loadingMsgId = addLoadingMessage(chatMessages);

    try {
        // Get timeline data
        const timelineData = await generateTimeline(userQuery);
        
        // Remove loading message
        removeLoadingMessage(loadingMsgId);
        
        // Add bot response
        addMessageToChat(`I've created a timeline for "${userQuery}". You can click on events to see more details.`, 'bot', chatMessages);
        
        // Display timeline
        displayTimeline(timelineData, elements);
    } catch (error) {
        // Remove loading message
        removeLoadingMessage(loadingMsgId);
        
        // Add error message
        addMessageToChat('Sorry, I encountered an error while generating your timeline. Please try again.', 'bot', chatMessages);
        console.error('Error generating timeline:', error);
    }
}

// Update addMessageToChat to take chatMessages parameter
function addMessageToChat(text, sender, chatMessages) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${sender}-message`, 'mb-4');
    
    const contentDiv = document.createElement('div');
    contentDiv.classList.add(sender === 'user' ? 'bg-secondary/20' : 'bg-primary/20', 'rounded-lg', 'p-3', 'inline-block', 'max-w-[80%]');
    
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    
    contentDiv.appendChild(paragraph);
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Add loading message
function addLoadingMessage(chatMessages) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'bot-message', 'mb-4', 'loading-message');
    
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('bg-primary/20', 'rounded-lg', 'p-3', 'inline-block');
    
    const loadingDiv = document.createElement('div');
    loadingDiv.classList.add('flex', 'items-center', 'space-x-2');
    
    const text = document.createElement('span');
    text.textContent = 'Generating timeline';
    
    const spinner = document.createElement('div');
    spinner.classList.add('spinner', 'w-4', 'h-4');
    
    loadingDiv.appendChild(text);
    loadingDiv.appendChild(spinner);
    contentDiv.appendChild(loadingDiv);
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return messageDiv.id = 'loading-' + Date.now();
}

// Remove loading message
function removeLoadingMessage(id) {
    const loadingMessage = document.getElementById(id);
    if (loadingMessage) {
        loadingMessage.remove();
    }
}

// Generate timeline data from API
async function generateTimeline(query) {
    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt: query })
        });
        
        if (!response.ok) {
            throw new Error('Failed to generate timeline');
        }
        
        const data = await response.json();
        currentTimeline = data.timeline;
        
        // Fetch images for events
        await Promise.all(currentTimeline.map(async (event) => {
            try {
                const imageUrl = await fetchEventImage(event.title);
                event.imageUrl = imageUrl;
            } catch (error) {
                console.error('Error fetching image for event:', error);
                event.imageUrl = null;
            }
        }));
        
        return currentTimeline;
    } catch (error) {
        console.error('Error in generateTimeline:', error);
        throw error;
    }
}

// Fetch image for an event
async function fetchEventImage(keyword) {
    try {
        const response = await fetch(`/api/images?query=${encodeURIComponent(keyword)}`);
        
        if (!response.ok) {
            return null;
        }
        
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            return data.results[0].urls.regular;
        }
        
        return null;
    } catch (error) {
        console.error('Error fetching image:', error);
        return null;
    }
}

// Display timeline visualization
function displayTimeline(timelineData, elements) {
    // Hide placeholder and show chart
    elements.timelineDisplay.classList.add('hidden');
    elements.timelineChart.classList.remove('hidden');
    
    // Sort timeline events by date
    timelineData.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Destroy previous chart if exists
    if (chart) {
        chart.destroy();
    }
    
    // Create chart
    const ctx = elements.timelineChart.getContext('2d');
    chart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                data: timelineData.map((event) => ({
                    x: new Date(event.date),
                    y: 1, // All events on same level
                    event: event
                })),
                pointBackgroundColor: function(context) {
                    const event = context.raw.event;
                    if (!event) return '#ff6f61';
                    
                    // Different colors for different categories
                    switch (event.category) {
                        case 'Political': return '#ff6f61';
                        case 'Military': return '#facc15';
                        case 'Cultural': return '#34d399';
                        case 'Scientific': return '#60a5fa';
                        default: return '#ff6f61';
                    }
                },
                pointRadius: 6,
                pointHoverRadius: 8,
                pointStyle: 'circle',
                showLine: true,
                borderColor: 'rgba(107, 114, 128, 0.3)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const event = context.raw.event;
                            return event.title + ' (' + event.date + ')';
                        }
                    }
                },
                legend: {
                    display: false
                }
            },
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const eventData = timelineData[index];
                    showEventDetails(eventData);
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'year',
                        displayFormats: {
                            year: 'yyyy'
                        }
                    },
                    grid: {
                        color: 'rgba(107, 114, 128, 0.1)'
                    },
                    ticks: {
                        color: '#d1d5db'
                    }
                },
                y: {
                    display: false,
                    min: 0,
                    max: 2
                }
            }
        }
    });
    
    // After creating chart, add the timeline-dot class to all points
    setTimeout(() => {
        const points = document.querySelectorAll('#timelineChart .chartjs-point');
        points.forEach(point => {
            point.classList.add('timeline-dot');
        });
    }, 100);
}

// Show event details
function showEventDetails(event) {
    // Set values
    elements.eventTitle.textContent = event.title;
    elements.eventDate.textContent = formatDate(event.date);
    elements.eventDescription.textContent = event.description;
    
    // Show image if available
    if (event.imageUrl) {
        elements.eventImage.innerHTML = `<img src="${event.imageUrl}" alt="${event.title}" class="w-full h-full object-cover">`;
    } else {
        elements.eventImage.innerHTML = `<div class="w-full h-full flex items-center justify-center text-gray-500">No image available</div>`;
    }
    
    // Initialize map
    initMap(event);
    
    // Show details container
    elements.eventDetails.classList.remove('hidden');
    elements.eventDetails.classList.add('visible');
}

// Initialize map
function initMap(event) {
    // For demonstration, we'll use a mock location based on event title
    // In a real app, you would use a geocoding API or have location data
    
    // Remove previous map
    if (map) {
        map.remove();
    }
    
    // Create new map
    map = L.map(elements.eventMap).setView([40.7128, -74.0060], 4);
    
    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    
    // Add marker
    L.marker([40.7128, -74.0060]).addTo(map)
        .bindPopup(event.title)
        .openPopup();
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
} 