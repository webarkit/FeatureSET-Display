import { describe, it, expect, vi, beforeEach } from 'vitest';

// Stub the emscripten wasm wrapper so importing ARFset doesn't try to
// instantiate wasm in Node. The factory is only invoked from
// ARFset.initialize(), which these tests deliberately avoid calling.
vi.mock('../../build/arfset_ES6_wasm.js', () => ({
  default: vi.fn(),
}));

const { default: ARFset } = await import('../../src/ARFset.js');

describe('ARFset constructor', () => {
  beforeEach(() => {
    // Quiet the version banner the constructor logs.
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('uses the documented defaults when no options are passed', () => {
    const ar = new ARFset();
    expect(ar.width).toBe(893);
    expect(ar.height).toBe(1117);
  });

  it('applies width and height from options', () => {
    const ar = new ARFset({ width: 640, height: 480 });
    expect(ar.width).toBe(640);
    expect(ar.height).toBe(480);
  });

  it('uses defaults for any option that is omitted', () => {
    expect(new ARFset({ width: 100 }).height).toBe(1117);
    expect(new ARFset({ height: 100 }).width).toBe(893);
  });

  it('initialises bookkeeping counters to zero', () => {
    const ar = new ARFset();
    expect(ar.id).toBe(0);
    expect(ar.nftMarkerCount).toBe(0);
    expect(ar.numIset).toBe(0);
  });

  it('exposes the library version string', () => {
    expect(new ARFset().version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
