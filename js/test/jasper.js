/*
 Copyright 2011-2013 Abdulla Abdurakhmanov
 Original sources are available at https://code.google.com/p/x2js/

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

function X2JS(config) {
	'use strict';
		
	var VERSION = "1.1.5";
	
	config = config || {};
	initConfigDefaults();
	initRequiredPolyfills();
	
	function initConfigDefaults() {
		if(config.escapeMode === undefined) {
			config.escapeMode = true;
		}
		config.attributePrefix = config.attributePrefix || "_";
		config.arrayAccessForm = config.arrayAccessForm || "none";
		config.emptyNodeForm = config.emptyNodeForm || "text";
		if(config.enableToStringFunc === undefined) {
			config.enableToStringFunc = true; 
		}
		config.arrayAccessFormPaths = config.arrayAccessFormPaths || []; 
		if(config.skipEmptyTextNodesForObj === undefined) {
			config.skipEmptyTextNodesForObj = true;
		}
		if(config.stripWhitespaces === undefined) {
			config.stripWhitespaces = true;
		}
		config.datetimeAccessFormPaths = config.datetimeAccessFormPaths || [];
	}

	var DOMNodeTypes = {
		ELEMENT_NODE 	   : 1,
		TEXT_NODE    	   : 3,
		CDATA_SECTION_NODE : 4,
		COMMENT_NODE	   : 8,
		DOCUMENT_NODE 	   : 9
	};
	
	function initRequiredPolyfills() {
		function pad(number) {
	      var r = String(number);
	      if ( r.length === 1 ) {
	        r = '0' + r;
	      }
	      return r;
	    }
		// Hello IE8-
		if(typeof String.prototype.trim !== 'function') {			
			String.prototype.trim = function() {
				return this.replace(/^\s+|^\n+|(\s|\n)+$/g, '');
			}
		}
		if(typeof Date.prototype.toISOString !== 'function') {
			// Implementation from http://stackoverflow.com/questions/2573521/how-do-i-output-an-iso-8601-formatted-string-in-javascript
			Date.prototype.toISOString = function() {
		      return this.getUTCFullYear()
		        + '-' + pad( this.getUTCMonth() + 1 )
		        + '-' + pad( this.getUTCDate() )
		        + 'T' + pad( this.getUTCHours() )
		        + ':' + pad( this.getUTCMinutes() )
		        + ':' + pad( this.getUTCSeconds() )
		        + '.' + String( (this.getUTCMilliseconds()/1000).toFixed(3) ).slice( 2, 5 )
		        + 'Z';
		    };
		}
	}
	
	function getNodeLocalName( node ) {
		var nodeLocalName = node.localName;			
		if(nodeLocalName == null) // Yeah, this is IE!! 
			nodeLocalName = node.baseName;
		if(nodeLocalName == null || nodeLocalName=="") // =="" is IE too
			nodeLocalName = node.nodeName;
		return nodeLocalName;
	}
	
	function getNodePrefix(node) {
		return node.prefix;
	}
		
	function escapeXmlChars(str) {
		if(typeof(str) == "string")
			return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/\//g, '&#x2F;');
		else
			return str;
	}

	function unescapeXmlChars(str) {
		return str.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#x2F;/g, '\/');
	}
	
	function toArrayAccessForm(obj, childName, path) {
		switch(config.arrayAccessForm) {
		case "property":
			if(!(obj[childName] instanceof Array))
				obj[childName+"_asArray"] = [obj[childName]];
			else
				obj[childName+"_asArray"] = obj[childName];
			break;		
		/*case "none":
			break;*/
		}
		
		if(!(obj[childName] instanceof Array) && config.arrayAccessFormPaths.length > 0) {
			var idx = 0;
			for(; idx < config.arrayAccessFormPaths.length; idx++) {
				var arrayPath = config.arrayAccessFormPaths[idx];
				if( typeof arrayPath === "string" ) {
					if(arrayPath == path)
						break;
				}
				else
				if( arrayPath instanceof RegExp) {
					if(arrayPath.test(path))
						break;
				}				
				else
				if( typeof arrayPath === "function") {
					if(arrayPath(obj, childName, path))
						break;
				}
			}
			if(idx!=config.arrayAccessFormPaths.length) {
				obj[childName] = [obj[childName]];
			}
		}
	}
	
	function fromXmlDateTime(prop) {
		// Implementation based up on http://stackoverflow.com/questions/8178598/xml-datetime-to-javascript-date-object
		// Improved to support full spec and optional parts
		var bits = prop.split(/[-T:+Z]/g);
		
		var d = new Date(bits[0], bits[1]-1, bits[2]);			
		var secondBits = bits[5].split("\.");
		d.setHours(bits[3], bits[4], secondBits[0]);
		if(secondBits.length>1)
			d.setMilliseconds(secondBits[1]);

		// Get supplied time zone offset in minutes
		if(bits[6] && bits[7]) {
			var offsetMinutes = bits[6] * 60 + Number(bits[7]);
			var sign = /\d\d-\d\d:\d\d$/.test(prop)? '-' : '+';

			// Apply the sign
			offsetMinutes = 0 + (sign == '-'? -1 * offsetMinutes : offsetMinutes);

			// Apply offset and local timezone
			d.setMinutes(d.getMinutes() - offsetMinutes - d.getTimezoneOffset())
		}
		else
			if(prop.indexOf("Z", prop.length - 1) !== -1) {
				d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()));					
			}

		// d is now a local time equivalent to the supplied time
		return d;
	}
	
	function checkFromXmlDateTimePaths(value, childName, fullPath) {
		if(config.datetimeAccessFormPaths.length > 0) {
			var path = fullPath.split("\.#")[0];
			var idx = 0;
			for(; idx < config.datetimeAccessFormPaths.length; idx++) {
				var dtPath = config.datetimeAccessFormPaths[idx];
				if( typeof dtPath === "string" ) {
					if(dtPath == path)
						break;
				}
				else
				if( dtPath instanceof RegExp) {
					if(dtPath.test(path))
						break;
				}				
				else
				if( typeof dtPath === "function") {
					if(dtPath(obj, childName, path))
						break;
				}
			}
			if(idx!=config.datetimeAccessFormPaths.length) {
				return fromXmlDateTime(value);
			}
			else
				return value;
		}
		else
			return value;
	}

	function parseDOMChildren( node, path ) {
		if(node.nodeType == DOMNodeTypes.DOCUMENT_NODE) {
			var result = new Object;
			var nodeChildren = node.childNodes;
			// Alternative for firstElementChild which is not supported in some environments
			for(var cidx=0; cidx <nodeChildren.length; cidx++) {
				var child = nodeChildren.item(cidx);
				if(child.nodeType == DOMNodeTypes.ELEMENT_NODE) {
					var childName = getNodeLocalName(child);
					result[childName] = parseDOMChildren(child, childName);
				}
			}
			return result;
		}
		else
		if(node.nodeType == DOMNodeTypes.ELEMENT_NODE) {
			var result = new Object;
			result.__cnt=0;
			
			var nodeChildren = node.childNodes;
			
			// Children nodes
			for(var cidx=0; cidx <nodeChildren.length; cidx++) {
				var child = nodeChildren.item(cidx); // nodeChildren[cidx];
				var childName = getNodeLocalName(child);
				
				if(child.nodeType!= DOMNodeTypes.COMMENT_NODE) {
					result.__cnt++;
					if(result[childName] == null) {
						result[childName] = parseDOMChildren(child, path+"."+childName);
						toArrayAccessForm(result, childName, path+"."+childName);					
					}
					else {
						if(result[childName] != null) {
							if( !(result[childName] instanceof Array)) {
								result[childName] = [result[childName]];
								toArrayAccessForm(result, childName, path+"."+childName);
							}
						}
						(result[childName])[result[childName].length] = parseDOMChildren(child, path+"."+childName);
					}
				}								
			}
			
			// Attributes
			for(var aidx=0; aidx <node.attributes.length; aidx++) {
				var attr = node.attributes.item(aidx); // [aidx];
				result.__cnt++;
				result[config.attributePrefix+attr.name]=attr.value;
			}
			
			// Node namespace prefix
			var nodePrefix = getNodePrefix(node);
			if(nodePrefix!=null && nodePrefix!="") {
				result.__cnt++;
				result.__prefix=nodePrefix;
			}
			
			if(result["#text"]!=null) {				
				result.__text = result["#text"];
				if(result.__text instanceof Array) {
					result.__text = result.__text.join("\n");
				}
				if(config.escapeMode)
					result.__text = unescapeXmlChars(result.__text);
				if(config.stripWhitespaces)
					result.__text = result.__text.trim();
				delete result["#text"];
				if(config.arrayAccessForm=="property")
					delete result["#text_asArray"];
				result.__text = checkFromXmlDateTimePaths(result.__text, childName, path+"."+childName);
			}
			if(result["#cdata-section"]!=null) {
				result.__cdata = result["#cdata-section"];
				delete result["#cdata-section"];
				if(config.arrayAccessForm=="property")
					delete result["#cdata-section_asArray"];
			}
			
			if( result.__cnt == 1 && result.__text!=null  ) {
				result = result.__text;
			}
			else
			if( result.__cnt == 0 && config.emptyNodeForm=="text" ) {
				result = '';
			}
			else
			if ( result.__cnt > 1 && result.__text!=null && config.skipEmptyTextNodesForObj) {
				if( (config.stripWhitespaces && result.__text=="") || (result.__text.trim()=="")) {
					delete result.__text;
				}
			}
			delete result.__cnt;			
			
			if( config.enableToStringFunc && (result.__text!=null || result.__cdata!=null )) {
				result.toString = function() {
					return (this.__text!=null? this.__text:'')+( this.__cdata!=null ? this.__cdata:'');
				};
			}
			
			return result;
		}
		else
		if(node.nodeType == DOMNodeTypes.TEXT_NODE || node.nodeType == DOMNodeTypes.CDATA_SECTION_NODE) {
			return node.nodeValue;
		}	
	}
	
	function startTag(jsonObj, element, attrList, closed) {
		var resultStr = "<"+ ( (jsonObj!=null && jsonObj.__prefix!=null)? (jsonObj.__prefix+":"):"") + element;
		if(attrList!=null) {
			for(var aidx = 0; aidx < attrList.length; aidx++) {
				var attrName = attrList[aidx];
				var attrVal = jsonObj[attrName];
				if(config.escapeMode)
					attrVal=escapeXmlChars(attrVal);
				resultStr+=" "+attrName.substr(config.attributePrefix.length)+"='"+attrVal+"'";
			}
		}
		if(!closed)
			resultStr+=">";
		else
			resultStr+="/>";
		return resultStr;
	}
	
	function endTag(jsonObj,elementName) {
		return "</"+ (jsonObj.__prefix!=null? (jsonObj.__prefix+":"):"")+elementName+">";
	}
	
	function endsWith(str, suffix) {
	    return str.indexOf(suffix, str.length - suffix.length) !== -1;
	}
	
	function jsonXmlSpecialElem ( jsonObj, jsonObjField ) {
		if((config.arrayAccessForm=="property" && endsWith(jsonObjField.toString(),("_asArray"))) 
				|| jsonObjField.toString().indexOf(config.attributePrefix)==0 
				|| jsonObjField.toString().indexOf("__")==0
				|| (jsonObj[jsonObjField] instanceof Function) )
			return true;
		else
			return false;
	}
	
	function jsonXmlElemCount ( jsonObj ) {
		var elementsCnt = 0;
		if(jsonObj instanceof Object ) {
			for( var it in jsonObj  ) {
				if(jsonXmlSpecialElem ( jsonObj, it) )
					continue;			
				elementsCnt++;
			}
		}
		return elementsCnt;
	}
	
	function parseJSONAttributes ( jsonObj ) {
		var attrList = [];
		if(jsonObj instanceof Object ) {
			for( var ait in jsonObj  ) {
				if(ait.toString().indexOf("__")== -1 && ait.toString().indexOf(config.attributePrefix)==0) {
					attrList.push(ait);
				}
			}
		}
		return attrList;
	}
	
	function parseJSONTextAttrs ( jsonTxtObj ) {
		var result ="";
		
		if(jsonTxtObj.__cdata!=null) {										
			result+="<![CDATA["+jsonTxtObj.__cdata+"]]>";					
		}
		
		if(jsonTxtObj.__text!=null) {			
			if(config.escapeMode)
				result+=escapeXmlChars(jsonTxtObj.__text);
			else
				result+=jsonTxtObj.__text;
		}
		return result;
	}
	
	function parseJSONTextObject ( jsonTxtObj ) {
		var result ="";

		if( jsonTxtObj instanceof Object ) {
			result+=parseJSONTextAttrs ( jsonTxtObj );
		}
		else
			if(jsonTxtObj!=null) {
				if(config.escapeMode)
					result+=escapeXmlChars(jsonTxtObj);
				else
					result+=jsonTxtObj;
			}
		
		return result;
	}
	
	function parseJSONArray ( jsonArrRoot, jsonArrObj, attrList ) {
		var result = ""; 
		if(jsonArrRoot.length == 0) {
			result+=startTag(jsonArrRoot, jsonArrObj, attrList, true);
		}
		else {
			for(var arIdx = 0; arIdx < jsonArrRoot.length; arIdx++) {
				result+=startTag(jsonArrRoot[arIdx], jsonArrObj, parseJSONAttributes(jsonArrRoot[arIdx]), false);
				result+=parseJSONObject(jsonArrRoot[arIdx]);
				result+=endTag(jsonArrRoot[arIdx],jsonArrObj);						
			}
		}
		return result;
	}
	
	function parseJSONObject ( jsonObj ) {
		var result = "";	

		var elementsCnt = jsonXmlElemCount ( jsonObj );
		
		if(elementsCnt > 0) {
			for( var it in jsonObj ) {
				
				if(jsonXmlSpecialElem ( jsonObj, it) )
					continue;			
				
				var subObj = jsonObj[it];						
				
				var attrList = parseJSONAttributes( subObj )
				
				if(subObj == null || subObj == undefined) {
					result+=startTag(subObj, it, attrList, true);
				}
				else
				if(subObj instanceof Object) {
					
					if(subObj instanceof Array) {					
						result+=parseJSONArray( subObj, it, attrList );					
					}
					else if(subObj instanceof Date) {
						result+=startTag(subObj, it, attrList, false);
						result+=subObj.toISOString();
						result+=endTag(subObj,it);
					}
					else {
						var subObjElementsCnt = jsonXmlElemCount ( subObj );
						if(subObjElementsCnt > 0 || subObj.__text!=null || subObj.__cdata!=null) {
							result+=startTag(subObj, it, attrList, false);
							result+=parseJSONObject(subObj);
							result+=endTag(subObj,it);
						}
						else {
							result+=startTag(subObj, it, attrList, true);
						}
					}
				}
				else {
					result+=startTag(subObj, it, attrList, false);
					result+=parseJSONTextObject(subObj);
					result+=endTag(subObj,it);
				}
			}
		}
		result+=parseJSONTextObject(jsonObj);
		
		return result;
	}
	
	this.parseXmlString = function(xmlDocStr) {
		var isIEParser = window.ActiveXObject || "ActiveXObject" in window;
		if (xmlDocStr === undefined) {
			return null;
		}
		var xmlDoc;
		if (window.DOMParser) {
			var parser=new window.DOMParser();			
			var parsererrorNS = null;
			// IE9+ now is here
			if(!isIEParser) {
				try {
					parsererrorNS = parser.parseFromString("INVALID", "text/xml").childNodes[0].namespaceURI;
				}
				catch(err) {					
					parsererrorNS = null;
				}
			}
			try {
				xmlDoc = parser.parseFromString( xmlDocStr, "text/xml" );
				if( parsererrorNS!= null && xmlDoc.getElementsByTagNameNS(parsererrorNS, "parsererror").length > 0) {
					//throw new Error('Error parsing XML: '+xmlDocStr);
					xmlDoc = null;
				}
			}
			catch(err) {
				xmlDoc = null;
			}
		}
		else {
			// IE :(
			if(xmlDocStr.indexOf("<?")==0) {
				xmlDocStr = xmlDocStr.substr( xmlDocStr.indexOf("?>") + 2 );
			}
			xmlDoc=new ActiveXObject("Microsoft.XMLDOM");
			xmlDoc.async="false";
			xmlDoc.loadXML(xmlDocStr);
		}
		return xmlDoc;
	};
	
	this.asArray = function(prop) {
		if(prop instanceof Array)
			return prop;
		else
			return [prop];
	};
	
	this.toXmlDateTime = function(dt) {
		if(dt instanceof Date)
			return dt.toISOString();
		else
		if(typeof(dt) === 'number' )
			return new Date(dt).toISOString();
		else	
			return null;
	};
	
	this.asDateTime = function(prop) {
		if(typeof(prop) == "string") {
			return fromXmlDateTime(prop);
		}
		else
			return prop;
	};

	this.xml2json = function (xmlDoc) {
		return parseDOMChildren ( xmlDoc );
	};
	
	this.xml_str2json = function (xmlDocStr) {
		var xmlDoc = this.parseXmlString(xmlDocStr);
		if(xmlDoc!=null)
			return this.xml2json(xmlDoc);
		else
			return null;
	};

	this.json2xml_str = function (jsonObj) {
		return parseJSONObject ( jsonObj );
	};

	this.json2xml = function (jsonObj) {
		var xmlDocStr = this.json2xml_str (jsonObj);
		return this.parseXmlString(xmlDocStr);
	};
	
	this.getVersion = function () {
		return VERSION;
	};
	
}

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
      console.log(name);
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
    
    
    var request = new XMLHttpRequest();
    var data = {};
    
    request.onreadystatechange = function () {
      var waiting = request.readyState == 2;
      if (waiting) {
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
      
      if (typeof(userCallback) == "function") {
          userCallback(map);
      }
      
      assets.maps[name] = map;

    };
    
    request.onerror = function () {
      console.error("error finding tmx file in newMap");
    };
    
    request.open("get", path, true);
    
    request.send();
    
      
  }

  function newImage(name, path, userCallback) {
    var image = new Image();
    
    
    assets.images[name] = false;
    /*global Image*/
    
    image.onload = function () {
      assets.images[name] = image;
      if (typeof(userCallback) == "function") {
        userCallback(image);
      }
    };
    
    image.onerror = function (e) {
      console.log(e);
    };
  
    image.src = path;
  
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
      var controller;
      
      instance.setState = function (state, status) {
        fst.setState(state, status);
      };
      
      instance.getState = function (state) {
        return fst.getState(state);
      };
      
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
      };
      
      instance.setController = function (userController) {
        controller = userController || false;
        
      }
      
      
      
      instance.id = entityAutoId;
      entityAutoId++;
      instance.x = mutator.x || 0;
      instance.y = mutator.y || 0;
      instance.w = mutator.w || 0;
      instance.h = mutator.h || 0;
      
      return instance;
    },
    rect: function (mutator) {
      var instance = this.entity(mutator);
      var color = mutator.color || null;
      var alpha = mutator.alpha != null? mutator.alpha: null;
      
      instance.getOrigin = function () {
        return {x: instance.x, y: instance.y};
      };
      
      instance.getCenter = function () {
        var x = instance.x + instance.w / 2;
        var y = instance.y + instance.h / 2;
        return {x: x, y : y};
      };
      
      instance.getArea = function () {
        return instance.w * instance.h; 
      };
      
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
      };
      
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
      };
      
      return instance;
    },
    circ: function (mutator) {
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
    // call it a proxy-class if you will. This relays to a different class depending on values in mutator
    shape : function (mutator) {
      
      instance = classes[mutator.shape] ? classes[mutator.shape](mutator): classes.rect(mutator);
      var collideable = mutator.collideable? mutator.collideable: true;
      instance.setState("collideable", collideable);   // using class entity's FSM 
      
      return instance;
    },
    composite: function (mutator) {
      var instance = classes.shape(mutator);
      // composite entities store other entities in layers
      var layers = {};
      
      instance.getLayer = function (layerId, callback) {
        var layer = layers[layerId];
        if (typeof(callback) == "function" && layer) {
          callback(layer);
        }
        else
        {
          return layer;
        }
      }
      
      instance.addLayer = function (layerId, arr) {
        var layer = arr || []
        layers[layerId] = layer;
      }
      
      instance.pushToLayer = function (layerId, entity) {
        var layer = layers[layerId];
        layer.push(entity);
      };
      
      return instance;
      
    },
    // todo: make a GUI component class
    component: function (mutator) {
      var instance = classes.composite(mutator);
      
      var parent;
      // a widget will be a component that contains components
      
      
      return instance;
    },
    widget: function (mutator) {
      mutator.shape = mutator.shape || "rect";
      var instance = classes.component(mutator);
      var padding = mutator.padding || 5;
            
      
      var rows = [];
      instance.addRow = function (callback) {
        function rowFactory () {
          var row = [];
          row.w = 0;
          row.h = 0;
          row.addEntity = function (entity) {
            row.push(entity.id);
          };
          row.getEntityDimensions = function (col) {
            var dimensions = {};
            var entity = entities[row[col]];
            dimensions.w = entity.w;
            dimensions.h = entity.h;
            return dimensions;
          };
          
          return row;
        }
        
        var row = rowFactory();
        rows.push(row);
        if (typeof(callback) == "function") {
          callback(row);
        }
      };
      
      instance.pack = function () {
        // minimum size for parent container
        function fillWidget () {
          var maxW = 0;
          var maxH = 0;
          for (var i in rows) {
            var row = rows[i];
            row.w = 0; // reset these things
            row.h = 0;
            row.col = 0;
            for (var j in row) {
              row.col++; // calculate row
              var entity = row[j];
              row.w += entity.w;
              row.h = entity.h > row.h? entity.h: row.h;
            }
            // apply padding. change widget width and height
            row.h += (i + 1) * padding;
            row.w += (row.col + 1) * padding;
            maxW = row.w > maxW? row.w: maxW;
            maxH += row.h;
          }
          instance.w = maxW;
          instance.h = maxH;
        }
        
        function placeComponents() {
          var y = instance.y + padding;
          for (var i in rows) {
            var row = rows[i];
            var x = instance.x + padding;
            for (var j in row) {
              var onColNum = 0;
              var colW = row.col / instance.w;
              
              var entityId = row[j];
              entites[entityId].x = x;
              entites[entityId].y = y;
              x = colW * onColNum + padding;
            }
            y += row.h + padding;
          }
        }
        
        fillWidget();
        placeComponents();
      };
      
      return instance;
    },
    text: function (mutator) {
      mutator = mutator || {};
      var color = mutator.color || "#fff";
      var alpha = mutator.color || 1;
      var font = mutator.font || "1em arial";
      var string = mutator.string;
      var instance = classes.sprite(mutator);
      
      
      instance.changeText = function (callback) {
        if ( typeof(callback) == "function") {
          string = callback(string);
        }
        makeTextImage(); // reset image
      };

      instance.getDraw = function () {
        return {
          type: "text",
          x: instance.x,
          y: instance.y,
          string: string,
          color: color,
          alpha: alpha,
          font: font
        };
      };
      
 
      // saving text to an image is more efficient than re-rendering text via canvas.
      function makeTextImage() {
        var tempCanvas = document.createElement("canvas");
        tempCanvas.width = 50;
        tempCanvas.height = 50;
        var ctx = tempCanvas.getContext("2d");
        
        var dimensions = ctx.measureText(string);
        tempCanvas.width = dimensions.width;
        tempCanvas.height = 50;
        
        
        ctx.font = font;
        ctx.fillStyle = color;
        ctx.globalAlpha = alpha;
        
        
        ctx.fillText(string, 0, 10);
        var url = tempCanvas.toDataURL();

        //save string as a png in Assets. Once loaded, change draw.
        jas.Asset.newImage("text-image:"+instance.id, url, function (image) {
          document.appendChild(image);
          var draw = {
            type: "sprite",
            frame: {
              sx: 0,
              sy: 0,
              sw: tempCanvas.width,
              sh: tempCanvas.height,
              x: instance.x,
              y: instance.y,
              w: tempCanvas.width,
              h: tempCanvas.height
            },
            imageId: url
          };
          
          instance.getDraw = function () {
            return draw;
          };

        });
      }
      
      makeTextImage();
      
      
      return instance;
    },
    label : function (mutator) {
      mutator = mutator || {};
      
      var instance = classes.entity(mutator);
      
      var textMutator = mutator.text || {};
      
      var x = mutator.x;
      var y = mutator.y;
      var w = mutator.w;
      var h = mutator.h;
      
      var text = classes.text({
        string: mutator.string,
        x: x,
        y: y + h,
        w: w,
        h: h,
        color: mutator.textColor,
        alpha: mutator.textAlpha  
      });
      
      //var frame = classes.rect(mutator.frame);
      var shapeMutator = mutator.shape || {};
      var shapeType = shapeMutator.type || "rect";

      var container = classes.rect({
        x: x,
        y: y,
        w: w,
        h: h,
        color: mutator.shapeColor,
        alpha: mutator.shapeAlpha  
      });
      
      //console.log(container);
      instance.layers = {
        text: {
          entities: [text]
        },
        container: {
          entities: [container]
        }
      };
      
      instance.getDraw = function () {
        return {
          type: "complex",
          layers: instance.layers
        };
      }
      // remove all this layer nonsense once the 'composite' class is fleshed out
      instance.getLayer = function (layerId) {
        return instance.layers[layerId].entities;
      };
      
      instance.changeLabelText = function (callback) {
        instance.getLayer("text")[0].changeText(callback); // lazy
      }
      
      return instance;
    },
    sprite : function (mutator) {
      var instance = this.composite(mutator);
      
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
        };
        
        animation.reset = function() {
          currentFrame = 0;
          done = false;
        };
        
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
      };
      
      instance.getAnimId = function () {
        return instance.anim.name;
      };
      
      instance.addAnim = function (animId, animMutator) {
        instance.animations[animId] = animationFactory(animMutator);
        if (animMutator.def) {
          instance.anim = instance.animations[animId];
        }
      };
      
      instance.updateAnim = function () {
        instance.anim.update();
      };
      
      instance.resetAnim = function (animId) {
        if (animId) {
          instance.animation[animId].reset();
        }
        else {
          instance.anim.reset();
        }
      };
      
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
      };
      
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
      };
      
      // returns a function that returns vector
      function getSpawnStrategy () {
        var vector = {};
        if(spawnPosition == "random") {
          return function () {
            return instance.getRandomVector( 0, 0, -spawnMutator.w, -spawnMutator.h);  
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
      };
      
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
            layers: instance.layers[layer].entities
          };
        }
        else {
          return false;
        }
      };
      // remove all this layer nonsense once the 'composite' class is fleshed out
      instance.getLayer = function (layerId, callback) {
        var groupLayer;
        if (instance.layers && instance.layers[layerId]) {
          groupLayer = instance.layers[layerId];
          if (typeof(callback) == "function" && groupLayer && groupLayer.entities) {
            groupLayer.entities.forEach( function(val, index, arr) {
              callback(val, index, arr);
            });
          }
          return true;
        }
        else
        {
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
  
  function getEntityById(id) {
    return entities[id];
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
  // controllers communicate to entities
  var controllerAutoId = 0;
  
  var controllers = [];
  
  // the master controller relays controls to all other controllers
  function masterControllerFactory(canvas) {
    controller = {};
    
    jas.Event.addPublication("MOUSE_PRESSED");
    jas.Event.addPublication("MOUSE_DOWN");
    jas.Event.addPublication("MOUSE_UP");
    
    canvas.addEventListener('mousedown', function (e) {
      if (controller.mouseup) {
        delete controller.mouseup;
        jas.Event.publish("MOUSE_PRESSED");
      }
      controller.mousedown = true;
      jas.Event.publish("MOUSE_DOWN");
      
    }, false);
    
    canvas.addEventListener('mouseup', function () {
      if (controller.mousedown) {
        delete controller.mousedown;
        jas.Event.publish("MOUSE_UP");
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
    
    var keysByNum = {};
    
    for (var i in keyCodes) {
      keysByNum[keyCodes[i]] = i;
      jas.Event.addPublication(i + "_PRESSED");
      jas.Event.addPublication(i + "_DOWN");
      jas.Event.addPublication(i + "_UP");
    }
    
    function addKey (e) {
      var key = keysByNum[e.keyCode];
      
      if (!keys[e.keyCode]) {
        jas.Event.publish(key + "_PRESSED");
      }
      
      keys[e.keyCode] = true;
    }
  
    function removeKey(e) {
      delete keys[e.keyCode];
      var key = keysByNum[e.keyCode];
      jas.Event.publish(key+ "_UP");
    }
    
    
    window.addEventListener('keydown', addKey, false);
    
    window.addEventListener('keyup', removeKey, false);
    
    function isKeyDown (key) {
      var isIt = keys[keyCodes[key]];
      if (isIt) {
        jas.Event.publish(keysByNum[keyCodes[key]] + "_DOWN");
      }
      return  isIt ? true: false;
    }
    
    
    // master controller public api
    var controller = {
      isKeyDown: isKeyDown,
      checkKeys: function() {
        for (var i in keys) {
          var key = keys[i];
          jas.Event.publish(keysByNum[keyCodes[key]] + "_DOWN");
        }
      },
      areKeysDown: function (keyArr, callback) {
        for (var i in keyArr) {
          var key = keyArr[i];
          if (isKeyDown(key)) {
            return false;
          }
        }
        typeof(callback) == "function" ? callback(): null;
        return true;
      },
      keysNotPressed: function (keyArr) {
        for (var i in keyArr) {
          var key = keyArr[i];
          if (isKeyDown(key)) {
            return false;
          }
        }
        typeof(callback) == "function" ? callback(): null;
        return true;
      }
    };
    
    return controller;
  }
  
  // controller classes
  var classes = {
    
    controller: function (mutator) {
      mutator = mutator || {};
      var instance = {};
      
      instance.id = controllerAutoId++;
      
      // add subscribers to master controllers publications
      for (var pub in mutator) {
        jas.Event.subscribe(pub, controllerAutoId, mutator[pub]);
      }
      
      
      return instance;
    }
    
  };

  function inst (type, mutator) {
      return classes[type](mutator);
  }
  
  function newClass (type, mutatorFunction) {
    if (typeof(mutatorFunction) == "function") {
      classes[type] = mutatorFunction;
    }
    else {
      return false;
    }
  }
  //yeah
  jas.controllerFactory = masterControllerFactory;
  
  jas.Controller = {
    inst: inst,
    newClass: newClass
  };
})(jas);
(function (jas) {
  function graphicsFactory (canvas, ctx) {
    function drawRect (draw) {
      var color = draw.color || "#000";
        
      ctx.fillStyle = color;
      ctx.globalAlpha = draw.alpha != null? draw.alpha: 1;
      
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
      
      ctx.globalAlpha = draw.alpha || 1;
      ctx.fillStyle = draw.color || "#fff";
      ctx.font = draw.font || "1em arial";
      ctx.fillText(string, x, y);
      ctx.globalAlpha = 1;
    }
    
    function drawSprite (draw) {
      var image = jas.Asset.getImage(draw.imageId);
      //console.log(draw);

        //console.log(image);
      
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
        //console.log(layer);
        iterateDrawGroup(layer.entities);
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
        else {
          chooseDraw(draw);  
        }
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
        case "text":
          drawText(draw);
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