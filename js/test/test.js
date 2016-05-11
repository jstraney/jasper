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
    
    jas.Asset.newImage("cherry", "res/images/cherry.png", function () {
      jas.Entity.newClass("cherry", function (mutator) {
        mutator = mutator || {};
        mutator.w = 32;
        mutator.h = 32;
        mutator.imageId = "cherry";
        mutator.animations = [
          {name: "still", start: 0, stop: 1, def: true}
        ];
        var instance = this.sprite(mutator);
        var points = 20;
        
        instance.pickUp = function () {
          jas.Event.publish("pickupCherry", instance);
        }
        
        return instance;
      });
    });
    
    jas.Entity.newClass("cherrySpawnZone", function (mutator) {
      mutator = mutator || {};
      mutator.alpha = 0.5;
      mutator.color = "#0f0";
      var instance = this.rect(mutator);
      var spawnRate = mutator.spawnRate;
      var timer = jas.Util.timer(spawnRate, true);
      timer.start();
      
      var maxCherries = 5;
      var cherries = 0;
      instance.spawn = (function () {
        if (cherries < maxCherries) {
          timer.checkTime(function() {
            var ranX = Math.floor(Math.random() * (instance.x + instance.w)) + 1;
            var ranY = Math.floor(Math.random() * (instance.y + instance.h)) + 1;
            jas.Entity.addEntity(jas.Entity.inst("cherry", {x: ranX, y: ranY}), "cherries");
            cherries++;
            
          });
        }
      });
      
      jas.Event.addPublication("pickupCherry");
      jas.Event.subscribe("pickupCherry", "removeCherry", function (cherry) {
        jas.Entity.removeEntity(cherry);
        cherries--;
      });
      
      return instance;
    });
    
    jas.Entity.addEntity(jas.Entity.inst("cherrySpawnZone",
      {x: 32, y: 32, w: 224, h: 224, spawnRate: 5000}),
    "spawnZones");
    
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
        cherySpawn,
        cherries;
        
    var walls, activeTiles;
    
    jas.Entity.getFirst("spawnZones", function (e) {
      cherrySpawn = e;
      cherrySpawn.spawn();
    });
    
    if (map = jas.Entity.getMap("map")) {
      walls = map.layers.walls.tiles;
      activeTiles = map.layers.active_tiles.tiles;
    }
    
    // get and update player
    jas.Entity.getFirst("player", function (e) {
      p = e;
      
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
      
      var checkingWalls = true;
      for (var i in walls) {
        var wall = walls[i];
        p.isColliding(wall, function () {
          p.collide();
        },
        function () {
          
        })
      }
      
      jas.Entity.getGroup("cherries", function(e) {
        e.isColliding(p, function () {
          e.pickUp();
        });
      });
      
    });
  },
  
  function render (Graphics) {
    Graphics.fillScreen("#088");
    Graphics.renderMapLayer("map", "floor");
    Graphics.renderMapLayer("map", "active_tiles");
    Graphics.renderGroup("cherries");
    Graphics.renderGroup("player");
    Graphics.renderMapLayer("map", "walls");
    
  }
);


jas.init("game-frame");
jas.begin();

