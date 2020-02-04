#include <emscripten/bind.h>

using namespace emscripten;

EMSCRIPTEN_BINDINGS(constant_bindings) {

  function("getIsetWidth", &getIsetWidth, allow_raw_pointers());
//  function("readImageSet", &readImageSet);

}
