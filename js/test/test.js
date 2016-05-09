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
    
    jas.Asset.getMapData("map", "js/test/res/data/map-alt.tmx", function (mapData) {
      jas.Asset.newImage("tiles", "js/test/res/images/tileSet.png").then(function(){
        mapData.imageId = "tiles";
        var map = jas.Entity.addEntity(jas.Entity.inst("map", mapData), "map");
        map.makeTiles();
      });
    });
    
    jas.Event.addPublication("onActiveTile");
    
    jas.Event.subscribe("onActiveTile", "doDamage", function (event) {
      event = event || {};
      console.log(event.dmg);
      console.log(event.type);
    });
    
  },
  
  function update (delta, controller) {
    var keys = controller.keys;
    var p,
        map;
        
    var walls, activeTiles;
    
    
    if (map) {
      walls = map.layers.walls.tiles;
      activeTiles = map.layers.active_tiles.tiles;
    }
    
    // get and update player
    if (p = jas.Entity.getFirst("player")) {
      
      p.updateAnim();
      
      if (controller.keysNotPressed(["UP", "RIGHT", "DOWN", "LEFT"])) {
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
        
        if (controller.isKeyDown("UP")) {
          p.moveUp();
          p.setAnim("wu");
        }
        if (controller.isKeyDown("RIGHT")) {
          p.moveRight();
          p.setAnim("wr");
        }
        if (controller.isKeyDown("DOWN")) {
          p.moveDown();
          p.setAnim("wd");
        }
        if (controller.isKeyDown("LEFT")) {
          p.moveLeft();
          p.setAnim("wl");
        }
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
    
    if (map) {
      
    }
    
  },
  
  function render (graphics) {
    graphics.fillScreen("#088");
    graphics.renderMapLayer("map", "floor");
    graphics.renderMapLayer("map", "active_tiles");
    graphics.renderGroup("player");
    graphics.renderMapLayer("map", "walls");
    
  }
);


jas.init("game-frame");
jas.begin();

