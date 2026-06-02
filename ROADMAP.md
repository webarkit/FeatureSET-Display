# Modernization Roadmap

The project hasn't received updates in ~4 years. This document groups the
proposed improvements so they can be tracked, discussed, and later converted
into individual GitHub issues.

Status legend: `[ ]` not started · `[~]` in progress · `[x]` done.

---

## 1. Native / Emscripten side

### 1a. Replace `EM_ASM_` in `emscripten/ARimageFsetDisplay.cpp` (lines 180–190)

The block writes `frameIbwpointer`, `frameimgBWsize`, `frameFeaturePoints`
onto a JS-side `arfset.frameMalloc` object. Modern, more efficient options,
in order of preference:

- **Best: drop it entirely.** Those same three fields are already returned
  through the embind `nftMarker` value_object (`pointer`, `imgBWsize`,
  `nftFeaturePoints` in `emscripten/bindings.cpp:46-55`). JS can read them
  from the returned struct instead of from a side-channel global —
  eliminates a JS↔wasm crossing and removes hidden global state.
- **If a JS-visible global is required:** use `emscripten::val` (pure C++,
  type-safe, no string parser):
  `val::global("arfset")["frameMalloc"].set("frameIbwpointer", arc->imgBW);`.
- **Last resort:** `EM_JS(void, set_frame_malloc, (...), { ... })` —
  declarative, parsed once at build time instead of every call site.

- [ ] Pick approach (recommended: drop the EM_ASM and read from `nftMarker`).
- [ ] Remove `EM_ASM_` block.
- [ ] Update JS callers in `js/arfset.api.js` and `src/ARFset.js`.

### 1b. Replace the `writeFP` / `writeFS` JS library (`js/jslibrary.js`)

Current design has two real problems:

- It's called in a per-point loop from `readNFTMarker`
  (`emscripten/ARimageFsetDisplay.cpp:200-206`), so each point pays a
  wasm→JS call.
- Each call **adds a new `imageEv` event listener** that is never removed.
  Loading a marker with N feature points leaks N listeners; loading a
  second marker doubles drawing work.

- [ ] Populate the already-declared `nftPoints` vector in
      `ARimageFsetDisplay.cpp` (the loop at lines 192–198 is commented out).
- [ ] Expose feature-set points the same way (new vector field).
- [ ] Delete `writeFP` / `writeFS` from `js/jslibrary.js` and remove the
      `--js-library` flag if nothing else needs it.
- [ ] Have JS draw all points in a single pass after `imageEv` fires.

### 1c. Native code bugs / cleanup in `ARimageFsetDisplay.cpp`

- [ ] `loadNFTMarker` logs an error if `ar2ReadSurfaceSet` returns NULL but
      **continues**, then dereferences the NULL pointer (lines 109–128).
- [ ] `exit(0)` / `exit(-1)` on file errors (lines 148, 154) terminate the
      wasm runtime in the browser — return an error code instead.
- [ ] `setup()` mallocs `imgBW` with `width*height*4`, but `loadNFTMarker`
      overwrites the pointer with `surfaceSet[...]->imgBW` — the malloc'd
      buffer leaks (and so does the second `malloc` based on the
      uninitialized `num_F_points_NFT`).
- [ ] `ARLOGi("...%d", arc->imgBW)` and `(int)arc->imgBW` truncate
      pointers — use `%p` / `uintptr_t`.
- [ ] The `if (surfaceSetCount == PAGES_MAX) exit(-1);` check at line 153
      happens *after* the array is written (line 109+); reorder and return
      an error.

---

## 2. JavaScript API

### 2a. `Module._free(debugBuffer)` is incorrect

`src/ARFset.js:144` and `js/arfset.api.js:114` pass a `Uint8ClampedArray`
view to `Module._free`, which expects an integer pointer. The call is a
no-op at best and likely corrupts the heap if the cast happens to land on
a valid pointer.

- [ ] Remove the bogus `_free` call (the buffer is a view onto wasm memory
      managed by the C++ side; JS shouldn't free it).

### 2b. Per-pixel ImageData fill is slow

The `for (i,j) { id.data[j+0..2] = v; id.data[j+3] = 255 }` loop in both
`src/ARFset.js:131-137` and `js/arfset.api.js:101-107` can be replaced by
writing a `Uint32Array` view of `id.data` with
`(0xff000000 | v<<16 | v<<8 | v)` — typically 3–5× faster.

- [ ] Refactor the gray→RGBA conversion loop using a `Uint32Array` view.

### 2c. Replace `axios` with `fetch`

`axios 0.26.x` has unpatched CVEs (CVE-2023-45857 / SSRF). The two
`Utils.js` methods just do
`axios.get(url, { responseType: 'arraybuffer' })` — a one-line
`fetch().then(r => r.arrayBuffer())` removes the dependency entirely.

- [ ] Replace both `fetchRemoteData` and `fetchRemoteDataBlob` with
      `fetch`-based implementations.
- [ ] Remove `axios` from `package.json` dependencies.

### 2d. Delete `js/arfset.api.js` (and the asm.js builds that depend on it)

The legacy global-`ARfset` API in `js/arfset.api.js` is coupled to the
asm.js outputs: `tools/makem.js:176` injects it via `--pre-js` into
`arfset.debug.js` and `arfset.min.js` only — the wasm and ES6-wasm
builds never include it. Modern browsers cover wasm, so we drop both
the legacy file and the asm.js targets in the same change. Only
`example/example.html` currently consumes it; that example is migrated
to the ES6 build (the existing `example_es6.html` is the template).

- [ ] Delete `js/arfset.api.js`.
- [ ] Delete `js/jslibrary.js` once 1b removes its `writeFP`/`writeFS`
      callbacks (the `--js-library` flag goes away with it).
- [ ] Remove `compile_combine` and `compile_combine_min` jobs from
      `tools/makem.js`, plus the `PRE_FLAGS` block.
- [ ] Migrate `example/example.html` to the ES6 build (or replace it
      with the existing `example_es6.html`).
- [ ] Delete `build/arfset.min.js` and `build/arfset.debug.js`; stop
      generating them.
- [ ] Continue to expose a `window.ARFset` global for legacy users via
      the webpack UMD bundle (`dist/ARFset.js` already does this) —
      no separate legacy entry point needed.
- [ ] Note the removal in the README and bump to a major version since
      this is a breaking change for anyone loading `arfset.min.js`.

### 2e. Magic numbers in `_setup(893, 1117)`

`src/ARFset.js:249-251` hardcodes initial canvas dimensions. Make them
constructor options with sensible defaults.

- [ ] Accept `{ width, height }` in the `ARFset` constructor.
- [ ] Update example HTML files accordingly.

### 2f. Public-facing API gaps

- [ ] Add TypeScript declarations (`.d.ts`) — or convert `src/` to
      TypeScript outright.
- [ ] Add JSDoc on every public method.
- [ ] Decide on naming: `nftMarkerCount` (field) vs `markerNFTCount`
      (local) are inconsistent.

---

## 3. Build, dependencies, tests, CI, docs

### 3a. Update toolchain

`package.json` still pins webpack 5.70, Babel 7.17, axios 0.26 — all
~4 years old.

- [ ] Bump webpack, Babel, or replace webpack with **Vite/Rollup/esbuild**
      for an order-of-magnitude faster build.
- [ ] Drop `@babel/transform-runtime` if targeting modern browsers.
- [ ] Refresh `package-lock.json`.

### 3b. Emscripten build flags (`tools/makem.js`)

The asm.js targets are dropped as part of 2d. This item covers the
remaining cleanup.

- [ ] `TOTAL_MEMORY` is deprecated — switch to `INITIAL_MEMORY`. Comment
      says `64MB` but value is `256MB`; fix one or the other.
- [ ] `var arguments = process.argv` shadows the reserved `arguments` —
      replace with `process.argv.slice(2)` and `for…of`.
- [ ] Add a dedicated debug wasm target with `DEBUG_FLAGS` applied
      (currently they only affect the asm.js debug build, which is
      going away).
- [ ] Bump the `WebARKitLib` submodule (currently pinned 4 years back).

### 3c. Add a test system

No tests exist today.

- [ ] Pick a runner — recommend **Vitest** for unit tests +
      **Playwright** for a browser-level smoke test that loads a known
      marker and asserts the canvas is non-empty.
- [ ] Add a `npm test` script.
- [ ] Wire tests into CI (see 3d).

### 3d. CI workflow

- [ ] Add a GitHub Actions workflow that:
  - Checks out with submodules
  - Sets up Emscripten via `mymindstorm/setup-emsdk`
  - Runs `npm run build` and `npm run build-es6`
  - Runs the test suite from 3c
  - Uploads build artifacts on tag pushes
- [ ] Add badges to README.

### 3e. README + docs

- [ ] Quick-start: install, build, run example.
- [ ] API reference table (which methods, what they return, what events
      they emit).
- [ ] Migration notes from the legacy `arfset.api.js` to the ES6 `ARFset`
      class.
- [ ] Architecture diagram of the C++ ↔ wasm ↔ JS boundary.
- [ ] Fix `package.json` `contributors` (currently contains a single
      empty string).

---

## Suggested order of attack

1. **1b** — fix the listener leak first; it affects every other change
   that touches drawing.
2. **1a** — drop the EM_ASM once JS reads from `nftMarker` directly.
3. **2a, 2b, 2c** — small, isolated JS fixes; easy wins.
4. **1c** — native cleanup; pairs naturally with rebuilding wasm anyway.
5. **2d** — delete the legacy file and asm.js builds; major-version bump.
6. **3a + 3b** — toolchain refresh; gives us a clean base for tests.
7. **3c + 3d** — tests and CI so regressions get caught from here on.
8. **2e, 2f, 3e** — polish and docs.
