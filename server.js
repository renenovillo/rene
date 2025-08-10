const http = require('http');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');

function serveStatic(res, filePath, contentType) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
}

async function generateResponse(language, messages) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      reply: `[${language}] API key missing. Placeholder response.`,
      feedback: 'Set OPENAI_API_KEY to enable LLM responses.'
    };
  }

  const system = `You are a helpful language tutor that converses in ${language}.`;
  const payload = {
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'system', content: system }, ...messages]
  };

  const completion = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });
  const data = await completion.json();
  const reply = data?.choices?.[0]?.message?.content || '';

  const fbPrompt = `Provide grammar, vocabulary and syntax feedback for the following sentence in ${language}: ${messages[messages.length - 1].content}`;
  const fbPayload = {
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'You are a language teacher offering concise feedback.' },
      { role: 'user', content: fbPrompt }
    ]
  };
  const fbCompletion = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(fbPayload)
  });
  const fbData = await fbCompletion.json();
  const feedback = fbData?.choices?.[0]?.message?.content?.trim() || '';

  return { reply, feedback };
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET') {
    const url = req.url === '/' ? '/index.html' : req.url;
    const ext = path.extname(url);
    const contentTypes = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css'
    };
    const filePath = path.join(publicDir, url);
    if (contentTypes[ext]) {
      serveStatic(res, filePath, contentTypes[ext]);
    } else {
      res.writeHead(404);
      res.end();
    }
  } else if (req.method === 'POST' && req.url === '/api/chat') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const { language, messages } = JSON.parse(body);
        const result = await generateResponse(language, messages);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Server error', details: err.message }));
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
