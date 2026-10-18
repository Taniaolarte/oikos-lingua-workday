# Oikos Lingua · Workday

A professional English and French practice app for working adults. The learner
opens it, chooses what they want to practise today, and gets two short
challenges drawn from real workplace situations.

**Stack:** plain HTML, CSS and JavaScript reading local JSON. No backend, no
database, no accounts, no AI services, no build step. Deployable to GitHub Pages
as-is.

---

## The learning model

Every challenge opens by asking how the learner wants to work. Both routes use
the same material, and only the order changes:

```
Try it first     TRY → LEARN → TRY AGAIN → COMPLETE → PRODUCE → PROGRESS
Learn it first   LEARN → TRY → TRY AGAIN → COMPLETE → PRODUCE → RESULT
```

The five working stages ramp from recognising to producing, which is what makes
a challenge about twelve to twenty minutes rather than two:

| Stage | What the learner does |
|---|---|
| **Try / Try again** | Two workplace tasks on the same skill: read a report and answer questions, complete an email with the right connectors or words, write a short email, fix or order a text, or handle a situation |
| **Learn** | The one-to-three minute guide for that skill |
| **Complete** | Three drills: pick the missing word, then type it, then fill a whole short text |
| **Produce** | Write the actual email, record themselves speaking, or listen to real material and report back |

Three rules hold throughout, and all are enforced in code:

1. **Nothing is revealed after the first situation** — not the explanation, not
   even a score. The learner answers, the answer is locked in, and they move on.
2. **The second situation is never a repeat.** Same skill, different context, so
   answering from memory is impossible.
3. **All scoring happens once, at the end**, where the before/after comparison
   and the stage breakdown can be read together. Scoring a single question in
   isolation told the learner very little and interrupted the flow.

### How production is scored without AI

Typed gaps are compared against a list of accepted answers, forgiving case,
spacing, curly quotes and missing accents, because the point is the word chosen
rather than the keyboard used.

Longer written work is scored only on what a machine can genuinely verify: a
required structure is present, a known trap is absent, the word count is met.
The learner sees exactly which checks passed, then a model answer and a
read-it-back checklist for the things no checker should pretend to judge.

Speaking is self-assessed against a checklist, with a model answer. Audio never
leaves the page.

Listening sends the learner to real material — RFI, TV5MONDE, BBC Learning
English, TED — and then asks them to write about it, which is the part that gets
checked. Those links are optional and external; the app itself needs nothing
but the files in this repository.

## Hold for Spanish

A button in the bottom corner glosses the instructions in Spanish for as long as
it is held, and reverts the moment it is released. Holding rather than toggling
is the point: it is there to unblock a learner who does not understand the task,
not to let them read the whole app in Spanish.

It only ever touches instructions and interface text. The language being
practised is never translated: the email under study, the answer options and
the model answers all stay in English or French, so nothing is given away.

The one exception is the **guides**. A learner reading a guide is meeting its
words for the first time, so holding the button on any guide, at any level,
shows the whole guide in Spanish: explanation, tip and the reason behind the
common mistake in Spanish, and every expression, vocabulary item and example
kept in the original with its Spanish meaning beside it. These full versions
live in `content/english/guides-es.json` and `content/french/guides-es.json`,
keyed by guide id, and cover every guide in both languages. Reading documents,
email gaps and answer options are never translated: they are the test.

The dictionary in `content/spanish.json` covers **2,254 strings** — the whole
interface plus every prompt, instruction, hint, task and scenario brief in both
content banks. It is a flat `source string → Spanish` lookup, decoupled from the
render code: `js/spanish.js` walks a narrow list of selectors on press, swaps
what it finds, and restores the exact original HTML on release. Adding content
does not require touching it, and an untranslated string simply stays as it is.

## No required progression

There is no Day 1 / Day 2, no streak, no locked content, nothing to catch up on.
Clearing your cache, switching device or coming back in six months costs you
nothing. `localStorage` holds only your first name, language and last chosen
context, purely so the app can say "Welcome back" — and the app works correctly
when that read fails (private mode, blocked storage).

## Every job has a colour

Each professional context in `content/professional-contexts.json` carries a
`color`. Choosing a job on the staff card repaints the card (header band,
lanyard, barcode, selected buttons) in that colour, and from then on the same
colour marks the header strip, a job tag beside the navigation, the home
challenge cards and the top edge of every challenge and result panel, so the
learner can always see which job they are doing. The colour is a single CSS
custom property, `--job`, set by `APP.applyJob`; its lighter tints are derived
in CSS with `color-mix`.

---

## Running it

The content lives in local JSON files loaded with `fetch`, so the page must be
served over HTTP rather than opened from disk:

```bash
cd oikos-lingua-workday
python3 -m http.server 8000
# open http://localhost:8000
```

### Deploying to GitHub Pages

Push the repository and enable Pages (Settings → Pages → deploy from branch,
root folder). Nothing else is required — all paths are relative and `.nojekyll`
is already present so the `content/` folder is served untouched.

---

## What's in the content bank

| Piece | Count |
|---|---|
| Scenario templates | 80 across 12 workplace categories |
| Learning topics | 90 English + 92 French |
| Learning guides | 42 English + 43 French, each at one level (A2 / B1 / B2), all with a full Spanish version |
| Interaction types | 19, covered by 12 renderers |
| Activities (two situations each) | 100 English (37 A2 · 32 B1 · 31 B2) + 95 French (31 A2 · 33 B1 · 31 B2) |
| Drills | 123 English + 129 French, with 333 typed gaps |
| Production tasks | 41 English + 43 French |
| Professional contexts | 12, each with its own colour |

That comes to **726 authored exercises**, every one with its own answer set and
feedback. Drills and productions are keyed to the *guide* rather than to a
single activity, so every activity that teaches a skill inherits the same ramp.

### One challenge, one level

Every guide carries a `level`, and an activity always sits at its guide's
level. The situations, the guide, its drills and its production task are
therefore pitched together: an A2 challenge uses short sentences, everyday
workplace words and a 25–50 word email or a 45-second spoken turn; a B2
challenge turns on nuance and asks for 70–120 words. The guide library opens
at the learner's own level and can be filtered by level.

### Where the content comes from

The pedagogical material is taken from the source documents, not invented:

- **English** — *B1 English Vocabulary, Expressions and Topics* (vocabulary,
  linking expressions, oral expressions, grammar areas, strong verbs and
  adjectives) and the *IELTS Academic Guide* (section structure, timings, band
  scoring, True/False/Not Given, the long turn, Task 1 and Task 2).
- **French** — *Guide de travail, compétences orales A2/B1* (themes, production
  and comprehension activities, assessment criteria), *Futur proche et futur
  simple* (formation, irregular stems, the proche/simple distinction),
  *Futur proche exercices* (negation, interrogation, guided production) and
  *Guide de lecture B2 — les articles partitifs* (du/de la/de l'/des, negation,
  quantity expressions, the pre-posed plural adjective).
- **Writing & Literature** (both languages) — *100 Essential Literary Terms*,
  *A Guide to Literature* (genres, subgenres, style, structure, the analysis
  method) and the *Literary Devices* guide (figurative, sound and structural
  devices, the Device + Evidence + Effect formula, and its readings of
  Dickinson's "We talked as Girls do" and Whitman's "A Noiseless Patient
  Spider"). The English activities use those two poems and Shakespeare's
  Sonnet 18; the French ones use public-domain French texts (La Fontaine,
  Verlaine, Hugo and others) and the French terminology (comparaison, litote,
  alexandrin, enjambement…).

French is written as French, not translated from English: the grammar points,
common mistakes and examples are the ones that matter to a French learner.
Where the source material used everyday examples, they have been moved into
professional contexts — *"je vais préparer la présentation"* rather than
*"je vais regarder un film"*.

---

## Architecture

```
index.html                  screen shells only; all views render from JS
css/style.css               design tokens + components
img/                        web-sized logo marks and favicons, made from content/Logos
js/avatars.js               staff-badge photo options
js/spanish.js               press-and-hold Spanish gloss
js/engine.js                content loading, workday generation, scoring
js/render.js                the twelve exercise renderers
js/app.js                   screens, navigation, session state
content/
  scenarios.json            80 scenarios + 12 categories
  professional-contexts.json
  interaction-types.json    19 types, each naming its renderer
  spanish.json              2,254-entry Spanish gloss of the instructions
  english/  topics.json  guides.json  activities.json  drills.json  productions.json
            guides-es.json  full Spanish version of every guide
  french/   (same files)
```

### The generation engine

`OK.generateWorkday({ language, context, level })` builds a workday in two
stages:

1. **Pool by level** — only activities at the requested level (Easy = A2,
   Core = B1, Challenge = B2). Neighbouring levels are never mixed in; each
   level carries at least fifteen activities per language so the pool never
   runs dry.
2. **Weight** — activities tagged with the learner's professional context are
   four times as likely (`CONTEXT_W` 4). A context can set its own `weight`:
   Writing & Literature uses 20, because its bank is small next to the general
   workplace material and its learners expect mostly literature.

A context marked `"specialist": true` keeps its activities to itself: a poem
analysis only reaches learners whose chosen job it is tagged for (Writing &
Literature, and Education), never a sales manager.

The second challenge is then drawn from a pool filtered to a *different*
category, scenario and topic, and to a different **kind of task**
(`OK.family`): judging a situation, reading, working on an email, speaking, or
grammar and vocabulary work. A workday therefore never pairs two "which reply
is best?" questions; it mixes, say, a report to read with an email to complete.
It falls back gracefully when the content can't satisfy every filter.

Measured over 3,000 generated workdays per language and level: the requested
level is served **100%** of the time, always with a guide of the same level;
**0%** of workdays repeat a category, scenario, topic or kind of task. Across
challenges, reading and email tasks make up 33–42% and situation judgements
19–29%.

### Interaction types and renderers

Nineteen interaction types map onto twelve renderers, so adding a type usually costs
nothing in code:

| Renderer | Used for |
|---|---|
| `choice` | best-response, multiple-choice, fill-blank, register-check, appropriateness, error-correction, stronger-sentence, true-false, branching |
| `multi` | multiple-select |
| `order` | sentence-order, email-order |
| `categorise` | categorise |
| `matching` | matching |
| `speaking` | speaking, and every `speak` production |
| `typing` | single typed gap |
| `cloze` | a short text with several typed gaps |
| `writing` | open written production, auto-checked; also write-email situations |
| `listening` | external material plus a written response |
| `reading` | read-report: a report, memo, minutes, advert or email, then several questions |
| `gapselect` | email-connectors, email-gaps: an email with a choice in every gap |

Speaking uses the browser's own `MediaRecorder`. Audio never leaves the page: it
is held in an object URL, can be deleted by the learner, and is released on
navigation. If there's no microphone or permission is refused, the exercise
still completes via the self-assessment checklist.

---

## Adding content

Adding an activity requires no code change. Append an object to
`content/english/activities.json` (or the French one) referencing existing ids:

```json
{
  "id": "en-late-project-02",
  "level": "B1",
  "contexts": ["marketing", "technology"],
  "category": "inbox",
  "scenario": "late-project",
  "topic": "professional-requests",
  "guide": "professional-requests",
  "interaction": "best-response",
  "before": {
    "brief": "Your manager writes:",
    "message": "Could you send me an update before 3 p.m.?",
    "prompt": "Which reply is most appropriate?",
    "options": [
      { "text": "Of course. I'll send it by 3 p.m.", "score": 100, "feedback": "Clear and professional." }
    ]
  },
  "after": { "...": "a different situation, same skill" }
}
```

The same scenario can appear many times with a different topic, interaction type
or language — that reuse is what produces variety without authoring every
combination by hand.

## Room to grow

The MVP is deliberately static, but nothing in the structure blocks the obvious
next steps. Content is already addressed by stable ids, session results are
computed in one place (`APP.results`), and the engine takes a plain request
object — so accounts, a teacher dashboard, assignments, stored progress or
adaptive selection could be added later without rewriting the content bank.
