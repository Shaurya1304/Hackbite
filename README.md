# Node.js Express Application with GitHub Authentication

A simple Node.js application using Express and Firebase for GitHub authentication.

## Prerequisites

- Node.js and npm installed
- A Firebase account
- A GitHub account and OAuth application

## Setup

### 1. Firebase Setup

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Add a web app to your project
4. Enable the Authentication service
5. In the Authentication section, enable GitHub as a sign-in provider
6. Note your Firebase configuration details for the next steps

### 2. GitHub OAuth Setup

1. Go to your GitHub account settings
2. Navigate to Developer Settings > OAuth Apps
3. Create a new OAuth application
4. Set the Authorization callback URL to `https://your-firebase-project-id.firebaseapp.com/__/auth/handler`
5. Note your Client ID and Client Secret
6. Add these credentials to your Firebase Authentication GitHub provider settings

### 3. Environment Variables

Create a `.env` file in the root of the project with the following variables:

```
# Firebase Configuration
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
FIREBASE_APP_ID=your_firebase_app_id

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback

# Session
SESSION_SECRET=some_random_secret_key
```

## Installation

```bash
npm install
```

## Usage

### Development mode

```bash
npm run dev
```

This will start the server with nodemon, which automatically restarts when you make changes.

### Production mode

```bash
npm start
```

## Features

- GitHub authentication via Firebase
- Session management
- Protected routes
- Responsive UI

## API Endpoints

- `GET /` - Home page
- `GET /api` - Returns a welcome message JSON
- `GET /auth/github` - Initiates GitHub login flow
- `POST /auth/github/callback` - Handles GitHub login callback
- `GET /auth/logout` - Logs out the user

## Environment Variables

- `PORT` - The port to run the server on (default: 3000)
- See the Setup section for other required environment variables 