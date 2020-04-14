#include <emscripten/bind.h>

using namespace emscripten;

EMSCRIPTEN_BINDINGS(constant_bindings) {

  function("setup", &setup);
  function("_readNFTMarker", &readNFTMarker);

  value_object<nftMarker>("nftMarker")
  .field("width", &nftMarker::widthNFT)
  .field("height", &nftMarker::heightNFT)
  .field("dpi", &nftMarker::dpiNFT);
}
