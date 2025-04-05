const express = require('express');
const router = express.Router();
const axios = require('axios');
const { getLanguageColor } = require('../utils/helpers');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.accessToken) {
    return next();
  }
  res.redirect('/login');
};

// Get user's repositories
router.get('/repos', isAuthenticated, async (req, res) => {
  try {
    const response = await axios.get('https://api.github.com/user/repos', {
      headers: {
        'Authorization': `token ${req.session.user.accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      },
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
    const response = await axios.get('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${req.session.user.accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
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
      headers: {
        'Authorization': `token ${req.session.user.accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      },
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
      headers: {
        'Authorization': `token ${req.session.user.accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      },
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
      headers: {
        'Authorization': `token ${req.session.user.accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    // Get commits for the repository
    const commitsResponse = await axios.get(`https://api.github.com/repos/${repoFullName}/commits`, {
      headers: {
        'Authorization': `token ${req.session.user.accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      },
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
      headers: {
        'Authorization': `token ${req.session.user.accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
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
      headers: {
        'Authorization': `token ${req.session.user.accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    // Get branches for the repository
    const branchesResponse = await axios.get(`https://api.github.com/repos/${repoFullName}/branches`, {
      headers: {
        'Authorization': `token ${req.session.user.accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      },
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
      headers: {
        'Authorization': `token ${req.session.user.accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      },
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

module.exports = router; 