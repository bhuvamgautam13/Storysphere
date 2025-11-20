// server/index.js
import express from 'express';
import fetch from 'node-fetch'; // remove this line if Node18+ and using global fetch
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(express.json());

// Basic health route
app.get('/', (req, res) => res.send('API proxy running'));

// POST /api/generate
app.post('/api/generate', async (req, res) => {
  try {
    const { systemPrompt, userPrompt, max_tokens, temperature } = req.body;

    // Basic validation
    if (!systemPrompt || !userPrompt) {
      return res.status(400).json({ error: 'Missing prompts' });
    }

    // Make provider request (example: Anthropic). Adjust headers as your provider requires.
    const providerResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Replace with the correct header your provider uses.
        'x-api-key': process.env.ANTHROPIC_API_KEY
        // or: Authorization: `Bearer ${process.env.ANTHROPIC_API_KEY}`
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: max_tokens || 500,
        temperature: temperature ?? 0.7,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    });

    const data = await providerResp.json();

    if (!providerResp.ok) {
      // Forward useful error details without revealing secrets
      return res.status(providerResp.status).json({ error: data });
    }

    // Send provider response to client (you can transform it if needed)
    return res.json(data);
  } catch (err) {
    console.error('Server generate error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API proxy listening on ${PORT}`));
// server/index.js
import express from 'express';
import fetch from 'node-fetch'; // remove this line if Node18+ and using global fetch
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(express.json());

// Basic health route
app.get('/', (req, res) => res.send('API proxy running'));

// POST /api/generate
app.post('/api/generate', async (req, res) => {
  try {
    const { systemPrompt, userPrompt, max_tokens, temperature } = req.body;

    // Basic validation
    if (!systemPrompt || !userPrompt) {
      return res.status(400).json({ error: 'Missing prompts' });
    }

    // Make provider request (example: Anthropic). Adjust headers as your provider requires.
    const providerResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Replace with the correct header your provider uses.
        'x-api-key': process.env.ANTHROPIC_API_KEY
        // or: Authorization: `Bearer ${process.env.ANTHROPIC_API_KEY}`
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: max_tokens || 500,
        temperature: temperature ?? 0.7,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    });

    const data = await providerResp.json();

    if (!providerResp.ok) {
      // Forward useful error details without revealing secrets
      return res.status(providerResp.status).json({ error: data });
    }

    // Send provider response to client (you can transform it if needed)
    return res.json(data);
  } catch (err) {
    console.error('Server generate error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API proxy listening on ${PORT}`));
