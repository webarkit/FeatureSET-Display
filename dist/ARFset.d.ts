/**
 * Type declarations for @webarkit/featureset-display.
 *
 * Hand-written; source is plain JavaScript. Keep this file in sync
 * with the ARFset class in src/ARFset.js when the public surface
 * changes.
 */

export interface ARFsetOptions {
  /** Initial wasm canvas width. Default: 893. */
  width?: number;
  /** Initial wasm canvas height. Default: 1117. */
  height?: number;
}

/**
 * Renders the contents of an NFT marker (.iset / .fset / .fset3) to a
 * canvas: the imageSet preview plus circles marking the feature points
 * used for detection (green) and tracking (red).
 */
export class ARFset {
  constructor(options?: ARFsetOptions);

  id: number;
  nftMarkerCount: number;
  numIset: number;
  imageSetWidth: number;
  imageSetHeight: number;
  dpi: number;
  numFpoints: number | null;
  width: number;
  height: number;
  version: string;

  canvas: HTMLCanvasElement | null;
  canvasParent: HTMLElement | null;
  ctx: CanvasRenderingContext2D | null;

  /** Load the wasm runtime and prepare the canvas. */
  initialize(): Promise<this>;

  /** Attach the rendered canvas to an existing DOM element by id. */
  attachCanvas(id: string): void;

  /** Subscribe to 'nftMarker' and render the marker to the canvas. */
  display(): void;

  /** Load an NFT marker from a URL prefix (no extension). */
  loadNFTMarker(urlOrData: string): Promise<void>;

  /** Load an NFT marker from an array of [iset, fset3, fset] data URLs. */
  loadNFTMarkerBlob(urlOrData: string[]): Promise<void>;
}

declare const _default: { ARFset: typeof ARFset };
export default _default;
