(() => {
  const { CATEGORIES, classify } = module.exports;
  const DEFAULT_SOURCES = [
    { id: 'zoomit', name: 'زومیت', url: 'https://www.zoomit.ir/feed/', enabled: true },
    { id: 'digiato', name: 'دیجیاتو', url: 'https://digiato.com/feed', enabled: true },
    { id: 'digikala-mag', name: 'دیجی‌کالا مگ', url: 'https://www.digikala.com/mag/feed/', enabled: true },
    { id: 'gadgetnews', name: 'گجت‌نیوز', url: 'https://gadgetnews.net/feed/', enabled: true },
    { id: 'itiran', name: 'آی‌تی‌ایران', url: 'https://itiran.com/feed/', enabled: true },
    { id: 'tarfandestan', name: 'ترفندستان', url: 'https://www.tarfandestan.com/feed', enabled: true },
  ];
  const DEFAULTS = { sources: DEFAULT_SOURCES, intervalMinutes: 20 };
  const ls = {
    get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } },
  };
  let settings = Object.assign({}, DEFAULTS, ls.get('mn.settings', {}));
  let cache = ls.get('mn.cache', { updatedAt: 0, bySource: {} });
  const listeners = [];

  /* native fetch bridge */
  let seq = 0; const pending = {};
  window.__nf = (id, ok, text) => { const p = pending[id]; delete pending[id]; if (p) (ok ? p.res(text) : p.rej(new Error(text))); };
  const fetchText = (url) => new Promise((res, rej) => {
    const id = ++seq; pending[id] = { res, rej };
    AndroidBridge.fetchText(id, url);
    setTimeout(() => { if (pending[id]) { delete pending[id]; rej(new Error('زمان اتصال تمام شد')); } }, 22000);
  });

  /* parsing */
  const ENT = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", hellip: '…', laquo: '«', raquo: '»', ndash: '–', mdash: '—' };
  const decode = (s) => s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? m);
  function clean(html) {
    let s = decode(String(html || '')).replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ');
    s = decode(s).replace(/\s+/g, ' ').trim();
    return s.replace(/(The post .*? appeared first on .*)$/i, '').replace(/(نوشته\s.*?(اولین بار|ابتدا)\sدر\s.*)$/, '').trim();
  }
  const firstImg = (h) => { const m = /<img[^>]+src=["']([^"']+)["']/i.exec(String(h || '')); return m ? m[1] : ''; };
  const hash = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(16); };
  const tx = (node, tag) => { const e = node.getElementsByTagName(tag)[0]; return e ? (e.textContent || '') : ''; };

  function parseFeed(xml, source) {
    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    if (doc.querySelector('parsererror')) throw new Error('فید معتبر نیست');
    let nodes = [...doc.getElementsByTagName('item')];
    if (!nodes.length) nodes = [...doc.getElementsByTagName('entry')];
    const out = [];
    for (const it of nodes) {
      let link = tx(it, 'link').trim();
      if (!link) {
        const ls_ = [...it.getElementsByTagName('link')];
        const alt = ls_.find((l) => !l.getAttribute('rel') || l.getAttribute('rel') === 'alternate') || ls_[0];
        link = alt ? (alt.getAttribute('href') || '') : tx(it, 'guid');
      }
      const title = clean(tx(it, 'title'));
      if (!/^https?:\/\//i.test(link) || !title) continue;
      const body = tx(it, 'content:encoded') || tx(it, 'content');
      const descRaw = tx(it, 'description') || tx(it, 'summary') || body;
      const summary = clean(descRaw).slice(0, 260);
      const date = Date.parse(tx(it, 'pubDate') || tx(it, 'dc:date') || tx(it, 'published') || tx(it, 'updated')) || Date.now();
      let image = '';
      const enc = [...it.getElementsByTagName('enclosure')].find((e) => /^image/.test(e.getAttribute('type') || '') || /\.(jpe?g|png|webp)/i.test(e.getAttribute('url') || ''));
      if (enc) image = enc.getAttribute('url') || '';
      if (!image) { const mc = it.getElementsByTagName('media:content')[0] || it.getElementsByTagName('media:thumbnail')[0]; if (mc) image = mc.getAttribute('url') || ''; }
      if (!image) image = firstImg(body) || firstImg(descRaw);
      if (!/^https?:\/\//i.test(image)) image = '';
      const feedCategories = [...it.getElementsByTagName('category')].map((c) => clean(c.textContent || c.getAttribute('term') || '')).filter(Boolean);
      out.push({ id: hash(link), title, summary, link, image, date, source: source.name, sourceId: source.id, category: classify({ title, summary, feedCategories }) });
    }
    return out.sort((a, b) => b.date - a.date).slice(0, 60);
  }

  function snapshot() {
    const items = []; const statuses = [];
    for (const s of settings.sources) {
      const e = cache.bySource[s.id];
      statuses.push({ id: s.id, name: s.name, ok: e ? e.ok : null, error: e?.error || '', count: e?.items?.length || 0 });
      if (s.enabled && e?.items) items.push(...e.items);
    }
    const seen = new Set();
    const uniq = items.filter((i) => (seen.has(i.id) ? false : seen.add(i.id))).sort((a, b) => b.date - a.date);
    return { items: uniq.slice(0, 600), statuses, updatedAt: cache.updatedAt };
  }

  let busy = null;
  function refresh() {
    if (busy) return busy;
    busy = (async () => {
      const active = settings.sources.filter((s) => s.enabled);
      const res = await Promise.allSettled(active.map(async (s) => parseFeed(await fetchText(s.url), s)));
      res.forEach((r, i) => {
        const id = active[i].id;
        if (r.status === 'fulfilled') cache.bySource[id] = { ok: true, items: r.value, at: Date.now() };
        else cache.bySource[id] = { ok: false, error: String(r.reason?.message || r.reason), items: cache.bySource[id]?.items || [], at: Date.now() };
      });
      if (res.some((r) => r.status === 'fulfilled')) cache.updatedAt = Date.now();
      ls.set('mn.cache', cache);
      return snapshot();
    })().finally(() => { busy = null; });
    return busy;
  }

  let timer = null;
  function schedule() {
    clearInterval(timer);
    timer = setInterval(async () => { const d = await refresh(); listeners.forEach((f) => f(d)); }, Math.max(5, settings.intervalMinutes || 20) * 60000);
  }
  document.addEventListener('visibilitychange', async () => {
    if (!document.hidden && Date.now() - cache.updatedAt > 10 * 60000) { const d = await refresh(); listeners.forEach((f) => f(d)); }
  });

  window.api = {
    getNews: async () => snapshot(),
    refresh,
    getCategories: async () => CATEGORIES.map(({ id, name, color }) => ({ id, name, color })),
    getSettings: async () => settings,
    getDefaults: async () => DEFAULTS,
    setSettings: async (next) => {
      const sources = (next?.sources || []).filter((s) => s && /^https?:\/\//i.test(String(s.url || '')))
        .map((s) => ({ id: String(s.id || hash(s.url)), name: String(s.name || s.url).slice(0, 60), url: String(s.url), enabled: s.enabled !== false }));
      settings = { sources, intervalMinutes: Math.min(240, Math.max(5, Number(next?.intervalMinutes) || 20)) };
      ls.set('mn.settings', settings); schedule();
      return refresh();
    },
    open: (url) => AndroidBridge.open(String(url)),
    onUpdated: (cb) => listeners.push(cb),
  };
  schedule();
  refresh().then((d) => listeners.forEach((f) => f(d)));
})();
