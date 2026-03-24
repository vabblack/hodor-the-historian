// HistoryWeaver - Modern UI Interface

document.addEventListener('DOMContentLoaded', function() {
  // Elements
  const openChatBtn = document.getElementById('openChat');
  const chatContainer = document.getElementById('chatContainer');
  const closeChatBtn = document.getElementById('closeChat');
  const chatInput = document.getElementById('chatInput');
  const chatSendButton = document.getElementById('chatSendButton');
  const timelineContainer = document.getElementById('timelineContainer');
  const closeTimelineBtn = document.getElementById('closeTimeline');
  const mainInput = document.getElementById('userInput');
  const mainSendButton = document.getElementById('sendButton');
  const formatOptions = document.querySelectorAll('.grid.grid-cols-6 > div');
  const suggestedSearches = document.querySelectorAll('.flex.flex-wrap.gap-4 button');

  // Initialize
  initializeListeners();
  
  function initializeListeners() {
    // Chat toggle
    openChatBtn.addEventListener('click', toggleChat);
    closeChatBtn.addEventListener('click', toggleChat);
    
    // Timeline toggle
    closeTimelineBtn.addEventListener('click', () => {
      timelineContainer.classList.add('hidden');
    });
    
    // Main search input
    mainInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleMainSearch();
    });
    mainSendButton.addEventListener('click', handleMainSearch);
    
    // Chat input
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleChatInput();
    });
    chatSendButton.addEventListener('click', handleChatInput);
    
    // Format options click
    formatOptions.forEach(option => {
      option.addEventListener('click', () => {
        // Show a toast message
        showToast(`Selected format: ${option.querySelector('span').textContent}`);
      });
    });
    
    // Suggested searches
    suggestedSearches.forEach(button => {
      button.addEventListener('click', () => {
        const query = button.querySelector('span:last-child').textContent;
        mainInput.value = query;
        handleMainSearch();
      });
    });
  }
  
  function toggleChat() {
    chatContainer.classList.toggle('hidden');
    
    if (!chatContainer.classList.contains('hidden')) {
      chatInput.focus();
    }
  }
  
  function handleMainSearch() {
    const query = mainInput.value.trim();
    if (!query) return;
    
    // First show the chat and add the user message
    if (chatContainer.classList.contains('hidden')) {
      toggleChat();
    }
    
    // Add message to chat
    addMessageToChat(query, 'user');
    
    // Clear input
    mainInput.value = '';
    
    // Process the query (using the existing app.js functionality)
    if (typeof handleUserInput === 'function') {
      // Override the original function behavior
      const originalUserInput = userInput;
      userInput = {value: query};
      
      // Call the original handler
      handleUserInput().then(() => {
        // Show the timeline container
        timelineContainer.classList.remove('hidden');
        
        // Restore the original userInput reference
        userInput = originalUserInput;
      }).catch(error => {
        console.error('Error handling user input:', error);
      });
    } else {
      // Fallback if the original function is not available
      processQuery(query);
    }
  }
  
  function handleChatInput() {
    const query = chatInput.value.trim();
    if (!query) return;
    
    // Add message to chat
    addMessageToChat(query, 'user');
    
    // Clear input
    chatInput.value = '';
    
    // Process the query
    if (typeof handleUserInput === 'function') {
      // Override the original function behavior
      const originalUserInput = userInput;
      userInput = {value: query};
      
      // Call the original handler
      handleUserInput().then(() => {
        // Show the timeline container
        timelineContainer.classList.remove('hidden');
        
        // Restore the original userInput reference
        userInput = originalUserInput;
      }).catch(error => {
        console.error('Error handling user input:', error);
      });
    } else {
      // Fallback if the original function is not available
      processQuery(query);
    }
  }
  
  // Fallback query processor (in case the original app.js functions are not available)
  async function processQuery(query) {
    const loadingMsgId = addLoadingMessage();
    
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
      
      // Remove loading message
      removeLoadingMessage(loadingMsgId);
      
      // Add bot response
      addMessageToChat(`I've created a timeline for "${query}". You can click on events to see more details.`, 'bot');
      
      // Show the timeline container
      timelineContainer.classList.remove('hidden');
      
      // Use existing displayTimeline function if available
      if (typeof displayTimeline === 'function') {
        window.currentTimeline = data.timeline;
        displayTimeline(data.timeline);
      } else {
        // Simple fallback to show timeline data
        const timelineDisplay = document.getElementById('timelineDisplay');
        timelineDisplay.innerHTML = `<div class="p-4"><h3 class="text-lg font-bold mb-2">Timeline for "${query}"</h3><ul class="list-disc pl-5">
          ${data.timeline.map(event => `<li class="mb-2"><strong>${event.title}</strong> (${event.date}): ${event.description}</li>`).join('')}
        </ul></div>`;
      }
    } catch (error) {
      console.error('Error processing query:', error);
      
      // Remove loading message
      removeLoadingMessage(loadingMsgId);
      
      // Add error message
      addMessageToChat('Sorry, I encountered an error while generating your timeline. Please try again.', 'bot');
    }
  }
  
  // Toast message
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('opacity-0', 'transition-opacity', 'duration-500');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 500);
    }, 3000);
  }
  
  // Patch the existing addMessageToChat function to work with the new interface
  if (typeof window.addMessageToChat !== 'function') {
    window.addMessageToChat = function(text, sender) {
      const messageDiv = document.createElement('div');
      messageDiv.classList.add('message', `${sender}-message`, 'mb-4');
      
      const contentDiv = document.createElement('div');
      contentDiv.classList.add(
        sender === 'user' ? 'bg-blue-50 ml-auto' : 'bg-gray-100', 
        'rounded-lg', 
        'p-3', 
        'inline-block', 
        'max-w-[80%]'
      );
      
      const paragraph = document.createElement('p');
      paragraph.textContent = text;
      
      contentDiv.appendChild(paragraph);
      messageDiv.appendChild(contentDiv);
      
      const chatMessages = document.getElementById('chatMessages');
      chatMessages.appendChild(messageDiv);
      
      // Scroll to bottom
      chatMessages.scrollTop = chatMessages.scrollHeight;
    };
  }
  
  // Loading message functions
  if (typeof window.addLoadingMessage !== 'function') {
    window.addLoadingMessage = function() {
      const messageDiv = document.createElement('div');
      messageDiv.classList.add('message', 'bot-message', 'mb-4', 'loading-message');
      messageDiv.id = 'loading-' + Date.now();
      
      const contentDiv = document.createElement('div');
      contentDiv.classList.add('bg-gray-100', 'rounded-lg', 'p-3', 'inline-block');
      
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
      
      const chatMessages = document.getElementById('chatMessages');
      chatMessages.appendChild(messageDiv);
      
      // Scroll to bottom
      chatMessages.scrollTop = chatMessages.scrollHeight;
      
      return messageDiv.id;
    };
  }
  
  if (typeof window.removeLoadingMessage !== 'function') {
    window.removeLoadingMessage = function(id) {
      const loadingMessage = document.getElementById(id);
      if (loadingMessage) {
        loadingMessage.remove();
      }
    };
  }
}); 