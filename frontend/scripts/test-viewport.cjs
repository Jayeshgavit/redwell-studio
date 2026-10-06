// Exercise the actual viewport module in memory using installed TypeScript.
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const { test } = require("node:test");
const ts = require("typescript");
let state;
const react = {
  useState(initial) {
    state ??= initial;
    return [state, (update) => { state = typeof update === "function" ? update(state) : update; }];
  },
  useCallback(callback) { return callback; },
};
const filename = path.join(__dirname, "../components/create/use-viewport.ts");
const output = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const moduleUnderTest = { exports: {} };
vm.runInThisContext(`(function(require,module,exports){${output}\n})`, { filename })(
  (id) => id === "react" ? react : require(id), moduleUnderTest, moduleUnderTest.exports
);
const { getFitZoom, useViewport } = moduleUnderTest.exports;
const formats = [[1080, 1080], [1080, 1350], [1080, 1920], [1920, 1080]];

test("all formats fit measured desktop, laptop, mobile and short stages", () => {
  // Stage dimensions exclude chrome; test both width and height constraints.
  for (const [width, height] of [[1552, 880], [1030, 610], [680, 490], [390, 240], [320, 80], [40, 20], [4800, 2000]]) {
    for (const [canvasWidth, canvasHeight] of formats) {
      const zoom = getFitZoom(width, height, canvasWidth, canvasHeight);
      assert.ok(zoom > 0);
      assert.ok(canvasWidth * zoom < width);
      assert.ok(canvasHeight * zoom < height);
      const occupancy = Math.max(canvasWidth * zoom / width, canvasHeight * zoom / height);
      if (Math.min(width, height) >= 400) assert.ok(Math.abs(occupancy - 0.92) < 1e-10);
    }
  }
});

test("dock and filmstrip space is recovered when the limiting dimension grows", () => {
  assert.ok(getFitZoom(1552, 880, 1920, 1080) > getFitZoom(1100, 880, 1920, 1080));
  assert.ok(getFitZoom(1552, 880, 1080, 1920) > getFitZoom(1552, 760, 1080, 1920));
  // A portrait slide remains height-constrained when only the dock closes.
  assert.equal(getFitZoom(1552, 880, 1080, 1920), getFitZoom(1856, 880, 1080, 1920));
});

test("Fit rejects unmeasured stages and never rounds upward near 100%", () => {
  for (const bad of [0, -1, NaN, Infinity]) assert.equal(getFitZoom(bad, 800, 1080, 1080), null);
  const zoom = getFitZoom(1170, 1170, 1080, 1080);
  assert.ok(zoom < 1 && zoom > 0.99);
  assert.ok(getFitZoom(320, 80, 1080, 1920) < 0.1);
});

test("manual controls leave Fit; Fit restores centering; 100% has a stable basis", () => {
  state = undefined;
  const viewport = useViewport();
  assert.equal(state.isFitted, true);
  viewport.fitToContainer(1552, 840, 1080, 1080);
  const fittedZoom = state.zoom;
  viewport.zoomIn();
  assert.equal(state.isFitted, false);
  assert.equal(state.zoom, fittedZoom + 0.25);
  viewport.setPan(80, -30);
  viewport.fitToContainer(1030, 610, 1080, 1080);
  assert.deepEqual(state, { zoom: getFitZoom(1030, 610, 1080, 1080), panX: 0, panY: 0, isFitted: true });
  viewport.resetZoom();
  assert.deepEqual(state, { zoom: 1, panX: 0, panY: 0, isFitted: false });
  viewport.pan(20, 10);
  viewport.zoomAround(0.25, 650, 320, 1000, 600);
  assert.deepEqual(state, { zoom: 1.25, panX: -12.5, panY: 7.5, isFitted: false });
});

test("zooming out from a tiny Fit never jumps upward to the manual minimum", () => {
  state = undefined;
  const viewport = useViewport();
  viewport.fitToContainer(320, 80, 1080, 1920);
  const tinyZoom = state.zoom;
  viewport.zoomAround(-0.25, 160, 40, 320, 80);
  assert.equal(state.zoom, tinyZoom);
  viewport.zoomOut();
  assert.equal(state.zoom, tinyZoom);
});
