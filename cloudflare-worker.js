/**
 * Cloudflare Worker — Telegram Notification Proxy
 * Deploy tại: https://dash.cloudflare.com → Workers & Pages → Create Worker
 *
 * Sau khi deploy, copy URL worker (vd: https://nk-notify.your-name.workers.dev)
 * và điền vào widget.js ở biến NK_NOTIFY_URL
 */

// ⚙️ Điền token và chat ID của bạn vào đây (chỉ lưu trên server, không lộ ra ngoài)
const TG_TOKEN = '7890410484:AAHxMwViGPM-nmuG_U2sHjwF_7Ajs2VA0T0';
const TG_CHAT_ID = '6843744862';

// Danh sách domain được phép gọi (CORS whitelist)
const ALLOWED_ORIGINS = [
  'https://nike-mind.online',
  'http://nike-mind.online',
  'https://www.nike-mind.online',
  'http://www.nike-mind.online',
  'https://freeclonez1-commits.github.io',
];

export default {
  async fetch(request) {
    const origin = request.headers.get('Origin') || '';
    const isAllowed = ALLOWED_ORIGINS.some(o => origin.startsWith(o));

    const corsHeaders = {
      'Access-Control-Allow-Origin': isAllowed ? origin : 'null',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Rate limit cơ bản: chỉ chấp nhận từ origin được phép
    if (!isAllowed) {
      return new Response('Forbidden', { status: 403 });
    }

    try {
      const body = await request.json();
      const text = body.text;
      if (!text || typeof text !== 'string' || text.length > 2000) {
        return new Response('Bad request', { status: 400 });
      }

      // Gọi Telegram (token chỉ nằm ở đây, không lộ ra client)
      const tgRes = await fetch(
        `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: TG_CHAT_ID, text: 'Nike Chat\n---\n' + text }),
        }
      );

      const result = await tgRes.json();
      return new Response(JSON.stringify({ ok: result.ok }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (e) {
      return new Response(JSON.stringify({ ok: false }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};
