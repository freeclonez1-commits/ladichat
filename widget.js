/*!
 * LadiChat Widget v1.0
 * Self-contained chat widget for LadiPage
 * Inject: <script src="URL/widget.js" async></script>
 */
(function() {
  'use strict';

  // ===================================================
  // ⚩️  CONFIG — Chỉ sửa ở đây
  // ===================================================
  var CFG = {
    firebase: {
      apiKey: "AIzaSyBixlTG4JuR3bx8OZ_27VRZ3YqDxVvSylM",
      authDomain: "gen-lang-client-0957346569.firebaseapp.com",
      databaseURL: "gen-lang-client-0957346569-default-rtdb.firebaseio.com",
      projectId: "gen-lang-client-0957346569",
      storageBucket: "gen-lang-client-0957346569.firebasestorage.app",
      messagingSenderId: "318435093664",
      appId: "1:318435093664:web:f8f3f68da5c4da352fadc5"
    },
    // 🔒 Token Telegram đã được chuyển sang Cloudflare Worker (không lò ra ở đây)
    // Sau khi deploy worker, thay URL này bằng URL worker của bạn:
    notifyUrl: 'https://nk-notify.freeclonez1.workers.dev',
    brandName: 'Support Nike',
    brandSub: 'โดยปกติจะตอบกลับภายในไม่กี่นาที',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg',
    greetingText: 'สวัสดี! รองเท้า Nike Mind สนใจมั้ย? 👋',
    welcomeMsg: function(name) {
      return '\u0e2a\u0e27\u0e31\u0e2a\u0e14\u0e35\u0e04\u0e38\u0e13 ' + name + '! \ud83d\ude0a\n\n\u0e09\u0e31\u0e19\u0e0a\u0e37\u0e48\u0e2d Nike Bot \u0e40\u0e1b\u0e47\u0e19\u0e1c\u0e39\u0e49\u0e0a\u0e48\u0e27\u0e22 AI \u0e02\u0e2d\u0e07\u0e23\u0e49\u0e32\u0e19 Nike Mind \u0e0a\u0e48\u0e27\u0e22\u0e15\u0e2d\u0e1a\u0e04\u0e33\u0e16\u0e32\u0e21\u0e40\u0e01\u0e35\u0e48\u0e22\u0e27\u0e01\u0e31\u0e1a\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32 \u0e23\u0e32\u0e04\u0e32 \u0e41\u0e25\u0e30\u0e01\u0e32\u0e23\u0e2a\u0e31\u0e48\u0e07\u0e0b\u0e37\u0e49\u0e2d\u0e44\u0e14\u0e49\u0e40\u0e25\u0e22\u0e04\u0e48\u0e30\n\n\u0e16\u0e49\u0e32\u0e15\u0e49\u0e2d\u0e07\u0e01\u0e32\u0e23\u0e04\u0e38\u0e22\u0e01\u0e31\u0e1a\u0e1e\u0e19\u0e31\u0e01\u0e07\u0e32\u0e19\u0e08\u0e23\u0e34\u0e07 \u0e41\u0e04\u0e48\u0e1e\u0e34\u0e21\u0e1e\u0e4c\u0e27\u0e48\u0e32 "\u0e02\u0e2d\u0e04\u0e38\u0e22\u0e01\u0e31\u0e1a\u0e1e\u0e19\u0e31\u0e01\u0e07\u0e32\u0e19" \u0e44\u0e14\u0e49\u0e40\u0e25\u0e22\u0e19\u0e30\u0e04\u0e30 \ud83d\ude4f';
    }
  };
  // ===================================================

  // Tránh load 2 lần
  if (window.__nkChatLoaded) return;
  window.__nkChatLoaded = true;

  var NK = {
    db: null,
    sessionId: null,
    isOpen: false,
    unread: 0,
    pendingAnswer: null,
    qrData: [],        // lưu quick replies
    aiMode: false,     // AI Bot đang bật/tắt (per-session)
    globalAIMode: true, // AI Bot bật/tắt toàn cục (từ Admin)
    msgHistory: []     // lịch sử tin nhắn cho Gemini context
  };

  // ===== 1. INJECT CSS =====
  var css = [
    '#nk{font-family:"Helvetica Neue",Arial,sans-serif}',
    '#nk *{box-sizing:border-box;font-family:inherit}',
    '#nk-btn{position:fixed;bottom:28px;right:28px;width:50px;height:50px;border-radius:50%;background:#111;border:none;cursor:pointer;margin:0;padding:0;z-index:2147483647;box-shadow:0 6px 20px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;transition:transform .3s cubic-bezier(.175,.885,.32,1.275),box-shadow .3s}',
    '#nk-btn:hover{transform:scale(1.1);box-shadow:0 10px 28px rgba(0,0,0,.35)}',
    '#nk-btn img{width:28px;filter:invert(1);transition:transform .4s cubic-bezier(.4,0,.2,1);display:block}',
    '#nk-btn.open img{transform:rotate(90deg) scale(0);opacity:0}',
    '#nk-btn::after{content:"✕";position:absolute;color:#fff;font-size:20px;font-weight:400;line-height:1;opacity:0;transform:rotate(-90deg) scale(0);transition:all .4s cubic-bezier(.4,0,.2,1)}',
    '#nk-btn.open::after{opacity:1;transform:rotate(0) scale(1)}',
    '#nk-pulse{position:fixed;bottom:28px;right:28px;width:50px;height:50px;border-radius:50%;background:rgba(0,0,0,.12);z-index:2147483646;animation:nkpulse 2.5s infinite;pointer-events:none}',
    '@keyframes nkpulse{0%{transform:scale(1);opacity:.7}100%{transform:scale(2.2);opacity:0}}',
    '#nk-badge{position:absolute;top:-3px;right:-3px;background:#e00;color:#fff;font-size:10px;font-weight:800;width:20px;height:20px;border-radius:50%;padding:0;margin:0;display:none;align-items:center;justify-content:center;line-height:1;border:2px solid #fff}',
    '#nk-tip{position:fixed;bottom:100px;right:28px;background:#111;color:#fff;padding:10px 18px;border-radius:22px;font-size:13px;font-weight:500;white-space:nowrap;box-shadow:0 4px 18px rgba(0,0,0,.2);z-index:2147483645;pointer-events:none;line-height:1.4;opacity:0;transform:translateY(10px) scale(.94);transition:opacity .3s,transform .3s}',
    '#nk-tip.show{opacity:1;transform:translateY(0) scale(1)}',
    '#nk-tip::after{content:"";position:absolute;bottom:-7px;right:22px;border:7px solid transparent;border-top-color:#111;border-bottom:0}',
    '#nk-box{position:fixed;bottom:95px;right:28px;width:330px;height:500px;max-height:calc(100vh - 140px);background:#fff;border-radius:20px;box-shadow:0 16px 48px rgba(0,0,0,.16);z-index:2147483644;display:flex;flex-direction:column;overflow:hidden;transform:scale(.92) translateY(24px);transform-origin:bottom right;opacity:0;pointer-events:none;transition:all .38s cubic-bezier(.23,1,.32,1)}',
    '#nk-box.open{transform:scale(1) translateY(0);opacity:1;pointer-events:all}',
    '@media(max-width:480px){#nk-box{right:8px;bottom:80px;width:calc(100vw - 16px);height:60vh;max-height:520px;border-radius:16px}#nk-tip{right:8px}#nk-btn,#nk-pulse{right:18px;bottom:18px}}',
    '#nk-hd{background:#111;color:#fff;padding:18px 20px;display:flex;align-items:center;gap:12px;flex-shrink:0}',
    '#nk-hd img{width:38px;filter:invert(1);display:block}',
    '#nk-hi{flex:1;min-width:0}',
    '#nk-hi h3{margin:0;padding:0;font-size:15px;font-weight:700;color:#fff;letter-spacing:-.1px;line-height:1.2}',
    '#nk-hi p{margin:3px 0 0;padding:0;font-size:11.5px;color:rgba(255,255,255,.65);font-weight:400;line-height:1}',
    '#nk-dot{width:9px;height:9px;border-radius:50%;background:#3ecf3e;flex-shrink:0;box-shadow:0 0 8px rgba(62,207,62,.6)}',
    '#nk-ob{padding:28px 22px 24px;flex:1;display:flex;flex-direction:column;justify-content:center;background:#fff;overflow-y:auto}',
    '#nk-ob h4{margin:0 0 8px;padding:0;font-size:21px;font-weight:800;color:#111;letter-spacing:-.4px;line-height:1.2}',
    '#nk-ob>p{margin:0 0 24px;padding:0;font-size:13.5px;color:#777;line-height:1.6}',
    '.nk-ig{margin:0 0 16px;padding:0}',
    '.nk-ig label{display:block;margin:0 0 6px 2px;padding:0;font-size:11px;font-weight:700;color:#444;text-transform:uppercase;letter-spacing:.8px;line-height:1}',
    '.nk-ig input{display:block;width:100%;border:1.5px solid #e8e8e8;border-radius:12px;padding:13px 15px;margin:0;font-size:14px;color:#111;outline:none;transition:border-color .2s,box-shadow .2s;background:#fafafa;line-height:1.4}',
    '.nk-ig input:focus{border-color:#111;background:#fff;box-shadow:0 0 0 3px rgba(0,0,0,.07)}',
    '.nk-ig input::placeholder{color:#bbb}',
    '#nk-start{display:block;width:100%;margin:8px 0 0;padding:14px 0;background:#111;color:#fff;border:none;border-radius:14px;font-size:15px;font-weight:700;cursor:pointer;transition:background .2s,transform .2s;line-height:1;font-family:inherit}',
    '#nk-start:hover{background:#333;transform:translateY(-1px)}',
    '#nk-ci{display:none;flex-direction:column;flex:1;overflow:hidden;background:#f6f6f6;min-height:0}',
    '#nk-msgs{flex:1;overflow-y:auto;padding:18px 14px 8px;display:flex;flex-direction:column;gap:10px;min-height:0}',
    '.nk-mr{display:flex;width:100%;margin:0;padding:0}',
    '.nk-mr.admin{justify-content:flex-start}.nk-mr.customer{justify-content:flex-end}',
    '.nk-mr>div{max-width:82%;display:flex;flex-direction:column}',
    '.nk-mr.admin>div{align-items:flex-start}.nk-mr.customer>div{align-items:flex-end}',
    '.nk-mb{margin:0;padding:10px 15px;border-radius:18px;font-size:14px;line-height:1.55;word-wrap:break-word;word-break:break-word;box-shadow:0 1px 4px rgba(0,0,0,.07);width:fit-content;max-width:100%}',
    '.nk-mr.admin .nk-mb{background:#fff;color:#111;border-bottom-left-radius:5px;border:1px solid #ebebeb}',
    '.nk-mr.customer .nk-mb{background:#111;color:#fff;border-bottom-right-radius:5px}',
    '.nk-mt{margin:4px 2px 0;padding:0;font-size:10px;color:#bbb;font-weight:500;display:block;line-height:1}',
    '#nk-qr{padding:8px 12px 4px;margin:0;display:flex;gap:7px;flex-wrap:wrap;background:#f6f6f6;flex-shrink:0;transition:opacity .2s}',
    '.nk-qb{background:rgba(255,255,255,.75);color:#666;border:1.5px solid #e8e8e8;border-radius:20px;padding:5px 12px;margin:0;font-size:11.5px;font-weight:500;cursor:pointer;line-height:1.3;transition:all .18s;white-space:nowrap;font-family:inherit;opacity:.85}',
    '.nk-qb:hover{background:#111;color:#fff;border-color:#111;opacity:1}',
    '#nk-ss{margin:0;padding:3px 16px 6px;text-align:right;font-size:11px;color:#bbb;display:none;flex-shrink:0;line-height:1}',
    '#nk-ia{padding:10px 12px;margin:0;background:#fff;border-top:1px solid #efefef;display:flex;gap:9px;align-items:flex-end;flex-shrink:0}',
    '#nk-inp{flex:1;border:1.5px solid #e8e8e8;border-radius:22px;padding:10px 16px;margin:0;font-size:14px;resize:none;outline:none;display:block;max-height:110px;min-height:40px;line-height:1.5;transition:border-color .2s,box-shadow .2s;background:#f8f8f8;color:#111;font-family:inherit}',
    '#nk-inp:focus{border-color:#111;background:#fff;box-shadow:0 0 0 3px rgba(0,0,0,.06)}',
    '#nk-inp::placeholder{color:#bbb}',
    '#nk-send{width:40px;height:40px;background:#111;color:#fff;border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .2s,transform .2s;padding:0;margin:0}',
    '#nk-send:hover{background:#333;transform:scale(1.08)}',
    '#nk-send svg{width:16px;height:16px;fill:currentColor;display:block}',
    '#nk-box ::-webkit-scrollbar{width:3px}',
    '#nk-box ::-webkit-scrollbar-track{background:transparent}',
    '#nk-box ::-webkit-scrollbar-thumb{background:#ddd;border-radius:10px}',
    /* AI mode styles */
    '.nk-ai-lbl{font-size:10px;color:#10b981;font-weight:700;margin:0 0 3px 2px;display:flex;align-items:center;gap:3px;line-height:1}',
    '.nk-sys{display:flex;align-items:center;gap:8px;padding:6px 14px;flex-shrink:0}',
    '.nk-sys-line{flex:1;height:1px;background:#e0e0e0}',
    '.nk-sys-txt{font-size:11px;color:#aaa;white-space:nowrap;font-style:italic}',
    '.nk-typing-wrap{display:flex;align-items:flex-end;gap:6px}',
    '.nk-typing{display:flex;align-items:center;gap:4px;padding:10px 14px;background:#fff;border-radius:18px;border-bottom-left-radius:5px;border:1px solid #ebebeb;box-shadow:0 1px 4px rgba(0,0,0,.07)}',
    '.nk-typing span{width:6px;height:6px;border-radius:50%;background:#ccc;display:inline-block;animation:nkdot 1.2s infinite}',
    '.nk-typing span:nth-child(2){animation-delay:.2s}.nk-typing span:nth-child(3){animation-delay:.4s}',
    '@keyframes nkdot{0%,80%,100%{transform:scale(.6);opacity:.5}40%{transform:scale(1);opacity:1}}'
  ].join('');

  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ===== 2. INJECT HTML =====
  var html = [
    '<div id="nk">',
      '<div id="nk-pulse"></div>',
      '<div id="nk-tip">' + nkE(CFG.greetingText) + '</div>',
      '<button id="nk-btn" onclick="__nkToggle()">',
        '<img src="' + CFG.logoUrl + '" alt="' + nkE(CFG.brandName) + '">',
        '<div id="nk-badge">0</div>',
      '</button>',
      '<div id="nk-box">',
      '<div id="nk-hd">',
        '<img id="nk-logo" src="' + CFG.logoUrl + '" alt="">',
        '<div id="nk-hi">',
          '<h3 id="nk-hd-name">' + nkE(CFG.brandName) + '</h3>',
          '<p id="nk-hd-sub">' + nkE(CFG.brandSub) + '</p>',
        '</div>',
        '<div id="nk-dot"></div>',
      '</div>',
      '<div id="nk-ob">',
        '<h4 id="nk-ob-title">Chat với Nike</h4>',
        '<p id="nk-ob-sub">Xin chào! Để chúng tôi hỗ trợ bạn tốt nhất, vui lòng cho biết một vài thông tin nhé.</p>',
        '<div class="nk-ig"><label id="nk-name-lbl">Tên của bạn</label><input type="text" id="nk-name" placeholder="Ví dụ: Nguyễn Văn A"></div>',
        '<div class="nk-ig"><label id="nk-phone-lbl">Số điện thoại</label><input type="tel" id="nk-phone" placeholder="Ví dụ: 0912345678"></div>',
        '<button id="nk-start" onclick="__nkStart()">Bắt đầu cuộc trò chuyện</button>',
      '</div>',
        '<div id="nk-ci">',
          '<div id="nk-msgs"></div>',
          '<div id="nk-ss"></div>',
          '<div id="nk-qr"></div>',
          '<div id="nk-ia">',
            '<textarea id="nk-inp" placeholder="Nhập tin nhắn..." rows="1" oninput="__nkResize(this)" onfocus="__nkShowQR()" onkeydown="if(event.key===\'Enter\'&&!event.shiftKey){event.preventDefault();__nkSend()}"></textarea>',
            '<button id="nk-send" onclick="__nkSend()"><svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>',
          '</div>',
        '</div>',
      '</div>',
    '</div>'
  ].join('');

  var wrap = document.createElement('div');
  wrap.innerHTML = html;
  document.body.appendChild(wrap.firstChild);

  // ===== 4. LOAD FIREBASE ASYNC =====
  // Language packs
  var LANG = {
    vi: {
      obTitle:'Chat với chúng tôi', obSub:'Xin chào! Vui lòng cho biết thông tin để chúng tôi hỗ trợ bạn tốt hơn.',
      nameLabel:'Họ và tên', namePh:'Họ và tên',
      phoneLabel:'Số điện thoại', phonePh:'Số điện thoại',
      startBtn:'Bắt đầu cuộc trò chuyện', inputPh:'Nhập tin nhắn...',
      seen:'✓ Đã xem', sent:'✓ Đã gửi',
      welcome: function(n){ return 'Chào '+n+'! Cảm ơn bạn đã liên hệ. Chúng tôi sẽ hỗ trợ bạn ngay!'; }
    },
    en: {
      obTitle:'Chat with us', obSub:'Hello! Please share your info so we can assist you.',
      nameLabel:'Full name', namePh:'Full name',
      phoneLabel:'Phone number', phonePh:'Phone number',
      startBtn:'Start conversation', inputPh:'Type a message...',
      seen:'✓ Seen', sent:'✓ Sent',
      welcome: function(n){ return 'Hi '+n+'! Thank you for reaching out. We will assist you right away!'; }
    },
    th: {
      obTitle:'แชทกับเรา', obSub:'สวัสดี! กรุณากรอกข้อมูลเพื่อให้เราช่วยเหลือคุณได้ดียิ่งขึ้น',
      nameLabel:'ชื่อ-นามสกุล', namePh:'ชื่อ-นามสกุล',
      phoneLabel:'หมายเลขโทรศัพท์', phonePh:'หมายเลขโทรศัพท์',
      startBtn:'เริ่มการสนทนา', inputPh:'พิมพ์ข้อความ...',
      seen:'✓ เห็นแล้ว', sent:'✓ ส่งแล้ว',
      welcome: function(n){ return 'สวัสดี '+n+'! ขอบคุณที่ติดต่อเรา เราจะช่วยเหลือคุณทันที!'; }
    }
  };
  NK.lp = LANG.th; // default: Thai
  function loadScript(src, cb) {
    if (document.querySelector('script[src="' + src + '"]')) { cb(); return; }
    var s = document.createElement('script');
    s.src = src; s.async = true;
    s.onload = cb;
    s.onerror = function() { console.warn('[NikeChat] Load failed:', src); };
    document.head.appendChild(s);
  }

  var FB = 'https://www.gstatic.com/firebasejs/10.12.0/';
  loadScript(FB + 'firebase-app-compat.js', function() {
    loadScript(FB + 'firebase-database-compat.js', function() {
      try {
        if (!firebase.apps.length) firebase.initializeApp(CFG.firebase);
        NK.db = firebase.database();
        NK.sessionId = localStorage.getItem('nk_chat_session_id');
        nkBoot();
      } catch(e) { console.warn('[NikeChat] Firebase init error:', e); }
    });
  });

  // ===== 4. BOOT =====
  function nkApplySettings(s) {
    if (!s) return;
    var lp = (s.lang && LANG[s.lang]) ? LANG[s.lang] : LANG.vi;
    NK.lp = lp;
    // Tên thương hiệu & sub
    var el;
    if (s.brandName) { el = document.getElementById('nk-hd-name'); if (el) el.textContent = s.brandName; }
    if (s.brandSub)  { el = document.getElementById('nk-hd-sub');  if (el) el.textContent = s.brandSub; }
    // Màu chủ đạo
    if (s.primaryColor) {
      var c = s.primaryColor;
      var ts = document.getElementById('nk-theme') || document.createElement('style');
      ts.id = 'nk-theme';
      ts.textContent = '#nk-btn,#nk-hd,#nk-start,#nk-send,.nk-mr.customer .nk-mb{background:' + c + '!important}'
        + '#nk-tip{background:' + c + '!important}#nk-tip::after{border-top-color:' + c + '!important}';
      document.head.appendChild(ts);
    }
    // Ngôn ngữ
    el = document.getElementById('nk-ob-title'); if (el) el.textContent = lp.obTitle;
    el = document.getElementById('nk-ob-sub');   if (el) el.textContent = lp.obSub;
    el = document.getElementById('nk-name-lbl'); if (el) el.textContent = lp.nameLabel;
    el = document.getElementById('nk-name');     if (el) el.placeholder = lp.namePh;
    el = document.getElementById('nk-phone-lbl');if (el) el.textContent = lp.phoneLabel;
    el = document.getElementById('nk-phone');    if (el) el.placeholder = lp.phonePh;
    el = document.getElementById('nk-start');    if (el) el.textContent = lp.startBtn;
    el = document.getElementById('nk-inp');      if (el) el.placeholder = lp.inputPh;
    // Greeting tooltip
    if (s.greetingText) { el = document.getElementById('nk-tip'); if (el) el.textContent = s.greetingText; }
  }

  function nkBoot() {
     // Load settings trước, rồi mới show greeting
    NK.db.ref('nike-chat/settings').once('value', function(snap) {
      nkApplySettings(snap.val());
      // Greeting tooltip — hiện ngẫu nhiên lặp lại khi chat đang đóng
      var tip = document.getElementById('nk-tip');
      function showTipOnce() {
        if (!NK.isOpen && tip) {
          tip.classList.add('show');
          setTimeout(function() { tip.classList.remove('show'); }, 4000);
        }
      }
      // Lần đầu: hiện sau 1.5s
      setTimeout(showTipOnce, 1500);
      // Lặp lại: mỗi 25-40 giây ngẫu nhiên
      function scheduleNext() {
        var delay = 25000 + Math.random() * 15000; // 25s - 40s
        NK._tipTimer = setTimeout(function() {
          showTipOnce();
          scheduleNext();
        }, delay);
      }
      scheduleNext();
    });
    // Restore session
    if (NK.sessionId) {
      document.getElementById('nk-ob').style.display = 'none';
      document.getElementById('nk-ci').style.display = 'flex';
      nkListenMsgs(); nkListenSeen(); nkLoadQR(); nkListenAIMode();
    }
    // Luôn lắng nghe Global AI Mode
    nkListenGlobalAIMode();
  }

  // ===== 5. GLOBAL HANDLERS (inline onclick cần window scope) =====
  window.__nkToggle = function() {
    var box = document.getElementById('nk-box');
    var btn = document.getElementById('nk-btn');
    var tip = document.getElementById('nk-tip');
    NK.isOpen = !NK.isOpen;
    tip.classList.remove('show');
    if (NK.isOpen) {
      box.classList.add('open'); btn.classList.add('open');
      document.getElementById('nk-pulse').style.display = 'none';
      NK.unread = 0;
      var badge = document.getElementById('nk-badge');
      badge.style.display = 'none';
      if (NK.sessionId && NK.db) NK.db.ref('nike-chat/conversations/' + NK.sessionId + '/unreadCustomer').set(false);
      var m = document.getElementById('nk-msgs');
      m.scrollTop = m.scrollHeight;
    } else {
      box.classList.remove('open'); btn.classList.remove('open');
    }
  };

  window.__nkStart = function() {
    if (!NK.db) return;
    var name = document.getElementById('nk-name').value.trim();
    var phone = document.getElementById('nk-phone').value.trim();
    if (!name || !phone) { alert('Vui lòng nhập đầy đủ Tên và Số điện thoại!'); return; }

    NK.sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    localStorage.setItem('nk_chat_session_id', NK.sessionId);
    localStorage.setItem('nk_chat_name', name);

    NK.db.ref('nike-chat/conversations/' + NK.sessionId).set({
      customerName: name, customerPhone: phone,
      startedAt: Date.now(), lastMessageAt: Date.now(),
      lastMessage: 'Khách hàng bắt đầu hội thoại', unread: true,
      aiMode: true  // bật AI Bot mặc định
    });
    NK.db.ref('nike-chat/conversations/' + NK.sessionId + '/messages').push({
      sender: 'admin', text: CFG.welcomeMsg(name), timestamp: Date.now(), isAI: true
    });
    document.getElementById('nk-ob').style.display = 'none';
    document.getElementById('nk-ci').style.display = 'flex';
    nkListenMsgs(); nkListenSeen(); nkLoadQR(); nkListenAIMode(); nkListenGlobalAIMode();
    nkTg('👤 Khách mới: ' + name + ' (' + phone + ')\nĐã mở cửa sổ chat!');
    // Capture IP
    fetch('https://api64.ipify.org?format=json').then(function(r){ return r.json(); }).then(function(d){
      if (d && d.ip) NK.db.ref('nike-chat/conversations/' + NK.sessionId).update({ userIP: d.ip });
    }).catch(function(){});
  };

  window.__nkSend = function() {
    if (!NK.db || !NK.sessionId) return;
    var inp = document.getElementById('nk-inp');
    var text = inp.value.trim(); if (!text) return;
    inp.value = ''; inp.style.height = 'auto';
    var pendingAnswer = NK.pendingAnswer || null;
    NK.pendingAnswer = null;
    var qr = document.getElementById('nk-qr');
    if (qr) qr.style.display = 'none';
    NK.db.ref('nike-chat/conversations/' + NK.sessionId + '/messages').push({ sender: 'customer', text: text, timestamp: Date.now() });
    NK.db.ref('nike-chat/conversations/' + NK.sessionId).update({ lastMessage: text, lastMessageAt: Date.now(), unread: true });
    nkTg('\uD83D\uDCAC ' + (localStorage.getItem('nk_chat_name') || 'Kh\u00e1ch') + ': ' + text);
    // AI Mode: chỉ gọi AI khi cả session aiMode lẫn globalAIMode đều bật
    if (NK.aiMode && NK.globalAIMode) {
      nkAIReply(text);
    } else if (pendingAnswer) {
      setTimeout(function() {
        if (!NK.db || !NK.sessionId) return;
        NK.db.ref('nike-chat/conversations/' + NK.sessionId + '/messages').push({ sender: 'admin', text: pendingAnswer, timestamp: Date.now() });
        NK.db.ref('nike-chat/conversations/' + NK.sessionId).update({ lastMessage: '[Admin] ' + pendingAnswer, lastMessageAt: Date.now(), unread: false, unreadCustomer: false });
      }, 800);
    }
  };

  // Quick Reply: fill v\u00e0o input, l\u01b0u c\u00e2u tr\u1ea3 l\u1eddi ch\u1edd g\u1eedi
  // D\u00f9ng index thay v\u00ec truy\u1ec1n string tr\u1ef1c ti\u1ebfp \u0111\u1ec3 tr\u00e1nh l\u1ed7i HTML double-quote
  window.__nkQR = function(idx) {
    var item = NK.qrData && NK.qrData[idx];
    if (!item || !NK.db || !NK.sessionId) return;
    var q = item.question || item.text;
    var a = item.answer || null;
    // Ẩn QR ngay
    var qr = document.getElementById('nk-qr');
    if (qr) qr.style.display = 'none';
    // Gửi câu hỏi ngay lập tức
    NK.db.ref('nike-chat/conversations/' + NK.sessionId + '/messages').push({ sender: 'customer', text: q, timestamp: Date.now() });
    NK.db.ref('nike-chat/conversations/' + NK.sessionId).update({ lastMessage: q, lastMessageAt: Date.now(), unread: true });
    nkTg('\uD83D\uDCAC ' + (localStorage.getItem('nk_chat_name') || 'Khách') + ': ' + q);
    // Tự trả lời sau 1s nếu có answer
    if (a) {
      setTimeout(function() {
        NK.db.ref('nike-chat/conversations/' + NK.sessionId + '/messages').push({ sender: 'admin', text: a, timestamp: Date.now() });
        NK.db.ref('nike-chat/conversations/' + NK.sessionId).update({ lastMessage: '[Admin] ' + a, lastMessageAt: Date.now(), unreadCustomer: true });
      }, 1000);
    }
  };

  window.__nkShowQR = function() {
    if (!NK.qrData.length) return;
    var qr = document.getElementById('nk-qr');
    if (qr) qr.style.display = 'flex';
  };

  window.__nkResize = function(el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 100) + 'px'; };

  // ===== 6. CORE FUNCTIONS =====
  function nkShowTyping() {
    var msgs = document.getElementById('nk-msgs');
    if (document.getElementById('nk-typing-row')) return;
    var row = document.createElement('div');
    row.id = 'nk-typing-row'; row.className = 'nk-mr admin';
    row.innerHTML = '<div><div class="nk-ai-lbl">🤖 Nike Bot</div><div class="nk-typing"><span></span><span></span><span></span></div></div>';
    msgs.appendChild(row); msgs.scrollTop = msgs.scrollHeight;
  }
  function nkHideTyping() {
    var el = document.getElementById('nk-typing-row');
    if (el) el.parentNode.removeChild(el);
  }
  function nkShowHandoffDivider() {
    var msgs = document.getElementById('nk-msgs');
    var div = document.createElement('div');
    div.className = 'nk-sys';
    div.innerHTML = '<div class="nk-sys-line"></div><div class="nk-sys-txt">Bạn không còn chat với tác nhân AI nữa</div><div class="nk-sys-line"></div>';
    msgs.appendChild(div); msgs.scrollTop = msgs.scrollHeight;
  }
  function nkListenAIMode() {
    NK.db.ref('nike-chat/conversations/' + NK.sessionId + '/aiMode').on('value', function(snap) {
      var newMode = !!snap.val();
      if (NK.aiMode === true && newMode === false) nkShowHandoffDivider();
      NK.aiMode = newMode;
    });
  }
  function nkListenGlobalAIMode() {
    if (!NK.db) return;
    NK.db.ref('nike-chat/globalAIMode').on('value', function(snap) {
      var wasOn = NK.globalAIMode;
      NK.globalAIMode = snap.val() !== false; // mặc định true nếu chưa set
      // Nếu bị tắt toàn cục trong lúc đang chat → hiển thị divider
      if (wasOn && !NK.globalAIMode && NK.aiMode) nkShowHandoffDivider();
    });
  }
  function nkAIReply(userText) {
    if (!CFG.notifyUrl || CFG.notifyUrl.includes('YOUR_NAME')) return;
    var aiUrl = CFG.notifyUrl.replace(/\/$/, '') + '/ai';
    nkShowTyping();
    fetch(aiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userText, history: NK.msgHistory.slice(-8) })
    })
    .then(function(r) { return r.json(); })
    .then(function(res) {
      nkHideTyping();
      if (!NK.db || !NK.sessionId) return;
      var reply = res.reply || 'Xin lỗi, tôi chưa hiểu câu hỏi này.';
      var handoff = !!res.handoff;
      NK.db.ref('nike-chat/conversations/' + NK.sessionId + '/messages').push({
        sender: 'admin', text: reply, timestamp: Date.now(), isAI: true
      });
      NK.db.ref('nike-chat/conversations/' + NK.sessionId).update({
        lastMessage: '[AI] ' + reply, lastMessageAt: Date.now(), unreadCustomer: true
      });
      if (handoff) {
        NK.db.ref('nike-chat/conversations/' + NK.sessionId).update({ aiMode: false });
      }
    })
    .catch(function() { nkHideTyping(); });
  }
  function nkListenMsgs() {
    var msgs = document.getElementById('nk-msgs');
    var first = true;
    NK.db.ref('nike-chat/conversations/' + NK.sessionId + '/messages').on('child_added', function(snap) {
      var msg = snap.val();
      // Track history for AI context
      if (msg.sender === 'customer' || msg.sender === 'admin') NK.msgHistory.push(msg);
      if (msg.sender === 'system') {
        // System divider message
        var div = document.createElement('div'); div.className = 'nk-sys';
        div.innerHTML = '<div class="nk-sys-line"></div><div class="nk-sys-txt">' + nkE(msg.text) + '</div><div class="nk-sys-line"></div>';
        msgs.appendChild(div); msgs.scrollTop = msgs.scrollHeight; return;
      }
      var row = document.createElement('div');
      row.className = 'nk-mr ' + msg.sender;
      var aiBadge = (msg.isAI && msg.sender === 'admin') ? '<div class="nk-ai-lbl">🤖 Nike Bot</div>' : '';
      row.innerHTML = '<div>' + aiBadge + '<div class="nk-mb">' + nkE(msg.text) + '</div><div class="nk-mt">' + nkTime(msg.timestamp) + '</div></div>';
      msgs.appendChild(row);
      msgs.scrollTop = msgs.scrollHeight;
      if (!first && msg.sender === 'admin') {
        if (!NK.isOpen) {
          NK.unread++;
          var b = document.getElementById('nk-badge');
          b.textContent = NK.unread; b.style.display = 'flex';
          // Dùng AudioContext thay vì Audio CDN để kiểm soát âm lượng
          try {
            var ac = new (window.AudioContext || window.webkitAudioContext)();
            var o = ac.createOscillator(); var g = ac.createGain();
            o.connect(g); g.connect(ac.destination);
            o.type = 'sine';
            o.frequency.setValueAtTime(1200, ac.currentTime);
            o.frequency.exponentialRampToValueAtTime(800, ac.currentTime + 0.12);
            g.gain.setValueAtTime(0.04, ac.currentTime); // rất nhỏ
            g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.25);
            o.start(); o.stop(ac.currentTime + 0.25);
          } catch(e){}
        } else {
          NK.db.ref('nike-chat/conversations/' + NK.sessionId + '/unreadCustomer').set(false);
        }
      }
    });
    setTimeout(function() { first = false; }, 1000);
  }

  function nkListenSeen() {
    NK.db.ref('nike-chat/conversations/' + NK.sessionId).on('value', function(snap) {
      var c = snap.val(); if (!c) return;
      var el = document.getElementById('nk-ss');
      var byCustomer = c.lastMessage && !c.lastMessage.startsWith('[Admin]') && c.lastMessage !== 'Khách hàng bắt đầu hội thoại';
      if (el) {
        if (byCustomer) { el.style.display = 'block'; el.textContent = (c.unread === false) ? '✓ Đã xem' : '✓ Đã gửi'; }
        else { el.style.display = 'none'; }
      }
    });
  }

  function nkLoadQR() {
    NK.db.ref('nike-chat/quickReplies').on('value', function(snap) {
      var data = snap.val();
      var qr = document.getElementById('nk-qr');
      if (!data) { qr.style.display = 'none'; return; }
      var items = Object.values(data).filter(function(v) { return v && (v.question || v.text); });
      if (!items.length) { qr.style.display = 'none'; return; }
      NK.qrData = items; // l\u01b0u v\u00e0o NK \u0111\u1ec3 __nkQR(idx) tra c\u1ee9u sau
      qr.style.display = 'flex';
      qr.innerHTML = items.map(function(item, idx) {
        var q = item.question || item.text;
        // D\u00f9ng idx thay v\u00ec JSON.stringify(q) \u0111\u1ec3 tr\u00e1nh v\u1ee1 HTML attribute
        return '<button class="nk-qb" onclick="__nkQR(' + idx + ')">' + nkE(q) + '</button>';
      }).join('');
    });
  }

  function nkTg(text) {
    if (!CFG.notifyUrl || CFG.notifyUrl.includes('YOUR_NAME')) return; // chưa cài worker
    fetch(CFG.notifyUrl, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ text: text })
    }).catch(function(){});
  }

  function nkE(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>'); }
  function nkTime(ts) {
    var d = new Date(ts);
    return d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
  }
})();
