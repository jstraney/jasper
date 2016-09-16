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

/*!
 *  howler.js v1.1.29
 *  howlerjs.com
 *
 *  (c) 2013-2016, James Simpson of GoldFire Studios
 *  goldfirestudios.com
 *
 *  MIT License
 */

(function() {
  // setup
  var cache = {};

  // setup the audio context
  var ctx = null,
    usingWebAudio = true,
    noAudio = false;
  try {
    if (typeof AudioContext !== 'undefined') {
      ctx = new AudioContext();
    } else if (typeof webkitAudioContext !== 'undefined') {
      ctx = new webkitAudioContext();
    } else {
      usingWebAudio = false;
    }
  } catch(e) {
    usingWebAudio = false;
  }

  if (!usingWebAudio) {
    if (typeof Audio !== 'undefined') {
      try {
        new Audio();
      } catch(e) {
        noAudio = true;
      }
    } else {
      noAudio = true;
    }
  }

  // create a master gain node
  if (usingWebAudio) {
    var masterGain = (typeof ctx.createGain === 'undefined') ? ctx.createGainNode() : ctx.createGain();
    masterGain.gain.value = 1;
    masterGain.connect(ctx.destination);
  }

  // create global controller
  var HowlerGlobal = function(codecs) {
    this._volume = 1;
    this._muted = false;
    this.usingWebAudio = usingWebAudio;
    this.ctx = ctx;
    this.noAudio = noAudio;
    this._howls = [];
    this._codecs = codecs;
    this.iOSAutoEnable = true;
  };
  HowlerGlobal.prototype = {
    /**
     * Get/set the global volume for all sounds.
     * @param  {Float} vol Volume from 0.0 to 1.0.
     * @return {Howler/Float}     Returns self or current volume.
     */
    volume: function(vol) {
      var self = this;

      // make sure volume is a number
      vol = parseFloat(vol);

      if (vol >= 0 && vol <= 1) {
        self._volume = vol;

        if (usingWebAudio) {
          masterGain.gain.value = vol;
        }

        // loop through cache and change volume of all nodes that are using HTML5 Audio
        for (var key in self._howls) {
          if (self._howls.hasOwnProperty(key) && self._howls[key]._webAudio === false) {
            // loop through the audio nodes
            for (var i=0; i<self._howls[key]._audioNode.length; i++) {
              self._howls[key]._audioNode[i].volume = self._howls[key]._volume * self._volume;
            }
          }
        }

        return self;
      }

      // return the current global volume
      return (usingWebAudio) ? masterGain.gain.value : self._volume;
    },

    /**
     * Mute all sounds.
     * @return {Howler}
     */
    mute: function() {
      this._setMuted(true);

      return this;
    },

    /**
     * Unmute all sounds.
     * @return {Howler}
     */
    unmute: function() {
      this._setMuted(false);

      return this;
    },

    /**
     * Handle muting and unmuting globally.
     * @param  {Boolean} muted Is muted or not.
     */
    _setMuted: function(muted) {
      var self = this;

      self._muted = muted;

      if (usingWebAudio) {
        masterGain.gain.value = muted ? 0 : self._volume;
      }

      for (var key in self._howls) {
        if (self._howls.hasOwnProperty(key) && self._howls[key]._webAudio === false) {
          // loop through the audio nodes
          for (var i=0; i<self._howls[key]._audioNode.length; i++) {
            self._howls[key]._audioNode[i].muted = muted;
          }
        }
      }
    },

    /**
     * Check for codec support.
     * @param  {String} ext Audio file extension.
     * @return {Boolean}
     */
    codecs: function(ext) {
      return this._codecs[ext];
    },

    /**
     * iOS will only allow audio to be played after a user interaction.
     * Attempt to automatically unlock audio on the first user interaction.
     * Concept from: http://paulbakaus.com/tutorials/html5/web-audio-on-ios/
     * @return {Howler}
     */
    _enableiOSAudio: function() {
      var self = this;

      // only run this on iOS if audio isn't already eanbled
      if (ctx && (self._iOSEnabled || !/iPhone|iPad|iPod/i.test(navigator.userAgent))) {
        return;
      }

      self._iOSEnabled = false;

      // call this method on touch start to create and play a buffer,
      // then check if the audio actually played to determine if
      // audio has now been unlocked on iOS
      var unlock = function() {
        // create an empty buffer
        var buffer = ctx.createBuffer(1, 1, 22050);
        var source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);

        // play the empty buffer
        if (typeof source.start === 'undefined') {
          source.noteOn(0);
        } else {
          source.start(0);
        }

        // setup a timeout to check that we are unlocked on the next event loop
        setTimeout(function() {
          if ((source.playbackState === source.PLAYING_STATE || source.playbackState === source.FINISHED_STATE)) {
            // update the unlocked state and prevent this check from happening again
            self._iOSEnabled = true;
            self.iOSAutoEnable = false;

            // remove the touch start listener
            window.removeEventListener('touchend', unlock, false);
          }
        }, 0);
      };

      // setup a touch start listener to attempt an unlock in
      window.addEventListener('touchend', unlock, false);

      return self;
    }
  };

  // check for browser codec support
  var audioTest = null;
  var codecs = {};
  if (!noAudio) {
    audioTest = new Audio();
    codecs = {
      mp3: !!audioTest.canPlayType('audio/mpeg;').replace(/^no$/, ''),
      opus: !!audioTest.canPlayType('audio/ogg; codecs="opus"').replace(/^no$/, ''),
      ogg: !!audioTest.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, ''),
      wav: !!audioTest.canPlayType('audio/wav; codecs="1"').replace(/^no$/, ''),
      aac: !!audioTest.canPlayType('audio/aac;').replace(/^no$/, ''),
      m4a: !!(audioTest.canPlayType('audio/x-m4a;') || audioTest.canPlayType('audio/m4a;') || audioTest.canPlayType('audio/aac;')).replace(/^no$/, ''),
      mp4: !!(audioTest.canPlayType('audio/x-mp4;') || audioTest.canPlayType('audio/mp4;') || audioTest.canPlayType('audio/aac;')).replace(/^no$/, ''),
      weba: !!audioTest.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/, '')
    };
  }

  // allow access to the global audio controls
  var Howler = new HowlerGlobal(codecs);

  // setup the audio object
  var Howl = function(o) {
    var self = this;

    // setup the defaults
    self._autoplay = o.autoplay || false;
    self._buffer = o.buffer || false;
    self._duration = o.duration || 0;
    self._format = o.format || null;
    self._loop = o.loop || false;
    self._loaded = false;
    self._sprite = o.sprite || {};
    self._src = o.src || '';
    self._pos3d = o.pos3d || [0, 0, -0.5];
    self._volume = o.volume !== undefined ? o.volume : 1;
    self._urls = o.urls || [];
    self._rate = o.rate || 1;

    // allow forcing of a specific panningModel ('equalpower' or 'HRTF'),
    // if none is specified, defaults to 'equalpower' and switches to 'HRTF'
    // if 3d sound is used
    self._model = o.model || null;

    // setup event functions
    self._onload = [o.onload || function() {}];
    self._onloaderror = [o.onloaderror || function() {}];
    self._onend = [o.onend || function() {}];
    self._onpause = [o.onpause || function() {}];
    self._onplay = [o.onplay || function() {}];

    self._onendTimer = [];

    // Web Audio or HTML5 Audio?
    self._webAudio = usingWebAudio && !self._buffer;

    // check if we need to fall back to HTML5 Audio
    self._audioNode = [];
    if (self._webAudio) {
      self._setupAudioNode();
    }

    // automatically try to enable audio on iOS
    if (typeof ctx !== 'undefined' && ctx && Howler.iOSAutoEnable) {
      Howler._enableiOSAudio();
    }

    // add this to an array of Howl's to allow global control
    Howler._howls.push(self);

    // load the track
    self.load();
  };

  // setup all of the methods
  Howl.prototype = {
    /**
     * Load an audio file.
     * @return {Howl}
     */
    load: function() {
      var self = this,
        url = null;

      // if no audio is available, quit immediately
      if (noAudio) {
        self.on('loaderror', new Error('No audio support.'));
        return;
      }

      // loop through source URLs and pick the first one that is compatible
      for (var i=0; i<self._urls.length; i++) {
        var ext, urlItem;

        if (self._format) {
          // use specified audio format if available
          ext = self._format;
        } else {
          // figure out the filetype (whether an extension or base64 data)
          urlItem = self._urls[i];
          ext = /^data:audio\/([^;,]+);/i.exec(urlItem);
          if (!ext) {
            ext = /\.([^.]+)$/.exec(urlItem.split('?', 1)[0]);
          }

          if (ext) {
            ext = ext[1].toLowerCase();
          } else {
            self.on('loaderror', new Error('Could not extract format from passed URLs, please add format parameter.'));
            return;
          }
        }

        if (codecs[ext]) {
          url = self._urls[i];
          break;
        }
      }

      if (!url) {
        self.on('loaderror', new Error('No codec support for selected audio sources.'));
        return;
      }

      self._src = url;

      if (self._webAudio) {
        loadBuffer(self, url);
      } else {
        var newNode = new Audio();

        // listen for errors with HTML5 audio (http://dev.w3.org/html5/spec-author-view/spec.html#mediaerror)
        newNode.addEventListener('error', function () {
          if (newNode.error && newNode.error.code === 4) {
            HowlerGlobal.noAudio = true;
          }

          self.on('loaderror', {type: newNode.error ? newNode.error.code : 0});
        }, false);

        self._audioNode.push(newNode);

        // setup the new audio node
        newNode.src = url;
        newNode._pos = 0;
        newNode.preload = 'auto';
        newNode.volume = (Howler._muted) ? 0 : self._volume * Howler.volume();

        // setup the event listener to start playing the sound
        // as soon as it has buffered enough
        var listener = function() {
          // round up the duration when using HTML5 Audio to account for the lower precision
          self._duration = Math.ceil(newNode.duration * 10) / 10;

          // setup a sprite if none is defined
          if (Object.getOwnPropertyNames(self._sprite).length === 0) {
            self._sprite = {_default: [0, self._duration * 1000]};
          }

          if (!self._loaded) {
            self._loaded = true;
            self.on('load');
          }

          if (self._autoplay) {
            self.play();
          }

          // clear the event listener
          newNode.removeEventListener('canplaythrough', listener, false);
        };
        newNode.addEventListener('canplaythrough', listener, false);
        newNode.load();
      }

      return self;
    },

    /**
     * Get/set the URLs to be pulled from to play in this source.
     * @param  {Array} urls  Arry of URLs to load from
     * @return {Howl}        Returns self or the current URLs
     */
    urls: function(urls) {
      var self = this;

      if (urls) {
        self.stop();
        self._urls = (typeof urls === 'string') ? [urls] : urls;
        self._loaded = false;
        self.load();

        return self;
      } else {
        return self._urls;
      }
    },

    /**
     * Play a sound from the current time (0 by default).
     * @param  {String}   sprite   (optional) Plays from the specified position in the sound sprite definition.
     * @param  {Function} callback (optional) Returns the unique playback id for this sound instance.
     * @return {Howl}
     */
    play: function(sprite, callback) {
      var self = this;

      // if no sprite was passed but a callback was, update the variables
      if (typeof sprite === 'function') {
        callback = sprite;
      }

      // use the default sprite if none is passed
      if (!sprite || typeof sprite === 'function') {
        sprite = '_default';
      }

      // if the sound hasn't been loaded, add it to the event queue
      if (!self._loaded) {
        self.on('load', function() {
          self.play(sprite, callback);
        });

        return self;
      }

      // if the sprite doesn't exist, play nothing
      if (!self._sprite[sprite]) {
        if (typeof callback === 'function') callback();
        return self;
      }

      // get the node to playback
      self._inactiveNode(function(node) {
        // persist the sprite being played
        node._sprite = sprite;

        // determine where to start playing from
        var pos = (node._pos > 0) ? node._pos : self._sprite[sprite][0] / 1000;

        // determine how long to play for
        var duration = 0;
        if (self._webAudio) {
          duration = self._sprite[sprite][1] / 1000 - node._pos;
          if (node._pos > 0) {
            pos = self._sprite[sprite][0] / 1000 + pos;
          }
        } else {
          duration = self._sprite[sprite][1] / 1000 - (pos - self._sprite[sprite][0] / 1000);
        }

        // determine if this sound should be looped
        var loop = !!(self._loop || self._sprite[sprite][2]);

        // set timer to fire the 'onend' event
        var soundId = (typeof callback === 'string') ? callback : Math.round(Date.now() * Math.random()) + '',
          timerId;
        (function() {
          var data = {
            id: soundId,
            sprite: sprite,
            loop: loop
          };
          timerId = setTimeout(function() {
            // if looping, restart the track
            if (!self._webAudio && loop) {
              self.stop(data.id).play(sprite, data.id);
            }

            // set web audio node to paused at end
            if (self._webAudio && !loop) {
              self._nodeById(data.id).paused = true;
              self._nodeById(data.id)._pos = 0;

              // clear the end timer
              self._clearEndTimer(data.id);
            }

            // end the track if it is HTML audio and a sprite
            if (!self._webAudio && !loop) {
              self.stop(data.id);
            }

            // fire ended event
            self.on('end', soundId);
          }, (duration / self._rate) * 1000);

          // store the reference to the timer
          self._onendTimer.push({timer: timerId, id: data.id});
        })();

        if (self._webAudio) {
          var loopStart = self._sprite[sprite][0] / 1000,
            loopEnd = self._sprite[sprite][1] / 1000;

          // set the play id to this node and load into context
          node.id = soundId;
          node.paused = false;
          refreshBuffer(self, [loop, loopStart, loopEnd], soundId);
          self._playStart = ctx.currentTime;
          node.gain.value = self._volume;

          if (typeof node.bufferSource.start === 'undefined') {
            loop ? node.bufferSource.noteGrainOn(0, pos, 86400) : node.bufferSource.noteGrainOn(0, pos, duration);
          } else {
            loop ? node.bufferSource.start(0, pos, 86400) : node.bufferSource.start(0, pos, duration);
          }
        } else {
          if (node.readyState === 4 || !node.readyState && navigator.isCocoonJS) {
            node.readyState = 4;
            node.id = soundId;
            node.currentTime = pos;
            node.muted = Howler._muted || node.muted;
            node.volume = self._volume * Howler.volume();
            setTimeout(function() { node.play(); }, 0);
          } else {
            self._clearEndTimer(soundId);

            (function(){
              var sound = self,
                playSprite = sprite,
                fn = callback,
                newNode = node;
              var listener = function() {
                sound.play(playSprite, fn);

                // clear the event listener
                newNode.removeEventListener('canplaythrough', listener, false);
              };
              newNode.addEventListener('canplaythrough', listener, false);
            })();

            return self;
          }
        }

        // fire the play event and send the soundId back in the callback
        self.on('play');
        if (typeof callback === 'function') callback(soundId);

        return self;
      });

      return self;
    },

    /**
     * Pause playback and save the current position.
     * @param {String} id (optional) The play instance ID.
     * @return {Howl}
     */
    pause: function(id) {
      var self = this;

      // if the sound hasn't been loaded, add it to the event queue
      if (!self._loaded) {
        self.on('play', function() {
          self.pause(id);
        });

        return self;
      }

      // clear 'onend' timer
      self._clearEndTimer(id);

      var activeNode = (id) ? self._nodeById(id) : self._activeNode();
      if (activeNode) {
        activeNode._pos = self.pos(null, id);

        if (self._webAudio) {
          // make sure the sound has been created
          if (!activeNode.bufferSource || activeNode.paused) {
            return self;
          }

          activeNode.paused = true;
          if (typeof activeNode.bufferSource.stop === 'undefined') {
            activeNode.bufferSource.noteOff(0);
          } else {
            activeNode.bufferSource.stop(0);
          }
        } else {
          activeNode.pause();
        }
      }

      self.on('pause');

      return self;
    },

    /**
     * Stop playback and reset to start.
     * @param  {String} id  (optional) The play instance ID.
     * @return {Howl}
     */
    stop: function(id) {
      var self = this;

      // if the sound hasn't been loaded, add it to the event queue
      if (!self._loaded) {
        self.on('play', function() {
          self.stop(id);
        });

        return self;
      }

      // clear 'onend' timer
      self._clearEndTimer(id);

      var activeNode = (id) ? self._nodeById(id) : self._activeNode();
      if (activeNode) {
        activeNode._pos = 0;

        if (self._webAudio) {
          // make sure the sound has been created
          if (!activeNode.bufferSource || activeNode.paused) {
            return self;
          }

          activeNode.paused = true;

          if (typeof activeNode.bufferSource.stop === 'undefined') {
            activeNode.bufferSource.noteOff(0);
          } else {
            activeNode.bufferSource.stop(0);
          }
        } else if (!isNaN(activeNode.duration)) {
          activeNode.pause();
          activeNode.currentTime = 0;
        }
      }

      return self;
    },

    /**
     * Mute this sound.
     * @param  {String} id (optional) The play instance ID.
     * @return {Howl}
     */
    mute: function(id) {
      var self = this;

      // if the sound hasn't been loaded, add it to the event queue
      if (!self._loaded) {
        self.on('play', function() {
          self.mute(id);
        });

        return self;
      }

      var activeNode = (id) ? self._nodeById(id) : self._activeNode();
      if (activeNode) {
        if (self._webAudio) {
          activeNode.gain.value = 0;
        } else {
          activeNode.muted = true;
        }
      }

      return self;
    },

    /**
     * Unmute this sound.
     * @param  {String} id (optional) The play instance ID.
     * @return {Howl}
     */
    unmute: function(id) {
      var self = this;

      // if the sound hasn't been loaded, add it to the event queue
      if (!self._loaded) {
        self.on('play', function() {
          self.unmute(id);
        });

        return self;
      }

      var activeNode = (id) ? self._nodeById(id) : self._activeNode();
      if (activeNode) {
        if (self._webAudio) {
          activeNode.gain.value = self._volume;
        } else {
          activeNode.muted = false;
        }
      }

      return self;
    },

    /**
     * Get/set volume of this sound.
     * @param  {Float}  vol Volume from 0.0 to 1.0.
     * @param  {String} id  (optional) The play instance ID.
     * @return {Howl/Float}     Returns self or current volume.
     */
    volume: function(vol, id) {
      var self = this;

      // make sure volume is a number
      vol = parseFloat(vol);

      if (vol >= 0 && vol <= 1) {
        self._volume = vol;

        // if the sound hasn't been loaded, add it to the event queue
        if (!self._loaded) {
          self.on('play', function() {
            self.volume(vol, id);
          });

          return self;
        }

        var activeNode = (id) ? self._nodeById(id) : self._activeNode();
        if (activeNode) {
          if (self._webAudio) {
            activeNode.gain.value = vol;
          } else {
            activeNode.volume = vol * Howler.volume();
          }
        }

        return self;
      } else {
        return self._volume;
      }
    },

    /**
     * Get/set whether to loop the sound.
     * @param  {Boolean} loop To loop or not to loop, that is the question.
     * @return {Howl/Boolean}      Returns self or current looping value.
     */
    loop: function(loop) {
      var self = this;

      if (typeof loop === 'boolean') {
        self._loop = loop;

        return self;
      } else {
        return self._loop;
      }
    },

    /**
     * Get/set sound sprite definition.
     * @param  {Object} sprite Example: {spriteName: [offset, duration, loop]}
     *                @param {Integer} offset   Where to begin playback in milliseconds
     *                @param {Integer} duration How long to play in milliseconds
     *                @param {Boolean} loop     (optional) Set true to loop this sprite
     * @return {Howl}        Returns current sprite sheet or self.
     */
    sprite: function(sprite) {
      var self = this;

      if (typeof sprite === 'object') {
        self._sprite = sprite;

        return self;
      } else {
        return self._sprite;
      }
    },

    /**
     * Get/set the position of playback.
     * @param  {Float}  pos The position to move current playback to.
     * @param  {String} id  (optional) The play instance ID.
     * @return {Howl/Float}      Returns self or current playback position.
     */
    pos: function(pos, id) {
      var self = this;

      // if the sound hasn't been loaded, add it to the event queue
      if (!self._loaded) {
        self.on('load', function() {
          self.pos(pos);
        });

        return typeof pos === 'number' ? self : self._pos || 0;
      }

      // make sure we are dealing with a number for pos
      pos = parseFloat(pos);

      var activeNode = (id) ? self._nodeById(id) : self._activeNode();
      if (activeNode) {
        if (pos >= 0) {
          self.pause(id);
          activeNode._pos = pos;
          self.play(activeNode._sprite, id);

          return self;
        } else {
          return self._webAudio ? activeNode._pos + (ctx.currentTime - self._playStart) : activeNode.currentTime;
        }
      } else if (pos >= 0) {
        return self;
      } else {
        // find the first inactive node to return the pos for
        for (var i=0; i<self._audioNode.length; i++) {
          if (self._audioNode[i].paused && self._audioNode[i].readyState === 4) {
            return (self._webAudio) ? self._audioNode[i]._pos : self._audioNode[i].currentTime;
          }
        }
      }
    },

    /**
     * Get/set the 3D position of the audio source.
     * The most common usage is to set the 'x' position
     * to affect the left/right ear panning. Setting any value higher than
     * 1.0 will begin to decrease the volume of the sound as it moves further away.
     * NOTE: This only works with Web Audio API, HTML5 Audio playback
     * will not be affected.
     * @param  {Float}  x  The x-position of the playback from -1000.0 to 1000.0
     * @param  {Float}  y  The y-position of the playback from -1000.0 to 1000.0
     * @param  {Float}  z  The z-position of the playback from -1000.0 to 1000.0
     * @param  {String} id (optional) The play instance ID.
     * @return {Howl/Array}   Returns self or the current 3D position: [x, y, z]
     */
    pos3d: function(x, y, z, id) {
      var self = this;

      // set a default for the optional 'y' & 'z'
      y = (typeof y === 'undefined' || !y) ? 0 : y;
      z = (typeof z === 'undefined' || !z) ? -0.5 : z;

      // if the sound hasn't been loaded, add it to the event queue
      if (!self._loaded) {
        self.on('play', function() {
          self.pos3d(x, y, z, id);
        });

        return self;
      }

      if (x >= 0 || x < 0) {
        if (self._webAudio) {
          var activeNode = (id) ? self._nodeById(id) : self._activeNode();
          if (activeNode) {
            self._pos3d = [x, y, z];
            activeNode.panner.setPosition(x, y, z);
            activeNode.panner.panningModel = self._model || 'HRTF';
          }
        }
      } else {
        return self._pos3d;
      }

      return self;
    },

    /**
     * Fade a currently playing sound between two volumes.
     * @param  {Number}   from     The volume to fade from (0.0 to 1.0).
     * @param  {Number}   to       The volume to fade to (0.0 to 1.0).
     * @param  {Number}   len      Time in milliseconds to fade.
     * @param  {Function} callback (optional) Fired when the fade is complete.
     * @param  {String}   id       (optional) The play instance ID.
     * @return {Howl}
     */
    fade: function(from, to, len, callback, id) {
      var self = this,
        diff = Math.abs(from - to),
        dir = from > to ? 'down' : 'up',
        steps = diff / 0.01,
        stepTime = len / steps;

      // if the sound hasn't been loaded, add it to the event queue
      if (!self._loaded) {
        self.on('load', function() {
          self.fade(from, to, len, callback, id);
        });

        return self;
      }

      // set the volume to the start position
      self.volume(from, id);

      for (var i=1; i<=steps; i++) {
        (function() {
          var change = self._volume + (dir === 'up' ? 0.01 : -0.01) * i,
            vol = Math.round(1000 * change) / 1000,
            toVol = to;

          setTimeout(function() {
            self.volume(vol, id);

            if (vol === toVol) {
              if (callback) callback();
            }
          }, stepTime * i);
        })();
      }
    },

    /**
     * [DEPRECATED] Fade in the current sound.
     * @param  {Float}    to      Volume to fade to (0.0 to 1.0).
     * @param  {Number}   len     Time in milliseconds to fade.
     * @param  {Function} callback
     * @return {Howl}
     */
    fadeIn: function(to, len, callback) {
      return this.volume(0).play().fade(0, to, len, callback);
    },

    /**
     * [DEPRECATED] Fade out the current sound and pause when finished.
     * @param  {Float}    to       Volume to fade to (0.0 to 1.0).
     * @param  {Number}   len      Time in milliseconds to fade.
     * @param  {Function} callback
     * @param  {String}   id       (optional) The play instance ID.
     * @return {Howl}
     */
    fadeOut: function(to, len, callback, id) {
      var self = this;

      return self.fade(self._volume, to, len, function() {
        if (callback) callback();
        self.pause(id);

        // fire ended event
        self.on('end');
      }, id);
    },

    /**
     * Get an audio node by ID.
     * @return {Howl} Audio node.
     */
    _nodeById: function(id) {
      var self = this,
        node = self._audioNode[0];

      // find the node with this ID
      for (var i=0; i<self._audioNode.length; i++) {
        if (self._audioNode[i].id === id) {
          node = self._audioNode[i];
          break;
        }
      }

      return node;
    },

    /**
     * Get the first active audio node.
     * @return {Howl} Audio node.
     */
    _activeNode: function() {
      var self = this,
        node = null;

      // find the first playing node
      for (var i=0; i<self._audioNode.length; i++) {
        if (!self._audioNode[i].paused) {
          node = self._audioNode[i];
          break;
        }
      }

      // remove excess inactive nodes
      self._drainPool();

      return node;
    },

    /**
     * Get the first inactive audio node.
     * If there is none, create a new one and add it to the pool.
     * @param  {Function} callback Function to call when the audio node is ready.
     */
    _inactiveNode: function(callback) {
      var self = this,
        node = null;

      // find first inactive node to recycle
      for (var i=0; i<self._audioNode.length; i++) {
        if (self._audioNode[i].paused && self._audioNode[i].readyState === 4) {
          // send the node back for use by the new play instance
          callback(self._audioNode[i]);
          node = true;
          break;
        }
      }

      // remove excess inactive nodes
      self._drainPool();

      if (node) {
        return;
      }

      // create new node if there are no inactives
      var newNode;
      if (self._webAudio) {
        newNode = self._setupAudioNode();
        callback(newNode);
      } else {
        self.load();
        newNode = self._audioNode[self._audioNode.length - 1];

        // listen for the correct load event and fire the callback
        var listenerEvent = navigator.isCocoonJS ? 'canplaythrough' : 'loadedmetadata';
        var listener = function() {
          newNode.removeEventListener(listenerEvent, listener, false);
          callback(newNode);
        };
        newNode.addEventListener(listenerEvent, listener, false);
      }
    },

    /**
     * If there are more than 5 inactive audio nodes in the pool, clear out the rest.
     */
    _drainPool: function() {
      var self = this,
        inactive = 0,
        i;

      // count the number of inactive nodes
      for (i=0; i<self._audioNode.length; i++) {
        if (self._audioNode[i].paused) {
          inactive++;
        }
      }

      // remove excess inactive nodes
      for (i=self._audioNode.length-1; i>=0; i--) {
        if (inactive <= 5) {
          break;
        }

        if (self._audioNode[i].paused) {
          // disconnect the audio source if using Web Audio
          if (self._webAudio) {
            self._audioNode[i].disconnect(0);
          }

          inactive--;
          self._audioNode.splice(i, 1);
        }
      }
    },

    /**
     * Clear 'onend' timeout before it ends.
     * @param  {String} soundId  The play instance ID.
     */
    _clearEndTimer: function(soundId) {
      var self = this,
        index = -1;

      // loop through the timers to find the one associated with this sound
      for (var i=0; i<self._onendTimer.length; i++) {
        if (self._onendTimer[i].id === soundId) {
          index = i;
          break;
        }
      }

      var timer = self._onendTimer[index];
      if (timer) {
        clearTimeout(timer.timer);
        self._onendTimer.splice(index, 1);
      }
    },

    /**
     * Setup the gain node and panner for a Web Audio instance.
     * @return {Object} The new audio node.
     */
    _setupAudioNode: function() {
      var self = this,
        node = self._audioNode,
        index = self._audioNode.length;

      // create gain node
      node[index] = (typeof ctx.createGain === 'undefined') ? ctx.createGainNode() : ctx.createGain();
      node[index].gain.value = self._volume;
      node[index].paused = true;
      node[index]._pos = 0;
      node[index].readyState = 4;
      node[index].connect(masterGain);

      // create the panner
      node[index].panner = ctx.createPanner();
      node[index].panner.panningModel = self._model || 'equalpower';
      node[index].panner.setPosition(self._pos3d[0], self._pos3d[1], self._pos3d[2]);
      node[index].panner.connect(node[index]);

      return node[index];
    },

    /**
     * Call/set custom events.
     * @param  {String}   event Event type.
     * @param  {Function} fn    Function to call.
     * @return {Howl}
     */
    on: function(event, fn) {
      var self = this,
        events = self['_on' + event];

      if (typeof fn === 'function') {
        events.push(fn);
      } else {
        for (var i=0; i<events.length; i++) {
          if (fn) {
            events[i].call(self, fn);
          } else {
            events[i].call(self);
          }
        }
      }

      return self;
    },

    /**
     * Remove a custom event.
     * @param  {String}   event Event type.
     * @param  {Function} fn    Listener to remove.
     * @return {Howl}
     */
    off: function(event, fn) {
      var self = this,
        events = self['_on' + event];

      if (fn) {
        // loop through functions in the event for comparison
        for (var i=0; i<events.length; i++) {
          if (fn === events[i]) {
            events.splice(i, 1);
            break;
          }
        }
      } else {
        self['_on' + event] = [];
      }

      return self;
    },

    /**
     * Unload and destroy the current Howl object.
     * This will immediately stop all play instances attached to this sound.
     */
    unload: function() {
      var self = this;

      // stop playing any active nodes
      var nodes = self._audioNode;
      for (var i=0; i<self._audioNode.length; i++) {
        // stop the sound if it is currently playing
        if (!nodes[i].paused) {
          self.stop(nodes[i].id);
          self.on('end', nodes[i].id);
        }

        if (!self._webAudio) {
          // remove the source if using HTML5 Audio
          nodes[i].src = '';
        } else {
          // disconnect the output from the master gain
          nodes[i].disconnect(0);
        }
      }

      // make sure all timeouts are cleared
      for (i=0; i<self._onendTimer.length; i++) {
        clearTimeout(self._onendTimer[i].timer);
      }

      // remove the reference in the global Howler object
      var index = Howler._howls.indexOf(self);
      if (index !== null && index >= 0) {
        Howler._howls.splice(index, 1);
      }

      // delete this sound from the cache
      delete cache[self._src];
      self = null;
    }

  };

  // only define these functions when using WebAudio
  if (usingWebAudio) {

    /**
     * Buffer a sound from URL (or from cache) and decode to audio source (Web Audio API).
     * @param  {Object} obj The Howl object for the sound to load.
     * @param  {String} url The path to the sound file.
     */
    var loadBuffer = function(obj, url) {
      // check if the buffer has already been cached
      if (url in cache) {
        // set the duration from the cache
        obj._duration = cache[url].duration;

        // load the sound into this object
        loadSound(obj);
        return;
      }
      
      if (/^data:[^;]+;base64,/.test(url)) {
        // Decode base64 data-URIs because some browsers cannot load data-URIs with XMLHttpRequest.
        var data = atob(url.split(',')[1]);
        var dataView = new Uint8Array(data.length);
        for (var i=0; i<data.length; ++i) {
          dataView[i] = data.charCodeAt(i);
        }
        
        decodeAudioData(dataView.buffer, obj, url);
      } else {
        // load the buffer from the URL
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function() {
          decodeAudioData(xhr.response, obj, url);
        };
        xhr.onerror = function() {
          // if there is an error, switch the sound to HTML Audio
          if (obj._webAudio) {
            obj._buffer = true;
            obj._webAudio = false;
            obj._audioNode = [];
            delete obj._gainNode;
            delete cache[url];
            obj.load();
          }
        };
        try {
          xhr.send();
        } catch (e) {
          xhr.onerror();
        }
      }
    };

    /**
     * Decode audio data from an array buffer.
     * @param  {ArrayBuffer} arraybuffer The audio data.
     * @param  {Object} obj The Howl object for the sound to load.
     * @param  {String} url The path to the sound file.
     */
    var decodeAudioData = function(arraybuffer, obj, url) {
      // decode the buffer into an audio source
      ctx.decodeAudioData(
        arraybuffer,
        function(buffer) {
          if (buffer) {
            cache[url] = buffer;
            loadSound(obj, buffer);
          }
        },
        function(err) {
          obj.on('loaderror', err);
        }
      );
    };

    /**
     * Finishes loading the Web Audio API sound and fires the loaded event
     * @param  {Object}  obj    The Howl object for the sound to load.
     * @param  {Objecct} buffer The decoded buffer sound source.
     */
    var loadSound = function(obj, buffer) {
      // set the duration
      obj._duration = (buffer) ? buffer.duration : obj._duration;

      // setup a sprite if none is defined
      if (Object.getOwnPropertyNames(obj._sprite).length === 0) {
        obj._sprite = {_default: [0, obj._duration * 1000]};
      }

      // fire the loaded event
      if (!obj._loaded) {
        obj._loaded = true;
        obj.on('load');
      }

      if (obj._autoplay) {
        obj.play();
      }
    };

    /**
     * Load the sound back into the buffer source.
     * @param  {Object} obj   The sound to load.
     * @param  {Array}  loop  Loop boolean, pos, and duration.
     * @param  {String} id    (optional) The play instance ID.
     */
    var refreshBuffer = function(obj, loop, id) {
      // determine which node to connect to
      var node = obj._nodeById(id);

      // setup the buffer source for playback
      node.bufferSource = ctx.createBufferSource();
      node.bufferSource.buffer = cache[obj._src];
      node.bufferSource.connect(node.panner);
      node.bufferSource.loop = loop[0];
      if (loop[0]) {
        node.bufferSource.loopStart = loop[1];
        node.bufferSource.loopEnd = loop[1] + loop[2];
      }
      node.bufferSource.playbackRate.value = obj._rate;
    };

  }

  /**
   * Add support for AMD (Asynchronous Module Definition) libraries such as require.js.
   */
  if (typeof define === 'function' && define.amd) {
    define(function() {
      return {
        Howler: Howler,
        Howl: Howl
      };
    });
  }

  /**
   * Add support for CommonJS libraries such as browserify.
   */
  if (typeof exports !== 'undefined') {
    exports.Howler = Howler;
    exports.Howl = Howl;
  }

  // define globally in case AMD is not available or available but not used

  if (typeof window !== 'undefined') {
    window.Howler = Howler;
    window.Howl = Howl;
  }

})();

var jas = {};
(function (jas) {
  
  function isFunction (fn) {
    if (typeof(fn) == "function")
      return true;
    
    false; 
  
  }
  
  function timerFactory(interval, isRandom) {
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
    
    function getInterval () {
      return interval;
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
        if (isRandom) {
          setTimer(originalInterval);  
        }
        if (typeof(itsTime) == "function") {
          then = now;
          return itsTime(now);
        }
        return true;
      }
      else {
        //console.log(getTime());
        if (typeof(notTime) == "function") {
          return notTime(now - then);
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
      getInterval: getInterval,
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
  
  function graphFactory () {
    // factory that graphs lines and points on lines
    
    var classes = {
      constant: function (y) {
        return function (x) {
          return y; // lol
        };
      },
      linear: function (m, b) {
        return function (x) {
          return m*x + b;
        };
      },
      exponential: function (b) {
        return function(x) {
          return x * x + b;
        };
      },
      quadratic: function (a, b, c) {
        return function (x) {
          return (a * x * x) + (b * x) + c;
        };
      },
      logarithmic: function (x) {
        return function (x) {
          
        };
      }
    };
    
    function inst (type, mutator) {
      if (typeof(classes[type]) == 'function') {
        return classes[type](mutator);
      }
      else {
        return false;
      }
    }
  
    function newClass (type, callback) {
      if (typeof(callback) == "function") {
        classes[type] = callback;
      }
    }
    
    return {
      inst: inst,
      newClass: newClass
    }
  }
  
  var Graph = graphFactory();
  
  
  
  jas.Util = {
    isFunction: isFunction,
    timer: timerFactory,
    finiteStateMachine: finiteStateMachine,
    Graph: Graph
  };
})(jas);
(function (jas) {
  var publications = {};
  var subscriberAutoId = 0;
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
        subscribers[subId] = undefined;
        delete subscribers[subId];
      }
    }
  }
  
  jas.Event = {
    addPublication: function (pubId) {
      //console.log(name);
      publications[pubId] = publication();
    },
    remPublication: function (pubId) {
      publications[pubId] = undefined;
      delete publications[pubId];
    },
    subscribe: function (pubId, subId, callback) {
      var name;
      if (arguments.length > 2) {
        name = subId;
        publications[pubId].addSubscriber(name, callback);
      }
      else if (typeof(subId) == "function") {
        name = subId.name? subId.name: "sub-" + subscriberAutoId ++;
        callback = subId;
        publications[pubId].addSubscriber(name, callback);
      }
      console.log(name);
      // return subscriber
      return {
        unsubscribe: function () {
          console.log(name);
          publications[pubId].removeSubscriber(name);
        },
        resubscribe: function () {
          publications[pubId].addSubscriber(name, callback);
        }
      };
    },
    unsubscribe: function (pubId, subId) {
      publications[pubId].removeSubscriber(subId);
    },
    publish: function (pubId, payload) {
      publications[pubId].publish(payload);
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
  
  var imageRoot = "";
  var audioRoot = "";
  var mapRoot = "";
  
  
  
  function configure(mutator) {
    imageRoot = mutator.imageRoot;
    audioRoot = mutator.audioRoot;
    mapRoot = mutator.mapRoot;
  }
  
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
    
    request.open("get", mapRoot + path, true);
    
    request.send();
    
      
  }
  
  function newImageFromCanvas (name, path, userCallback) {
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
      //console.log(e);
    };
  
    image.src = imageRoot + path;
  
  }
  
  function getImage (name) {
    return assets.images[name] || false;
  }
  
  function imageReady (name) {
    return assets.images[name]? true: false;
  }

  function newAudio(name, path, userCallback) {
    assets.audio[name] = false;
    userCallback = typeof(userCallback) == 'function'? userCallback: function () {};
    var audio = new Howl ({
      urls: [audioRoot+path],
      onload: function () {
        userCallback(this);
        assets.audio[name] = this;
      }
    });
  }
  
  function getAudio (name, callback) {
    var audio = assets.audio[name];
    //console.log(audio);
    if (typeof(callback)=='function' && audio) {
      callback(audio);
      return audio;
    }
    
    return false;
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
    configure: configure,
    newImage: newImage,
    newImageFromCanvas: newImageFromCanvas,
    newAudio: newAudio,
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
  
  var isFunction = jas.Util.isFunction;
  
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
      var color = mutator.color || '#fff';
      var alpha = mutator.alpha != undefined? mutator.alpha: null;
      
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
        var v4 = vector.y < instance.y + instance.h;
        
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
      var instance = classes[mutator.shape] ? classes[mutator.shape](mutator): classes.rect(mutator);
      instance.shape = mutator.shape || 'rect';
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
          for (var i = 0; i < layer.length; i ++) {
            callback(layer[i]);
          }
        }
        else
        {
          return layer;
        }
      }
      
      instance.addLayers = function (layerMutator) {
        for (var i in layerMutator) {
          instance.addLayer(i, layerMutator[i]);
        }
      }
      
      instance.addLayer = function (layerId, arr) {
        console.log(layerId, arr);
        var layer = arr || []
        layers[layerId] = layer;
      }
      
      instance.pushToLayer = function (layerId, entity) {
        var layer = layers[layerId];
        layer.push(entity);
      };
      
      instance.orderLayers = function () {
        
      };

      instance.getDraw = function () {
        //console.log(instance.layers);
        
        return {
          type: "complex",
          layers: layers
        };
      }
      
      return instance;
      
    },
    sprite : function (mutator) {
      // sprites support layers, so they are composite
      var instance = this.composite(mutator);
      
      // inner factory
      function animationFactory(animMutator) {
        
        // inner frame factory
        function frame (sx, sy, sw, sh) {
          
          return {
            sx: sx,
            sy: sy,
            sw: sw,
            sh: sh
          };
          
        }
        
        // mutator for animation, separate from sprite mutator
        animMutator = animMutator? animMutator: {};
        
        var animation = {};
        
        // animations have names
        animation.name = animMutator.name;
        
        // frames are determined using modular arithmetic
        // based on the sprite sheet size. It's not possible
        // to 'skip' frames in the sheet.
        // frame from sprite sheet where animation starts
        var start = animMutator.start;
        // frame on the sheet where the animation stops
        var stop = animMutator.stop;
        // width of the animation
        var w = instance.w;
        var h = instance.h;
        
        // does it loop? no by default
        var looping = animMutator.looping? animMutator.looping: false;
        // does it play forwards, and then backwards? no by default
        var pingpong = animMutator.pingpong? animMutator.pingpong: false;
        var fps = animMutator.fps? animMutator.fps: 12;
        // frames for the animation
        var frames = [];
        
        // iterate from the start value, up to stop value exclusive
        for ( var i = start; i < stop; i++) {
          // using modular arithmetic to find the x of sub image 
          var x = (i * w) % imageW;
          // using division to find the y value of sub image
          var y = Math.floor((i * w) / imageW) * h;
          // create a frame (sub image) with the x y.
          frames.push(frame(x, y, w, h));
        }
        
        // set default (ending) frame, set by user. default to last frame
        var defaultFrame = animMutator.defaultFrame || frames.length - 1;
        
        // callback when animation is over
        var onenterframe = animMutator.onenterframe;
        var onend = animMutator.onend;
        
        //console.log(stop);
        var currentFrame = 0;
        var done = false;

        var timer = jas.Util.timer(1000/fps, false);
        timer.start();

        animation.update = function () {
          
          if (done) {
            return; 
          }
          
          // if it's time to change the frame...
          timer.checkTime(function() {
            
            // increment the frame
            var lastFrame = ++currentFrame >= frames.length;
            
            // calls onenterframe only if it is set
            onenterframe && onenterframe(currentFrame);
            
            if (lastFrame && looping) {
              currentFrame = 0;
            }
            
            else if (lastFrame) {
              currentFrame = defaultFrame || frames.length - 1;
              // only call onend if it exists
              onend && onend();
              
              done = true
            }
          });
        };
        
        // get current frame
        animation.getCurrentFrame = function () {
          return frames[currentFrame];
        };
        
        // reset animation
        animation.reset = function() {
          currentFrame = 0;
          done = false;
        };
        
        // is it the default animation?
        if (animMutator.def) {
          instance.anim = animation;
        }
        
        return animation;
        
      }
      // end animation class
      
      // sprite sheet used for sprite
      var imageId = mutator? mutator.imageId: null;
      
      // sprite sheet width and height
      var imageW = jas.Asset.getImage(imageId).width;
      var imageH = jas.Asset.getImage(imageId).height;
      
      // sprites animation
      instance.animations = {};
      
      // if there are no animations in the mutator, use a still image
      mutator.animations = mutator.animations || [{name:"still", start: 0, stop: 1, def: true}];
      
      // build animations using each mutator
      for (var i in mutator.animations) {
        var animData = mutator.animations[i];
        instance.animations[animData.name] = animationFactory(animData);
      }
      
      // sets the default animation
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
          instance.animations[animId].reset();
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
      var active = mutator.active || false;
      
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
      
      instance.spawn = function () {
        if (spawnCount < spawnMax && active) {
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
      };
      
      instance.start = function () {
        active = true;
      };
      
      instance.stop = function () {
        active = false;
      }
      
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
      
      instance.clear = function () {
        for (var i in spawnIds) {
          var id = spawnIds[i];
          instance.removeSpawnById(id);
        }
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
      var instance = this.composite(mutator);
      
      var tileMutators = {};
      
      var tileW = mutator.tileW,
          tileH = mutator.tileH,
          imageId = mutator.imageId;
      
      instance.configureTile = function (tileId, mutatorFunction) {
        tileMutators[tileId] = mutatorFunction;
      };
      
      instance.makeTiles = function () {
        for (var i in mutator.layers) {
          var layer = [];

          
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
            layer.push(tile);
          }
          instance.addLayer(mutator.layers[i].name, layer);
          
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
    
    jas.Event.addPublication("MOUSE_IS_PRESSED");
    jas.Event.addPublication("MOUSE_IS_DOWN");
    jas.Event.addPublication("MOUSE_IS_UP");
    jas.Event.addPublication("MOUSE_IS_CLICKED");
    
    // time between down and up to be a 'click'
    var clickDef = 100;
    // timeout for click
    var clickTimeout;
    var clickTime;
    
    canvas.addEventListener('mousedown', function (e) {
      clickTime = Date.now();
      
      jas.Event.publish("MOUSE_IS_DOWN", e);
      
      
    }, false);
    
    canvas.addEventListener('mouseup', function (e) {
      var upTime = Date.now();
      
      if (controller.mousedown) {
        delete controller.mousedown;
        jas.Event.publish("MOUSE_IS_UP", e);
      }
      
      controller.mouseup = true;

      delete controller.mouseup;
      
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
      jas.Event.addPublication(i + "_IS_PRESSED");
      jas.Event.addPublication(i + "_IS_DOWN");
      jas.Event.addPublication(i + "_IS_UP");
    }
    
    function addKey (e) {
      var key = keysByNum[e.keyCode];
      
      if (!keys[e.keyCode]) {
        jas.Event.publish(key + "_IS_PRESSED");
      }
      
      keys[e.keyCode] = true;
    }
  
    function removeKey(e) {
      delete keys[e.keyCode];
      var key = keysByNum[e.keyCode];
      jas.Event.publish(key+ "_IS_UP");
    }
    
    
    window.addEventListener('keydown', addKey, false);
    
    window.addEventListener('keyup', removeKey, false);
    
    function isKeyDown (key) {
      var isIt = keys[keyCodes[key]];
      if (isIt) {
        jas.Event.publish(keysByNum[keyCodes[key]] + "_IS_DOWN");
      }
      return  isIt ? true: false;
    }
    
    
    // master controller public api
    var controller = {
      isKeyDown: isKeyDown,
      areKeysDown: function (keyArr) {
        for (var i in keyArr) {
          var key = keyArr[i];
          isKeyDown(key)
        }
      },
      areAllKeysDown: function (keyArr, callback) {
        for (var i in keyArr) {
          var key = keyArr[i];
          if (!isKeyDown(key)) {
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
      subscriptions = {};
      
      instance.id = controllerAutoId++;
      function subscribeAll () {
        // add subscribers to master controllers publications
        for (var pub in mutator) {
          var subscription = jas.Event.subscribe(pub, mutator[pub]);
          subscriptions["jas-controller-" + pub] = subscription;
        }
      }
      
      subscribeAll();
      
      instance.kill = function () {
        for (var i in subscriptions) {
          var subscription = subscriptions[i];
          subscription.unsubscribe();
        }
      };
      
      instance.revive = function () {
        for (var i in subscriptions) {
          var subscription = subscriptions[i];
          subscription.resubscribe();
        }
      };
      
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
        iterateDrawGroup(layer);
      }
    }
    
    function renderGroup (groupId) {
      var group = jas.Entity.getGroup(groupId);
      iterateDrawGroup(group);
    }
    
    function renderGroupLayer (groupId, layerId) {
      jas.Entity.getGroup(groupId, function (instance) {
        iterateDrawGroup(instance.getLayer(layerId));
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
    
    function getScreenImage (imageId, callback) {
      var url = canvas.toDataURL();
      jas.Asset.newImage(imageId, url, callback);
    }
    
    function getScreenDimensions () {
      return {
        w: canvas.width,
        h: canvas.height
      };
    }
    
    jas.Graphics = {
      getScreenImage: getScreenImage,
      getScreenDimensions: getScreenDimensions
    };
    
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

(function (jas) {
  
  var physicsAutoId = 0;
  
  var DIRS = {
    UP: -1,
    RIGHT: 1,
    DOWN: 1,
    LEFT: -1
  };

  var classes = {
    // simple vector updates a value constantly
    // e.g. gravity, hitting a wall in most games
    core: function (mutator) {
      mutator = mutator || {};
      var instance = {};
      
      var update;
      
      instance.bind = function (entity) {
        // all physics just modify some numeric property
        // could in theory be torque, heat. most commonly x, y.
        update = function (prop, val) {
          entity[prop] += val;
        }
        instance.update = update;
      };
      
      
      
      return instance;
    },
    orthogonal: function (mutator) {
      // zelda-like physics
      var dirX = 0,
          dirY = 0;
          
      var instance = classes.core(mutator);
      instance.resetDirs = function () {
        dirX = 0;
        dirY = 0;
      }
      
      instance.resetDirX = function () {
        dirX = 0;
      }
      
      instance.resetDirY = function () {
        dirY = 0;
      }
      
      instance.up = function (val) {
        dirY = DIRS.UP;
        instance.update("y", -val);
      };
      instance.right = function (val) {
        dirX = DIRS.RIGHT;
        instance.update("x", val);
      };
      instance.down = function (val) {
        dirY = DIRS.DOWN;
        instance.update("y", val);
      };
      instance.left = function (val) {
        dirX = DIRS.LEFT;
        instance.update("x", -val);
      };
      instance.collide = function (val) {
        if (dirY == DIRS.UP ) {
          instance.update("y", val);
        }
        else if (dirY == DIRS.DOWN) {
          instance.update("y", -val);
        }
        
        if (dirX == DIRS.RIGHT) {
          instance.update("x", -val);
        }
        else if (dirX == DIRS.LEFT) {
          instance.update("x", val);
        } 
      }
      return instance;
    },
    radial: function (mutator) {
    // pinball-like physics
      var instance = classes.core(mutator);
      
      var xVel, yVel = 0;
      var lastX, lastY;
      
      instance.move = function (deg, val) {
        // todo, do some trig to get x and y differences
        
        
        instance.update('x', xVal);
        instance.update('y', yVal);
      };
      
      instance.collide = function (val) {
        
      }
      
      instance.gravity = function (val) {
        instance.update("y", val);
      }
    },
    platformer: function (mutator) {
    // mario-like physics
      mutator = mutator || {};
      
      var instance = classes.core();
      instance.left = function () {
        instance.update("x", -val);
      };
      instance.right = function () {
        instance.update("x", val);
      };
      instance.collide = function () {
        // logic for landing ontop of things
        
        // logic for left and right collision
      };
      instance.jump = function (rad, val) {

      };
      instance.gravity = function (val) {
        instance.update("y", val);
      };
      
      return instance;
    }
  }
  
  function inst (type, mutator) {
    if (typeof(classes[type]) == 'function') {
      return classes[type](mutator);
    }
    else {
      return false;
    }
  }

  function newClass (type, callback) {
    if (typeof(callback) == "function") {
      classes[type] = callback;
    }
  }
  
  jas.Physics = {
    inst: inst,
    newClass: newClass
  }

})(jas);
