window.addEventListener('FeatureSETDisplay-loaded', function () {
  var arfset = new ARfset(893, 1117);
  console.log(arfset);
  arfset.loadNFTMarker('data/pinball', (nft) => { 
    console.log(nft);
    const nftPointsPointer = nft.nftPoints.$$.ptr;
    const nftArray = new Int16Array(Module.HEAP16.buffer, nftPointsPointer, nft.numFpoints * 2);
    console.log(nftArray);
  });
  document.addEventListener('nftMarker', (ev) => {
    console.log( ev.detail.nftPoints.$$.ptr );
   })
  arfset.display();
});
