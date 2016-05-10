(function (jas) {
  // controller factory must attach event handlers to DOM canvas
  function controllerFactory(canvas) {
    controller = {};
    
    canvas.addEventListener('mousedown', function () {
      if (controller.mouseup) {
        delete controller.mouseup;
      }
      controller.mousedown = true;
    }, false);
    
    canvas.addEventListener('mouseup', function () {
      if (controller.mousedown) {
        delete controller.mousedown;
      }
      controller.mouseup = true;
      
      window.setTimeout(function () {
        delete controller.mouseup;
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
      isKeyDown: function (key, callback) {
        var isIt = keys[keyCodes[key]];
        if (isIt && typeof(callback) == "function") {
          callback(); 
        }
        return  isIt ? true: false;
      },
      areKeysDown: function (keyArr, callback) {
        for (var i in keyArr) {
          var key = keyArr[i];
          if (!this.isKeyDown(key)) {
            return false;
          }
        }
        typeof(callback) == "function" ? callback(): null;
        return true;
      },
      keysNotPressed: function (keyArr) {
        for (var i in keyArr) {
          var key = keyArr[i];
          if (this.isKeyDown(key)) {
            return false;
          }
        }
        typeof(callback) == "function" ? callback(): null;
        return true;
      }
    };
    
    return controller;
  }
  
  jas.controllerFactory = controllerFactory;
})(jas);