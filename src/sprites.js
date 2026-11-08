// Character atlas: display regions from the supplied sheets without changing the artwork.
(function () {
  const SERIES = {
    jjk: { name: "Jujutsu Kaisen", src: "assets/characters/jujutsu-kaisen.jpeg" },
    aot: { name: "Attack on Titan", src: "assets/characters/attack-on-titan.jpeg" },
    naruto: { name: "Naruto", src: "assets/characters/naruto.jpeg" },
  };
  const SPRITES = {};
  function add(key, name, series, crop, variant = "") {
    SPRITES[key] = { name, series, crop, variant, blurb: variant || SERIES[series].name };
  }

  add("gojo", "Gojo", "jjk", [90, 38, 255, 280]);
  add("yuta", "Yuta", "jjk", [375, 30, 235, 290]);
  add("megumi", "Megumi", "jjk", [80, 330, 265, 280]);
  add("nobara", "Nobara", "jjk", [375, 335, 240, 275]);
  add("yuji", "Yuji", "jjk", [80, 610, 265, 280]);
  add("toge", "Toge", "jjk", [370, 615, 245, 280]);

  const titanNames = ["Eren", "Mikasa", "Armin"];
  const titanKeys = ["eren", "mikasa", "armin"];
  const titanLooks = ["Cadet", "Season 4", "Scout"];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      add(`${titanKeys[col]}-${row + 1}`, titanNames[col], "aot",
        [35 + col * 240, 8 + row * 238, 180, 216], titanLooks[row]);
    }
  }

  add("naruto", "Naruto", "naruto", [88, 48, 265, 275]);
  add("sakura", "Sakura", "naruto", [355, 68, 245, 255]);
  add("sasuke", "Sasuke", "naruto", [88, 330, 250, 270]);
  add("kakashi", "Kakashi", "naruto", [355, 335, 250, 270]);
  add("obito", "Obito", "naruto", [88, 605, 250, 265]);
  add("itachi", "Itachi", "naruto", [350, 610, 235, 265]);

  const DEFAULT_CHARACTER = "gojo";
  const images = new Map();
  const requests = new WeakMap();
  function load(series) {
    if (!images.has(series)) {
      const image = new Image();
      const ready = new Promise((resolve, reject) => {
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error(`Unable to load ${SERIES[series].name} artwork`));
      });
      image.src = SERIES[series].src;
      images.set(series, ready);
    }
    return images.get(series);
  }

  // Keep the existing renderer contract for the popup. Mood is conveyed through
  // its animation and dialogue; the supplied character art stays intact.
  function draw(canvas, key, mood = "neutral", scale = 5) {
    const sprite = SPRITES[key] || SPRITES[DEFAULT_CHARACTER];
    const request = {};
    requests.set(canvas, request);
    canvas.width = canvas.height = 32 * scale;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    canvas.dataset.loaded = "false";
    return load(sprite.series).then((image) => {
      if (requests.get(canvas) !== request) return;
      const [x, y, width, height] = sprite.crop;
      const fit = (canvas.height - 12) / Math.max(width, height);
      const dw = width * fit, dh = height * fit;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(image, x, y, width, height,
        (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh);
      canvas.dataset.loaded = "true";
    }).catch(() => {
      if (requests.get(canvas) !== request) return;
      canvas.dataset.loaded = "error";
      ctx.fillStyle = "#1a1420";
      ctx.font = `${Math.max(10, scale * 3)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(sprite.name, canvas.width / 2, canvas.height / 2);
    });
  }

  window.AnimePixSprites = { SPRITES, SERIES, DEFAULT_CHARACTER, draw };
})();
