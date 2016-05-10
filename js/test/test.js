/* global namespace jas*/
jas.addState("main",
  function init () {
    jas.Asset.newImage("player", "js/test/res/images/player.png", function () {
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
    
    // get map data
    jas.Asset.getMapData("map", "js/test/res/data/map-alt.tmx", function (mapData) {
      // when the data is parsed get the image
      jas.Asset.newImage("tiles", "js/test/res/images/tileSet.png").then(function(){
        // when the image is done make an entity from the data
        mapData.imageId = "tiles";
        var map = jas.Entity.addEntity(jas.Entity.inst("map", mapData), "map");
        // We'll define a special entity for the 'active-tiles'
        jas.Entity.newClass("active-tile", function (mutator) {
          mutator = mutator || {}; // not necessary, but I do this
          var instance = this.tile(mutator);
          instance.activate = mutator.activate;
          
          
        });
        // now we'll sub-class the active tiles
        jas.Entity.newClass("trap", function (mutator) {
          mutator = mutator || {};
        });
        jas.Entity.newClass("stairs", function (mutator) {
          mutator = mutator || {};
        });
        // initialize the maps tiles
        map.makeTiles();
      });
    });
    
    
  },
  
  function update (delta, Controller) {
    var keys = Controller.keys;
    var p,
        map;
        
    var walls, activeTiles;
    
    
    if (map = jas.Entity.getMap("map")) {
      walls = map.layers.walls.tiles;
      activeTiles = map.layers.active_tiles.tiles;
    }
    
    // get and update player
    if (p = jas.Entity.getFirst("player")) {
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
      
      for (var j in activeTiles) {
        var tile = activeTiles[j];
        //console.log(trap);
        p.isColliding(tile, function () {
          tile.activate();
        })
      }
    }
  },
  
  function render (Graphics) {
    Graphics.fillScreen("#088");
    Graphics.renderMapLayer("map", "floor");
    Graphics.renderMapLayer("map", "active_tiles");
    Graphics.renderGroup("player");
    Graphics.renderMapLayer("map", "walls");
    
  }
);


jas.init("game-frame");
jas.begin();

