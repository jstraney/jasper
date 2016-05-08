function X2JS(v){var q="1.1.5";v=v||{};h();r();function h(){if(v.escapeMode===undefined){v.escapeMode=true;}v.attributePrefix=v.attributePrefix||"_";v.arrayAccessForm=v.arrayAccessForm||"none";v.emptyNodeForm=v.emptyNodeForm||"text";if(v.enableToStringFunc===undefined){v.enableToStringFunc=true;}v.arrayAccessFormPaths=v.arrayAccessFormPaths||[];if(v.skipEmptyTextNodesForObj===undefined){v.skipEmptyTextNodesForObj=true;}if(v.stripWhitespaces===undefined){v.stripWhitespaces=true;}v.datetimeAccessFormPaths=v.datetimeAccessFormPaths||[];}var g={ELEMENT_NODE:1,TEXT_NODE:3,CDATA_SECTION_NODE:4,COMMENT_NODE:8,DOCUMENT_NODE:9};function r(){function x(z){var y=String(z);if(y.length===1){y="0"+y;}return y;}if(typeof String.prototype.trim!=="function"){String.prototype.trim=function(){return this.replace(/^\s+|^\n+|(\s|\n)+$/g,"");};}if(typeof Date.prototype.toISOString!=="function"){Date.prototype.toISOString=function(){return this.getUTCFullYear()+"-"+x(this.getUTCMonth()+1)+"-"+x(this.getUTCDate())+"T"+x(this.getUTCHours())+":"+x(this.getUTCMinutes())+":"+x(this.getUTCSeconds())+"."+String((this.getUTCMilliseconds()/1000).toFixed(3)).slice(2,5)+"Z";};}}function t(x){var y=x.localName;if(y==null){y=x.baseName;}if(y==null||y==""){y=x.nodeName;}return y;}function o(x){return x.prefix;}function p(x){if(typeof(x)=="string"){return x.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#x27;").replace(/\//g,"&#x2F;");}else{return x;}}function j(x){return x.replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#x27;/g,"'").replace(/&#x2F;/g,"/");}function l(B,y,A){switch(v.arrayAccessForm){case"property":if(!(B[y] instanceof Array)){B[y+"_asArray"]=[B[y]];}else{B[y+"_asArray"]=B[y];}break;}if(!(B[y] instanceof Array)&&v.arrayAccessFormPaths.length>0){var x=0;for(;x<v.arrayAccessFormPaths.length;x++){var z=v.arrayAccessFormPaths[x];if(typeof z==="string"){if(z==A){break;}}else{if(z instanceof RegExp){if(z.test(A)){break;}}else{if(typeof z==="function"){if(z(B,y,A)){break;}}}}}if(x!=v.arrayAccessFormPaths.length){B[y]=[B[y]];}}}function a(C){var A=C.split(/[-T:+Z]/g);var B=new Date(A[0],A[1]-1,A[2]);var z=A[5].split(".");B.setHours(A[3],A[4],z[0]);if(z.length>1){B.setMilliseconds(z[1]);}if(A[6]&&A[7]){var y=A[6]*60+Number(A[7]);var x=/\d\d-\d\d:\d\d$/.test(C)?"-":"+";y=0+(x=="-"?-1*y:y);B.setMinutes(B.getMinutes()-y-B.getTimezoneOffset());}else{if(C.indexOf("Z",C.length-1)!==-1){B=new Date(Date.UTC(B.getFullYear(),B.getMonth(),B.getDate(),B.getHours(),B.getMinutes(),B.getSeconds(),B.getMilliseconds()));}}return B;}function n(A,y,z){if(v.datetimeAccessFormPaths.length>0){var B=z.split(".#")[0];var x=0;for(;x<v.datetimeAccessFormPaths.length;x++){var C=v.datetimeAccessFormPaths[x];if(typeof C==="string"){if(C==B){break;}}else{if(C instanceof RegExp){if(C.test(B)){break;}}else{if(typeof C==="function"){if(C(obj,y,B)){break;}}}}}if(x!=v.datetimeAccessFormPaths.length){return a(A);}else{return A;}}else{return A;}}function w(z,E){if(z.nodeType==g.DOCUMENT_NODE){var F=new Object;var x=z.childNodes;for(var G=0;G<x.length;G++){var y=x.item(G);if(y.nodeType==g.ELEMENT_NODE){var D=t(y);F[D]=w(y,D);}}return F;}else{if(z.nodeType==g.ELEMENT_NODE){var F=new Object;F.__cnt=0;var x=z.childNodes;for(var G=0;G<x.length;G++){var y=x.item(G);var D=t(y);if(y.nodeType!=g.COMMENT_NODE){F.__cnt++;if(F[D]==null){F[D]=w(y,E+"."+D);l(F,D,E+"."+D);}else{if(F[D]!=null){if(!(F[D] instanceof Array)){F[D]=[F[D]];l(F,D,E+"."+D);}}(F[D])[F[D].length]=w(y,E+"."+D);}}}for(var A=0;A<z.attributes.length;A++){var B=z.attributes.item(A);F.__cnt++;F[v.attributePrefix+B.name]=B.value;}var C=o(z);if(C!=null&&C!=""){F.__cnt++;F.__prefix=C;}if(F["#text"]!=null){F.__text=F["#text"];if(F.__text instanceof Array){F.__text=F.__text.join("\n");}if(v.escapeMode){F.__text=j(F.__text);}if(v.stripWhitespaces){F.__text=F.__text.trim();}delete F["#text"];if(v.arrayAccessForm=="property"){delete F["#text_asArray"];}F.__text=n(F.__text,D,E+"."+D);}if(F["#cdata-section"]!=null){F.__cdata=F["#cdata-section"];delete F["#cdata-section"];if(v.arrayAccessForm=="property"){delete F["#cdata-section_asArray"];}}if(F.__cnt==1&&F.__text!=null){F=F.__text;}else{if(F.__cnt==0&&v.emptyNodeForm=="text"){F="";}else{if(F.__cnt>1&&F.__text!=null&&v.skipEmptyTextNodesForObj){if((v.stripWhitespaces&&F.__text=="")||(F.__text.trim()=="")){delete F.__text;}}}}delete F.__cnt;if(v.enableToStringFunc&&(F.__text!=null||F.__cdata!=null)){F.toString=function(){return(this.__text!=null?this.__text:"")+(this.__cdata!=null?this.__cdata:"");};}return F;}else{if(z.nodeType==g.TEXT_NODE||z.nodeType==g.CDATA_SECTION_NODE){return z.nodeValue;}}}}function m(E,B,D,y){var A="<"+((E!=null&&E.__prefix!=null)?(E.__prefix+":"):"")+B;if(D!=null){for(var C=0;C<D.length;C++){var z=D[C];var x=E[z];if(v.escapeMode){x=p(x);}A+=" "+z.substr(v.attributePrefix.length)+"='"+x+"'";}}if(!y){A+=">";}else{A+="/>";}return A;}function i(y,x){return"</"+(y.__prefix!=null?(y.__prefix+":"):"")+x+">";}function s(y,x){return y.indexOf(x,y.length-x.length)!==-1;}function u(y,x){if((v.arrayAccessForm=="property"&&s(x.toString(),("_asArray")))||x.toString().indexOf(v.attributePrefix)==0||x.toString().indexOf("__")==0||(y[x] instanceof Function)){return true;}else{return false;}}function k(z){var y=0;if(z instanceof Object){for(var x in z){if(u(z,x)){continue;}y++;}}return y;}function b(z){var y=[];if(z instanceof Object){for(var x in z){if(x.toString().indexOf("__")==-1&&x.toString().indexOf(v.attributePrefix)==0){y.push(x);}}}return y;}function f(y){var x="";if(y.__cdata!=null){x+="<![CDATA["+y.__cdata+"]]>";}if(y.__text!=null){if(v.escapeMode){x+=p(y.__text);}else{x+=y.__text;}}return x;}function c(y){var x="";if(y instanceof Object){x+=f(y);}else{if(y!=null){if(v.escapeMode){x+=p(y);}else{x+=y;}}}return x;}function e(z,B,A){var x="";if(z.length==0){x+=m(z,B,A,true);}else{for(var y=0;y<z.length;y++){x+=m(z[y],B,b(z[y]),false);x+=d(z[y]);x+=i(z[y],B);}}return x;}function d(D){var x="";var B=k(D);if(B>0){for(var A in D){if(u(D,A)){continue;}var z=D[A];var C=b(z);if(z==null||z==undefined){x+=m(z,A,C,true);}else{if(z instanceof Object){if(z instanceof Array){x+=e(z,A,C);}else{if(z instanceof Date){x+=m(z,A,C,false);x+=z.toISOString();x+=i(z,A);}else{var y=k(z);if(y>0||z.__text!=null||z.__cdata!=null){x+=m(z,A,C,false);x+=d(z);x+=i(z,A);}else{x+=m(z,A,C,true);}}}}else{x+=m(z,A,C,false);x+=c(z);x+=i(z,A);}}}}x+=c(D);return x;}this.parseXmlString=function(z){var B=window.ActiveXObject||"ActiveXObject" in window;if(z===undefined){return null;}var A;if(window.DOMParser){var C=new window.DOMParser();var x=null;if(!B){try{x=C.parseFromString("INVALID","text/xml").childNodes[0].namespaceURI;}catch(y){x=null;}}try{A=C.parseFromString(z,"text/xml");if(x!=null&&A.getElementsByTagNameNS(x,"parsererror").length>0){A=null;}}catch(y){A=null;}}else{if(z.indexOf("<?")==0){z=z.substr(z.indexOf("?>")+2);}A=new ActiveXObject("Microsoft.XMLDOM");A.async="false";A.loadXML(z);}return A;};this.asArray=function(x){if(x instanceof Array){return x;}else{return[x];}};this.toXmlDateTime=function(x){if(x instanceof Date){return x.toISOString();}else{if(typeof(x)==="number"){return new Date(x).toISOString();}else{return null;}}};this.asDateTime=function(x){if(typeof(x)=="string"){return a(x);}else{return x;}};this.xml2json=function(x){return w(x);};this.xml_str2json=function(x){var y=this.parseXmlString(x);if(y!=null){return this.xml2json(y);}else{return null;}};this.json2xml_str=function(x){return d(x);};this.json2xml=function(y){var x=this.json2xml_str(y);return this.parseXmlString(x);};this.getVersion=function(){return q;};}
function jasFactory () {
  
  // JAS FACTORY GLOBALS
  // ids
  var stateAutoId = 0;
  var entityAutoId = 0;
  
  var entities = {};
  var entityGroups = {};
  
  // Gamestates
  var states = {};
  var state = null;
  
  // frame
  var canvas, ctx;
  var Controller;
  var Event;
  
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
    canvas.width = w ? w: 320;
    canvas.height = h ? h: 320;
    
    //if canvas won't work
    canvas.innerHTML = "<h3>Your browser doesn't support HTML5 canvas!</h3>";
    canvas.innerHTML += "<p>Try one of these browsers...</p>";
    
    ctx = canvas.getContext("2d");
    
    
    gameFrame.appendChild(canvas);
    // init game states
    if (Object.keys(states).length == 0) {
      initError("You must inject at least one game state using jas.addState\n");  
    }

    for (var i in states) {
      states[i].init();
    }
    
    function initController() {
      canvas.addEventListener('mousedown', function () {
        if (Controller.mouseup) {
          delete Controller.mouseup;
        }
        Controller.mousedown = true;
      }, false);
      
      canvas.addEventListener('mouseup', function () {
        if (Controller.mousedown) {
          delete Controller.mousedown;
        }
        Controller.mouseup = true;
        
        window.setTimeout(function () {
          delete Controller.mouseup;
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
      
      // closures to access Controller on window level
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
        isKeyDown: function (key) {
          var isIt = keys[keyCodes[key]];
          return  isIt ? true: false;
        },
        areKeysDown: function (keyArr) {
          for (var i in keyArr) {
            var key = keyArr[i];
            if (!this.isKeyDown(key)) {
              return false;
            }
          }
          return true;
        },
        keysNotPressed: function (keyArr) {
          for (var i in keyArr) {
            var key = keyArr[i];
            if (this.isKeyDown(key)) {
              return false;
            }
          }
          return true;
        }
      };
      
      return controller;
    }
    
    Controller = initController();

  }
  
  function initEventMachine () {
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

    
    var subscriberId = 0;
    
    var eventMachine = {
      addPublication: function (name) {
        publications[name] = publication();
      },
      remPublication: function (name) { // careful! destroys subscribers too
        delete publications[name];
      },
      subscribe: function (pubId, subId, callback) {
        publications[pubId].addSubscriber(subId, callback);
        console.log(publications);
      },
      unsubscribe: function (pubId, subId) {
        publications[pubId].removeSubscriber(subId);
      },
      publish: function (pubId, event) {
        publications[pubId].publish(event);
      }
      
    };
    
    return eventMachine;
  }
  
  Event = initEventMachine();
  
  function begin() {
    then = Date.now();
    main();
  }
  
  function main() {
    var now = Date.now() - then;
    state.update(now, Controller);
    state.render(graphics);
    requestAnimationFrame(main);
  }
  
  
   
  // ASSET FACTORY
  function assetFactory () {
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
              layer.tiles = [];
              
              // get tiles
              for (var j in data.layer[i].data.tile) {
                var tile = {};
                tile.tileId = Number(data.layer[i].data.tile[j]._gid);
                if (tile.tileId == 0) {
                  continue; // don't include 'null' tiles
                }
                else {
                  tile.tileId--; // start at 0
                  tile.x = (j * map.tileW) % map.w;
                  tile.y = Math.floor((j * map.tileW) / map.w) * map.tileH;
                  layer.tiles.push(tile);
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
        };
      
        image.src = path;
      }).then(function () {
        
        if (typeof(userCallback) == "function") {
          
          userCallback(image);
          
        }
        
      });
    
    }
    
    function getImage (name) {
      return assets.images[name]? assets.images[name]: false;
    }
  
    function newAudio(name, path) {
      
    }
    
    function getAudio (name) {
      return assets.audio[name]? assets.audio[name]: false;
    }
    
    function getMap (name) {
      return assets.maps[name]? assets.maps[name]: false;
    }
  
    return {
      newImage: newImage,
      audio: newAudio,
      getImage: getImage,
      getAudio: getAudio,
      getMapData: getMapData
    };
  }
 
  var Asset = assetFactory();
  
  
  
  // ENTITY FACTORY
  /*global name-space jas*/
  function entityFactory () {
    // mutator methods
    var classes = {
      entity: function (mutator) {
        var instance = {};
        instance.x = mutator.x;
        instance.y = mutator.y;
        instance.w = mutator.w;
        instance.h = mutator.h;
        
        return instance;
      },
      
      solid : function (mutator) {
        var collideable = true;
        
        var instance = this.entity(mutator);
        
        instance.setSolid = function (isCollideable) {
          try {
            if (typeof (isCollideable) === "boolean") {
              collideable = isCollideable;
            } 
            else {
              throw "entity set solid requires boolean";
            }
          }
          catch (e) {
            console.error(e.message);
          }
        }
        
        instance.isCollideable = function () {
          return collideable;
        }
        
        
        instance.isColliding = function (collider, success, failure) {
          if (this.isCollideable && collider.isCollideable) {
            // collision vectors
            var v1 = this.x + this.w > collider.x;
            var v2 = this.y + this.h > collider.y;
            var v3 = collider.x + collider.w > this.x;
            var v4 = collider.y + collider.h > this.y;
            if (v1 && v2 && v3 && v4) {
              typeof(success)=="function"? success(): null;
            }
            else {
              typeof(failure)=="function"? failure(): null;
              
            }
          }
        }
        
        return instance;
      },
      
      rect: function (mutator) {
        var instance = this.solid(mutator);
        var color = mutator.color? mutator.color: null;
        var alpha = mutator.alpha? mutator.alpha: null;
        
        instance.getDraw = function () {
          return {
            type: "rect",
            x: this.x,
            y: this.y,
            w: this.w,
            h: this.h,
            color: color
          };
        }
        
        return instance;
      },
      component: function (mutator) {
        var mutator = mutator? mutator: {};
        var instance = this.rect(mutator);
        var parent;
        function widget () {
          var components = {};
          instance.addComponent = function (component) {
            
          };
          
          instance.removeComponent = function () {
            
          };
          
        }
        
      },
      sprite : function (mutator) {
        var instance = this.solid(mutator);
        
        function animationFactory(animMutator) {
          
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
          var playDirForward = pingpong? true: false;
          var fps = animMutator.fps? animMutator.fps: 12;
          
          var frames = [];
          
          
          for ( var i = start; i < stop; i++) {
            var x = (i * w) % imageW;
            var y = Math.floor((i * w) / imageW) * h;
            frames.push(frame(x, y, w, h));
          }
          
          //console.log(stop);
          
          var currentFrame = 0;
          var lastUpdate = Date.now();
          var done = false;
          
          animation.update = function () {
            var now = Date.now();
            
            if ((now - lastUpdate)/1000 >= 1/fps && !done) {
              lastUpdate = Date.now();
              var lastFrame = ++currentFrame >= frames.length;
              
              if (lastFrame && looping) {
                currentFrame = 0;
              }
              else if (lastFrame) {
                currentFrame = frames.length - 1;
                done = true
              }
            }
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
        var imageW = Asset.getImage(imageId).width;
        var imageH = Asset.getImage(imageId).height;
        
        instance.animations = {};
        
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
        var instance = this.solid(mutator);
        
        instance.layers = {};
        
        var tileW = mutator.tileW,
            tileH = mutator.tileH,
            imageId = mutator.imageId;
        
        instance.makeTiles = function () {
          for (var i in mutator.layers) {
            var layer = {};
            layer.tiles = [];
            
            for (var j in mutator.layers[i].tiles) {
              var tileData = mutator.layers[i].tiles[j];
              var tileClass;
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
              
              var tile;
              if (classes[enumClasses[tileData.tileId]]) {
                tile = classes[enumClasses[tileData.tileId]](tileData);
              }
              else {
                tile = classes.tile(tileData);
              }
              
              layer.tiles.push(tile);
              
            }
            instance.layers[mutator.layers[i].name] = layer;
            
          }
          
        };
        
        
        instance.getDraw = function (layer) {
          if (instance.layers[layer]) {
            return {
              type: "mapLayer",
              tiles: instance.layers[layer].tiles
            };
          }
          else {
            return false;
          }
        };
        
        return instance;
      }
    }
    
    var enumClasses = {};
    /*
      new instance method
    */
    function inst (type, mutator) {
      var newInstance = classes[type]? classes[type](mutator):{};
      return newInstance;
    }
    
    function newClass(type, factory) {
      classes[type] = factory;
    }
    
    function enumerateClass (type, num) {
      enumClasses[num] = type; 
    }
    
    function addEntity (group, entity) {
      entity.id = entityAutoId;
      entities[entityAutoId] = entity;
      if (group) {
        addToGroup(group, entityAutoId);
      }
      entityAutoId ++;
      return entity;
    }
    
    function getEntity (id) {
      return entities[id];
    }
    
    function newGroup (groupId) {
      entityGroups[groupId] = {};
    }
    
    function addToGroup (groupId, id) {
      console.log(groupId, id);
      entityGroups[groupId] = entityGroups[groupId] || {};
      entityGroups[groupId][id] = id;
    }
    
    function remEntity (entity) {
      
    }
    
    function getFirst(groupId) {
      return entityGroups[groupId] ? entityGroups[groupId][0]: false;
    }
    
    function getGroup (groupId) {
      var group = [];
      
      for (var i in entityGroups[groupId]) {
        var id = entityGroups[groupId][i];
        console.log(id);
        group.push(entities[id] );
      }
      
      return group;
    }
    
    function getMap (mapId) {
      return entityGroups[mapId] ? entityGroups[mapId][0]: false;
    }
  
    
    return {
      inst: inst,
      newClass: newClass,
      enumerateClass: enumerateClass,
      addEntity: addEntity,
      remEntity: remEntity,
      getGroup: getGroup,
      getFirst: getFirst,
      getMap: getMap
    };
  };
  
  var Entity = entityFactory();
  
  // UTILITIES
  function graphicsFactory () {
    function drawRect (draw) {
      var color = draw.color? draw.color: "#0f0";
      
      ctx.fillStyle = color;
      
      var x = draw.x,
          y = draw.y,
          w = draw.w,
          h = draw.h;
      
      ctx.fillRect(x, y, w, h);
    }
    
    function drawSprite (draw) {
      var image = Asset.getImage(draw.imageId);
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
    var graphics = {
      renderMapLayer: function (mapId, layer) {
        var map = Entity.getMap(mapId);
        if (!map) {
          return;
        }
        else {
          //console.log(map);
          // get the map's render instructions
          var draw = map.getDraw(layer);
          if (!draw) {
            return;
          }
          // get each tiles render instructions. Draw those tiles
          for (var i in draw.tiles) {
            
            drawSprite(draw.tiles[i].getDraw());
          }
        }
      },
      renderGroup: function (groupId) {
        var group = Entity.getGroup(groupId);
        //console.log(group);
        for (var i in group) {
          var instance = group[i];
          var draw = instance.getDraw();
          
          //console.log(draw.type);
          switch (draw.type) {
            case "rect":
                drawRect(draw);
              break;
            case "sprite":
                drawSprite(draw);
              break;
          }
        }
      },
      fillScreen: function (color, alpha) {
        ctx.fillStyle = color ? color: "#f0f";
        ctx.globalAlpha = alpha ? alpha: 1;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };
    
    return graphics;
  }
  
  var graphics = graphicsFactory();
  
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
  
  
  var newJas = {
    init: init,
    begin: begin,
    Entity: Entity,
    Asset: Asset,
    Event: Event,
    addState: addState,
    changeState: changeState,
  };
  
  return newJas;
}

var jas = jasFactory();
/* global namespace jas */
