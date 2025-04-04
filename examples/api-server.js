// API Server with Express
console.log('Starting API server...');
const express = require('express'); const app = express(); app.use(express.json());
app.get('/api/health', (req, res) => { res.json({ status: 'ok', timestamp: new Date(), message: 'Backend Toolkit is working!' }); });
app.listen(3000, () => { console.log('Server running on port 3000'); console.log('Available endpoints:'); console.log('- GET /api/health'); });
