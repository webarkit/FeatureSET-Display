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

static AR2ImageSetT            *imageSet;
static int                      page = 0;


int EMSCRIPTEN_KEEPALIVE readImageSet(char *filename, ARUint8 *imageData){
  if( filename == NULL ){
    ARLOGe("Missed filename in the args!");
    return 0;
  }

  if(filename){

    ARLOG("Read ImageSet.\n");
    ar2UtilRemoveExt( filename );
    imageSet = ar2ReadImageSet( filename );
    if( imageSet == NULL ) {
        ARLOGe("file open error: %s.iset\n", filename );
        exit(0);
    }
    ARLOG("  end.\n");
  }

  imageData = imageSet->scale[page]->imgBW;
    return 1;

}
