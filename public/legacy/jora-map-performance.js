(function () {
  'use strict';
  if (!window.L || window.L._joraMapPerformance) return;
  window.L._joraMapPerformance = true;
  L.Map.mergeOptions({ preferCanvas: true, zoomAnimation: false, fadeAnimation: false, markerZoomAnimation: false });
  var originalTileLayer = L.tileLayer;
  L.tileLayer = function (url, options) {
    options = Object.assign({ updateWhenIdle: true, updateWhenZooming: false, keepBuffer: 0, detectRetina: false }, options || {});
    return originalTileLayer.call(L, url, options);
  };
}());
