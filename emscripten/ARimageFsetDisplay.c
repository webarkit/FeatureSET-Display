#ifdef _WIN32
#include <windows.h>
#  define truncf(x) floorf(x) // These are the same for positive numbers.
#endif
#include <emscripten/emscripten.h>
#include <stdio.h>
#include <string.h>
#include <AR/ar.h>
#include <AR2/config.h>
#include <AR2/imageFormat.h>
#include <AR2/imageSet.h>
#include <AR2/featureSet.h>
#include <AR2/util.h>
#include <KPM/kpm.h>

static AR2ImageSetT *imageSet;

int EMSCRIPTEN_KEEPALIVE getIsetWidth(const char *filename){
  //AR2ImageSetT            *imageSet;
  int width;
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

  width = imageSet->scale[0]->xsize;

  ARLOGi("Marker width is: &d\n");

  return width;

}


AR2ImageSetT  * EMSCRIPTEN_KEEPALIVE readImageSet(char *filename){
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

}
