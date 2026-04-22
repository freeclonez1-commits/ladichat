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
    brandSub: 'Thường trả lời trong vài phút',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg',
    greetingText: 'Trò chuyện cùng Support Nike 👋',
    welcomeMsg: function(name) { return 'Chào ' + name + '! Cảm ơn bạn đã quan tâm đến Nike. Bạn cần tư vấn sản phẩm nào ạ?'; }
  };
  // ===================================================

  // Tránh load 2 lần
  if (window.__nkChatLoaded) return;
  window.__nkChatLoaded = true;

  var NK = {
    db: null,
    sessionId: null,
    isOpen: false,
    unread: 0
  };

  // ===== 1. INJECT CSS =====
  var css = [
    '#nk{font-family:"Helvetica Neue",Arial,sans-serif}',
    '#nk *{box-sizing:border-box;font-family:inherit}',
    '#nk-btn{position:fixed;bottom:28px;right:28px;width:60px;height:60px;border-radius:50%;background:#111;border:none;cursor:pointer;margin:0;padding:0;z-index:2147483647;box-shadow:0 6px 20px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;transition:transform .3s cubic-bezier(.175,.885,.32,1.275),box-shadow .3s}',
    '#nk-btn:hover{transform:scale(1.1);box-shadow:0 10px 28px rgba(0,0,0,.35)}',
    '#nk-btn img{width:28px;filter:invert(1);transition:transform .4s cubic-bezier(.4,0,.2,1);display:block}',
    '#nk-btn.open img{transform:rotate(90deg) scale(0);opacity:0}',
    '#nk-btn::after{content:"✕";position:absolute;color:#fff;font-size:20px;font-weight:400;line-height:1;opacity:0;transform:rotate(-90deg) scale(0);transition:all .4s cubic-bezier(.4,0,.2,1)}',
    '#nk-btn.open::after{opacity:1;transform:rotate(0) scale(1)}',
    '#nk-pulse{position:fixed;bottom:28px;right:28px;width:60px;height:60px;border-radius:50%;background:rgba(0,0,0,.12);z-index:2147483646;animation:nkpulse 2.5s infinite;pointer-events:none}',
    '@keyframes nkpulse{0%{transform:scale(1);opacity:.7}100%{transform:scale(2.2);opacity:0}}',
    '#nk-badge{position:absolute;top:-3px;right:-3px;background:#e00;color:#fff;font-size:10px;font-weight:800;width:20px;height:20px;border-radius:50%;padding:0;margin:0;display:none;align-items:center;justify-content:center;line-height:1;border:2px solid #fff}',
    '#nk-tip{position:fixed;bottom:100px;right:28px;background:#111;color:#fff;padding:10px 18px;border-radius:22px;font-size:13px;font-weight:500;white-space:nowrap;box-shadow:0 4px 18px rgba(0,0,0,.2);z-index:2147483645;pointer-events:none;line-height:1.4;opacity:0;transform:translateY(10px) scale(.94);transition:opacity .3s,transform .3s}',
    '#nk-tip.show{opacity:1;transform:translateY(0) scale(1)}',
    '#nk-tip::after{content:"";position:absolute;bottom:-7px;right:22px;border:7px solid transparent;border-top-color:#111;border-bottom:0}',
    '#nk-box{position:fixed;bottom:105px;right:28px;width:370px;height:580px;max-height:calc(100vh - 140px);background:#fff;border-radius:20px;box-shadow:0 16px 48px rgba(0,0,0,.16);z-index:2147483644;display:flex;flex-direction:column;overflow:hidden;transform:scale(.92) translateY(24px);transform-origin:bottom right;opacity:0;pointer-events:none;transition:all .38s cubic-bezier(.23,1,.32,1)}',
    '#nk-box.open{transform:scale(1) translateY(0);opacity:1;pointer-events:all}',
    '@media(max-width:480px){#nk-box{right:8px;bottom:90px;width:calc(100vw - 16px);height:calc(100vh - 106px);max-height:none;border-radius:18px}#nk-tip{right:8px}#nk-btn,#nk-pulse{right:18px;bottom:18px}}',
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
    '#nk-qr{padding:8px 12px 4px;margin:0;display:flex;gap:7px;flex-wrap:wrap;background:#f6f6f6;flex-shrink:0}',
    '.nk-qb{background:#fff;color:#333;border:1.5px solid #e0e0e0;border-radius:20px;padding:6px 13px;margin:0;font-size:12px;font-weight:500;cursor:pointer;line-height:1.3;transition:all .18s;white-space:nowrap;font-family:inherit}',
    '.nk-qb:hover{background:#111;color:#fff;border-color:#111}',
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
    '#nk-box ::-webkit-scrollbar-thumb{background:#ddd;border-radius:10px}'
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
          '<img src="' + CFG.logoUrl + '" alt="">',
          '<div id="nk-hi">',
            '<h3>' + nkE(CFG.brandName) + '</h3>',
            '<p>' + nkE(CFG.brandSub) + '</p>',
          '</div>',
          '<div id="nk-dot"></div>',
        '</div>',
        '<div id="nk-ob">',
          '<h4>Chat với Nike</h4>',
          '<p>Xin chào! Để chúng tôi hỗ trợ bạn tốt nhất, vui lòng cho biết một vài thông tin nhé.</p>',
          '<div class="nk-ig"><label>Tên của bạn</label><input type="text" id="nk-name" placeholder="Ví dụ: Nguyễn Văn A"></div>',
          '<div class="nk-ig"><label>Số điện thoại</label><input type="tel" id="nk-phone" placeholder="Ví dụ: 0912345678"></div>',
          '<button id="nk-start" onclick="__nkStart()">Bắt đầu cuộc trò chuyện</button>',
        '</div>',
        '<div id="nk-ci">',
          '<div id="nk-msgs"></div>',
          '<div id="nk-ss"></div>',
          '<div id="nk-qr"></div>',
          '<div id="nk-ia">',
            '<textarea id="nk-inp" placeholder="Nhập tin nhắn..." rows="1" oninput="__nkResize(this)" onkeydown="if(event.key===\'Enter\'&&!event.shiftKey){event.preventDefault();__nkSend()}"></textarea>',
            '<button id="nk-send" onclick="__nkSend()"><svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>',
          '</div>',
        '</div>',
      '</div>',
    '</div>'
  ].join('');

  var wrap = document.createElement('div');
  wrap.innerHTML = html;
  document.body.appendChild(wrap.firstChild);

  // ===== 3. LOAD FIREBASE ASYNC =====
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
  function nkBoot() {
    // Greeting
    var tip = document.getElementById('nk-tip');
    if (tip && !sessionStorage.getItem('nk_tip_shown')) {
      setTimeout(function() {
        tip.classList.add('show');
        sessionStorage.setItem('nk_tip_shown', '1');
        setTimeout(function() { tip.classList.remove('show'); }, 5000);
      }, 1200);
    }
    // Restore session
    if (NK.sessionId) {
      document.getElementById('nk-ob').style.display = 'none';
      document.getElementById('nk-ci').style.display = 'flex';
      nkListenMsgs(); nkListenSeen(); nkLoadQR();
    }
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
      lastMessage: 'Khách hàng bắt đầu hội thoại', unread: true
    });
    NK.db.ref('nike-chat/conversations/' + NK.sessionId + '/messages').push({
      sender: 'admin', text: CFG.welcomeMsg(name), timestamp: Date.now()
    });
    document.getElementById('nk-ob').style.display = 'none';
    document.getElementById('nk-ci').style.display = 'flex';
    nkListenMsgs(); nkListenSeen(); nkLoadQR();
    nkTg('👤 Khách mới: ' + name + ' (' + phone + ')\nĐã mở cửa sổ chat!');
  };

  window.__nkSend = function() {
    if (!NK.db || !NK.sessionId) return;
    var inp = document.getElementById('nk-inp');
    var text = inp.value.trim(); if (!text) return;
    inp.value = ''; inp.style.height = 'auto';
    var pendingAnswer = NK.pendingAnswer || null;
    NK.pendingAnswer = null;
    NK.db.ref('nike-chat/conversations/' + NK.sessionId + '/messages').push({ sender: 'customer', text: text, timestamp: Date.now() });
    NK.db.ref('nike-chat/conversations/' + NK.sessionId).update({ lastMessage: text, lastMessageAt: Date.now(), unread: true });
    nkTg('\uD83D\uDCAC ' + (localStorage.getItem('nk_chat_name') || 'Kh\u00e1ch') + ': ' + text);
    // N\u1ebfu c\u00f3 c\u00e2u tr\u1ea3 l\u1eddi t\u1ef1 \u0111\u1ed9ng (t\u1eeb Quick Reply)
    if (pendingAnswer) {
      setTimeout(function() {
        if (!NK.db || !NK.sessionId) return;
        NK.db.ref('nike-chat/conversations/' + NK.sessionId + '/messages').push({ sender: 'admin', text: pendingAnswer, timestamp: Date.now() });
        NK.db.ref('nike-chat/conversations/' + NK.sessionId).update({ lastMessage: '[Admin] ' + pendingAnswer, lastMessageAt: Date.now(), unread: false, unreadCustomer: false });
      }, 800);
    }
  };

  // Quick Reply: fill v\u00e0o input, l\u01b0u c\u00e2u tr\u1ea3 l\u1eddi ch\u1edd g\u1eedi
  window.__nkQR = function(q, a) {
    var inp = document.getElementById('nk-inp');
    if (!inp) return;
    inp.value = q;
    inp.focus();
    NK.pendingAnswer = a || null; // l\u01b0u c\u00e2u tr\u1ea3 l\u1eddi \u0111\u1ec3 g\u1eedi sau khi user b\u1ea5m Send
    window.__nkResize(inp);
    // Highlight input nh\u1eb9 \u0111\u1ec3 user bi\u1ebft \u0111\u00e3 fill
    inp.style.borderColor = '#111';
    setTimeout(function() { inp.style.borderColor = ''; }, 1200);
  };

  window.__nkResize = function(el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 100) + 'px'; };

  // ===== 6. CORE FUNCTIONS =====
  function nkListenMsgs() {
    var msgs = document.getElementById('nk-msgs');
    var first = true;
    NK.db.ref('nike-chat/conversations/' + NK.sessionId + '/messages').on('child_added', function(snap) {
      var msg = snap.val();
      var row = document.createElement('div');
      row.className = 'nk-mr ' + msg.sender;
      row.innerHTML = '<div><div class="nk-mb">' + nkE(msg.text) + '</div><div class="nk-mt">' + nkTime(msg.timestamp) + '</div></div>';
      msgs.appendChild(row);
      msgs.scrollTop = msgs.scrollHeight;
      if (!first && msg.sender === 'admin') {
        if (!NK.isOpen) {
          NK.unread++;
          var b = document.getElementById('nk-badge');
          b.textContent = NK.unread; b.style.display = 'flex';
          try { new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play(); } catch(e){}
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
      qr.style.display = 'flex';
      qr.innerHTML = items.map(function(item) {
        var q = item.question || item.text, a = item.answer || null;
        return '<button class="nk-qb" onclick="__nkQR(' + JSON.stringify(q) + ',' + JSON.stringify(a) + ')">' + nkE(q) + '</button>';
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
