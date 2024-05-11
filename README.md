# maze-game
Simple JavaScript maze game

![maze-game](https://github.com/davidbarone/maze-game/blob/main/images/maze-game.png?raw=true)

This article was borne out of an itch I got whilst playing on a few online maze generation web sites. The itch grew into the following challenges:
- How to generate a 2-dimensional maze
- How to solve a maze (find the correct / shortest path through a maze)
- Gamify the solution to make it more fun.

## Generating a 2d Maze
The first step was to do some basic research on maze types. It happens that there are a number of types of mazes and ways of classifying them. This article (https://www.astrolog.org/labyrnth/algrithm.htm) explains them well. One basic way of classification is dense/perfect mazes vs sparse mazes. A dense maze is one where there is only 1 correct solution. There are no loops, and generally there is a single path to get to any other part of the maze. These are the easiest to construct. A sparse maze may have various redundant paths and more 'open' corridors. Sparse mazes are often the ones found in labyrinth games. For my exercise, I decided to go with the 'perfect / dense' maze generation.

The recursive back-tracker algorithm is a simple algorithm to generate perfect mazes. There is a good explanation of this on http://en.wikipedia.org/wiki/Maze_generation_algorithm, and it's pretty simple to follow. Basically, the algorithm goes as follows:

- Pick a random cell
- Push cell onto stack
- Pop a cell from stack. If the stack is empty, we're done.
- Process cell:
- Mark current cell as visited and get all candidate neighbours. A candidate neighbour is one which has not yet been visited in the generation process
  - If no candidate neighbours, goto #3
  - If > 1 candidate neighbour, Push current cell onto stack
  - Select 1 random candidate neighbour
  - Remove wall between random candidate neighbour and current cell
  - Make the random candidate the new current cell and goto 4

## Solving the maze
Generating a maze is only half the problem. It would be nice to solve it as well. A simple and efficient algorithm for doing this is the Bellman Flooding Algorithm. The algorithm basically works by starting at the finish and working back, accessing all squares (hence the 'flood' part). The finish square is assigned a distance from the finish of '0'. As the algorithm moves back, each square is assigned it's distance from the target. Once all squares have been traversed, finding the shortest route is a simple matter of beginning at the start square and taking each subsequent cell with the lowest distance from target value.

## Gamification
Having built the components to generate and solve a maze, I then decided to turn this into a simple game. The basic premise of the game is that you must navigate through the maze to find the key before the monsters get you. The graphics are all simple 8-bit game style, 32x32 sprites. I've put them all into a single sprite sheet. The ground tiles I created myself. These are used to draw the maze. The character sprites were taken from https://opengameart.org/. The Player #1 graphic comes from https://opengameart.org/content/tiny-characters-set and the monsters come from the 'conjurer' set from https://opengameart.org/content/more-nes-style-rpg-characters. My sprite sheet can be found at: https://api.dbarone.com/resources/name/maze-sprites-32.png.

For the soundtrack, I found a nice site for creating simple background music: https://www.beepbox.co/ This site lets you create some simple instrumental music. It has a really cool feature of being able to save work via the Url. I created a simple file 'twinkle.mp3', accessible with the following Url:

https://www.beepbox.co/#9n31s6k0l00e03t2ma7g0fj07r1i0o432T0v1u10f0qg01d04w2h0E0T8v1u9cf20m80n2q0x11c21d25x513W6E1c06T5v1u88f0q0x10r81d35HKT-DRJABBBszrrh2E1b2T2v1u15f10w4qw02d03w0E0b4zc0000000000000000000000000000000000000000p21xIQv5aaFmFGPaqFOCE7am6BzFGTatFWCIzyDqvFGgODqvFGhoqqFoaqAvFGDWqRAyyGsFGIzElFnFGgOSGfFGhoqqFoaq00000

The mp3 file is fetched using a AJAX GET request. The response is then decoded and played via the AudioContext object on start-up of the game.

The Game class controls the overall game. The start() function starts the game proper. The game loop is performed by a call to window.requestAnimationFrame(). The loop is set at 60ms. This is enough to make the game seem smooth enough.

The event loop performs screen updates of all the sprites, as well as processing user input, and calculating the movement of the monsters. All the redraws are done by the preRender() and render() methods on the Sprite class. To play the game, use the WSAD keys. To 'solve' the maze (i.e. to cheat and get shown the solution), click on the space key. All the sprites will temporarily stop moving. To carry on the game, press the space key a second time.

The game ends either when you get to the key or one of the monsters gets you. At which point, the game starts all over again.

Given I've not optimised the code at all, I'm pretty surprised at just how fast JavaScript runs these days. All the state calculations and sprite updates all seem to happily fit into the 60ms animation window.

## Debugging
To run the game in VSCode, simple open the folder using `code .`, then type in `start ./src/index.html` from the command prompt.

Hope you enjoy!