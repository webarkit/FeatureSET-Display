import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Utils from '../../src/Utils.js';

describe('Utils.string2Uint8Data', () => {
  it('encodes ASCII chars as their code points', () => {
    const out = Utils.string2Uint8Data('abc');
    expect(out).toBeInstanceOf(Uint8Array);
    expect(Array.from(out)).toEqual([0x61, 0x62, 0x63]);
  });

  it('truncates non-ASCII chars to their low byte', () => {
    // '€' is U+20AC; low byte is 0xAC.
    const out = Utils.string2Uint8Data('a€');
    expect(out.length).toBe(2);
    expect(out[1]).toBe(0xAC);
  });

  it('returns an empty array for the empty string', () => {
    expect(Utils.string2Uint8Data('').length).toBe(0);
  });
});

describe('Utils.fetchRemoteData', () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock;
  });

  afterEach(() => {
    delete globalThis.fetch;
  });

  it('returns a Uint8Array for a 200 response', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new Uint8Array([1, 2, 3]).buffer),
    });
    const out = await Utils.fetchRemoteData('https://example/test');
    expect(out).toBeInstanceOf(Uint8Array);
    expect(Array.from(out)).toEqual([1, 2, 3]);
    expect(fetchMock).toHaveBeenCalledWith('https://example/test');
  });

  it('throws on non-ok response with status info', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });
    await expect(Utils.fetchRemoteData('https://example/missing')).rejects.toThrow(/404/);
  });
});

describe('Utils.fetchRemoteDataBlob', () => {
  it('treats a multi-line string as inline data, not a URL', async () => {
    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy;
    const out = await Utils.fetchRemoteDataBlob('line one\nline two');
    expect(out).toBeInstanceOf(Uint8Array);
    expect(out.length).toBe('line one\nline two'.length);
    expect(fetchSpy).not.toHaveBeenCalled();
    delete globalThis.fetch;
  });

  it('falls through to fetch for a single-line URL', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new Uint8Array([9]).buffer),
    });
    globalThis.fetch = fetchSpy;
    const out = await Utils.fetchRemoteDataBlob('https://example/blob');
    expect(out[0]).toBe(9);
    expect(fetchSpy).toHaveBeenCalledWith('https://example/blob');
    delete globalThis.fetch;
  });
});
