//setTimeout(() => window.location.reload(), 2000);

const sketchesEl = document.getElementById("sketches");
const customSketchesEl = document.getElementById("customSketches");
const canvasEl = document.getElementById("canvas");
const codeEl = document.getElementById("code");
const nameEl = document.getElementById("name");
const errorTextEl = document.getElementById("errorText");

const sketches = [
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
];

for (let i = 0; i < sketches.length; i++) {
  const li = document.createElement("li");
  const sketch = sketches[i];
  li.innerText = sketch.name;
  li.onclick = () => loadSketch(i);
  sketchesEl.appendChild(li);
}

let currentSketchIndex = null;
let currentSketch = null;
let fn = () => false;

function save() {
  if (currentSketchIndex != null) {
    // TODO: save
  }
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
return (x, y) => {
${code}
}
`
    )(w);
  } catch (e) {
    console.error(e);
    errorTextEl.innerText = e.message;
  }
}

function draw() {
  if (!currentSketch) {
    return;
  }
  errorTextEl.innerText = "";
  const { size, zeroAtCenter } = currentSketch;
  const offset = zeroAtCenter ? -Math.floor(size / 2) : 0;

  const ctx = canvasEl.getContext("2d");
  const imageData = ctx.createImageData(size, size);

  outerloop: for (let Y = 0; Y < size; Y++) {
    const y = size - Y - 1 + offset;
    for (let X = 0; X < size; X++) {
      const x = X + offset;
      const pos = Y * (size * 4) + X * 4;
      imageData.data[pos + 3] = 255;
      try {
        const val = fn(x, y);
        imageData.data[pos + 0] = val ? 0 : 255;
        imageData.data[pos + 1] = val ? 0 : 255;
        imageData.data[pos + 2] = val ? 0 : 255;
      } catch (e) {
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
}

function loadSketch(sketchId) {
  save();
  currentSketch = sketches[sketchId];
  if (currentSketch) {
    currentSketchIndex = sketchId;
    canvasEl.width = currentSketch.size;
    canvasEl.height = currentSketch.size;
    nameEl.innerText = currentSketch.name;
    codeEl.value = currentSketch.code;
    codeEl.disabled = false;
    parseCode();
  } else {
    currentSketchIndex = null;
    nameEl.innerHTML = "&mdash;";
    codeEl.value = "";
    codeEl.disabled = true;
    fn = () => false;
  }
  draw();
}

loadSketch(0);

codeEl.addEventListener("change", () => {
  parseCode();
  draw();
});
codeEl.addEventListener("keyup", () => {
  parseCode();
  draw();
});