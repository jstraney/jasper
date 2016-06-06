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