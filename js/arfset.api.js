; (function () {
'use strict'
var scope;
if (typeof window !== 'undefined') {
    scope = window;
} else {
    scope = global;
};

var ARfset = function(){
  this.imageSet = null;
}

var iset_count;

ARfset.prototype.loadImageSet = function(url, callback, onError){
  if (url) {
    return this.imageSet = readImageSet(url, callback, onError)
  } else {
      if (onError) {
          onError("Iset URL needs to be defined and not equal empty string!");
      }
      else {
          console.error("Iset URL needs to be defined and not equal empty string!");
      }
    }
};

function readImageSet(url, callback, onError){
  var filename = '/readiset_' + iset_count++;
  ajax(url, filename, function () {
      var iset = Module._readImageSet(filename);
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
  readImageSet: readImageSet
}

var FUNCTIONS = [
  'loadImageSet',
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
