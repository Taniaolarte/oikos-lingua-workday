/* ============================================================
   OIKOS LINGUA — Workday · application
   Screens: onboarding → home → challenge → results → library
   ============================================================ */
const APP = {
  /* Session state lives in memory only. localStorage is used purely for the
     convenience of not re-typing your name — never as required progress. */
  profile: null,
  workday: null,
  results: [],          // { index, before, after, improvement, topic, skills }
  current: null,
  lastIds: [],

  PREF: 'oikos.lingua.card',

  /* ---------- profile (convenience only) ---------- */
  readCard() {
    try {
      const raw = localStorage.getItem(this.PREF);
      if (!raw) return null;
      const p = JSON.parse(raw);
      return (p && p.name && p.language) ? p : null;
    } catch (e) { return null; }   // private mode, blocked storage, corrupt value
  },
  writeCard(p) { try { localStorage.setItem(this.PREF, JSON.stringify(p)); } catch (e) {} },
  clearCard()  { try { localStorage.removeItem(this.PREF); } catch (e) {} },

  /* ---------- boot ---------- */
  async start() {
    try { await OK.load(); }
    catch (e) {
      document.getElementById('boot').innerHTML =
        `<div class="wrap" style="padding:60px 20px;text-align:center">
           <h2 style="color:var(--navy);font-family:var(--fs)">Content could not be loaded</h2>
           <p style="color:var(--ink-2);max-width:460px;margin:12px auto">
             The activities are read from local JSON files, so the page has to be served over
             <b>http://</b> rather than opened straight from disk.
             Run <code>python3 -m http.server</code> in the project folder, or publish to GitHub Pages.</p></div>`;
      return;
    }
    document.getElementById('boot').hidden = true;
    document.getElementById('app').hidden = false;

    this.profile = this.readCard();
    if (this.profile) { this.newWorkday(); this.go('home'); }
    else this.renderOnboard();

    document.getElementById('nav').hidden = false;
    this.bindNav();

    // Press-and-hold Spanish gloss of the instructions.
    await ES.load();
    ES.mount();
  },

  go(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id === 'sc-' + screen));
    document.querySelectorAll('#nav .tbtn').forEach(b =>
      b.classList.toggle('act', b.dataset.go === screen));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  bindNav() {
    document.querySelectorAll('[data-go]').forEach(b => b.onclick = () => {
      const t = b.dataset.go;
      if (t === 'library') this.renderLibrary();
      if (t === 'home' && !this.workday) this.newWorkday();
      this.go(t);
    });
    document.getElementById('brand').onclick = () => {
      if (this.profile) { this.go('home'); } else this.renderOnboard();
    };
  },

  L() { return this.profile && this.profile.language === 'french' ? 'fr' : 'en'; },
  t(en, fr) { return this.L() === 'fr' ? fr : en; },

  /* ============================================================
     ONBOARDING — the staff badge
     ============================================================ */
  renderOnboard() {
    const draft = { name: '', language: 'english', context: '', level: 'intermediate', avatar: 'blank' };
    const host = document.getElementById('sc-onboard');
    const ctxLabel = () => {
      const c = OK.context(draft.context);
      return c ? c.icon + ' ' + c.label[draft.language === 'french' ? 'fr' : 'en'] : '';
    };

    host.innerHTML = `
      <div class="wrap">
        <div class="hero">
          <img class="hero-logo" src="img/logo-navy.png" width="150" height="139" alt="Oikos Lingua">
          <div class="eyebrow">Workday</div>
          <h1>Which workday will you have today?</h1>
          <p>Pick the language you want to work in and the kind of job you feel like doing.
             You get two short situations from real working life, and the language you need to handle them.</p>
        </div>

        <div class="idwrap">
          ${this.lanyardSVG()}
          <div class="idcard">
            <div class="id-top"><img src="img/owl-white.png" width="28" height="28" alt=""><b>OIKOS LINGUA</b><small>Staff pass</small></div>
            <div class="id-body">
              <div class="photo-col">
                <div class="photo" id="f-photo">${avatarSVG('blank')}</div>
                <div class="avatars" id="f-av">
                  ${Object.keys(AVATARS).map(k => `
                    <button class="av" data-v="${k}" title="${AVATARS[k].label}"
                            aria-pressed="${k === 'blank'}">${avatarSVG(k)}</button>`).join('')}
                </div>
              </div>
              <div class="id-fields">
                <div class="field" style="margin-bottom:12px">
                  <label class="fieldlab" for="f-name">Name</label>
                  <input class="tin" id="f-name" placeholder="Your first name" autocomplete="given-name" maxlength="24">
                </div>
                <div class="field" style="margin-bottom:12px">
                  <span class="fieldlab">Working language</span>
                  <div class="pick" id="f-lang">
                    <button class="pk" data-v="english" aria-pressed="true"><b>English</b><small>A2 · B1 · B2 · IELTS</small></button>
                    <button class="pk" data-v="french"  aria-pressed="false"><b>Français</b><small>A2 · B1 · B2</small></button>
                  </div>
                </div>
                <div class="field" style="margin-bottom:0">
                  <span class="fieldlab">Level</span>
                  <div class="pick" id="f-level" style="grid-template-columns:repeat(3,1fr)">
                    <button class="pk" data-v="easy"><b>Easy</b><small>A2</small></button>
                    <button class="pk" data-v="intermediate" aria-pressed="true"><b>Core</b><small>B1</small></button>
                    <button class="pk" data-v="challenge"><b>Challenge</b><small>B2</small></button>
                  </div>
                </div>
                <div class="id-line" style="margin-top:14px;border-top:1px dashed var(--line)">
                  <span class="fieldlab" style="margin:0">Today's job</span>
                  <b class="empty" id="f-dept">Not chosen yet</b>
                </div>
                <div class="barcode"></div>
              </div>
            </div>
          </div>
        </div>

        <div style="max-width:800px;margin:36px auto 60px">
          <div class="sechead" style="text-align:center;border:0;padding-bottom:0">
            <h2>Now choose your workday</h2>
            <p>This is the world you want to practise in today. It does not have to be your real job.</p>
          </div>
          <div class="cards" id="f-ctxlist"
               style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:11px;margin-top:20px"></div>
          <div class="btnrow" style="justify-content:center;margin-top:28px">
            <button class="btn btn-p" id="f-start" disabled>Start my workday</button>
          </div>
          <p class="hint" id="f-need" style="text-align:center;margin-top:10px">
            Add your name and pick a job to begin.</p>
        </div>
      </div>`;

    const $ = q => host.querySelector(q);
    const start = $('#f-start');
    const need  = $('#f-need');

    const refresh = () => {
      const ready = draft.name && draft.context;
      start.disabled = !ready;
      need.textContent = ready ? 'Two challenges, about ten minutes.'
        : (!draft.name ? 'Add your name and pick a job to begin.' : 'Pick a job to begin.');
      const dept = $('#f-dept');
      dept.textContent = draft.context ? ctxLabel() : 'Not chosen yet';
      dept.classList.toggle('empty', !draft.context);
    };

    const group = (sel, key, after) => host.querySelectorAll(sel + ' [data-v]').forEach(b => b.onclick = () => {
      host.querySelectorAll(sel + ' [data-v]').forEach(x => x.setAttribute('aria-pressed', 'false'));
      b.setAttribute('aria-pressed', 'true');
      draft[key] = b.dataset.v;
      if (after) after();
      refresh();
    });

    const drawContexts = () => {
      const L = draft.language === 'french' ? 'fr' : 'en';
      $('#f-ctxlist').innerHTML = OK.data.contexts.map(c => `
        <button class="pk" data-v="${c.id}" aria-pressed="${c.id === draft.context}" style="padding:15px 11px">
          <div style="font-size:24px;margin-bottom:5px">${c.icon}</div>
          <b>${esc(c.label[L])}</b>
        </button>`).join('');
      group('#f-ctxlist', 'context');
    };

    group('#f-lang', 'language', drawContexts);
    group('#f-level', 'level');
    group('#f-av', 'avatar', () => { $('#f-photo').innerHTML = avatarSVG(draft.avatar); });
    drawContexts();

    const name = $('#f-name');
    name.oninput = () => { draft.name = name.value.trim(); refresh(); };
    name.onkeydown = e => { if (e.key === 'Enter' && !start.disabled) start.click(); };

    start.onclick = () => {
      this.profile = { ...draft };
      this.writeCard(this.profile);
      this.newWorkday();
      this.go('home');
    };

    refresh();
    this.go('onboard');
  },

  /* ============================================================
     HOME — today's workday
     ============================================================ */
  newWorkday() {
    const p = this.profile;
    this.workday = OK.generateWorkday(
      { language: p.language, context: p.context, level: p.level }, this.lastIds);
    this.lastIds = this.workday.challenges.map(c => c.activity.id);
    this.results = [];
    this.renderHome();
  },

  renderHome() {
    const p = this.profile, L = this.L();
    const ctx = OK.context(p.context) || { label: { en: 'General Office', fr: 'Bureau' }, icon: '🏢' };
    const lvl = OK.levelOf(p.level);
    const langName = p.language === 'french' ? 'Français' : 'English';

    document.getElementById('sc-home').innerHTML = `
      <div class="wrap">
        <div class="dash">
          <div>
            <div class="eyebrow">${this.t('Today\'s workday', 'Votre journée')}</div>
            <h2>${this.t('Welcome, ', 'Bienvenue, ')}${esc(p.name)}</h2>
            <div class="dash-meta">
              <span class="chip chip-n">${langName}</span>
              <span class="chip chip-o">${ctx.icon} ${esc(ctx.label[L])}</span>
              <span class="chip">${lvl}</span>
            </div>
          </div>
          <div class="dash-sp"></div>
          <button class="btn btn-o" id="h-new">↻ ${this.t('New workday', 'Nouvelle journée')}</button>
        </div>
        <div class="cards">
          ${this.workday.challenges.map((c, i) => {
            const done = this.results.find(r => r.index === i);
            return `
            <div class="card ${i ? 'c2' : ''} ${done ? 'done' : ''}">
              <div class="card-n">${this.t('Challenge', 'Défi')} ${i + 1}</div>
              <div class="card-cat"><i>${c.icon}</i>${esc(c.categoryLab)}</div>
              <h3>${esc(c.title)}</h3>
              <p>${esc(c.premise)}</p>
              <div class="card-meta">
                <span class="chip">${esc(c.topic.label || '')}</span>
                <span class="chip chip-o">${c.activity.level}</span>
                <span class="chip">~${c.minutes} min</span>
                ${c.activity.ielts ? '<span class="chip chip-g">IELTS</span>' : ''}
              </div>
              <button class="btn ${done ? 'btn-o' : (i ? 'btn-n' : 'btn-p')}" data-ch="${i}">
                ${done ? this.t('Do it again', 'Recommencer') : this.t('Start', 'Commencer')}
                ${done ? '' : ' →'}
              </button>
            </div>`;
          }).join('')}
        </div>
        ${this.results.length === 2 ? `
          <div class="btnrow" style="margin-top:20px">
            <button class="btn btn-n" id="h-res">${this.t('See your workday summary', 'Voir le bilan de la journée')} →</button>
          </div>` : ''}
        <div class="homefoot">
          <button class="btn btn-o" id="h-ctx">${this.t('Change workday', 'Changer de contexte')}</button>
          <button class="btn btn-o" id="h-lang">${this.t('Change language', 'Changer de langue')}</button>
          <button class="btn btn-o" data-go="library">${this.t('Learning guides', 'Guides')}</button>
          <span class="dash-sp"></span>
          <button class="btn btn-g" id="h-reset">${this.t('New card', 'Nouvelle carte')}</button>
        </div>
      </div>`;

    const $ = s => document.querySelector('#sc-home ' + s);
    $('#h-new').onclick = () => this.newWorkday();
    document.querySelectorAll('#sc-home [data-ch]').forEach(b =>
      b.onclick = () => this.openChallenge(+b.dataset.ch));
    $('#h-ctx').onclick  = () => this.quickPick('context');
    $('#h-lang').onclick = () => this.quickPick('language');
    $('#h-reset').onclick = () => { this.clearCard(); this.profile = null; this.workday = null; this.renderOnboard(); };
    const res = $('#h-res'); if (res) res.onclick = () => this.renderResults();
    document.querySelectorAll('#sc-home [data-go]').forEach(b =>
      b.onclick = () => { this.renderLibrary(); this.go('library'); });
  },

  /* Quick in-place switch of language or professional context. */
  quickPick(which) {
    const L = this.L();
    const isLang = which === 'language';
    const opts = isLang
      ? [{ id: 'english', label: 'English', icon: '🇬🇧' }, { id: 'french', label: 'Français', icon: '🇫🇷' }]
      : OK.data.contexts.map(c => ({ id: c.id, label: c.label[L], icon: c.icon }));
    document.getElementById('sc-home').insertAdjacentHTML('afterbegin', `
      <div class="wrap" id="qp" style="padding-top:26px">
        <div class="panel">
          <div class="panel-lab">${isLang ? this.t('Change language', 'Changer de langue') : this.t('Change workday', 'Changer de contexte')}</div>
          <div class="cards" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px">
            ${opts.map(o => `<button class="pk" data-v="${o.id}" style="padding:14px 10px">
              <div style="font-size:22px;margin-bottom:4px">${o.icon}</div><b>${esc(o.label)}</b></button>`).join('')}
          </div>
          <div class="btnrow" style="margin-top:16px"><button class="btn btn-g" id="qp-x">Cancel</button></div>
        </div>
      </div>`);
    const box = document.getElementById('qp');
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    box.querySelectorAll('.pk').forEach(b => b.onclick = () => {
      this.profile[which] = b.dataset.v;
      this.writeCard(this.profile);
      this.lastIds = [];
      this.newWorkday();
    });
    box.querySelector('#qp-x').onclick = () => box.remove();
  },

  /* ============================================================
     CHALLENGE — try → score → learn → try again → improvement
     ============================================================ */
  openChallenge(i) {
    const c = this.workday.challenges[i];
    this.current = { index: i, c, phase: 'choose', path: null, answer: null,
                     before: null, after: null, drillIdx: 0, drillScores: [], production: null };
    this.renderChallenge();
    this.go('challenge');
  },

  /* Two ways through a challenge. Both use the same two situations and the same
     guide; only the order changes, and the learner picks. */
  PATHS: {
    'try-first':   ['before', 'learn', 'after', 'drill', 'produce', 'done'],
    'learn-first': ['learn', 'before', 'after', 'drill', 'produce', 'done']
  },

  stepsHTML(phase) {
    const st = this.current;
    const order = this.PATHS[st.path] || this.PATHS['try-first'];
    const learnFirst = st.path === 'learn-first';
    const labs = {
      before:  learnFirst ? this.t('Try it', 'Essayez') : this.t('Try', 'Essayez'),
      learn:   this.t('Learn', 'Apprenez'),
      after:   learnFirst ? this.t('Again', 'Encore') : this.t('Try again', 'Réessayez'),
      drill:   this.t('Complete', 'Complétez'),
      produce: this.t('Produce', 'Produisez'),
      done:    learnFirst ? this.t('Result', 'Résultat') : this.t('Progress', 'Progrès')
    };
    const cur = order.indexOf(phase);
    return `<div class="steps">${order.map((s, i) => `
      <div class="step ${i === cur ? 'on' : ''} ${i < cur ? 'ok' : ''}">
        <i>${i < cur ? '✓' : i + 1}</i>${labs[s]}
      </div>${i < order.length - 1 ? '<span class="step-line"></span>' : ''}`).join('')}</div>`;
  },

  renderChallenge() {
    const st = this.current, c = st.c;
    const host = document.getElementById('sc-challenge');
    const renderer = c.interaction.renderer;
    // A writing situation needs to know the language for its labels and checks.
    const ex = Object.assign({ lang: this.profile.language },
      st.phase === 'after' ? c.activity.after : c.activity.before);

    if (st.phase === 'choose') {
      host.innerHTML = `
        <div class="wrap"><div class="stage">
          <div class="panel">
            <div class="panel-lab">${c.icon} ${esc(c.categoryLab)}</div>
            <h2>${esc(c.title)}</h2>
            <p class="brief">${esc(c.premise)}</p>
            <div class="card-meta" style="margin-top:14px">
              <span class="chip">${esc(c.topic.label || '')}</span>
              <span class="chip chip-o">${c.activity.level}</span>
              <span class="chip">~${c.minutes} min</span>
            </div>
            <p class="qtext" style="margin-top:22px">${this.t(
              'How do you want to do this one?', 'Comment voulez-vous procéder ?')}</p>
            <p class="hint">${this.t(
              'Either way you get both situations and the same guide. Only the order changes.',
              'Dans les deux cas vous aurez les deux situations et le même guide. Seul l\'ordre change.')}</p>
            <div class="paths">
              <button class="pathc rec" data-p="try-first">
                <div class="pi">🎯</div>
                <h4>${this.t('Try it first', 'Essayer d\'abord')}</h4>
                <p>${this.t(
                  'Jump straight in and see how you do. Then read the guide and try a second situation, so you can see what changed.',
                  'Lancez-vous et voyez ce que vous obtenez. Vous lirez ensuite le guide, puis une seconde situation pour mesurer la différence.')}</p>
                <span class="flow">${this.t('Try · Learn · Try again', 'Essai · Guide · Nouvel essai')}</span>
              </button>
              <button class="pathc" data-p="learn-first">
                <div class="pi">📖</div>
                <h4>${this.t('Learn it first', 'Apprendre d\'abord')}</h4>
                <p>${this.t(
                  'Read the guide before you start. Useful when the topic is new to you, or when you would rather prepare than guess.',
                  'Lisez le guide avant de commencer. Utile si le sujet est nouveau, ou si vous préférez préparer plutôt que deviner.')}</p>
                <span class="flow">${this.t('Learn · Try · Try again', 'Guide · Essai · Nouvel essai')}</span>
              </button>
            </div>
            <div class="btnrow" style="margin-top:18px">
              <button class="btn btn-g" id="p-back">${this.t('Back to workday', 'Retour')}</button>
            </div>
          </div>
        </div></div>`;
      host.querySelectorAll('[data-p]').forEach(b => b.onclick = () => {
        st.path = b.dataset.p;
        st.phase = this.PATHS[st.path][0];
        this.renderChallenge();
      });
      document.getElementById('p-back').onclick = () => { this.renderHome(); this.go('home'); };
      return;
    }

    if (st.phase === 'before' || st.phase === 'after') {
      const isAfter = st.phase === 'after';
      const learnFirst = st.path === 'learn-first';
      host.innerHTML = `
        <div class="wrap"><div class="stage">
          ${this.stepsHTML(st.phase)}
          <div class="panel">
            <div class="panel-lab">${c.icon} ${esc(c.categoryLab)} · ${
              isAfter ? this.t('Second situation', 'Seconde situation')
              : (learnFirst ? this.t('After the guide', 'Après le guide')
                            : this.t('Before learning', 'Avant la leçon'))}</div>
            <h2>${esc(c.title)}</h2>
            ${isAfter ? `<p class="brief">${this.t(
                'Same skill, a different situation. Use what you have just read.',
                'Même compétence, autre situation. Utilisez ce que vous venez de lire.')}</p>` : ''}
            ${(!isAfter && learnFirst) ? `<p class="brief">${this.t(
                'You have read the guide. Here is the first situation.',
                'Vous avez lu le guide. Voici la première situation.')}</p>` : ''}
            <p class="brief">${esc(ex.brief)}</p>
            ${ex.message ? `<div class="msg quote">${esc(ex.message)}</div>` : ''}
            <p class="qtext">${esc(ex.prompt)}</p>
            <p class="hint">${esc(c.instruction)}</p>
            <div id="ex"></div>
            <div class="btnrow" style="margin-top:20px">
              <button class="btn btn-p" id="ex-go" disabled>${this.t('Submit answer', 'Valider')}</button>
              <button class="btn btn-g" id="ex-back">${this.t('Back to workday', 'Retour')}</button>
            </div>
          </div>
        </div></div>`;
      const exHost = document.getElementById('ex');
      const go = document.getElementById('ex-go');
      R[renderer].mount(exHost, ex, ans => { st.answer = ans; go.disabled = (ans === null || ans === undefined); });
      go.onclick = () => {
        const res = OK.scoreExercise(ex, renderer, st.answer);
        res.lang = ex.lang;
        go.remove();
        if (isAfter) {
          // Second attempt: the learner has read the guide, so show the full
          // per-option feedback and let them read it before moving on.
          R[renderer].reveal(exHost, ex, res);
          st.after = res;
          this.results = this.results.filter(r => r.index !== st.index);
          this.results.push({
            index: st.index, before: st.before.score, after: st.after.score,
            improvement: st.after.score - st.before.score,
            path: st.path,
            topic: c.topic.label || '', title: c.title, skills: OK.skillsFor(c.activity)
          });
          this._st = st;
          this.results.sort((a, b) => a.index - b.index);
          const hasRamp = (c.drills && c.drills.length) || c.production;
          exHost.insertAdjacentHTML('afterend',
            `<div class="btnrow" style="margin-top:20px">
               <button class="btn btn-p" id="ex-done">${hasRamp
                 ? this.t('Now use it yourself', 'À vous maintenant')
                 : (learnFirst ? this.t('See your result', 'Voir votre résultat')
                               : this.t('See your progress', 'Voir votre progression'))} →</button>
             </div>`);
          document.getElementById('ex-done').onclick = () => {
            st.phase = (c.drills && c.drills.length) ? 'drill' : (c.production ? 'produce' : 'done');
            st.answer = null;
            this.renderChallenge();
          };
          document.getElementById('ex-done').scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          // First situation: nothing is revealed yet, not even the score.
          // Everything is shown together at the end, where the before/after
          // comparison actually means something.
          st.before = res;
          const next = learnFirst ? 'after' : 'learn';
          exHost.insertAdjacentHTML('afterend', `
            <div class="saved">
              <i>✓</i>
              <div>
                <b>${this.t('Answer locked in.', 'Réponse enregistrée.')}</b>
                <span>${learnFirst
                  ? this.t('One more situation to go. You will see all your scores at the end.',
                           'Encore une situation. Vous verrez tous vos scores à la fin.')
                  : this.t('No score yet on purpose. Read the guide, try the rest, and you will see how you did at the end.',
                           'Pas encore de score, volontairement. Lisez le guide, faites la suite, et vous verrez le résultat à la fin.')}</span>
              </div>
            </div>
            <div class="btnrow" style="margin-top:18px">
              <button class="btn btn-p" id="ex-continue">${learnFirst
                ? this.t('Next situation', 'Situation suivante')
                : this.t('Learn this', 'Apprendre')} →</button>
            </div>`);
          const cont = document.getElementById('ex-continue');
          cont.onclick = () => { st.phase = next; st.answer = null; this.renderChallenge(); };
          cont.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      };
      document.getElementById('ex-back').onclick = () => { this.renderHome(); this.go('home'); };
      return;
    }

    /* ---- Stage: typed recall. Three drills that ramp from choosing a word
            to typing one to completing a whole short text. ---- */
    if (st.phase === 'drill') {
      const d = c.drills[st.drillIdx];
      const total = c.drills.length;
      host.innerHTML = `
        <div class="wrap"><div class="stage">
          ${this.stepsHTML('drill')}
          <div class="panel">
            <div class="panel-lab">${this.t('Use it', 'À vous')} · ${esc(c.guide.title || '')}</div>
            <div class="qcount">${this.t('Step', 'Étape')} ${st.drillIdx + 1} / ${total}</div>
            <p class="qtext">${esc(d.prompt)}</p>
            ${d.message ? `<div class="msg">${esc(d.message)}</div>` : ''}
            ${d.instruction ? `<p class="hint">${esc(d.instruction)}</p>` : ''}
            <div id="ex"></div>
            <div class="btnrow" style="margin-top:20px">
              <button class="btn btn-p" id="ex-go" disabled>${this.t('Check', 'Vérifier')}</button>
              <button class="btn btn-g" id="ex-back">${this.t('Back to workday', 'Retour')}</button>
            </div>
          </div>
        </div></div>`;
      const exHost = document.getElementById('ex');
      const go = document.getElementById('ex-go');
      R[d.renderer].mount(exHost, d, ans => {
        st.answer = ans; go.disabled = (ans === null || ans === undefined);
      });
      go.onclick = () => {
        const res = OK.scoreExercise(d, d.renderer, st.answer);
        R[d.renderer].reveal(exHost, d, res);
        st.drillScores[st.drillIdx] = res.score;
        go.remove();
        const last = st.drillIdx === total - 1;
        exHost.insertAdjacentHTML('afterend',
          `<div class="btnrow" style="margin-top:18px">
             <button class="btn btn-p" id="ex-next">${last
               ? (c.production ? this.t('Now write it yourself', 'À vous d\'écrire')
                               : this.t('See your progress', 'Voir votre progression'))
               : this.t('Next step', 'Étape suivante')} →</button>
           </div>`);
        document.getElementById('ex-next').onclick = () => {
          if (last) { st.phase = c.production ? 'produce' : 'done'; }
          else { st.drillIdx++; }
          st.answer = null;
          this.renderChallenge();
        };
        document.getElementById('ex-next').scrollIntoView({ behavior: 'smooth', block: 'center' });
      };
      document.getElementById('ex-back').onclick = () => { this.renderHome(); this.go('home'); };
      return;
    }

    /* ---- Stage: production. Write the real thing, speak it, or go and listen
            to something real and report back. ---- */
    if (st.phase === 'produce') {
      const pr = c.production;
      const isText = pr.renderer === 'writing' || pr.renderer === 'listening';
      host.innerHTML = `
        <div class="wrap"><div class="stage">
          ${this.stepsHTML('produce')}
          <div class="panel">
            <div class="panel-lab">${this.t('Produce', 'Production')} · ${
              pr.kind === 'speak' ? this.t('Speaking', 'Oral')
              : pr.kind === 'listen' ? this.t('Listening', 'Écoute') : this.t('Writing', 'Écrit')}</div>
            <h2>${esc(pr.title)}</h2>
            <p class="brief">${esc(pr.brief)}</p>
            ${pr.kind !== 'listen' && pr.task ? `<p class="qtext">${esc(pr.task)}</p>` : ''}
            ${(pr.kind === 'write' && pr.include) ? `<ul class="musts">${pr.include
              .map(i => `<li>${esc(i)}</li>`).join('')}</ul>` : ''}
            <div id="ex"></div>
            <div class="btnrow" style="margin-top:20px">
              <button class="btn btn-p" id="ex-go" disabled>${isText
                ? this.t('Check my answer', 'Vérifier ma réponse')
                : this.t('Finish', 'Terminer')}</button>
              <button class="btn btn-g" id="ex-skip">${this.t('Skip this part', 'Passer cette partie')}</button>
            </div>
          </div>
        </div></div>`;
      const exHost = document.getElementById('ex');
      const go = document.getElementById('ex-go');
      // For a writing task the page already shows the brief, the task and the
      // requirements, so the renderer only needs the textarea.
      const lang = this.profile.language;
      const exData = Object.assign({}, pr, { lang },
        pr.kind === 'write' ? { include: null, task: null } : {});
      R[pr.renderer].mount(exHost, exData, ans => {
        st.answer = ans; go.disabled = (ans === null || ans === undefined);
      });
      go.onclick = () => {
        const res = OK.scoreExercise(exData, pr.renderer, st.answer);
        res.lang = lang;
        R[pr.renderer].reveal(exHost, exData, res);
        st.production = res;
        go.remove();
        document.getElementById('ex-skip').remove();
        exHost.insertAdjacentHTML('afterend',
          `<div class="btnrow" style="margin-top:18px">
             <button class="btn btn-p" id="ex-fin">${this.t('See your progress', 'Voir votre progression')} →</button>
           </div>`);
        document.getElementById('ex-fin').onclick = () => { st.phase = 'done'; this.renderChallenge(); };
      };
      document.getElementById('ex-skip').onclick = () => {
        if (exHost._cleanup) exHost._cleanup();
        st.production = null; st.phase = 'done'; this.renderChallenge();
      };
      return;
    }

    if (st.phase === 'learn') {
      host.innerHTML = `
        <div class="wrap"><div class="stage">
          ${this.stepsHTML('learn')}
          <div class="panel guide">${this.guideHTML(c.guide, this.profile.language)}</div>
          <div class="btnrow" style="justify-content:center">
            <button class="btn btn-p" id="s-try">${st.path === 'learn-first'
              ? this.t('Start the challenge', 'Commencer le défi')
              : this.t('Try a new situation', 'Nouvelle situation')} →</button>
          </div>
        </div></div>`;
      document.getElementById('s-try').onclick = () => {
        st.phase = st.path === 'learn-first' ? 'before' : 'after';
        st.answer = null;
        this.renderChallenge();
      };
      return;
    }

    if (st.phase === 'done') {
      const b = st.before.score, a = st.after.score, d = a - b;
      const learnFirst = st.path === 'learn-first';
      const avg = Math.round((a + b) / 2);
      // Fold the ramp scores into the stored result for the workday summary.
      const row = this.results.find(r => r.index === st.index);
      if (row) {
        row.drills = st.drillScores.length ? this.avg(st.drillScores) : null;
        row.produced = st.production ? st.production.score : null;
        row.productionKind = st.production ? c.production.kind : null;
        row.overall = this.overall(st);
      }
      host.innerHTML = `
        <div class="wrap"><div class="stage">
          ${this.stepsHTML('done')}
          <div class="panel">
            <div class="panel-lab">${this.t('Challenge complete', 'Défi terminé')}</div>
            <h2>${esc(c.title)}</h2>
            <div class="score" style="padding:18px 0 6px">
              <div class="lab">${this.t('Your score', 'Votre score')}</div>
              <div class="n" data-n>0<small>/100</small></div>
              <div class="bar"><i data-bar></i></div>
              <p class="verdict">${esc(OK.verdict(this.overall(st), this.profile.language))}</p>
            </div>
            <div class="res">
              ${learnFirst ? `
                <div class="rbox"><div class="lab">${this.t('Situation 1', 'Situation 1')}</div><div class="n">${b}</div></div>
                <div class="rbox"><div class="lab">${this.t('Situation 2', 'Situation 2')}</div><div class="n">${a}</div></div>
                <div class="rbox"><div class="lab">${this.t('Average', 'Moyenne')}</div><div class="n">${avg}</div></div>`
              : `
                <div class="rbox"><div class="lab">${this.t('Before', 'Avant')}</div><div class="n">${b}</div></div>
                <div class="rbox"><div class="lab">${this.t('After', 'Après')}</div><div class="n">${a}</div></div>
                <div class="rbox ${d > 0 ? 'up' : ''}"><div class="lab">${this.t('Change', 'Évolution')}</div>
                  <div class="n">${d > 0 ? d : (d === 0 ? '0' : d)}</div></div>`}
            </div>
            <p class="brief">${esc(learnFirst ? this.readNote(b, a) : this.improvementNote(b, a))}</p>
            ${(st.drillScores.length || st.production) ? `
              <div class="gsec"><h4>${this.t('Stage by stage', 'Étape par étape')}</h4>
                <div class="stagebar">
                  ${st.drillScores.length ? `
                    <div class="sb"><div class="t">${this.t('Completing', 'Compléter')}</div>
                      <div class="v">${this.avg(st.drillScores)}</div></div>` : ''}
                  ${st.production ? `
                    <div class="sb"><div class="t">${
                      c.production.kind === 'speak' ? this.t('Speaking', 'Oral')
                      : c.production.kind === 'listen' ? this.t('Listening', 'Écoute')
                      : this.t('Writing', 'Écrit')}</div>
                      <div class="v">${st.production.score}</div></div>` : ''}
                  <div class="sb up"><div class="t">${this.t('Overall', 'Global')}</div>
                    <div class="v">${this.overall(st)}</div></div>
                </div>
                <p class="hint" style="margin-top:10px">${this.t(
                  'Completing and producing are harder than recognising, so these scores are normally lower. That is the point.',
                  'Compléter et produire sont plus difficiles que reconnaître : ces scores sont normalement plus bas. C\'est normal.')}</p>
              </div>` : ''}
            <div class="gsec"><h4>${this.t('Practised', 'Travaillé')}</h4>
              <div class="skills">
                <span class="chip chip-o">${esc(c.topic.label || '')}</span>
                ${OK.skillsFor(c.activity).map(s => `<span class="chip">${esc(this.skillName(s))}</span>`).join('')}
              </div></div>
            <div class="btnrow" style="margin-top:22px">
              ${this.results.length === 2
                ? `<button class="btn btn-p" id="d-res">${this.t('See workday summary', 'Voir le bilan')} →</button>`
                : `<button class="btn btn-p" id="d-next">${this.t('Next challenge', 'Défi suivant')} →</button>`}
              <button class="btn btn-o" id="d-guide">${this.t('Review the guide', 'Revoir le guide')}</button>
              <button class="btn btn-g" id="d-home">${this.t('Back to workday', 'Retour')}</button>
            </div>
          </div>
        </div></div>`;
      this.countUp(host.querySelector('[data-n]'), this.overall(st), host.querySelector('[data-bar]'));
      const nx = document.getElementById('d-next');
      if (nx) nx.onclick = () => {
        const other = this.workday.challenges.findIndex((_, i) => !this.results.some(r => r.index === i));
        if (other >= 0) this.openChallenge(other); else { this.renderHome(); this.go('home'); }
      };
      const rs = document.getElementById('d-res'); if (rs) rs.onclick = () => this.renderResults();
      document.getElementById('d-guide').onclick = () => { st.phase = 'learn'; this.renderChallenge(); };
      document.getElementById('d-home').onclick = () => { this.renderHome(); this.go('home'); };
    }
  },

  /* Learn-first has no before/after gap to report, so the note is about how
     well the guide actually transferred into the two situations. */
  readNote(b, a) {
    const avg = (a + b) / 2;
    if (avg >= 90) return this.t(
      'You read it and it stuck, in both situations. This one is ready to use at work.',
      'Vous avez lu et cela a tenu, dans les deux situations. Vous pouvez l\'utiliser au travail.');
    if (avg >= 70) return this.t(
      'Good, and the guide clearly did some work. The gap between the two situations is where to look next.',
      'Bien, et le guide a clairement servi. C\'est l\'écart entre les deux situations qu\'il faut regarder.');
    if (a > b) return this.t(
      'The second one went better than the first, so it settled as you went. Worth running this topic again.',
      'La seconde a mieux marché que la première : cela s\'est installé en cours de route. À refaire.');
    return this.t(
      'Reading it is not the same as using it. Try this topic again with Try it first, and see what sticks.',
      'Lire n\'est pas utiliser. Reprenez ce thème en mode Essayer d\'abord, et voyez ce qui reste.');
  },

  avg(list) { return list.length ? Math.round(list.reduce((n, x) => n + x, 0) / list.length) : 0; },

  /* One headline number per challenge. Recognition, recall and production are
     weighted equally, so producing something actually counts. */
  overall(st) {
    const parts = [st.before.score, st.after.score];
    if (st.drillScores.length) parts.push(this.avg(st.drillScores));
    if (st.production) parts.push(st.production.score);
    return this.avg(parts);
  },

  improvementNote(b, a) {
    const d = a - b;
    if (d >= 25) return this.t(
      'That is a real jump. The guide closed a gap you did not know was there, which is the whole point.',
      'Un vrai bond. Le guide a comblé une lacune que vous ne soupçonniez pas, et c\'est tout l\'objectif.');
    if (d > 0) return this.t(
      'Better the second time. Small gains like this, repeated, are what move a level.',
      'Meilleur au second essai. Ce sont ces petits gains répétés qui font changer de niveau.');
    if (d === 0 && a >= 90) return this.t(
      'You already had this one. Move up to Challenge, or take it into a different job.',
      'Vous maîtrisiez déjà. Passez au niveau Challenge, ou changez de métier.');
    if (d === 0) return this.t(
      'No change this time. Go back to the common mistake in the guide, because that is usually where the points hide.',
      'Pas d\'évolution cette fois. Relisez l\'erreur fréquente du guide, c\'est souvent là que se jouent les points.');
    return this.t(
      'The second one was harder. That tells you something useful: this skill is not automatic yet.',
      'La seconde était plus difficile. Cela vous dit quelque chose d\'utile : ce n\'est pas encore automatique.');
  },

  skillName(s) {
    const en = { communication:'Communication', 'professional-tone':'Professional tone', grammar:'Grammar',
      vocabulary:'Vocabulary', writing:'Writing', reading:'Reading', speaking:'Speaking', comprehension:'Comprehension' };
    const fr = { communication:'Communication', 'professional-tone':'Registre professionnel', grammar:'Grammaire',
      vocabulary:'Vocabulaire', writing:'Expression écrite', reading:'Lecture', speaking:'Expression orale', comprehension:'Compréhension' };
    return (this.L() === 'fr' ? fr : en)[s] || s;
  },

  countUp(el, target, bar) {
    let n = 0;
    const step = Math.max(1, Math.round(target / 28));
    const tick = setInterval(() => {
      n = Math.min(target, n + step);
      el.innerHTML = n + '<small>/100</small>';
      if (n >= target) clearInterval(tick);
    }, 26);
    if (bar) setTimeout(() => { bar.style.width = target + '%'; }, 90);
  },

  /* ============================================================
     GUIDES
     ============================================================ */
  guideHTML(g, lang) {
    if (!g || !g.title) return '<p>Guide unavailable.</p>';
    const T = (en, fr) => this.t(en, fr);
    const language = lang || (this.profile ? this.profile.language : 'english');
    return `<div class="guide-in" data-gid="${g.id}" data-glang="${language}">
      <div class="panel-lab">${T('Learning zone', 'Zone d\'apprentissage')} · ${g.minutes} min</div>
      <h2>${esc(g.title)}</h2>
      ${g.level ? `<span class="chip chip-o" style="margin-top:8px">${g.level} · ${this.levelName(g.level)}</span>` : ''}
      ${g.ielts ? '<span class="chip chip-g" style="margin-top:8px">IELTS skill</span>' : ''}
      <p class="brief">${esc(g.explanation)}</p>
      ${g.expressions && g.expressions.length ? `<div class="gsec"><h4>${T('Useful expressions', 'Expressions utiles')}</h4>
        <div class="gl">${g.expressions.map(e => `<div>${esc(e)}</div>`).join('')}</div></div>` : ''}
      ${g.vocabulary && g.vocabulary.length ? `<div class="gsec"><h4>${T('Vocabulary', 'Vocabulaire')}</h4>
        <div class="vocab">${g.vocabulary.map(v => `<div><b>${esc(v.term)}</b><span>${esc(v.gloss)}</span></div>`).join('')}</div></div>` : ''}
      ${g.examples && g.examples.length ? `<div class="gsec"><h4>${T('Examples', 'Exemples')}</h4>
        <div class="ex">${g.examples.map(e => `<div><b>${esc(e.label)}</b><span>${esc(e.text)}</span></div>`).join('')}</div></div>` : ''}
      ${g.mistake ? `<div class="gsec"><h4>${T('Common mistake', 'Erreur fréquente')}</h4>
        <div class="mis"><div class="w">${esc(g.mistake.wrong)}</div><div class="r">${esc(g.mistake.right)}</div>
        <div class="y">${esc(g.mistake.why)}</div></div></div>` : ''}
      ${g.tip ? `<div class="tipbox"><b>${T('Quick tip', 'Astuce')}</b>${esc(g.tip)}</div>` : ''}</div>`;
  },

  levelName(lvl) {
    return { A2: this.t('Easy', 'Facile'), B1: this.t('Core', 'Intermédiaire'),
             B2: this.t('Challenge', 'Avancé') }[lvl] || lvl;
  },

  /* ============================================================
     RESULTS — end of workday
     ============================================================ */
  renderResults() {
    const r = this.results;
    const tried = r.filter(x => x.path !== 'learn-first');
    const total = tried.reduce((n, x) => n + x.improvement, 0);
    const avg = r.length ? Math.round(r.reduce((n, x) => n + (x.overall != null ? x.overall : x.after), 0) / r.length) : 0;
    const topics = [...new Set(r.map(x => x.topic))];
    const skills = [...new Set(r.flatMap(x => x.skills))];
    document.getElementById('sc-results').innerHTML = `
      <div class="wrap"><div class="stage">
        <div class="hero" style="padding:24px 0 10px">
          <div class="eyebrow">${this.t('Workday complete', 'Journée terminée')}</div>
          <h1>${this.t('Good work, ', 'Beau travail, ')}${esc(this.profile.name)}</h1>
        </div>
        <div class="panel">
          <div class="res">
            <div class="rbox"><div class="lab">${this.t('Challenges', 'Défis')}</div><div class="n">${r.length}</div></div>
            ${tried.length ? `
              <div class="rbox ${total > 0 ? 'up' : ''}"><div class="lab">${this.t('Total improvement', 'Progression totale')}</div>
                <div class="n">${total}</div></div>` : ''}
            <div class="rbox"><div class="lab">${this.t('Overall score', 'Score global')}</div>
              <div class="n">${avg}</div></div>
          </div>
          <div class="gsec"><h4>${this.t('Today you practised', 'Aujourd\'hui vous avez travaillé')}</h4>
            <div class="skills">
              ${topics.map(t => `<span class="chip chip-o">${esc(t)}</span>`).join('')}
              ${skills.map(s => `<span class="chip">${esc(this.skillName(s))}</span>`).join('')}
            </div></div>
          <div class="gsec"><h4>${this.t('Challenge by challenge', 'Défi par défi')}</h4>
            ${r.map((x, i) => `<div class="sumrow">
              <b>${i + 1}. ${esc(x.title)}</b>
              ${x.overall != null ? `
                <span class="sc">
                  ${x.path === 'learn-first'
                    ? `<span class="chip">${this.t('Learned first', 'Guide d\'abord')}</span>` : ''}
                  ${this.t('Recognise', 'Reconnaître')} ${Math.round((x.before + x.after) / 2)}
                  ${x.drills != null ? `<span style="color:var(--ink-3)">·</span> ${this.t('Complete', 'Compléter')} ${x.drills}` : ''}
                  ${x.produced != null ? `<span style="color:var(--ink-3)">·</span> ${this.t('Produce', 'Produire')} ${x.produced}` : ''}
                  <span class="up">${this.t('Overall', 'Global')} ${x.overall}</span></span>`
              : x.path === 'learn-first' ? `
                <span class="sc"><span class="chip">${this.t('Learned first', 'Guide d\'abord')}</span>
                  ${x.before} <span style="color:var(--ink-3)">·</span> ${x.after}</span>`
              : `
                <span class="sc">${this.t('Before', 'Avant')} ${x.before}
                  <span style="color:var(--ink-3)">→</span> ${this.t('After', 'Après')} ${x.after}
                  <span class="up">${x.improvement > 0 ? '+' + x.improvement : x.improvement}</span></span>`}
            </div>`).join('')}
          </div>
        </div>
        <p class="hint" style="text-align:center">${this.t(
          'Nothing is saved and nothing is owed. Come back whenever you like, and start wherever you want.',
          'Rien n\'est enregistré et rien n\'est dû. Revenez quand vous voulez, et reprenez où vous voulez.')}</p>
        <div class="btnrow" style="justify-content:center;margin-top:12px">
          <button class="btn btn-p" id="r-new">↻ ${this.t('New workday', 'Nouvelle journée')}</button>
          <button class="btn btn-o" id="r-job">${this.t('Change workday', 'Changer de contexte')}</button>
          <button class="btn btn-o" id="r-lang">${this.t('Change language', 'Changer de langue')}</button>
        </div>
      </div></div>`;
    document.getElementById('r-new').onclick  = () => { this.newWorkday(); this.go('home'); };
    document.getElementById('r-job').onclick  = () => { this.go('home'); this.quickPick('context'); };
    document.getElementById('r-lang').onclick = () => { this.go('home'); this.quickPick('language'); };
    this.go('results');
  },

  /* ============================================================
     LIBRARY — browse every guide, both languages
     ============================================================ */
  renderLibrary(lang, level) {
    const L = lang || (this.profile ? this.profile.language : 'english');
    const mine = this.profile ? OK.levelOf(this.profile.level) : 'all';
    // Opening the library starts at the learner's own level; switching
    // language or coming back from a guide keeps the level being browsed.
    const lvl = level || mine;
    this.libLevel = lvl;
    const order = { A2: 0, B1: 1, B2: 2 };
    const all = OK.data.lang[L].guides.slice()
      .sort((a, b) => (order[a.level] ?? 3) - (order[b.level] ?? 3));
    const guides = lvl === 'all' ? all : all.filter(g => g.level === lvl);
    const count = v => v === 'all' ? all.length : all.filter(g => g.level === v).length;
    document.getElementById('sc-library').innerHTML = `
      <div class="wrap">
        <div class="sechead" style="margin-top:28px">
          <h2>${this.t('Learning guides', 'Guides d\'apprentissage')}</h2>
          <p>${this.t(
            'Each guide takes one to three minutes. Read them in any order, nothing is locked.',
            'Chaque guide se lit en une à trois minutes. Lisez-les dans l\'ordre que vous voulez, rien n\'est verrouillé.')}</p>
        </div>
        <div class="filters">
          <button class="tbtn ${L === 'english' ? 'act' : ''}" data-lang="english">English (${OK.data.lang.english.guides.length})</button>
          <button class="tbtn ${L === 'french' ? 'act' : ''}" data-lang="french">Français (${OK.data.lang.french.guides.length})</button>
        </div>
        <div class="filters" style="margin-top:-8px">
          ${['A2', 'B1', 'B2'].map(v => `<button class="tbtn ${lvl === v ? 'act' : ''}" data-lvl="${v}"
            ${v === mine ? `title="${this.t('Your level', 'Votre niveau')}"` : ''}>
            ${v} · ${this.levelName(v)} (${count(v)})</button>`).join('')}
          <button class="tbtn ${lvl === 'all' ? 'act' : ''}" data-lvl="all">${this.t('All levels', 'Tous les niveaux')} (${count('all')})</button>
        </div>
        <div class="lib">
          ${guides.map(g => `<button class="libc" data-g="${g.id}">
            <h4>${esc(g.title)}</h4>
            <p>${esc(g.explanation)}</p>
            ${g.level ? `<span class="chip chip-n">${g.level}</span>` : ''}
            <span class="chip chip-o">${g.minutes} min</span>
            ${g.ielts ? '<span class="chip chip-g">IELTS</span>' : ''}
          </button>`).join('')}
        </div>
      </div>`;
    document.querySelectorAll('#sc-library [data-lvl]').forEach(b =>
      b.onclick = () => this.renderLibrary(L, b.dataset.lvl));
    document.querySelectorAll('#sc-library [data-lang]').forEach(b =>
      b.onclick = () => this.renderLibrary(b.dataset.lang, this.libLevel));
    document.querySelectorAll('#sc-library [data-g]').forEach(b => b.onclick = () => {
      const g = guides.find(x => x.id === b.dataset.g);
      document.getElementById('sc-guide').innerHTML = `
        <div class="wrap"><div class="stage">
          <button class="btn btn-g" id="g-back">← ${this.t('All guides', 'Tous les guides')}</button>
          <div class="panel guide">${this.guideHTML(g, L)}</div>
        </div></div>`;
      document.getElementById('g-back').onclick = () => { this.renderLibrary(L, this.libLevel); this.go('library'); };
      this.go('guide');
    });
  },

  /* ---------- brand marks ---------- */
  lanyardSVG() {
    return `<div class="lanyard"><svg width="120" height="66" viewBox="0 0 120 66" aria-hidden="true">
      <path d="M40 0 L56 40 M80 0 L64 40" stroke="#375A7E" stroke-width="8" fill="none" stroke-linejoin="round"/>
      <rect x="52" y="38" width="16" height="12" rx="3" fill="#C47B26"/>
      <circle cx="60" cy="56" r="8" fill="none" stroke="#8A98A3" stroke-width="3"/>
    </svg></div>`;
  }
};

window.addEventListener('DOMContentLoaded', () => APP.start());
