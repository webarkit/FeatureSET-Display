#include <emscripten/bind.h>

using namespace emscripten;

EMSCRIPTEN_BINDINGS(constant_bindings) {

  function("_getIsetWidth", &getIsetWidth);
//  function("readImageSet", &readImageSet);
  function("setup", &setup);
  function("_readNFTMarker", &readNFTMarker);

}
