function jasFactory () {
  
  // JAS FACTORY GLOBALS
  // ids
  var stateAutoId = 0;
  var entityAutoId = 0;
  
  var entities = {};
  var Events = {};
  
  // Gamestates
  var states = {};
  var state = null;
  
  // frame
  var canvas, ctx;
  var Controller;

  
  // animation
  var then;
  var wn = window;
  var requestAnimationFrame = wn.requestAnimationFrame || wn.mozRequestAnimationFrame ||
   wn.msRequestAnimationFrame || wn.webkitRequestAnimationFrame || wn.oRequestAnimationFrame;
   
   
  // STARTER FLUID METHODS
  // init method accepts id attribute of DOM game frame.
  function init (frameId, w, h) {
    function initError (err) {
      console.error(err);
    }
    // init game frame
    var gameFrame = document.getElementById(frameId);
    canvas = document.createElement("canvas");
    
    // no width? set to 320
    canvas.width = w ? w: 320;
    canvas.height = h ? h: 320;
    
    //if canvas won't work
    canvas.innerHTML = "<h3>Your browser doesn't support HTML5 canvas!</h3>";
    canvas.innerHTML += "<p>Try one of these browsers...</p>";
    
    ctx = canvas.getContext("2d");
    
    
    gameFrame.appendChild(canvas);
    // init game states
    if (Object.keys(states).length == 0) {
      initError("You must inject at least one game state using jas.addState\n");  
    }

    for (var i in states) {
      states[i].init();
    }
    
    function initController() {
      canvas.addEventListener('mousedown', function () {
        if (Controller.mouseup) {
          delete Controller.mouseup;
        }
        Controller.mousedown = true;
      }, false);
      
      canvas.addEventListener('mouseup', function () {
        if (Controller.mousedown) {
          delete Controller.mousedown;
        }
        Controller.mouseup = true;
        
        window.setTimeout(function () {
          delete Controller.mouseup;
        }, 10);
      }, false);
      
      var keys = {};
      
      var keyCodes = {
          UP: 38,
          RIGHT:39,
          DOWN:40,
          LEFT:37,
          SPACE: 32,
          ENTER: 13,
          A: 65,
          S: 83,
          D: 68,
          W: 87,
          CTRL: 17,
          SHIFT: 16,
          ALT: 18
      };
      
      // closures to access Controller on window level
      function addKey (e) {
        keys[e.keyCode] = true;
      }
  
      function removeKey(e) {
        delete keys[e.keyCode];
      }
      
      
      window.addEventListener('keydown', addKey, false);
      
      window.addEventListener('keyup', removeKey, false);
      // init game controller
      var controller = {
        isKeyDown: function (key) {
          var isIt = keys[keyCodes[key]];
          return  isIt ? true: false;
        },
        areKeysDown: function (keyArr) {
          for (var i in keyArr) {
            var key = keyArr[i];
            if (!this.isKeyDown(key)) {
              return false;
            }
          }
          return true;
        },
        keysNotPressed: function (keyArr) {
          for (var i in keyArr) {
            var key = keyArr[i];
            if (this.isKeyDown(key)) {
              return false;
            }
          }
          return true;
        }
      };
      
      return controller;
    }
    
    Controller = initController();
    
    function initEventMachine() {
      var events = {};
      var subscribers = {};
      
      function publish(event) {
        
      }
      
      function subscribe(event, callback) {
        subscribers[event] = subscribers[event]? subscribers[event]: [];
        subscribers[event].push(callback);
      }
      
      
      var eventMachine = {
        publish: publish,
        subscribe: subscribe
      };
      
      return eventMachine;
    }
    
    Events = initEventMachine();
    // events relayed to Controller
    
  }
  
  function begin() {
    then = Date.now();
    main();
  }
  
  function main() {
    var now = Date.now() - then;
    state.update(now, Controller);
    state.render(graphics);
    requestAnimationFrame(main);
  }
  
  
   
  // ASSET FACTORY
  function assetFactory () {
    var assets = {
      images: {},
      audio: {},
      maps: {}
    };
    
    function getMapData(name, path, userCallback) {
      var map = {}; 
      
      return new Promise(function(success, error) {
        var request = new XMLHttpRequest();
        var data = {};
        
        request.onreadystatechange = function () {
          if (request.readyState == 2) {
            assets.maps[name] = false;
          }
        }
        
        request.onload = function () {
          if (request.status == 200) {
            
            /* global X2JS */
            var x2js = new X2JS();
            
            data = x2js.xml_str2json(request.responseText).map;
            map.tileX = Number(data._height);
            map.tileY = Number(data._width);
            map.tileW = Number(data._tilewidth);
            map.tileH = Number(data._tileheight);
            map.x = 0;
            map.y = 0;
            map.w = map.tileX * map.tileW;
            map.h = map.tileX * map.tileH;
            
            // get layer data
            map.layers = {};
            for (var i in data.layer) {
              var layer = {};
              layer.name = data.layer[i]._name;
              layer.width = data.layer[i]._width;
              layer.height = data.layer[i]._height;
              layer.tiles = [];
              
              // get tiles
              for (var j in data.layer[i].data.tile) {
                var tile = {};
                tile.tileId = Number(data.layer[i].data.tile[j]._gid);
                if (tile.tileId == 0) {
                  continue; // don't include 'null' tiles
                }
                else {
                  tile.tileId--; // start at 0
                  tile.x = (j * map.tileW) % map.w;
                  tile.y = Math.floor((j * map.tileW) / map.w) * map.tileH;
                  layer.tiles.push(tile);
                }
              }
              // end layer tiles
              
              // get layer properties
              layer.properties = {};
              for (var k in data.layer[i].properties) {
                var property = data.layer[i].properties[k];
                layer.properties[property._name] = property._value;
              }
              map.layers[layer.name] = layer;
            
            }
            // end iteration of layers
          }
          
          success(map);
        };
        
        request.onerror = function () {
          console.error("error finding tmx file in newMap");
        };
        
        request.open("get", path, true);
        
        request.send();
        
      }).then(function () {
        
        if (typeof(userCallback) == "function") {
          
          userCallback(map);
        }
        
      });
        
    }
  
    function newImage(name, path, userCallback) {
      var image = new Image();
      
      return new Promise(function (success, failure) {
        assets.images[name] = false;
        /*global Image*/
      
        image.onload = function () {
          assets.images[name] = image;
          success(image);
        };
      
        image.src = path;
      }).then(function () {
        
        if (typeof(userCallback) == "function") {
          
          userCallback(image);
          
        }
        
      });
    
    }
    
    function getImage (name) {
      return assets.images[name]? assets.images[name]: false;
    }
  
    function newAudio(name, path) {
      
    }
    
    function getAudio (name) {
      return assets.audio[name]? assets.audio[name]: false;
    }
    
    function getMap (name) {
      return assets.maps[name]? assets.maps[name]: false;
    }
  
    return {
      newImage: newImage,
      audio: newAudio,
      getImage: getImage,
      getAudio: getAudio,
      getMapData: getMapData
    };
  }
 
  var Asset = assetFactory();
  
  
  
  // ENTITY FACTORY
  /*global name-space jas*/
  function entityFactory () {
    // mutator methods
    var classes = {
      entity: function (mutator) {
        var instance = {};
        instance.x = mutator.x;
        instance.y = mutator.y;
        instance.w = mutator.w;
        instance.h = mutator.h;
        
        return instance;
      },
      
      solid : function (mutator) {
        var collideable = true;
        
        var instance = this.entity(mutator);
        
        instance.setSolid = function (isCollideable) {
          try {
            if (typeof (isCollideable) === "boolean") {
              collideable = isCollideable;
            } 
            else {
              throw "entity set solid requires boolean";
            }
          }
          catch (e) {
            console.error(e.message);
          }
        }
        
        instance.isCollideable = function () {
          return collideable;
        }
        
        
        instance.isColliding = function (collider, success, failure) {
          if (this.isCollideable && collider.isCollideable) {
            // collision vectors
            var v1 = this.x + this.w > collider.x;
            var v2 = this.y + this.h > collider.y;
            var v3 = collider.x + collider.w > this.x;
            var v4 = collider.y + collider.h > this.y;
            if (v1 && v2 && v3 && v4) {
              typeof(success)=="function"? success(): null;
            }
            else {
              typeof(failure)=="function"? failure(): null;
              
            }
          }
        }
        
        return instance;
      },
      
      rect: function (mutator) {
        var instance = this.solid(mutator);
        var color = mutator.color? mutator.color: null;
        var alpha = mutator.alpha? mutator.alpha: null;
        
        instance.getDraw = function () {
          return {
            type: "rect",
            x: this.x,
            y: this.y,
            w: this.w,
            h: this.h,
            color: color
          };
        }
        
        return instance;
      },
      component: function (mutator) {
        var mutator = mutator? mutator: {};
        var instance = this.rect(mutator);
        var parent;
        function widget () {
          var components = {};
          instance.addComponent = function (component) {
            
          };
          
          instance.removeComponent = function () {
            
          };
          
          
          
        }
        
      },
      sprite : function (mutator) {
        var instance = this.solid(mutator);
        
        function animationFactory(animMutator) {
          
          function frame (sx, sy, sw, sh) {
            
            return {
              sx: sx,
              sy: sy,
              sw: sw,
              sh: sh
            };
          }
          
          animMutator = animMutator? animMutator: {};
          var animation = {};
          
          animation.name = animMutator.name;
          
          var start = animMutator.start;
          var stop = animMutator.stop;
          var w = instance.w;// sub image w & h
          var h = instance.h;
          
          var looping = animMutator.looping? animMutator.looping: false;
          var pingpong = animMutator.pingpong? animMutator.pingpong: false;
          var fps = animMutator.fps? animMutator.fps: 12;
          
          var frames = [];
          
          
          for ( var i = start; i < stop; i++) {
            var x = (i * w) % imageW;
            var y = Math.floor((i * w) / imageW) * h;
            frames.push(frame(x, y, w, h));
          }
          
          //console.log(stop);
          
          var currentFrame = 0;
          var lastUpdate = Date.now();
          var done = false;
          
          animation.update = function () {
            var now = Date.now();
            
            if ((now - lastUpdate)/1000 >= 1/fps && !done) {
              lastUpdate = Date.now();
              var lastFrame = ++currentFrame >= frames.length;
              if (lastFrame && looping) {
                currentFrame = 0;
              }
              else if (lastFrame) {
                currentFrame = frames.length - 1;
                done = true
              }
            }
          };
          
          animation.getCurrentFrame = function () {
            return frames[currentFrame];
          }
          
          animation.reset = function() {
            currentFrame = 0;
            done = false;
          }
          
          if (animMutator.def) {
            instance.anim = animation;
          }
          
          return animation;
        }
        
        
        var Directions = {
          UP: -1,
          RIGHT: 1,
          DOWN: 1,
          LEFT: -1
        };
        
        var dirY = Directions.DOWN;
        var dirX = Directions.RIGHT;
        
        var imageId = mutator? mutator.imageId: null;
        var imageW = Asset.getImage(imageId).width;
        var imageH = Asset.getImage(imageId).height;
        
        instance.animations = {};
        
        for (var i in mutator.animations) {
          var animData = mutator.animations[i];
          instance.animations[animData.name] = animationFactory(animData);
        }
        
        instance.setAnim = function (animId) {
          instance.anim = instance.animations[animId];
        }
        
        instance.getAnimId = function () {
          return instance.anim.name;
        };
        
        instance.addAnim = function (animId, animMutator) {
          instance.animations[animId] = animationFactory(animMutator);
          if (animMutator.def) {
            instance.anim = instance.animations[animId];
          }
        }
        
        instance.updateAnim = function () {
          instance.anim.update();
        }
        
        instance.resetAnim = function (animId) {
          if (animId) {
            instance.animation[animId].reset();
          }
          else {
            instance.anim.reset();
          }
        }
        
        // draw functions
        instance.getDraw = function () {
          
          var frame = instance.anim.getCurrentFrame();
          
          return {
            type: "sprite",
            frame: frame,
            x: this.x,
            y: this.y,
            w: this.w,
            h: this.h,
            imageId: imageId
          };
        }
        // locomotive methods
        instance.moveUp = function () {
          dirY = Directions.UP;
          this.y -= this.spd;
        };
        
        instance.moveRight = function () {
          dirX = Directions.RIGHT;
          this.x += this.spd;
        };
        
        instance.moveDown = function () {
          dirY = Directions.DOWN;
          this.y += this.spd;
          
        };
        
        instance.moveLeft = function () {
          dirX = Directions.LEFT;
          this.x -= this.spd;
        };
        
        instance.collide = function () {
          switch (dirY) {
            case Directions.UP:
              this.y += this.spd;
              dirY = 0;
              break;
            case Directions.DOWN:
              this.y -= this.spd;
              dirY = 0;
              break;
          }
          switch (dirX) {
            case Directions.RIGHT:
              this.x -= this.spd;
              dirX = 0;
              break;
            case Directions.LEFT:
              this.x += this.spd;
              dirX = 0;
              break;
            
          }
        };
        // end locomotive methods
        
        return instance;
      },
      
      tile: function (mutator) {
        var mutator = mutator? mutator: {};
        
        var instance = this.sprite(mutator);
        instance.setAnim("tile");
        
        instance.tileId = mutator.tileId;
        
        return instance;
      },
      
      map: function (mutator) {
        // everything in this mutator is sanitized of underscores.
        // this is the parsed map data.
        mutator = mutator? mutator : {};
        var instance = this.solid(mutator);
        
        var tileMutators = {};
        instance.layers = {};
        
        var tileW = mutator.tileW,
            tileH = mutator.tileH,
            imageId = mutator.imageId;
        
        instance.configureTile = function (tileId, mutatorFunction) {
          tileMutators[tileId] = mutatorFunction;
        }
        
        instance.makeTiles = function () {
          for (var i in mutator.layers) {
            var layer = {};
            layer.tiles = [];
            
            for (var j in mutator.layers[i].tiles) {
              var tileData = mutator.layers[i].tiles[j];
              var tileMutator = tileMutators[tileData.tileId] ?
                tileMutators[tileData.tileId]: function (obj) {return obj;};
              //console.log(tileData);
              tileData.imageId = imageId;
              tileData.w = tileW;
              tileData.h = tileH;
              tileData.animations = [{
                "name": "tile",
                "start": tileData.tileId,
                "stop": tileData.tileId + 1,
                def: true
                }
              ];
              
              // remove first four arguments...
              var tile = classes.tile(tileData);
              layer.tiles.push(tile);
            }
            instance.layers[mutator.layers[i].name] = layer;
            
          }
          
        };
        
        
        instance.getDraw = function (layer) {
          if (instance.layers[layer]) {
            return {
              type: "mapLayer",
              tiles: instance.layers[layer].tiles
            };
          }
          else {
            return false;
          }
        };
        
        return instance;
      }
    }
    /*
      new instance method
    */
    function inst (type, mutator) {
      var newInstance = classes[type]? classes[type](mutator):{};
      return newInstance;
    }
    
    function newClass(type, factory) {
      classes[type] = factory;
    }
    
    return {
      inst: inst,
      newClass: newClass
    };
  };
  
  var Entity = entityFactory();
  
  // ENTITY FACTORY PUBLIC INTERFACE
  function addEntity (group, entity) {
    entity.id = entityAutoId;
    entities[group] = entities[group] ? entities[group]: [];
    entities[group].push(entity);
    entityAutoId ++;
    
    return entity;
  }
  
  
  function removeEntity (entity) {
    var group = entity.group;
    for (var i in entities[group]) {
      if (entity.id == entities[group][i].id) {
        entities[group].splice(i, 1);
      }
    }
  }
  
  function getFirst(groupId) {
    return entities[groupId] ? entities[groupId][0]: false;
  }
  
  function getGroup (groupId) {
    return entities[groupId];
  }
  
  function getMap (mapId) {
    return entities[mapId] ? entities[mapId][0]: false;
  }
  
  
  // UTILITIES
  function graphicsFactory () {
    function drawRect (draw) {
      var color = draw.color? draw.color: "#0f0";
      
      ctx.fillStyle = color;
      
      var x = draw.x,
          y = draw.y,
          w = draw.w,
          h = draw.h;
      
      ctx.fillRect(x, y, w, h);
    }
    
    function drawSprite (draw) {
      var image = Asset.getImage(draw.imageId);
      //console.log(draw);
      var frame = draw.frame,
          sx = frame.sx,
          sy = frame.sy,
          sw = frame.sw,
          sh = frame.sh,
          dx = draw.x,
          dy = draw.y,
          dw = draw.w,
          dh = draw.h;

      if (image) {
        ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
      }
    }
    var graphics = {
      renderMapLayer: function (mapId, layer) {
        var map = getMap(mapId);
        if (!map) {
          return;
        }
        else {
          //console.log(map);
          // get the map's render instructions
          var draw = map.getDraw(layer);
          if (!draw) {
            return;
          }
          // get each tiles render instructions. Draw those tiles
          for (var i in draw.tiles) {
            
            drawSprite(draw.tiles[i].getDraw());
          }
        }
      },
      renderGroup: function (groupId) {
        var group = getGroup(groupId);
        
        for (var i in group) {
          var instance = group[i];
          var draw = instance.getDraw();
          
          //console.log(draw.type);
          switch (draw.type) {
            case "rect":
                drawRect(draw);
              break;
            case "sprite":
                drawSprite(draw);
              break;
          }
        }
      },
      fillScreen: function (color, alpha) {
        ctx.fillStyle = color ? color: "#f0f";
        ctx.globalAlpha = alpha ? alpha: 1;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };
    
    return graphics;
  }
  
  var graphics = graphicsFactory();
  
  // GAME STATES PUBLIC API
  function addState (stateName, init, update, render) {
    
    var stateInit = init;
    
    var newState = {
      stateName: stateName,
      init: stateInit,
      update: update,
      render: render
    };
    
    states[stateName] = newState;
    
    if (state == undefined) {
      state = newState;
    }
  } 
  
  function changeState(stateId) {
    state = states[stateId];
  }
  
  var newJas = {
    init: init,
    begin: begin,
    Entity: Entity,
    Asset: Asset,
    addEntity: addEntity,
    removeEntity: removeEntity,
    addState: addState,
    changeState: changeState,
    getGroup: getGroup,
    getMap: getMap,
    getFirst: getFirst
  };
  
  return newJas;
}

var jas = jasFactory();