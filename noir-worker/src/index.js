/* Worker de Noir: recibe la conversación del panel y responde con Workers AI.
   POST /  { messages: [{ role: 'user' | 'assistant', content: '...' }] }
   →       { reply: '...' }
   Errores: { error: 'codigo' } con 400, 403, 405, 429 o 502. */

import { SYSTEM_PROMPT } from './prompt.js';

const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const MAX_MESSAGES = 12;       // solo se envían los últimos turnos
const MAX_CHARS = 600;         // por mensaje del visitante
const MAX_BODY = 16 * 1024;    // bytes del cuerpo de la petición
const MAX_TOKENS = 350;        // largo de la respuesta

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = env.ALLOWED_ORIGINS.split(',').map(s => s.trim());
    const cors = allowed.includes(origin) ? origin : null;

    if (request.method === 'OPTIONS') {
      return cors ? new Response(null, { status: 204, headers: corsHeaders(cors) }) : new Response(null, { status: 403 });
    }
    if (!cors) return json({ error: 'origin' }, 403, null);
    if (request.method !== 'POST') return json({ error: 'method' }, 405, cors);

    const ip = request.headers.get('CF-Connecting-IP') || 'local';
    const { success } = await env.NOIR_LIMIT.limit({ key: ip });
    if (!success) return json({ error: 'rate' }, 429, cors);

    const messages = await readMessages(request);
    if (!messages) return json({ error: 'input' }, 400, cors);

    try {
      let reply = await askModel(env, messages);
      // A veces el modelo devuelve caracteres rotos (U+FFFD) en las tildes: se pide otra vez una sola vez
      if (reply.includes('�')) reply = (await askModel(env, messages)) || reply;
      if (!reply) return json({ error: 'model' }, 502, cors);
      return json({ reply }, 200, cors);
    } catch (e) {
      console.error('Workers AI:', e);
      return json({ error: 'model' }, 502, cors);
    }
  }
};

async function askModel(env, messages) {
  const result = await env.AI.run(MODEL, {
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
    max_tokens: MAX_TOKENS,
    temperature: 0.4
  });
  return typeof result.response === 'string' ? repairAccents(result.response).trim() : '';
}

// El modelo a veces pierde el primer byte de una letra con tilde: "í" (C3 AD) llega como U+FFFD + U+00AD.
// Las tildes del español y el francés empiezan todas por C3, así que se reconstruyen con el segundo byte.
// Excepciones: BF es "¿" (C2 BF) y A1 es "¡" (C2 A1) al inicio de palabra o "á" (C3 A1) dentro de ella.
function repairAccents(text) {
  return text.replace(/�([\u0080-¿])/g, (match, cont, offset) => {
    const code = cont.charCodeAt(0);
    if (code === 0xBF) return '¿';
    if (code === 0xA1 && !/\p{L}/u.test(text[offset - 1] || '')) return '¡';
    return String.fromCharCode(0xC0 + (code - 0x80));
  });
}

// Valida el cuerpo: solo roles user/assistant, texto corto, y el último mensaje del visitante.
// El visitante nunca puede enviar un mensaje "system".
async function readMessages(request) {
  const text = await request.text();
  if (text.length > MAX_BODY) return null;
  let data;
  try { data = JSON.parse(text); } catch (e) { return null; }
  if (!data || !Array.isArray(data.messages) || data.messages.length === 0) return null;

  const messages = data.messages.slice(-MAX_MESSAGES).map(m => ({
    role: m && m.role === 'assistant' ? 'assistant' : 'user',
    content: m && typeof m.content === 'string' ? m.content.trim().slice(0, MAX_CHARS) : ''
  }));
  if (messages.some(m => !m.content)) return null;
  if (messages[messages.length - 1].role !== 'user') return null;
  return messages;
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}

function json(body, status, origin) {
  const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
  return new Response(JSON.stringify(body), { status, headers: origin ? { ...headers, ...corsHeaders(origin) } : headers });
}
