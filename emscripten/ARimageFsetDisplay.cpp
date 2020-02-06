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
#include <AR2/util.h>
#include <KPM/kpm.h>

//static AR2ImageSetT *imageSet;

struct arFset {
  int id;
  int width = 0;
  int height = 0;
  ARUint8 *videoFrame = NULL;
	int videoFrameSize;
  AR2ImageSetT *imageSet = NULL;
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
