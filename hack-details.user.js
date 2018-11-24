// ==UserScript==
// @id             iitc-plugin-hack-details@randomizax
// @name           IITC plugin: Portal Hack Details
// @category       Layer
// @version        1.0.0.20181124.13837
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      https://rawgit.com/randomizax/hack-details/latest/hack-details.meta.js
// @downloadURL    https://rawgit.com/randomizax/hack-details/latest/hack-details.user.js
// @description    [randomizax-2018-11-24-013837] Show portal hack details on map.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @include        https://intel.ingress.com/intel*
// @include        http://intel.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @match          https://intel.ingress.com/intel*
// @match          http://intel.ingress.com/intel*
// @grant          none
// ==/UserScript==


function wrapper(plugin_info) {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};

//PLUGIN AUTHORS: writing a plugin outside of the IITC build environment? if so, delete these lines!!
//(leaving them in place might break the 'About IITC' page or break update checks)
// plugin_info.buildName = 'randomizax';
// plugin_info.dateTimeVersion = '20181124.13837';
// plugin_info.pluginId = 'hack-details';
//END PLUGIN AUTHORS NOTE



// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.portalHackDetails = function() {
};

window.plugin.portalHackDetails.ICON_SIZE = 12;
window.plugin.portalHackDetails.MOBILE_SCALE = 1.5;

window.plugin.portalHackDetails.levelLayers = {};
window.plugin.portalHackDetails.levelLayerGroup = null;

window.plugin.portalHackDetails.setupCSS = function() {
  $("<style>")
    .prop("type", "text/css")
    .html(".plugin-hack-details {\
            font-size: 12px;\
            color: #802266;\
            font-family: sans-serif;\
            text-align: left;\
            text-shadow: 0 0 0.5em lightyellow, 0 0 0.5em lightyellow, 0 0 0.5em lightyellow,  0 0 0.5em lightyellow;\
            pointer-events: none;\
            -webkit-text-size-adjust:none;\
          }")
  .appendTo("head");
}

window.plugin.portalHackDetails.removeLabel = function(guid) {
  var previousLayer = window.plugin.portalHackDetails.levelLayers[guid];
  if(previousLayer) {
    window.plugin.portalHackDetails.levelLayerGroup.removeLayer(previousLayer);
    delete plugin.portalHackDetails.levelLayers[guid];
  }
}

window.plugin.portalHackDetails.addLabel = function(guid) {
  if (!map.hasLayer(window.plugin.portalHackDetails.levelLayerGroup)) {
    return;
  }

  // remove old layer before updating
  window.plugin.portalHackDetails.removeLabel(guid);

  // add portal hack details to layers
  var d = window.portalDetail.get(guid);
  var latLng = window.portals[guid].getLatLng();
  if (!d) return;
  var hackDetails = window.getPortalHackDetails(d);
  var shortHackInfo = hackDetails.hacks+'@'+formatInterval(hackDetails.cooldown);
  if (shortHackInfo == '4@5m') shortHackInfo = '-';
  shortHackInfo = shortHackInfo.replace(' ', '');
  var level = L.marker(latLng, {
    icon: L.divIcon({
      className: 'plugin-hack-details',
      iconSize: [window.plugin.portalHackDetails.ICON_SIZE * 10, window.plugin.portalHackDetails.ICON_SIZE],
      iconAnchor: [-window.plugin.portalHackDetails.ICON_SIZE/2, -window.plugin.portalHackDetails.ICON_SIZE/2],
      html: shortHackInfo
      }),
    guid: guid
  });
  plugin.portalHackDetails.levelLayers[guid] = level;
  level.addTo(plugin.portalHackDetails.levelLayerGroup);
}

window.plugin.portalHackDetails.updatePortalLabels = function() {
  // as this is called every time layers are toggled, there's no point in doing it when the layer is off
  if (!map.hasLayer(window.plugin.portalHackDetails.levelLayerGroup)) {
    return;
  }
  var portalPoints = {};
  var count = 0;

  var displayBounds = map.getBounds();

  for (var guid in window.portals) {
    var p = window.portals[guid];
    if (p._map && displayBounds.contains(p.getLatLng())) {
      var point = map.project(p.getLatLng());
      portalPoints[guid] = point;
      count += 1;
    }
  }

  // and add those we do
  for (var guid in portalPoints) {
    window.plugin.portalHackDetails.addLabel(guid);
  }
}

// as calculating portal marker visibility can take some time when there's lots of portals shown, we'll do it on
// a short timer. this way it doesn't get repeated so much
window.plugin.portalHackDetails.delayedUpdatePortalLabels = function(wait) {

  if (window.plugin.portalHackDetails.timer === undefined) {
    window.plugin.portalHackDetails.timer = setTimeout ( function() {
      window.plugin.portalHackDetails.timer = undefined;
      window.plugin.portalHackDetails.updatePortalLabels();
    }, wait*1000);

  }
}

var setup = function() {

  window.plugin.portalHackDetails.setupCSS();

  window.plugin.portalHackDetails.levelLayerGroup = new L.LayerGroup();
  window.addLayerGroup('Portal Hack', window.plugin.portalHackDetails.levelLayerGroup, true);

  window.addHook('requestFinished', function() { setTimeout(function(){window.plugin.portalHackDetails.delayedUpdatePortalLabels(3.0);},1); });
  window.addHook('mapDataRefreshEnd', function() { window.plugin.portalHackDetails.delayedUpdatePortalLabels(0.5); });
  window.map.on('overlayadd overlayremove', function() { setTimeout(function(){window.plugin.portalHackDetails.delayedUpdatePortalLabels(1.0);},1); });
  window.addHook('portalDetailsUpdated', function(ev) { window.plugin.portalHackDetails.addLabel(ev.guid); });

}

// PLUGIN END //////////////////////////////////////////////////////////


setup.info = plugin_info; //add the script info data to the function as a property
if(!window.bootPlugins) window.bootPlugins = [];
window.bootPlugins.push(setup);
// if IITC has already booted, immediately run the 'setup' function
if(window.iitcLoaded && typeof setup === 'function') setup();
} // wrapper end
// inject code into site context
var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
(document.body || document.head || document.documentElement).appendChild(script);


