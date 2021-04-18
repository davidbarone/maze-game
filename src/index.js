const Directions = ["UP", "RIGHT", "DOWN", "LEFT"]; // OR TOP/RIGHT/BOTTOM/LEFT OR NORTH/EAST/SOUTH/WEST
const CellBorder = ["GAP", "WALL", "BOUNDARY"];

// 2-d structure, represented as (x,y)
// Note that (0,0) is TOP LEFT corner and (n,n) is BOTTOM RIGHT corner
// This is opposite to usual maths coordinates, but matches the way
// that the HTML canvas coordinate system works.
class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  Equals(vector) {
    return this.x === vector.x && this.y === vector.y;
  }

  Neighbor(direction) {
    let neighbor = new Vector(this.x, this.y);
    switch (direction) {
      case "UP":
        neighbor.y--;
        break;
      case "DOWN":
        neighbor.y++;
        break;
      case "LEFT":
        neighbor.x--;
        break;
      case "RIGHT":
        neighbor.x++;
        break;
    }
    return neighbor;
  }
}

class Cell {
  constructor(maze, vector) {
    this.maze = maze;
    this.vector = vector;
    this.visited = false;
    this.borders = {}; // Key = Direction. Value = Cell Border Style
  }

  ToString() {
    return `x: ${this.vector.x} y: ${this.vector.y}`;
  }

  // Returns the neighbor cell to the current cell, or NULL if no neighbor exists.
  Neighbor(direction) {
    return this.borders[direction] !== "BOUNDARY"
      ? this.maze.GetCellAtVector(this.vector.Neighbor(direction))
      : null;
  }

  // Returns the neighbors for a cell, together with the relative direction.
  Neighbors() {
    let that = this;
    const neighbors = Directions.map((d) => ({
      Direction: d,
      Cell: that.Neighbor(d),
    })).filter((d) => d.Cell);
    return neighbors;
  }

  RelationTo(cell) {
    return this.Neighbors()
      .filter((d) => d.Cell.Neighbor(d).vector.Equals(cell.vector))
      .map((d) => d.Direction)[0];
  }

  AccessibleNeighbors() {
    const neighbors = Directions.map((d) => ({
      Direction: d,
      Cell: this.Neighbor(d),
    }))
      .filter((d) => d.Cell && this.borders[d.Direction] === "GAP")
      .map((d) => d.Cell);

    return neighbors;
  }
}

class Maze {
  constructor(size) {
    this.size = size;
    this.cells = [];
  }

  Init() {
    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) {
        const vector = new Vector(x, y);
        const cell = new Cell(this, vector);
        cell.borders["LEFT"] = vector.x === 0 ? "BOUNDARY" : "WALL";
        cell.borders["RIGHT"] =
          vector.x === this.size - 1 ? "BOUNDARY" : "WALL";
        cell.borders["UP"] = vector.y === 0 ? "BOUNDARY" : "WALL";
        cell.borders["DOWN"] = vector.y === this.size - 1 ? "BOUNDARY" : "WALL";
        this.cells.push(cell);
      }
    }
  }

  GetCellAtVector(vector) {
    const cell = this.cells.filter((c) => c.vector.Equals(vector))[0];
    return cell;
  }

  /*
Constructs a random maze using Depth first search algorithm.

Algorithm:
----------
1. Pick an 'exit' cell.
2. Push cell onto stack.
3. Pop a cell from stack. If stack empty, then done.
4. Process cell:
  4.1 Mark current cell as visited and get all candidate neighbors. A
      candidate neighbor is one which has not yet been visited in the
      generation process.
  4.2 If no candidate neighbors, goto #3
  4.3 If > 1 candidate neighbor, Push current cell onto stack
  4.4 Select 1 random candidate neighbor
  4.5 Remove wall between random candidate neighbor and current cell.
  4.6 Make the random candidate neight the new current cell and goto 4
*/
  Generate() {
    this.Init();
    const cellStack = [];
    cellStack.push(
      this.GetCellAtVector(new Vector(this.size - 1, this.size - 1))
    );
    while (cellStack.length > 0) {
      const cell = cellStack.pop();
      this.ProcessCell(cellStack, cell);
    }
  }

  ProcessCell(cellStack, cell) {
    cell.visited = true;
    const neighbors = cell.Neighbors();
    const candidates = cell
      .Neighbors()
      .map((n) => n.Cell)
      .filter((c) => c.visited === false);
    switch (candidates.length) {
      case 0:
        return;
      case 1:
        this.KnockDownWall(cell, candidates[0]);
        this.ProcessCell(cellStack, candidates[0]);
        break;
      default:
        cellStack.push(cell);
        const random = Math.floor(Math.random() * candidates.length);
        const randomCell = candidates[random];
        this.KnockDownWall(cell, randomCell);
        this.ProcessCell(cellStack, randomCell);
        break;
    }
  }

  KnockDownWall(cell1, cell2) {
    cell1.borders[cell1.RelationTo(cell2)] = "GAP";
    cell2.borders[cell2.RelationTo(cell1)] = "GAP";
  }

  ///////////////////////////////
  // Solves the maze and returns
  // an array of vectors that
  // map the shortest path.
  ///////////////////////////////
  solve(startVector, endVector) {
    for (let i = 0; i < this.cells.length; i++) {
      this.cells[i].solveVisited = false;
    }

    const cellQueue = [];
    let currentCell = this.GetCellAtVector(endVector);
    currentCell.solveDistance = 0;
    cellQueue.unshift(currentCell);

    while (cellQueue.length > 0) {
      const currentCell = cellQueue.shift();
      this.solveProcessCell(cellQueue, currentCell);
    }

    // Finally, get the path from start to finish
    let shortestPath = [];
    currentCell = this.GetCellAtVector(startVector);
    while (true) {
      shortestPath.push(currentCell);
      if (currentCell.vector.Equals(endVector)) break;

      // Get neighbor with lowest distance to target
      currentCell = currentCell
        .AccessibleNeighbors()
        .sort((a, b) => (a.solveDistance > b.solveDistance ? 1 : -1))[0];
    }

    return shortestPath.map((sp) => sp.vector);
  }

  solveProcessCell(cellQueue, currentCell) {
    currentCell.solveVisited = true;
    // Get adjoining cells
    const neighbors = currentCell
      .Neighbors()
      .map((c) => c.Cell)
      .filter(
        (c) =>
          !c.solveVisited &&
          currentCell.borders[currentCell.RelationTo(c)] === "GAP"
      );

    for (let i = 0; i < neighbors.length; i++) {
      neighbors[i].solveDistance = currentCell.solveDistance + 1;
      cellQueue.unshift(neighbors[i]);
    }
  }
}

// Manages a sprite
// frameArray is a set of dimensions
class Sprite {
  constructor(
    name, // name of the sprite
    ctx, // reference to canvas
    spriteSheetImg, // Sprite sheet containing all images
    sourceSize, // size of sprite in source image
    targetSize, // size of sprite when rendered in output. The target size MUST be the same size as the maze cell size (normally 16 or 32 pixels).
    imageCount, // number of images that can be animated / cycled through
    imageSet, // parameters / meta data for each image in the image set
    x, // starting x coordinate (top-left)
    y, // starting y coordinate (top-left)
    frameSpeed,
    direction
  ) {
    this.name = name;
    this.ctx = ctx;
    this.spriteSheetImg = spriteSheetImg;
    this.sourceSize = sourceSize;
    this.targetSize = targetSize;
    this.imageCount = imageCount; // 3
    this.imageSet = imageSet;
    this.x = x;
    this.y = y;
    this.frame = 1;
    this.frameSpeed = frameSpeed;
    this.direction = direction; // Initial direction

    // Additional calculations
    this.movement = Math.floor(this.targetSize / 5); // 5 frames per logical tile
  }

  // Gets the logical-x tile that the top-left part of the sprite is in
  getLogicalx() {
    return Math.floor(this.x / this.targetSize);
  }

  // Gets the logical-y tile that the top-left part of the sprite is in
  getLogicaly() {
    return Math.floor(this.y / this.targetSize);
  }

  // Gets the x-coordinate of the middle of the sprite
  getMiddlex() {
    return Math.floor(this.x + this.targetSize / 2);
  }

  // Gets the y-coordinate of the middle of the sprite
  getMiddley() {
    return Math.floor(this.y + this.targetSize / 2);
  }

  // Gets the logical-x tile that the middle of the sprite is in.
  getMiddleLogicalx() {
    return Math.floor(this.getMiddlex() / this.targetSize);
  }

  // Gets the logical-y tile that the middle of the sprite is in.
  getMiddleLogicaly() {
    return Math.floor(this.getMiddley() / this.targetSize);
  }

  // Sets the direction of the sprite
  setDirection(direction) {
    this.direction = direction;
  }

  getMovementx() {
    return this.direction === "LEFT"
      ? -this.movement
      : this.direction === "RIGHT"
      ? this.movement
      : 0;
  }

  getMovementy() {
    return this.direction === "UP"
      ? -this.movement
      : this.direction === "DOWN"
      ? this.movement
      : 0;
  }

  getNextLogicalx() {
    return Math.floor((this.x + this.getMovementx()) / this.targetSize);
  }

  getNextLogicaly() {
    return Math.floor((this.y + this.getMovementy()) / this.targetSize);
  }

  // returns true if the sprite is blocked by the maze based on its
  // current direction.
  isBlocked(maze) {
    // boolean to determine whether sprite's movement is blocked
    return (
      (this.direction === "RIGHT" &&
        maze.GetCellAtVector(
          new Vector(this.getLogicalx(), this.getMiddleLogicaly())
        ).borders["RIGHT"] !== "GAP") ||
      (this.direction === "DOWN" &&
        maze.GetCellAtVector(
          new Vector(this.getMiddleLogicalx(), this.getLogicaly())
        ).borders["DOWN"] !== "GAP") ||
      (this.direction === "LEFT" &&
        this.getLogicalx() !== this.getNextLogicalx() &&
        maze.GetCellAtVector(
          new Vector(this.getNextLogicalx() + 1, this.getMiddleLogicaly())
        ).borders["LEFT"] !== "GAP") ||
      (this.direction === "UP" &&
        this.getLogicaly() !== this.getNextLogicaly() &&
        maze.GetCellAtVector(
          new Vector(this.getMiddleLogicalx(), this.getNextLogicaly() + 1)
        ).borders["UP"] !== "GAP")
    );
  }

  // Allows for a system algorithm to be implemented instead of
  // using user input. This function normally used for pc-controlled
  // sprites
  systemInputFn(game) {}

  // Calculates the next state / position of the sprite within the maze,
  // taking into account obstacles like the maze walls.
  // This function can also do collison detection using the sprites array.
  calculateState(game) {
    const maze = game.maze;
    const sprites = [...game.monsterSprites, game.playerSprite, game.keySprite];
    const counter = game.counter;

    this.collisionDetection(game, sprites);

    if (!this.direction) {
      this.update(this.x, this.y, "DEFAULT", counter);
    } else {
      if (this.isBlocked(maze)) {
        // If movement is blocked by the maze, don't actually move, but re-center non-movement axis.
        this.update(
          this.direction === "UP" || this.direction === "DOWN"
            ? this.x
            : this.getLogicalx() * this.targetSize + 1,
          this.direction === "LEFT" || this.direction === "RIGHT"
            ? this.y
            : this.getLogicaly() * this.targetSize,
          this.direction,
          counter
        );
      } else {
        // Not blocked - move sprite.
        if (this.direction === "RIGHT") {
          this.update(
            this.x + this.getMovementx(),
            this.getMiddleLogicaly() * this.targetSize,
            "RIGHT",
            counter
          );
        }
        if (this.direction === "LEFT") {
          this.update(
            this.x + this.getMovementx(),
            this.getMiddleLogicaly() * this.targetSize,
            "LEFT",
            counter
          );
        }
        if (this.direction === "UP") {
          this.update(
            this.getMiddleLogicalx() * this.targetSize,
            this.y + this.getMovementy(),
            "UP",
            counter
          );
        }
        if (this.direction === "DOWN") {
          this.update(
            this.getMiddleLogicalx() * this.targetSize,
            this.y + this.getMovementy(),
            "DOWN",
            counter
          );
        }
      }
    }
  }

  collisionDetection(game, sprites) {
    if (this.name === "player1") {
      const key = sprites.filter((s) => s.name === "key")[0];
      if (
        key.getMiddleLogicalx() === this.getMiddleLogicalx() &&
        key.getMiddleLogicaly() === this.getMiddleLogicaly()
      ) {
        alert("You Win!");
        game.resetGame();
      }

      const monsters = sprites.filter((s) => s.name === "monster");
      for (let m = 0; m < monsters.length; m++) {
        if (
          monsters[m].getMiddleLogicalx() === this.getMiddleLogicalx() &&
          monsters[m].getMiddleLogicaly() === this.getMiddleLogicaly()
        ) {
          alert("You Lose!");
          game.resetGame();
        }
      }
    }
  }

  // Actually applies the change in position
  update(x, y, type, counter) {
    this.oldx = this.x;
    this.oldy = this.y;
    this.x = x;
    this.y = y;
    this.type = type;
    this.frame = Math.floor(counter / this.frameSpeed) % this.imageCount;
  }

  preRender() {
    this.ctx.clearRect(this.oldx, this.oldy, this.targetSize, this.targetSize);
  }

  render() {
    const image = this.imageSet.filter((f) => f.type === this.type)[0][
      "images"
    ][this.frame];

    this.ctx.drawImage(
      this.spriteSheetImg,
      this.sourceSize * image[0],
      this.sourceSize * image[1],
      this.sourceSize,
      this.sourceSize,
      this.x,
      this.y,
      this.targetSize,
      this.targetSize
    );
  }
}

class Game {
  constructor(mazeSize, cellSize, monsterCount) {
    this.mazeSize = mazeSize;
    this.cellSize = cellSize;
    this.monsterCount = monsterCount;
    this.maze = new Maze(mazeSize);
    this.freeze = false; // to 'freeze' the game

    // Canvas
    this.canvas = document.getElementById("maze-viz");
    this.canvas.width = this.mazeSize * this.cellSize;
    this.canvas.height = this.mazeSize * this.cellSize;
    this.ctx = this.canvas.getContext("2d");

    // User Input
    document.onkeydown = (event) => {
      this.userInput.call(this, event);
    };

    this.resetGame();
    this.start();
  }

  resetGame() {
    // Generate the map / maze / tiles
    this.maze = new Maze(this.mazeSize);
    this.maze.Generate();

    // Initialise the sprites
    this.initSprites();

    // Sprites
    this.counter = 0;
  }

  // Starts the actual game
  start() {
    setInterval(() => {
      const eventLoopBound = this.eventLoop.bind(this);
      window.requestAnimationFrame(eventLoopBound);
    }, 60);
  }

  userInput(event) {
    const keyCode = event.keyCode;
    switch (keyCode) {
      case 65: // 'A'
        this.playerSprite.setDirection("LEFT");
        break;
      case 87: // 'W'
        this.playerSprite.setDirection("UP");
        break;
      case 68: // 'D'
        this.playerSprite.setDirection("RIGHT");
        break;
      case 83: // 'S'
        this.playerSprite.setDirection("DOWN");
        break;
      case 32: // 'SPACE'
        this.initialiseBreadcrumbSprites();
        this.freeze = !this.freeze;
        break;
    }
  }

  eventLoop() {
    this.counter++;

    // Calculate Position

    // If freeze = true, then freeze movement, and show the breadcrumb path
    if (this.freeze) {
      this.breadcrumbSprites.forEach((b) => b.calculateState(this));
      this.breadcrumbSprites.forEach((b) => b.preRender);
    } else {
      // update positions if not frozen.
      this.playerSprite.systemInputFn(this);
      this.monsterSprites.forEach((m) => {
        m.systemInputFn(this);
      });

      this.playerSprite.calculateState(this);
      this.keySprite.calculateState(this);
      this.monsterSprites.forEach((m) => {
        m.calculateState(this);
      });
    }

    this.playerSprite.preRender();
    this.keySprite.preRender();
    this.monsterSprites.forEach((m) => {
      m.preRender();
    });

    this.drawMaze();
    if (this.freeze) {
      this.breadcrumbSprites.forEach((b) => b.render());
    }
    this.playerSprite.render();
    this.keySprite.render();
    this.monsterSprites.forEach((m) => {
      m.render();
    });
  }

  // Init Sprites
  initSprites() {
    const that = this;
    this.mazeSprites = new Image();
    this.mazeSprites.onload = function () {
      // Player #1
      that.playerSprite = new Sprite(
        "player1",
        that.ctx,
        that.mazeSprites,
        32,
        that.cellSize,
        3,
        [
          {
            type: "UP",
            images: [
              [0, 2],
              [1, 2],
              [2, 2],
            ],
          },
          {
            type: "RIGHT",
            images: [
              [0, 3],
              [1, 3],
              [2, 3],
            ],
          },
          {
            type: "DOWN",
            images: [
              [0, 4],
              [1, 4],
              [2, 4],
            ],
          },
          {
            type: "LEFT",
            images: [
              [0, 5],
              [1, 5],
              [2, 5],
            ],
          },
        ],
        Math.floor(Math.random() * that.mazeSize) * that.cellSize,
        Math.floor(Math.random() * that.mazeSize) * that.cellSize,
        1,
        "RIGHT"
      );

      // Monsters
      that.monsterSprites = [];
      for (var i = 0; i < that.monsterCount; i++) {
        that.monsterSprites.push(
          new MonsterSprite(
            "monster",
            that.ctx,
            that.mazeSprites,
            32,
            that.cellSize,
            3,
            [
              {
                type: "UP",
                images: [
                  [0, 6],
                  [1, 6],
                  [2, 6],
                ],
              },
              {
                type: "RIGHT",
                images: [
                  [0, 7],
                  [1, 7],
                  [2, 7],
                ],
              },
              {
                type: "DOWN",
                images: [
                  [0, 8],
                  [1, 8],
                  [2, 8],
                ],
              },
              {
                type: "LEFT",
                images: [
                  [0, 9],
                  [1, 9],
                  [2, 9],
                ],
              },
            ],
            Math.floor(Math.random() * that.mazeSize) * that.cellSize,
            Math.floor(Math.random() * that.mazeSize) * that.cellSize,
            4,
            "RIGHT"
          )
        );
      }

      // Key
      that.keySprite = new Sprite(
        "key",
        that.ctx,
        that.mazeSprites,
        32,
        that.cellSize,
        10,
        [
          {
            type: "DEFAULT",
            images: [
              [0, 1],
              [1, 1],
              [2, 1],
              [3, 1],
              [4, 1],
              [5, 1],
              [6, 1],
              [7, 1],
              [8, 1],
              [9, 1],
            ],
          },
        ],
        Math.floor(Math.random() * that.mazeSize) * that.cellSize,
        Math.floor(Math.random() * that.mazeSize) * that.cellSize,
        1,
        ""
      );
    };
    this.mazeSprites.src =
      "https://api.dbarone.com/resources/name/maze-sprites-32.png";
  }

  initialiseBreadcrumbSprites() {
    const that = this;
    const startVector = new Vector(
      this.playerSprite.getMiddleLogicalx(),
      this.playerSprite.getMiddleLogicaly()
    );
    const endVector = new Vector(
      this.keySprite.getMiddleLogicalx(),
      this.keySprite.getMiddleLogicaly()
    );
    const vectorPath = this.maze.solve(startVector, endVector);

    this.breadcrumbSprites = vectorPath.map(
      (vp) =>
        new Sprite(
          "breadcrumb",
          that.ctx,
          that.mazeSprites,
          32,
          that.cellSize,
          12,
          [
            {
              type: "DEFAULT",
              images: [
                [0, 10],
                [1, 10],
                [2, 10],
                [3, 10],
                [4, 10],
                [5, 10],
                [6, 10],
                [7, 10],
                [8, 10],
                [9, 10],
                [10, 10],
                [11, 10],
              ],
            },
          ],
          vp.x * that.cellSize,
          vp.y * that.cellSize,
          2,
          ""
        )
    );
  }

  drawMaze() {
    for (let x = 0; x < this.mazeSize; x++) {
      for (let y = 0; y < this.mazeSize; y++) {
        // We convert the borders to a number between 0 and 15 based on following flags:
        // Wall North: 1
        // Wall East: 2
        // Wall South: 4
        // Wall West: 8

        // This number is then mapped to the position of the sprite in the maze-ground-tiles sprite map
        const cell = this.maze.GetCellAtVector(new Vector(x, y));
        let key = 0;
        if (cell.borders["UP"] !== "GAP") {
          key = key + 1;
        }
        if (cell.borders["RIGHT"] !== "GAP") {
          key = key + 2;
        }
        if (cell.borders["DOWN"] !== "GAP") {
          key = key + 4;
        }
        if (cell.borders["LEFT"] !== "GAP") {
          key = key + 8;
        }

        // Source image tiles are 32*32
        const sourceTileSize = 32;
        this.ctx.drawImage(
          this.mazeSprites,
          key * sourceTileSize,
          0,
          sourceTileSize,
          sourceTileSize,
          this.cellSize * cell.vector.x,
          this.cellSize * cell.vector.y,
          this.cellSize,
          this.cellSize
        );
      }
    }
  }
}

function go() {
  const game = new Game(20, 32, 4);
}

class MonsterSprite extends Sprite {
  constructor(
    name, // name of the sprite
    ctx, // reference to canvas
    spriteSheetImg, // Sprite sheet containing all images
    sourceSize, // size of sprite in source image
    targetSize, // size of sprite when rendered in output. The target size MUST be the same size as the maze cell size (normally 16 or 32 pixels).
    imageCount, // number of images that can be animated / cycled through
    imageSet, // parameters / meta data for each image in the image set
    x, // starting x coordinate (top-left)
    y, // starting y coordinate (top-left)
    frameSpeed,
    direction
  ) {
    super(
      name,
      ctx,
      spriteSheetImg,
      sourceSize,
      targetSize,
      imageCount,
      imageSet,
      x,
      y,
      frameSpeed,
      direction
    );
    this.lastChange = 0;
  }
  // For monster sprite, we need to automate the movement.
  systemInputFn(game) {
    const maze = game.maze;
    this.lastChange++; // to prevent indecision at intersections

    const cell = maze.GetCellAtVector(
      new Vector(this.getMiddleLogicalx(), this.getMiddleLogicaly())
    );

    const currentDirection = this.direction;
    const oppositeDirection =
      currentDirection === "UP"
        ? "DOWN"
        : currentDirection === "RIGHT"
        ? "LEFT"
        : currentDirection === "DOWN"
        ? "UP"
        : "RIGHT";

    // Get available directions
    const possibleDirections = Object.keys(cell.borders)
      .map((k) => {
        return {
          key: k,
          value: cell.borders[k],
        };
      })
      .filter((b) => b.value === "GAP" && b.key !== oppositeDirection)
      .map((b) => b.key);

    if (this.isBlocked(maze)) {
      // If movement is blocked, forced to change direction.

      if (possibleDirections.length === 0) {
        // No alternate way to go - turn back.
        this.setDirection(oppositeDirection);
      } else {
        // Pick random direction to go
        const randomDirection =
          possibleDirections[
            Math.floor(Math.random() * possibleDirections.length)
          ];
        super.setDirection(randomDirection);
        this.lastChange = 0;
      }
    } else {
      // if not blocked there are 3 basic rules for general movement
      // a) in general keep going same direction as before
      // b) if the cell has 2 gaps (i.e. where you came from + way ahead, 1/1000 chance of turning around)
      // c) if cell has > 2 gaps, then remove the gap where you've
      if (Math.random() < 0.001 && this.lastChange > 5) {
        super.setDirection(oppositeDirection);
        this.lastChange = 0;
      } else if (possibleDirections.length > 1 && this.lastChange > 5) {
        const randomDirection =
          possibleDirections[
            Math.floor(Math.random() * possibleDirections.length)
          ];
        super.setDirection(randomDirection);
        this.lastChange = 0;
      }
    }
  }
}

// Sound Track
function loadSoundTrack() {
  const audioCtx = new AudioContext();
  var url = "https://api.dbarone.com/resources/name/Cornfield Chase.mp3";
  var request = new XMLHttpRequest();
  request.responseType = "arraybuffer";
  request.open("GET", url, true);
  request.onload = function () {
    audioCtx.decodeAudioData(request.response, function (buffer) {
      // save buffer, to not load again
      saved = buffer;
      // play sound
      playSoundTrack(audioCtx, buffer);
    });
  };
  request.send();
}

function playSoundTrack(context, buffer) {
  //creating source node
  var source = context.createBufferSource();
  //passing in data
  source.buffer = buffer;
  //giving the source which sound to play
  source.connect(context.destination);
  //start playing
  source.start(0);
}
