(function (jas) {
  
  var physicsAutoId = 0;
  
  var DIRS = {
    UP: -1,
    RIGHT: 1,
    DOWN: 1,
    LEFT: -1
  };

  var classes = {
    // simple vector updates a value constantly
    // e.g. gravity, hitting a wall in most games
    core: function (mutator) {
      mutator = mutator || {};
      var instance = {};
      
      var update;
      
      instance.bind = function (entity) {
        // all physics just modify some numeric property
        // could in theory be torque, heat. most commonly x, y.
        update = function (prop, val) {
          entity[prop] += val;
        }
        instance.update = update;
      };
      
      
      
      return instance;
    },
    orthogonal: function (mutator) {
      // zelda-like physics
      var dirX = 0,
          dirY = 0;
          
      var instance = classes.core(mutator);
      instance.resetDirs = function () {
        dirX = 0;
        dirY = 0;
      }
      
      instance.resetDirX = function () {
        dirX = 0;
      }
      
      instance.resetDirY = function () {
        dirY = 0;
      }
      
      instance.up = function (val) {
        dirY = DIRS.UP;
        instance.update("y", -val);
      };
      instance.right = function (val) {
        dirX = DIRS.RIGHT;
        instance.update("x", val);
      };
      instance.down = function (val) {
        dirY = DIRS.DOWN;
        instance.update("y", val);
      };
      instance.left = function (val) {
        dirX = DIRS.LEFT;
        instance.update("x", -val);
      };
      instance.collide = function (val) {
        if (dirY == DIRS.UP ) {
          instance.update("y", val);
        }
        else if (dirY == DIRS.DOWN) {
          instance.update("y", -val);
        }
        
        if (dirX == DIRS.RIGHT) {
          instance.update("x", -val);
        }
        else if (dirX == DIRS.LEFT) {
          instance.update("x", val);
        } 
      }
      return instance;
    },
    radial: function (mutator) {
    // pinball-like physics
      var instance = classes.core(mutator);
      
      var xVel, yVel = 0;
      var lastX, lastY;
      
      instance.move = function (deg, val) {
        // todo, do some trig to get x and y differences
        
        
        instance.update('x', xVal);
        instance.update('y', yVal);
      };
      
      instance.collide = function (val) {
        
      }
      
      instance.gravity = function (val) {
        instance.update("y", val);
      }
    },
    platformer: function (mutator) {
    // mario-like physics
      mutator = mutator || {};
      
      var instance = classes.core();
      instance.left = function () {
        instance.update("x", -val);
      };
      instance.right = function () {
        instance.update("x", val);
      };
      instance.collide = function () {
        // logic for landing ontop of things
        
        // logic for left and right collision
      };
      instance.jump = function (rad, val) {

      };
      instance.gravity = function (val) {
        instance.update("y", val);
      };
      
      return instance;
    }
  }
  
  function inst (type, mutator) {
    if (typeof(classes[type]) == 'function') {
      return classes[type](mutator);
    }
    else {
      return false;
    }
  }

  function newClass (type, callback) {
    if (typeof(callback) == "function") {
      classes[type] = callback;
    }
  }
  
  jas.Physics = {
    inst: inst,
    newClass: newClass
  }

})(jas);
