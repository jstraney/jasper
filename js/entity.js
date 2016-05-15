(function(jas) {
  // ENTITY FACTORY
  /*global name-space jas*/
  var entities = {};
  var groups = {};
  
  var entityAutoId = 0;
  
  var classes = {
    entity: function (mutator) {
      var instance = {};
      mutator = mutator || {};
      var fst = jas.Util.finiteStateMachine();
      instance.setState = function (state, status) {
        fst.setState(state, status);
      }
      
      instance.getState = function (state) {
        return fst.getState(state);
      }
      
      instance.checkStatus = function (state, status, statusTrue, statusFalse) {
        if (fst.checkStatus(state, status)) {
          if (typeof(statusTrue) == "function") {
            statusTrue();
          }
          return true;
        }
        else {
          if (typeof(statusFalse) == "function") {
            statusFalse();
          }
          return false;
        }
      }
      instance.id = entityAutoId;
      entityAutoId++;
      instance.x = mutator.x || 0;
      instance.y = mutator.y || 0;
      instance.w = mutator.w || 0;
      instance.h = mutator.h || 0;
      
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
      
      // todo: right now, these two functions treat all solids as rectangles.
      // relocate these into the 'rect' class, but creat a 'circ' class
      // that shares the same interface.
      instance.isColliding = function (collider, success, failure) {
        if (this.isCollideable && collider.isCollideable) {
          // collision vectors
          var v1 = this.x + this.w > collider.x;
          var v2 = this.y + this.h > collider.y;
          var v3 = collider.x + collider.w > this.x;
          var v4 = collider.y + collider.h > this.y;
          if (v1 && v2 && v3 && v4) {
            typeof(success)=="function"? success(): null;
            return true;
          }
          else {
            typeof(failure)=="function"? failure(): null;
            return false;
          }
        }
      }
      
      instance.contains = function (vector, success, failure) {
        var v1 = vector.x > instance.x;
        var v2 = vector.x < instance.x + instance.w;
        var v3 = vector.y > instance.y;
        var v4 = verctor.y < instance.y + instance.h;
        
        if (v1 && v2 && v3 && v4) {
          typeof(success)=="function"? success(): null;
          return true;
        }
        else {
          typeof(failure)=="function"? failure(): null;
          return false;
        }
      };
      
      return instance;
    },
    
    rect: function (mutator) {
      var instance = this.solid(mutator);
      var color = mutator.color || null;
      var alpha = mutator.alpha || null;
      
      instance.getOrigin = function () {
        return {x: instance.x, y: instance.y};
      }
      
      instance.getCenter = function () {
        var x = instance.x + instance.w / 2;
        var y = instance.y + instance.h / 2;
        return {x: x, y : y};
      };
      
      instance.getArea = function () {
        return instance.w * instance.h; 
      }
      
      instance.getRandomVector = function (xShift, yShift, xUpperLimit, yUpperLimit) {
        xUpperLimit = xUpperLimit || 0;
        yUpperLimit = yUpperLimit || 0;
        var ranX = (Math.random() * (instance.w + xUpperLimit)) + instance.x + xShift;
        var ranY = (Math.random() * (instance.h + yUpperLimit)) + instance.y + yShift;
        return {x: ranX, y: ranY};
      };
      
      // a rectangle is a solid that can be drawn like a rectangle.
      instance.getDraw = function () {
        return {
          type: "rect",
          x: this.x,
          y: this.y,
          w: this.w,
          h: this.h,
          color: color,
          alpha: alpha
        };
      }
      
      return instance;
    },
    // todo: make a GUI component class
    component: function (mutator) {
      var mutator = mutator || {};
      var instance = this.rect(mutator);
      var parent;
      // a widget will be a component that contains components
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
        // inner frame class
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
        var done = false;
        
        var timer = jas.Util.timer();
        timer.start();
        timer.setTimer(1000/fps);
        
        animation.update = function () {
          if (done) {
            return; 
          }
          timer.checkTime(function() {
            var lastFrame = ++currentFrame >= frames.length;
            
            if (lastFrame && looping) {
              currentFrame = 0;
            }
            
            else if (lastFrame) {
              currentFrame = frames.length - 1;
              done = true
            }
            
          });
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
      var imageW = jas.Asset.getImage(imageId).width;
      var imageH = jas.Asset.getImage(imageId).height;
      
      instance.animations = {};
      
      mutator.animations = mutator.animations || [{name:"still", start: 0, stop: 1, def: true}];
      
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
    spawnZone: function (mutator) {
      var mutator = mutator || {};
      mutator.alpha = mutator.alpha || .4; // set transparency for testing/rendering
      
      var instance;
      
      var intervalFixed = mutator.intervalFixed !== false ? true: false;
      var spawnType = mutator.spawnType;
      var spawnMutator = mutator.spawnMutator || {};
      var spawnRate = mutator.spawnRate || 3000;
      var spawnCount = 0;
      var spawnPosition = mutator.spawnPosition || "origin";
      var spawnGroup = mutator.spawnGroup || null;
      var spawnMax = mutator.spawnMax || 10;
      var spawnIds = {};
      var timer = jas.Util.timer(spawnRate, intervalFixed);
      timer.start();
      
      instance.configureSpawn = function (defSpawnType, defSpawnMutator) {
        spawnType = defSpawnType;
        spawnMutator = defSpawnMutator;
      }
      
      // returns a function that returns vector
      function getSpawnStrategy () {
        var vector = {};
        if(spawnPosition == "random") {
          return function () {
            return instance.getRandomVector( 0, 0, -spawnMutator.w, -spawnMutator.y);  
          }
        }
        else if (spawnPosition == "center") {
          return function () {
            return instance.getCenter();
          }
        }
        else {
          return function () {
            return instance.getOrigin();  
          }
         
        }
      }
      
      var getSpawnVector = getSpawnStrategy(mutator.spawnPosition) || null;
      
      instance.setSpawnPosition = function (position) {
        spawnPosition = position;
        getSpawnVector = getSpawnStrategy();  
      };
      
      instance.spawn = (function () {
        if (spawnCount < spawnMax) {
          timer.checkTime(function() {
            var vector = getSpawnVector();
            spawnMutator.x = vector.x;
            spawnMutator.y = vector.y;
            var spawn = jas.Entity.inst(spawnType, spawnMutator);
            spawnIds[spawn.id] = spawn.id;
            jas.Entity.addEntity( spawn, spawnGroup);
            spawnCount++;
            
          });
        }
      });
      
      instance.removeSpawn = function (entity) {
        delete spawnIds[entity.id];
        jas.Entity.removeEntityById(entity.id);
        spawnCount--;
      };
      
      instance.removeSpawnById = function (id) {
        delete spawnIds[id];
        jas.Entity.removeEntityById(id);
        spawnCount--;
      };
      
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
  
  var enumEntities = {};
  
  // add enumerate entity
  function enumerateEntity (name, num) {
    enumEntities[num] = name;
  }
  
  // ENTITY FACTORY PUBLIC INTERFACE
  function inst (type, mutator) {
    var newInstance = classes[type]? classes[type](mutator):{};
    return newInstance;
  }
  
  function newClass(type, factory) {
    classes[type] = factory;
  }
  
  function addEntity (entity, group) {
    var id = entity.id;
    if (group) {
      groups[group] = groups[group] || {};
      groups[group][id] = id;
    }
    entities[id] = entity;
    
    return entity;
  }
  
  
  function removeEntity (entity) {
    for (var i in groups) {
      delete groups[i][entity.id]; 
    }
    delete entities[entity.id];
  }
  
  function removeEntityById (id) {
    for (var i in groups) {
      delete groups[i][id]; 
    }
    delete entities[id];
  }
  
  function getFirst(groupId, callback) {
    if (groups[groupId]) {
      var entity = entities[Object.keys(groups[groupId]).sort()[0]];
      if (entity && typeof(callback) == "function") {
        callback(entity);
        return entity;
      }
    }
  }
  
  function getGroup (groupId, callback) {
    var group = [];
    //console.log(groups);
    for (var i in groups[groupId]) {
      var id = groups[groupId][i];
      group.push(entities[id]);
    }
    if (typeof(callback) == "function") {
      group.forEach(callback); 
    }
    return group;
  }
  
  function getMap (mapId, callback) {
    return getGroup(mapId)[0];
  }
  
  jas.Entity = {
    inst: inst,
    newClass: newClass,
    addEntity: addEntity,
    removeEntity: removeEntity,
    removeEntityById: removeEntityById,
    enumerateEntity: enumerateEntity,
    getFirst: getFirst,
    getGroup: getGroup,
    getMap: getMap
  };
  
})(jas);