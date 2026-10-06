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
  for (const [width, height] of [[1552, 880], [1030, 610], [680, 490], [390, 240], [320, 80], [40, 20], [4800, 2000], [10000, 6000]]) {
    for (const [canvasWidth, canvasHeight] of formats) {
      const zoom = getFitZoom(width, height, canvasWidth, canvasHeight);
      assert.ok(zoom > 0);
      assert.ok(canvasWidth * zoom < width);
      assert.ok(canvasHeight * zoom < height);
      if (Math.min(width, height) >= 64) {
        assert.equal(zoom, Math.min((width - 32) / canvasWidth, (height - 32) / canvasHeight));
        // The limiting axis must use all available space except the small margin.
        assert.ok(Math.abs(canvasWidth * zoom - (width - 32)) < 1e-8 || Math.abs(canvasHeight * zoom - (height - 32)) < 1e-8);
      }
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
  const zoom = getFitZoom(1108, 1108, 1080, 1080);
  assert.ok(zoom < 1 && zoom > 0.99);
  assert.ok(getFitZoom(320, 80, 1080, 1920) < 0.1);
});

test("reference image's 63% is document scale; maximum Fit leaves only 16px vertically", () => {
  const stageWidth = 1337;
  const stageHeight = 734;
  const oldZoom = stageHeight * 0.92 / 1080;
  assert.equal(Math.round(oldZoom * 100), 63);
  const zoom = getFitZoom(stageWidth, stageHeight, 1080, 1080);
  assert.equal(zoom * 1080, 702);
  assert.equal((stageHeight - zoom * 1080) / 2, 16);
  assert.equal(zoom, getFitZoom(stageWidth + 500, stageHeight, 1080, 1080));
});

test("desktop/laptop Fit responds to actual dock widths and visible filmstrip height", () => {
  for (const [width, height] of [[1920, 1080], [1366, 768]]) {
    // Representative occupied sizes; production uses ResizeObserver, not these constants.
    for (const dock of [0, 304, 420, 520]) {
      for (const filmstrip of [44, 112]) {
        const stageWidth = width - 64 - dock;
        const stageHeight = height - 56 - 49 - filmstrip;
        for (const [canvasWidth, canvasHeight] of formats) {
          const zoom = getFitZoom(stageWidth, stageHeight, canvasWidth, canvasHeight);
          assert.equal(zoom, Math.min((stageWidth - 32) / canvasWidth, (stageHeight - 32) / canvasHeight));
        }
      }
    }
  }
});

test("unmeasured initial state stays fitted; subsequent measurements replace early Fit", () => {
  state = undefined;
  const viewport = useViewport();
  viewport.fitToContainer(0, 0, 1080, 1080);
  assert.equal(state.isFitted, true);
  viewport.fitToContainer(700, 500, 1080, 1080);
  viewport.fitToContainer(1552, 880, 1080, 1080);
  assert.equal(state.zoom, getFitZoom(1552, 880, 1080, 1080));
  assert.equal(state.isFitted, true);
});

test("Fit has no percentage cap; manual zoom preserves its direction above 400%", () => {
  state = undefined;
  const viewport = useViewport();
  viewport.fitToContainer(10000, 6000, 1080, 1080);
  const zoom = state.zoom;
  assert.ok(zoom > 4);
  viewport.zoomIn();
  assert.equal(state.zoom, zoom);
  viewport.zoomOut();
  assert.equal(state.zoom, zoom - 0.25);
  viewport.zoomAround(-0.25, 5000, 3000, 10000, 6000);
  assert.equal(state.zoom, zoom - 0.5);
  viewport.zoomAround(0.25, 5000, 3000, 10000, 6000);
  assert.equal(state.zoom, zoom - 0.5);
});

test("manual controls leave Fit; Fit restores centering; 100% has a stable basis", () => {
  state = undefined;
  const viewport = useViewport();
  assert.equal(state.isFitted, true);
  viewport.fitToContainer(1552, 800, 1080, 1080);
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
