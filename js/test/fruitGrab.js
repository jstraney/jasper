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
        
        var spd = 1;
        
        var controller = jas.Controller.inst("controller", {
          "UP_DOWN": function () {
            instance.setAnim("wu");
            instance.y -= spd;
          },
          "RIGHT_DOWN": function () {
            instance.setAnim("wr");
            instance.x += spd;
          },
          "DOWN_DOWN": function () {
            instance.setAnim("wd");
            instance.y += spd;
          },
          "LEFT_DOWN": function () {
            instance.setAnim("wl");
            instance.x -= spd;
          },
          "UP_UP": function () {
            if (instance.getAnimId() == "wu")
              instance.setAnim("su");
          },
          "RIGHT_UP": function () {
            if (instance.getAnimId() == "wr")
              instance.setAnim("sr");
          },
          "DOWN_UP": function () {
            if (instance.getAnimId() == "wd")
              instance.setAnim("sd");
          },
          "LEFT_UP": function () {
            if (instance.getAnimId() == "wl")
              instance.setAnim("sl");
          }
        });
        
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
      
      jas.Event.subscribe("pickUpFruit", "addScore", function (fruit) {
        scoreBoard.addScore(fruit.points);
      });
      
      jas.Event.subscribe("pickUpFruit", "removeFruit", function (fruit) {
        fruitSpawnZone.removeSpawnById(fruit.id); 
      });
      
      
      jas.Entity.addEntity( fruitSpawnZone, "spawnZones");
      
      jas.Entity.newClass("score", function (mutator) {
        mutator = mutator || {};
        var score = 0;
        mutator.string = mutator.string || "score: " + score;
        var instance = this.label(mutator); // extend label class
        
        instance.getScore = function () {
          return score;
        }
        
        instance.addScore = function (val) {
          score += val;
          
          if (score > 100 && score <= 300) {
            fruitSpawnZone.configureSpawn("strawberry", {w:32, h:32}); 
          }
          else if (score > 300) {
            fruitSpawnZone.configureSpawn("watermellon", {w:32, h:32});
            
          }
          // change text is from label
          instance.changeLabelText(function (oldString) {
            // you could manipulate oldString if you wanted to
            return "score: " + score; // return the new one
          });
        };
        
        return instance;
      });
      
      var scoreBoard = jas.Entity.inst("score", {
        x: 15,
        y: 15,
        w: 50,
        h: 30,
        shapeColor: "#000",
        shapeAlpha: .5 
      });
      
      jas.Entity.addEntity(scoreBoard, "score");
      
      
    });
    

    jas.Asset.getMapData("map", "res/data/map-alt.tmx", function (mapData) {
      // when the data is parsed get the image
      jas.Asset.newImage("tiles", "res/images/tileSet.png", (function(){
        // when the image is done make an entity from the data
        mapData.imageId = "tiles";
        
        var map = jas.Entity.addEntity(jas.Entity.inst("map", mapData), "map");
        
        // initialize the maps tiles
        map.makeTiles();
      }));
    });
    
    jas.Entity.addEntity(jas.Entity.inst("rect", {x: 40, y: 40, w:50, h:50, color: "#ff0" }), "test");
    
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
      
      if (!Controller.keysNotPressed(["UP", "RIGHT", "DOWN", "LEFT"])) {
        Controller.isKeyDown("UP");
        Controller.isKeyDown("RIGHT");
        Controller.isKeyDown("DOWN");
        Controller.isKeyDown("LEFT");
      }

      jas.Entity.getFirst("map", function (map) {
        map.getLayer("walls", function (wall) {
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
    Graphics.renderGroup("score", "container");
    Graphics.renderGroupLayer("score", "text");
    //Graphics.renderGroup("test");
  }
);


jas.init("game-frame");
jas.begin();

