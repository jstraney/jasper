(function (jas) {
  var stateAutoId = 0;
  
  // Gamestates
  var states = {};
  var state = null;
  
  // frame
  var canvas, ctx, controller, graphics;

  
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
    
    controller = jas.controllerFactory(canvas);
    graphics = jas.graphicsFactory(canvas, ctx);
    
    gameFrame.appendChild(canvas);
    // init game states
    if (Object.keys(states).length == 0) {
      initError("You must inject at least one game state using jas.addState\n");  
    }

    for (var i in states) {
      states[i].init();
    }

  }
  
  function begin() {
    then = Date.now();
    main();
  }
  
  function main() {
    var now = Date.now() - then;
    state.update(now, controller);
    state.render(graphics);
    requestAnimationFrame(main);
  }
  
  
  // GAME STATES PUBLIC API
  function addState (stateName, init, update, render) {
    
    var stateInit = init;
    
    var newState = {
      stateName: stateName,
      init: stateInit,
      update: update,
      render: render
    };
    
    states[stateName] = newState;
    
    if (state == undefined) {
      state = newState;
    }
  } 
  
  function changeState(stateId) {
    state = states[stateId];
  }
  
  jas.init = init;
  jas.begin = begin;
  jas.addState = addState;
  jas.changeState = changeState;
    
})(jas);