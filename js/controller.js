(function (jas) {
  // controllers communicate to entities
  var controllerAutoId = 0;
  
  var controllers = [];
  
  // the master controller relays controls to all other controllers
  function masterControllerFactory(canvas) {
    controller = {};
    
    jas.Event.addPublication("MOUSE_IS_PRESSED");
    jas.Event.addPublication("MOUSE_IS_DOWN");
    jas.Event.addPublication("MOUSE_IS_UP");
    
    canvas.addEventListener('mousedown', function (e) {
      if (controller.mouseup) {
        delete controller.mouseup;
        jas.Event.publish("MOUSE_IS_PRESSED", e);
      }
      controller.mousedown = true;
      jas.Event.publish("MOUSE_IS_DOWN", e);
      
    }, false);
    
    canvas.addEventListener('mouseup', function () {
      if (controller.mousedown) {
        delete controller.mousedown;
        jas.Event.publish("MOUSE_IS_UP", e);
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
    
    var keysByNum = {};
    
    for (var i in keyCodes) {
      keysByNum[keyCodes[i]] = i;
      jas.Event.addPublication(i + "_IS_PRESSED");
      jas.Event.addPublication(i + "_IS_DOWN");
      jas.Event.addPublication(i + "_IS_UP");
    }
    
    function addKey (e) {
      var key = keysByNum[e.keyCode];
      
      if (!keys[e.keyCode]) {
        jas.Event.publish(key + "_IS_PRESSED");
      }
      
      keys[e.keyCode] = true;
    }
  
    function removeKey(e) {
      delete keys[e.keyCode];
      var key = keysByNum[e.keyCode];
      jas.Event.publish(key+ "_IS_UP");
    }
    
    
    window.addEventListener('keydown', addKey, false);
    
    window.addEventListener('keyup', removeKey, false);
    
    function isKeyDown (key) {
      var isIt = keys[keyCodes[key]];
      if (isIt) {
        jas.Event.publish(keysByNum[keyCodes[key]] + "_IS_DOWN");
      }
      return  isIt ? true: false;
    }
    
    
    // master controller public api
    var controller = {
      isKeyDown: isKeyDown,
      areKeysDown: function (keyArr) {
        for (var i in keyArr) {
          var key = keyArr[i];
          isKeyDown(key)
        }
      },
      areAllKeysDown: function (keyArr, callback) {
        for (var i in keyArr) {
          var key = keyArr[i];
          if (!isKeyDown(key)) {
            return false;
          }
        }
        typeof(callback) == "function" ? callback(): null;
        return true;
      },
      keysNotPressed: function (keyArr) {
        for (var i in keyArr) {
          var key = keyArr[i];
          if (isKeyDown(key)) {
            return false;
          }
        }
        typeof(callback) == "function" ? callback(): null;
        return true;
      }
    };
    
    return controller;
  }
  
  // controller classes
  var classes = {
    
    controller: function (mutator) {
      mutator = mutator || {};
      var instance = {};
      subscriptions = {};
      
      instance.id = controllerAutoId++;
      function subscribeAll () {
        // add subscribers to master controllers publications
        for (var pub in mutator) {
          var subscription = jas.Event.subscribe(pub, mutator[pub]);
          subscriptions["jas-controller-" + controllerAutoId] = subscription;
        }
      }
      
      subscribeAll();
      
      instance.kill = function () {
        for (var i in subscriptions) {
          var subscription = subscriptions[i];
          subscription.unsubscribe();
        }
      };
      
      instance.revive = function () {
        for (var i in subscriptions) {
          var subscription = subscriptions[i];
          subscription.resubscribe();
        }
      };
      
      return instance;
    }
    
  };

  function inst (type, mutator) {
      return classes[type](mutator);
  }
  
  function newClass (type, mutatorFunction) {
    if (typeof(mutatorFunction) == "function") {
      classes[type] = mutatorFunction;
    }
    else {
      return false;
    }
  }
  //yeah
  jas.controllerFactory = masterControllerFactory;
  
  jas.Controller = {
    inst: inst,
    newClass: newClass
  };
})(jas);
