

Module["onRuntimeInitialized"] = function() {
    var event = new Event('FeatureSETDisplay-loaded');
    window.dispatchEvent(event);
}
