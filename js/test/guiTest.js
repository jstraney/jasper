window.onload = function () {
  jas.State.addState("main",
  function init () {
    jas.Event.addPublication("nothing");
    
    var button = jas.GUI.inst("textButton", {
      text: "click me!",
      overText: "wait...",
      downText: "eeeeee",
      context: "game-frame",
      MOUSE_IS_CLICKED: function () {
        button.addClass("clicked");
      },
      MOUSE_IS_DOWN: function () {
        button.removeClass("clicked");
      },
      classes: "label test",
      style: "position: absolute; top: 10px; left: 10px;"
    });
    
    var takeMeOn = jas.Event.subscribe("nothing", function (data) {
      console.log(data.aha);
    });
  },
  function update (delta, Controller) {
    
  },
  function render (Graphics) {
    Graphics.fillScreen("#ff0");
    Graphics.renderGroup("gui");

  });
  
  jas.init("game-frame");
  jas.begin();
};