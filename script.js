//setTimeout(() => window.location.reload(), 2000);

const sketchesEl = document.getElementById("sketches");
const customSketchesEl = document.getElementById("customSketches");
const canvasEl = document.getElementById("canvas");
const codeEl = document.getElementById("code");
const nameEl = document.getElementById("name");
const errorTextEl = document.getElementById("errorText");
const sliderEl = document.getElementById("slider");
const sliderValueEl = document.getElementById("sliderValue");
const zeroAtCenterEl = document.getElementById("zeroAtCenter");
const lis = [];

let sketches;
try {
  sketches = JSON.parse(localStorage.getItem("sketches"));
} catch (e) {
  console.error(e);
}
if (!sketches || sketches.length === 0) {
  sketches = [
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
}

for (let i = 0; i < sketches.length; i++) {
  const sketch = sketches[i];
  const li = document.createElement("li");
  li.innerText = sketch.name;
  li.onclick = () => loadSketch(i);
  sketchesEl.appendChild(li);
  lis.push(li);
}

let currentSketchIndex = null;
let currentSketch = null;
let fn = () => false;

function save() {
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
  if (currentSketchIndex >= 0) {
    const currentLi = lis[currentSketchIndex];
    if (currentLi) {
      currentLi.className = "";
    }
  }
  currentSketch = sketches[sketchId];
  if (currentSketch) {
    currentSketchIndex = sketchId;
    lis[currentSketchIndex].className = "active";
    nameEl.disabled = false;
    codeEl.value = currentSketch.code;
    codeEl.disabled = false;
    sliderEl.disabled = false;
    sliderEl.value = currentSketch.value;
    zeroAtCenterEl.checked = currentSketch.zeroAtCenter;
    refresh();
    parseCode();
  } else {
    currentSketchIndex = null;
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

function codeChange() {
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
  lis[currentSketchIndex].innerText = currentSketch.name;
  sliderValueEl.innerText = currentSketch.size;
  canvasEl.width = currentSketch.size;
  canvasEl.height = currentSketch.size;
  nameEl.value = currentSketch.name;
  parseCode();
  draw();
}

function nameChange() {
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
