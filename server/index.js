import express from "express";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import * as THREE from "three";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3500;
const app = express();

let roles = ["controller", "observer"];
let team = [];
var cubeSize = 1;
let shapes = [];
let colours = [];

app.use(express.static(path.join(__dirname, "public")));

const expressServer = app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
const io = new Server(expressServer, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? false
        : ["http://localhost:5500", "http://127.0.0.1:5500"],
  },
});
io.on("connection", (socket) => {
  console.log(`User ${socket.id} connected`);
  // Check how many players are currently connected
  if (team.length < 2) {
    // Assign the first available role based on the current team size
    const role = roles[team.length];
    team.push({ id: socket.id, role }); // Add the player to the team with the role
    fillQueue();
    socket.emit("role", role, shapes, colours); // Notify the player of their role
    console.log(`Assigned role ${role} to ${socket.id}`);
  } else {
    // Notify the player that the team is full
    socket.emit("error", "Team is full");
    console.log(`Team is full. Cannot assign role to ${socket.id}`);
    return;
  }

  
  socket.on("updateQueue", () => {
    let shape = randomBlock();
    let color = getRandomColour();
    socket.emit("newBlock", shape, color);
  });
  socket.on("move", (data) => {
    // Handle player move (left, right, rotate, etc.)
    const { direction, player } = data;
    // Update game state accordingly
      if (direction === "ArrowLeft") {
        io.emit("direction", "left");
      } else if (direction === "ArrowRight") {
        io.emit("direction", "right");
      } else if (direction === "ArrowUp") {
        io.emit("direction", "up");
      }else if (direction === "ArrowDown") {
        io.emit("direction", "");
      }
    
  });
});
//////////////////////////////////////////
/* Create a new random block for each position in the queue */
function fillQueue() {
  for (let i = 0; i < 4; i++) {
    let shape = randomBlock();
    let color = getRandomColour();
    colours.push(color);
    shapes.push(shape);
  }
}

function updateQueue() {
  // Move each block down the queue and change scene
  for (i = 1; i < positionQueue.length; i++) {
    sceneQueue[i].remove(blockQueue[i].current); // Remove from current scene
    sceneQueue[i - 1].add(blockQueue[i].current); // Upgrade to next scene
    blockQueue[i].updatePos(
      new THREE.Vector3(
        positionQueue[i - 1].x,
        positionQueue[i - 1].y,
        positionQueue[i - 1].z
      )
    );
    //translateBlock(blockQueue[i], new THREE.Vector3(positionQueue[i - 1].x,
    //                                                positionQueue[i - 1].y,
    //                                                positionQueue[i - 1].z));
    blockQueue[i - 1] = blockQueue[i]; // Move along in the queue
  }
  // Add block at front of queue to active blocks
  activeBlocks.push(blockQueue[0]);
  // Add a new block to end of queue
  var newBlock = randomBlock(positionQueue[positionQueue.length - 1]);
  blockQueue[positionQueue.length - 1] = newBlock;
  // sceneQueue[positionQueue.length - 1].add(newBlock.current);
}
function translateBlock(block, newPos) {
  // Create translation vector
  vector = new THREE.Vector3(
    newPos.x - block.children[0].position.x,
    newPos.y - block.children[0].position.y,
    newPos.z - block.children[0].position.z
  );
  // Translate each cube within the block by the vector
  for (j = 0; j < block.children.length; j++) {
    block.children[j].position.add(vector);
  }
}

/* Selects a random block from the Tetris collection */
function randomBlock() {
  let random = Math.ceil(Math.random() * 7);
  switch (random) {
    case 1:
      return "createL";
    case 2:
      return "createBkwdsL";
    case 3:
      return "createLine";
    case 4:
      return "createSquare";
    case 5:
      return "createS";
    case 6:
      return "createBkwdsS";
    case 7:
      return "createT";
  }
}

function getRandomColour() {
  var letters = "0123456789ABCDEF";
  var colour = "#";
  for (var i = 0; i < 6; i++) {
    colour += letters[Math.floor(Math.random() * 16)];
  }
  return colour;
}

class Block extends THREE.Group {
  constructor(pos, orientations) {
    super();
    // List of lists of (x,y) coordinates, describing a block for each orientation
    this.orientations = orientations;
    this.pos = pos; // The position of the first cube in the current block
    this.index = 0; // The index of the current orientation in use
    this.current = this.buildCurrent(); // A Group object of cubes
  }

  /* Rotates the current block clockwise */
  rotate() {
    // Cycle through to the next orientation index
    if (this.index >= this.orientations.length - 1) {
      this.index = 0;
    } else {
      this.index++;
    }

    // Build new current block of the same colour
    var colour = this.current.children[0].material.color;
    this.current = this.buildCurrent(colour);
  }

  /* A basic cube used to create any block */
  createCube(size, colour) {
    var geometry = new THREE.BoxGeometry(size, size, size);
    var material = new THREE.MeshPhongMaterial({ color: colour });
    var cube = new THREE.Mesh(geometry, material);

    return cube;
  }

  /* Creates and returns a random colour hex code */
  getRandomColour() {
    var letters = "0123456789ABCDEF";
    var colour = "#";
    for (var i = 0; i < 6; i++) {
      colour += letters[Math.floor(Math.random() * 16)];
    }
    return colour;
  }

  /* Builds the current block using current index and optional colour */
  buildCurrent(colour) {
    var cubes = [];

    // If no colour given, get random colour
    if (typeof colour == "undefined") {
      colour = this.getRandomColour();
    }

    var shape = this.orientations[this.index];

    // Each shape is a list of coordinates for each cube in block
    for (var j = 0; j < shape.length; j++) {
      cubes.push(this.createCube(cubeSize, colour));

      // Set position of cube using shape positions
      cubes[j].position.set(
        this.pos.x,
        this.pos.y + shape[j][0],
        this.pos.z + shape[j][1]
      );
    }

    var block = new THREE.Group();
    // Group the cubes together into a single block to return
    for (var k = 0; k < cubes.length; k++) {
      block.add(cubes[k]);
    }
    return block;
  }

  /* Updates the class position of the first cube in the current block
     as well as positions of all children cubes in the current block */
  updatePos(newPos) {
    this.pos = newPos; // Update class position

    var shape = this.orientations[this.index];

    // Update position of children cubes
    // Each shape is a list of coordinates for each cube in block
    for (var i = 0; i < shape.length; i++) {
      // Set new position of cube using shape positions
      this.current.children[i].position.set(
        this.pos.x,
        this.pos.y + shape[i][0],
        this.pos.z + shape[i][1]
      );
    }
  }
}
