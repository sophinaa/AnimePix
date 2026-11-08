// AnimePix buddy — the pop-up UI. Front end only.
//
// Backend contract (to wire up later):
//   const result = await buddy.show({
//     files: 47, additions: 3120, deletions: 1414,
//     risk: 92,                       // 0–100, computed by the backend
//     flags: ["touches auth/", ...],  // human-readable reasons
//   });
//   result = { action: "commit", note } | { action: "review" } | { action: "force" }

(function () {
  const { SPRITES, DEFAULT_CHARACTER, draw } = window.AnimePixSprites;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const el = (html) => {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  class Buddy {
    constructor(host) {
      this.character = DEFAULT_CHARACTER;
      this.mood = "neutral";
      this.root = el(`
        <div class="buddy" data-state="hidden" role="dialog" aria-modal="false" aria-labelledby="buddy-title">
          <div class="bubble">
            <div class="bubble-head">
              <span class="bubble-title" id="buddy-title"></span>
              <button class="bubble-x" type="button" aria-label="Close and review first">×</button>
            </div>
            <p class="bubble-text" aria-live="polite"></p>
            <div class="bubble-body"></div>
          </div>
          <div class="buddy-figure">
            <span class="buddy-alert" aria-hidden="true">!</span>
            <canvas class="buddy-sprite" aria-hidden="true"></canvas>
            <span class="buddy-name"></span>
          </div>
        </div>`);
      host.appendChild(this.root);
      this.canvas = this.root.querySelector(".buddy-sprite");
      this.titleEl = this.root.querySelector(".bubble-title");
      this.textEl = this.root.querySelector(".bubble-text");
      this.bodyEl = this.root.querySelector(".bubble-body");
      this.root.querySelector(".bubble-x").addEventListener("click", () => this._decide("review"));
      this.root.addEventListener("keydown", (e) => e.key === "Escape" && this._decide("review"));
      this.render();
    }

    get name() { return SPRITES[this.character].name; }

    setCharacter(key) { this.character = Object.hasOwn(SPRITES, key) ? key : DEFAULT_CHARACTER; this.render(); }

    setMood(m) { this.mood = m; this.root.dataset.mood = m; this.render(); }

    render() {
      draw(this.canvas, this.character, this.mood, 5);
      this.root.querySelector(".buddy-name").textContent = this.name;
    }

    async _type(text) {
      const token = (this._typeToken = {});
      if (reduceMotion) { this.textEl.textContent = text; return; }
      this.textEl.textContent = "";
      for (const ch of text) {
        if (this._typeToken !== token) return;
        this.textEl.textContent += ch;
        await sleep(ch === "." || ch === "?" || ch === "!" ? 120 : 16);
      }
    }

    show(info) {
      if (this._resolve) this._resolve({ action: "review" });
      return new Promise((resolve) => {
        this._resolve = resolve;
        this.info = info;
        this.root.dataset.state = "open";
        this.setMood("shock");
        this.titleEl.textContent = "HOLD UP!";
        this.bodyEl.innerHTML = this._askHTML(info);
        this.bodyEl.querySelectorAll("[data-act]").forEach((b) =>
          b.addEventListener("click", () => this._decide(b.dataset.act)));
        const ta = this.bodyEl.querySelector("textarea");
        ta.addEventListener("keydown", (e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) this._decide("explain");
        });
        const n = (x) => x.toLocaleString();
        setTimeout(async () => {
          const s = SPRITES[this.character];
          await this._type(s.ask ? s.ask(info) :
            `${info.files} files, +${n(info.additions)} / −${n(info.deletions)} lines… ` +
            `that's a lot! What are you committing?`
          );
          if (this.mood === "shock") this.setMood("neutral");
          ta.focus({ preventScroll: true });
        }, reduceMotion ? 0 : 420);
      });
    }

    _askHTML(info) {
      const level = info.risk >= 85 ? "high" : info.risk >= 60 ? "mid" : "low";
      return `
        <div class="risk" data-level="${level}">
          <span class="risk-label">RISK</span>
          <div class="risk-bar" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${info.risk}" aria-label="Risk score">
            <i style="--w:${info.risk}%"></i>
          </div>
          <b class="risk-num">${info.risk}</b>
        </div>
        <ul class="flags">${info.flags.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
        <label class="sr-only" for="buddy-note">Describe this commit</label>
        <textarea id="buddy-note" rows="2" placeholder="In one sentence: what does this change do?"></textarea>
        <div class="actions">
          <button type="button" class="px-btn primary" data-act="explain">Explain &amp; commit</button>
          <button type="button" class="px-btn" data-act="review">Let me review</button>
        </div>
        <button type="button" class="skip" data-act="skip">I know what I'm doing →</button>`;
    }

    async _decide(act) {
      if (!this._resolve || this._busy) return;
      if (act === "explain") {
        const ta = this.bodyEl.querySelector("textarea");
        const note = ta.value.trim();
        if (note.length < 8) {
          this.setMood("pout");
          ta.classList.remove("shake"); void ta.offsetWidth; ta.classList.add("shake");
          await this._type("Hmm… a little more than that? Future-you will thank you.");
          ta.focus();
          return;
        }
        return this._finish("Got it!", "Committing with your note. Good luck~ ✿", "happy", { action: "commit", note });
      }
      if (act === "skip")
        return this._finish("…okay.", SPRITES[this.character].skip || "Don't say I didn't warn you. Hmph.", "pout", { action: "force" });
      return this._finish("Good call!", "Take your time. I'll be right here.", "happy", { action: "review" });
    }

    async _finish(title, text, mood, result) {
      this._busy = true;
      this.setMood(mood);
      this.titleEl.textContent = title;
      this.bodyEl.innerHTML = "";
      await this._type(text);
      await sleep(reduceMotion ? 600 : 1300);
      this.root.dataset.state = "hidden";
      const resolve = this._resolve;
      this._resolve = null;
      this._busy = false;
      setTimeout(() => this.setMood("neutral"), 500);
      resolve(result);
    }
  }

  window.AnimePixBuddy = Buddy;
})();
