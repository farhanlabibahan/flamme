// Vercel serverless function: the SI layer. Two modes, both stateless.
//   {mode:'parse', question}              -> structured scenario fields
//   {mode:'interpret', question, rows, gaps} -> summary grounded ONLY in rows
// Uses Groq's free, OpenAI-compatible API. Needs GROQ_API_KEY in Vercel env vars.
const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

const PARSE_SYSTEM = `You convert a fire-safety question into scenario fields for a NASA microgravity combustion database.
Reply with ONE JSON object and nothing else, with keys:
material (one of "Cotton–fiberglass (SIBAL)","Silicone","PMMA", or ""), oxygen (percent O2 as a string, or ""),
airflow (cm/s as a string, or ""), direction ("Opposed","Concurrent", or ""), pressure_atm (number or null),
gravity_g (number or null; 0 for microgravity), in_scope (false if the question is about rocket engines/propellants or is unrelated to spacecraft fire safety).
Use "" / null when not stated. Never guess values the question does not give.`;

const INTERPRET_SYSTEM = `You are a fire-safety analyst summarizing NASA PSI microgravity combustion findings for engineers.
Use ONLY the findings provided in the user message. Do not use outside knowledge, and do not invent numbers.
Reply with ONE JSON object and nothing else:
{"summary": "2-3 sentences answering the question from the evidence",
 "points": [{"text": "one claim", "finding_ids": ["ids from the provided rows that support it"]}],
 "limits": "what the evidence does not cover, including any provided gaps"}
Every point must cite at least one provided finding_id. If the rows do not answer the question, say so in summary and return an empty points array.`;

async function callModel(system, user) {
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {'content-type': 'application/json', authorization: `Bearer ${process.env.GROQ_API_KEY}`},
    body: JSON.stringify({
      model: MODEL, temperature: 0.1, max_tokens: 2500,
      // gpt-oss models reason before answering; keep that short so the JSON is not cut off
      ...(MODEL.startsWith('openai/gpt-oss') && {reasoning_effort: 'low'}),
      response_format: {type: 'json_object'},
      messages: [{role: 'system', content: system}, {role: 'user', content: user}],
    }),
  });
  if (!r.ok) throw new Error(`groq ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const j = await r.json();
  return JSON.parse(j.choices?.[0]?.message?.content || '{}');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({error: 'POST only'});
  if (!process.env.GROQ_API_KEY) return res.status(503).json({error: 'SI layer not configured'});
  try {
    const {mode, question, rows, gaps} = req.body || {};
    const q = String(question || '').slice(0, 500);
    if (!q) return res.status(400).json({error: 'question required'});
    if (mode === 'parse') return res.status(200).json(await callModel(PARSE_SYSTEM, q));
    if (mode === 'interpret') {
      const safeRows = (Array.isArray(rows) ? rows : []).slice(0, 6);
      const safeGaps = (Array.isArray(gaps) ? gaps : []).slice(0, 3);
      const out = await callModel(INTERPRET_SYSTEM, `Question: ${q}\n\nFindings:\n${JSON.stringify(safeRows)}\n\nKnown evidence gaps:\n${JSON.stringify(safeGaps)}`);
      return res.status(200).json(out);
    }
    return res.status(400).json({error: 'bad mode'});
  } catch (e) {
    console.error('[api/ask]', e?.cause?.code || '', e?.message);
    return res.status(502).json({error: 'SI request failed'});
  }
}
