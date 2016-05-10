## Synopsis

Jasper arcade is an arcade game framework for the web! It strives to
be intuitive and modular. Jasper a framework that:

<ul>
  <li> Is a client side game solution for modern browsers</li>
  <li> Is helpful, but will not smother you </li>
  <li> Wants you to focus on game logic </li>
</ul>

## Get Started
First thing is to download Japser and link to the javascript file in
your webpage. In this repository, use the copy under "dist".

```html
<html>
  <head>
    <!-- Be sure to include the game framework -->
    <script src = "jasper.js"></script>
    <!-- then add your code that uses jasper-->
    <script src = "myGame.js"></script>
  </head>
  <body>
    <!-- Add a div with whatever id you'd like to use as your frame -->
    <div id = "game-frame"></div>
  </body>
</html>
```
Using the above example, you have a file of your own called
"myGame.js" that uses Jasper. Here's what might go into that file to create.
a basic screen.

```js
// A game can be your main menu, game over screen, or the part where you
// play. Be sure to include at least one.

jas.addState("main",
  //  you don't have to name these functions 'init', 'update' or 'render'
  // this is just to provide clarity
  function init () {
    // Initialize entities, resources here.
  },
  function update () {
    // Game "logic" for this game state goes here
  },
  function render (graphics) {
    graphics.fillScreen("#088");
  }
);

// Now you initialize the game. Every game state you've added will be
// initialized now. This will look for the div with id "game-frame"

jas.init("game-frame");

// This starts the update and render loop of the main game state
jas.begin();
```

Jasper uses the namespace "jas". Within that space, there are various
tools that extend jaspers functionality. Once you've made a game frame,
you'll probably want to add stuff to it. I'm going to defer using jaspers sprite
sprite class to make this a simple intro:

```js
// add this to your main game state's init function
jas.addState("main",
  function init () {
    jas.Entity.addEntity(jas.Entity.inst("rect", {
      x: 32,
      y:32, 
      w: 32, 
      h:32, 
      color: "#00f"}),
    "playerGroup");
  },
  function update (delta, controller) {
    var player;
    
    if (player = jas.Entity.getFirst("playerGroup") {
      controller.keyIsDown("RIGHT", function () {
        player.x++;
      });
    }
  },
  function render (graphics) {
    graphics.renderGroup("playerGroup");
  });
```

Now, you should have a blue rectangle that can move right when the arrow key is pressed.
Think of an entity as the 'stuff' in your games frame. An entity could be a player, a wall,
a gui component, a clipping area for collision. It's a game object.

Entities are manipulated through groups. a group can contain entities of various classes, but it's recommended they share an interface and purpose ('rect' is an entity class). If you
think rectangles are repulsive, you can make it a special rectangle:

```js
//add this to game state's init
jas.Entity.newClass("player", function(mutator) {
  mutator = mutator || {}; // recommended
  var instance = this.rect(mutator);
  instance.saySomething = function () {
    
  }
});
```

## License

Jasper is under the MIT License. Feel free to use it, but give
credit to its creator and hold us harmless.
