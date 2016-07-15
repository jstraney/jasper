(function (jas) {
  // frame
  var canvas, ctx, Controller, Graphics;

  
  // animation
  var wn = window;
  var requestAnimationFrame = wn.requestAnimationFrame || wn.mozRequestAnimationFrame ||
   wn.msRequestAnimationFrame || wn.webkitRequestAnimationFrame || wn.oRequestAnimationFrame;
  var targetRate;
  var timer;
   
  // STARTER FLUID METHODS
  // init method accepts id attribute of DOM game frame.
  function init (frameId, w, h, target) {
    function initError (err) {
      console.error(err);
    }
    // init game frame
    var gameFrame = document.getElementById(frameId);
    canvas = document.createElement("canvas");
    
    // no width? set to 320
    canvas.width = w || 320;
    canvas.height = h || 320;
    
    //if canvas won't work
    canvas.innerHTML = "<h3>Your browser doesn't support HTML5 canvas!</h3>";
    canvas.innerHTML += "<p>Try one of these browsers...</p>";
    
    ctx = canvas.getContext("2d");
    
    Controller = jas.controllerFactory(canvas);
    Graphics = jas.graphicsFactory(canvas, ctx);
    
    gameFrame.appendChild(canvas);
    // init game states
    jas.State.initAllStates();
    
    targetRate = 1000/target || 1000/60;
    timer = jas.Util.timer(targetRate, false);
  }
  
  function begin() {
    timer.start();
    main();
  }
  
  function main() {
    requestAnimationFrame(main);
    timer.checkTime(function (time) {
      jas.State.updateState(time, Controller, Graphics);
    });
  }
  
  
  jas.init = init;
  jas.begin = begin;
  
    
})(jas);