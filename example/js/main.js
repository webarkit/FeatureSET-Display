window.addEventListener('FeatureSETDisplay-loaded', function () {
  var arfset = new ARfset(893, 1117);
  console.log(arfset);
  arfset.loadNFTMarker('data/pinball');
  document.addEventListener('nftMarker', (ev) => {
    console.log( ev.detail.nftPoints.$$.ptr );
   })
  arfset.display();
});
