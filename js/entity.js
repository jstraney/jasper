(function(jas) {
  // ENTITY FACTORY
  /*global name-space jas*/
  var entities = {};
  var groups = {};
  
  var entityAutoId = 0;
  
  var isFunction = jas.Util.isFunction;
  
  var classes = {
    entity: function (mutator) {
      var instance = {};
      mutator = mutator || {};
      
      var fst = jas.Util.finiteStateMachine();
      var controller;
      
      instance.setState = function (state, status) {
        fst.setState(state, status);
      };
      
      instance.getState = function (state) {
        return fst.getState(state);
      };
      
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
      };
      
      instance.setController = function (userController) {
        controller = userController || false;
        
      }

      instance.id = entityAutoId;
      entityAutoId++;
      instance.x = mutator.x || 0;
      instance.y = mutator.y || 0;
      instance.w = mutator.w || 0;
      instance.h = mutator.h || 0;
      
      return instance;
    },
    rect: function (mutator) {
      var instance = this.entity(mutator);
      var color = mutator.color || '#fff';
      var alpha = mutator.alpha != undefined? mutator.alpha: null;
      
      instance.getOrigin = function () {
        return {x: instance.x, y: instance.y};
      };
      
      instance.getCenter = function () {
        var x = instance.x + instance.w / 2;
        var y = instance.y + instance.h / 2;
        return {x: x, y : y};
      };
      
      instance.getArea = function () {
        return instance.w * instance.h; 
      };
      
      instance.getRandomVector = function (xShift, yShift, xUpperLimit, yUpperLimit) {
        xUpperLimit = xUpperLimit || 0;
        yUpperLimit = yUpperLimit || 0;
        var ranX = (Math.random() * (instance.w + xUpperLimit)) + instance.x + xShift;
        var ranY = (Math.random() * (instance.h + yUpperLimit)) + instance.y + yShift;
        return {x: ranX, y: ranY};
      };
      
      instance.isColliding = function (collider, success, failure) {
        if (instance.getState("collideable") && collider.getState("collideable")) {
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
      };
      
      instance.contains = function (vector, success, failure) {
        var v1 = vector.x > instance.x;
        var v2 = vector.x < instance.x + instance.w;
        var v3 = vector.y > instance.y;
        var v4 = vector.y < instance.y + instance.h;
        
        if (v1 && v2 && v3 && v4) {
          typeof(success)=="function"? success(): null;
          return true;
        }
        else {
          typeof(failure)=="function"? failure(): null;
          return false;
        }
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
      };
      
      return instance;
    },
    circ: function (mutator) {
      var instance = this.entity(mutator);
      
      var area = Math.pi * Math.pow(instance.w / 2, 2);
      
      // more methods to add here. use the same names from the rect class.
      instance.getDraw = function () {
        return { 
          type: "circ",
          x: this.x,
          y: this.y,
          w: this.w,
          h: this.h,
          color: color,
          alpha: alpha
        };
      }
      
      instance.getArea = function () {
        return area
      }
      
      instance.getCenter = function () {
        var x = instance.x + instance.w / 2;
        var y = instance.y + instance.h / 2;
        return {x: x, y : y};
      }
      
      return instance;
    },
    // call it a proxy-class if you will. This relays to a different class depending on values in mutator
    shape : function (mutator) {
      var instance = classes[mutator.shape] ? classes[mutator.shape](mutator): classes.rect(mutator);
      instance.shape = mutator.shape || 'rect';
      var collideable = mutator.collideable? mutator.collideable: true;
      instance.setState("collideable", collideable);   // using class entity's FSM 
      
      return instance;
    },
    composite: function (mutator) {
      var instance = classes.shape(mutator);
      // composite entities store other entities in layers
      var layers = {};
      
      instance.getLayer = function (layerId, callback) {
        var layer = layers[layerId];
        if (typeof(callback) == "function" && layer) {
          for (var i = 0; i < layer.length; i ++) {
            callback(layer[i]);
          }
        }
        else
        {
          return layer;
        }
      }
      
      instance.addLayers = function (layerMutator) {
        for (var i in layerMutator) {
          instance.addLayer(i, layerMutator[i]);
        }
      }
      
      instance.addLayer = function (layerId, arr) {
        console.log(layerId, arr);
        var layer = arr || []
        layers[layerId] = layer;
      }
      
      instance.pushToLayer = function (layerId, entity) {
        var layer = layers[layerId];
        layer.push(entity);
      };
      
      instance.orderLayers = function () {
        
      };

      instance.getDraw = function () {
        //console.log(instance.layers);
        
        return {
          type: "complex",
          layers: layers
        };
      }
      
      return instance;
      
    },
    sprite : function (mutator) {
      // sprites support layers, so they are composite
      var instance = this.composite(mutator);
      
      // inner factory
      function animationFactory(animMutator) {
        
        // inner frame factory
        function frame (sx, sy, sw, sh) {
          
          return {
            sx: sx,
            sy: sy,
            sw: sw,
            sh: sh
          };
          
        }
        
        // mutator for animation, separate from sprite mutator
        animMutator = animMutator? animMutator: {};
        
        var animation = {};
        
        // animations have names
        animation.name = animMutator.name;
        
        // frames are determined using modular arithmetic
        // based on the sprite sheet size. It's not possible
        // to 'skip' frames in the sheet.
        // frame from sprite sheet where animation starts
        var start = animMutator.start;
        // frame on the sheet where the animation stops
        var stop = animMutator.stop;
        // width of the animation
        var w = instance.w;
        var h = instance.h;
        
        // does it loop? no by default
        var looping = animMutator.looping? animMutator.looping: false;
        // does it play forwards, and then backwards? no by default
        var pingpong = animMutator.pingpong? animMutator.pingpong: false;
        var fps = animMutator.fps? animMutator.fps: 12;
        // frames for the animation
        var frames = [];
        
        // iterate from the start value, up to stop value exclusive
        for ( var i = start; i < stop; i++) {
          // using modular arithmetic to find the x of sub image 
          var x = (i * w) % imageW;
          // using division to find the y value of sub image
          var y = Math.floor((i * w) / imageW) * h;
          // create a frame (sub image) with the x y.
          frames.push(frame(x, y, w, h));
        }
        
        // set default (ending) frame, set by user. default to last frame
        var defaultFrame = animMutator.defaultFrame || frames.length - 1;
        
        // callback when animation is over
        var onenterframe = animMutator.onenterframe;
        var onend = animMutator.onend;
        
        //console.log(stop);
        var currentFrame = 0;
        var done = false;

        var timer = jas.Util.timer(1000/fps, false);
        timer.start();

        animation.update = function () {
          
          if (done) {
            return; 
          }
          
          // if it's time to change the frame...
          timer.checkTime(function() {
            
            // increment the frame
            var lastFrame = ++currentFrame >= frames.length;
            
            // calls onenterframe only if it is set
            onenterframe && onenterframe(currentFrame);
            
            if (lastFrame && looping) {
              currentFrame = 0;
            }
            
            else if (lastFrame) {
              currentFrame = defaultFrame || frames.length - 1;
              // only call onend if it exists
              onend && onend();
              
              done = true
            }
          });
        };
        
        // get current frame
        animation.getCurrentFrame = function () {
          return frames[currentFrame];
        };
        
        // reset animation
        animation.reset = function() {
          currentFrame = 0;
          done = false;
        };
        
        // is it the default animation?
        if (animMutator.def) {
          instance.anim = animation;
        }
        
        return animation;
        
      }
      // end animation class
      
      // sprite sheet used for sprite
      var imageId = mutator? mutator.imageId: null;
      
      // sprite sheet width and height
      var imageW = jas.Asset.getImage(imageId).width;
      var imageH = jas.Asset.getImage(imageId).height;
      
      // sprites animation
      instance.animations = {};
      
      // if there are no animations in the mutator, use a still image
      mutator.animations = mutator.animations || [{name:"still", start: 0, stop: 1, def: true}];
      
      // build animations using each mutator
      for (var i in mutator.animations) {
        var animData = mutator.animations[i];
        instance.animations[animData.name] = animationFactory(animData);
      }
      
      // sets the default animation
      instance.setAnim = function (animId) {
        instance.anim = instance.animations[animId];
      };
      
      instance.getAnimId = function () {
        return instance.anim.name;
      };
      
      instance.addAnim = function (animId, animMutator) {
        instance.animations[animId] = animationFactory(animMutator);
        if (animMutator.def) {
          instance.anim = instance.animations[animId];
        }
      };
      
      instance.updateAnim = function () {
        instance.anim.update();
      };
      
      instance.resetAnim = function (animId) {
        if (animId) {
          instance.animations[animId].reset();
        }
        else {
          instance.anim.reset();
        }
      };
      
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
      };

      return instance;
      
    },
    spawnZone: function (mutator) {
      var mutator = mutator || {};
      mutator.alpha = mutator.alpha || .4; // set transparency for testing/rendering
      
      var instance = this.shape(mutator);
      
      var intervalFixed = mutator.intervalFixed !== false ? true: false;
      var spawnType = mutator.spawnType;
      var spawnMutator = mutator.spawnMutator || {};
      var spawnRate = mutator.spawnRate || 3000;
      var spawnCount = 0;
      var spawnPosition = mutator.spawnPosition || "origin";
      var spawnGroup = mutator.spawnGroup || null;
      var spawnMax = mutator.spawnMax || 10;
      var spawnIds = {};
      var active = mutator.active || false;
      
      var timer = jas.Util.timer(spawnRate, intervalFixed);
      timer.start();
      
      instance.configureSpawn = function (defSpawnType, defSpawnMutator) {
        spawnType = defSpawnType;
        spawnMutator = defSpawnMutator;
      };
      
      // returns a function that returns vector
      function getSpawnStrategy () {
        var vector = {};
        if(spawnPosition == "random") {
          return function () {
            return instance.getRandomVector( 0, 0, -spawnMutator.w, -spawnMutator.h);  
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
      
      instance.spawn = function () {
        if (spawnCount < spawnMax && active) {
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
      };
      
      instance.start = function () {
        active = true;
      };
      
      instance.stop = function () {
        active = false;
      }
      
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
      
      instance.clear = function () {
        for (var i in spawnIds) {
          var id = spawnIds[i];
          instance.removeSpawnById(id);
        }
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
      var instance = this.composite(mutator);
      
      var tileMutators = {};
      
      var tileW = mutator.tileW,
          tileH = mutator.tileH,
          imageId = mutator.imageId;
      
      instance.configureTile = function (tileId, mutatorFunction) {
        tileMutators[tileId] = mutatorFunction;
      };
      
      instance.makeTiles = function () {
        for (var i in mutator.layers) {
          var layer = [];

          
          for (var j in mutator.layers[i].entities) {
            var tileData = mutator.layers[i].entities[j];
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
            layer.push(tile);
          }
          instance.addLayer(mutator.layers[i].name, layer);
          
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
  
  function getEntityById(id) {
    return entities[id];
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
