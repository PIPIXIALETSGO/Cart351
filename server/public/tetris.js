var camera, radius;
var cubeSize = 1;
var gameWidth = 15;
var gameHeight = 10;
var gameOver = false;
var blockQueue = [];
var activeBlocks = [];
var c = 5; // Added starting height of a block over the finish line
var gap = 6; // Gap between future blocks
let shapes = [];
let colours = [];
let positionQueue = [
  new THREE.Vector3(0, gameHeight - cubeSize / 2 + c, 0),
  new THREE.Vector3(0, gameHeight - cubeSize / 2, -18),
  new THREE.Vector3(0, gameHeight - cubeSize / 2 - gap, -18),
  new THREE.Vector3(0, gameHeight - cubeSize / 2 - 2 * gap, -18),
];
var sceneQueue = [
  new THREE.AmbientLight((intensity = 1)),
  new THREE.AmbientLight((intensity = 0.7)),
  new THREE.AmbientLight((intensity = 0.5)),
  new THREE.AmbientLight((intensity = 0.2)),
];
// Controls
var isBackView = false;

var previous;
let role;
let gameStart = false;
const socket = io("ws://localhost:3500");
function sendMessage() {
  socket.emit("message", "hello");
}
socket.on("role", (r, s, c) => {
  role = r;
  shapes = s;
  colours = c;
  checkRole();
  initGame();
});

init();
animate();

document.addEventListener("keydown", (event) => {
  const direction = event.key;
  if (role === "controller") {
    if (direction === "ArrowLeft") {
      socket.emit("move", { direction, player: role });
    } else if (direction === "ArrowRight") {
      socket.emit("move", { direction, player: role });
    } else if (direction === "ArrowUp") {
      socket.emit("move", { direction, player: role });
    } else if (direction === "ArrowDown") {
      socket.emit("move", { direction, player: role });
    }
  }
});
socket.on("direction", (direction) => {
  if (direction == "left") {
    moveLeftRight("left");
  } else if (direction == "right") {
    moveLeftRight("right");
  } else if (direction == "up") {
    rotateBlock();
  } else if (direction == "down") {
    moveDown();
  }
});

function updateQueue() {
  socket.emit("updateQueue");
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

    blockQueue[i - 1] = blockQueue[i]; // Move along in the queue
  }
  // Add block at front of queue to active blocks
  activeBlocks.push(blockQueue[0]);
  // Add a new block to end of queue
  socket.on("newBlock", (s, c) => {
    var newBlock = randomBlock(positionQueue[positionQueue.length - 1], s, c);
    blockQueue[positionQueue.length - 1] = newBlock;
    sceneQueue[positionQueue.length - 1].add(newBlock.current);
  });
  checkRole();
}

function init() {
  sceneMain = new THREE.Scene();
  sceneMain.background = new THREE.Color(0x87ceeb); // RGB Hex for sky blue
  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(30, 5, 0);
  camera.lookAt(new THREE.Vector3(0, gameHeight / 2, 0));
  radius = Math.sqrt(
    Math.pow(camera.position.x, 2) +
      Math.pow(camera.position.y, 2) +
      Math.pow(camera.position.z, 2)
  );

  // Create vertical grid
  var lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
  for (x = -0.5; x <= 0.5; x++) {
    // Create vertical lines
    for (i = -7.5; i <= 7.5; i++) {
      var geometry = new THREE.Geometry();
      geometry.vertices.push(new THREE.Vector3(x, gameHeight * 1.5 - 0.5, i));
      geometry.vertices.push(new THREE.Vector3(x, 0, i));
      var line = new THREE.Line(geometry, lineMaterial);
      sceneMain.add(line);
    }
    // Create horizontal lines
    for (i = 0; i <= gameHeight * 1.5; i++) {
      var geometry = new THREE.Geometry();
      if (i == gameHeight) {
        lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
      }
      geometry.vertices.push(new THREE.Vector3(x, i, -7.5));
      geometry.vertices.push(new THREE.Vector3(x, i, 7.5));
      var line = new THREE.Line(geometry, lineMaterial);
      sceneMain.add(line);
      if (i == gameHeight) {
        lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
      }
    }
  }
  // Join front and back vertical grid with lines along the sides
  for (z = -7.5; z <= 7.5; z = z + 29) {
    for (y = 1; y <= gameHeight * 1.5; y++) {
      if (y == gameHeight) {
        lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
      }
      var geometry = new THREE.Geometry();
      geometry.vertices.push(new THREE.Vector3(-0.5, y, z));
      geometry.vertices.push(new THREE.Vector3(0.5, y, z));
      var line = new THREE.Line(geometry, lineMaterial);
      sceneMain.add(line);
      if (y == gameHeight) {
        lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
      }
    }
  }
  // Join front and back vertical grid with lines across the top
  for (z = -6.5; z <= 6.5; z++) {
    var geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vector3(-0.5, gameHeight * 1.5 - 0.5, z));
    geometry.vertices.push(new THREE.Vector3(0.5, gameHeight * 1.5 - 0.5, z));
    var line = new THREE.Line(geometry, lineMaterial);
    sceneMain.add(line);
  }

  // Add directional lighting to scene.
  var directionalLight = new THREE.DirectionalLight(0xffffff, 0);
  directionalLight.position.x = 10;
  directionalLight.position.y = 10;
  directionalLight.position.z = 0;
  directionalLight.intensity = 1.5;

  sceneMain.add(directionalLight);
  var ambientLight = new THREE.AmbientLight();
  ambientLight.intensity = 0.02;
  sceneMain.add(ambientLight);

  // Create a queue of scenes with different lighting for blocks in the queue
  // Scene 1 - high intensity lighting, for block in the front of the queue
  var scene1 = new THREE.Scene();
  var intensity1 = 0.8;
  var lighting1 = new THREE.AmbientLight(0xf5f5f5, intensity1);
  var directional1 = new THREE.DirectionalLight(0xf5f5f5, intensity1);
  scene1.add(lighting1);
  scene1.add(directional1);

  // Scene 2 - medium intensity lighting, for block second in the queue
  var scene2 = new THREE.Scene();
  var intensity2 = 0.5;
  var lighting2 = new THREE.AmbientLight(0xf5f5f5, intensity2);
  var directional2 = new THREE.DirectionalLight(0xf5f5f5, intensity2);
  scene2.add(lighting2);
  scene2.add(directional2);

  // Scene 3 - low intensity lighting, for block third in the queue
  var scene3 = new THREE.Scene();
  var intensity3 = 0.2;
  var lighting3 = new THREE.AmbientLight(0xf5f5f5, intensity3);
  var directional3 = new THREE.DirectionalLight(0xf5f5f5, intensity3);
  scene3.add(lighting3);
  scene3.add(directional3);

  // Add scenes to scene queue
  sceneQueue[0] = sceneMain;
  sceneQueue[1] = scene1;
  sceneQueue[2] = scene2;
  sceneQueue[3] = scene3;

  // Set up the Web GL renderer.
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.autoClear = false;
  document.body.appendChild(renderer.domElement);

  // Handle resizing of the browser window.
  window.addEventListener("resize", handleResize, false);
}

/* Checks whether it's been a seconds since last called this function */
function beenASecond() {
  var toWait = 500; /* i.e. 1 second */
  var now = new Date().getTime();
  if (now > previous + toWait) {
    previous = now; // Records time to global variable
    return true;
  }
  return false;
}

/* Loops to animate the scene */
function animate() {
  requestAnimationFrame(animate);
  toggleCameraView();
  if (!gameOver) {
    if (beenASecond()) {
      if (moveDown()) {
        updateGameOver();
        if (!gameOver) {
          updateQueue();
          toggleCameraView();
        } else {
          alert("Game Over!");
        }
      }
    }
  }

  // Render the current scene to the screen.
  renderer.clear();
  for (j = 0; j < sceneQueue.length; j++) {
    renderer.render(sceneQueue[j], camera);
  }
}

/* Checks whether the game is over */
function updateGameOver() {
  currentBlock = activeBlocks.pop();
  // Check over all children of the current block to see if any exceed the game height
  for (i = 0; i < currentBlock.current.children.length; i++) {
    if (
      currentBlock.current.children[i].position.y >=
      gameHeight - cubeSize / 2
    ) {
      gameOver = true;
    }
  }
  activeBlocks.push(currentBlock);
}

// Translates a blocks children to a new position

/* Move along each block in the queue */

/* Initialise the game with the first block
    and takes first time recording */
function initGame() {
  fillQueue();
  moveDown();
  previous = new Date().getTime(); //Record starting time for beenASecond func
}
function fillQueue() {
  for (i = 0; i < positionQueue.length; i++) {
    block = randomBlock(positionQueue[i], shapes[i], colours[i]);

    sceneQueue[i].add(block.current); // Add to correct scene
    blockQueue[i] = block; // Add to block queue
  }
  activeBlocks.push(blockQueue[0]);
}
/* Handle resizing of the browser window. */
function handleResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// ------------Move block----------------

/* Move the current block either left or right depending on input */
function moveLeftRight(direction) {
  currentBlock = activeBlocks.pop();
  halt = false;
  add = 0;
  if (direction == "left") {
    add = 1; // Used later
    // Check if at left edge of game space
    for (i = 0; i < currentBlock.current.children.length; i++) {
      if (currentBlock.current.children[i].position.z >= gameWidth / 2 - 1) {
        halt = true;
      }
    }
  } else if (direction == "right") {
    add = -1; // Used later
    // Check at right edge of game space
    for (i = 0; i < currentBlock.current.children.length; i++) {
      if (-currentBlock.current.children[i].position.z >= gameWidth / 2 - 1) {
        halt = true;
      }
    }
  }
  if (!halt) {
    // With every other block in the blocks list
    check: for (i = 0; i < activeBlocks.length; i++) {
      checkBlock = activeBlocks[i];
      // Check checkBlocks children position against potential position
      // of currentBlocks children
      for (j = 0; j < currentBlock.current.children.length; j++) {
        var newPosition = new THREE.Vector3();
        newPosition = JSON.parse(
          JSON.stringify(currentBlock.current.children[j].position)
        );
        newPosition.z = newPosition.z + add;
        for (k = 0; k < checkBlock.current.children.length; k++) {
          // If positions would be equal, currentBlock cannot move across
          if (
            newPosition.x == checkBlock.current.children[k].position.x &&
            newPosition.y == checkBlock.current.children[k].position.y &&
            newPosition.z == checkBlock.current.children[k].position.z
          ) {
            // Sideways position is already occupied by block
            halt = true;
            break check;
          }
        }
      }
    }
  }

  // Move currentBlock one space down
  if (!halt) {
    // Update all children position to move one across
    currentBlock.updatePos(
      new THREE.Vector3(
        currentBlock.pos.x,
        currentBlock.pos.y,
        currentBlock.pos.z + add
      )
    );
  }

  activeBlocks.push(currentBlock); // Push modified block back on stack

  return halt; // Return whether hit a wall
}

/* Move the current block down a block */
function moveDown() {
  currentBlock = activeBlocks.pop();
  halt = false;
  // Check if block has hit the floor
  for (i = 0; i < currentBlock.current.children.length; i++) {
    if (currentBlock.current.children[i].position.y <= cubeSize / 2) {
      // Block has hit floor
      halt = true;
    }
  }

  if (!halt) {
    // With every other block in the blocks list
    check: for (i = 0; i < activeBlocks.length; i++) {
      checkBlock = activeBlocks[i];
      // Check checkBlocks children against currentBlocks children
      for (j = 0; j < currentBlock.current.children.length; j++) {
        var newPosition = new THREE.Vector3();
        newPosition = JSON.parse(
          JSON.stringify(currentBlock.current.children[j].position)
        );
        newPosition.y = newPosition.y - 1;
        for (k = 0; k < checkBlock.current.children.length; k++) {
          // If positions would be equal, currentBlock cannot move down
          if (
            newPosition.x == checkBlock.current.children[k].position.x &&
            newPosition.y == checkBlock.current.children[k].position.y &&
            newPosition.z == checkBlock.current.children[k].position.z
          ) {
            // Downwards position is already occupied by block
            halt = true;
            break check;
          }
        }
      }
    }
  }

  if (!halt) {
    // Update all children position to move down one space
    currentBlock.updatePos(
      new THREE.Vector3(
        currentBlock.pos.x,
        currentBlock.pos.y - 1,
        currentBlock.pos.z
      )
    );
  }

  activeBlocks.push(currentBlock);
  // Push modified block back on stack
  return halt; // Return whether hit the floor
}
function rotateBlock() {
  currentBlock = activeBlocks.pop();
  // Remove current block from the main scene
  sceneQueue[0].remove(currentBlock.current);
  currentBlock.rotate();
  // Add rotated block back to queues
  activeBlocks.push(currentBlock);
  sceneQueue[0].add(currentBlock.current);
}
function checkRole() {
  if (role == "controller") {
    isBackView = true;
    role = "observer";
  } else if (role == "observer") {
    isBackView = false;
    role = "controller";
  }
}

function toggleCameraView() {
  if (!isBackView) {
    // Switch to back view
    camera.position.set(-40, 50, 0); // Opposite side of initial view
    camera.lookAt(new THREE.Vector3(0, gameHeight / 2, 0));
  } else {
    // Switch back to front view
    camera.position.set(30, 10, 0); // Initial front view
    camera.lookAt(new THREE.Vector3(0, gameHeight / 2, 0));
  }
}
// Container walls (used as boundaries for collision detection)
const wallMaterial = new THREE.MeshLambertMaterial({
  color: 0xdcdcdc,
  emissive: 0xdcdcdc, // Gives a subtle red glow to the material
  emissiveIntensity: 0.1,
});
const wallMaterial2 = new THREE.MeshLambertMaterial({
  color: 0x8b0000,
  emissive: 0x8b0000, // Gives a subtle red glow to the material
  emissiveIntensity: 0.1,
});
// const wallMaterial2 = new THREE.MeshLambertMaterial({ color: 0x5C0000 });
const containerWidth = 10;
const containerHeight = 15;

const container = new THREE.Group();
// Left Wall
const leftWallGeometry = new THREE.BoxGeometry(1, containerHeight, 1);
const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial2);
leftWall.position.set(0, containerHeight / 2, -8);
container.add(leftWall);

// front Wall
const frontWallGeometry = new THREE.BoxGeometry(1, containerHeight, 17);
const frontWall = new THREE.Mesh(frontWallGeometry, wallMaterial);
frontWall.position.set(-1, containerHeight / 2, 0);
container.add(frontWall);

// right Wall
const rightWallGeometry = new THREE.BoxGeometry(1, containerHeight, 1);
const rightWall = new THREE.Mesh(leftWallGeometry, wallMaterial2);
rightWall.position.set(0, containerHeight / 2, 8);
container.add(rightWall);

// base
const baseGeometry = new THREE.BoxGeometry(10, 1, 17);
const base = new THREE.Mesh(baseGeometry, wallMaterial2);
base.position.set(0, -0.5, 0);
container.add(base);

// platform
const platGeometry = new THREE.BoxGeometry(10, 1, 17);
const platform = new THREE.Mesh(platGeometry, wallMaterial2);
platform.position.set(-5, 15, 0);
container.add(platform);
sceneMain.add(container);
