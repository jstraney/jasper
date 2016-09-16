(function (jas) {
  
  function isFunction (fn) {
    if (typeof(fn) == "function")
      return true;
    
    false; 
  
  }
  
  function timerFactory(interval, isRandom) {
    var then;
    var done;
    var originalInterval = interval || null;
    var interval = interval || null;
    var timeSet = interval ? true: false;
    var isRandom = isRandom || false;
    
    
    
    function start () {
      originalInterval = originalInterval || 0;
      interval = interval || 0;
      timeSet = true;
      then = Date.now();
    }
    
    function getInterval () {
      return interval;
    }
    
    function contractInterval(amount) {
      interval -= amount;
    }
    
    function expandInterval(amount) {
      interval += amount;
    }
    
    function stop () {
      done = true;
    }
    
    function setTimer (duration) {
      if (isRandom) {
        interval = (Math.random() * duration);
      }
      else {
        interval = duration;  
      }
      
    }
    
    function checkTime (itsTime, notTime) {
      if (done) {
        return;
      }
      var now = Date.now();
      
      if (now - then >= interval) {
        if (isRandom) {
          setTimer(originalInterval);  
        }
        if (typeof(itsTime) == "function") {
          then = now;
          return itsTime(now);
        }
        return true;
      }
      else {
        //console.log(getTime());
        if (typeof(notTime) == "function") {
          return notTime(now - then);
        }
        
        return false;
      }
      
    }
    
    function getStart() {
      return then;
    }
    
    function getTime () {
      return Date.now() - then;
    }
    
    return {
      start: start,
      stop: stop,
      setTimer: setTimer,
      checkTime: checkTime,
      getInterval: getInterval,
      getTime: getTime
    }
  }
  
  function finiteStateMachine () {
    // the finite state machine will be used in entities. possibly other things
    var states = {};
    
    function setState (state, status) {
      states[state] = status;
    }
    
    function getState (state) {
      return states[state];
    }
    
    function checkStatus (state, status) {
      return states[state] == status? true: false;
    }
        
    return {
      setState: setState,
      getState: getState,
      checkStatus: checkStatus
    };
  }
  
  function graphFactory () {
    // factory that graphs lines and points on lines
    
    var classes = {
      constant: function (y) {
        return function (x) {
          return y; // lol
        };
      },
      linear: function (m, b) {
        return function (x) {
          return m*x + b;
        };
      },
      exponential: function (b) {
        return function(x) {
          return x * x + b;
        };
      },
      quadratic: function (a, b, c) {
        return function (x) {
          return (a * x * x) + (b * x) + c;
        };
      },
      logarithmic: function (x) {
        return function (x) {
          
        };
      }
    };
    
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
    
    return {
      inst: inst,
      newClass: newClass
    }
  }
  
  var Graph = graphFactory();
  
  
  
  jas.Util = {
    isFunction: isFunction,
    timer: timerFactory,
    finiteStateMachine: finiteStateMachine,
    Graph: Graph
  };
})(jas);