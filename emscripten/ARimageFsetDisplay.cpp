#include <stdio.h>
#include <string>
#include <vector>
#include <unordered_map>
#include <emscripten.h>
#include <AR/ar.h>
#include <AR2/config.h>
#include <AR2/imageFormat.h>
#include <AR2/imageSet.h>
#include <AR2/featureSet.h>
#include <AR2/tracking.h>
#include <AR2/util.h>
#include <KPM/kpm.h>

#define PAGES_MAX               10          // Maximum number of pages expected. You can change this down (to save memory) or up (to accomodate more pages.)

struct arFset {
  int id;
  int width = 0;
  int height = 0;
  ARUint8 *videoFrame = NULL;
	int videoFrameSize;
  AR2ImageSetT *imageSet = NULL;
  AR2SurfaceSetT      *surfaceSet[PAGES_MAX];
  int width_NFT;
	int height_NFT;
	int dpi_NFT;
  int surfaceSetCount = 0; // Running NFT marker id
};

std::unordered_map<int, arFset> arFsets;

static int ARFSET_NOT_FOUND = -1;
static int gARFsetID = 0;

extern "C" {

  int getIsetWidth(int id, std::string datasetPathname){
    if (arFsets.find(id) == arFsets.end()) { return ARFSET_NOT_FOUND; }
		arFset *arc = &(arFsets[id]);

    int width;

    ARLOGi("datasetPathname is: %s\n", datasetPathname.c_str());

    char * filename = new char[datasetPathname.size() + 1];
    std::copy(datasetPathname.begin(), datasetPathname.end(), filename);
    filename[datasetPathname.size()] = '\0';

    ARLOGi("filename is: %s\n", filename);
    if( filename == NULL ){
      ARLOGe("Missed filename in the args!\n");
      return 0;
    }
    ARLOGi("Init reading .iset \n");
    if(filename){

      ARLOGi("Read ImageSet.\n");
      ar2UtilRemoveExt( filename );
      arc->imageSet = ar2ReadImageSet( filename );
      ARLOGi("image set is: %s\n", arc->imageSet);
      if( arc->imageSet == NULL ) {
          ARLOGe("file open error: %s.iset\n", filename );
          exit(0);
      }
      ARLOGi("  end.\n");
    }

    width = arc->imageSet->scale[0]->xsize;

    ARLOGi("Marker width is: &d\n");

    delete[] filename;

    return width;

  }


  /*AR2ImageSetT  *  readImageSet(char *filename){
    //AR2ImageSetT            *imageSet;
    //filename = "data/pinball.iset";
    ARLOGi("filename is: %s\n", filename);
    if( filename == NULL ){
      ARLOGe("Missed filename in the args!\n");
      return 0;
    }
    ARLOGi("Init reading .iset \n");
    if(filename){

      ARLOGi("Read ImageSet.\n");
      ar2UtilRemoveExt( filename );
      imageSet = ar2ReadImageSet( filename );
      ARLOGi("image set is: %s\n", imageSet);
      if( imageSet == NULL ) {
          ARLOGe("file open error: %s.iset\n", filename );
          exit(0);
      }
      ARLOGi("  end.\n");
    }

    return imageSet;

  }*/

  int loadNFTMarker(arFset *arc, int surfaceSetCount, const char* datasetPathname) {
		int i, pageNo, numIset, width, height, dpi;

		// Load AR2 data.
		ARLOGi("Reading %s.fset\n", datasetPathname);

		if ((arc->surfaceSet[surfaceSetCount] = ar2ReadSurfaceSet(datasetPathname, "fset", NULL)) == NULL ) {
		    ARLOGe("Error reading data from %s.fset\n", datasetPathname);
		}

		numIset = arc->surfaceSet[surfaceSetCount]->surface[0].imageSet->num;
		arc->width_NFT = arc->surfaceSet[surfaceSetCount]->surface[0].imageSet->scale[0]->xsize;
		arc->height_NFT = arc->surfaceSet[surfaceSetCount]->surface[0].imageSet->scale[0]->ysize;
		arc->dpi_NFT = arc->surfaceSet[surfaceSetCount]->surface[0].imageSet->scale[0]->dpi;

		ARLOGi("NFT num. of ImageSet: %i\n", numIset);
		ARLOGi("NFT marker width: %i\n", arc->width_NFT);
		ARLOGi("NFT marker width: %i\n", arc->height_NFT);
		ARLOGi("NFT marker dpi: %i\n", arc->dpi_NFT);

		ARLOGi("  Done.\n");

	  if (surfaceSetCount == PAGES_MAX) exit(-1);

		ARLOGi("Loading of NFT data complete.\n");
		return (TRUE);
	}

  int readNFTMarker(int id, std::string datasetPathname) {
		if (arFsets.find(id) == arFsets.end()) { return -1; }
		arFset *arc = &(arFsets[id]);

		// Load marker(s).
		int patt_id = arc->surfaceSetCount;
		if (!loadNFTMarker(arc, patt_id, datasetPathname.c_str())) {
			ARLOGe("ARimageFsetDisplay(): Unable to read NFT marker.\n");
			return -1;
		}

		arc->surfaceSetCount++;

		return patt_id;
	}

  int setup(int width, int height){
    int id = gARFsetID++;
		arFset *arc = &(arFsets[id]);
		arc->id = id;

    arc->width = width;
		arc->height = height;

		arc->videoFrameSize = width * height * 4 * sizeof(ARUint8);
		arc->videoFrame = (ARUint8*) malloc(arc->videoFrameSize);
    arc->imageSet = (AR2ImageSetT*) malloc(arc->videoFrameSize);

    ARLOGi("Allocated videoFrameSize %d\n", arc->videoFrameSize);

    EM_ASM_({
			if (!arfset["frameMalloc"]) {
				arfset["frameMalloc"] = ({});
			}
			var frameMalloc = arfset["frameMalloc"];
			frameMalloc["framepointer"] = $1;
			frameMalloc["frameIsetpointer"] = $2;
      frameMalloc["framesize"] = $3;
		},
			arc->id,
			arc->videoFrame,
      arc->imageSet,
			arc->videoFrameSize
		);

		return arc->id;
  }

}

#include "bindings.cpp"
