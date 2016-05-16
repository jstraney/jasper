/* global namespace jas*/
jas.State.addState("main",
  function init () {
    jas.Asset.newImage("player", "res/images/player.png", function () {
      // define a new class based on sprite
      jas.Entity.newClass("player", function (mutator) {
        var instance = this.sprite(mutator); // 'this' is Entity with capital E
        var mutator = mutator? mutator: {};
        instance.spd = mutator.spd? mutator.spd: 2;
        var lastHit = Date.now();
        
        return instance;
      });
      
      // add a new entity of type 'player'
      jas.Entity.addEntity(jas.Entity.inst("player", {
        x: 32,
        y: 32,
        w: 32,
        h: 32,
        imageId: "player",
        animations: [
          { name: "sd", start: 0, stop: 1, def: true}, 
          { name: "wd", start: 0, stop : 8, looping: true},
          { name: "wu", start: 8, stop : 16, looping: true},
          { name: "su", start: 8, stop : 9, looping: true},
          { name: "wr", start: 16, stop : 24, looping: true},
          { name: "sr", start: 16, stop : 17, looping: true},
          { name: "wl", start: 24, stop : 32, looping: true},
          { name: "sl", start: 24, stop : 25, looping: true}
        ]
      }), 'player');
      
    });
    
    jas.Event.addPublication("pickUpFruit");
    
    jas.Asset.newImage("fruit", "res/images/fruit.png", function () {
      jas.Entity.newClass("fruit", function (mutator) {
        mutator = mutator || {};
        mutator.w = 32;
        mutator.h = 32;
        
        var instance = this.sprite(mutator);
        
        var points = mutator.points;
        
        instance.pickup = function() {
          jas.Event.publish("pickUpFruit", {points: points, id: instance.id});
        };

        return instance;
      });
      
      jas.Entity.newClass("cherry", function (mutator) {
        mutator.points = 20;
        mutator.imageId = "fruit";
        var instance = this.fruit(mutator);
        return instance;
      });
      
      jas.Entity.newClass("strawberry", function (mutator) {
        mutator.points = 80;
        mutator.imageId = "fruit";
        mutator.animations = [{name: "still", start: 1, stop: 2, def: true}];
        var instance = this.fruit(mutator);
        return instance;
      });
      
      jas.Entity.newClass("watermellon", function (mutator) {
        mutator.points = 160;
        mutator.imageId = "fruit";
        mutator.animations = [{name: "still", start: 18, stop: 19, def: true}];
        var instance = this.fruit(mutator);
        return instance;
      });
      
      var fruitSpawnZone = jas.Entity.inst("spawnZone", {
        x: 32,
        y: 32,
        w: 256,
        h: 256,
        spawnType: "cherry",
        spawnMutator: {h: 32, w: 32},
        spawnRate: 3000,
        spawnPosition: "random",
        spawnMax: 5,
        spawnGroup: "fruit"
      });
      
      jas.Event.subscribe("pickUpFruit", "fruitSpawnZone", function (fruit) {
        fruitSpawnZone.removeSpawnById(fruit.id);
        console.log(fruit.points + " points!!!");
      });
      
      
      jas.Entity.addEntity( fruitSpawnZone, "spawnZones");
      
      
    });
    
    
    
    // get map data
    jas.Asset.getMapData("map", "res/data/map-alt.tmx", function (mapData) {
      // when the data is parsed get the image
      jas.Asset.newImage("tiles", "res/images/tileSet.png").then(function(){
        // when the image is done make an entity from the data
        mapData.imageId = "tiles";
        var map = jas.Entity.addEntity(jas.Entity.inst("map", mapData), "map");

        // initialize the maps tiles
        map.makeTiles();
      });
    });
    
    
  },
  
  function update (delta, Controller) {
    var keys = Controller.keys;
    var p,
        map,
        cherries;
        
    var walls, activeTiles;
    
    jas.Entity.getFirst("spawnZones", function (cherrySpawn) {
      cherrySpawn.spawn();
    });
    
    if (map = jas.Entity.getMap("map")) {
      walls = map.layers.walls.tiles;
      activeTiles = map.layers.active_tiles.tiles;
      
    }
    
    // get and update player
    jas.Entity.getFirst("player", function (instance) {
      p = instance;
      
      p.updateAnim();
      
      if (Controller.keysNotPressed(["UP", "RIGHT", "DOWN", "LEFT"])) {
        switch(p.getAnimId()) {
          case "wu":
            p.setAnim("su");
            break;
          case "wr":
            p.setAnim("sr");
            break;
          case "wd":
            p.setAnim("sd");
            break;
          case "wl":
            p.setAnim("sl");
            break;
        }  
      }
      else {
        
        Controller.isKeyDown("UP", function() {
          p.moveUp();
          p.setAnim("wu");
        });
        Controller.isKeyDown("RIGHT", function() {
          p.moveRight();
          p.setAnim("wr");
        })
        Controller.isKeyDown("DOWN", function() {
          p.moveDown();
          p.setAnim("wd");
        });
        Controller.isKeyDown("LEFT", function() {
          p.moveLeft();
          p.setAnim("wl");
        });
      }

      jas.Entity.getFirst("map", function (map) {
        map.getEntityLayer("walls", function (wall) {
          wall.isColliding(p, function () {
            p.collide();
          });
        });
      });
      
      
      jas.Entity.getGroup("fruit", function(cherry) {
        cherry.isColliding(p, function () {
          cherry.pickup();
        });
      });
      
    });
  },
  
  function render (Graphics) {
    Graphics.fillScreen("#088");
    
    Graphics.renderGroupLayer("map", "floor");
    Graphics.renderGroup("fruit");
    Graphics.renderGroup("player");
    Graphics.renderGroupLayer("map", "walls");
    
  }
);


jas.init("game-frame");
jas.begin();

