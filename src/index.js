const express = require('express');
const session = require('express-session');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Import routes
const authRoutes = require('./routes/auth');
const githubRoutes = require('./routes/github');

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'some_random_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Make environment variables available to views
app.use((req, res, next) => {
  // Make the environment variables available to all views
  res.locals.process = { env: process.env };
  next();
});

// Authentication middleware
app.use((req, res, next) => {
  // Check if the user is logged in
  const userIsLoggedIn = Boolean(req.session && req.session.user);
  
  // Only use mock user for direct access to protected routes
  const useAuthMock = req.path.startsWith('/github') && !userIsLoggedIn;
  
  if (useAuthMock) {
    console.log('Using mock authentication for:', req.path);
    req.session.user = {
      uid: 'mock-user-id',
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: 'https://avatars.githubusercontent.com/u/583231?v=4',
      accessToken: process.env.GITHUB_TOKEN || ''
    };
  }
  
  res.locals.isLoggedIn = userIsLoggedIn || useAuthMock;
  res.locals.user = req.session.user;
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/github', githubRoutes);

// Home page
app.get('/', (req, res) => {
  const isLoggedIn = Boolean(req.session && req.session.user);
  res.render('home', {
    isLoggedIn: isLoggedIn,
    user: req.session.user
  });
});

// API route (keeping the original one)
app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to the Node.js application!' });
});

// Pass Firebase config to login page
app.get('/login', (req, res) => {
  res.render('login');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
}); 