; (function () {
'use strict'
var scope;
if (typeof window !== 'undefined') {
    scope = window;
} else {
    scope = global;
};

var ARfset = function(width, height){
  this.id = 0;
  this.nftMarkerCount = 0;
  this.numIset = 0;
  this.imageSetWidth = 0;
  this.imageSetHeight = 0;
  this.dpi = 0;
  this.frameIbwpointer = null;
  this.frameimgBWsize = null;
  this.frameFeaturePoints = null;
  this.canvas = null;
  this.ctx = null;
  this._init(width, height);
};

ARfset.prototype.createCanvas = function () {
    if (typeof document !== "undefined") {
      this.canvas = document.createElement("canvas");
      this.canvas.id = "iSet";
      this.ctx = this.canvas.getContext("2d");
      console.log('canvas created');
    };
  };

ARfset.prototype.display = function () {
    this.createCanvas();
    document.body.appendChild(this.canvas);
    var self = this;
    document.addEventListener('nftMarker', function(ev) {
        self.canvas.width = ev.detail.widthNFT;
        self.canvas.height = ev.detail.heightNFT;
        self.numIset = ev.detail.numIset;
        self.imageSetWidth = ev.detail.widthNFT;
        self.imageSetHeight = ev.detail.heightNFT;
        self.frameFeaturePoints = ev.detail.pointerFeaturePoints;
        self.dpi = ev.detail.dpi;
        var debugBuffer = new Uint8ClampedArray(
            Module.HEAPU8.buffer,
            self.frameIbwpointer,
            self.frameimgBWsize
          );
        var pointerFeaturePoints = new Uint32Array(
          Module.HEAPU32.buffer,
          self.frameFeaturePoints,
          330
        )
        console.log(pointerFeaturePoints);
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
    
          Module._free(debugBuffer);
        })
};

ARfset.prototype.loadNFTMarker = function (markerURL, onSuccess, onError) {
    var self = this;
    if (markerURL) {
      return arfset.readNFTMarker(this.id, markerURL, function (nftMarker) {
          console.log(nftMarker);
          console.log(nftMarker.nftPoints);
          var params = arfset.frameMalloc;
          self.frameIbwpointer = params.frameIbwpointer;
          self.frameimgBWsize = params.frameimgBWsize;
          var nftEvent = new CustomEvent('nftMarker', {
            detail: {
              numIset: nftMarker.numIset,
              widthNFT: nftMarker.width,
              heightNFT: nftMarker.height,
              dpi: nftMarker.dpi,
              pointerFeaturePoints: nftMarker.nftFeaturePoints,
              nftPoints: nftMarker.nftPoints
            }
          });
          document.dispatchEvent(nftEvent);
      }, onError);
    } else {
      if (onError) {
          onError("Marker URL needs to be defined and not equal empty string!");
      }
      else {
          console.error("Marker URL needs to be defined and not equal empty string!");
      }
    }

};

ARfset.prototype.getImageSet = function(){
  return this.imageSet;
}

ARfset.prototype._init = function(width, height){
  this.id = arfset.setup(width, height);
}

var marker_count = 0;

function readNFTMarker(arId, url, callback, onError) {
    var mId = marker_count++;
    var prefix = '/markerNFT_' + mId;
    var filename1 = prefix + '.fset';
    var filename2 = prefix + '.iset';
    var filename3 = prefix + '.fset3';
    ajax(url + '.fset', filename1, function () {
        ajax(url + '.iset', filename2, function () {
            ajax(url + '.fset3', filename3, function () {
                var id = Module._readNFTMarker(arId, prefix);
                if (callback) callback(id);
            }, function (errorNumber) { if (onError) onError(errorNumber) });
        }, function (errorNumber) { if (onError) onError(errorNumber) });
    }, function (errorNumber) { if (onError) onError(errorNumber) });
}

function writeStringToFS(target, string, callback) {
    var byteArray = new Uint8Array(string.length);
    for (var i = 0; i < byteArray.length; i++) {
        byteArray[i] = string.charCodeAt(i) & 0xff;
    }
    writeByteArrayToFS(target, byteArray, callback);
}

function writeByteArrayToFS(target, byteArray, callback) {
    FS.writeFile(target, byteArray, { encoding: 'binary' });
    // console.log('FS written', target);

    callback(byteArray);
}

function ajax(url, target, callback, errorCallback) {
    var oReq = new XMLHttpRequest();
    oReq.open('GET', url, true);
    oReq.responseType = 'arraybuffer'; // blob arraybuffer

    oReq.onload = function () {
        if (this.status == 200) {
            // console.log('ajax done for ', url);
            var arrayBuffer = oReq.response;
            var byteArray = new Uint8Array(arrayBuffer);
            writeByteArrayToFS(target, byteArray, callback);
        }
        else {
            errorCallback(this.status);
        }
    };

    oReq.send();
}

var arfset = {

  readNFTMarker: readNFTMarker

}

var FUNCTIONS = [
  'setup',
  'display',
  'getImageSet'
];
console.log(Module);

function runWhenLoaded() {
    FUNCTIONS.forEach(function (n) {
        arfset[n] = Module[n];
    })

    for (var m in Module) {
        if (m.match(/^AR/))
            arfset[m] = Module[m];
    }
}

scope.arfset = arfset;
scope.ARfset = ARfset;

if (scope.Module) {
    scope.Module.onRuntimeInitialized = function () {
        runWhenLoaded();
        var event = new Event('FeatureSETDisplay-loaded');
        scope.dispatchEvent(event);
    }
} else {
    scope.Module = {
        onRuntimeInitialized: function () {
            runWhenLoaded();
        }
    };
}

})();
