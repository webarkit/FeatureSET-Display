/*
 *  ARFset.js
 *  FeatureSet-Display
 *
 *  This file is part of FeatureSet-Display - WebARKit.
 *
 *  FeatureSet-Display is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Lesser General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  FeatureSet-Display is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Lesser General Public License for more details.
 *
 *  You should have received a copy of the GNU Lesser General Public License
 *  along with FeatureSet-Display.  If not, see <http://www.gnu.org/licenses/>.
 *
 *  As a special exception, the copyright holders of this library give you
 *  permission to link this library with independent modules to produce an
 *  executable, regardless of the license terms of these independent modules, and to
 *  copy and distribute the resulting executable under terms of your choice,
 *  provided that you also meet, for each linked independent module, the terms and
 *  conditions of the license of that module. An independent module is a module
 *  which is neither derived from nor based on this library. If you modify this
 *  library, you may extend this exception to your version of the library, but you
 *  are not obligated to do so. If you do not wish to do so, delete this exception
 *  statement from your version.
 *
 *  Copyright 2021 WebARKit.
 *
 *  Author(s): Walter Perdan @kalwalt https://github.com/kalwalt
 *
 */

import arFset from '../build/arfset_ES6_wasm.js'
import Utils from './Utils.js'

const DEFAULT_WIDTH = 893;
const DEFAULT_HEIGHT = 1117;

/**
 * Renders the contents of an NFT marker (.iset / .fset / .fset3) to a
 * canvas: the imageSet preview plus circles marking the feature points
 * used for detection (green) and tracking (red).
 */
export default class ARFset {

    /**
     * @param {object} [options]
     * @param {number} [options.width=893]  Initial wasm canvas width.
     * @param {number} [options.height=1117] Initial wasm canvas height.
     *   These set the wasm-side memory layout for marker decoding; the
     *   on-screen canvas is resized at load time to the marker's actual
     *   reported dimensions.
     */
    constructor(options = {}) {
        this.id = 0;
        this.nftMarkerCount = 0;
        this.numIset = 0;
        this.imageSetWidth = 0;
        this.imageSetHeight = 0;
        this.dpi = 0;
        this.frameIbwpointer = null;
        this.frameimgBWsize = null;
        this.frameFeaturePoints = null;
        this.numFpoints = null;
        this.canvas = null;
        this.canvasParent = null;
        this.ctx = null;
        this.width = options.width ?? DEFAULT_WIDTH;
        this.height = options.height ?? DEFAULT_HEIGHT;
        this.version = '0.5.0';
        console.log('FeatureSETDisplay version: ', this.version);
    }

    /**
     * Load the wasm runtime and prepare the canvas. Must be awaited
     * before calling {@link loadNFTMarker} or {@link display}.
     * @returns {Promise<this>}
     */
    async initialize() {
        const runtime = await arFset();
        this.instance = runtime
        this._decorate()
        const scope = (typeof window !== 'undefined') ? window : global
        scope.arfset = this
        this._setup()
        this._createCanvas();
        return this;
    }

    _decorate () {
        // add delegate methods
        [
          'setup',
          'FS'
        ].forEach(method => {
          this[method] = this.instance[method]
        })
    
      }

    _createCanvas() {
        if (typeof document !== "undefined") {
            if (document.getElementById('iSet')) {
              document.getElementById('iSet').remove()
            }
            this.canvas = document.createElement("canvas");
            this.canvas.id = "iSet";
            this.ctx = this.canvas.getContext("2d");
            if(this.canvasParent){
              this.canvasParent.appendChild(this.canvas)
            } else {
              document.body.appendChild(this.canvas);
            }
            console.log('canvas created');
        };
    }

    /**
     * Attach the rendered canvas to an existing DOM element by id
     * instead of letting it append to document.body. Call this before
     * {@link initialize}.
     * @param {string} id
     */
    attachCanvas(id) {
      this.canvasParent = document.getElementById(id);
    }

    /**
     * Subscribe to the 'nftMarker' event and render the marker preview
     * + feature points to the canvas every time a marker loads.
     */
    display () {
        var self = this;
        document.addEventListener('nftMarker', function(ev) {
            self.canvas.width = ev.detail.widthNFT;
            self.canvas.height = ev.detail.heightNFT;
            self.numIset = ev.detail.numIset;
            self.imageSetWidth = ev.detail.widthNFT;
            self.imageSetHeight = ev.detail.heightNFT;
            self.numFpoints = ev.detail.numFpoints;
            self.dpi = ev.detail.dpi;
            const debugBuffer = new Uint8Array(
                self.instance.HEAPU8.buffer,
                self.frameIbwpointer,
                self.frameimgBWsize
              );
              const id = new ImageData(self.canvas.width, self.canvas.height);
              // Fill 4 bytes (R,G,B,A) per gray pixel as one 32-bit write.
              // ~3-5x faster than per-channel assignment in benchmarks.
              const dst = new Uint32Array(id.data.buffer);
              for (let i = 0; i < debugBuffer.length; i++) {
                const v = debugBuffer[i];
                dst[i] = 0xff000000 | (v << 16) | (v << 8) | v;
              }

              self.ctx.putImageData(id, 0, 0);

              self._drawPoints(ev.detail.nftPoints, 10, '#34FF19', 2);
              self._drawPoints(ev.detail.nftFsetPoints, 4, '#FF0119', 1);

              var imageEv = new Event('imageEv');
              document.dispatchEvent(imageEv);
            })
    };

    _drawPoints(points, radius, strokeStyle, lineWidth) {
      if (!points) return;
      this.ctx.strokeStyle = strokeStyle;
      this.ctx.lineWidth = lineWidth;
      const size = points.size();
      for (let i = 0; i < size; i++) {
        const p = points.get(i);
        this.ctx.beginPath();
        this.ctx.arc(p[0], p[1], radius, 0, 2 * Math.PI, false);
        this.ctx.stroke();
      }
      points.delete();
    };

    /**
     * Load an NFT marker from a URL prefix. The prefix is appended
     * with `.fset`, `.iset`, and `.fset3` to fetch the three files.
     * Dispatches an 'nftMarker' CustomEvent on document when ready.
     * @param {string} urlOrData URL prefix (no extension).
     * @returns {Promise<void>}
     */
    async loadNFTMarker (urlOrData) {
        let nft = await this.addNFTMarker(this.id, urlOrData)
        .then((nftMarker) => {
              this.frameIbwpointer = nftMarker.pointer;
              this.frameimgBWsize = nftMarker.imgBWsize;
              var nftEvent = new CustomEvent('nftMarker', {
                detail: {
                  numIset: nftMarker.numIset,
                  widthNFT: nftMarker.width,
                  heightNFT: nftMarker.height,
                  dpi: nftMarker.dpi,
                  numFpoints: nftMarker.numFpoints,
                  pointerFeaturePoints: nftMarker.nftFeaturePoints,
                  nftPoints: nftMarker.nftPoints,
                  nftFsetPoints: nftMarker.nftFsetPoints
                }
              });
              document.dispatchEvent(nftEvent);
        })

        return nft
      };

      /**
       * Load an NFT marker from an array of three data URLs (or blob URLs)
       * in the order [iset, fset3, fset]. Used by demos that accept a
       * marker uploaded via `<input type="file" multiple>`.
       * @param {string[]} urlOrData
       * @returns {Promise<void>}
       */
      async loadNFTMarkerBlob (urlOrData) {
        let nft = await this.addNFTMarkerBlob(this.id, urlOrData)
        .then((nftMarker) => {
              this.frameIbwpointer = nftMarker.pointer;
              this.frameimgBWsize = nftMarker.imgBWsize;
              var nftEvent = new CustomEvent('nftMarker', {
                detail: {
                  numIset: nftMarker.numIset,
                  widthNFT: nftMarker.width,
                  heightNFT: nftMarker.height,
                  dpi: nftMarker.dpi,
                  numFpoints: nftMarker.numFpoints,
                  pointerFeaturePoints: nftMarker.nftFeaturePoints,
                  nftPoints: nftMarker.nftPoints,
                  nftFsetPoints: nftMarker.nftFsetPoints
                }
              });
              document.dispatchEvent(nftEvent);
        })

        return nft
      };

    async addNFTMarker (arId, url) {
        // url doesn't need to be a valid url. Extensions to make it valid will be added here
        const targetPrefix = '/markerNFT_' + this.nftMarkerCount++
        const extensions = ['fset', 'iset', 'fset3']
    
        const storeMarker = async function (ext) {
          const fullUrl = url + '.' + ext
          const target = targetPrefix + '.' + ext
          const data = await Utils.fetchRemoteData(fullUrl)
          this._storeDataFile(data, target)
        }
    
        const promises = extensions.map(storeMarker, this)
        await Promise.all(promises)
    
        // return the internal marker ID
        return this.instance._readNFTMarker(arId, targetPrefix)
      }

      async addNFTMarkerBlob (arId, urlOrData) {
        // url doesn't need to be a valid url. Extensions to make it valid will be added here
        const targetPrefix = '/markerNFT_' + this.nftMarkerCount++
        const extensions = ['iset', 'fset3', 'fset']
    
        const storeMarker = async function (ext, i) {
          const fullUrl = urlOrData[i]
          const target = targetPrefix + '.' + ext
          const data = await Utils.fetchRemoteDataBlob(fullUrl)
          this._storeDataFile(data, target)
        }
    
        const promises = extensions.map(storeMarker, this)
        await Promise.all(promises)
    
        // return the internal marker ID
        return this.instance._readNFTMarker(arId, targetPrefix)
      }
    
      // ---------------------------------------------------------------------------
    
      // implementation
    
      _storeDataFile (data, target) {
        // FS is provided by emscripten
        // Note: valid data must be in binary format encoded as Uint8Array
        this.instance.FS.writeFile(target, data, {
          encoding: 'binary'
        })
      }

    _setup () {
        // Initial memory dimension. wasm memory grows on demand thanks to
        // ALLOW_MEMORY_GROWTH, but allocating roughly the marker size up
        // front avoids a couple of grow events on the first load.
        this.id = this.instance.setup(this.width, this.height);
      }

}