/**
 * Cloudflare Worker — Telegram Notification Proxy
 *
 * ⚠️  SECRETS — KHÔNG hardcode vào file này!
 * Chạy lệnh sau để set secrets an toàn:
 *   wrangler secret put TG_TOKEN
 *   wrangler secret put TG_CHAT_ID
 *
 * Sau khi set, deploy lại: wrangler deploy
 */

// Danh sách domain được phép gọi (CORS whitelist)
const ALLOWED_ORIGINS = [
  'https://nike-mind.online',
  'http://nike-mind.online',
  'https://www.nike-mind.online',
  'http://www.nike-mind.online',
  'https://freeclonez1-commits.github.io',
];

// Rate limiting: tối đa 10 requests / 60s mỗi IP (in-memory, reset khi worker restart)
const rateLimitMap = new Map();
const RATE_LIMIT   = 10;
const RATE_WINDOW  = 60_000; // ms

function checkRateLimit(ip) {
  const now   = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.start > RATE_WINDOW) {
    rateLimitMap.set(ip, { start: now, count: 1 });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export default {
  async fetch(request, env) {
    // Lấy secrets từ Cloudflare environment (đã set qua wrangler secret put)
    const TG_TOKEN   = env.TG_TOKEN;
    const TG_CHAT_ID = env.TG_CHAT_ID;

    if (!TG_TOKEN || !TG_CHAT_ID) {
      console.error('[nk-notify] Missing TG_TOKEN or TG_CHAT_ID secrets!');
      return new Response('Server misconfigured', { status: 500 });
    }

    const origin    = request.headers.get('Origin') || '';
    const isAllowed = ALLOWED_ORIGINS.some(o => origin.startsWith(o));

    const corsHeaders = {
      'Access-Control-Allow-Origin' : isAllowed ? origin : 'null',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Chặn origin không hợp lệ
    if (!isAllowed) {
      return new Response('Forbidden', { status: 403 });
    }

    // Rate limiting theo IP thực (CF-Connecting-IP)
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (!checkRateLimit(clientIP)) {
      return new Response('Too many requests', { status: 429, headers: corsHeaders });
    }

    try {
      const body = await request.json();
      const text = body.text;

      if (!text || typeof text !== 'string' || text.length > 2000) {
        return new Response('Bad request', { status: 400 });
      }

      // Gọi Telegram — token chỉ tồn tại trong env, không bao giờ lộ ra client
      const tgRes = await fetch(
        `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`,
        {
          method : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body   : JSON.stringify({ chat_id: TG_CHAT_ID, text: 'Nike Chat\n---\n' + text }),
        }
      );

      const result = await tgRes.json();
      return new Response(JSON.stringify({ ok: result.ok }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (e) {
      return new Response(JSON.stringify({ ok: false }), {
        status : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};
