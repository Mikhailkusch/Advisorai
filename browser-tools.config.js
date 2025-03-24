export default {
  // Port for the browser-tools server
  port: 3026,
  
  // Screenshot settings
  screenshot: {
    // Directory to save screenshots
    saveDir: './screenshots',
    // Maximum number of screenshots to keep
    maxScreenshots: 100
  },
  
  // Logging settings
  logging: {
    // Maximum number of console logs to keep
    maxLogs: 1000,
    // Maximum length of log messages
    maxLogLength: 1000,
    // Whether to truncate long log messages
    truncateLogs: true
  },
  
  // Network monitoring settings
  network: {
    // Whether to capture network requests
    captureRequests: true,
    // Whether to capture network responses
    captureResponses: true,
    // Maximum number of network entries to keep
    maxEntries: 1000
  }
}; 