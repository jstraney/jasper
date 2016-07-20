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
      var color = mutator.color || null;
      var alpha = mutator.alpha != null? mutator.alpha: null;
      
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
      instance.shape = mutator.shape;
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
        return {
          type: "complex",
          layers: instance.layers
        };
      }
      
      return instance;
      
    },
    // todo: make a GUI component class
    component: function (mutator) {
      var instance = classes.composite(mutator);
      
      var parent;
      // a widget will be a component that contains components
      
      
      return instance;
    },
    widget: function (mutator) {
      mutator.shape = mutator.shape || "rect";
      var instance = classes.component(mutator);
      var padding = mutator.padding || 5;
            
      
      var rows = [];
      instance.addRow = function (callback) {
        function rowFactory () {
          var row = [];
          row.w = 0;
          row.h = 0;
          row.addEntity = function (entity) {
            row.push(entity.id);
          };
          row.getEntityDimensions = function (col) {
            var dimensions = {};
            var entity = entities[row[col]];
            dimensions.w = entity.w;
            dimensions.h = entity.h;
            return dimensions;
          };
          
          return row;
        }
        
        var row = rowFactory();
        rows.push(row);
        if (typeof(callback) == "function") {
          callback(row);
        }
      };
      
      instance.pack = function () {
        // minimum size for parent container
        function fillWidget () {
          var maxW = 0;
          var maxH = 0;
          for (var i in rows) {
            var row = rows[i];
            row.w = 0; // reset these things
            row.h = 0;
            row.col = 0;
            for (var j in row) {
              row.col++; // calculate row
              var entity = row[j];
              row.w += entity.w;
              row.h = entity.h > row.h? entity.h: row.h;
            }
            // apply padding. change widget width and height
            row.h += (i + 1) * padding;
            row.w += (row.col + 1) * padding;
            maxW = row.w > maxW? row.w: maxW;
            maxH += row.h;
          }
          instance.w = maxW;
          instance.h = maxH;
        }
        
        function placeComponents() {
          var y = instance.y + padding;
          for (var i in rows) {
            var row = rows[i];
            var x = instance.x + padding;
            for (var j in row) {
              var onColNum = 0;
              var colW = row.col / instance.w;
              
              var entityId = row[j];
              entites[entityId].x = x;
              entites[entityId].y = y;
              x = colW * onColNum + padding;
            }
            y += row.h + padding;
          }
        }
        
        fillWidget();
        placeComponents();
      };
      
      return instance;
    },
    text: function (mutator) {
      mutator = mutator || {};
      var color = mutator.color || "#fff";
      var alpha = mutator.color || 1;
      var font = mutator.font || "1em arial";
      var string = mutator.string;
      var instance = classes.sprite(mutator);
      
      
      instance.changeText = function (callback) {
        if ( typeof(callback) == "function") {
          string = callback(string);
        }
        makeTextImage(); // reset image
      };

      instance.getDraw = function () {
        return {
          type: "text",
          x: instance.x,
          y: instance.y,
          string: string,
          color: color,
          alpha: alpha,
          font: font
        };
      };
      
 
      // saving text to an image is more efficient than re-rendering text via canvas.
      function makeTextImage() {
        var tempCanvas = document.createElement("canvas");
        tempCanvas.width = 50;
        tempCanvas.height = 50;
        var ctx = tempCanvas.getContext("2d");
        
        var dimensions = ctx.measureText(string);
        tempCanvas.width = dimensions.width;
        tempCanvas.height = 50;
        
        
        ctx.font = font;
        ctx.fillStyle = color;
        ctx.globalAlpha = alpha;
        
        
        ctx.fillText(string, 0, 10);
        var url = tempCanvas.toDataURL();

        //save string as a png in Assets. Once loaded, change draw.
        jas.Asset.newImageFromCanvas("text-image:"+instance.id, url, function (image) {
          document.appendChild(image);
          
          var draw = {
            type: "sprite",
            frame: {
              sx: 0,
              sy: 0,
              sw: tempCanvas.width,
              sh: tempCanvas.height,
              x: instance.x,
              y: instance.y,
              w: tempCanvas.width,
              h: tempCanvas.height
            },
            imageId: url
          };
          
          instance.getDraw = function () {
            return draw;
          };

        });
      }
      
      makeTextImage();
      
      
      return instance;
    },
    label : function (mutator) {
      mutator = mutator || {};
      
      var instance = classes.component(mutator);
      
      var textMutator = mutator.text || {};
      
      var x = mutator.x;
      var y = mutator.y;
      var w = mutator.w;
      var h = mutator.h;
      
      var text = classes.text({
        string: mutator.string,
        x: x,
        y: y + h,
        w: w,
        h: h,
        color: mutator.textColor,
        alpha: mutator.textAlpha  
      });
      
      //var frame = classes.rect(mutator.frame);
      var shapeMutator = mutator.shape || {};
      var shapeType = shapeMutator.type || "rect";

      var container = classes.rect({
        x: x,
        y: y,
        w: w,
        h: h,
        color: mutator.shapeColor,
        alpha: mutator.shapeAlpha  
      });
      
      //console.log(container);
      instance.addLayers({
        text: [text],
        container:[container]
      });
      

      instance.changeLabelText = function (callback) {
        instance.getLayer("text")[0].changeText(callback);
      };
      
      return instance;
    },
    sprite : function (mutator) {
      var instance = this.composite(mutator);
      
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
        
        var defaultFrame = animMutator.defaultFrame || frames.length - 1;
        
        animation.onend = animMutator.onend;
        
        //console.log(stop);
        var currentFrame = 0;
        var done = false;

        var timer = jas.Util.timer(1000/fps, false);
        timer.start();

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
              currentFrame = defaultFrame || frames.length - 1;
              if (typeof(animation.onend) == "function") {
                animation.onend();
              }
              done = true
            }
          });
        };
        
        animation.getCurrentFrame = function () {
          return frames[currentFrame];
        };
        
        animation.reset = function() {
          currentFrame = 0;
          done = false;
        };
        
        if (animMutator.def) {
          instance.anim = animation;
        }
        return animation;
      }
      
      
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
          instance.animation[animId].reset();
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