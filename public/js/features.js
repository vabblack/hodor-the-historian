// HistoryWeaver - Additional Features

// DOM elements
const compareButton = document.querySelector('.timeline-controls button:nth-child(1)');
const whatIfButton = document.querySelector('.timeline-controls button:nth-child(2)');
const quizButton = document.querySelector('.timeline-controls button:nth-child(3)');
const exportButton = document.querySelector('.timeline-controls button:nth-child(4)');
const categorySelect = document.querySelector('.timeline-controls select');

// Initialize features
function initFeatures() {
  // Make sure the timeline variables are available
  if (typeof currentTimeline === 'undefined') {
    console.warn('Current timeline variable not found. Some features may not work properly.');
    window.currentTimeline = [];
  }

  compareButton.addEventListener('click', handleCompare);
  whatIfButton.addEventListener('click', handleWhatIf);
  quizButton.addEventListener('click', handleQuiz);
  exportButton.addEventListener('click', handleExport);
  categorySelect.addEventListener('change', handleCategoryFilter);
}

// Handle timeline comparison
function handleCompare() {
  if (currentTimeline.length === 0) {
    addMessageToChat('Please generate a timeline first before comparing.', 'bot');
    return;
  }
  
  addMessageToChat('What timeline would you like to compare with the current one?', 'bot');
  
  // Create a one-time event listener for the next user input
  const handleCompareInput = async () => {
    const query = userInput.value.trim();
    if (!query) return;
    
    addMessageToChat(query, 'user');
    userInput.value = '';
    
    const loadingMsgId = addLoadingMessage();
    
    try {
      // Get comparison timeline
      const comparisonData = await generateTimeline(query);
      
      removeLoadingMessage(loadingMsgId);
      addMessageToChat(`I've created a comparison between your timelines. You can see them side by side now.`, 'bot');
      
      // Display comparison view
      displayComparison(currentTimeline, comparisonData);
    } catch (error) {
      removeLoadingMessage(loadingMsgId);
      addMessageToChat('Sorry, I encountered an error while generating the comparison. Please try again.', 'bot');
      console.error('Error generating comparison:', error);
    }
    
    // Remove this event listener after handling the input
    userInput.removeEventListener('keypress', handleCompareInputKey);
    sendButton.removeEventListener('click', handleCompareInputButton);
  };
  
  const handleCompareInputKey = (e) => {
    if (e.key === 'Enter') handleCompareInput();
  };
  
  const handleCompareInputButton = () => {
    handleCompareInput();
  };
  
  userInput.addEventListener('keypress', handleCompareInputKey);
  sendButton.addEventListener('click', handleCompareInputButton);
}

// Display comparison view
function displayComparison(timeline1, timeline2) {
  // Hide the regular timeline
  timelineChart.classList.add('hidden');
  
  // Create a comparison container
  const comparisonContainer = document.createElement('div');
  comparisonContainer.id = 'comparisonContainer';
  comparisonContainer.classList.add('flex', 'flex-col', 'md:flex-row', 'gap-4', 'h-full');
  
  // Create two timeline canvas elements
  const canvas1 = document.createElement('canvas');
  canvas1.id = 'timeline1';
  canvas1.classList.add('md:w-1/2');
  
  const canvas2 = document.createElement('canvas');
  canvas2.id = 'timeline2';
  canvas2.classList.add('md:w-1/2');
  
  comparisonContainer.appendChild(canvas1);
  comparisonContainer.appendChild(canvas2);
  
  // Replace the timeline display with the comparison container
  timelineDisplay.innerHTML = '';
  timelineDisplay.appendChild(comparisonContainer);
  timelineDisplay.classList.remove('hidden');
  
  // Create charts for both timelines
  createTimelineChart(canvas1, timeline1, 'Timeline 1');
  createTimelineChart(canvas2, timeline2, 'Timeline 2');
  
  // Add a button to exit comparison mode
  const exitButton = document.createElement('button');
  exitButton.textContent = 'Exit Comparison';
  exitButton.classList.add('bg-secondary', 'hover:bg-secondary/80', 'text-white', 'px-3', 'py-1', 'rounded-md', 'text-sm', 'transition', 'mt-4');
  exitButton.addEventListener('click', () => {
    // Remove comparison view
    timelineDisplay.innerHTML = '<p>Your timeline will appear here</p>';
    timelineDisplay.classList.add('hidden');
    timelineChart.classList.remove('hidden');
  });
  
  timelineDisplay.appendChild(exitButton);
}

// Create individual timeline chart for comparison
function createTimelineChart(canvas, timelineData, title) {
  // Sort timeline events by date
  timelineData.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Create chart
  const ctx = canvas.getContext('2d');
  new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [{
        label: title,
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
          display: true,
          position: 'top',
          labels: {
            color: '#d1d5db'
          }
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
}

// Handle What-If scenarios
function handleWhatIf() {
  if (currentTimeline.length === 0) {
    addMessageToChat('Please generate a timeline first before exploring What-If scenarios.', 'bot');
    return;
  }
  
  addMessageToChat('What alternative history scenario would you like to explore? (e.g., "What if the Roman Empire never fell?")', 'bot');
  
  // Create a one-time event listener for the next user input
  const handleWhatIfInput = async () => {
    const query = userInput.value.trim();
    if (!query) return;
    
    addMessageToChat(query, 'user');
    userInput.value = '';
    
    const loadingMsgId = addLoadingMessage();
    
    try {
      // Get alternative timeline
      // In a real implementation, this would use an AI to generate a speculative timeline
      const alternativeData = await mockWhatIfTimeline(query);
      
      removeLoadingMessage(loadingMsgId);
      addMessageToChat(`Here's an alternative history timeline for your "What If" scenario: ${query}`, 'bot');
      
      // Display alternative timeline
      displayTimeline(alternativeData);
    } catch (error) {
      removeLoadingMessage(loadingMsgId);
      addMessageToChat('Sorry, I encountered an error while generating the alternative timeline. Please try again.', 'bot');
      console.error('Error generating what-if scenario:', error);
    }
    
    // Remove this event listener after handling the input
    userInput.removeEventListener('keypress', handleWhatIfInputKey);
    sendButton.removeEventListener('click', handleWhatIfInputButton);
  };
  
  const handleWhatIfInputKey = (e) => {
    if (e.key === 'Enter') handleWhatIfInput();
  };
  
  const handleWhatIfInputButton = () => {
    handleWhatIfInput();
  };
  
  userInput.addEventListener('keypress', handleWhatIfInputKey);
  sendButton.addEventListener('click', handleWhatIfInputButton);
}

// Generate mock what-if timeline (in a real app, this would use AI)
async function mockWhatIfTimeline(query) {
  // For demonstration, generate a fictional timeline based on the query
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay
  
  return [
    {
      id: 1,
      title: 'Alternative Event 1',
      date: '1800-01-01',
      description: 'This is an alternative history event based on your what-if scenario.',
      category: 'Political',
      imageUrl: null
    },
    {
      id: 2,
      title: 'Alternative Event 2',
      date: '1850-06-15',
      description: 'Another alternative history event in your timeline.',
      category: 'Military',
      imageUrl: null
    },
    {
      id: 3,
      title: 'Alternative Event 3',
      date: '1900-11-30',
      description: 'A third alternative history event.',
      category: 'Cultural',
      imageUrl: null
    }
  ];
}

// Handle quiz mode
function handleQuiz() {
  if (currentTimeline.length === 0) {
    addMessageToChat('Please generate a timeline first before starting a quiz.', 'bot');
    return;
  }
  
  // Start the quiz
  addMessageToChat('Starting quiz mode! Test your knowledge about this timeline.', 'bot');
  startQuiz(currentTimeline);
}

// Start timeline quiz
function startQuiz(timelineData) {
  // Create questions from timeline data
  const questions = generateQuizQuestions(timelineData);
  
  let currentQuestionIndex = 0;
  let score = 0;
  
  // Show first question
  askQuestion(questions[currentQuestionIndex]);
  
  // Function to ask questions
  function askQuestion(question) {
    addMessageToChat(question.text, 'bot');
    
    // Create a one-time event listener for the user's answer
    const handleAnswer = () => {
      const answer = userInput.value.trim().toLowerCase();
      if (!answer) return;
      
      addMessageToChat(answer, 'user');
      userInput.value = '';
      
      // Check answer
      const isCorrect = checkAnswer(answer, question.answer);
      
      if (isCorrect) {
        score++;
        addMessageToChat('Correct! 🎉', 'bot');
      } else {
        addMessageToChat(`Incorrect. The correct answer is: ${question.answer}`, 'bot');
      }
      
      // Move to next question or end quiz
      currentQuestionIndex++;
      
      if (currentQuestionIndex < questions.length) {
        // Short delay before next question
        setTimeout(() => {
          askQuestion(questions[currentQuestionIndex]);
        }, 1500);
      } else {
        // End of quiz
        setTimeout(() => {
          const percentage = Math.round((score / questions.length) * 100);
          addMessageToChat(`Quiz complete! Your score: ${score}/${questions.length} (${percentage}%)`, 'bot');
        }, 1500);
      }
      
      // Remove event listeners
      userInput.removeEventListener('keypress', handleAnswerKey);
      sendButton.removeEventListener('click', handleAnswerButton);
    };
    
    const handleAnswerKey = (e) => {
      if (e.key === 'Enter') handleAnswer();
    };
    
    const handleAnswerButton = () => {
      handleAnswer();
    };
    
    userInput.addEventListener('keypress', handleAnswerKey);
    sendButton.addEventListener('click', handleAnswerButton);
  }
}

// Generate quiz questions from timeline data
function generateQuizQuestions(timelineData) {
  const questions = [];
  
  // Create questions for each event
  timelineData.forEach(event => {
    // Question about the date
    questions.push({
      text: `When did "${event.title}" occur?`,
      answer: event.date.split('-')[0] // Just the year
    });
    
    // Question about the event description
    const descWords = event.description.split(' ');
    if (descWords.length > 5) {
      const clozeText = event.description.replace(/\b\w+\b/, '______');
      questions.push({
        text: `Fill in the blank: "${clozeText}"`,
        answer: event.description.match(/\b\w+\b/)[0]
      });
    }
  });
  
  // Shuffle and limit to 5 questions
  return shuffleArray(questions).slice(0, 5);
}

// Check if the user's answer is correct
function checkAnswer(userAnswer, correctAnswer) {
  // Simple string comparison (could be improved with fuzzy matching)
  return userAnswer.toLowerCase().includes(correctAnswer.toLowerCase());
}

// Handle timeline export
function handleExport() {
  if (currentTimeline.length === 0) {
    addMessageToChat('Please generate a timeline first before exporting.', 'bot');
    return;
  }
  
  // Add export options message
  addMessageToChat('How would you like to export your timeline?', 'bot');
  
  // Create export options
  const exportOptions = document.createElement('div');
  exportOptions.classList.add('flex', 'gap-2', 'mt-2');
  
  const pdfButton = document.createElement('button');
  pdfButton.textContent = 'PDF';
  pdfButton.classList.add('bg-secondary', 'hover:bg-secondary/80', 'text-white', 'px-3', 'py-1', 'rounded-md', 'text-sm', 'transition');
  pdfButton.addEventListener('click', () => exportAsPDF());
  
  const pngButton = document.createElement('button');
  pngButton.textContent = 'PNG';
  pngButton.classList.add('bg-secondary', 'hover:bg-secondary/80', 'text-white', 'px-3', 'py-1', 'rounded-md', 'text-sm', 'transition');
  pngButton.addEventListener('click', () => exportAsPNG());
  
  const jsonButton = document.createElement('button');
  jsonButton.textContent = 'JSON';
  jsonButton.classList.add('bg-secondary', 'hover:bg-secondary/80', 'text-white', 'px-3', 'py-1', 'rounded-md', 'text-sm', 'transition');
  jsonButton.addEventListener('click', () => exportAsJSON());
  
  exportOptions.appendChild(pdfButton);
  exportOptions.appendChild(pngButton);
  exportOptions.appendChild(jsonButton);
  
  // Add export options to the last message
  const lastBotMessage = chatMessages.querySelector('.bot-message:last-child div');
  lastBotMessage.appendChild(exportOptions);
}

// Export as PDF (Mock function)
function exportAsPDF() {
  addMessageToChat('Your timeline has been exported as PDF. This would download a file in a real implementation.', 'bot');
  
  // In a real implementation, you would use a library like jsPDF to generate a PDF
  console.log('Exporting timeline as PDF:', currentTimeline);
}

// Export as PNG (Mock function)
function exportAsPNG() {
  addMessageToChat('Your timeline has been captured as a PNG image. This would download an image in a real implementation.', 'bot');
  
  // In a real implementation, you would use html2canvas to capture the timeline as an image
  console.log('Exporting timeline as PNG:', currentTimeline);
}

// Export as JSON
function exportAsJSON() {
  // Create a download link for the JSON data
  const dataStr = JSON.stringify(currentTimeline, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
  
  const exportFileDefaultName = 'timeline.json';
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
  
  addMessageToChat('Your timeline data has been exported as JSON.', 'bot');
}

// Handle category filter
function handleCategoryFilter() {
  const selectedCategory = categorySelect.value;
  
  if (currentTimeline.length === 0) {
    addMessageToChat('Please generate a timeline first before filtering by category.', 'bot');
    return;
  }
  
  // If "all" is selected, display full timeline
  if (selectedCategory === 'all') {
    displayTimeline(currentTimeline);
    return;
  }
  
  // Filter timeline by selected category
  const filteredTimeline = currentTimeline.filter(event => 
    event.category && event.category.toLowerCase() === selectedCategory.toLowerCase()
  );
  
  if (filteredTimeline.length === 0) {
    addMessageToChat(`No events found in the "${selectedCategory}" category.`, 'bot');
    return;
  }
  
  // Display filtered timeline
  displayTimeline(filteredTimeline);
  addMessageToChat(`Showing events in the "${selectedCategory}" category.`, 'bot');
}

// Utility function to shuffle an array
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Initialize features when the document is loaded
document.addEventListener('DOMContentLoaded', initFeatures); 