mergeInto(LibraryManager.library, {
    writeFP: function(x,y) {
        document.addEventListener(
            'imageEv', function() {
        const canvas = document.getElementById('iSet');
        const context = canvas.getContext('2d');
        const centerX = x;
        const centerY = y;
        const radius = 10;
        context.beginPath();
        context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
        context.lineWidth = 2;
        context.strokeStyle = '#34FF19';
        context.stroke();
        })

    },
    writeFS: function(x,y) {
        document.addEventListener(
            'imageEv', function() {
        const canvas = document.getElementById('iSet');
        const context = canvas.getContext('2d');
        const centerX = x;
        const centerY = y;
        const radius = 4;
        context.beginPath();
        context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
        context.lineWidth = 1;
        context.strokeStyle = '#FF0119';
        context.stroke();
        })

    }
});