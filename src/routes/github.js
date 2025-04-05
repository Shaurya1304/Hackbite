const express = require('express');
const router = express.Router();
const axios = require('axios');
const { getLanguageColor } = require('../utils/helpers');

// Helper function to create request headers
const getRequestHeaders = (req) => {
  const headers = {
    'Accept': 'application/vnd.github.v3+json'
  };
  
  // Add authorization header if token is available
  if (req.session?.user?.accessToken && req.session.user.accessToken !== '') {
    headers['Authorization'] = `token ${req.session.user.accessToken}`;
  }
  
  return headers;
};

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  res.redirect('/login');
};

// Get user's repositories
router.get('/repos', isAuthenticated, async (req, res) => {
  try {
    // If no valid token, show some popular repositories instead
    if (!req.session.user.accessToken || req.session.user.accessToken === '') {
      const response = await axios.get('https://api.github.com/search/repositories', {
        headers: getRequestHeaders(req),
        params: {
          q: 'stars:>10000',
          sort: 'stars',
          order: 'desc',
          per_page: 20
        }
      });
      
      // Add language colors directly to repo objects
      const repos = response.data.items.map(repo => {
        return {
          ...repo,
          languageColor: getLanguageColor(repo.language)
        };
      });
      
      return res.render('repos', { 
        repos,
        user: req.session.user,
        isLoggedIn: true,
        isDemo: true
      });
    }
    
    // Normal case with valid token
    const response = await axios.get('https://api.github.com/user/repos', {
      headers: getRequestHeaders(req),
      params: {
        sort: 'updated',
        per_page: 100
      }
    });

    // Add language colors directly to repo objects
    const repos = response.data.map(repo => {
      return {
        ...repo,
        languageColor: getLanguageColor(repo.language)
      };
    });

    res.render('repos', { 
      repos,
      user: req.session.user,
      isLoggedIn: true
    });
  } catch (error) {
    console.error('Error fetching repositories:', error.response?.data || error.message);
    res.status(500).render('error', { 
      message: 'Failed to fetch repositories', 
      error: error.response?.data?.message || error.message,
      isLoggedIn: true,
      user: req.session.user
    });
  }
});

// Get user profile information
router.get('/profile', isAuthenticated, async (req, res) => {
  try {
    // If no valid token, show mock profile data
    if (!req.session.user.accessToken || req.session.user.accessToken === '') {
      const mockProfile = {
        login: 'testuser',
        id: 12345,
        avatar_url: req.session.user.photoURL,
        html_url: 'https://github.com/testuser',
        name: req.session.user.displayName,
        company: 'Demo Company',
        blog: 'https://example.com',
        location: 'Demo City',
        email: req.session.user.email,
        bio: 'This is a mock profile for demonstration purposes',
        public_repos: 42,
        public_gists: 17,
        followers: 1024,
        following: 256,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-04-01T00:00:00Z'
      };
      
      return res.render('profile', { 
        profile: mockProfile,
        user: req.session.user,
        isLoggedIn: true,
        isDemo: true
      });
    }
    
    // Normal case with valid token
    const response = await axios.get('https://api.github.com/user', {
      headers: getRequestHeaders(req)
    });

    res.render('profile', { 
      profile: response.data,
      user: req.session.user,
      isLoggedIn: true
    });
  } catch (error) {
    console.error('Error fetching profile:', error.response?.data || error.message);
    res.status(500).render('error', { 
      message: 'Failed to fetch profile', 
      error: error.response?.data?.message || error.message,
      isLoggedIn: true,
      user: req.session.user
    });
  }
});

// Get repository search suggestions
router.get('/search-suggestions', isAuthenticated, async (req, res) => {
  try {
    const query = req.query.q;
    
    if (!query || query.length < 2) {
      return res.json({ suggestions: [] });
    }

    // Use GitHub's search API to get repository suggestions
    const response = await axios.get('https://api.github.com/search/repositories', {
      headers: getRequestHeaders(req),
      params: {
        q: query,
        per_page: 5,
        sort: 'stars',
        order: 'desc'
      }
    });

    // Format the suggestions
    const suggestions = response.data.items.map(repo => ({
      id: repo.id,
      name: repo.full_name,
      description: repo.description,
      stars: repo.stargazers_count,
      url: repo.html_url
    }));

    res.json({ suggestions });
  } catch (error) {
    console.error('Error fetching suggestions:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch suggestions', 
      message: error.response?.data?.message || error.message
    });
  }
});

// Cards page - display saved repository cards
router.get('/cards', isAuthenticated, (req, res) => {
  res.render('cards', { 
    user: req.session.user,
    isLoggedIn: true
  });
});

// Search repositories (updated to search all of GitHub)
router.get('/search', isAuthenticated, async (req, res) => {
  try {
    const query = req.query.q;
    
    if (!query) {
      return res.redirect('/github/repos');
    }

    // Use GitHub's search API to find repositories across all of GitHub
    const response = await axios.get('https://api.github.com/search/repositories', {
      headers: getRequestHeaders(req),
      params: {
        q: query,
        per_page: 100,
        sort: 'stars',
        order: 'desc'
      }
    });

    // Add language colors directly to repo objects
    const repos = response.data.items.map(repo => {
      return {
        ...repo,
        languageColor: getLanguageColor(repo.language)
      };
    });

    // Render the repos template with search results
    res.render('repos', { 
      repos,
      user: req.session.user,
      isLoggedIn: true,
      searchQuery: query,
      totalCount: response.data.total_count
    });
  } catch (error) {
    console.error('Error searching repositories:', error.response?.data || error.message);
    res.status(500).render('error', { 
      message: 'Failed to search repositories', 
      error: error.response?.data?.message || error.message,
      isLoggedIn: true,
      user: req.session.user
    });
  }
});

// Get repository commits
router.get('/repo-commits', isAuthenticated, async (req, res) => {
  try {
    const repoFullName = req.query.repo;
    
    if (!repoFullName) {
      return res.status(400).json({ error: 'Repository name is required' });
    }
    
    // Get repository info first to check if it exists
    const repoResponse = await axios.get(`https://api.github.com/repos/${repoFullName}`, {
      headers: getRequestHeaders(req)
    });
    
    // Get commits for the repository
    const commitsResponse = await axios.get(`https://api.github.com/repos/${repoFullName}/commits`, {
      headers: getRequestHeaders(req),
      params: {
        per_page: 20 // Limit to 20 most recent commits
      }
    });
    
    res.json({
      repository: repoResponse.data,
      commits: commitsResponse.data
    });
  } catch (error) {
    console.error('Error fetching repository commits:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch repository commits', 
      message: error.response?.data?.message || error.message
    });
  }
});

// Get repository information
router.get('/repo-info', isAuthenticated, async (req, res) => {
  try {
    const repoFullName = req.query.repo;
    
    if (!repoFullName) {
      return res.status(400).json({ error: 'Repository name is required' });
    }
    
    // Get repository info
    const repoResponse = await axios.get(`https://api.github.com/repos/${repoFullName}`, {
      headers: getRequestHeaders(req)
    });
    
    res.json({
      repository: repoResponse.data
    });
  } catch (error) {
    console.error('Error fetching repository info:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch repository info', 
      message: error.response?.data?.message || error.message
    });
  }
});

// Get repository branches
router.get('/repo-branches', isAuthenticated, async (req, res) => {
  try {
    const repoFullName = req.query.repo;
    
    if (!repoFullName) {
      return res.status(400).json({ error: 'Repository name is required' });
    }
    
    // Get repository info first to get default branch
    const repoResponse = await axios.get(`https://api.github.com/repos/${repoFullName}`, {
      headers: getRequestHeaders(req)
    });
    
    // Get branches for the repository
    const branchesResponse = await axios.get(`https://api.github.com/repos/${repoFullName}/branches`, {
      headers: getRequestHeaders(req),
      params: {
        per_page: 100
      }
    });
    
    res.json({
      repository: repoResponse.data,
      branches: branchesResponse.data
    });
  } catch (error) {
    console.error('Error fetching repository branches:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch repository branches', 
      message: error.response?.data?.message || error.message
    });
  }
});

// Get repository contributors
router.get('/repo-contributors', isAuthenticated, async (req, res) => {
  try {
    const repoFullName = req.query.repo;
    
    if (!repoFullName) {
      return res.status(400).json({ error: 'Repository name is required' });
    }
    
    // Get contributors for the repository
    const contributorsResponse = await axios.get(`https://api.github.com/repos/${repoFullName}/contributors`, {
      headers: getRequestHeaders(req),
      params: {
        per_page: 20 // Limit to 20 contributors
      }
    });
    
    res.json({
      contributors: contributorsResponse.data
    });
  } catch (error) {
    console.error('Error fetching repository contributors:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch repository contributors', 
      message: error.response?.data?.message || error.message
    });
  }
});

// Get popular open source repositories
router.get('/popular-repos', isAuthenticated, async (req, res) => {
  try {
    // Search for popular repositories
    const response = await axios.get('https://api.github.com/search/repositories', {
      headers: getRequestHeaders(req),
      params: {
        q: 'stars:>10000',
        sort: 'stars',
        order: 'desc',
        per_page: 7
      }
    });

    // Add language colors to repositories
    const repos = response.data.items.map(repo => {
      return {
        ...repo,
        languageColor: getLanguageColor(repo.language)
      };
    });

    res.json({
      repositories: repos
    });
  } catch (error) {
    console.error('Error fetching popular repositories:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch popular repositories', 
      message: error.response?.data?.message || error.message
    });
  }
});

module.exports = router; 