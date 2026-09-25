/* ============================================================
   OIKOS LINGUA — Workday · content engine
   Loads the local JSON bank and assembles a random workday.
   No backend, no accounts, no required progression.
   ============================================================ */
const OK = {
  data: { scenarios: [], categories: [], contexts: [], interactions: [], lang: {} },

  /* ---------- loading ---------- */
  async load() {
    const j = async p => (await fetch(p)).json();
    const [sc, ct, it, ent, eng, ena, end, enp, frt, frg, fra, frd, frp] = await Promise.all([
      j('content/scenarios.json'), j('content/professional-contexts.json'),
      j('content/interaction-types.json'),
      j('content/english/topics.json'), j('content/english/guides.json'), j('content/english/activities.json'),
      j('content/english/drills.json'), j('content/english/productions.json'),
      j('content/french/topics.json'),  j('content/french/guides.json'),  j('content/french/activities.json'),
      j('content/french/drills.json'),  j('content/french/productions.json')
    ]);
    this.data.scenarios    = sc.scenarios;
    this.data.categories   = sc.categories;
    this.data.contexts     = ct.contexts;
    this.data.interactions = it.types;
    this.data.lang = {
      english: { topics: ent.topics, guides: eng.guides, activities: ena.activities,
                 drills: end.drills, productions: enp.productions },
      french:  { topics: frt.topics, guides: frg.guides, activities: fra.activities,
                 drills: frd.drills, productions: frp.productions }
    };
    return this;
  },

  /* ---------- lookups ---------- */
  scenario:    id => OK.data.scenarios.find(s => s.id === id),
  category:    id => OK.data.categories.find(c => c.id === id),
  context:     id => OK.data.contexts.find(c => c.id === id),
  interaction: id => OK.data.interactions.find(t => t.id === id),
  topic:  (lang, id) => OK.data.lang[lang].topics.find(t => t.id === id),
  guide:  (lang, id) => OK.data.lang[lang].guides.find(g => g.id === id),

  /* Levels map onto the three difficulty settings. A challenge is one level
     throughout (situations, guide, drills and production), and a learner only
     ever gets challenges at the level they chose. */
  LEVELS: { easy: 'A2', intermediate: 'B1', challenge: 'B2' },
  levelOf: setting => OK.LEVELS[setting] || 'B1',

  /* ---------- selection ---------- */
  /* Stage 1 — the candidate pool is every activity at the requested level.
     The content bank carries at least fifteen per level and language, so the
     whole-bank fallback only guards against a broken content file. */
  _pool(req) {
    const all = this.data.lang[req.language].activities;
    const lvl = this.levelOf(req.level);
    const same = all.filter(a => a.level === lvl);
    return same.length >= 2 ? same : all;
  },

  /* Stage 2 — within the level, weight by professional context so the
     learner's chosen workplace comes up more often without repeating. */
  CONTEXT_W: 4,
  _weight(act, req) {
    return act.contexts.includes(req.context) ? this.CONTEXT_W : 1;
  },

  /* Kinds of task, so the two challenges of a workday differ in what the
     learner actually does, not only in topic. */
  FAMILIES: {
    situation: ['best-response', 'stronger-sentence', 'register-check', 'appropriateness', 'branching'],
    reading:   ['read-report', 'true-false'],
    email:     ['email-connectors', 'email-gaps', 'write-email', 'email-order'],
    speaking:  ['speaking']
  },
  family(act) {
    for (const f in this.FAMILIES) if (this.FAMILIES[f].includes(act.interaction)) return f;
    return 'language';   // grammar and vocabulary work: fill-blank, error-correction, matching…
  },

  /* Weighted random pick, so the best-fitting activities appear more often
     without the same one coming up every single time. */
  _pick(acts, req) {
    const weights = acts.map(a => this._weight(a, req));
    const total = weights.reduce((n, w) => n + w, 0);
    let r = Math.random() * total;
    for (let i = 0; i < acts.length; i++) { r -= weights[i]; if (r <= 0) return acts[i]; }
    return acts[acts.length - 1];
  },

  /* Build one workday: two challenges, different categories where possible,
     different scenarios and topics, never dependent on date, user or history. */
  generateWorkday(req, avoidIds = []) {
    const pool = this._pool(req);
    if (!pool.length) return { request: { ...req }, challenges: [] };

    // Prefer activities not used in the immediately preceding workday.
    const fresh = pool.filter(a => !avoidIds.includes(a.id));
    const base  = fresh.length >= 2 ? fresh : pool;

    const first = this._pick(base, req);

    // Second challenge: a different category, scenario and topic wherever the
    // content allows it, so the two challenges never feel like the same task.
    // It also comes from a different kind of task, so a workday mixes, say, a
    // report to read with an email to complete, rather than two judgement calls.
    const rest    = base.filter(a => a.id !== first.id);
    const okFit   = rest.filter(a => a.scenario !== first.scenario &&
                                     a.topic    !== first.topic);
    const bestFit = okFit.filter(a => a.category !== first.category);
    const mixed   = bestFit.filter(a => this.family(a) !== this.family(first));
    const pool2   = mixed.length ? mixed : bestFit.length ? bestFit : (okFit.length ? okFit : rest);
    const second  = pool2.length ? this._pick(pool2, req) : first;

    return {
      request: { ...req },
      challenges: [first, second].map(a => this.expand(a, req.language))
    };
  },

  /* Join an activity to everything it references, so the UI never
     has to know how the content bank is organised. */
  expand(act, language) {
    const sc = this.scenario(act.scenario) || {};
    const ca = this.category(act.category) || {};
    const tp = this.topic(language, act.topic) || {};
    const gd = this.guide(language, act.guide) || {};
    const it = this.interaction(act.interaction) || {};
    const L  = language === 'french' ? 'fr' : 'en';
    const bank = OK.data.lang[language];
    // The ramp: three typed drills and one open production, both keyed to the
    // guide, so any activity using that guide inherits them.
    const drills = (bank.drills || {})[act.guide] || [];
    const production = (bank.productions || {})[act.guide] || null;
    return {
      activity: act, scenario: sc, category: ca, topic: tp, guide: gd, interaction: it,
      drills, production,
      title:       (sc.title   || {})[L] || 'Challenge',
      premise:     (sc.premise || {})[L] || '',
      categoryLab: (ca.label   || {})[L] || '',
      icon: ca.icon || '•',
      instruction: (it.instruction || {})[L] || '',
      minutes: OK.estimateMinutes(act)
    };
  },

  /* Two situations, three drills and one production. The production is the
     part that varies most: writing and speaking take longer than a gap-fill. */
  estimateMinutes(act) {
    const bank = OK.data.lang[act.language] || {};
    const drills = ((bank.drills || {})[act.guide] || []).length;
    const prod = (bank.productions || {})[act.guide];
    const r = (OK.interaction(act.interaction) || {}).renderer;
    // the two situations: a document to read or an email to write takes longer
    let m = r === 'speaking' ? 6 : (r === 'reading' || r === 'writing') ? 8 : r === 'gapselect' ? 6 : 4;
    m += drills * 1.5;                          // typed recall
    if (prod) m += prod.kind === 'listen' ? 15 : (prod.kind === 'speak' ? 5 : 8);
    return Math.round(m);
  },

  /* ---------- scoring (fully deterministic, no AI) ---------- */
  /* Every exercise normalises to 0-100 so before/after are comparable. */
  scoreExercise(ex, renderer, answer) {
    switch (renderer) {
      case 'choice': {
        const o = ex.options[answer];
        return { score: o ? o.score : 0, chosen: answer };
      }
      case 'multi': {
        // Credit for every correct pick, equal penalty for every wrong one.
        const correct = ex.options.filter(o => o.correct).length || 1;
        let hits = 0, misses = 0;
        answer.forEach(i => ex.options[i].correct ? hits++ : misses++);
        const raw = (hits - misses) / correct;
        return { score: Math.max(0, Math.round(raw * 100)), chosen: answer };
      }
      case 'order': {
        // Credit per item sitting in its correct position.
        const n = ex.items.length;
        let ok = 0;
        answer.forEach((orig, pos) => { if (orig === pos) ok++; });
        return { score: Math.round((ok / n) * 100), chosen: answer };
      }
      case 'categorise': {
        const n = ex.items.length;
        let ok = 0;
        ex.items.forEach((it, i) => { if (answer[i] === it.bin) ok++; });
        return { score: Math.round((ok / n) * 100), chosen: answer };
      }
      case 'matching': {
        const n = ex.pairs.length;
        let ok = 0;
        ex.pairs.forEach((p, i) => { if (answer[i] === p.right) ok++; });
        return { score: Math.round((ok / n) * 100), chosen: answer };
      }
      case 'typing': {
        return { score: OK.acceptsAny(ex.accept, answer[0]) ? 100 : 0, chosen: answer };
      }
      case 'cloze': {
        const n = ex.gaps.length;
        let ok = 0;
        ex.gaps.forEach((g, i) => { if (OK.acceptsAny(g.accept, answer[i] || '')) ok++; });
        return { score: Math.round((ok / n) * 100), chosen: answer };
      }
      case 'reading': {
        const n = ex.questions.length;
        const ok = ex.questions.filter((q, i) => (q.options[answer[i]] || {}).correct).length;
        return { score: Math.round((ok / n) * 100), chosen: answer };
      }
      case 'gapselect': {
        const n = ex.gaps.length;
        const ok = ex.gaps.filter((g, i) => answer[i] === g.answer).length;
        return { score: Math.round((ok / n) * 100), chosen: answer };
      }
      case 'writing':
      case 'listening': {
        // Only mechanically verifiable things count towards the score.
        const text = answer[0] || '';
        const checks = OK.runChecks(ex, text);
        const passed = checks.filter(c => c.pass).length;
        return { score: checks.length ? Math.round((passed / checks.length) * 100) : 0,
                 chosen: answer, checks };
      }
      case 'speaking': {
        // Self-assessed: the learner's own checklist is the score.
        const n = ex.checklist.length;
        const ok = answer.filter(Boolean).length;
        return { score: Math.round((ok / n) * 100), chosen: answer };
      }
      default: return { score: 0, chosen: answer };
    }
  },

  /* Skill breakdown is only shown when it can be computed objectively
     from the interaction type's declared skills. */
  skillsFor(act) {
    const it = OK.interaction(act.interaction) || {};
    const tp = OK.topic(act.language, act.topic) || {};
    const set = new Set(it.skills || []);
    if (tp.skill) set.add(tp.skill);
    return [...set];
  },

  verdict(score, lang) {
    const en = [[90,'Spot on. That is how someone who does this every day would handle it.'],
                [70,'Solid. The main idea is right, and the detail is what would lift it further.'],
                [45,'People would understand you, but it would read as weak at work.'],
                [0, 'Worth learning properly. This one quietly costs you credibility at work.']];
    const fr = [[90,'Exactement. C\'est ainsi que procéderait quelqu\'un qui fait cela tous les jours.'],
                [70,'Solide. L\'essentiel est juste, et c\'est le détail qui ferait la différence.'],
                [45,'On vous comprendrait, mais cela passerait mal au travail.'],
                [0, 'À travailler sérieusement. Cela vous coûte discrètement en crédibilité.']];
    const t = lang === 'french' ? fr : en;
    return (t.find(([n]) => score >= n) || t[t.length - 1])[1];
  },

  /* Typed answers are compared forgivingly: case, spacing, curly quotes and
     accents are ignored, since the point is the word chosen. */
  normalise(v) {
    return String(v).toLowerCase().trim()
      .replace(/[\u2018\u2019\u02BC]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .replace(/[.,;:!?]+$/, '');
  },
  acceptsAny(list, value) {
    const v = OK.normalise(value);
    return (list || []).some(a => OK.normalise(a) === v);
  },

  /* Written tasks are checked against things a machine can genuinely verify:
     a required structure is present, a known trap is absent, enough words. */
  /* For checks, spacing and punctuation carry meaning: ' so ' must not match
     "also", and a check for '?' must find a real question mark. So nothing is
     trimmed, and punctuation is spaced out on both sides before matching. */
  checkForm(v) {
    return String(v).toLowerCase()
      .replace(/[\u2018\u2019\u02BC]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/([.,;:!?()])/g, ' $1 ')
      .replace(/\s+/g, ' ');
  },
  runChecks(ex, text) {
    const t = ' ' + OK.checkForm(text) + ' ';
    const has = x => t.includes(OK.checkForm(x));
    const out = [];
    if (ex.minWords) {
      const n = (String(text).trim().match(/\S+/g) || []).length;
      const fr = ex.lang === 'french';
      const label = ex.minWordsLabel
        || (fr ? `Au moins ${ex.minWords} mots` : `At least ${ex.minWords} words`);
      out.push({ label: label + (fr ? ` (vous en avez écrit ${n})` : ` (you wrote ${n})`),
                 pass: n >= ex.minWords });
    }
    (ex.checks || []).forEach(c => {
      let pass = true;
      if (c.any)  pass = c.any.some(has);
      if (c.all)  pass = pass && c.all.every(has);
      if (c.none) pass = pass && !c.none.some(has);
      out.push({ label: c.label, pass });
    });
    return out;
  },

  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
};
