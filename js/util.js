(function (jas) {
  function timer(interval, isRandom) {
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
        if (typeof(itsTime) == "function") {
          itsTime();
        }
        then = now;
        if (isRandom) {
          setTimer(originalInterval);  
        }
        return true;
      }
      else {
        //console.log(getTime());
        if (typeof(notTime) == "function") {
          notTime();
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
  
  jas.Util = {
    timer: timer,
    finiteStateMachine: finiteStateMachine
  }
})(jas);