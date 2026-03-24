# HistoryWeaver - AI Timeline Generator

HistoryWeaver is an AI-powered chatbot that generates detailed historical event timelines, integrates multimedia content, and offers an interactive, personalized user experience.

## Server Configuration

This project has two different server configurations:

1. **Main Server (server.js)**:
   - The primary server with all features integrated
   - Runs on port 3000
   - Start with: `node server.js` or `npm run dev-main`

2. **Modular Server (server/index.js)**:
   - A modular version of the server with separated API routes
   - Runs on port 3001
   - Start with: `npm run dev`

## Running Both Servers Simultaneously

You can run both servers at the same time for development or testing:

1. Start the main server:
   ```
   npm run dev-main
   ```

2. In a separate terminal, start the modular server:
   ```
   npm run dev
   ```

3. Access the servers at:
   - Main server: http://localhost:3000
   - Modular server: http://localhost:3001

## Features

- **Interactive Timeline Generation:** Enter a time period, topic, or event via a chat interface to generate a detailed timeline.
- **Dark Colorful Theme:** A visually appealing dark theme with vibrant accents for an engaging user experience.
- **Multimedia Integration:** View relevant images and maps for each historical event.
- **Innovative Features:**
  - **What-If Scenarios:** Explore alternative history timelines.
  - **Compare Timelines:** View two timelines side-by-side for comparison.
  - **Quiz Mode:** Test your knowledge with automatically generated quizzes.
  - **Export Options:** Save timelines as PDF, PNG, or JSON.
  - **Event Categorization:** Filter events by category (Political, Military, Cultural, Scientific).

## Technologies Used

- **Frontend:** HTML, CSS, JavaScript, Tailwind CSS
- **Visualization:** Chart.js for timeline visualization, Leaflet for maps
- **APIs:**
  - OpenRouter API (using Mistral-Nemo model) for AI-powered timeline generation
  - Wikipedia API for historical data
  - Unsplash API for images
  - OpenStreetMap for maps

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/history-weaver.git
   cd history-weaver
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with your API keys:
   ```
   PORT=3000
   UNSPLASH_API_KEY=your_unsplash_api_key
   OPENROUTER_API_KEY=your_openrouter_api_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`

## Usage

1. Type a query in the chat input, such as "American Civil War (1861-1865)" or "Industrial Revolution in Britain"
2. The AI will generate a timeline with key events, descriptions, and images
3. Click on timeline events to view detailed information, images, and maps
4. Use the control buttons to:
   - Compare with another timeline
   - Explore What-If scenarios
   - Test your knowledge with Quiz Mode
   - Export your timeline

## Project Structure

```
history-weaver/
├── public/              # Static assets
│   ├── css/             # CSS stylesheets
│   ├── js/              # Client-side JavaScript
│   └── images/          # Static images
├── server.js            # Express server and API endpoints
├── package.json         # Project dependencies
└── README.md            # Project documentation
```

## Future Enhancements

- Voice interaction for hands-free usage
- User accounts to save and manage timelines
- Multilingual support
- More sophisticated AI-generated "What-If" scenarios
- Advanced quiz modes with different difficulty levels

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [OpenRouter](https://openrouter.ai/) for AI timeline generation
- [Chart.js](https://www.chartjs.org/) for timeline visualization
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Leaflet](https://leafletjs.com/) for maps
- [Wikipedia API](https://www.mediawiki.org/wiki/API:Main_page) for historical data
- [Unsplash API](https://unsplash.com/developers) for images 