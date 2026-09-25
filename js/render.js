/* ============================================================
   OIKOS LINGUA — exercise renderers
   Twelve renderers cover all nineteen interaction types.
   Each exposes: mount(host, ex, onReady) and reveal(host, ex, result)
   ============================================================ */
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
const KEY = i => 'ABCDEFGH'[i] || String(i + 1);

const R = {

/* ---------- 1. choice — single select ---------- */
choice: {
  mount(host, ex, onReady) {
    const order = OK.shuffle(ex.options.map((o, i) => i));
    host.dataset.order = JSON.stringify(order);
    host.innerHTML = `<div class="opts">${order.map((oi, n) => `
      <button class="opt" data-i="${oi}">
        <span class="opt-k">${KEY(n)}</span>
        <span class="opt-t">${esc(ex.options[oi].text)}</span>
      </button>`).join('')}</div>`;
    host.querySelectorAll('.opt').forEach(b => b.onclick = () => {
      host.querySelectorAll('.opt').forEach(x => x.classList.remove('sel'));
      b.classList.add('sel');
      onReady(+b.dataset.i);
    });
  },
  reveal(host, ex, res) {
    const order = JSON.parse(host.dataset.order);
    host.querySelectorAll('.opt').forEach(b => {
      const i = +b.dataset.i, o = ex.options[i], n = order.indexOf(i);
      b.disabled = true;
      b.classList.remove('sel');
      b.classList.add(o.score >= 90 ? 'ok' : o.score >= 50 ? 'mid' : 'no');
      b.innerHTML = `<span class="opt-k">${KEY(n)}</span>
        <span class="opt-t">${esc(o.text)}${i === res.chosen ? `<span class="opt-fb">${esc(o.feedback)}</span>` : ''}</span>
        <span class="opt-sc">${o.score}</span>`;
    });
  }
},

/* ---------- 2. multi — select all that apply ---------- */
multi: {
  mount(host, ex, onReady) {
    const order = OK.shuffle(ex.options.map((o, i) => i));
    host.dataset.order = JSON.stringify(order);
    const picked = new Set();
    host.innerHTML = `<div class="opts">${order.map((oi, n) => `
      <button class="opt" aria-pressed="false" data-i="${oi}">
        <span class="opt-k">${KEY(n)}</span>
        <span class="opt-t">${esc(ex.options[oi].text)}</span>
      </button>`).join('')}</div>`;
    host.querySelectorAll('.opt').forEach(b => b.onclick = () => {
      const i = +b.dataset.i;
      picked.has(i) ? picked.delete(i) : picked.add(i);
      b.setAttribute('aria-pressed', picked.has(i));
      onReady(picked.size ? [...picked] : null);
    });
  },
  reveal(host, ex, res) {
    const order = JSON.parse(host.dataset.order), chosen = res.chosen || [];
    host.querySelectorAll('.opt').forEach(b => {
      const i = +b.dataset.i, o = ex.options[i], n = order.indexOf(i), took = chosen.includes(i);
      b.disabled = true;
      b.setAttribute('aria-pressed', 'false');
      const mark = o.correct ? 'ok' : (took ? 'no' : '');
      if (mark) b.classList.add(mark);   // an untaken wrong option stays neutral
      const glyph = o.correct ? '✓' : (took ? '✕' : KEY(n));
      b.innerHTML = `<span class="opt-k">${glyph}</span>
        <span class="opt-t">${esc(o.text)}${(took || o.correct) ? `<span class="opt-fb">${esc(o.feedback)}</span>` : ''}</span>`;
    });
  }
},

/* ---------- 3. order — sentence / email ordering ---------- */
order: {
  mount(host, ex, onReady) {
    // state holds original indices in their current display order
    let state = OK.shuffle(ex.items.map((t, i) => i));
    if (state.every((v, i) => v === i) && state.length > 1) state = state.reverse();
    const draw = () => {
      host.innerHTML = `<div class="ord">${state.map((orig, pos) => `
        <div class="ord-i">
          <span class="ord-n">${pos + 1}</span>
          <span class="ord-t">${esc(ex.items[orig])}</span>
          <span class="ord-b">
            <button class="ordbtn up" data-p="${pos}" ${pos === 0 ? 'disabled' : ''} aria-label="Move up">▲</button>
            <button class="ordbtn dn" data-p="${pos}" ${pos === state.length - 1 ? 'disabled' : ''} aria-label="Move down">▼</button>
          </span>
        </div>`).join('')}</div>`;
      host.querySelectorAll('.ordbtn').forEach(b => b.onclick = () => {
        const p = +b.dataset.p, q = b.classList.contains('up') ? p - 1 : p + 1;
        [state[p], state[q]] = [state[q], state[p]];
        draw(); onReady(state.slice());
      });
    };
    draw();
    onReady(state.slice());   // any order is a submittable answer
  },
  reveal(host, ex, res) {
    const state = res.chosen;
    host.innerHTML = `<div class="ord">${state.map((orig, pos) => `
      <div class="ord-i ${orig === pos ? 'ok' : 'no'}">
        <span class="ord-n">${pos + 1}</span>
        <span class="ord-t">${esc(ex.items[orig])}</span>
        <span class="opt-sc">${orig === pos ? '✓' : '→ ' + (orig + 1)}</span>
      </div>`).join('')}</div>
      <div class="mis"><div class="r">Correct order</div>
        <div class="y">${ex.items.map((t, i) => `${i + 1}. ${esc(t)}`).join('<br>')}</div></div>`;
  }
},

/* ---------- 4. categorise — sort into bins ---------- */
categorise: {
  mount(host, ex, onReady) {
    const assign = {};                       // item index -> bin name
    const shuffled = OK.shuffle(ex.items.map((it, i) => i));
    host.dataset.shuffled = JSON.stringify(shuffled);
    const draw = () => {
      const left = shuffled.filter(i => !assign[i]);
      host.innerHTML = `
        <div class="pool">${left.length
          ? left.map(i => `<button class="tok" data-i="${i}">${esc(ex.items[i].text)}</button>`).join('')
          : '<span style="color:var(--ink-3);font-size:13px">All items placed.</span>'}</div>
        <div class="bins">${ex.bins.map(b => `
          <div class="bin"><h4>${esc(b)}</h4><div class="bin-items">
            ${Object.keys(assign).filter(i => assign[i] === b)
              .map(i => `<button class="tok" data-back="${i}">${esc(ex.items[i].text)}</button>`).join('')}
          </div></div>`).join('')}</div>`;
      host.querySelectorAll('[data-i]').forEach(b => b.onclick = () => {
        // click an item, then it goes to the next bin in rotation
        const i = +b.dataset.i;
        assign[i] = ex.bins[0];
        draw(); check();
      });
      host.querySelectorAll('[data-back]').forEach(b => b.onclick = () => {
        const i = +b.dataset.back;
        const cur = ex.bins.indexOf(assign[i]);
        if (cur === ex.bins.length - 1) delete assign[i]; else assign[i] = ex.bins[cur + 1];
        draw(); check();
      });
    };
    const check = () => onReady(Object.keys(assign).length === ex.items.length
      ? ex.items.map((_, i) => assign[i] || null) : null);
    draw(); check();
  },
  reveal(host, ex, res) {
    host.innerHTML = `<div class="bins">${ex.bins.map(b => `
      <div class="bin"><h4>${esc(b)}</h4><div class="bin-items">
        ${ex.items.map((it, i) => ({ it, i })).filter(({ it }) => it.bin === b)
          .map(({ it, i }) => `<button class="tok ${res.chosen[i] === it.bin ? 'ok' : 'no'}" disabled>
            ${esc(it.text)}${res.chosen[i] === it.bin ? ' ✓' : ' ✕'}</button>`).join('')}
      </div></div>`).join('')}</div>`;
  }
},

/* ---------- 5. matching ---------- */
matching: {
  mount(host, ex, onReady) {
    const answers = new Array(ex.pairs.length).fill('');
    const opts = OK.shuffle(ex.pairs.map(p => p.right));
    host.innerHTML = ex.pairs.map((p, i) => `
      <div class="mrow">
        <div class="mleft">${esc(p.left)}</div>
        <div class="marrow">→</div>
        <select class="msel" data-i="${i}">
          <option value="">— choose —</option>
          ${opts.map(o => `<option value="${esc(o)}">${esc(o)}</option>`).join('')}
        </select>
      </div>`).join('');
    host.querySelectorAll('.msel').forEach(s => s.onchange = () => {
      answers[+s.dataset.i] = s.value;
      onReady(answers.every(a => a) ? answers.slice() : null);
    });
  },
  reveal(host, ex, res) {
    host.querySelectorAll('.msel').forEach(s => {
      const i = +s.dataset.i, ok = res.chosen[i] === ex.pairs[i].right;
      s.disabled = true;
      s.classList.add(ok ? 'ok' : 'no');
      if (!ok) {
        s.insertAdjacentHTML('afterend',
          `<div class="opt-fb" style="grid-column:1/-1">Correct: <b>${esc(ex.pairs[i].right)}</b></div>`);
      }
    });
  }
},

/* ---------- 6. speaking — record locally, self-assess ---------- */
speaking: {
  mount(host, ex, onReady) {
    const checks = new Array(ex.checklist.length).fill(false);
    host.innerHTML = `
      <div class="spk">
        <div class="ph" data-ph>Preparation</div>
        <div class="tm" data-tm>${ex.prepSeconds}s</div>
        <div class="btnrow">
          <button class="btn btn-p" data-go>Start preparation</button>
          <button class="btn btn-o" data-rec hidden>● Record</button>
          <button class="btn btn-o" data-skip>Skip timer</button>
        </div>
        <div data-audio></div>
      </div>
      <p class="hint">Audio is recorded in your browser only. Nothing is uploaded, stored or sent anywhere — it disappears when you leave the page.</p>
      <div class="chk" data-chk hidden>
        <p class="qtext" style="margin-bottom:4px">Self check</p>
        ${ex.checklist.map((c, i) => `<label><input type="checkbox" data-c="${i}"><span>${esc(c)}</span></label>`).join('')}
      </div>`;

    const $ = s => host.querySelector(s);
    let timer = null, rec = null, chunks = [], url = null;

    const countdown = (secs, label, done) => {
      clearInterval(timer);
      let n = secs;
      $('[data-ph]').textContent = label;
      $('[data-tm]').textContent = n + 's';
      timer = setInterval(() => {
        n--; $('[data-tm]').textContent = Math.max(0, n) + 's';
        if (n <= 0) { clearInterval(timer); done && done(); }
      }, 1000);
    };

    const showChecklist = () => {
      $('[data-chk]').hidden = false;
      $('[data-skip]').hidden = true;
      host.querySelectorAll('[data-c]').forEach(c => c.onchange = () => {
        checks[+c.dataset.c] = c.checked;
        onReady(checks.slice());
      });
      onReady(checks.slice());   // self-assessment can be submitted with nothing ticked
    };

    const stopRec = () => {
      if (rec && rec.state === 'recording') rec.stop();
      clearInterval(timer);
      $('[data-ph]').textContent = 'Finished';
      $('[data-tm]').textContent = '✓';
      $('[data-rec]').hidden = true;
      showChecklist();
    };

    const startSpeaking = async () => {
      $('[data-go]').hidden = true;
      $('[data-rec]').hidden = true;
      countdown(ex.speakSeconds, 'Speaking', stopRec);
      // Attach the escape hatch before awaiting permission, so a learner stuck
      // at the microphone prompt can always finish the exercise.
      $('[data-skip]').onclick = stopRec;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        rec = new MediaRecorder(stream);
        chunks = [];
        rec.ondataavailable = e => chunks.push(e.data);
        rec.onstop = () => {
          stream.getTracks().forEach(t => t.stop());
          if (url) URL.revokeObjectURL(url);
          url = URL.createObjectURL(new Blob(chunks, { type: 'audio/webm' }));
          $('[data-audio]').innerHTML =
            `<audio controls src="${url}"></audio>
             <button class="btn btn-g" style="color:#fff;opacity:.8" data-del>Delete recording</button>`;
          const del = $('[data-del]');
          if (del) del.onclick = () => { URL.revokeObjectURL(url); url = null; $('[data-audio]').innerHTML = ''; };
        };
        rec.start();
      } catch (e) {
        // No microphone, or permission refused — the exercise still works without it.
        $('[data-audio]').innerHTML =
          '<p style="font-size:13px;opacity:.8;margin:12px 0 0">Microphone unavailable — speak aloud and use the self check below.</p>';
      }
    };

    $('[data-go]').onclick = () => {
      $('[data-go]').hidden = true;
      countdown(ex.prepSeconds, 'Preparation', () => { $('[data-rec]').hidden = false; });
      $('[data-rec]').hidden = false;
      $('[data-rec]').onclick = startSpeaking;
      $('[data-skip]').onclick = () => { clearInterval(timer); $('[data-rec]').hidden = false; $('[data-tm]').textContent = '0s'; };
    };
    $('[data-skip]').onclick = () => { $('[data-go]').click(); };

    host._cleanup = () => { clearInterval(timer); if (rec && rec.state === 'recording') rec.stop(); if (url) URL.revokeObjectURL(url); };
  },
  reveal(host, ex, res) {
    host.querySelectorAll('[data-c]').forEach(c => c.disabled = true);
    host.insertAdjacentHTML('beforeend',
      `<div class="model"><h4>Model answer</h4><p>${esc(ex.model)}</p></div>`);
  }
}
};

/* ============================================================
   Ramp renderers: typed recall and open production.
   All scoring stays objective. Nothing is sent anywhere.
   ============================================================ */

/* Compare typed input fairly: case, spacing, curly quotes and accents are
   forgiven, because the point is the word chosen, not the keyboard used. */
const norm = s => String(s)
  .toLowerCase().trim()
  .replace(/[‘’ʼ]/g, "'")
  .replace(/[“”]/g, '"')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/\s+/g, ' ')
  .replace(/[.,;:!?]+$/, '');

const accepts = (list, val) => list.some(a => norm(a) === norm(val));

/* ---------- 7. gap-type: type the missing word into a sentence ---------- */
R.typing = {
  mount(host, ex, onReady) {
    const parts = ex.sentence.split('{}');
    host.innerHTML = `
      <div class="gapline">
        ${esc(parts[0])}<input class="gapin" type="text" autocomplete="off" autocapitalize="off"
          spellcheck="false" size="${ex.size || 10}" aria-label="missing word">${esc(parts[1] || '')}
      </div>
      ${ex.hint ? `<p class="hint">${esc(ex.hint)}</p>` : ''}`;
    const inp = host.querySelector('.gapin');
    inp.oninput = () => onReady(inp.value.trim() ? [inp.value] : null);
    inp.onkeydown = e => { if (e.key === 'Enter') e.preventDefault(); };
    setTimeout(() => inp.focus(), 60);
  },
  reveal(host, ex, res) {
    const inp = host.querySelector('.gapin');
    const right = accepts(ex.accept, res.chosen[0]);
    inp.disabled = true;
    inp.classList.add(right ? 'ok' : 'no');
    host.insertAdjacentHTML('beforeend', `
      <div class="mis">
        ${right ? `<div class="r">✓ ${esc(res.chosen[0])}</div>`
                : `<div class="w">${esc(res.chosen[0])}</div>
                   <div class="r">${esc(ex.accept[0])}</div>`}
        <div class="y">${esc(ex.feedback)}</div>
      </div>`);
  }
};

/* ---------- 8. cloze: a whole short text with several gaps ---------- */
R.cloze = {
  mount(host, ex, onReady) {
    const parts = ex.text.split('{}');
    const answers = new Array(ex.gaps.length).fill('');
    let html = '<div class="clozebox">';
    parts.forEach((p, i) => {
      html += esc(p);
      if (i < ex.gaps.length) html +=
        `<input class="gapin" data-i="${i}" type="text" autocomplete="off" autocapitalize="off"
                spellcheck="false" size="${ex.gaps[i].size || 8}" aria-label="gap ${i + 1}">`;
    });
    html += '</div>';
    host.innerHTML = html + (ex.hint ? `<p class="hint">${esc(ex.hint)}</p>` : '');
    host.querySelectorAll('.gapin').forEach(inp => inp.oninput = () => {
      answers[+inp.dataset.i] = inp.value;
      onReady(answers.some(a => a.trim()) ? answers.slice() : null);
    });
    setTimeout(() => { const f = host.querySelector('.gapin'); if (f) f.focus(); }, 60);
  },
  reveal(host, ex, res) {
    host.querySelectorAll('.gapin').forEach(inp => {
      const i = +inp.dataset.i, right = accepts(ex.gaps[i].accept, res.chosen[i] || '');
      inp.disabled = true;
      inp.classList.add(right ? 'ok' : 'no');
      if (!right) inp.value = ex.gaps[i].accept[0];
    });
    host.insertAdjacentHTML('beforeend',
      `<div class="mis"><div class="y">${esc(ex.feedback)}</div></div>`);
  }
};

/* ---------- 9. writing: compose the real thing ----------
   Scored on checks that can be verified mechanically (a required structure is
   present, a known trap is absent, enough words). Style is left to the model
   answer and the learner's own read-back. */
R.writing = {
  mount(host, ex, onReady) {
    host.innerHTML = `
      ${ex.task ? `<div class="taskbox">
        <h4>${esc(ex.taskLabel || (ex.lang === 'french' ? 'Votre mission' : 'Your task'))}</h4>
        <p>${esc(ex.task)}</p>
        ${ex.include && ex.include.length ? `<ul class="musts">${ex.include
          .map(i => `<li>${esc(i)}</li>`).join('')}</ul>` : ''}
      </div>` : ''}
      <textarea class="writein" rows="9" spellcheck="true"
        placeholder="${esc(ex.placeholder || (ex.lang === 'french' ? 'Écrivez votre réponse ici…' : 'Write your answer here…'))}"></textarea>
      <div class="wcount"><span data-w>0</span> ${ex.minWords
        ? '/ ' + ex.minWords + (ex.lang === 'french' ? ' mots minimum' : ' words minimum')
        : (ex.lang === 'french' ? 'mots' : 'words')}</div>`;
    const ta = host.querySelector('.writein');
    const count = t => (t.trim().match(/\S+/g) || []).length;
    ta.oninput = () => {
      const n = count(ta.value);
      const el = host.querySelector('[data-w]');
      el.textContent = n;
      el.className = (ex.minWords && n < ex.minWords) ? 'low' : 'okw';
      onReady(n > 0 ? [ta.value] : null);
    };
    setTimeout(() => ta.focus(), 60);
  },
  reveal(host, ex, res) {
    const text = res.chosen[0] || '';
    const results = OK.runChecks(ex, text);
    host.querySelector('.writein').disabled = true;
    host.insertAdjacentHTML('beforeend', `
      <div class="checkres">
        <h4>${esc(res.lang === 'french' ? 'Ce qui a été vérifié' : 'What was checked')}</h4>
        ${results.map(r => `
          <div class="ck ${r.pass ? 'ok' : 'no'}">
            <i>${r.pass ? '✓' : '✕'}</i><span>${esc(r.label)}</span>
          </div>`).join('')}
      </div>
      ${ex.selfCheck && ex.selfCheck.length ? `
        <div class="chk">
          <p class="qtext" style="margin:18px 0 4px">${esc(res.lang === 'french' ? 'À vérifier vous-même' : 'Read it back and check yourself')}</p>
          ${ex.selfCheck.map(c => `<label><input type="checkbox" disabled><span>${esc(c)}</span></label>`).join('')}
        </div>` : ''}
      <div class="model"><h4>${esc(res.lang === 'french' ? 'Réponse modèle' : 'Model answer')}</h4>
        <p>${esc(ex.model)}</p></div>`);
    host.querySelectorAll('.chk input').forEach(c => c.disabled = false);
  }
};

/* ---------- 10. listening: real material, then report back ---------- */
R.listening = {
  mount(host, ex, onReady) {
    host.innerHTML = `
      <div class="taskbox">
        <h4>${esc(ex.taskLabel || (ex.lang === 'french' ? 'Écoutez ou regardez' : 'Listen or watch'))}</h4>
        <p>${esc(ex.task)}</p>
        <div class="reslinks">${ex.resources.map(r => `
          <a class="reslink" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">
            <span>${esc(r.label)}</span><i>↗</i>
          </a>`).join('')}</div>
        <p class="hint">${esc(ex.note || (ex.lang === 'french'
          ? 'Ces liens s\'ouvrent dans un nouvel onglet. Revenez quand vous avez terminé.'
          : 'These open in a new tab. Come back when you are done.'))}</p>
      </div>
      <div class="taskbox" style="margin-top:14px">
        <h4>${esc(ex.thenLabel || (ex.lang === 'french' ? 'Puis rédigez' : 'Then write'))}</h4>
        <p>${esc(ex.then)}</p>
        ${ex.include && ex.include.length ? `<ul class="musts">${ex.include
          .map(i => `<li>${esc(i)}</li>`).join('')}</ul>` : ''}
      </div>
      <textarea class="writein" rows="7" spellcheck="true"
        placeholder="${esc(ex.placeholder || (ex.lang === 'french' ? 'Écrivez votre réponse ici…' : 'Write your answer here…'))}"></textarea>
      <div class="wcount"><span data-w>0</span> ${ex.minWords
        ? '/ ' + ex.minWords + (ex.lang === 'french' ? ' mots minimum' : ' words minimum')
        : (ex.lang === 'french' ? 'mots' : 'words')}</div>`;
    const ta = host.querySelector('.writein');
    ta.oninput = () => {
      const n = (ta.value.trim().match(/\S+/g) || []).length;
      const el = host.querySelector('[data-w]');
      el.textContent = n;
      el.className = (ex.minWords && n < ex.minWords) ? 'low' : 'okw';
      onReady(n > 0 ? [ta.value] : null);
    };
  },
  reveal(host, ex, res) { R.writing.reveal(host, ex, res); }
};

/* ---------- shared: a workplace document (email, report, memo, minutes…) ---------- */
const DOC_ICON = { email: '✉️', report: '📄', memo: '📌', minutes: '🗒️', advert: '📰', chat: '💬', itinerary: '🧳' };
const docBody = text => String(text || '').split(/\n{2,}/)
  .map(p => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
const docHTML = (doc, body) => `
  <div class="doc doc-${esc(doc.kind || 'report')}">
    <div class="doc-head">
      <span class="doc-ic" aria-hidden="true">${DOC_ICON[doc.kind] || '📄'}</span>
      <div>
        ${doc.title ? `<b>${esc(doc.title)}</b>` : ''}
        ${(doc.meta || []).map(m => `<small>${esc(m)}</small>`).join('')}
      </div>
    </div>
    <div class="doc-body">${body}</div>
  </div>`;

/* ---------- 11. reading: a real document, then several questions ---------- */
R.reading = {
  mount(host, ex, onReady) {
    const answers = new Array(ex.questions.length).fill(null);
    const orders = ex.questions.map(q => OK.shuffle(q.options.map((o, i) => i)));
    host.dataset.orders = JSON.stringify(orders);
    host.innerHTML = docHTML(ex.doc, docBody(ex.doc.text)) + ex.questions.map((q, qi) => `
      <div class="rq" data-q="${qi}">
        <p class="rq-q"><span>${qi + 1}</span>${esc(q.q)}</p>
        <div class="opts">${orders[qi].map((oi, n) => `
          <button class="opt" data-i="${oi}">
            <span class="opt-k">${KEY(n)}</span>
            <span class="opt-t">${esc(q.options[oi].text)}</span>
          </button>`).join('')}</div>
      </div>`).join('');
    host.querySelectorAll('.rq').forEach(box => box.querySelectorAll('.opt').forEach(b => b.onclick = () => {
      box.querySelectorAll('.opt').forEach(x => x.classList.remove('sel'));
      b.classList.add('sel');
      answers[+box.dataset.q] = +b.dataset.i;
      onReady(answers.every(a => a !== null) ? answers.slice() : null);
    }));
  },
  reveal(host, ex, res) {
    const orders = JSON.parse(host.dataset.orders);
    host.querySelectorAll('.rq').forEach(box => {
      const qi = +box.dataset.q, q = ex.questions[qi], took = res.chosen[qi];
      box.querySelectorAll('.opt').forEach(b => {
        const i = +b.dataset.i, o = q.options[i];
        b.disabled = true;
        b.classList.remove('sel');
        if (o.correct) b.classList.add('ok'); else if (i === took) b.classList.add('no');
        const fb = (i === took || o.correct) && o.feedback ? `<span class="opt-fb">${esc(o.feedback)}</span>` : '';
        b.innerHTML = `<span class="opt-k">${o.correct ? '✓' : (i === took ? '✕' : KEY(orders[qi].indexOf(i)))}</span>
          <span class="opt-t">${esc(o.text)}${fb}</span>`;
      });
    });
  }
};

/* ---------- 12. gapselect: an email with a choice in every gap ---------- */
R.gapselect = {
  mount(host, ex, onReady) {
    const answers = new Array(ex.gaps.length).fill(null);
    const parts = ex.text.split('{}');
    let body = '';
    parts.forEach((p, i) => {
      body += esc(p);
      if (i < ex.gaps.length) {
        const g = ex.gaps[i];
        body += `<select class="gapsel" data-i="${i}" aria-label="gap ${i + 1}">` +
          `<option value="" selected disabled>${i + 1} ▾</option>` +
          OK.shuffle(g.options.map((o, oi) => oi))
            .map(oi => `<option value="${oi}">${esc(g.options[oi])}</option>`).join('') +
          `</select>`;
      }
    });
    const doc = ex.doc || { kind: 'email' };
    const paras = body.split(/\n{2,}/).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
    host.innerHTML = docHTML(doc, `<div class="gaptext">${paras}</div>`);
    host.querySelectorAll('.gapsel').forEach(s => s.onchange = () => {
      answers[+s.dataset.i] = +s.value;
      onReady(answers.every(a => a !== null) ? answers.slice() : null);
    });
  },
  reveal(host, ex, res) {
    host.querySelectorAll('.gapsel').forEach(s => {
      const i = +s.dataset.i, g = ex.gaps[i], right = res.chosen[i] === g.answer;
      const span = document.createElement('span');
      span.className = 'gapdone ' + (right ? 'ok' : 'no');
      span.innerHTML = right ? esc(g.options[g.answer])
        : `<s>${esc(g.options[res.chosen[i]])}</s> ${esc(g.options[g.answer])}`;
      s.replaceWith(span);
    });
    host.insertAdjacentHTML('beforeend', `<div class="mis">${ex.gaps.map((g, i) => `
      <div class="y gapfb"><b>${i + 1}. ${esc(g.options[g.answer])}</b> ${esc(g.feedback || '')}</div>`).join('')}</div>`);
  }
};
