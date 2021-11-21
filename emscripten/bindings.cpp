/*
 *  bindings.cpp
 *  FeatureSet-Display
 *
 *  This file is part of FeatureSet-Display - WebARKit.
 *
 *  FeatureSet-Display is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Lesser General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  FeatureSet-Display is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Lesser General Public License for more details.
 *
 *  You should have received a copy of the GNU Lesser General Public License
 *  along with FeatureSet-Display.  If not, see <http://www.gnu.org/licenses/>.
 *
 *  As a special exception, the copyright holders of this library give you
 *  permission to link this library with independent modules to produce an
 *  executable, regardless of the license terms of these independent modules, and to
 *  copy and distribute the resulting executable under terms of your choice,
 *  provided that you also meet, for each linked independent module, the terms and
 *  conditions of the license of that module. An independent module is a module
 *  which is neither derived from nor based on this library. If you modify this
 *  library, you may extend this exception to your version of the library, but you
 *  are not obligated to do so. If you do not wish to do so, delete this exception
 *  statement from your version.
 *
 *  Copyright 2021 WebARKit.
 *
 *  Author(s): Walter Perdan @kalwalt https://github.com/kalwalt
 *
 */

#include <emscripten/bind.h>

using namespace emscripten;

EMSCRIPTEN_BINDINGS(constant_bindings) {

  function("setup", &setup);
  function("_readNFTMarker", &readNFTMarker);

  value_object<nftMarker>("nftMarker")
  .field("width", &nftMarker::widthNFT)
  .field("height", &nftMarker::heightNFT)
  .field("dpi", &nftMarker::dpiNFT)
  .field("numFsets", &nftMarker::numFsets)
  .field("numFpoints", &nftMarker::numFpoints)
  .field("imgBWsize", &nftMarker::imgBWsize)
  .field("nftFeaturePoints", &nftMarker::nftFeaturePoints)
  .field("nftPoints", &nftMarker::nftPoints)
  .field("pointer", &nftMarker::pointer);

  value_array<nftPoint>("nftPoint")
  .element(&nftPoint::x)
  .element(&nftPoint::y);
  

  register_vector<nftPoint>("vector<nftPoint>");
}
