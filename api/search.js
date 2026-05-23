// api/search.js — Tavily search proxy on Vercel

const ALLOWED_ORIGINS = new Set([
  'https://theoberois.com',
  'https://www.theoberois.com',
  'http://localhost:3000',
]);

function applyCors(req, res) {
  const origin = req.headers.origin;
  res.setHeader(
    'Access-Control-Allow-Origin',
    origin && ALLOWED_ORIGINS.has(origin) ? origin : '*'
  );
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
}

module.exports = async (req, res) => {
  applyCors(req, res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const key = process.env.TAVILY_API_KEY;
  if (!key) {
    res.status(500).json({ error: 'TAVILY_API_KEY not configured on Vercel' });
    return;
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (_) {
    res.status(400).json({ error: 'Invalid JSON' });
    return;
  }

  const upstream = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: key,
      query: body.query || '',
      search_depth: body.search_depth || 'basic',
      max_results: body.max_results || 5,
      include_answer: false,
    }),
  });
 
  res.status(upstream.status);
  res.setHeader('Content-Type', 'application/json');
  res.send(await upstream.text());
};
