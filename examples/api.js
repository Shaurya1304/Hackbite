console.log('API Server ready');
const express = require('express'); const app = express(); app.get('/api/health', (req, res) => res.json({ status: 'ok' })); app.listen(3000, () => console.log('Server running on port 3000'));
