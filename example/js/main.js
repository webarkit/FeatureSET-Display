var canvas = document.getElementById('isetCanvas');
var context = canvas.getContext('2d');
context.fillStyle = "#cccccc";
context.fillRect(0,0, canvas.width, canvas.height);

var imageData = {
    sizeX: 0,
    sizeY: 0,
    nc: 0,
    dpi: 0,
    array: []
}

let heapSpace = Module._malloc(imageData.array.length * imageData.array.BYTES_PER_ELEMENT);
Module.HEAPU8.set(imageData.array, heapSpace);

Module._readImageSet("./data/pinball.iset", imageData.array);
console.log(imageData.array);
console.log("read .iset");

context.putImageData(imageData.array.buffer, imageData.sizeX, imageData.sizeY);

Module._free(heapSpace);

/*window.addEventListener('FeatureSETDisplay-loaded', () => {
  console.log('inside');



  let heapSpace = Module._malloc(imageData.array.length * imageData.array.BYTES_PER_ELEMENT);
  Module.HEAPU8.set(imageData.array, heapSpace);

  Module._readImageSet("./data/pinball.iset", imageData.array);
  console.log("read .iset");

  context.putImageData(imageData.array, imageData.sizeX, imageData.sizeY);

  Module._free(heapSpace);

});
*/
