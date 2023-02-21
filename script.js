//setTimeout(() => window.location.reload(), 2000);

const sketchesEl = document.getElementById("sketches");
const builtinSketchesEl = document.getElementById("builtinSketches");
const customSketchesEl = document.getElementById("customSketches");
const canvasEl = document.getElementById("canvas");
const codeEl = document.getElementById("code");
const nameEl = document.getElementById("name");
const errorTextEl = document.getElementById("errorText");
const sliderEl = document.getElementById("slider");
const sliderValueEl = document.getElementById("sliderValue");
const zeroAtCenterEl = document.getElementById("zeroAtCenter");
const animateEl = document.getElementById("animate");
const builtinLis = [];
const userLis = [];

const BUILTIN_SKETCHES = [
  {
    name: "Line",
    code: `\
return x === y;
`,
    size: 256,
  },
  {
    name: "Circle",
    code: `\
const r = w;
return abs(x ** 2 + y ** 2 - r ** 2) < r;
`,
    size: 257,
    zeroAtCenter: true,
  },
  {
    name: "Gallifrey",
    code: `\
function circle(r, a, b, s = 1) {
  return abs((x - a) ** 2 + (y - b) ** 2 - r ** 2) < r * s;
}
function inCircle(r, a, b) {
  return ((x - a) ** 2 + (y - b) ** 2 - r ** 2) < 0;
}
const b = w - 4;
return !inCircle(0.19 * b, 0.56 * b, 0.56 * b, 3) && (circle(0.6 * b, 0, 0, 2) || circle(0.78 * b, 0, 0, 2) || circle(b, 0, 0, 6) || circle(0.19 * b, 0.56 * b, 0.56 * b, 8));
return abs(x ** 2 + y ** 2 - r ** 2) < r;
`,
    size: 257,
    zeroAtCenter: true,
  },
  {
    name: "Trippy sci-fi",
    code: `\
return t % (x) > 1 && (t * y) % (x) > 70;
`,
    size: 512,
    zeroAtCenter: true,
    animate: true,
  },
];

let sketches;
try {
  sketches = JSON.parse(localStorage.getItem("sketches"));
} catch (e) {
  console.error(e);
}
if (!sketches || sketches.length === 0) {
  sketches = [];
}

for (let i = 0; i < BUILTIN_SKETCHES.length; i++) {
  const sketch = BUILTIN_SKETCHES[i];
  const li = document.createElement("li");
  li.innerText = sketch.name + " (BUILTIN)";
  li.onclick = () => loadSketch(i, true);
  builtinSketchesEl.appendChild(li);
  builtinLis.push(li);
}

for (let i = 0; i < sketches.length; i++) {
  const sketch = sketches[i];
  const li = document.createElement("li");
  li.innerText = sketch.name;
  li.onclick = () => loadSketch(i);
  sketchesEl.appendChild(li);
  userLis.push(li);
}

let currentSketchIndex = null;
let currentSketchBuiltin = null;
let currentSketch = null;
let fn = () => false;

function save() {
  if (currentSketchBuiltin) {
    return;
  }
  if (currentSketch) {
    currentSketch.code = codeEl.value;
  }
  localStorage.setItem("sketches", JSON.stringify(sketches));
}

function parseCode() {
  const code = codeEl.value;
  errorTextEl.innerText = "";
  try {
    const { size, zeroAtCenter } = currentSketch;
    const w = zeroAtCenter ? Math.floor(size / 2) : size;
    fn = new Function(
      "w",
      `\
${Object.getOwnPropertyNames(Math)
  .map((k) => `const ${k} = Math.${k};`)
  .join("\n")}
return (x, y, t) => {
${code}
}
`
    )(w);
  } catch (e) {
    console.error(e);
    errorTextEl.innerText = e.message;
  }
}

let t = 0;
let nextFrame = null;
const ctx = canvasEl.getContext("2d");
function draw() {
  if (!currentSketch) {
    return;
  }
  errorTextEl.innerText = "";
  const { size, zeroAtCenter } = currentSketch;
  const offset = zeroAtCenter ? -Math.floor(size / 2) : 0;
  let hasErrors = false;

  outerloop: for (let Y = 0; Y < size; Y++) {
    const y = size - Y - 1 + offset;
    for (let X = 0; X < size; X++) {
      const x = X + offset;
      const pos = Y * (size * 4) + X * 4;
      imageData.data[pos + 3] = 255;
      try {
        const val = fn(x, y, t);
        const p =
          val === true
            ? 0
            : val === false
            ? 255
            : Math.min(255, Math.max(0, Math.floor(val)));
        imageData.data[pos + 0] = p;
        imageData.data[pos + 1] = p;
        imageData.data[pos + 2] = p;
      } catch (e) {
        hasErrors = true;
        imageData.data[pos + 0] = 255;
        imageData.data[pos + 1] = 0;
        imageData.data[pos + 2] = 0;
        console.error(e);
        errorTextEl.innerText = e.message;
        break outerloop;
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);
  if (currentSketch.animate && !hasErrors) {
    const size4 = size * 4;
    cancelAnimationFrame(nextFrame);
    const fastDraw = () => {
      nextFrame = requestAnimationFrame(fastDraw);
      t++;
      outerloop: for (let Y = 0; Y < size; Y++) {
        const y = size - Y - 1 + offset;
        for (let X = 0; X < size; X++) {
          const x = X + offset;
          const pos = Y * size4 + X * 4;
          //imageData.data[pos + 3] = 255;
          const val = fn(x, y, t);
          const p =
            val === true
              ? 0
              : val === false
              ? 255
              : Math.min(255, Math.max(0, Math.floor(val)));
          imageData.data[pos + 0] = p;
          imageData.data[pos + 1] = p;
          imageData.data[pos + 2] = p;
        }
      }
      ctx.putImageData(imageData, 0, 0);
    };
    nextFrame = requestAnimationFrame(fastDraw);
  }
}

let imageData;
function loadSketch(sketchId, builtin) {
  save();
  if (currentSketchIndex >= 0) {
    const lis = currentSketchBuiltin ? builtinLis : userLis;
    const currentLi = lis[currentSketchIndex];
    if (currentLi) {
      currentLi.className = "";
    }
  }
  currentSketch = (builtin ? BUILTIN_SKETCHES : sketches)[sketchId];
  if (currentSketch) {
    const lis = builtin ? builtinLis : userLis;
    currentSketchIndex = sketchId;
    currentSketchBuiltin = builtin;
    lis[currentSketchIndex].className = "active";
    nameEl.disabled = builtin;
    codeEl.value = currentSketch.code;
    codeEl.disabled = builtin;
    sliderEl.disabled = false;
    sliderEl.value = currentSketch.size;
    zeroAtCenterEl.checked = currentSketch.zeroAtCenter;
    animateEl.checked = currentSketch.animate;
    refresh();
    parseCode();
  } else {
    currentSketchIndex = null;
    currentSketchBuiltin = false;
    nameEl.value = "-";
    nameEl.disabled = true;
    codeEl.value = "";
    codeEl.disabled = true;
    fn = () => false;
  }
  draw();
}

loadSketch(0);

let saveTimer;
const debouncedSave = () => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    save();
  }, 1000);
};

function codeChange(e) {
  if (currentSketchBuiltin) {
    e.preventDefault();
    return false;
  }
  parseCode();
  draw();
  debouncedSave();
}
codeEl.addEventListener("change", codeChange);
codeEl.addEventListener("keyup", codeChange);

document.getElementById("new").addEventListener("click", () => {
  const newSketch = { ...currentSketch };
  newSketch.name = newSketch.name + " (copy)";
  const index = sketches.push(newSketch) - 1;
  const li = document.createElement("li");
  li.innerText = newSketch.name;
  li.onclick = () => loadSketch(index);
  sketchesEl.appendChild(li);
  lis.push(li);
  loadSketch(index);
});

function refresh() {
  cancelAnimationFrame(nextFrame);
  const lis = currentSketchBuiltin ? builtinLis : userLis;
  if (!currentSketchBuiltin) {
    lis[currentSketchIndex].innerText = currentSketch.name;
  }
  sliderValueEl.innerText = currentSketch.size;
  canvasEl.width = currentSketch.size;
  canvasEl.height = currentSketch.size;
  nameEl.value = currentSketch.name;
  imageData = ctx.createImageData(currentSketch.size, currentSketch.size);
  t = 0;
  parseCode();
  draw();
}

function nameChange(e) {
  if (currentSketchBuiltin) {
    e.preventDefault();
    return;
  }
  const newName = nameEl.value;
  if (newName && currentSketch) {
    currentSketch.name = newName;
    refresh();
    debouncedSave();
  }
}
nameEl.addEventListener("change", nameChange);
nameEl.addEventListener("keyup", nameChange);

function sliderChange() {
  const value = Math.floor(sliderEl.value / 2) * 2;
  if (value && currentSketch) {
    currentSketch.size = currentSketch.zeroAtCenter ? value + 1 : value;
    refresh();
    debouncedSave();
  }
}
sliderEl.addEventListener("change", sliderChange);
sliderEl.addEventListener("input", sliderChange);

function zeroChange() {
  const value = zeroAtCenterEl.checked;
  if (currentSketch) {
    currentSketch.zeroAtCenter = value;
    currentSketch.size =
      Math.floor(currentSketch.size / 2) * 2 + (value ? 1 : 0);
    refresh();
    debouncedSave();
  }
}
zeroAtCenterEl.addEventListener("change", zeroChange);
zeroAtCenterEl.addEventListener("click", zeroChange);

function animateChange() {
  const value = animateEl.checked;
  cancelAnimationFrame(nextFrame);
  t = 0;
  if (currentSketch) {
    currentSketch.animate = value;
    refresh();
    debouncedSave();
  }
}
animateEl.addEventListener("change", animateChange);
animateEl.addEventListener("click", animateChange);
