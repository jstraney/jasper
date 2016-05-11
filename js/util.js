(function (jas) {
  function timer() {
    var then;
    var done;
    var interval;
    
    function start () {
      then = Date.now();
    }
    
    function stop () {
      done = true;
    }
    
    function setTimer (duration) {
      interval = duration;
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
      }
      else {
        if (typeof(notTime) == "function") {
          notTime();
        }
      }
      then = now;
    }
    
    return {
      start: start,
      stop: stop,
      setTimer: setTimer,
      checkTime: checkTime  
    }
  }
  
  jas.Util = {
    timer: timer
  }
})(jas);