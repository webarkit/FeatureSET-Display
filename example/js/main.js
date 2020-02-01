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

var imageSet = {};

var arfset = new ARfset();
console.log(arfset);
arfset.loadImageSet('data/pinball.iset');

//context.putImageData(imageData.array.buffer, imageData.sizeX, imageData.sizeY);
