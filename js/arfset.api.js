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
  this.imageSet = null;
  this.imageSetWidth = 0;
  this.framepointer = null;
  this.framesize = null;
  this.frameIsetpointer = null;
  this.dataHeap = null;
  this._init(width, height);
}

ARfset.prototype.getImageSetWidth = function(url, callback, onError){
  if (url) {
    console.log(url);
    var self = this;
    return arfset.getIsetWidth(url, function(width){
      console.log(width);
      self.imageSetWidth = width;
      callback(width)
    }, onError)
  } else {
      if (onError) {
          onError("Iset URL needs to be defined and not equal empty string!");
      }
      else {
          console.error("Iset URL needs to be defined and not equal empty string!");
      }
    }
};

ARfset.prototype.loadImageSet = function(url, callback, onError){
  if (url) {
    console.log(url);
    arfset.readImageSet(url, function(iset){
      console.log(iset);
      callback(iset)
    }, onError)
  } else {
      if (onError) {
          onError("Iset URL needs to be defined and not equal empty string!");
      }
      else {
          console.error("Iset URL needs to be defined and not equal empty string!");
      }
    }
};

ARfset.prototype.getImageSet = function(){
  return this.imageSet;
}

ARfset.prototype._init = function(width, height){
  this.id = arfset.setup(width, height);

  var params = arfset.frameMalloc;
  this.framepointer = params.framepointer;
  this.framesize = params.framesize;
  this.frameIsetpointer = params.frameIsetpointer;

  this.dataHeap = new Uint8Array(Module.HEAPU8.buffer, this.framepointer, this.framesize);
}

var iset_w_count = 0;

function getIsetWidth(url, callback, onError){
  var filename = '/getIsetW_' + iset_w_count++;
  ajax(url, filename, function () {
    console.log(filename);
      var width = Module._getIsetWidth(0, filename);
      console.log(width);
      if (callback) callback(width);
  }, function (errorNumber) { if (onError) onError(errorNumber) });
  };


var iset_count = 0;

function readImageSet(url, callback, onError){
  var filename = '/readIset_' + iset_count++;
  ajax(url, filename, function () {
    console.log(filename);
      var iset = Module._readImageSet(filename);
      console.log(iset);
      if (callback) callback(iset);
  }, function (errorNumber) { if (onError) onError(errorNumber) });
};

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
  readImageSet: readImageSet,
  getIsetWidth: getIsetWidth
}

var FUNCTIONS = [
  'setup',
  'loadImageSet',
  'getImageSetWidth',
  'getImageSet'
];

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
