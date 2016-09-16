/* global namespace jas*/
jas.State.addState("main",
  function init () {
    jas.Event.addPublication("main-state-reset");
    
    jas.Asset.configure({
      imageRoot: "res/images/",
      audioRoot: "res/audio/",
      mapRoot: "res/data/"
    });
    
    jas.Asset.newAudio("pickup", "powerup.wav", function (audio) {
      // configure the audio once it's loaded.
      audio._volume = .5; // turn it down a little
    });
    
    jas.Asset.newImage("player", "player.png", function () {
      // When the image loads, define a player class
      jas.Entity.newClass("player", function (mutator) {
        var instance = this.sprite(mutator); // 'this' is jas.Entity
        
        var spd = 2;
        // physics object. This variety applies simple 'oldschool-z*lda-like' physics
        var phys = jas.Physics.inst("orthogonal");
        phys.bind(instance);
        
        var controller = jas.Controller.inst("controller", {
         "UP_IS_DOWN": function () {  
            instance.setAnim("wu");
            phys.up(spd);
          },
          "RIGHT_IS_DOWN": function () {
            instance.setAnim("wr");
            phys.right(spd);
          },
          "DOWN_IS_DOWN": function () {
            instance.setAnim("wd");
            phys.down(spd);
          },
          "LEFT_IS_DOWN": function () {
            instance.setAnim("wl");
            phys.left(spd);
          },
          "UP_IS_UP": function () {
            phys.resetDirY();
            if (instance.getAnimId() == "wu")
              instance.setAnim("su");
          },
          "RIGHT_IS_UP": function () {
            phys.resetDirX();
            instance.setAnim("sr");
          },
          "DOWN_IS_UP": function () {
            phys.resetDirY();
            instance.setAnim("sd");
          },
          "LEFT_IS_UP": function () {
            phys.resetDirX();
            instance.setAnim("sl");
          },
        });
        
        jas.Event.addPublication("playerCollides");
        
        var collide = jas.Event.subscribe("playerCollides", function (obj) {
          phys.collide(spd);
        });
        
        // this defines a publication local to the player class's scope
        jas.Event.addPublication("playerLocation");
        
        // extend the sprite class with a function.
        instance.emitLocation = function () {
          // now publish to the publication sending a payload of the players center coordinates
          jas.Event.publish("playerLocation", instance.getCenter());

          // get center is from the shape classes
        }
        
        jas.Event.addPublication("playerHit");
        
        var doDamage = jas.Event.subscribe("playerHit", function (obj) {
          // stop key events
          controller.kill();
          instance.setAnim("die");
          // change game state to game over
        });
        
        jas.Event.subscribe("main-state-reset", "relocate-player", function () {
          instance.x = 32;
          instance.y = 32;
          dirY = 0;
          dirX = 0;
          instance.setAnim("sd");
          // reset death animation so 'onend' can be called again
          instance.resetAnim('die');
          controller.revive(); // resume use of controller
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
          // 'sd' stand facing down, 'wd' walk facing down etc.
          { name: "sd", start: 0, stop: 1, def: true}, 
          { name: "wd", start: 0, stop : 8, looping: true},
          { name: "wu", start: 8, stop : 16, looping: true},
          { name: "su", start: 8, stop : 9},
          { name: "wr", start: 16, stop : 24, looping: true},
          { name: "sr", start: 16, stop : 17},
          { name: "wl", start: 24, stop : 32, looping: true},
          { name: "sl", start: 24, stop : 25},
          { name: "die", start: 52, stop: 57,
            onend: function () {
              // once death animation stops, get a screen shot
              jas.Graphics.getScreenImage("screenShot", function () {
                var dimensions = jas.Graphics.getScreenDimensions();
                // create a new sprite entity with that screenshot as it's image
                jas.Entity.addEntity(jas.Entity.inst("sprite", {
                  imageId: "screenShot",
                  x: 0,
                  y: 0,
                  w: dimensions.w,
                  h: dimensions.h
                }), "screenShot");
              });
              
              jas.State.changeState("gameOver");
              
            }
          }
        ]
      }), 'player');
      
    });
    
    jas.Event.addPublication("pickUpFruit");

    jas.Asset.newImage("fruit", "fruit.png", function () {
      
      jas.Entity.newClass("fruit", function (mutator) {
        mutator = mutator || {};
        mutator.w = 32;
        mutator.h = 32;
        
        var instance = this.sprite(mutator);
        
        var points = mutator.points;
        
        instance.pickup = function() {
          jas.Asset.getAudio('pickup', function (sound) {
            sound.play();
          });
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
        spawnGroup: "fruit",
        active: true
      });
      
      var clearFruit = jas.Event.subscribe("main-state-reset", function () {
        fruitSpawnZone.clear();
      });
      
      var addScore = jas.Event.subscribe("pickUpFruit", function (fruit) {
        console.log(fruit);
        scoreBoard.addScore(fruit.points);
      });
      
      var removeFruit = jas.Event.subscribe("pickUpFruit", function (fruit) {
        fruitSpawnZone.removeSpawnById(fruit.id); 
      });
      
      jas.Entity.addEntity( fruitSpawnZone, "spawnZones");
      
      // Score class. Extends the label class.
      jas.GUI.newClass("score", function (mutator) {
        var score = 0;
        
        mutator = mutator || {};
        mutator.text = mutator.text || "score: " + score;
				mutator.classes = "fruitgrab-label score";

        var instance = this.label(mutator); // extend label class
        
        var areThereAliens = false;
        
        instance.getScore = function () {
          return score;
        }
        
        instance.addScore = function (val) {
          score += val;
          if (score > 500 && !areThereAliens) {
            jas.Event.publish("theyHaveCome");
            areThereAliens = true;
          }
          if (score > 300) {
            fruitSpawnZone.configureSpawn("watermellon", {w:32, h:32});
            
          }
          else if (score > 100) {
            fruitSpawnZone.configureSpawn("strawberry", {w:32, h:32}); 
          }
          
          // change text is from label
          instance.changeText(function (oldString) {
            // you could manipulate oldString if you wanted to
            return "score: " + score;
            
          });
          
        };
        
        var resetScore = jas.Event.subscribe("main-state-reset", "resetScore", function () {
          score = 0;
          areThereAliens = false;
          // resets text
          instance.addScore(0);
          fruitSpawnZone.configureSpawn("cherry", {w:32, h:32});
        });
        
        return instance;
        
      });
      
      var scoreBoard = jas.GUI.inst("score", {context: "game-frame"});
      
    });
    
    jas.Event.addPublication("theyHaveCome");
    
    jas.Asset.newImage("alien", "alien.png", function () {
      
      jas.Entity.newClass("alien", function (mutator) {
        mutator = mutator || {};
        mutator.imageId = "alien";
        mutator.w = 32;
        var spd = 1;
        mutator.h = 32;
        
        var instance = this.sprite(mutator);
        
        jas.Event.subscribe("playerLocation", "getPath-" + instance.id, function (pCord) {
          instance.x = instance.x < pCord.x? instance.x + spd: instance.x - spd;
          instance.y = instance.y < pCord.y? instance.y + spd: instance.y - spd;
        });
        
        return instance;
        
      });
      
    });
    
    var alienSpawnZone = jas.Entity.inst("spawnZone", {
        x: 32,
        y: 32,
        w: 32,
        h: 32,
        spawnType: "alien",
        spawnMutator: {h: 32, w: 32},
        spawnRate: 10000,
        spawnMax: 3,
        spawnGroup: "mobs"
    });
    
    jas.Event.subscribe("theyHaveCome", "addAlienSpawnZone", function () {
      jas.Entity.addEntity(alienSpawnZone, "spawnZones");
      alienSpawnZone.start();
    });
    
    jas.Event.subscribe("main-state-reset", "clear-aliens", function () {
      alienSpawnZone.stop();
      alienSpawnZone.clear();
    });
    

    jas.Asset.getMapData("map", "map-alt.tmx", function (mapData) {
      // when the data is parsed get the image
      jas.Asset.newImage("tiles", "tileSet.png", (function(){
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
    
    jas.Entity.getGroup("spawnZones", function (zone) {
      zone.spawn();
    });
    
    
    
    
    // get and update player
    jas.Entity.getFirst("player", function (instance) {
      p = instance;
      
      p.updateAnim();
      
      
      Controller.isKeyDown("UP");
      Controller.isKeyDown("RIGHT");
      Controller.isKeyDown("DOWN");
      Controller.isKeyDown("LEFT");
      

      jas.Entity.getFirst("map", function (map) {
        map.getLayer("walls", function (wall) {
          //console.log(wall);
          return wall.isColliding(p, function () {
            jas.Event.publish("playerCollides");
          });
        });
      });
      
      jas.Entity.getGroup("mobs", function (mob) {
        mob.isColliding(p, function () {
          jas.Event.publish("playerHit");
        });
      });
      
      p.emitLocation();
      
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
    Graphics.renderGroup("mobs");
    Graphics.renderGroup("player");
    Graphics.renderGroupLayer("map", "walls");
  }
);


// Game Over State
jas.State.addState("gameOver",
  function init () {
    
    var resetMain = jas.Event.subscribe("main-state-reset", function () {
      jas.State.changeState("main");
    });
    
    var menu = jas.GUI.inst("widget", {
      context: "game-frame",
      classes: "full-pane",
      show: "enter-state-gameOver",
      hide: "exit-state-main"
    });
    
    var text = jas.GUI.inst("label", {
      classes: "fruitgrab-label game-over",
      text: "Game Over"
    });


    var button = jas.GUI.inst("textButton", {
      classes: "fruitgrab-button continue",
      text: "continue",
      MOUSE_IS_CLICKED: function () {
        jas.Event.publish("main-state-reset");
      }
    });
    
    menu.appendComponents(text, button);
    
  },
  
  function update (delta) {
    
  },
  
  function render (Graphics) {
    Graphics.renderGroup("screenShot");
  }
);

jas.init("game-frame");
jas.begin();

