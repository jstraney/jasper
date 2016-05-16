function X2JS(v){var q="1.1.5";v=v||{};h();r();function h(){if(v.escapeMode===undefined){v.escapeMode=true;}v.attributePrefix=v.attributePrefix||"_";v.arrayAccessForm=v.arrayAccessForm||"none";v.emptyNodeForm=v.emptyNodeForm||"text";if(v.enableToStringFunc===undefined){v.enableToStringFunc=true;}v.arrayAccessFormPaths=v.arrayAccessFormPaths||[];if(v.skipEmptyTextNodesForObj===undefined){v.skipEmptyTextNodesForObj=true;}if(v.stripWhitespaces===undefined){v.stripWhitespaces=true;}v.datetimeAccessFormPaths=v.datetimeAccessFormPaths||[];}var g={ELEMENT_NODE:1,TEXT_NODE:3,CDATA_SECTION_NODE:4,COMMENT_NODE:8,DOCUMENT_NODE:9};function r(){function x(z){var y=String(z);if(y.length===1){y="0"+y;}return y;}if(typeof String.prototype.trim!=="function"){String.prototype.trim=function(){return this.replace(/^\s+|^\n+|(\s|\n)+$/g,"");};}if(typeof Date.prototype.toISOString!=="function"){Date.prototype.toISOString=function(){return this.getUTCFullYear()+"-"+x(this.getUTCMonth()+1)+"-"+x(this.getUTCDate())+"T"+x(this.getUTCHours())+":"+x(this.getUTCMinutes())+":"+x(this.getUTCSeconds())+"."+String((this.getUTCMilliseconds()/1000).toFixed(3)).slice(2,5)+"Z";};}}function t(x){var y=x.localName;if(y==null){y=x.baseName;}if(y==null||y==""){y=x.nodeName;}return y;}function o(x){return x.prefix;}function p(x){if(typeof(x)=="string"){return x.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#x27;").replace(/\//g,"&#x2F;");}else{return x;}}function j(x){return x.replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#x27;/g,"'").replace(/&#x2F;/g,"/");}function l(B,y,A){switch(v.arrayAccessForm){case"property":if(!(B[y] instanceof Array)){B[y+"_asArray"]=[B[y]];}else{B[y+"_asArray"]=B[y];}break;}if(!(B[y] instanceof Array)&&v.arrayAccessFormPaths.length>0){var x=0;for(;x<v.arrayAccessFormPaths.length;x++){var z=v.arrayAccessFormPaths[x];if(typeof z==="string"){if(z==A){break;}}else{if(z instanceof RegExp){if(z.test(A)){break;}}else{if(typeof z==="function"){if(z(B,y,A)){break;}}}}}if(x!=v.arrayAccessFormPaths.length){B[y]=[B[y]];}}}function a(C){var A=C.split(/[-T:+Z]/g);var B=new Date(A[0],A[1]-1,A[2]);var z=A[5].split(".");B.setHours(A[3],A[4],z[0]);if(z.length>1){B.setMilliseconds(z[1]);}if(A[6]&&A[7]){var y=A[6]*60+Number(A[7]);var x=/\d\d-\d\d:\d\d$/.test(C)?"-":"+";y=0+(x=="-"?-1*y:y);B.setMinutes(B.getMinutes()-y-B.getTimezoneOffset());}else{if(C.indexOf("Z",C.length-1)!==-1){B=new Date(Date.UTC(B.getFullYear(),B.getMonth(),B.getDate(),B.getHours(),B.getMinutes(),B.getSeconds(),B.getMilliseconds()));}}return B;}function n(A,y,z){if(v.datetimeAccessFormPaths.length>0){var B=z.split(".#")[0];var x=0;for(;x<v.datetimeAccessFormPaths.length;x++){var C=v.datetimeAccessFormPaths[x];if(typeof C==="string"){if(C==B){break;}}else{if(C instanceof RegExp){if(C.test(B)){break;}}else{if(typeof C==="function"){if(C(obj,y,B)){break;}}}}}if(x!=v.datetimeAccessFormPaths.length){return a(A);}else{return A;}}else{return A;}}function w(z,E){if(z.nodeType==g.DOCUMENT_NODE){var F=new Object;var x=z.childNodes;for(var G=0;G<x.length;G++){var y=x.item(G);if(y.nodeType==g.ELEMENT_NODE){var D=t(y);F[D]=w(y,D);}}return F;}else{if(z.nodeType==g.ELEMENT_NODE){var F=new Object;F.__cnt=0;var x=z.childNodes;for(var G=0;G<x.length;G++){var y=x.item(G);var D=t(y);if(y.nodeType!=g.COMMENT_NODE){F.__cnt++;if(F[D]==null){F[D]=w(y,E+"."+D);l(F,D,E+"."+D);}else{if(F[D]!=null){if(!(F[D] instanceof Array)){F[D]=[F[D]];l(F,D,E+"."+D);}}(F[D])[F[D].length]=w(y,E+"."+D);}}}for(var A=0;A<z.attributes.length;A++){var B=z.attributes.item(A);F.__cnt++;F[v.attributePrefix+B.name]=B.value;}var C=o(z);if(C!=null&&C!=""){F.__cnt++;F.__prefix=C;}if(F["#text"]!=null){F.__text=F["#text"];if(F.__text instanceof Array){F.__text=F.__text.join("\n");}if(v.escapeMode){F.__text=j(F.__text);}if(v.stripWhitespaces){F.__text=F.__text.trim();}delete F["#text"];if(v.arrayAccessForm=="property"){delete F["#text_asArray"];}F.__text=n(F.__text,D,E+"."+D);}if(F["#cdata-section"]!=null){F.__cdata=F["#cdata-section"];delete F["#cdata-section"];if(v.arrayAccessForm=="property"){delete F["#cdata-section_asArray"];}}if(F.__cnt==1&&F.__text!=null){F=F.__text;}else{if(F.__cnt==0&&v.emptyNodeForm=="text"){F="";}else{if(F.__cnt>1&&F.__text!=null&&v.skipEmptyTextNodesForObj){if((v.stripWhitespaces&&F.__text=="")||(F.__text.trim()=="")){delete F.__text;}}}}delete F.__cnt;if(v.enableToStringFunc&&(F.__text!=null||F.__cdata!=null)){F.toString=function(){return(this.__text!=null?this.__text:"")+(this.__cdata!=null?this.__cdata:"");};}return F;}else{if(z.nodeType==g.TEXT_NODE||z.nodeType==g.CDATA_SECTION_NODE){return z.nodeValue;}}}}function m(E,B,D,y){var A="<"+((E!=null&&E.__prefix!=null)?(E.__prefix+":"):"")+B;if(D!=null){for(var C=0;C<D.length;C++){var z=D[C];var x=E[z];if(v.escapeMode){x=p(x);}A+=" "+z.substr(v.attributePrefix.length)+"='"+x+"'";}}if(!y){A+=">";}else{A+="/>";}return A;}function i(y,x){return"</"+(y.__prefix!=null?(y.__prefix+":"):"")+x+">";}function s(y,x){return y.indexOf(x,y.length-x.length)!==-1;}function u(y,x){if((v.arrayAccessForm=="property"&&s(x.toString(),("_asArray")))||x.toString().indexOf(v.attributePrefix)==0||x.toString().indexOf("__")==0||(y[x] instanceof Function)){return true;}else{return false;}}function k(z){var y=0;if(z instanceof Object){for(var x in z){if(u(z,x)){continue;}y++;}}return y;}function b(z){var y=[];if(z instanceof Object){for(var x in z){if(x.toString().indexOf("__")==-1&&x.toString().indexOf(v.attributePrefix)==0){y.push(x);}}}return y;}function f(y){var x="";if(y.__cdata!=null){x+="<![CDATA["+y.__cdata+"]]>";}if(y.__text!=null){if(v.escapeMode){x+=p(y.__text);}else{x+=y.__text;}}return x;}function c(y){var x="";if(y instanceof Object){x+=f(y);}else{if(y!=null){if(v.escapeMode){x+=p(y);}else{x+=y;}}}return x;}function e(z,B,A){var x="";if(z.length==0){x+=m(z,B,A,true);}else{for(var y=0;y<z.length;y++){x+=m(z[y],B,b(z[y]),false);x+=d(z[y]);x+=i(z[y],B);}}return x;}function d(D){var x="";var B=k(D);if(B>0){for(var A in D){if(u(D,A)){continue;}var z=D[A];var C=b(z);if(z==null||z==undefined){x+=m(z,A,C,true);}else{if(z instanceof Object){if(z instanceof Array){x+=e(z,A,C);}else{if(z instanceof Date){x+=m(z,A,C,false);x+=z.toISOString();x+=i(z,A);}else{var y=k(z);if(y>0||z.__text!=null||z.__cdata!=null){x+=m(z,A,C,false);x+=d(z);x+=i(z,A);}else{x+=m(z,A,C,true);}}}}else{x+=m(z,A,C,false);x+=c(z);x+=i(z,A);}}}}x+=c(D);return x;}this.parseXmlString=function(z){var B=window.ActiveXObject||"ActiveXObject" in window;if(z===undefined){return null;}var A;if(window.DOMParser){var C=new window.DOMParser();var x=null;if(!B){try{x=C.parseFromString("INVALID","text/xml").childNodes[0].namespaceURI;}catch(y){x=null;}}try{A=C.parseFromString(z,"text/xml");if(x!=null&&A.getElementsByTagNameNS(x,"parsererror").length>0){A=null;}}catch(y){A=null;}}else{if(z.indexOf("<?")==0){z=z.substr(z.indexOf("?>")+2);}A=new ActiveXObject("Microsoft.XMLDOM");A.async="false";A.loadXML(z);}return A;};this.asArray=function(x){if(x instanceof Array){return x;}else{return[x];}};this.toXmlDateTime=function(x){if(x instanceof Date){return x.toISOString();}else{if(typeof(x)==="number"){return new Date(x).toISOString();}else{return null;}}};this.asDateTime=function(x){if(typeof(x)=="string"){return a(x);}else{return x;}};this.xml2json=function(x){return w(x);};this.xml_str2json=function(x){var y=this.parseXmlString(x);if(y!=null){return this.xml2json(y);}else{return null;}};this.json2xml_str=function(x){return d(x);};this.json2xml=function(y){var x=this.json2xml_str(y);return this.parseXmlString(x);};this.getVersion=function(){return q;};}
var jas = {};
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
(function (jas) {
  var publications = {};

  function publication () {
    var subscribers = {};
    function subscriber (callback) {
      return {
        callback: callback,
      } 
    }
    
    return {
      publish: function (event) {
        for (var i in subscribers) {
          subscribers[i].callback(event);
        }
      },
      addSubscriber: function (subId, callback) {
        subscribers[subId] = subscriber(callback);
      },
      removeSubscriber: function (subId) {
        delete subscribers[subId];
      }
    }
  }
  
  jas.Event = {
    addPublication: function (name) {
      publications[name] = publication();
    },
    remPublication: function (name) { // careful! destroys subscribers too
      delete publications[name];
    },
    subscribe: function (pubId, subId, callback) {
      publications[pubId].addSubscriber(subId, callback);
    },
    unsubscribe: function (pubId, subId) {
      publications[pubId].removeSubscriber(subId);
    },
    publish: function (pubId, event) {
      publications[pubId].publish(event);
    }
  };
  
})(jas);
// global namespace jas
(function (jas) {
  
  var assets = {
    images: {},
    audio: {},
    maps: {}
  };
  
  function getMapData(name, path, userCallback) {
    var map = {}; 
    
    return new Promise(function(success, error) {
      var request = new XMLHttpRequest();
      var data = {};
      
      request.onreadystatechange = function () {
        if (request.readyState == 2) {
          assets.maps[name] = false;
        }
      }
      
      request.onload = function () {
        if (request.status == 200) {
          
          /* global X2JS */
          var x2js = new X2JS();
          
          data = x2js.xml_str2json(request.responseText).map;
          map.tileX = Number(data._height);
          map.tileY = Number(data._width);
          map.tileW = Number(data._tilewidth);
          map.tileH = Number(data._tileheight);
          map.x = 0;
          map.y = 0;
          map.w = map.tileX * map.tileW;
          map.h = map.tileX * map.tileH;
          
          // get layer data
          map.layers = {};
          for (var i in data.layer) {
            var layer = {};
            layer.name = data.layer[i]._name;
            layer.width = data.layer[i]._width;
            layer.height = data.layer[i]._height;
            layer.entities = [];
            
            // get tiles
            for (var j in data.layer[i].data.tile) {
              // add logic here to get tile 'properties' from tmx file
              var tile = {};
              tile.tileId = Number(data.layer[i].data.tile[j]._gid);
              if (tile.tileId == 0) {
                continue; // don't include 'null' tiles
              }
              else {
                tile.tileId--; // start at 0
                tile.x = (j * map.tileW) % map.w;
                tile.y = Math.floor((j * map.tileW) / map.w) * map.tileH;
                layer.entities.push(tile);
              }
            }
            // end layer tiles
            
            // get layer properties
            layer.properties = {};
            for (var k in data.layer[i].properties) {
              var property = data.layer[i].properties[k];
              layer.properties[property._name] = property._value;
            }
            map.layers[layer.name] = layer;
          
          }
          // end iteration of layers
        }
        
        success(map);
      };
      
      request.onerror = function () {
        console.error("error finding tmx file in newMap");
      };
      
      request.open("get", path, true);
      
      request.send();
      
    }).then(function () {
      
      if (typeof(userCallback) == "function") {
        userCallback(map);
      }
      assets.maps[name] = map;
    });
      
  }

  function newImage(name, path, userCallback) {
    var image = new Image();
    
    return new Promise(function (success, failure) {
      assets.images[name] = false;
      /*global Image*/
    
      image.onload = function () {
        assets.images[name] = image;
        success(image);
        if (typeof(userCallback) == "function") {
          userCallback(image);
        }
      };
    
      image.src = path;
      
    });
  
  }
  
  function getImage (name) {
    return assets.images[name] || false;
  }
  
  function imageReady (name) {
    return assets.images[name]? true: false;
  }

  function newAudio(name, path) {
      
  }
  
  function getAudio (name) {
    return assets.audio[name] || false;
  }
  
  function audioReady (name) {
    return assets.audio[name]? true: false;
  }
  
  function getMap (name) {
    return assets.maps[name] || false;
  }

  function mapReady (name) {
   return assets.maps[name]? true: false;
  }
  
  function assetsReady () {
    for (var i in assets) {
      var type = assets[i];
      for (var j in type) {
        var asset = type[j];
        if (!j) {
          return false; 
        }
      }
    }
    return true;
  }

  jas.Asset = {
    newImage: newImage,
    audio: newAudio,
    getImage: getImage,
    getAudio: getAudio,
    getMapData: getMapData,
    assetsReady: assetsReady
  };

})(jas);
(function(jas) {
  // ENTITY FACTORY
  /*global name-space jas*/
  var entities = {};
  var groups = {};
  
  var entityAutoId = 0;
  
  var classes = {
    entity: function (mutator) {
      var instance = {};
      mutator = mutator || {};
      var fst = jas.Util.finiteStateMachine();
      instance.setState = function (state, status) {
        fst.setState(state, status);
      }
      
      instance.getState = function (state) {
        return fst.getState(state);
      }
      
      instance.checkStatus = function (state, status, statusTrue, statusFalse) {
        if (fst.checkStatus(state, status)) {
          if (typeof(statusTrue) == "function") {
            statusTrue();
          }
          return true;
        }
        else {
          if (typeof(statusFalse) == "function") {
            statusFalse();
          }
          return false;
        }
      }
      
      instance.getEntityLayer = function (layerId, callback) {
        var groupLayer;
        if (instance.layers && instance.layers[layerId]) {
          groupLayer = instance.layers[layerId];
          if (typeof(callback) == "function" && groupLayer && groupLayer.entities) {
            groupLayer.entities.forEach( function(val, index, arr){
              callback(val, index, arr);
            });
          }
          return true;
        }
        else
        {
          return false;
        }
      }
      
      instance.id = entityAutoId;
      entityAutoId++;
      instance.x = mutator.x || 0;
      instance.y = mutator.y || 0;
      instance.w = mutator.w || 0;
      instance.h = mutator.h || 0;
      
      return instance;
    },
    // call it a proxy-class if you will. This relays to a different class depending on values in mutator
    shape : function (mutator) {
      instance = classes[mutator.shape] ? classes[mutator.shape](mutator): this.rect(mutator);
      var collideable = mutator.collideable? mutator.collideable: true;
      instance.setState("collideable", collideable);   // using class entity's FSM 
      
      return instance;
    },
    
    rect: function (mutator) {
      var instance = this.entity(mutator);
      var color = mutator.color || null;
      var alpha = mutator.alpha || null;
      
      instance.getOrigin = function () {
        return {x: instance.x, y: instance.y};
      }
      
      instance.getCenter = function () {
        var x = instance.x + instance.w / 2;
        var y = instance.y + instance.h / 2;
        return {x: x, y : y};
      };
      
      instance.getArea = function () {
        return instance.w * instance.h; 
      }
      
      instance.getRandomVector = function (xShift, yShift, xUpperLimit, yUpperLimit) {
        xUpperLimit = xUpperLimit || 0;
        yUpperLimit = yUpperLimit || 0;
        var ranX = (Math.random() * (instance.w + xUpperLimit)) + instance.x + xShift;
        var ranY = (Math.random() * (instance.h + yUpperLimit)) + instance.y + yShift;
        return {x: ranX, y: ranY};
      };
      
      instance.isColliding = function (collider, success, failure) {
        if (instance.getState("collideable") && collider.getState("collideable")) {
          // collision vectors
          var v1 = this.x + this.w > collider.x;
          var v2 = this.y + this.h > collider.y;
          var v3 = collider.x + collider.w > this.x;
          var v4 = collider.y + collider.h > this.y;
          if (v1 && v2 && v3 && v4) {
            typeof(success)=="function"? success(): null;
            return true;
          }
          else {
            typeof(failure)=="function"? failure(): null;
            return false;
          }
        }
      }
      
      instance.contains = function (vector, success, failure) {
        var v1 = vector.x > instance.x;
        var v2 = vector.x < instance.x + instance.w;
        var v3 = vector.y > instance.y;
        var v4 = verctor.y < instance.y + instance.h;
        
        if (v1 && v2 && v3 && v4) {
          typeof(success)=="function"? success(): null;
          return true;
        }
        else {
          typeof(failure)=="function"? failure(): null;
          return false;
        }
      };
      
      // a rectangle is a solid that can be drawn like a rectangle.
      instance.getDraw = function () {
        return {
          type: "rect",
          x: this.x,
          y: this.y,
          w: this.w,
          h: this.h,
          color: color,
          alpha: alpha
        };
      }
      
      return instance;
    },
    circ: function (mutator) {
      mutator = mutator || {};
      var instance = this.entity(mutator);
      
      var area = Math.pi * Math.pow(instance.w / 2, 2);
      
      // more methods to add here. use the same names from the rect class.
      instance.getDraw = function () {
        return { 
          type: "circ",
          x: this.x,
          y: this.y,
          w: this.w,
          h: this.h,
          color: color,
          alpha: alpha
        };
      }
      
      instance.getArea = function () {
        return area
      }
      
      instance.getCenter = function () {
        var x = instance.x + instance.w / 2;
        var y = instance.y + instance.h / 2;
        return {x: x, y : y};
      }
      
      return instance;
    },
    // todo: make a GUI component class
    component: function (mutator) {
      var mutator = mutator || {};
      var instance = this.shape(mutator);
      var parent;
      // a widget will be a component that contains components
      function widget () {
        var components = {};
        instance.addComponent = function (component) {
          
        };
        
        instance.removeComponent = function () {
          
        };
        
      }
      
      return instance;
    },
    label : function (mutator) {
      mutator = mutator || {};
      instance = this.component(mutator);
      var text = mutator.text;
      
      return instance;
      
    },
    sprite : function (mutator) {
      var instance = this.shape(mutator);
      
      function animationFactory(animMutator) {
        // inner frame class
        function frame (sx, sy, sw, sh) {
          return {
            sx: sx,
            sy: sy,
            sw: sw,
            sh: sh
          };
        }
        
        animMutator = animMutator? animMutator: {};
        var animation = {};
        
        animation.name = animMutator.name;
        
        var start = animMutator.start;
        var stop = animMutator.stop;
        var w = instance.w;// sub image w & h
        var h = instance.h;
        
        var looping = animMutator.looping? animMutator.looping: false;
        var pingpong = animMutator.pingpong? animMutator.pingpong: false;
        var fps = animMutator.fps? animMutator.fps: 12;
        
        var frames = [];
        for ( var i = start; i < stop; i++) {
          var x = (i * w) % imageW;
          var y = Math.floor((i * w) / imageW) * h;
          frames.push(frame(x, y, w, h));
        }
        
        //console.log(stop);
        
        var currentFrame = 0;
        var done = false;
        
        var timer = jas.Util.timer();
        timer.start();
        timer.setTimer(1000/fps);
        
        animation.update = function () {
          if (done) {
            return; 
          }
          timer.checkTime(function() {
            var lastFrame = ++currentFrame >= frames.length;
            
            if (lastFrame && looping) {
              currentFrame = 0;
            }
            
            else if (lastFrame) {
              currentFrame = frames.length - 1;
              done = true
            }
            
          });
        };
        
        animation.getCurrentFrame = function () {
          return frames[currentFrame];
        }
        
        animation.reset = function() {
          currentFrame = 0;
          done = false;
        }
        
        if (animMutator.def) {
          instance.anim = animation;
        }
        
        return animation;
      }
      
      
      var Directions = {
        UP: -1,
        RIGHT: 1,
        DOWN: 1,
        LEFT: -1
      };
      
      var dirY = Directions.DOWN;
      var dirX = Directions.RIGHT;
      
      var imageId = mutator? mutator.imageId: null;
      var imageW = jas.Asset.getImage(imageId).width;
      var imageH = jas.Asset.getImage(imageId).height;
      
      instance.animations = {};
      
      mutator.animations = mutator.animations || [{name:"still", start: 0, stop: 1, def: true}];
      
      for (var i in mutator.animations) {
        var animData = mutator.animations[i];
        instance.animations[animData.name] = animationFactory(animData);
      }
      
      instance.setAnim = function (animId) {
        instance.anim = instance.animations[animId];
      }
      
      instance.getAnimId = function () {
        return instance.anim.name;
      };
      
      instance.addAnim = function (animId, animMutator) {
        instance.animations[animId] = animationFactory(animMutator);
        if (animMutator.def) {
          instance.anim = instance.animations[animId];
        }
      }
      
      instance.updateAnim = function () {
        instance.anim.update();
      }
      
      instance.resetAnim = function (animId) {
        if (animId) {
          instance.animation[animId].reset();
        }
        else {
          instance.anim.reset();
        }
      }
      
      // draw functions
      instance.getDraw = function () {
        
        var frame = instance.anim.getCurrentFrame();
        
        return {
          type: "sprite",
          frame: frame,
          x: this.x,
          y: this.y,
          w: this.w,
          h: this.h,
          imageId: imageId
        };
      }
      // locomotive methods
      instance.moveUp = function () {
        dirY = Directions.UP;
        this.y -= this.spd;
      };
      
      instance.moveRight = function () {
        dirX = Directions.RIGHT;
        this.x += this.spd;
      };
      
      instance.moveDown = function () {
        dirY = Directions.DOWN;
        this.y += this.spd;
        
      };
      
      instance.moveLeft = function () {
        dirX = Directions.LEFT;
        this.x -= this.spd;
      };
      
      instance.collide = function () {
        switch (dirY) {
          case Directions.UP:
            this.y += this.spd;
            dirY = 0;
            break;
          case Directions.DOWN:
            this.y -= this.spd;
            dirY = 0;
            break;
        }
        switch (dirX) {
          case Directions.RIGHT:
            this.x -= this.spd;
            dirX = 0;
            break;
          case Directions.LEFT:
            this.x += this.spd;
            dirX = 0;
            break;
          
        }
      };
      // end locomotive methods
      
      return instance;
    },
    spawnZone: function (mutator) {
      var mutator = mutator || {};
      mutator.alpha = mutator.alpha || .4; // set transparency for testing/rendering
      
      var instance = this.shape(mutator);
      
      var intervalFixed = mutator.intervalFixed !== false ? true: false;
      var spawnType = mutator.spawnType;
      var spawnMutator = mutator.spawnMutator || {};
      var spawnRate = mutator.spawnRate || 3000;
      var spawnCount = 0;
      var spawnPosition = mutator.spawnPosition || "origin";
      var spawnGroup = mutator.spawnGroup || null;
      var spawnMax = mutator.spawnMax || 10;
      var spawnIds = {};
      var timer = jas.Util.timer(spawnRate, intervalFixed);
      timer.start();
      
      instance.configureSpawn = function (defSpawnType, defSpawnMutator) {
        spawnType = defSpawnType;
        spawnMutator = defSpawnMutator;
      }
      
      // returns a function that returns vector
      function getSpawnStrategy () {
        var vector = {};
        if(spawnPosition == "random") {
          return function () {
            return instance.getRandomVector( 0, 0, -spawnMutator.w, -spawnMutator.y);  
          }
        }
        else if (spawnPosition == "center") {
          return function () {
            return instance.getCenter();
          }
        }
        else {
          return function () {
            return instance.getOrigin();  
          }
         
        }
      }
      
      var getSpawnVector = getSpawnStrategy(mutator.spawnPosition) || null;
      
      instance.setSpawnPosition = function (position) {
        spawnPosition = position;
        getSpawnVector = getSpawnStrategy();  
      };
      
      instance.spawn = (function () {
        if (spawnCount < spawnMax) {
          timer.checkTime(function() {
            var vector = getSpawnVector();
            spawnMutator.x = vector.x;
            spawnMutator.y = vector.y;
            var spawn = jas.Entity.inst(spawnType, spawnMutator);
            spawnIds[spawn.id] = spawn.id;
            jas.Entity.addEntity( spawn, spawnGroup);
            spawnCount++;
            
          });
        }
      });
      
      instance.removeSpawn = function (entity) {
        delete spawnIds[entity.id];
        jas.Entity.removeEntityById(entity.id);
        spawnCount--;
      };
      
      instance.removeSpawnById = function (id) {
        delete spawnIds[id];
        jas.Entity.removeEntityById(id);
        spawnCount--;
      };
      
      return instance;
    },
    
    tile: function (mutator) {
      var mutator = mutator? mutator: {};
      
      var instance = this.sprite(mutator);
      instance.setAnim("tile");
      
      instance.tileId = mutator.tileId;
      
      return instance;
    },
    
    map: function (mutator) {
      // everything in this mutator is sanitized of underscores.
      // this is the parsed map data.
      mutator = mutator? mutator : {};
      var instance = this.rect(mutator);
      
      var tileMutators = {};
      instance.layers = {};
      
      var tileW = mutator.tileW,
          tileH = mutator.tileH,
          imageId = mutator.imageId;
      
      instance.configureTile = function (tileId, mutatorFunction) {
        tileMutators[tileId] = mutatorFunction;
      }
      
      instance.makeTiles = function () {
        for (var i in mutator.layers) {
          var layer = {};
          layer.entities = [];
          
          for (var j in mutator.layers[i].entities) {
            var tileData = mutator.layers[i].entities[j];
            var tileMutator = tileMutators[tileData.tileId] ?
              tileMutators[tileData.tileId]: function (obj) {return obj;};
            //console.log(tileData);
            tileData.imageId = imageId;
            tileData.w = tileW;
            tileData.h = tileH;
            tileData.animations = [{
              "name": "tile",
              "start": tileData.tileId,
              "stop": tileData.tileId + 1,
              def: true
              }
            ];
            
            // remove first four arguments...
            var tile = classes.tile(tileData);
            layer.entities.push(tile);
          }
          instance.layers[mutator.layers[i].name] = layer;
          
        }
        
      };
      
      
      instance.getDraw = function (layer) {
        if (instance.layers[layer]) {
          return {
            type: "complex",
            layers: instance.layers[layer].tiles
          };
        }
        else {
          return false;
        }
      };
      
      return instance;
    }
  }
  
  var enumEntities = {};
  
  // add enumerate entity
  function enumerateEntity (name, num) {
    enumEntities[num] = name;
  }
  
  // ENTITY FACTORY PUBLIC INTERFACE
  function inst (type, mutator) {
    var newInstance = classes[type]? classes[type](mutator):{};
    
    return newInstance;
  }
  
  function newClass(type, factory) {
    classes[type] = factory;
  }
  
  function addEntity (entity, group) {
    var id = entity.id;
    if (group) {
      groups[group] = groups[group] || {};
      groups[group][id] = id;
    }
    entities[id] = entity;
    
    return entity;
  }
  
  
  function removeEntity (entity) {
    for (var i in groups) {
      delete groups[i][entity.id]; 
    }
    delete entities[entity.id];
  }
  
  function removeEntityById (id) {
    for (var i in groups) {
      delete groups[i][id]; 
    }
    delete entities[id];
  }
  
  function getFirst(groupId, callback) {
    if (groups[groupId]) {
      var entity = entities[Object.keys(groups[groupId]).sort()[0]];
      if (entity && typeof(callback) == "function") {
        callback(entity);
        return entity;
      }
    }
  }
  
  function getGroup (groupId, callback) {
    var group = [];
    //console.log(groups);
    for (var i in groups[groupId]) {
      var id = groups[groupId][i];
      group.push(entities[id]);
    }
    if (typeof(callback) == "function") {
      group.forEach(callback); 
    }
    return group;
  }
  
  function getMap (mapId, callback) {
    return getGroup(mapId)[0];
  }
  
  jas.Entity = {
    inst: inst,
    newClass: newClass,
    addEntity: addEntity,
    removeEntity: removeEntity,
    removeEntityById: removeEntityById,
    enumerateEntity: enumerateEntity,
    getFirst: getFirst,
    getGroup: getGroup,
    getMap: getMap
  };
  
})(jas);
(function (jas) {
  // controller factory must attach event handlers to DOM canvas
  function controllerFactory(canvas) {
    controller = {};
    
    canvas.addEventListener('mousedown', function () {
      if (controller.mouseup) {
        delete controller.mouseup;
      }
      controller.mousedown = true;
    }, false);
    
    canvas.addEventListener('mouseup', function () {
      if (controller.mousedown) {
        delete controller.mousedown;
      }
      controller.mouseup = true;
      
      window.setTimeout(function () {
        delete controller.mouseup;
      }, 10);
    }, false);
    
    var keys = {};
    
    var keyCodes = {
        UP: 38,
        RIGHT:39,
        DOWN:40,
        LEFT:37,
        SPACE: 32,
        ENTER: 13,
        A: 65,
        S: 83,
        D: 68,
        W: 87,
        CTRL: 17,
        SHIFT: 16,
        ALT: 18
    };
    
    function addKey (e) {
      keys[e.keyCode] = true;
    }
  
    function removeKey(e) {
      delete keys[e.keyCode];
    }
    
    
    window.addEventListener('keydown', addKey, false);
    
    window.addEventListener('keyup', removeKey, false);
    
    // init game controller
    var controller = {
      isKeyDown: function (key, callback) {
        var isIt = keys[keyCodes[key]];
        if (isIt && typeof(callback) == "function") {
          callback(); 
        }
        return  isIt ? true: false;
      },
      areKeysDown: function (keyArr, callback) {
        for (var i in keyArr) {
          var key = keyArr[i];
          if (!this.isKeyDown(key)) {
            return false;
          }
        }
        typeof(callback) == "function" ? callback(): null;
        return true;
      },
      keysNotPressed: function (keyArr) {
        for (var i in keyArr) {
          var key = keyArr[i];
          if (this.isKeyDown(key)) {
            return false;
          }
        }
        typeof(callback) == "function" ? callback(): null;
        return true;
      }
    };
    
    return controller;
  }
  
  jas.controllerFactory = controllerFactory;
})(jas);
(function (jas) {
  function graphicsFactory (canvas, ctx) {
    function drawRect (draw) {
      var color = draw.color || "#000";
            
      ctx.fillStyle = color;
      ctx.globalAlpha = draw.alpha || 1;
      
      var x = draw.x,
          y = draw.y,
          w = draw.w,
          h = draw.h;
      
      ctx.fillRect(x, y, w, h);
      ctx.globalAlpha = 1;
    }
    
    function drawCirc (draw) {
      var color = draw.color || "#000";
            
      ctx.fillStyle = color;
      ctx.globalAlpha = draw.alpha || 1;
      var x = draw.x + (draw.w/2);
      var y = draw.y + (draw.h/2);
      
      ctx.beginPath();
      ctx.arc(x, y, 50, 0, 2*Math.PI);
      ctx.fill();
    }
    
    // eventually save rendered text as an image in a buffer.
    // rendering text is HIGHLY inefficient for canvas.
    function drawText (draw) {
      var x = draw.x;
      var y = draw.y;
      var string = draw.string;
      ctx.fillStyle = draw.color || "#fff";
      ctx.font = draw.font || "1em serif";
      ctx.fillText(x, y, string);
    }
    
    function drawSprite (draw) {
      var image = jas.Asset.getImage(draw.imageId);
      //console.log(draw);
      var frame = draw.frame,
          sx = frame.sx,
          sy = frame.sy,
          sw = frame.sw,
          sh = frame.sh,
          dx = draw.x,
          dy = draw.y,
          dw = draw.w,
          dh = draw.h;
      

      if (image) {
        ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
      }
    }
    
    
    function drawComplex (draw) {
      // used to draw composite entities (e.g. maps made of tiles. sprites with layers)
      for (var i in draw.layers) {
        var layer = draw.layers[i];
        iterateDrawGroup(layer);
      }
    }
 
    function renderGroup (groupId) {
      var group = jas.Entity.getGroup(groupId);
      iterateDrawGroup(group);
    }
    
    function renderGroupLayer (groupId, layerId) {
      jas.Entity.getFirst(groupId, function (instance) {
        iterateDrawGroup(instance.layers[layerId].entities);
      });
    }
    
    function iterateDrawGroup (group) {
      
      for (var i in group) {
        
        var instance = group[i];
        
        var draw = instance.getDraw? instance.getDraw(): false;
        if (!draw) {
          
          continue;  
        }
        
        chooseDraw(draw);
      }
    }
    
    function chooseDraw(draw) {
      switch (draw.type) {
        case "rect":
          drawRect(draw);
          break;
        case "circ":
          drawCirc(draw);
          break;
        case "sprite":
          drawSprite(draw);
          break;
        case "complex":
          drawComplex(draw);
          break;
      }
    }
    
    function fillScreen (color, alpha) {
      ctx.fillStyle = color ? color: "#f0f";
      ctx.globalAlpha = alpha ? alpha: 1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    return {
      renderGroup: renderGroup,
      renderGroupLayer: renderGroupLayer,
      fillScreen: fillScreen 
    }
  };
  
  jas.graphicsFactory = graphicsFactory;
  
})(jas);
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
    
    if (state == null) {
      state = states[stateName];
    }
  }
  
  function updateState (now, Controller, Graphics) {
    state.update(now, Controller);
    state.render(Graphics); 
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
    initState: initState,
    updateState: updateState
  };
  
})(jas);
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