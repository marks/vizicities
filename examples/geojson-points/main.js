var world = new VIZI.World({
  viewport: document.querySelector("#vizicities-viewport"),
  layersUI: true,
  picking: true,
  center: new VIZI.LatLon(38.9966, -77.0304) // Silver Spring, MD
});

var controls = new VIZI.ControlsMap(world.camera, {
  viewport: world.options.viewport
});

var pickControls = new VIZI.ControlsMousePick(world.camera, {
  scene: world.scene
});

var descriptionUI = new VIZI.DescriptionUI({
  title: "Basic Points from GeoJSON",
  body: "This is a basic example showing a 2D basemap, 3D building tiles and plotted points from a GeoJSON payload."
});

var mapConfig = {
  input: {
    type: "BlueprintInputMapTiles",
    options: {
      tilePath: "https://a.tiles.mapbox.com/v3/examples.map-i86l3621/{z}/{x}/{y}@2x.png"
    }
  },
  output: {
    type: "BlueprintOutputImageTiles",
    options: {
      grids: [{
        zoom: 19,
        tilesPerDirection: 3,
        cullZoom: 17
      }, {
        zoom: 18,
        tilesPerDirection: 3,
        cullZoom: 16
      }, {
        zoom: 17,
        tilesPerDirection: 3,
        cullZoom: 15
      }, {
        zoom: 16,
        tilesPerDirection: 3,
        cullZoom: 14
      }, {
        zoom: 15,
        tilesPerDirection: 3,
        cullZoom: 13
      }, {
        zoom: 14,
        tilesPerDirection: 3,
        cullZoom: 12
      }, {
        zoom: 13,
        tilesPerDirection: 5,
        cullZoom: 11
      }]
    }
  },
  triggers: [{
    triggerObject: "output",
    triggerName: "initialised",
    triggerArguments: ["tiles"],
    actionObject: "input",
    actionName: "requestTiles",
    actionArguments: ["tiles"],
    actionOutput: {
      tiles: "tiles" // actionArg: triggerArg
    }
  }, {
    triggerObject: "output",
    triggerName: "gridUpdated",
    triggerArguments: ["tiles"],
    actionObject: "input",
    actionName: "requestTiles",
    actionArguments: ["tiles"],
    actionOutput: {
      tiles: "tiles" // actionArg: triggerArg
    }
  }, {
    triggerObject: "input",
    triggerName: "tileReceived",
    triggerArguments: ["image", "tile"],
    actionObject: "output",
    actionName: "outputImageTile",
    actionArguments: ["image", "tile"],
    actionOutput: {
      image: "image", // actionArg: triggerArg
      tile: "tile"
    }
  }]
};

var switchboardMap = new VIZI.BlueprintSwitchboard(mapConfig);
switchboardMap.addToWorld(world);

var buildingsConfig = {
  input: {
    type: "BlueprintInputGeoJSON",
    options: {
      tilePath: "http://vector.mapzen.com/osm/buildings/{z}/{x}/{y}.json"
    }
  },
  output: {
    type: "BlueprintOutputBuildingTiles",
    options: {
      grids: [{
        zoom: 15,
        tilesPerDirection: 1,
        cullZoom: 13
      }],
      workerURL: "../../build/vizi-worker.min.js"
    }
  },
  triggers: [{
    triggerObject: "output",
    triggerName: "initialised",
    triggerArguments: ["tiles"],
    actionObject: "input",
    actionName: "requestTiles",
    actionArguments: ["tiles"],
    actionOutput: {
      tiles: "tiles" // actionArg: triggerArg
    }
  }, {
    triggerObject: "output",
    triggerName: "gridUpdated",
    triggerArguments: ["tiles", "newTiles"],
    actionObject: "input",
    actionName: "requestTiles",
    actionArguments: ["tiles"],
    actionOutput: {
      tiles: "newTiles" // actionArg: triggerArg
    }
  }, {
    triggerObject: "input",
    triggerName: "tileReceived",
    triggerArguments: ["geoJSON", "tile"],
    actionObject: "output",
    actionName: "outputBuildingTile",
    actionArguments: ["buildings", "tile"],
    actionOutput: {
      buildings: {
        process: "map",
        itemsObject: "geoJSON",
        itemsProperties: "features",
        transformation: {
          outline: "geometry.coordinates",
          height: "properties.height",
          minHeight: "properties.min_height"
        }
      },
      tile: "tile"
    }
  }]
};

var switchboardBuildings = new VIZI.BlueprintSwitchboard(buildingsConfig);
switchboardBuildings.addToWorld(world);

d3.json("./data/sample.geojson", function(geoJsonObject){
  // manipulate geoJsonObject object here ... for assigning colors and other attributes, for example
  _.each(geoJsonObject.features, function(point){
    if(point.properties.inspectionresults == "Critical Violations Corrected"){
      point.properties.pointColor = 0xffff00
    } else if(point.properties.inspectionresults == "Facility Closed"){
      point.properties.pointColor = 0xff0000
    } else if(point.properties.inspectionresults == "No Critical Violations Noted"){
      point.properties.pointColor = 0x00ff00
    } else {
      point.properties.pointColor = 0x000000
    }
  });
  var pointsConfig = {
    input: {
      type: "BlueprintInputGeoJSON",
      options: {
        jsObj: geoJsonObject 
      }
    },
    output: {
      type: "BlueprintOutputPoints",
      options: {
        name: "Restauraunt Inspections",
        defaultColor: 0x00ff00,
        width: 5,
        height: 40,
        depth: 5
      }
    },
    triggers: [{
      triggerObject: "output",
      triggerName: "initialised",
      triggerArguments: [],
      actionObject: "input",
      actionName: "requestData",
      actionArguments: [],
      actionOutput: {}
    }, {
      triggerObject: "input",
      triggerName: "dataReceived",
      triggerArguments: ["geoJSON"],
      actionObject: "output",
      actionName: "outputPoints",
      actionArguments: ["data"],
      actionOutput: {
        data: {
          // Loop through each item in trigger.geoJSON and return a new array of processed values (a map)
          process: "map",
          itemsObject: "geoJSON",
          itemsProperties: "features",
          // Return a new object for each item with the given properties
          transformation: {
            coordinates: "geometry.coordinates",
            properties: "properties"
          }
        }
      }
    }]
  };

  var switchboardPoints = new VIZI.BlueprintSwitchboard(pointsConfig);
  switchboardPoints.addToWorld(world);
})

var clock = new VIZI.Clock();

var update = function() {
  var delta = clock.getDelta();

  world.onTick(delta);
  world.render();

  window.requestAnimationFrame(update);
};

update();