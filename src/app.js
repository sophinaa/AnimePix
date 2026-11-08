// Mockup wiring: fake Source Control panel + fake commit data.
// Everything in this file is placeholder for what the backend will provide.

(function () {
  const { SPRITES, draw } = window.AnimePixSprites;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const RISK_THRESHOLD = 60;

  const SCENARIOS = {
    small: {
      message: "fix button hover color",
      files: [
        { path: "src/components/Button.tsx", s: "M", add: 6, del: 2 },
        { path: "src/styles/button.css", s: "M", add: 3, del: 1 },
      ],
      more: null,
      flags: [],
      diffFile: "src/styles/button.css",
      diff: [
        ["@@", "@@ -18,7 +18,9 @@ .btn-primary {"],
        [" ", "  background: var(--brand);"],
        [" ", "  border-radius: 8px;"],
        ["-", "  transition: all 0.2s;"],
        ["+", "  transition: background 0.15s ease;"],
        ["+", "}"],
        ["+", ".btn-primary:hover {"],
        ["+", "  background: var(--brand-dark);"],
        [" ", "}"],
      ],
    },
    huge: {
      message: "",
      files: [
        { path: "src/auth/middleware.ts", s: "M", add: 205, del: 96 },
        { path: "src/auth/session.ts", s: "M", add: 412, del: 388 },
        { path: ".env.production", s: "M", add: 4, del: 2 },
        { path: "db/migrations/0042_drop_legacy_users.sql", s: "A", add: 61, del: 0 },
        { path: "src/api/payments/webhook.ts", s: "M", add: 318, del: 274 },
        { path: "package.json", s: "M", add: 14, del: 3 },
        { path: "src/lib/utils.ts", s: "M", add: 640, del: 12 },
        { path: "src/components/Dashboard.tsx", s: "M", add: 529, del: 301 },
        { path: "tests/auth.test.ts", s: "D", add: 0, del: 128 },
      ],
      more: { files: 38, add: 937, del: 210 },
      flags: ["touches auth/", "edits .env.production", "drops a DB table", "deletes a test file", "+6 dependencies"],
      diffFile: "src/auth/middleware.ts",
      diff: [
        ["@@", "@@ -12,14 +12,19 @@ export async function requireAuth(req, res, next) {"],
        [" ", '  const token = req.headers.authorization?.split(" ")[1];'],
        ["-", '  if (!token) return res.status(401).json({ error: "unauthorized" });'],
        ["-", "  const session = await verifySession(token);"],
        ["+", "  // TODO: re-enable after demo"],
        ["+", '  // if (!token) return res.status(401).json({ error: "unauthorized" });'],
        ["+", '  const session = token ? await verifySession(token) : { user: { role: "admin" } };'],
        [" ", "  if (!session) {"],
        [" ", '    return res.status(401).json({ error: "invalid session" });'],
        [" ", "  }"],
        ["+", "  req.user = session.user;"],
        ["+", '  console.log("session", session, process.env.JWT_SECRET);'],
        [" ", "  next();"],
        [" ", "}"],
      ],
    },
  };

  let current = "huge";
  let committed = false;

  const totals = (sc) => {
    const t = sc.files.reduce((a, f) => ({ files: a.files + 1, add: a.add + f.add, del: a.del + f.del }), { files: 0, add: 0, del: 0 });
    if (sc.more) { t.files += sc.more.files; t.add += sc.more.add; t.del += sc.more.del; }
    return t;
  };

  // Placeholder scoring — the real one lives in the backend.
  const mockRisk = (sc) => {
    const t = totals(sc);
    const r = Math.min(40, (t.add + t.del) / 100) + Math.min(15, t.files / 2) + sc.flags.length * 9;
    return Math.min(99, Math.round(r));
  };

  function renderScenario() {
    const sc = SCENARIOS[current];
    const t = totals(sc);
    document.querySelectorAll(".seg button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.sc === current));
    $("#msg").value = sc.message;
    $("#count").textContent = committed ? "0" : t.files;
    $("#activity-badge").textContent = committed ? "" : t.files;
    $("#activity-badge").hidden = committed;

    const list = $("#files");
    if (committed) {
      list.innerHTML = `<li class="empty">No changes. <button type="button" class="link" id="reset">Reset demo</button></li>`;
      $("#reset").addEventListener("click", () => { committed = false; renderScenario(); });
    } else {
      list.innerHTML = sc.files.map((f) => {
        const parts = f.path.split("/");
        const name = parts.pop();
        return `<li title="${esc(f.path)}">
          <span class="fname">${esc(name)}</span>
          <span class="fdir">${esc(parts.join("/"))}</span>
          <span class="fstat"><em class="a">+${f.add}</em><em class="d">−${f.del}</em></span>
          <span class="fs fs-${f.s}">${f.s}</span>
        </li>`;
      }).join("") + (sc.more ? `<li class="more">…and ${sc.more.files} more files</li>` : "");
    }

    $("#tab-name").textContent = sc.diffFile.split("/").pop();
    $("#crumbs").textContent = sc.diffFile.split("/").join("  ›  ");
    let ln = 12;
    $("#diff").innerHTML = sc.diff.map(([k, code]) => {
      const cls = k === "+" ? "add" : k === "-" ? "del" : k === "@@" ? "hunk" : "";
      const num = k === "@@" ? "" : ln++;
      return `<div class="dl ${cls}"><span class="ln">${num}</span><span class="sg">${k === "@@" ? "" : k}</span><code>${esc(code)}</code></div>`;
    }).join("");

    $("#sum").innerHTML = committed ? "" :
      `<em class="a">+${t.add.toLocaleString()}</em> <em class="d">−${t.del.toLocaleString()}</em> · risk ${mockRisk(sc)}`;
  }

  function toast(html, kind = "ok") {
    const t = document.createElement("div");
    t.className = `toast toast-${kind}`;
    t.setAttribute("role", "status");
    t.innerHTML = html;
    $("#toasts").appendChild(t);
    setTimeout(() => t.classList.add("out"), 3200);
    setTimeout(() => t.remove(), 3600);
  }

  function doCommit(note, forced) {
    const t = totals(SCENARIOS[current]);
    committed = true;
    renderScenario();
    const extra = note ? `<small>“${esc(note)}”</small>` : forced ? `<small>Committed without review.</small>` : "";
    toast(`<b>✓ Committed ${t.files} file${t.files > 1 ? "s" : ""} to main</b>${extra}`, forced ? "warn" : "ok");
  }

  async function onCommit() {
    if (committed) return;
    const sc = SCENARIOS[current];
    const risk = mockRisk(sc);
    if (risk < RISK_THRESHOLD) return doCommit($("#msg").value.trim());
    const t = totals(sc);
    $("#commit").disabled = true;
    const res = await buddy.show({ files: t.files, additions: t.add, deletions: t.del, risk, flags: sc.flags });
    $("#commit").disabled = false;
    if (res.action === "commit") doCommit(res.note);
    else if (res.action === "force") doCommit("", true);
    else toast(`<b>Commit paused</b><small>${esc(buddy.name)} is keeping your changes staged.</small>`, "info");
  }

  // ---- buddy picker ----
  let saved = "mochi";
  try { saved = localStorage.getItem("animepix.buddy") || "mochi"; } catch (_) {}
  if (!SPRITES[saved]) saved = "mochi";

  const buddy = new window.AnimePixBuddy($("#editor"));

  const picker = $("#picker");
  picker.innerHTML = Object.entries(SPRITES).map(([k, s]) =>
    `<button type="button" class="pick" data-k="${k}" aria-pressed="false">
       <canvas aria-hidden="true"></canvas><span><b>${s.name}</b><small>${s.blurb}</small></span>
     </button>`).join("");
  picker.querySelectorAll(".pick").forEach((b) => {
    draw(b.querySelector("canvas"), b.dataset.k, "neutral", 2);
    b.addEventListener("click", () => selectBuddy(b.dataset.k));
  });

  function selectBuddy(k) {
    buddy.setCharacter(k);
    picker.querySelectorAll(".pick").forEach((b) => b.setAttribute("aria-pressed", b.dataset.k === k));
    $("#status-buddy").textContent = `AnimePix: ${SPRITES[k].name} is watching`;
    try { localStorage.setItem("animepix.buddy", k); } catch (_) {}
  }
  selectBuddy(saved);

  // ---- events ----
  document.querySelectorAll(".seg button").forEach((b) =>
    b.addEventListener("click", () => { current = b.dataset.sc; committed = false; renderScenario(); }));
  $("#commit").addEventListener("click", onCommit);
  $("#msg").addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onCommit(); });
  $("#preview").addEventListener("click", () => {
    const sc = SCENARIOS.huge, t = totals(sc);
    buddy.show({ files: t.files, additions: t.add, deletions: t.del, risk: mockRisk(sc), flags: sc.flags });
  });

  renderScenario();
})();
