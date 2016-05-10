(function (jas) {
  var states = {};
  var stateAutoId = 0;
  
  var state = null;
  // GAME STATES PUBLIC API
  function addState (stateName, init, update, render) {
    
    states[stateName] = {
      stateName: stateName,
      init: init,
      update: update,
      render: render
    };
    
    if (state == undefined) {
      state = newState;
    }
  } 
  
  function changeState(stateId) {
    state = states[stateId];
  }
  
  function initAllStates() {
    if (Object.keys(states).length == 0) {
      initError("You must inject at least one game state using jas.addState\n");  
    }

    for (var i in states) {
      states[i].init();
    } 
  }
  
  function initState(stateName) {
    states[stateName].init();  
  }
  
  jas.State = {
    addState: addState,
    changeState: changeState,
    initAllStates: initAllStates,
    initState: initState
  };
  
})(jas);