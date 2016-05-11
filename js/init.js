(function (jas) {
  // frame
  var canvas, ctx, Controller, Graphics;

  
  // animation
  var then;
  var wn = window;
  var requestAnimationFrame = wn.requestAnimationFrame || wn.mozRequestAnimationFrame ||
   wn.msRequestAnimationFrame || wn.webkitRequestAnimationFrame || wn.oRequestAnimationFrame;
   
   
  // STARTER FLUID METHODS
  // init method accepts id attribute of DOM game frame.
  function init (frameId, w, h) {
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

  }
  
  function begin() {
    then = Date.now();
    main();
  }
  
  function main() {
    var now = Date.now() - then;
    jas.State.updateState(now, Controller, Graphics);
    requestAnimationFrame(main);
  }
  
  
  jas.init = init;
  jas.begin = begin;
  
    
})(jas);