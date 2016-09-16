(function (jas) {
  var states = {};
  var stateAutoId = 0;
  
  var state = null;
  
  // GAME STATES PUBLIC API
  function addState (stateName, init, update, render) {
    
    jas.Event.addPublication("enter-state-" + stateName);
    jas.Event.addPublication("exit-state-" + stateName);
    
    states[stateName] = {
      stateName: stateName,
      init: init,
      update: update,
      render: render,
      changeState: changeState
    };
    
  }
  
  function changeState(stateId) {
    
    state = states[stateId];
    
    jas.Event.publish("exit-state-" + state.stateName);
    jas.Event.publish("enter-state-" + stateId);

  }
  
  function updateState (now, Controller, Graphics) {
    state.update(now, Controller);
    state.render(Graphics); 
  }

  function initAllStates() {
    
    var first;
    
    for (var i in states) {
      first = first || i;
      states[i].init();
    } 
    
    changeState(first);
    
  }
  
  function initState(stateName) {
    states[stateName].init();  
  }
  
  jas.State = {
    addState: addState,
    initAllStates: initAllStates,
    initState: initState,
    updateState: updateState,
    changeState: changeState
  };
  
})(jas);