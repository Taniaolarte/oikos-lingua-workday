/* ============================================================
   OIKOS LINGUA — hold for Spanish
   A press-and-hold gloss of the instructions, for Spanish speakers.
   It only ever touches instruction and interface text: the language the
   learner is practising is never translated, so nothing is given away.
   The one exception is a guide with a full Spanish version (the A2 guides):
   there the learner is meeting the words for the first time, so holding
   shows the whole guide in Spanish, side by side with the original.
   ============================================================ */
const ES = {
  dict: {},          // source string -> Spanish
  guides: { english: {}, french: {} },   // guide id -> full Spanish version
  active: false,
  saved: [],         // [{ el, html }] so release restores exactly

  /* Elements that carry instructions or interface text. Deliberately narrow:
     it must never reach the options, the email being studied, or the guide. */
  SELECTORS: [
    '.qtext', '.hint', '.brief', '.panel-lab', '.qcount', '.card-n', '.card-cat',
    '.fieldlab', '.eyebrow', '.step', '.sechead h2', '.sechead p',
    '.taskbox h4', '.taskbox p', '.musts li', '.wcount', '.checkres h4',
    '.pathc h4', '.pathc p', '.pathc .flow', '.saved b', '.saved span',
    '.score .lab', '.rbox .lab', '.sb .t', '.gsec h4', '.verdict',
    '.btn', '.tbtn', '.pk b', '.pk small', '.hero h1', '.hero p', '.dash h2',
    '.id-top small', '.chk label span', '.spk .ph', '.model h4', '.ck span',
    '.reslink span', '.libc p', '.sumrow b', '.foot'
  ].join(','),

  /* Leading or trailing decoration is stripped before lookup and restored
     afterwards, so "Start →" still matches "Start". */
  DECOR: /^[\s↻←→✓·]+|[\s↻←→✓·]+$/g,

  async load() {
    try {
      const d = await (await fetch('content/spanish.json')).json();
      this.dict = Object.assign({}, d.ui || {}, d.text || {});
    } catch (e) { this.dict = {}; }
    await Promise.all(Object.keys(this.guides).map(async L => {
      try { this.guides[L] = (await (await fetch(`content/${L}/guides-es.json`)).json()).guides || {}; }
      catch (e) { this.guides[L] = {}; }
    }));
    return this;
  },

  one(s) {
    if (!s) return null;
    if (this.dict[s]) return this.dict[s];
    const bare = s.replace(this.DECOR, '');
    return this.dict[bare] || null;
  },

  /* Composite labels such as "📧 Inbox · Before learning" are translated part
     by part, keeping any emoji and the separator in place. */
  lookup(raw) {
    const s = String(raw).replace(/\s+/g, ' ').trim();
    if (!s) return null;
    const whole = this.one(s);
    if (whole) return whole;
    if (s.indexOf('·') === -1) return null;
    const parts = s.split('·').map(x => x.trim());
    let any = false;
    const out = parts.map(part => {
      const emoji = (part.match(/^[^\p{L}\p{N}]+/u) || [''])[0];
      const words = part.slice(emoji.length).trim();
      const es = this.one(words);
      if (es) any = true;
      return emoji + (es || words);
    });
    return any ? out.join(' · ') : null;
  },

  /* The text to look up, ignoring any icon chip the element carries
     (a step number, a tick) so "1Try" still resolves to "Try". */
  ownText(el) {
    let t = '';
    el.childNodes.forEach(n => {
      if (n.nodeType === 1 && n.tagName === 'I') return;   // icon chip
      t += n.textContent;
    });
    return t;
  },

  /* A guide in Spanish. The words being learned stay visible in the original
     with their Spanish meaning beside them; everything else reads in Spanish. */
  guideHTML(lang, id) {
    const g = OK.guide(lang, id), t = (this.guides[lang] || {})[id];
    if (!g || !t) return null;
    const tr = s => s ? `<small class="es-tr">${esc(s)}</small>` : '';
    const ex = t.expressions || [], vo = t.vocabulary || [], eg = t.examples || [];
    return `
      <div class="panel-lab">Zona de aprendizaje · ${g.minutes} min</div>
      <h2>${esc(t.title || g.title)}</h2>
      <div class="es-src">${esc(g.title)}</div>
      <p class="brief">${esc(t.explanation || g.explanation)}</p>
      ${g.expressions && g.expressions.length ? `<div class="gsec"><h4>Expresiones útiles</h4>
        <div class="gl">${g.expressions.map((e, i) => `<div>${esc(e)}${tr(ex[i])}</div>`).join('')}</div></div>` : ''}
      ${g.vocabulary && g.vocabulary.length ? `<div class="gsec"><h4>Vocabulario</h4>
        <div class="vocab">${g.vocabulary.map((v, i) => `<div><b>${esc(v.term)}</b>
          ${vo[i] && vo[i].es ? `<em class="es-word">${esc(vo[i].es)}</em>` : ''}
          <span>${esc((vo[i] && vo[i].gloss) || v.gloss)}</span></div>`).join('')}</div></div>` : ''}
      ${g.examples && g.examples.length ? `<div class="gsec"><h4>Ejemplos</h4>
        <div class="ex">${g.examples.map((e, i) => `<div><b>${esc((eg[i] && eg[i].label) || e.label)}</b>
          <span>${esc(e.text)}</span>${tr(eg[i] && eg[i].text)}</div>`).join('')}</div></div>` : ''}
      ${g.mistake ? `<div class="gsec"><h4>Error frecuente</h4>
        <div class="mis"><div class="w">${esc(g.mistake.wrong)}</div><div class="r">${esc(g.mistake.right)}</div>
        <div class="y">${esc((t.mistake && t.mistake.why) || g.mistake.why)}</div></div></div>` : ''}
      ${g.tip ? `<div class="tipbox"><b>Consejo rápido</b>${esc(t.tip || g.tip)}</div>` : ''}`;
  },

  show() {
    if (this.active) return;
    this.active = true;
    document.querySelectorAll('.guide-in[data-gid]').forEach(el => {
      const html = this.guideHTML(el.dataset.glang, el.dataset.gid);
      if (!html) return;
      this.saved.push({ el, html: el.innerHTML, guide: true });
      el.innerHTML = html;
      el.classList.add('es-guide');
    });
    document.querySelectorAll(this.SELECTORS).forEach(el => {
      if (el.closest('.es-guide')) return;   // already shown in full above
      // only swap leaf text, never a node that wraps other translatable parts
      if (el.querySelector(this.SELECTORS)) return;
      const raw = this.ownText(el);
      const es = this.lookup(raw);
      if (!es) return;
      this.saved.push({ el, html: el.innerHTML });
      const lead = (raw.match(/^[\s↻←]+/) || [''])[0];
      const tail = (raw.match(/[\s→]+$/) || [''])[0];
      const icon = el.querySelector(':scope > i');
      const span = document.createElement('span');
      span.className = 'es-on';
      span.textContent = lead + es + tail;
      el.innerHTML = '';
      if (icon) el.appendChild(icon);
      el.appendChild(span);
    });
    document.body.classList.add('es-holding');
  },

  hide() {
    if (!this.active) return;
    this.active = false;
    this.saved.reverse().forEach(({ el, html, guide }) => {
      el.innerHTML = html;
      if (guide) el.classList.remove('es-guide');
    });
    this.saved = [];
    document.body.classList.remove('es-holding');
  },

  mount() {
    if (document.getElementById('es-btn')) return;
    const b = document.createElement('button');
    b.id = 'es-btn';
    b.type = 'button';
    b.setAttribute('aria-label', 'Mantén pulsado para ver las instrucciones en español');
    b.innerHTML = `<span class="es-flag">ES</span>
      <span class="es-lab">Mantén pulsado<br><b>para español</b></span>`;
    document.body.appendChild(b);

    const down = e => { e.preventDefault(); this.show(); };
    const up   = () => this.hide();
    b.addEventListener('pointerdown', down);
    b.addEventListener('pointerup', up);
    b.addEventListener('pointerleave', up);
    b.addEventListener('pointercancel', up);
    b.addEventListener('contextmenu', e => e.preventDefault());

    // keyboard: hold the key, same as holding the button
    b.addEventListener('keydown', e => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); this.show(); }
    });
    b.addEventListener('keyup', e => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); this.hide(); }
    });
    b.addEventListener('blur', up);
    window.addEventListener('blur', up);
  }
};
