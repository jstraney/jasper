(function (jas) {
  function graphicsFactory (canvas, ctx) {
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
    
    function renderMapLayer (mapId, layer) {
      var map = jas.Entity.getMap(mapId);
      
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
    }
    
    function renderGroup (groupId) {
      var group = jas.Entity.getGroup(groupId);
      
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
    }
    
    function fillScreen (color, alpha) {
      ctx.fillStyle = color ? color: "#f0f";
      ctx.globalAlpha = alpha ? alpha: 1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    return {
      renderMapLayer: renderMapLayer ,
      renderGroup: renderGroup,
      fillScreen: fillScreen 
    }
  };
  
  jas.graphicsFactory = graphicsFactory;
  
})(jas);