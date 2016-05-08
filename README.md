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

'''
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
'''
Using the above example, you have a file of your own called
"myGame.js" that uses Jasper. Here's what might go into that file.

'''
// A game be your main menu, game over screen, or the part where you
// play. Be sure to include at least one.

jas.addState("main",
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
'''

Jasper uses the namespace "jas". Within that space, there are various
tools that extend jaspers functionality. Here is how you would create
a simple game frame:

'''


'''


## License

Jasper is under the MIT License. Feel free to use it, but give
credit to its creator and hold us harmless.
