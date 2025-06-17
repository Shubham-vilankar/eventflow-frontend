import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Import your main App component

// Import Amplify and your configuration
import { Amplify } from 'aws-amplify';
import awsExports from './aws-exports'; // This should point to your aws-exports.js file

// Configure Amplify with your AWS settings
Amplify.configure(awsExports);

// Create a root and render your App component
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
