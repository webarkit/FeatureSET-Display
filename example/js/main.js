var interval = setTimeout(function() {
  var arfset = new ARfset(320, 240);
  console.log(arfset);
  /*arfset.getImageSetWidth('./data/pinball.iset', function(width){
    console.log(width);
  })*/
  arfset.loadNFTMarker('data/pinball');
  arfset.display();
}, 200);
