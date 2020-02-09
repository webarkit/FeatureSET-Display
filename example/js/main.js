var interval = setTimeout(function() {
  var arfset = new ARfset(1117, 893);
  console.log(arfset);
  /*arfset.getImageSetWidth('./data/pinball.iset', function(width){
    console.log(width);
  })*/
  arfset.loadNFTMarker('data/pinball');
  arfset.display();
}, 200);
