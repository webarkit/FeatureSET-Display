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
var interval = setTimeout(function() {
  var arfset = new ARfset(320, 240);
  console.log(arfset);
  /*arfset.getImageSetWidth('./data/pinball.iset', function(width){
    console.log(width);
  })*/
  arfset.loadNFTMarker('data/pinball');
}, 200);
//var w = new arfset.getIsetWidth('data/pinball.iset');
/*arfset.loadImageSet('data/pinball.iset', function(iset){
  console.log(iset);
});
var iset = arfset.getImageSet();
console.log(iset);*/

//context.putImageData(imageData.array.buffer, imageData.sizeX, imageData.sizeY);
