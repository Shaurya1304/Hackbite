// Firebase configuration
const { initializeApp } = require('firebase/app');
const { getAuth, GithubAuthProvider } = require('firebase/auth');
require('dotenv').config();

console.log('Firebase config loading...');

// Create Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Log config for debugging (without sensitive data)
console.log('Firebase config loaded:', {
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const githubProvider = new GithubAuthProvider();

// Add required scopes for GitHub OAuth
githubProvider.addScope('user');
githubProvider.addScope('repo');

console.log('Firebase initialized successfully');

module.exports = { auth, githubProvider }; 