// Dependency-free regression checks using the repository's installed TypeScript and React.
// Modules are transpiled in memory; no application files or build output are generated.
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const { test } = require("node:test");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const root = path.resolve(__dirname, "..");
const modules = new Map();

function load(filename) {
  filename = path.resolve(filename);
  if (modules.has(filename)) return modules.get(filename).exports;
  const module = { exports: {} };
  modules.set(filename, module);
  let source = fs.readFileSync(filename, "utf8");
  if (filename.endsWith("photo-context.tsx")) source += "\nexport { historyReducer, initialHistoryState };";
  if (filename.endsWith("export-service.ts")) source += "\nexport { drawStoryText };";
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const localRequire = (id) => {
    if (!id.startsWith(".") && !id.startsWith("@/")) return require(id);
    const base = id.startsWith("@/") ? path.join(root, id.slice(2)) : path.resolve(path.dirname(filename), id);
    const resolved = [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.tsx")].find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
    if (!resolved) throw new Error(`Cannot resolve ${id} from ${filename}`);
    return load(resolved);
  };
  vm.runInThisContext(`(function(require,module,exports){${output}\n})`, { filename })(localRequire, module, module.exports);
  return module.exports;
}

const editor = load(path.join(root, "components/create/photo-context.tsx"));
const definitions = load(path.join(root, "components/create/carousel-story-templates.ts"));
const { resolveCreativeLayout, CAROUSEL_COMPOSITION_LAYOUTS } = load(path.join(root, "components/create/carousel-composition.ts"));
const { CAROUSEL_THEMES, themeCarouselSlide } = load(path.join(root, "components/create/carousel-themes.ts"));
const { COLLAGE_LAYOUTS } = load(path.join(root, "types/editor.ts"));
const reduce = editor.historyReducer;
const command = (history, type, values = {}) => reduce(history, { type, ...values });
const start = () => command(editor.initialHistoryState, "set-document-mode", { mode: "carousel" });
const story = () => command(start(), "apply-carousel-template", { templateId: "editorial-story" });
const photo = (id) => ({ id, src: `blob:${id}`, displayMode: "fill", positionX: 0.5, positionY: 0.5, zoom: 1, rotation: 0, flipX: false, flipY: false });
const newCompositionIds = new Set(["margin-cover", "feature-column", "number-note", "checklist", "step-note", "quiet-quote", "gallery-caption", "wide-screen", "portrait-label", "snapshot-note", "detail-pair", "end-card"]);

test("content library has unique IDs, valid discovery tags, counts, geometry, and references", () => {
  const { CANVAS_FORMATS } = load(path.join(root, "types/editor.ts"));
  const { CAROUSEL_SLIDE_PRESETS } = load(path.join(root, "components/create/carousel-slide-presets.ts"));
  const unique = (items) => assert.equal(new Set(items.map((item) => item.id)).size, items.length);
  const layouts = [...COLLAGE_LAYOUTS, ...CAROUSEL_COMPOSITION_LAYOUTS];
  [layouts, definitions.CAROUSEL_STORY_LAYOUTS, definitions.CAROUSEL_STORY_TEMPLATES, CAROUSEL_THEMES, CAROUSEL_SLIDE_PRESETS].forEach(unique);
  for (const layout of layouts) {
    assert.equal(layout.photoCount, layout.cells.length, layout.id);
    for (const category of layout.categories ?? []) assert.ok(["Featured", "Hero", "Grid", "Editorial", "Creative"].includes(category));
    for (const cell of layout.cells) {
      assert.ok([cell.x, cell.y, cell.width, cell.height].every(Number.isFinite), layout.id);
      assert.ok(cell.x >= 0 && cell.y >= 0 && cell.width > 0 && cell.height > 0, layout.id);
      assert.ok(cell.x + cell.width <= 1.000001 && cell.y + cell.height <= 1.000001, layout.id);
    }
  }
  for (const layout of definitions.CAROUSEL_STORY_LAYOUTS) {
    assert.ok(resolveCreativeLayout(layout.photoLayoutId), layout.id);
    assert.ok(CANVAS_FORMATS.some((format) => format.id === layout.formatId), layout.id);
    assert.ok(["Featured", "Editorial", "Photo Dump", "Scrapbook", "Cinematic", "Minimal", "Seamless", "Travel"].includes(layout.category));
  }
  for (const template of definitions.CAROUSEL_STORY_TEMPLATES) {
    unique(template.slides);
    assert.ok(!template.themeId || CAROUSEL_THEMES.some((theme) => theme.id === template.themeId));
    assert.ok(["Travel / Journey", "Photography", "Creator", "Story / Narrative", "List / Tips", "Minimal"].includes(template.category));
    for (const category of template.relatedCategories ?? []) assert.ok(["Travel / Journey", "Photography", "Creator", "Story / Narrative", "List / Tips", "Minimal"].includes(category));
    for (const preset of [...template.slides, template.overflowSlide]) assert.ok(definitions.getCarouselStoryLayout(preset.layoutId));
  }
  for (const preset of CAROUSEL_SLIDE_PRESETS) assert.ok(definitions.getCarouselStoryLayout(preset.definition.layoutId));
  console.log(`Library: ${COLLAGE_LAYOUTS.length} Collage layouts, ${definitions.CAROUSEL_STORY_LAYOUTS.length} Carousel compositions, ${definitions.CAROUSEL_STORY_TEMPLATES.length} stories, ${CAROUSEL_SLIDE_PRESETS.length} slide starters`);
});

test("new Collage layouts stay inside every format including rotated frames, with distinct geometry", () => {
  const { CANVAS_FORMATS } = load(path.join(root, "types/editor.ts"));
  const additions = COLLAGE_LAYOUTS.filter((layout) => layout.categories);
  const signature = (layout) => JSON.stringify(layout.cells);
  for (const layout of additions) {
    assert.equal(COLLAGE_LAYOUTS.filter((candidate) => signature(candidate) === signature(layout)).length, 1, layout.id);
    for (const format of CANVAS_FORMATS) for (const cell of layout.cells) {
      const angle = Math.abs(cell.rotation ?? 0) * Math.PI / 180;
      const halfWidth = (cell.width * Math.cos(angle) + cell.height / format.ratio * Math.sin(angle)) / 2;
      const halfHeight = (cell.height * Math.cos(angle) + cell.width * format.ratio * Math.sin(angle)) / 2;
      const cx = cell.x + cell.width / 2, cy = cell.y + cell.height / 2;
      assert.ok(cx - halfWidth >= 0 && cx + halfWidth <= 1 && cy - halfHeight >= 0 && cy + halfHeight <= 1, `${layout.id}/${format.id}`);
      assert.ok(Math.min(cell.width * format.width, cell.height * format.height) - 20 > 100, `${layout.id}/${format.id}: usable photo bounds`);
    }
  }
  assert.deepEqual([...new Set(additions.map((layout) => layout.photoCount))].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9, 12]);
});

test("new stories keep copy in reserved regions and render in every format without losing overflow photos", () => {
  const { CANVAS_FORMATS } = load(path.join(root, "types/editor.ts"));
  const { CarouselSlideArtwork } = load(path.join(root, "components/create/carousel-slide-artwork.tsx"));
  const { wrapCarouselText } = load(path.join(root, "components/create/carousel-text-layout.ts"));
  const ids = new Set(["one-clear-idea", "field-weekend", "working-notes", "collected-days", "small-shift", "change-study", "three-good-practices", "portrait-essay"]);
  for (const template of definitions.CAROUSEL_STORY_TEMPLATES.filter((item) => ids.has(item.id))) {
    let initial = command(start(), "commit", { update: (state) => ({ ...state, photos: Array.from({ length: 40 }, (_, index) => photo(`p-${index}`)) }) });
    const applied = command(initial, "apply-carousel-template", { templateId: template.id });
    assert.equal(applied.carousel.slides.flatMap((slide) => slide.photos).length, 40);
    assert.equal(applied.carousel.slides.at(-1).storySlideType, template.slides.at(-1).type);
    assert.deepEqual(command(applied, "undo").carousel, initial.carousel);
    const empty = command(start(), "apply-carousel-template", { templateId: template.id });
    for (const format of CANVAS_FORMATS) for (const slide of empty.carousel.slides) {
      const markup = renderToStaticMarkup(React.createElement(CarouselSlideArtwork, { slide: { ...slide, canvasFormatId: format.id }, maxWidth: 120, maxHeight: 150 }));
      assert.ok(!markup.includes("NaN"), `${template.id}/${format.id}`);
      if (!newCompositionIds.has(slide.storyLayoutId)) continue;
      const layout = definitions.getCarouselStoryLayout(slide.storyLayoutId);
      for (const item of slide.storyText) {
        assert.ok(layout.textPlacements.some((placement) => placement.role === item.role), `${template.id}: supported copy role`);
        assert.ok(item.x >= .06 && item.y >= .06 && item.x + item.width <= .940001 && item.y + item.height <= .940001);
        // Conservative copy-fit estimate; user-supplied long copy remains editable.
        const lines = wrapCarouselText((value) => Array.from(value).reduce((sum, char) => sum + item.fontSize * (char === " " ? .28 : .58) + item.letterSpacing, 0), item.text, item.width * format.width - 2 * (item.padding ?? 0));
        const height = lines.length * item.fontSize * item.lineHeight + 2 * (item.padding ?? 0);
        assert.ok(height <= item.height * format.height, `${template.id}/${slide.storyLayoutId}/${item.role}/${format.id}: copy fit ${height}`);
      }
    }
  }
});

test("new composition copy regions avoid photo frames and all slide starters create editable previews", () => {
  const { CANVAS_FORMATS } = load(path.join(root, "types/editor.ts"));
  const { CAROUSEL_SLIDE_PRESETS } = load(path.join(root, "components/create/carousel-slide-presets.ts"));
  const { CarouselSlideArtwork } = load(path.join(root, "components/create/carousel-slide-artwork.tsx"));
  const intersects = (a, b) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  for (const layout of definitions.CAROUSEL_STORY_LAYOUTS.filter((item) => newCompositionIds.has(item.id))) {
    assert.equal(new Set(layout.textPlacements.map((item) => item.role)).size, layout.textPlacements.length);
    for (const format of CANVAS_FORMATS) {
      const frames = resolveCreativeLayout(layout.photoLayoutId).cells.map((cell) => {
        const angle = Math.abs(cell.rotation ?? 0) * Math.PI / 180;
        const width = cell.width * Math.cos(angle) + cell.height / format.ratio * Math.sin(angle);
        const height = cell.height * Math.cos(angle) + cell.width * format.ratio * Math.sin(angle);
        return { x: cell.x + (cell.width - width) / 2, y: cell.y + (cell.height - height) / 2, width, height };
      });
      for (const item of layout.textPlacements) for (const frame of frames) assert.ok(!intersects(item, frame), `${layout.id}/${format.id}/${item.role}: copy reserved outside frames`);
    }
  }
  for (const preset of CAROUSEL_SLIDE_PRESETS) {
    const applied = command(start(), "add-carousel-slide", { presetId: preset.id });
    assert.equal(applied.present.storyLayoutId, preset.definition.layoutId);
    assert.ok(applied.present.storyText.every((item) => item.textBox));
    for (const format of CANVAS_FORMATS) {
      const slide = { ...applied.carousel.slides.find((item) => item.id === applied.carousel.activeSlideId), canvasFormatId: format.id };
      const markup = renderToStaticMarkup(React.createElement(CarouselSlideArtwork, { slide, maxWidth: 120, maxHeight: 150 }));
      assert.ok(!markup.includes("NaN"));
    }
  }
});

test("empty Carousel starts portrait; Collage catalog and timeline remain isolated", () => {
  const current = start();
  assert.equal(current.present.canvasFormatId, "portrait");
  assert.equal(current.present.selectedLayoutId, null);
  assert.deepEqual(current.collageTimeline, editor.initialHistoryState.collageTimeline);
  assert.strictEqual(current.collageTimeline.present, editor.initialHistoryState.collageTimeline.present);
  assert.ok(!COLLAGE_LAYOUTS.some((layout) => CAROUSEL_COMPOSITION_LAYOUTS.includes(layout)));
  assert.equal(command(current, "set-document-mode", { mode: "collage" }).present.canvasFormatId, "square");
});

test("all templates resolve layouts and create coherent, editable slides", () => {
  for (const template of definitions.CAROUSEL_STORY_TEMPLATES) {
    for (const definition of [...template.slides, template.overflowSlide]) {
      const layout = definitions.getCarouselStoryLayout(definition.layoutId);
      assert.ok(layout, `${template.id}: ${definition.layoutId}`);
      assert.ok(resolveCreativeLayout(layout.photoLayoutId));
    }
    const current = command(start(), "apply-carousel-template", { templateId: template.id });
    assert.equal(current.carousel.slides.length, template.slides.length);
    assert.ok(current.carousel.slides.every((slide) => slide.canvasFormatId === "portrait" && slide.storyText.length));
  }
});

test("add, duplicate, reorder, delete have reversible document history", () => {
  let current = story();
  const original = current.carousel;
  current = command(current, "add-carousel-slide", { presetId: "content" });
  const insertedId = current.carousel.activeSlideId;
  assert.equal(current.carousel.slides[1].id, insertedId);
  assert.equal(current.present.selectedLayoutId, "carousel-type");
  current = command(current, "duplicate-carousel-slide");
  const duplicateId = current.carousel.activeSlideId;
  assert.notEqual(duplicateId, insertedId);
  assert.notEqual(current.carousel.slides[1].storyText[0].id, current.present.storyText[0].id);
  current = command(current, "reorder-carousel-slide", { slideId: duplicateId, targetSlideId: original.slides[0].id, placement: "before" });
  assert.equal(current.carousel.slides[0].id, duplicateId);
  assert.equal(current.carousel.activeSlideId, duplicateId);
  current = command(current, "delete-carousel-slide");
  assert.ok(!current.carousel.slides.some((slide) => slide.id === duplicateId));
  for (let index = 0; index < 4; index++) current = command(current, "undo");
  assert.deepEqual(current.carousel, original);
  for (let index = 0; index < 4; index++) current = command(current, "redo");
  assert.equal(current.carousel.slides.length, original.slides.length + 1);
  assert.deepEqual(current.carousel.slides.map((slide) => slide.order), current.carousel.slides.map((_, index) => index));
  assert.strictEqual(command(start(), "delete-carousel-slide").carousel.slides.length, 1);
});

test("duplicated photos share image URLs with independent placement and layer IDs", () => {
  let current = command(start(), "commit", { update: (state) => ({ ...state, photos: [photo("original")], selectedLayoutId: "1-full", slotAssignments: { 0: "original" } }) });
  const sourceId = current.carousel.activeSlideId;
  current = command(current, "duplicate-carousel-slide");
  assert.notEqual(current.present.photos[0].id, "original");
  assert.equal(current.present.photos[0].src, "blob:original");
  assert.equal(current.present.slotAssignments[0], current.present.photos[0].id);
  current = command(current, "commit", { update: (state) => ({ ...state, photos: state.photos.map((item) => ({ ...item, zoom: 2 })) }) });
  assert.equal(current.carousel.slides.find((slide) => slide.id === sourceId).photos[0].zoom, 1);
});

test("themes preserve content, geometry, custom typography, custom style, and locked text", () => {
  const original = story().carousel.slides[0];
  const customized = { ...original, collageStyle: { ...original.collageStyle, spacing: 37 }, storyText: original.storyText.map((item, index) => index === 1 ? { ...item, color: "#ab12ef", fontFamily: "sans", x: 0.13 } : item) };
  const themed = themeCarouselSlide(customized, CAROUSEL_THEMES[2]);
  assert.equal(themed.collageStyle.spacing, 37);
  assert.equal(themed.storyText[1].color, "#ab12ef");
  assert.equal(themed.storyText[1].fontFamily, "sans");
  assert.equal(themed.storyText[1].x, 0.13);
  assert.equal(themed.storyText[1].text, original.storyText[1].text);
  assert.equal(themed.storyText[0].color, CAROUSEL_THEMES[2].inverse);
  const locked = { ...original.storyText[0], locked: true };
  assert.strictEqual(themeCarouselSlide({ ...original, storyText: [locked] }, CAROUSEL_THEMES[1]).storyText[0], locked);
});

test("theme and format changes apply across slides and undo with local slide history intact", () => {
  let current = story();
  current = command(current, "commit", { update: (state) => ({ ...state, storyText: state.storyText.map((item) => ({ ...item, text: "My own story" })) }) });
  const before = current.carousel;
  current = command(current, "apply-carousel-theme", { themeId: "field" });
  current = command(current, "set-carousel-format", { formatId: "square" });
  assert.ok(current.carousel.slides.every((slide) => slide.canvasFormatId === "square"));
  current = command(current, "undo");
  assert.ok(current.carousel.slides.every((slide) => slide.canvasFormatId === "portrait"));
  current = command(current, "undo");
  assert.deepEqual(current.carousel, before);
  current = command(current, "undo");
  assert.notEqual(current.present.storyText[0].text, "My own story");
});

test("template replacement retains all photos, even in a text-only structure", () => {
  let current = command(start(), "commit", { update: (state) => ({ ...state, photos: [photo("a"), photo("b"), photo("c")] }) });
  const before = current.carousel;
  current = command(current, "apply-carousel-template", { templateId: "announcement" });
  assert.equal(current.carousel.slides.length, 4);
  assert.equal(current.carousel.slides.flatMap((slide) => slide.photos).length, 3);
  current = command(current, "undo");
  assert.deepEqual(current.carousel, before);
});

test("delayed photo uploads return to their originating slide after navigation or mode switching", () => {
  let current = story();
  const owner = current.carousel.activeSlideId;
  const selected = current.carousel.slides[1].id;
  current = command(current, "select-carousel-slide", { slideId: selected });
  const update = (state) => ({ ...state, photos: [...state.photos, photo("loaded")] });
  current = command(current, "commit-to-document", { mode: "carousel", slideId: owner, update });
  assert.equal(current.carousel.activeSlideId, selected);
  assert.equal(current.present.photos.length, 0);
  assert.equal(current.carousel.slides.find((slide) => slide.id === owner).photos.length, 1);
  current = command(current, "set-document-mode", { mode: "collage" });
  current = command(current, "commit-to-document", { mode: "carousel", slideId: owner, update });
  assert.equal(current.documentMode, "collage");
  assert.equal(current.present.photos.length, 0);
});

test("text wrapping retains paragraphs and splits long words without clipping to legacy height", () => {
  const { wrapCarouselText } = load(path.join(root, "components/create/carousel-text-layout.ts"));
  assert.deepEqual(wrapCarouselText((value) => value.length, "hello world\n\nABCDEFGHI", 5), ["hello", "world", "", "ABCDE", "FGHI"]);
  const { drawStoryText } = load(path.join(root, "components/create/export-service.ts"));
  const calls = [];
  const context = { save() {}, restore() {}, measureText: (value) => ({ width: value.length * 10 }), fillRect() {}, fillText: (...args) => calls.push(args) };
  drawStoryText(context, [{ ...story().present.storyText[1], text: "one\ntwo\nthree", textBox: true, height: 0.001, textAlign: "center" }], 1080, 1350);
  assert.equal(calls.length, 3);
  assert.equal(calls[0][1], 540);
});

test("Carousel and Collage text controls render their separate editing limits", () => {
  const { CarouselStoryCopy } = load(path.join(root, "components/create/carousel-story-copy.tsx"));
  const item = story().present.storyText[1];
  const props = { items: [item], selectedItemId: item.id, canAdd: true, onSelect() {}, onBrowseElements() {}, onUpdate() {}, onAdd() {}, onRemove() {}, onBeginTransaction() {}, onFinishTransaction() {} };
  const carousel = renderToStaticMarkup(React.createElement(CarouselStoryCopy, props));
  const collage = renderToStaticMarkup(React.createElement(CarouselStoryCopy, { ...props, isCollage: true }));
  assert.match(carousel, /maxLength="1200"/);
  assert.match(carousel, /Typeface/);
  assert.match(collage, /maxLength="180"/);
  assert.doesNotMatch(collage, /Typeface/);
});

test("Undo locates newer edits on another slide before reverting a document command", () => {
  let current = story();
  const editedId = current.carousel.slides[1].id;
  const otherId = current.carousel.slides[2].id;
  current = command(current, "select-carousel-slide", { slideId: editedId });
  const originalText = current.present.storyText[0].text;
  current = command(current, "commit", { update: (state) => ({ ...state, storyText: state.storyText.map((item) => ({ ...item, text: "New content" })) }) });
  current = command(current, "select-carousel-slide", { slideId: otherId });
  current = command(current, "undo");
  assert.equal(current.carousel.activeSlideId, editedId);
  assert.equal(current.present.storyText[0].text, originalText);
  current = command(current, "undo");
  assert.equal(current.carousel.templateId, undefined);
  current = command(current, "redo");
  current = command(current, "redo");
  assert.equal(current.present.storyText[0].text, "New content");
});

test("history guards still protect local edits at the 100-entry limit", () => {
  let current = story();
  for (let index = 0; index < 101; index++) current = command(current, "commit", { update: (state) => ({ ...state, storyText: state.storyText.map((item) => ({ ...item, text: `Edit ${index}` })) }) });
  current = command(current, "apply-carousel-theme", { themeId: "field" });
  current = command(current, "commit", { update: (state) => ({ ...state, storyText: state.storyText.map((item) => ({ ...item, text: "Latest edit" })) }) });
  current = command(current, "undo");
  assert.equal(current.carousel.themeId, "field");
  assert.equal(current.present.storyText[0].text, "Edit 100");
  current = command(current, "undo");
  assert.equal(current.carousel.themeId, "redwell");
});

test("Collage photo replacement, visibility, locks, and layer moves finish as undoable transactions", () => {
  let current = command(editor.initialHistoryState, "commit", { update: (state) => ({ ...state, photos: [photo("a")] }) });
  for (const changes of [{ src: "blob:replacement" }, { visible: false }, { locked: true }, { layerOrder: 4 }]) {
    const original = current.present;
    current = command(current, "begin-transaction");
    current = command(current, "transient", { update: (state) => ({ ...state, photos: state.photos.map((item) => ({ ...item, ...changes })) }) });
    current = command(current, "finish-transaction");
    current = command(current, "undo");
    assert.deepEqual(current.present, original);
  }
});

test("unplaced photos become ordered photo slides without duplicate image state or lost copy", () => {
  let current = story();
  current = command(current, "commit", { update: (state) => ({ ...state, photos: [photo("a"), photo("b")], slotAssignments: {} }) });
  const before = current.carousel;
  current = command(current, "distribute-carousel-photos");
  assert.equal(current.carousel.slides.length, before.slides.length + 2);
  assert.equal(current.carousel.slides[0].storyText[0].text, before.slides[0].storyText[0].text);
  assert.equal(current.carousel.slides[1].photos[0].src, "blob:a");
  assert.equal(current.carousel.slides[2].photos[0].src, "blob:b");
  assert.equal(current.carousel.slides.flatMap((slide) => slide.photos).length, 2);
  current = command(current, "undo");
  assert.deepEqual(current.carousel, before);
});

test("export dialog includes every text-only slide and defaults to the complete story", () => {
  const { ExportDialog } = load(path.join(root, "components/create/export-dialog.tsx"));
  const current = story();
  const props = { documentMode: "carousel", carousel: current.carousel, format: { id: "portrait", name: "Portrait", width: 1080, height: 1350, ratio: 0.8 }, layout: resolveCreativeLayout(current.present.selectedLayoutId), photos: [], slotAssignments: {}, collageStyle: current.present.collageStyle, elements: [], storyText: current.present.storyText, onClose() {} };
  const markup = renderToStaticMarkup(React.createElement(ExportDialog, props));
  assert.match(markup, /aria-pressed="true"[^>]*>All slides · 5/);
  assert.match(markup, /ZIP download/);
});

test("template copy stays above imported photos with previously customized layer orders", () => {
  const { getArtworkLayerStack } = load(path.join(root, "components/create/artwork-composition.ts"));
  let current = command(start(), "commit", { update: (state) => ({ ...state, photos: [{ ...photo("front"), layerOrder: 999 }] }) });
  current = command(current, "apply-carousel-template", { templateId: "photo-journal" });
  const slide = current.carousel.slides[0];
  const stack = getArtworkLayerStack({ layout: resolveCreativeLayout(slide.selectedLayoutId), ...slide });
  assert.equal(stack[0].kind, "photo");
  assert.ok(stack.slice(1).every((layer) => layer.kind === "storyText"));
});

test("clearing Carousel resets its starting format/theme and retains the Collage document", () => {
  let current = command(editor.initialHistoryState, "commit", { update: (state) => ({ ...state, photos: [photo("collage")] }) });
  current = command(current, "set-document-mode", { mode: "carousel" });
  current = command(current, "clear-project");
  assert.equal(current.carousel.slides.length, 1);
  assert.equal(current.carousel.themeId, "redwell");
  assert.equal(current.present.canvasFormatId, "portrait");
  current = command(current, "set-document-mode", { mode: "collage" });
  assert.equal(current.present.photos[0].src, "blob:collage");
});


const backgroundImage = (updates = {}) => ({ src: "blob:background", name: "background.png", width: 200, height: 100,
  fit: "cover", positionX: 0.5, positionY: 0.5, zoom: 1, opacity: 1, ...updates });
const backgroundStyle = (updates = {}) => ({ ...editor.initialHistoryState.present.collageStyle,
  backgroundType: "image", backgroundImage: backgroundImage(), ...updates });

test("background cover/contain geometry, alignment, zoom, and format changes share canvas coordinates", () => {
  const { getBackgroundImageRect, getActiveBackgroundImage } = load(path.join(root, "components/create/canvas-background.tsx"));
  assert.deepEqual(getBackgroundImageRect(backgroundImage(), 100, 100), { x: -50, y: 0, width: 200, height: 100 });
  assert.deepEqual(getBackgroundImageRect(backgroundImage({ fit: "contain" }), 100, 100), { x: 0, y: 25, width: 100, height: 50 });
  assert.ok(getBackgroundImageRect(backgroundImage({ positionX: 0 }), 100, 100).x === 0);
  assert.equal(getBackgroundImageRect(backgroundImage({ positionX: 1 }), 100, 100).x, -100);
  assert.deepEqual(getBackgroundImageRect(backgroundImage({ zoom: 2 }), 100, 100), { x: -150, y: -50, width: 400, height: 200 });
  assert.deepEqual(getBackgroundImageRect(backgroundImage(), 100, 125), { x: -75, y: 0, width: 250, height: 125 });
  assert.equal(getActiveBackgroundImage(backgroundStyle({ backgroundType: "color" })), null);
  assert.equal(getActiveBackgroundImage(editor.initialHistoryState.present.collageStyle), null);
});

test("background upload, slider transaction, removal, and Color/Image switching support Collage and Carousel undo/redo", () => {
  for (const mode of ["collage", "carousel"]) {
    let current = mode === "carousel" ? start() : editor.initialHistoryState;
    const originalStyle = current.present.collageStyle;
    const originalPhotos = current.present.photos;
    current = command(current, "commit-to-document", { mode, slideId: current.carousel?.activeSlideId,
      update: (state) => ({ ...state, collageStyle: backgroundStyle() }) });
    assert.strictEqual(current.present.photos, originalPhotos);
    assert.deepEqual(current.present.slotAssignments, {});
    current = command(current, "undo");
    assert.deepEqual(current.present.collageStyle, originalStyle);
    current = command(current, "redo");
    const pastCount = current.past.length;
    current = command(current, "begin-transaction");
    for (const zoom of [1.2, 1.5, 2]) current = command(current, "transient", { update: (state) => ({ ...state,
      collageStyle: { ...state.collageStyle, backgroundImage: { ...state.collageStyle.backgroundImage, zoom, opacity: 0.6 } } }) });
    current = command(current, "finish-transaction");
    assert.equal(current.past.length, pastCount + 1);
    current = command(current, "undo");
    assert.equal(current.present.collageStyle.backgroundImage.zoom, 1);
    current = command(current, "redo");
    assert.equal(current.present.collageStyle.backgroundImage.zoom, 2);
    current = command(current, "commit", { update: (state) => ({ ...state, collageStyle: { ...state.collageStyle, backgroundType: "color" } }) });
    assert.equal(current.present.collageStyle.backgroundImage.src, "blob:background");
    current = command(current, "commit", { update: (state) => ({ ...state, collageStyle: { ...state.collageStyle, backgroundImage: null } }) });
    current = command(current, "undo");
    current = command(current, "undo");
    assert.equal(current.present.collageStyle.backgroundType, "image");
    assert.equal(current.present.collageStyle.backgroundImage.zoom, 2);
  }
});

test("backgrounds stay isolated by document/slide and asynchronous upload targets survive slide switching", () => {
  let current = command(editor.initialHistoryState, "commit", { update: (state) => ({ ...state, collageStyle: backgroundStyle() }) });
  current = command(current, "set-document-mode", { mode: "carousel" });
  const firstId = current.carousel.activeSlideId;
  current = command(current, "add-carousel-slide");
  const secondId = current.carousel.activeSlideId;
  current = command(current, "commit-to-document", { mode: "carousel", slideId: firstId,
    update: (state) => ({ ...state, collageStyle: backgroundStyle({ backgroundImage: backgroundImage({ src: "blob:carousel" }) }) }) });
  assert.equal(current.carousel.activeSlideId, secondId);
  assert.notEqual(current.present.collageStyle.backgroundImage?.src, "blob:carousel");
  current = command(current, "select-carousel-slide", { slideId: firstId });
  assert.equal(current.present.collageStyle.backgroundImage.src, "blob:carousel");
  current = command(current, "duplicate-carousel-slide");
  current = command(current, "commit", { update: (state) => ({ ...state, collageStyle: { ...state.collageStyle,
    backgroundImage: { ...state.collageStyle.backgroundImage, positionX: 1 } } }) });
  assert.equal(current.carousel.slides.find((slide) => slide.id === firstId).collageStyle.backgroundImage.positionX, 0.5);
  current = command(current, "set-document-mode", { mode: "collage" });
  assert.equal(current.present.collageStyle.backgroundImage.src, "blob:background");
});

test("preview remaps background Blobs without treating them as photo slots; thumbnails render backgrounds behind content", () => {
  const { getArtworkImageSources, remapArtworkImageSources, getArtworkLayerStack } = load(path.join(root, "components/create/artwork-composition.ts"));
  const { parseLivePreviewMessage } = load(path.join(root, "components/create/live-preview-protocol.ts"));
  const { CarouselSlideArtwork } = load(path.join(root, "components/create/carousel-slide-artwork.tsx"));
  const composition = { format: { width: 100, height: 125, ratio: 0.8 }, layout: { cells: [] }, photos: [photo("normal")],
    collageStyle: backgroundStyle(), slotAssignments: {}, elements: [] };
  assert.deepEqual(getArtworkImageSources(composition), ["blob:normal", "blob:background"]);
  const remapped = remapArtworkImageSources(composition, new Map([["blob:normal", "blob:preview-photo"], ["blob:background", "blob:preview-background"]]));
  assert.equal(remapped.collageStyle.backgroundImage.src, "blob:preview-background");
  assert.equal(composition.collageStyle.backgroundImage.src, "blob:background");
  assert.equal(remapped.photos.length, 1);
  assert.equal(getArtworkLayerStack({ ...remapped, storyText: [] }).length, 1);
  const state = { documentMode: "collage", composition, slides: [], activeSlideId: null };
  assert.ok(parseLivePreviewMessage({ type: "state", state }));
  assert.equal(parseLivePreviewMessage({ type: "state", state: { ...state, composition: { ...composition,
    collageStyle: backgroundStyle({ backgroundImage: backgroundImage({ width: 0 }) }) } } }), null);
  const slide = { ...start().carousel.slides[0], collageStyle: backgroundStyle(), selectedLayoutId: "1-full", photos: [photo("normal")], slotAssignments: { 0: "normal" } };
  const markup = renderToStaticMarkup(React.createElement(CarouselSlideArtwork, { slide, maxWidth: 100, maxHeight: 125 }));
  assert.ok(markup.indexOf('src="blob:background"') < markup.indexOf('src="blob:normal"'));
  assert.match(markup, /pointer-events-none absolute inset-0/);
  assert.match(markup, /background-color:transparent/);
});

test("export paints background before photos at document scale and preserves color-only output", async () => {
  const { createCollageExport } = load(path.join(root, "components/create/export-service.ts"));
  const originalGlobals = { document: global.document, Image: global.Image, requestAnimationFrame: global.requestAnimationFrame };
  const calls = [];
  const stack = [];
  const context = new Proxy({ globalAlpha: 1, save() { stack.push(this.globalAlpha); }, restore() { this.globalAlpha = stack.pop(); },
    fillRect(...args) { calls.push({ kind: "color", color: this.fillStyle, args }); },
    drawImage(image, ...args) { calls.push({ kind: "image", source: image.src, alpha: this.globalAlpha, args }); },
  }, { get(target, key) { return key in target ? target[key] : () => {}; } });
  let output;
  global.document = { createElement() { output = { width: 0, height: 0, getContext: () => context,
    toBlob(callback, type) { callback(new Blob(["test"], { type })); } }; return output; } };
  global.Image = class { constructor() { this.width = this.naturalWidth = 200; this.height = this.naturalHeight = 100; }
    set src(value) { this.source = value; queueMicrotask(() => this.onload()); } get src() { return this.source; } };
  global.requestAnimationFrame = (callback) => { callback(); return 0; };
  try {
    const snapshot = { format: { width: 100, height: 125, ratio: 0.8 },
      layout: { cells: [{ x: 0, y: 0, width: 1, height: 1 }] }, photos: [photo("normal")], slotAssignments: { 0: "normal" },
      collageStyle: backgroundStyle({ spacing: 0, borderEnabled: false, backgroundImage: backgroundImage({ opacity: 0.4 }) }), elements: [], storyText: [] };
    const blob = await createCollageExport(snapshot, { imageFormat: "png", scale: 2, quality: 100 }, () => {});
    assert.equal(blob.type, "image/png");
    assert.equal(output.width, 200); assert.equal(output.height, 250);
    const images = calls.filter((call) => call.kind === "image");
    assert.equal(images[0].source, "blob:background"); assert.equal(images[0].alpha, 0.4);
    assert.deepEqual(images[0].args, [-75, 0, 250, 125]);
    assert.equal(images[1].source, "blob:normal"); assert.equal(images[1].alpha, 1);
    calls.length = 0;
    await createCollageExport({ ...snapshot, collageStyle: { ...snapshot.collageStyle, backgroundType: "color" } },
      { imageFormat: "png", scale: 1, quality: 100 }, () => {});
    assert.ok(calls.some((call) => call.kind === "color" && call.color === snapshot.collageStyle.backgroundColor));
    assert.ok(!calls.some((call) => call.source === "blob:background"));
  } finally { Object.assign(global, originalGlobals); }
});


test("shared background controls expose image sizing, position, opacity, replace/remove for both editor modes", () => {
  const { PhotoProvider } = editor;
  const { CollageStyleToolbar } = load(path.join(root, "components/create/collage-style-toolbar.tsx"));
  const composition = { format: { id: "square", width: 1080, height: 1080, ratio: 1 },
    layout: { id: "1-full", cells: [] }, photos: [], slotAssignments: {}, collageStyle: backgroundStyle(), elements: [] };
  for (const documentMode of ["collage", "carousel"]) {
    const markup = renderToStaticMarkup(React.createElement(PhotoProvider, { presentation: { documentMode, composition } },
      React.createElement(CollageStyleToolbar)));
    for (const text of ["Replace image", "Remove image", "Fill / Cover", "Fit / Contain", "Horizontal position", "Vertical position", "Background zoom", "Background opacity"]) assert.ok(markup.includes(text), text);
    assert.match(markup, /aria-label="Choose canvas background image"/);
    assert.match(markup, /aria-label="Background type"/);
    assert.match(markup, /value="100"/);
  }
});
