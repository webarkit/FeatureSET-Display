var interval = setTimeout(function() {
  var arfset = new ARfset(893, 1117);
  console.log(arfset);
  arfset.loadNFTMarker('data/pinball');
  arfset.display();
}, 200);
