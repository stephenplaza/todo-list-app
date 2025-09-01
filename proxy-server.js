const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 3001;

// Enable CORS for all requests
app.use(cors());
app.use(express.json());

// Claude API proxy endpoint
app.post('/api/claude', async (req, res) => {
    try {
        const { apiKey, todoText } = req.body;
        
        if (!apiKey) {
            return res.status(400).json({ error: 'API key is required' });
        }
        
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-sonnet-20240229',
                max_tokens: 500,
                messages: [{
                    role: 'user',
                    content: `Please provide a helpful summary and analysis of this todo list. Include insights about productivity patterns, priorities, and any recommendations:\n\n${todoText}`
                }]
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            return res.status(response.status).json(errorData);
        }
        
        const data = await response.json();
        res.json(data);
        
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Claude API proxy server running on http://localhost:${PORT}`);
});