//setTimeout(() => window.location.reload(), 2000);

const sketchesEl = document.getElementById("sketches");
const customSketchesEl = document.getElementById("customSketches");
const canvasEl = document.getElementById("canvas");
const codeEl = document.getElementById("code");
const nameEl = document.getElementById("name");

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
return x ** 2 + y ** 2 = w;
`,
    size: 256,
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

function save() {
  if (currentSketchIndex != null) {
    // TODO: save
  }
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
  } else {
    currentSketchIndex = null;
    nameEl.innerHTML = "&mdash;";
    codeEl.value = "";
    codeEl.disabled = true;
  }
}

loadSketch(0);
