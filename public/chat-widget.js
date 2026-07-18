(function() {
  // ── STATE ──
  let wOpen = false;
  let wSessionId = localStorage.getItem('widget_chat_session_id') || null;
  let wAllSessions = [];
  let wMessages = [];
  let wSending = false;
  let wSelectedImage = null;
  let wTab = 'chat';
  let wModelsLoaded = false;

  const QUICK = [
    { k: 'quick_new', label: '✨ Buat animasi baru', prompt: 'Tolong buatkan ide animasi stock terbaru untuk niche yang sedang tren.' },
    { k: 'quick_trends', label: '📈 Riset niche terbaru', prompt: 'Risetkan niche yang paling laris minggu ini di Adobe Stock / Shutterstock untuk looping background.' },
    { k: 'quick_fail', label: '🧩 Kenapa render gagal?', prompt: 'Row terakhir render saya gagal. Jelaskan langkah debug (cek log, cek GitHub Actions, cek ProRes codec) dan cara retry.' },
    { k: 'quick_kw', label: '🏷️ Keyword terbaik?', prompt: 'Berikan 15 keyword SEO terbaik untuk video abstract tech looping background 4K.' }
  ];

  // Helpers
  function $(id) { return document.getElementById(id); }
  function escH(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  function wShowToast(msg, type = 'info') {
    const el = $('widgetToast');
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
    el.style.borderColor = type === 'error' ? 'var(--red)' : type === 'success' ? 'var(--green)' : 'var(--cyan)';
    el.style.color = type === 'error' ? 'var(--red)' : type === 'success' ? 'var(--green)' : 'var(--cyan)';
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.style.display = 'none'; }, 3000);
  }

  // ── OPEN/CLOSE ──
  window.toggleChatWidget = function(force) {
    const shouldOpen = typeof force === 'boolean' ? force : !wOpen;
    if (shouldOpen) openChatWidget(); else closeChatWidget();
  };
  window.openChatWidget = function() {
    wOpen = true;
    const w = $('chatWidget');
    if (w) { w.classList.add('widget-open'); w.classList.remove('minimized'); }
    // Non-blocking: no overlay blur, dashboard stays interactive
    document.body.classList.remove('widget-open');
    setTimeout(() => { const i = $('widgetInput'); if (i) i.focus(); }, 100);
    if (!wSessionId) loadWidgetSessions();
  };
  window.closeChatWidget = function() {
    wOpen = false;
    const w = $('chatWidget');
    if (w) { w.classList.remove('widget-open'); w.classList.remove('minimized'); }
    document.body.classList.remove('widget-open');
  };
  window.minimizeChatWidget = function() {
    const w = $('chatWidget');
    if (!w) return;
    w.classList.add('minimized');
    w.classList.remove('widget-open');
    document.body.classList.remove('widget-open');
    wOpen = false;
  };

  window.switchWidgetTab = function(tab) {
    wTab = tab;
    document.querySelectorAll('.chat-widget-tab').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
    document.querySelectorAll('.chat-widget-panel').forEach(p => p.classList.toggle('active', p.dataset.panel === tab));
    if (tab === 'history') loadWidgetSessions();
    if (tab === 'account') loadWidgetPool();
  };

  // ── QUICK CHIPS ──
  window.onWidgetQuickChip = function(k) {
    const q = QUICK.find(x => x.k === k);
    if (!q) return;
    const ta = $('widgetInput');
    if (!ta) return;
    ta.value = q.prompt;
    autoGrowWidgetInput(ta);
    widgetSendCurrent();
  };

  // ── IMAGE ──
  window.triggerWidgetImage = function() { $('widgetImageInput').click(); };
  window.handleWidgetImage = function(e) {
    const f = (e.target.files && e.target.files[0]) || null;
    if (!f) return;
    if (!f.type.startsWith('image/')) { wShowToast('Hanya gambar', 'error'); return; }
    wSelectedImage = f;
    const r = new FileReader();
    r.onload = ev => {
      $('widgetImgThumb').src = ev.target.result;
      $('widgetImgName').textContent = f.name;
      $('widgetImgPreview').classList.add('visible');
    };
    r.readAsDataURL(f);
  };
  window.cancelWidgetImage = function() {
    wSelectedImage = null;
    const inp = $('widgetImageInput');
    if (inp) inp.value = '';
    const box = $('widgetImgPreview');
    if (box) box.classList.remove('visible');
  };

  // Paste handler
  function bindWidgetPaste() {
    const ta = $('widgetInput');
    if (!ta || ta._pasteBound) return;
    ta._pasteBound = true;
    ta.addEventListener('paste', ev => {
      const cd = ev.clipboardData;
      if (!cd) return;
      for (const item of cd.items) {
        if (item.type.indexOf('image') === 0) {
          const file = item.getAsFile();
          if (file) {
            wSelectedImage = file;
            const reader = new FileReader();
            reader.onload = evt => {
              $('widgetImgThumb').src = evt.target.result;
              $('widgetImgName').textContent = 'Pasted ' + new Date().toLocaleTimeString('id-ID');
              $('widgetImgPreview').classList.add('visible');
            };
            reader.readAsDataURL(file);
            break;
          }
        }
      }
    });
  }

  // ── SESSIONS ──
  async function loadWidgetSessions() {
    try {
      const res = await fetch('/api/chat/sessions');
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.sessions || data.items || []);
      wAllSessions = list;
      renderWidgetSessionList();
      if (!wSessionId && list.length > 0) {
        // don't auto switch if already in chat
      }
      if (wSessionId) {
        // refresh active
        const cur = wAllSessions.find(s => s.id === wSessionId);
        if (cur) $('widgetTitle').textContent = cur.title || 'Chat';
      }
    } catch (e) {
      console.warn('loadWidgetSessions', e.message);
    }
  }

  function renderWidgetSessionList() {
    const c = $('widgetSessionList');
    if (!c) return;
    if (!wAllSessions.length) {
      c.innerHTML = '<div class="session-mini-empty">Belum ada percakapan</div>';
      return;
    }
    c.innerHTML = wAllSessions.map(s => {
      const active = s.id === wSessionId ? ' active' : '';
      const title = escH(s.title || 'Tanpa judul');
      const date = s.updatedAt ? new Date(s.updatedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '';
      return `<div class="session-mini-item${active}" onclick="selectWidgetSession('${s.id}')">
        <div class="session-mini-title" title="${title}">${title}</div>
        <div class="session-mini-meta">
          <span>${s.messageCount || 0} pesan · ${date}</span>
          <button class="session-mini-del" onclick="event.stopPropagation(); deleteWidgetSession('${s.id}')" title="Hapus">🗑</button>
        </div>
      </div>`;
    }).join('');
  }

  window.createWidgetNewSession = async function() {
    try {
      const model = ($('widgetModelSelect') && $('widgetModelSelect').value) || 'claude-sonnet-4-6';
      const res = await fetch('/api/chat/sessions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Widget · ' + new Date().toLocaleString('id-ID'), model })
      });
      const data = await res.json();
      const id = data.id || data.sessionId || data.session?.id;
      if (!id) throw new Error('No id');
      wSessionId = id;
      localStorage.setItem('widget_chat_session_id', id);
      wMessages = [];
      $('widgetTitle').textContent = data.title || 'Percakapan Baru';
      renderWidgetMessages(wMessages);
      loadWidgetSessions();
      switchWidgetTab('chat');
      wShowToast('Percakapan baru dibuat', 'success');
    } catch (e) { wShowToast('Gagal buat sesi: ' + e.message, 'error'); }
  };

  window.selectWidgetSession = async function(id) {
    try {
      const res = await fetch('/api/chat/sessions/' + encodeURIComponent(id));
      if (!res.ok) throw new Error('Sesi tidak ditemukan');
      const data = await res.json();
      wSessionId = data.id || id;
      localStorage.setItem('widget_chat_session_id', wSessionId);
      $('widgetTitle').textContent = data.title || data.session?.title || 'Chat';
      wMessages = data.messages || data.session?.messages || [];
      const model = data.model || data.session?.model;
      if (model && $('widgetModelSelect')) $('widgetModelSelect').value = model;
      renderWidgetMessages(wMessages);
      renderWidgetSessionList();
      switchWidgetTab('chat');
    } catch (e) { wShowToast(e.message, 'error'); }
  };

  window.deleteWidgetSession = async function(id) {
    if (!confirm('Hapus percakapan ini?')) return;
    try {
      await fetch('/api/chat/sessions/' + encodeURIComponent(id), { method: 'DELETE' });
      wAllSessions = wAllSessions.filter(s => s.id !== id);
      if (wSessionId === id) {
        wSessionId = null;
        localStorage.removeItem('widget_chat_session_id');
        wMessages = [];
        $('widgetTitle').textContent = 'Remotion Assistant';
        renderWidgetMessages(wMessages);
      }
      renderWidgetSessionList();
      wShowToast('Percakapan dihapus', 'success');
    } catch (e) { wShowToast('Gagal hapus: ' + e.message, 'error'); }
  };

  window.renameWidgetSession = async function() {
    if (!wSessionId) { wShowToast('Belum ada sesi aktif', 'info'); return; }
    const cur = wAllSessions.find(s => s.id === wSessionId);
    const val = prompt('Nama baru:', cur ? cur.title : $('widgetTitle').textContent);
    if (val === null) return;
    const title = val.trim();
    if (!title) return;
    try {
      await fetch('/api/chat/sessions/' + encodeURIComponent(wSessionId), {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });
      $('widgetTitle').textContent = title;
      const idx = wAllSessions.findIndex(s => s.id === wSessionId);
      if (idx !== -1) wAllSessions[idx].title = title;
      renderWidgetSessionList();
      wShowToast('Nama diubah', 'success');
    } catch (e) { wShowToast('Gagal rename: ' + e.message, 'error'); }
  };

  // ── MODELS & POOL ──
  async function loadWidgetModels() {
    if (wModelsLoaded) return;
    try {
      const res = await fetch('/api/chat/models');
      const data = await res.json();
      const sel = $('widgetModelSelect');
      if (sel && data.models && Array.isArray(data.models)) {
        const currentValue = sel.value;
        // Group models
        const groupLabels = { claude: '⭐ Claude', chatgpt: '💬 ChatGPT', gemini: '✨ Gemini', grok: '💡 Grok', deepseek: '🐉 DeepSeek', qwen: '🌀 Qwen', perplexity: '🔍 Perplexity' };
        const groups = {};
        data.models.forEach(m => {
          const g = m.group || 'other';
          if (!groups[g]) groups[g] = [];
          groups[g].push(m);
        });
        // Rebuild dropdown
        sel.innerHTML = '';
        Object.keys(groups).forEach(g => {
          const optgroup = document.createElement('optgroup');
          optgroup.label = groupLabels[g] || g;
          groups[g].forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.id;
            const visionIcon = m.vision ? '👁 ' : '';
            opt.textContent = visionIcon + m.label.replace(/^(Claude |GPT-|Gemini |Grok |DeepSeek |Qwen )/, '');
            if (m.default) opt.selected = true;
            optgroup.appendChild(opt);
          });
          sel.appendChild(optgroup);
        });
        // Restore previous selection if still available
        if (currentValue && sel.querySelector(`option[value="${currentValue}"]`)) {
          sel.value = currentValue;
        }
      }
      if (data.poolStatus) renderWidgetPool(data.poolStatus);
      wModelsLoaded = true;
    } catch (e) { console.warn('loadWidgetModels', e.message); }
  }

  async function loadWidgetPool() {
    try {
      const res = await fetch('/api/chat/models');
      const data = await res.json();
      if (data.poolStatus) renderWidgetPool(data.poolStatus);
    } catch (e) { console.warn('loadWidgetPool', e.message); }
  }

  function renderWidgetPool(pool) {
    const badge = $('widgetPoolBadge');
    const list = $('widgetPoolAccounts');
    const rem = $('widgetPoolRemaining');
    if (!badge || !list) return;
    const active = pool.activeAccountsCount ?? pool.totalAccountsCount ?? '?';
    const total = pool.totalAccountsCount ?? '?';
    badge.textContent = active + '/' + total;
    badge.style.background = (active > 0 || pool.accounts?.length) ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)';
    badge.style.color = (active > 0 || pool.accounts?.length) ? '#10b981' : '#ef4444';
    const accounts = pool.accounts || [];
    let totalRem = 0;
    list.innerHTML = accounts.map(acc => {
      const used = acc.messageCount || 0;
      const limit = acc.messageLimit || 5;
      const remain = limit - used;
      totalRem += Math.max(0, remain);
      const pct = Math.round((used / limit) * 100);
      const barColor = pct >= 80 ? '#ef4444' : pct >= 50 ? '#f59e0b' : '#10b981';
      const countColor = remain <= 1 ? '#ef4444' : remain <= 2 ? '#f59e0b' : '#10b981';
      return `<div class="pool-mini-account"><span class="pool-mini-email" title="${escH(acc.email)}">${escH(acc.email)}</span><div class="pool-mini-bar"><div class="pool-mini-bar-fill" style="width:${pct}%;background:${barColor}"></div></div><span class="pool-mini-count" style="color:${countColor}">${used}/${limit}</span></div>`;
    }).join('') || '<div style="font-size:11px;color:var(--text-dim)">Tidak ada akun</div>';
    if (rem) {
      if (accounts.length) {
        rem.style.display = 'block';
        rem.textContent = '💬 ' + totalRem + ' pesan tersisa';
        rem.style.color = totalRem <= 3 ? '#ef4444' : totalRem <= 8 ? '#f59e0b' : '#38bdf8';
      } else rem.style.display = 'none';
    }
  }

  window.generateWidgetAccount = async function() {
    const btn = $('widgetGenAccount');
    if (!btn) return;
    btn.disabled = true;
    btn.textContent = '⏳ Memproses...';
    try {
      const res = await fetch('/api/syntx-status');
      const j = await res.json();
      wShowToast('Pool status refreshed', 'success');
      if (j.poolStatus) renderWidgetPool(j.poolStatus);
    } catch (e) { wShowToast('Gagal: ' + e.message, 'error'); }
    btn.disabled = false;
    btn.textContent = '➕ Tambah Akun';
  };

  window.onWidgetModelChange = function() {
    if (!wSessionId) return;
    const m = $('widgetModelSelect').value;
    fetch('/api/chat/sessions/' + encodeURIComponent(wSessionId), {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: m })
    }).catch(()=>{});
  };

  // ── MESSAGES RENDER ──
  function miniMarkdown(text) {
    if (!text) return '';
    let h = escH(text);
    // code blocks with 4 actions: Copy, Play, -> Compiler, -> Queue
    h = h.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
      const safe = escH(code.trim());
      const l = escH(lang || 'code');
      return `<div class="code-mini-wrapper"><div class="code-mini-toolbar"><span class="code-mini-lang">${l}</span><div class="code-mini-actions"><button class="code-mini-btn" onclick="copyWidgetCode(this)">Copy</button><button class="code-mini-btn" onclick="playWidgetCode(this)">Play</button><button class="code-mini-btn" onclick="sendWidgetCodeToCompiler(this)" title="Kirim ke HTML Compiler & langsung preview" style="color:var(--green)">▶ Compiler</button><button class="code-mini-btn" onclick="sendWidgetCode(this)" title="Kirim ke antrean dashboard">Queue</button></div></div><pre><code class="lang-${l}">${safe}</code></pre></div>`;
    });
    h = h.replace(/`([^`\n]+)`/g, '<code style="font-family:JetBrains Mono,monospace;font-size:11px;background:rgba(0,0,0,0.25);padding:1px 4px;border-radius:4px;border:1px solid var(--border)">$1</code>');
    h = h.replace(/^### (.+)$/gm, '<strong style="color:var(--cyan)">$1</strong>');
    h = h.replace(/^## (.+)$/gm, '<strong>$1</strong>');
    h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    h = h.replace(/\n\n/g, '<br><br>');
    h = h.replace(/\n/g, '<br>');
    return h;
  }

  window.copyWidgetCode = function(btn) {
    const wrapper = btn.closest('.code-mini-wrapper');
    const code = wrapper.querySelector('code').textContent;
    navigator.clipboard.writeText(code).then(() => {
      btn.textContent = 'Copied!';
      setTimeout(() => btn.textContent = 'Copy', 1500);
      wShowToast('Kode disalin', 'success');
    }).catch(e => wShowToast('Gagal copy: ' + e.message, 'error'));
  };
  window.playWidgetCode = function(btn) {
    const code = btn.closest('.code-mini-wrapper').querySelector('code').textContent;
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    wShowToast('Membuka kode di tab baru', 'success');
  };
  window.sendWidgetCode = async function(btn) {
    const code = btn.closest('.code-mini-wrapper').querySelector('code').textContent;
    const customId = prompt('ID/Filename (misal: glow_button):', 'widget_gen_' + Date.now().toString(36));
    if (customId === null) return;
    const sanitized = (customId.trim() || ('widget_gen_' + Date.now().toString(36))).replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    try {
      const resp = await fetch('/api/paste-html', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sanitized, htmlContent: code, loop: true, transparent: true, aiModel: 'widget-chat', animationDuration: 5, fps: 30 })
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      wShowToast('Terkirim ke antrean dashboard!', 'success');
    } catch (e) { wShowToast('Gagal kirim: ' + e.message, 'error'); }
  };

  /* Kirim kode langsung ke HTML Compiler + preview */
  window.sendWidgetCodeToCompiler = function(btn) {
    const code = btn.closest('.code-mini-wrapper').querySelector('code').textContent;
    // Check if HTML Compiler panel exists
    const compilerTextarea = document.getElementById('compilerHtmlCode');
    if (!compilerTextarea) {
      wShowToast('Compiler tidak tersedia', 'error');
      return;
    }
    compilerTextarea.value = code;
    // Save state
    if (typeof saveCompilerState === 'function') saveCompilerState();
    // Run preview
    if (typeof runHtmlCompiler === 'function') {
      runHtmlCompiler();
    }
    // Switch to Compiler tab
    if (typeof switchView === 'function') {
      switchView('compiler');
    }
    wShowToast('Kode dikirim ke HTML Compiler + preview!', 'success');
  };

  function renderWidgetMessages(msgs) {
    const container = $('widgetMessages');
    const empty = $('widgetEmpty');
    if (!container) return;
    container.querySelectorAll('.wmsg').forEach(el => el.remove());
    if (!msgs || msgs.length === 0) {
      if (empty) empty.style.display = '';
      return;
    }
    if (empty) empty.style.display = 'none';
    msgs.forEach((m, idx) => {
      const role = (m.role || m.type || '').toLowerCase();
      const isUser = role === 'user' || role === 'human';
      let inner = '';
      if (m.imageUrl) {
        inner += `<img class="bubble-image-mini" src="${escH(m.imageUrl)}" onclick="openWidgetImage('${escH(m.imageUrl)}')" alt="image">`;
      }
      const content = m.content || m.text || m.message || '';
      const md = isUser ? escH(content).replace(/\n/g, '<br>') : miniMarkdown(content);
      inner += md;
      const time = m.timestamp ? new Date(m.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '';
      const editBtn = isUser ? `<button class="btn-edit-wmsg" onclick="startWidgetEdit(${idx})" title="Edit">✏️</button>` : '';
      const row = document.createElement('div');
      row.className = 'wmsg ' + (isUser ? 'user' : 'assistant');
      row.id = 'wmsg-' + idx;
      row.innerHTML = `<div class="wmsg-bubble">${inner}</div><div class="wmsg-meta">${time} ${editBtn}</div>`;
      container.appendChild(row);
    });
    container.scrollTop = container.scrollHeight;
  }

  // ── SEND ──
  window.autoGrowWidgetInput = function(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 96) + 'px';
  };
  window.onWidgetInputKey = function(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); widgetSendCurrent(); }
  };

  window.widgetSendCurrent = async function() {
    const ta = $('widgetInput');
    if (!ta) return;
    const text = ta.value.trim();
    if ((!text && !wSelectedImage) || wSending) return;
    ta.value = '';
    autoGrowWidgetInput(ta);
    await widgetSendMessage(text);
  };

  async function widgetSendMessage(text) {
    if (wSending) return;
    wSending = true;
    $('widgetSend').disabled = true;
    $('widgetTyping').classList.add('visible');

    let imageUrl = null;
    if (wSelectedImage) {
      wShowToast('Mengupload gambar...', 'info');
      try {
        const fd = new FormData();
        fd.append('image', wSelectedImage);
        const upRes = await fetch('/api/chat/upload-image', { method: 'POST', body: fd });
        const upData = await upRes.json();
        if (!upData.success && !upData.url) throw new Error(upData.error || 'Upload gagal');
        imageUrl = upData.url || upData.imageUrl || null;
      } catch (e) {
        wShowToast('Upload gagal: ' + e.message, 'error');
        wSending = false;
        $('widgetSend').disabled = false;
        $('widgetTyping').classList.remove('visible');
        return;
      }
    }

    const effectiveText = text || 'Gambar terlampir';
    wMessages = wMessages.concat([{ role: 'user', content: effectiveText, imageUrl: imageUrl || undefined, timestamp: new Date().toISOString() }]);
    renderWidgetMessages(wMessages);
    cancelWidgetImage();

    try {
      if (!wSessionId) {
        // create
        const model = ($('widgetModelSelect') && $('widgetModelSelect').value) || 'claude-sonnet-4-6';
        const res = await fetch('/api/chat/sessions', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Widget · ' + new Date().toLocaleString('id-ID'), model })
        });
        const data = await res.json();
        wSessionId = data.id || data.sessionId || data.session?.id;
        if (!wSessionId) throw new Error('Gagal buat sesi');
        localStorage.setItem('widget_chat_session_id', wSessionId);
        loadWidgetSessions();
      }

      const body = { content: effectiveText, message: effectiveText, model: ($('widgetModelSelect') ? $('widgetModelSelect').value : undefined), imageUrl: imageUrl || undefined };
      const res = await fetch('/api/chat/sessions/' + encodeURIComponent(wSessionId) + '/message', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const history = data.messages || data.history || null;
      const assistant = data.assistantMessage || (data.reply ? { role: 'assistant', content: data.reply } : null) || (data.assistant ? data.assistant : null) || (data.message ? { role: 'assistant', content: data.message } : null);
      if (Array.isArray(history) && history.length) {
        wMessages = history;
      } else {
        if (assistant) wMessages.push(assistant);
        else if (data.content || data.response || data.text) wMessages.push({ role: 'assistant', content: data.content || data.response || data.text });
      }
      renderWidgetMessages(wMessages);
      if (data.session && data.session.title) { $('widgetTitle').textContent = data.session.title; loadWidgetSessions(); }
      loadWidgetModels();
    } catch (err) {
      wMessages = wMessages.concat([{ role: 'assistant', content: '[Error] ' + (err.message || String(err)) }]);
      renderWidgetMessages(wMessages);
      wShowToast(err.message, 'error');
    } finally {
      wSending = false;
      $('widgetSend').disabled = false;
      $('widgetTyping').classList.remove('visible');
      const ta = $('widgetInput');
      if (ta) { ta.focus(); }
    }
  }

  // ── EDIT ──
  window.startWidgetEdit = function(index) {
    if (wSending) return;
    const msg = wMessages[index];
    if (!msg || msg.role !== 'user') return;
    const row = $('wmsg-' + index);
    if (!row) return;
    const bubble = row.querySelector('.wmsg-bubble');
    bubble.innerHTML = `<textarea id="wedit-${index}" class="edit-mini-ta" style="width:100%;min-height:60px;border-radius:8px;border:1px solid var(--border);background:var(--bg3);color:var(--text);font-family:inherit;font-size:12px;padding:8px;resize:vertical;outline:none;">${escH(msg.content||'')}</textarea><div style="display:flex;gap:6px;justify-content:flex-end;margin-top:6px;"><button style="padding:5px 10px;border-radius:6px;border:1px solid var(--border);background:transparent;color:var(--text-dim);font-size:11px;cursor:pointer;" onclick="cancelWidgetEdit(${index})">Batal</button><button style="padding:5px 12px;border-radius:6px;border:1px solid var(--cyan);background:var(--cyan-dim);color:var(--cyan);font-size:11px;font-weight:700;cursor:pointer;" onclick="saveWidgetEdit(${index})">Simpan</button></div>`;
  };
  window.cancelWidgetEdit = function(index) { renderWidgetMessages(wMessages); };
  window.saveWidgetEdit = async function(index) {
    const ta = $('wedit-' + index);
    if (!ta) return;
    const content = ta.value.trim();
    if (!content) { wShowToast('Pesan tidak boleh kosong', 'error'); return; }
    if (!wSessionId) { wShowToast('Sesi tidak ada', 'error'); return; }
    wSending = true;
    $('widgetSend').disabled = true;
    $('widgetTyping').classList.add('visible');
    try {
      const model = $('widgetModelSelect') ? $('widgetModelSelect').value : undefined;
      const res = await fetch('/api/chat/sessions/' + encodeURIComponent(wSessionId) + '/message/' + index + '/edit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, message: content, model, imageUrl: wMessages[index]?.imageUrl || undefined })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const history = data.session ? (data.session.messages || data.session.history) : (data.messages || data.history);
      if (Array.isArray(history) && history.length) wMessages = history;
      else {
        wMessages = wMessages.slice(0, index + 1);
        wMessages[index] = { ...wMessages[index], content };
      }
      renderWidgetMessages(wMessages);
      loadWidgetSessions();
    } catch (e) { wShowToast('Gagal edit: ' + e.message, 'error'); }
    finally { wSending = false; $('widgetSend').disabled = false; $('widgetTyping').classList.remove('visible'); }
  };

  // ── IMAGE MODAL ──
  window.openWidgetImage = function(url) {
    const m = $('widgetImgModal');
    if (!m) return;
    $('widgetImgModalSrc').src = url;
    m.classList.add('visible');
  };
  window.closeWidgetImage = function() {
    const m = $('widgetImgModal');
    if (m) m.classList.remove('visible');
  };

  // ── INIT ──
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { if ($('widgetImgModal') && $('widgetImgModal').classList.contains('visible')) closeWidgetImage(); else if (wOpen) closeChatWidget(); } });

  // expose for inline JS that was injected before
  window.widgetLoadPool = loadWidgetPool;
  window.loadWidgetSessions = loadWidgetSessions;
  window.renderWidgetMessages = renderWidgetMessages;
  window.autoGrowWidgetInput = autoGrowWidgetInput;
  window.onWidgetInputKey = onWidgetInputKey;
  window.widgetSendCurrent = widgetSendCurrent;
  window.widgetSendMessage = widgetSendMessage;
  window.wGetMessages = function() { return wMessages; };

  // lazy load pool/models on first open
  const origOpen = window.openChatWidget;
  window.openChatWidget = function() {
    origOpen();
    loadWidgetModels();
    bindWidgetPaste();
  };

  // ── HORIZONTAL DRAG ──
  (function() {
    const widget = $('chatWidget');
    if (!widget) return;
    const header = widget.querySelector('.chat-widget-header');
    if (!header) return;

    let isDragging = false;
    let startX = 0;
    let startRight = 0;

    header.addEventListener('mousedown', (e) => {
      // Don't drag if clicking on buttons
      if (e.target.closest('button, a')) return;
      isDragging = true;
      startX = e.clientX;
      startRight = parseInt(getComputedStyle(widget).right) || 16;
      widget.classList.add('dragging');
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const deltaX = startX - e.clientX;
      const newRight = Math.max(16, Math.min(window.innerWidth - widget.offsetWidth - 16, startRight + deltaX));
      widget.style.right = newRight + 'px';
    });

    document.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      widget.classList.remove('dragging');
    });
  })();

  // if there's saved session, preload messages silently
  if (wSessionId) {
    fetch('/api/chat/sessions/' + encodeURIComponent(wSessionId)).then(r => r.ok ? r.json() : null).then(data => {
      if (!data) return;
      const msgs = data.messages || data.session?.messages || [];
      if (msgs.length) { wMessages = msgs; renderWidgetMessages(wMessages); const t = data.title || data.session?.title; if (t) $('widgetTitle').textContent = t; }
    }).catch(()=>{});
  }
})();
