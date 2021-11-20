window.addEventListener('FeatureSETDisplay-loaded', function () {
  var arfset = new ARfset();
  arfset.loadNFTMarker('data/pinball', (nft) => { 
    console.log(nft);
    //console.log(nft.nftPoints.size()) //this give zero
    const nftPointsPointer = nft.nftPoints.$$.ptr;
    const nftArray = new Int16Array(Module.HEAP16.buffer, nftPointsPointer, nft.numFpoints * 2);
    //console.log(nftArray);
  });
  document.addEventListener('nftMarker', (ev) => {
    //console.log( ev.detail.nftPoints.$$.ptr );
   })
  arfset.display();
});
