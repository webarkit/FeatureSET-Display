var Module = require('../../build/FeatureSETDisplay.min.js');

var imageData = {
    sizeX: 0,
    sizeY: 0,
    nc: 0,
    dpi: 0,
    array: []
}

let heapSpace = Module._malloc(imageData.array.length * imageData.array.BYTES_PER_ELEMENT);
Module.HEAPU8.set(imageData.array, heapSpace);

Module._readImageSet("data/pinball.iset", imageData.array);
console.log("read .iset");

Module._free(heapSpace);
