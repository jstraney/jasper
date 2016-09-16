(function (jasper) {
  var UP = 0,
      OVER = 1,
      DOWN = 2,
      ACTIVE = 3;
  
  
  // gui components are like entities, and treated as such
  // but are in fact DOM elements
  function elem (type) {
    return document.createElement(type);
  }
  
  function getById(id) {
    return document.getElementById(id);
  }
  
  var classes = {
    component: function (mutator) {
      mutator = mutator || {};
      
      var classes = {};
      // html classes
      var elemClasses = mutator.classes || "";
      
      // html style attribute. will override class css
      var elemStyle = mutator.style || "";
      
      var instance = elem("div");
      
      // the parent dom container for the component
      // usually this is another widget, but in the case
      // of widgets, it can be your game container, or
      // another element outside of it.
      if (mutator.context) {
        var context = getById(mutator.context);
        context.appendChild(instance);
      }
      
      
      function addClass (classStr) {
        if (!classes[classStr])
          instance.className += classStr + " ";
        classes[classStr] = true;
      }
      
      function addClasses (classArr) {
        for (var i in classArr) {
          var classStr = classArr[i];
          addClass(classStr);
        }
      }
      
      function setClasses (classListStr) {
        var classArr = classListStr.split(" ");
        
        instance.className = "";
        addClasses(classArr);
      }

      
      // styling should be done by CSS such as positioning
      // color, font, etc. Events are handled by js
      setClasses(elemClasses);
      
      instance.setClasses = setClasses;
      
      instance.addClass = addClass;
      
      instance.addClasses = addClasses;
      
      instance.setAttribute("style", elemStyle);

      instance.removeClass = function (sansClass) {
        
        classStr = "";
        
        delete classes[sansClass];
        
        for (var i in classes) {
          classStr += i + " ";
        }
        
        instance.setAttribute("class", classStr);
        
      };
      
      var display = instance.style.display;
      
      instance.hide = function () {
        instance.style.display = "none";
      };
      
      if (mutator.hide) {
        var hide = jas.Event.subscribe(mutator.hide, function () {
          instance.hide();
        });
      }
      
      instance.show = function () {
        instance.style.display = display;   
      };

      if (mutator.show) {      
        var show = jas.Event.subscribe(mutator.show, function () {
          instance.show();
        });
      }
      

      return instance;
            
    },
    widget: function (mutator) {
      var instance = classes.component(mutator);
      
      instance.appendComponents = function (components) {
        for (var i in arguments) {
          var component = arguments[i];
          instance.appendChild(component);  
        }
      }
      
      return instance;
      
    },
    label : function (mutator) {
      var instance = classes.component(mutator);
      var text = mutator.text;
      instance.innerText = text;
      
      function changeText (fn) {
        if (jas.Util.isFunction(fn)) {
          // use callback to assign text
          text = fn(text);
          // update dom
          instance.innerText = text;
        }
      }

			instance.changeText = changeText;

			return instance;
      
    },
    button : function (mutator) {   
      var changeState = mutator.changeState;

      var instance = classes.component(mutator);
      
      var MOUSE_IS_CLICKED = mutator.MOUSE_IS_CLICKED,
          MOUSE_IS_UP = mutator.MOUSE_IS_UP,
          MOUSE_IS_DOWN = mutator.MOUSE_IS_DOWN,
          MOUSE_IS_OVER = mutator.MOUSE_IS_OVER,
          MOUSE_IS_OUT = mutator.MOUSE_IS_OUT;
      
      // add event listener if a callback is found
      if (MOUSE_IS_CLICKED) {
        instance.addEventListener("click", function () {
          MOUSE_IS_CLICKED();
        }, false);
      }
        
      // a button is usually going to have some kind of
      // state change on mouse interaction, so these are
      // added by default. If you don't like this, you can
      // extend the component class.
      instance.addEventListener("mouseup", function () {
        changeState(UP);
        if (MOUSE_IS_UP) {
          MOUSE_IS_UP();
        }
      }, false);
      
        
      
      instance.addEventListener("mousedown", function () {
        changeState(DOWN);
        if (MOUSE_IS_DOWN) {
          MOUSE_IS_DOWN();
        }
      }, false);
      
      
      
      instance.addEventListener("mouseover", function () {
        changeState(OVER);
        if (MOUSE_IS_OVER) {
          MOUSE_IS_OVER();
        }
      }, false);
      
      instance.addEventListener("mouseout", function () {
        changeState(UP);
        if (MOUSE_IS_OUT) {
          MOUSE_IS_OUT();
        }
      }, false);
      
      
      return instance;
    },
    textButton : function (mutator) {
      var text = mutator.text || "";
      var overText = mutator.overText || text;
      var downText = mutator.downText || text;
      
      mutator.changeState = function (state) {
        if (state == UP) {
          instance.innerText = text;
        }
        else if (state == OVER) {
          instance.innerText = overText;
        }
        else if (state == DOWN) {
          instance.innerText = downText;
        }
      };
      
      var instance = classes.button(mutator);
      
      instance.innerText += text;
      
      return instance;
      
    },
    imgButton : function (mutator) {
      
      var instance = classes.button(mutator);
      
      
      return instance;
    }
    
  };

  function inst (type, mutator) {
    if (jasper.Util.isFunction(classes[type])) {
      return classes[type](mutator);
    }
  }

	function newClass (type, callback) {
    if (jasper.Util.isFunction(callback)) {
      classes[type] = callback;
		}
	}

  jasper.GUI = {
    UP: UP,
    OVER: OVER,
    DOWN: DOWN,
    inst: inst,
		newClass: newClass
  };

})(jas);
