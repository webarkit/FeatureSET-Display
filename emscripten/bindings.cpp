#include <emscripten/bind.h>

using namespace emscripten;

EMSCRIPTEN_BINDINGS(constant_bindings) {

  function("getIsetWidth", &getIsetWidth);
//  function("readImageSet", &readImageSet);

}
