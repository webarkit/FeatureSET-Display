import arFset from '../build/arfset_ES6_wasm.js'
import Utils from './Utils'

export default class ARFset {

    constructor() {
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
        this.ctx = null;
        this.version = '0.2.0';
        console.log('FeatureSETDisplay version: ', this.version);
    }

    async initialize() {
        const runtime = await arFset();
        this.instance = runtime
        this._decorate()
        const scope = (typeof window !== 'undefined') ? window : global
        scope.arfset = this
        this._setup()
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
            this.canvas = document.createElement("canvas");
            this.canvas.id = "iSet";
            this.ctx = this.canvas.getContext("2d");
            console.log('canvas created');
        };
    }

    display () {
        this._createCanvas();
        document.body.appendChild(this.canvas);
        var self = this;
        document.addEventListener('nftMarker', function(ev) {
            self.canvas.width = ev.detail.widthNFT;
            self.canvas.height = ev.detail.heightNFT;
            self.numIset = ev.detail.numIset;
            self.imageSetWidth = ev.detail.widthNFT;
            self.imageSetHeight = ev.detail.heightNFT;
            self.frameFeaturePoints = ev.detail.pointerFeaturePoints;
            self.numFpoints = ev.detail.numFpoints;
            self.dpi = ev.detail.dpi;
            var debugBuffer = new Uint8ClampedArray(
                self.instance.HEAPU8.buffer,
                self.frameIbwpointer,
                self.frameimgBWsize
              );
            var pointerFeaturePoints = new Uint16Array(
              self.instance.HEAPU16.buffer,
              self.frameFeaturePoints,
              self.numFpoints * 2
            )
              var id = new ImageData(
                new Uint8ClampedArray(self.canvas.width * self.canvas.height * 4),
                self.canvas.width,
                self.canvas.height
              );
              for (var i = 0, j = 0; i < debugBuffer.length; i++, j += 4) {
                var v = debugBuffer[i];
                id.data[j + 0] = v;
                id.data[j + 1] = v;
                id.data[j + 2] = v;
                id.data[j + 3] = 255;
              }
        
              self.ctx.putImageData(id, 0, 0);
    
              var imageEv = new Event('imageEv');
              document.dispatchEvent(imageEv);
        
             self.instance._free(debugBuffer);
            })
    };

    async loadNFTMarker (urlOrData) {
        let nft = await this.addNFTMarker(this.id, urlOrData)
        .then((nftMarker) => {
             console.log(nftMarker);
             var params = arfset.frameMalloc;
              this.frameIbwpointer = params.frameIbwpointer;
              this.frameimgBWsize = params.frameimgBWsize;
              var nftEvent = new CustomEvent('nftMarker', {
                detail: {
                  numIset: nftMarker.numIset,
                  widthNFT: nftMarker.width,
                  heightNFT: nftMarker.height,
                  dpi: nftMarker.dpi,
                  numFpoints: nftMarker.numFpoints,
                  pointerFeaturePoints: nftMarker.nftFeaturePoints,
                  nftPoints: nftMarker.nftPoints
                }
              });
              document.dispatchEvent(nftEvent);
              this.nftMarkerCount = nftMarker.id + 1;
        })
        
        return nft
      };

    async addNFTMarker (arId, url) {
        // url doesn't need to be a valid url. Extensions to make it valid will be added here
        const targetPrefix = '/markerNFT_' + this.markerNFTCount++
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
    
      // ---------------------------------------------------------------------------
    
      // implementation
    
      _storeDataFile (data, target) {
        // FS is provided by emscripten
        // Note: valid data must be in binary format encoded as Uint8Array
        this.instance.FS.writeFile(target, data, {
          encoding: 'binary'
        })
      }

    _setup (){
        // we need to start with a memory dimension.
        // Memory can be enlarged thanks to MEMORY_ALLOW_GROWTH option.
        var width = 893;
        var height = 1117;
        this.id = this.instance.setup(width, height);
      }

}