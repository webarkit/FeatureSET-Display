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
  int pointer;
};

struct nftMarker {
  int widthNFT;
	int heightNFT;
	int dpiNFT;
  int numFsets;
  int numFpoints;
  int imgBWsize;
  int pointer;
};

struct arFset {
  int id = 0;
  int width = 0;
  int height = 0;
  ARUint8 *videoFrame = NULL;
  ARUint8 *imgBW = NULL;
  int videoFrameSize;
  int imgBWsize;
  AR2ImageSetT *imageSet = NULL;
  AR2SurfaceSetT *surfaceSet[PAGES_MAX];
  KpmRefDataSet           *refDataSet;
  int width_NFT;
  int height_NFT;
  int dpi_NFT;
  int num_F_set_NFT;    // number of Feature sets
  int num_F_points_NFT; // number of Feature points
  AR2FeaturePointsT *F_points_NFT;
  int surfaceSetCount = 0; // Running NFT marker id
};

std::unordered_map<int, arFset> arFsets;

static int ARFSET_NOT_FOUND = -1;
static int gARFsetID = 0;

extern "C" {

extern void writeFP(int x, int y);
extern void writeFS(int x, int y);

int loadNFTMarker(arFset *arc, int surfaceSetCount,
                  const char *datasetPathname) {
  int i, pageNo, numIset, width, height, dpi;

  // Load AR2 data.
  ARLOGi("Reading %s.fset\n", datasetPathname);

  if ((arc->surfaceSet[surfaceSetCount] =
           ar2ReadSurfaceSet(datasetPathname, "fset", NULL)) == NULL) {
    ARLOGe("Error reading data from %s.fset\n", datasetPathname);
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

  ARLOGi("printing pointer imgBW: %d\n", arc->imgBW);

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
      exit(0);
  }
  ARLOGi("  end.\n");
  ARLOGi("num = %d\n", arc->refDataSet->num);

  if (surfaceSetCount == PAGES_MAX)
    exit(-1);

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
    ARLOGi("Passing the imgBW pointer: %d\n", (int)arc->imgBW);
  }

  arc->surfaceSetCount++;

  EM_ASM_(
      {
        if (!arfset["frameMalloc"]) {
          arfset["frameMalloc"] = ({});
        }
        var frameMalloc = arfset["frameMalloc"];
        frameMalloc["frameIbwpointer"] = $1;
        frameMalloc["frameimgBWsize"] = $2;
        frameMalloc["frameFeaturePoints"] = $3
      },
      arc->id, arc->imgBW, arc->imgBWsize, arc->F_points_NFT);

  /*for (int i = 0; i < arc->num_F_points_NFT; i++) {
    nft.nftPoints.push_back(nftPoint());
    nft.nftPoints[i].x = arc->F_points_NFT->coord[i].x;
    nft.nftPoints[i].y = arc->F_points_NFT->coord[i].y;
    ARLOGi("points x: %d\n", nft.nftPoints[i].x);
    ARLOGi("points y: %d\n", nft.nftPoints[i].y);
  }*/

  for (int i = 0; i < arc->num_F_points_NFT; i++) {
    writeFP(arc->F_points_NFT->coord[i].x, arc->F_points_NFT->coord[i].y);
  }

  for (int i = 0; i < arc->refDataSet->num; i++) {
    writeFS(arc->refDataSet->refPoint[i].coord2D.x, arc->refDataSet->refPoint[i].coord2D.y);
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
  arc->imgBW = (ARUint8 *)malloc(arc->imgBWsize);
  arc->F_points_NFT = (AR2FeaturePointsT *)malloc(arc->num_F_points_NFT * 2);

  ARLOGi("Allocated imgBWsize %d\n", arc->imgBWsize);

  return arc->id;
}
}

#include "bindings.cpp"
