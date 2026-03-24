const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Default configuration
const defaultConfig = {
  PORT: 3002,
  UNSPLASH_API_KEY: '',
  OPENROUTER_API_KEY: '',
  NODE_ENV: 'development',
  TIMEOUT: 30000
};

console.log('HistoryWeaver Setup\n');

// Function to prompt for configuration values
async function promptConfig() {
  const config = { ...defaultConfig };
  
  try {
    // If .env exists, read current values
    if (fs.existsSync('.env')) {
      const envContent = fs.readFileSync('.env', 'utf8');
      envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
          config[key.trim()] = value.trim();
        }
      });
    }
  } catch (error) {
    console.log('No existing configuration found. Creating new configuration...\n');
  }

  return new Promise((resolve) => {
    rl.question(`Enter PORT (default: ${config.PORT}): `, (port) => {
      config.PORT = port || config.PORT;
      
      rl.question('Enter UNSPLASH_API_KEY (optional): ', (unsplashKey) => {
        config.UNSPLASH_API_KEY = unsplashKey || config.UNSPLASH_API_KEY;
        
        rl.question('Enter OPENROUTER_API_KEY (required): ', (openrouterKey) => {
          config.OPENROUTER_API_KEY = openrouterKey || config.OPENROUTER_API_KEY;
          
          rl.close();
          resolve(config);
        });
      });
    });
  });
}

// Function to write configuration to .env file
function writeConfig(config) {
  const envContent = Object.entries(config)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  fs.writeFileSync('.env', envContent);
  console.log('\nConfiguration saved to .env file');
}

// Function to verify the configuration
function verifyConfig(config) {
  const issues = [];

  if (!config.OPENROUTER_API_KEY) {
    issues.push('OpenRouter API key is required');
  }

  if (!config.PORT || isNaN(config.PORT)) {
    issues.push('Invalid PORT number');
  }

  return issues;
}

// Main setup function
async function setup() {
  try {
    const config = await promptConfig();
    const issues = verifyConfig(config);

    if (issues.length > 0) {
      console.log('\nConfiguration issues found:');
      issues.forEach(issue => console.log(`- ${issue}`));
      console.log('\nPlease run setup again with valid values.');
      process.exit(1);
    }

    writeConfig(config);
    console.log('\nSetup completed successfully!');
    console.log('You can now start the server with: npm start');
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

// Run setup
setup(); 