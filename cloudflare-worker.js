/**
 * Cloudflare Worker — Telegram Proxy + AI Reply (Beeknoee)
 *
 * ⚠️  SECRETS — KHÔNG hardcode vào file này!
 *   wrangler secret put TG_TOKEN
 *   wrangler secret put TG_CHAT_ID
 *   wrangler secret put BEE_API_KEY
 *
 * Deploy: wrangler deploy
 */

const ALLOWED_ORIGINS = [
  'https://nike-mind.online',
  'http://nike-mind.online',
  'https://www.nike-mind.online',
  'http://www.nike-mind.online',
  'https://freeclonez1-commits.github.io',
];

const rateLimitMap = new Map();
const RATE_LIMIT  = 10;
const RATE_WINDOW = 60_000;

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

// ─── Beeknoee AI Chat (OpenAI-compatible format) ─────────────────────────────
const BEE_BASE_URL = 'https://platform-api.beeknoee.com/v1';
const BEE_MODEL    = 'openai/gpt-oss-120b';

const AI_SYSTEM_PROMPT = `You are "Nike Bot" — a friendly, natural-sounding AI sales assistant for the Nike Mind store in Thailand.

== LANGUAGE RULES (CRITICAL) ==
- Detect the language of EACH customer message automatically.
- Thai message → reply in warm, natural, conversational Thai (ภาษาไทยธรรมชาติ).
- Vietnamese message → reply in Vietnamese.
- English message → reply in English.
- NEVER mix two languages in one reply.

== YOUR PERSONALITY ==
- Warm, friendly, like a knowledgeable shop assistant — NOT robotic or overly formal.
- Use natural sentence structure with proper subject/verb. Break into short paragraphs when listing info.
- Use emoji sparingly (1-2 max) to feel approachable.
- Keep answers under 100 words but always COMPLETE — never cut off mid-sentence.

== STORE INFO ==
- Store name: Nike Mind
- Website: http://www.nike-mind.online/test
- Tagline: รองเท้าที่เปลี่ยนความคิด (Shoes that change your mind)
- Target: Thailand market
- Shipping: ฟรีทั่วประเทศไทย (Free nationwide shipping in Thailand)
- Return: คืนสินค้าได้ภายใน 7 วัน (7-day easy returns)
- Payment: COD, โอนเงิน, PromptPay
- Phone: 099-999-999x

== PRODUCTS ==

▸ Nike Mind 001
  • ราคาขาย: 1,500 ฿ | ราคาปกติ: 3,200 ฿ (ลด 53%)
  • สีที่มี: แดง, เทา/ขาว, ดำ, เขียว, แดงเข้ม, ครีม (6 สี)
  • ประเภท: รองเท้าแตะสวมหัว (Recovery Slide)
  • จุดเด่น:
    - พื้นรองเท้านวดเท้าด้วยปุ่มกระตุ้นประสาทสัมผัส
    - ออกแบบสำหรับใช้ก่อนและหลังออกกำลังกาย
    - เหมาะทั้งในบ้านและนอกบ้าน
    - น้ำหนักเบา ใส่สบาย
  • สถานะ: มีสินค้าพร้อมส่ง ✅
  • ลิงก์สั่งซื้อ: http://www.nike-mind.online/test

▸ Nike Mind 002
  • สถานะ: ขายหมดแล้ว ❌
  • กำลังรอสต็อกใหม่ — ลูกค้าฝากเบอร์โทรไว้ได้ เราจะแจ้งเมื่อมีสินค้า

== RESPONSE RULES ==
1. Answer only what the customer asks — don't dump all info at once.
2. When asked about the website → ALWAYS say: http://www.nike-mind.online/test
3. When asked about price → mention BOTH sale price (1,500 ฿) and original price (3,200 ฿).
4. When asked "how to reach a human agent" or "what if I want staff" → EXPLAIN the process (say "type 'ขอคุยกับพนักงาน' and we'll connect you"), set handoff: false.
5. ONLY set handoff: true when the customer EXPLICITLY requests to speak with a human agent RIGHT NOW (e.g. "ขอคุยกับพนักงาน", "อยากคุยกับคน", "cho tôi gặp nhân viên", "connect me to staff").
6. CRITICAL OUTPUT FORMAT: Respond with ONLY a raw JSON object. NO markdown, NO code fences, NO extra text before or after.

Output format:
{"reply":"<your answer in customer's language>","handoff":false}

== EXAMPLES ==
User (Thai): "รองเท้า Nike Mind 001 ราคาเท่าไหร่?"
{"reply":"Nike Mind 001 ราคาพิเศษอยู่ที่ 1,500 ฿ นะคะ\nจากราคาปกติ 3,200 ฿ ลดไปถึง 53% เลย!\nมีให้เลือก 6 สี ได้แก่ แดง เทา ดำ เขียว แดงเข้ม และครีม\nสั่งซื้อได้เลยที่ http://www.nike-mind.online/test ค่ะ 😊","handoff":false}

User (Thai): "ถ้าอยากคุยกับพนักงานต้องทำยังไง?"
{"reply":"ง่ายมากเลยค่ะ! ถ้าอยากคุยกับพนักงานของเรา แค่พิมพ์ว่า 'ขอคุยกับพนักงาน' แล้วเราจะส่งต่อให้ทันทีเลยนะคะ","handoff":false}

User (Thai): "ขอคุยกับพนักงาน"
{"reply":"ได้เลยค่ะ! รอสักครู่นะคะ กำลังโอนสายให้พนักงานของเราเลย 😊","handoff":true}

User (Thai): "มีไซส์อะไรบ้าง?"
{"reply":"Nike Mind 001 มีไซส์ตั้งแต่ EU 36 ถึง EU 45 นะคะ\nถ้าไม่แน่ใจว่าควรเลือกไซส์ไหน บอกไซส์เท้าปกติของคุณมาได้เลย เราจะช่วยแนะนำค่ะ","handoff":false}

User (Vietnamese): "giá bao nhiêu?"
{"reply":"Nike Mind 001 đang có giá ưu đãi 1,500 ฿ nha bạn!\nGiá gốc là 3,200 ฿ — giảm tới 53% luôn.\nCó 6 màu để chọn. Đặt hàng tại http://www.nike-mind.online/test nhé 😊","handoff":false}`;

async function callBeeknoee(env, message, history) {
  const key = env.BEE_API_KEY;
  if (!key) return { reply: 'AI tạm thời không khả dụng. Nhân viên sẽ hỗ trợ bạn ngay!', handoff: true };

  const messages = [{ role: 'system', content: AI_SYSTEM_PROMPT }];
  if (Array.isArray(history)) {
    history.slice(-8).forEach(h => {
      if (h.sender === 'customer')      messages.push({ role: 'user',      content: h.text });
      else if (h.sender === 'admin')    messages.push({ role: 'assistant', content: h.text });
    });
  }
  messages.push({ role: 'user', content: message });

  try {
    const res = await fetch(`${BEE_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type' : 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({ model: BEE_MODEL, messages, max_tokens: 450, temperature: 0.75 }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[nk-notify] Beeknoee error:', res.status, errText);
      throw new Error('Beeknoee HTTP ' + res.status);
    }

    const data = await res.json();
    let raw = data.choices?.[0]?.message?.content || '';

    // Strip markdown code fences if present (```json ... ```)
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

    // Extract first valid JSON object from response
    const m = raw.match(/\{[\s\S]*?\}/);
    if (m) {
      try {
        const parsed = JSON.parse(m[0]);
        const reply  = String(parsed.reply || '').trim();
        // Safety: if reply still contains raw JSON-like text, clean it
        if (reply && !reply.startsWith('{')) {
          return { reply, handoff: !!parsed.handoff };
        }
      } catch(_) { /* fall through */ }
    }
    // Fallback: return raw if it's plain text (not JSON)
    if (raw && !raw.startsWith('{')) return { reply: raw, handoff: false };
    return { reply: 'ขออภัยค่ะ ระบบกำลังมีปัญหาชั่วคราว กรุณาลองใหม่อีกครั้งนะคะ', handoff: false };

  } catch(e) {
    console.error('[nk-notify] AI error:', e);
    return { reply: 'Xin lỗi, AI tạm thời gặp sự cố. Nhân viên sẽ liên hệ bạn sớm!', handoff: true };
  }
}
// ─────────────────────────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const origin    = request.headers.get('Origin') || '';
    // Dùng includes() để tránh lỗi trailing slash hoặc port
    const isAllowed = ALLOWED_ORIGINS.some(o => origin === o || origin.startsWith(o + '/')) || origin === '';
    console.log('[nk-notify] Origin:', origin, '| allowed:', isAllowed);

    const corsHeaders = {
      'Access-Control-Allow-Origin' : isAllowed ? origin : 'null',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
    if (request.method !== 'POST')    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    if (!isAllowed)                   return new Response('Forbidden', { status: 403 });

    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (!checkRateLimit(clientIP))
      return new Response('Too many requests', { status: 429, headers: corsHeaders });

    const url = new URL(request.url);

    // ─── Route: POST /ai ─── Beeknoee AI Reply
    if (url.pathname === '/ai') {
      try {
        const body = await request.json();
        const { message, history } = body;
        if (!message || typeof message !== 'string' || message.length > 2000)
          return new Response('Bad request', { status: 400, headers: corsHeaders });
        const result = await callBeeknoee(env, message, history || []);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch(e) {
        return new Response(JSON.stringify({ reply: 'Lỗi xử lý AI.', handoff: false }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // ─── Route: POST / ─── Telegram Notification
    const TG_TOKEN   = env.TG_TOKEN;
    const TG_CHAT_ID = env.TG_CHAT_ID;
    if (!TG_TOKEN || !TG_CHAT_ID) {
      console.error('[nk-notify] Missing TG_TOKEN or TG_CHAT_ID secrets!');
      return new Response('Server misconfigured', { status: 500 });
    }
    try {
      const body = await request.json();
      const text = body.text;
      if (!text || typeof text !== 'string' || text.length > 2000)
        return new Response('Bad request', { status: 400 });
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
    } catch(e) {
      return new Response(JSON.stringify({ ok: false }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};
