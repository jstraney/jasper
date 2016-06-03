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