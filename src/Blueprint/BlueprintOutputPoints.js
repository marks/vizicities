/* globals window, _, VIZI, THREE */
(function() {
  "use strict";

/**
 * Blueprint debug points output
 * @author Robin Hawkes - vizicities.com
 * @author Mark Silverberg - mark.silverberg@socrata.com
 */  

  // output: {
  //   type: "BlueprintOutputPoints",
  //   options: {name: 'My layer', defaultColor: 0xff0000}
  // }
  VIZI.BlueprintOutputPoints = function(options) {
    var self = this;

    VIZI.BlueprintOutput.call(self, options);

    _.defaults(self.options, {
      name: "Points",
      defaultColor: 0xff0000,
      width: 40,
      height: 1000,
      depth: 40
    });

    // Triggers and actions reference
    self.triggers = [
      {name: "initialised", arguments: []}
    ];

    self.actions = [
      {name: "outputPoints", arguments: ["data"]}
    ];

    self.name = self.options.name;

    self.world;
  };

  VIZI.BlueprintOutputPoints.prototype = Object.create( VIZI.BlueprintOutput.prototype );

  // Initialise instance and start automated processes
  VIZI.BlueprintOutputPoints.prototype.init = function() {
    var self = this;

    self.emit("initialised");
  };

  // {
  //   coordinates: [lon, lat]
  // }
  VIZI.BlueprintOutputPoints.prototype.outputPoints = function(data) {
    var self = this;

    var barGeom = new THREE.BoxGeometry( self.options.width, 1, self.options.depth );

    // Shift each vertex by half the bar height
    // This means it will scale from the bottom rather than the centre
    var vertices = barGeom.vertices;
    for (var v = 0; v < vertices.length; v++) {
      vertices[v].y += 0.5;
    }


    _.each(data, function(point) {

      var combinedGeom = new THREE.Geometry();

      if(point.properties.color === undefined){
        point.properties.color = self.options.defaultColor
      }

      var material = new THREE.MeshBasicMaterial({
        color: point.properties.color,
        // vertexColors: THREE.VertexColors,
        // ambient: 0xffffff,
        // emissive: 0xcccccc,
        shading: THREE.FlatShading
      });


      var coords = point.coordinates;

      var offset = new VIZI.Point();

      var geoCoord = self.world.project(new VIZI.LatLon(coords[1], coords[0]));

      offset.x = -1 * geoCoord.x;
      offset.y = -1 * geoCoord.y;

      // TODO: Get this from options
      var height = self.options.height;

      var mesh = new THREE.Mesh(barGeom);

      mesh.scale.y = height;

      // Offset
      mesh.position.x = -1 * offset.x;
      mesh.position.z = -1 * offset.y;

      // Flip as they are up-side down
      // mesh.rotation.x = 90 * Math.PI / 180;

      mesh.matrixAutoUpdate && mesh.updateMatrix();
      combinedGeom.merge(mesh.geometry, mesh.matrix);

      // Move merged geom to 0,0 and return offset
      var offset = combinedGeom.center();

      var combinedMesh = new THREE.Mesh(combinedGeom, material);

      // Use previously calculated offset to return merged mesh to correct position
      // This allows frustum culling to work correctly
      combinedMesh.position.x = -1 * offset.x;

      // Removed for scale center to be correct
      // Offset with applyMatrix above
      combinedMesh.position.y = -1 * offset.y;

      combinedMesh.position.z = -1 * offset.z;

      self.add(combinedMesh);

    });

  };

  VIZI.BlueprintOutputPoints.prototype.onAdd = function(world) {
    var self = this;
    self.world = world;
    self.init();
  };
}());