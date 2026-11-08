// AnimePix buddy sprites — original chibi pixel characters.
//
// Legend:
//   H hair   h hair shade   S skin   B blush   K mouth/line   M open mouth
//   E eye (dark top)   e eye (iris)   w eye highlight   G glasses frame
//   A accent (clip / collar)   C clothes   c clothes shade   L legs
// The black outline ("O") is generated automatically around the silhouette.

(function () {
  const BASE = {
    O: "#1a1420", K: "#1a1420", M: "#d9576f", E: "#24182b", w: "#ffffff",
    S: "#ffe6d6", B: "#ffa3b5", L: "#23263a",
  };

  const SPRITES = {
    mochi: {
      name: "Mochi",
      blurb: "Worrier. Reads every diff.",
      palette: { H: "#f4a7b9", h: "#e5869f", e: "#c0587a", A: "#e5484d", C: "#3b3f5c", c: "#2c2f45" },
      rows: [
        "........HHHHHH........",
        "......HHHHHHHHHH......",
        ".....HHHHhhHHHHHH.....",
        "....HHHhhHHHHHHHHH....",
        "...HHHHHHHHHHHHHhHH...",
        "...HHHHHHHHHHHHHHAA...",
        "..HHHHHHHHHHHHHHHHAH..",
        "..HHHHHHHHHHHHHHHHHH..",
        "..HHHHSHHHSSHHHSHHHH..",
        "..HHHSSSSSSSSSSSSHHH..",
        "..HHSSEESSSSSSEESSHH..",
        "..HHSSEwSSSSSSEwSSHH..",
        "..HHSBeeSSSSSSeeBSHH..",
        "..HHHSSSSSKKSSSSSHHH..",
        "...HHHSSSSSSSSSSHHH...",
        ".....HHCCCAACCCHH.....",
        ".....CCCCCAACCCCC.....",
        "....SCCCCCAACCCCCS....",
        ".....cCCCCCCCCCCc.....",
        "......CCCCCCCCCC......",
        ".......LLL..LLL.......",
        ".......LLL..LLL.......",
      ],
    },
    ren: {
      name: "Ren",
      blurb: "Strict. Has opinions about tests.",
      palette: { H: "#2b3352", h: "#40507f", e: "#6aa8ff", G: "#3a2f4a", A: "#cfd6ee", C: "#5b6b8c", c: "#46546f" },
      rows: [
        "......H.....H.........",
        "......HH...HH...H.....",
        ".....HHHHHHHHHHHH.....",
        "....HHHHHHHHHHHHHH....",
        "..HHHHHHHHHhHHHHHHHH..",
        "...HHHHhHHHHHHHHHHHH..",
        ".HHHHHHHHHHHHHHHHHHHH.",
        "..HHHHHHHHHHHHHHHHHHH.",
        "..HHHHHHHHHHHHHHHHHH..",
        "..HHHHSHHSSSHHHSSHHH..",
        "..HHSSSSSSSSSSSSSSHH..",
        "..HHSGGGGGGGGGGGGSHH..",
        "..HHSGEwGSSSSGEwGSHH..",
        "..HHSGeeGSSSSGeeGSHH..",
        "..HHSGGGGSSSSGGGGSHH..",
        "...HHHBSSSKKSSSBHHH...",
        ".....HHCCCAACCCHH.....",
        ".....CCCCCAACCCCC.....",
        "....SCCCCCAACCCCCS....",
        ".....cCCCCCCCCCCc.....",
        "......CCCCCCCCCC......",
        ".......LLL..LLL.......",
        ".......LLL..LLL.......",
      ],
    },
    sunny: {
      name: "Sunny",
      blurb: "Cheerful. Still won't let you push to main.",
      palette: { H: "#f6cf5b", h: "#e0ac34", e: "#3f9e7a", A: "#ff7a59", C: "#eef0f7", c: "#c9cde0" },
      rows: [
        "..........HH..........",
        "...........H..........",
        "......HHHHHHHHHH......",
        ".....HHHHHHHHHHHH.....",
        "....HHhHHHHHHHHHHH....",
        "...HHHHhHHHHHHHHHAH...",
        "...HHHHHHHHHHHHHAAA...",
        "..HHHHHHHHHHHHHHHHAH..",
        "..HHHHHHHHHHHHHHHHHH..",
        "..HHHSHHHHSSHHHHSHHH..",
        "..HHSSSSSSSSSSSSSSHH..",
        "..HHSSEESSSSSSEESSHH..",
        "..HHSSEwSSSSSSEwSSHH..",
        "..HHSBeeSSSSSSeeBSHH..",
        "..HHSSSSSSKKSSSSSSHH..",
        "....HHSSSSSSSSSSHH....",
        "......CCCCAACCCC......",
        ".....CCCCCAACCCCC.....",
        "....SCCCCCAACCCCCS....",
        ".....cCCCCCCCCCCc.....",
        "......CCCCCCCCCC......",
        ".......LLL..LLL.......",
        ".......LLL..LLL.......",
      ],
    },
  };

  // Pad by one pixel and wrap the silhouette in an outline.
  function buildGrid(rows) {
    const w = rows[0].length + 2;
    const blank = ".".repeat(w);
    const g = [blank, ...rows.map((r) => "." + r + "."), blank].map((r) => r.split(""));
    const filled = (y, x) => g[y] && g[y][x] && g[y][x] !== "." && g[y][x] !== "O";
    const out = g.map((r) => r.slice());
    for (let y = 0; y < g.length; y++)
      for (let x = 0; x < w; x++)
        if (g[y][x] === "." && (filled(y - 1, x) || filled(y + 1, x) || filled(y, x - 1) || filled(y, x + 1)))
          out[y][x] = "O";
    return out;
  }
  Object.values(SPRITES).forEach((s) => (s.grid = buildGrid(s.rows)));

  // Moods: neutral | blink | happy | shock | pout
  function moodPixel(ch, mood) {
    const closed = mood === "blink" || mood === "happy";
    if (closed) {
      if (ch === "E" || ch === "w") return "S";
      if (ch === "e") return "E";
    }
    if (mood === "pout" && (ch === "w" || ch === "e")) return "E";
    if ((mood === "happy" || mood === "shock") && ch === "K") return "M";
    return ch;
  }

  function draw(canvas, key, mood = "neutral", scale = 5) {
    const s = SPRITES[key];
    const pal = { ...BASE, ...s.palette };
    const grid = s.grid;
    canvas.width = grid[0].length * scale;
    canvas.height = grid.length * scale;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < grid.length; y++)
      for (let x = 0; x < grid[y].length; x++) {
        const ch = moodPixel(grid[y][x], mood);
        if (ch === ".") continue;
        ctx.fillStyle = pal[ch] || "#ff00ff";
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
  }

  window.AnimePixSprites = { SPRITES, draw };
})();
