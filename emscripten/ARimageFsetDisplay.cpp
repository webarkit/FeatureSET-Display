/*
 *  ARimageFsetDisplay.cpp
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

#include <AR/ar.h>
#include <AR2/config.h>
#include <AR2/featureSet.h>
#include <AR2/imageFormat.h>
#include <AR2/imageSet.h>
#include <AR2/tracking.h>
#include <AR2/util.h>
#include <KPM/kpm.h>
#include <emscripten.h>
#include <stdio.h>
#include <string>
#include <unordered_map>
#include <vector>

#define PAGES_MAX                                                              \
  10 // Maximum number of pages expected. You can change this down (to save
     // memory) or up (to accomodate more pages.)

struct nftPoint {
  int x;
  int y;
};

struct nftMarker {
  int widthNFT;
  int heightNFT;
  int dpiNFT;
  int numFsets;
  int numFpoints;
  int imgBWsize;
  int nftFeaturePoints;
  std::vector<nftPoint> nftPoints;
  std::vector<nftPoint> nftFsetPoints;
  int pointer;
};

struct arFset {
  int id = 0;
  int width = 0;
  int height = 0;
  ARUint8 *videoFrame = NULL;
  ARUint8 *imgBW = NULL;
  int videoFrameSize = 0;
  int imgBWsize = 0;
  AR2ImageSetT *imageSet = NULL;
  AR2SurfaceSetT *surfaceSet[PAGES_MAX] = {};
  KpmRefDataSet *refDataSet = NULL;
  int width_NFT = 0;
  int height_NFT = 0;
  int dpi_NFT = 0;
  int num_F_set_NFT = 0;    // number of Feature sets
  int num_F_points_NFT = 0; // number of Feature points
  AR2FeaturePointsT *F_points_NFT = NULL;
  int surfaceSetCount = 0;  // Running NFT marker id
};

std::unordered_map<int, arFset> arFsets;

static int ARFSET_NOT_FOUND = -1;
static int gARFsetID = 0;

extern "C" {

int loadNFTMarker(arFset *arc, int surfaceSetCount,
                  const char *datasetPathname) {
  int i, pageNo, numIset, width, height, dpi;

  if (surfaceSetCount >= PAGES_MAX) {
    ARLOGe("Cannot load more than %d NFT markers\n", PAGES_MAX);
    return FALSE;
  }

  // Load AR2 data.
  ARLOGi("Reading %s.fset\n", datasetPathname);

  if ((arc->surfaceSet[surfaceSetCount] =
           ar2ReadSurfaceSet(datasetPathname, "fset", NULL)) == NULL) {
    ARLOGe("Error reading data from %s.fset\n", datasetPathname);
    return FALSE;
  }

  numIset = arc->surfaceSet[surfaceSetCount]->surface[0].imageSet->num;
  arc->width_NFT =
      arc->surfaceSet[surfaceSetCount]->surface[0].imageSet->scale[0]->xsize;
  arc->height_NFT =
      arc->surfaceSet[surfaceSetCount]->surface[0].imageSet->scale[0]->ysize;
  arc->dpi_NFT =
      arc->surfaceSet[surfaceSetCount]->surface[0].imageSet->scale[0]->dpi;
  arc->num_F_set_NFT =
      arc->surfaceSet[surfaceSetCount]->surface[0].featureSet[0].num;
  arc->num_F_points_NFT =
      arc->surfaceSet[surfaceSetCount]->surface[0].featureSet[0].list[0].num;
  arc->F_points_NFT =
      &arc->surfaceSet[surfaceSetCount]->surface[0].featureSet[0].list[0];
  arc->imgBW =
      arc->surfaceSet[surfaceSetCount]->surface[0].imageSet->scale[0]->imgBW;

  ARLOGi("printing pointer imgBW: %p\n", (void *)arc->imgBW);

  ARLOGi("NFT number of ImageSet: %i\n", numIset);
  ARLOGi("NFT marker width: %i\n", arc->width_NFT);
  ARLOGi("NFT marker height: %i\n", arc->height_NFT);
  ARLOGi("NFT marker dpi: %i\n", arc->dpi_NFT);
  ARLOGi("NFT number of Feature sets: %i\n", arc->num_F_set_NFT);
  ARLOGi("NFT number of feature points: %d\n", arc->num_F_points_NFT);
  ARLOGi("NFT Point x coord: %d\n", arc->F_points_NFT->coord[0].x);
  ARLOGi("NFT Point y coord: %d\n", arc->F_points_NFT->coord[0].y);
  ARLOGi("imgBW filled\n");

  ARLOGi("  Done.\n");

  ARLOGi("Read FeatureSet3.\n");
  kpmLoadRefDataSet( datasetPathname, "fset3", &arc->refDataSet );
  if( arc->refDataSet == NULL ) {
      ARLOGe("file open error: %s.fset3\n", datasetPathname );
      return FALSE;
  }
  ARLOGi("  end.\n");
  ARLOGi("num = %d\n", arc->refDataSet->num);

  ARLOGi("imgsizePointer: %d\n", arc->imgBWsize);

  ARLOGi("Loading of NFT data complete.\n");
  return (TRUE);
}

nftMarker readNFTMarker(int id, std::string datasetPathname) {
  nftMarker nft;
  if (arFsets.find(id) == arFsets.end()) {
    return nft;
  }
  arFset *arc = &(arFsets[id]);

  // Load marker(s).
  int patt_id = arc->surfaceSetCount;
  if (!loadNFTMarker(arc, patt_id, datasetPathname.c_str())) {
    ARLOGe("ARimageFsetDisplay(): Unable to read NFT marker.\n");
    return nft;
  } else {
    ARLOGi("Passing the imgBW pointer: %p\n", (void *)arc->imgBW);
  }

  arc->surfaceSetCount++;

  nft.nftPoints.reserve(arc->num_F_points_NFT);
  for (int i = 0; i < arc->num_F_points_NFT; i++) {
    nftPoint p;
    p.x = arc->F_points_NFT->coord[i].x;
    p.y = arc->F_points_NFT->coord[i].y;
    nft.nftPoints.push_back(p);
  }

  nft.nftFsetPoints.reserve(arc->refDataSet->num);
  for (int i = 0; i < arc->refDataSet->num; i++) {
    nftPoint p;
    p.x = arc->refDataSet->refPoint[i].coord2D.x;
    p.y = arc->refDataSet->refPoint[i].coord2D.y;
    nft.nftFsetPoints.push_back(p);
  }

  nft.widthNFT = arc->width_NFT;
  nft.heightNFT = arc->height_NFT;
  nft.dpiNFT = arc->dpi_NFT;
  nft.numFsets = arc->num_F_set_NFT;
  nft.numFpoints = arc->num_F_points_NFT;
  nft.imgBWsize = arc->imgBWsize;
  nft.nftFeaturePoints = (int)arc->F_points_NFT;
  nft.pointer = (int)arc->imgBW;

  return nft;
}

int setup(int width, int height) {
  int id = gARFsetID++;
  arFset *arc = &(arFsets[id]);
  arc->id = id;
  arc->imgBWsize = width * height * 4 * sizeof(ARUint8);
  // imgBW and F_points_NFT are filled in by loadNFTMarker from the loaded
  // surface set, so we don't allocate them here.
  arc->imgBW = NULL;
  arc->F_points_NFT = NULL;

  ARLOGi("Reserved imgBWsize %d\n", arc->imgBWsize);

  return arc->id;
}
}

#include "bindings.cpp"
