import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

let scene, camera, renderer, character, ground;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let velocity = new THREE.Vector3();
let cameraOffset = new THREE.Vector3(0, 5, 10);
let mouseSensitivity = 0.002;
let cameraRotation = new THREE.Euler(0, 0, 0, 'YXZ');
let isJumping = false;
let isShiftPressed = false;
let jumpVelocity = 0;
const gravity = 0.01;
const jumpStrength = 0.2;
let cheeses = [];
let score = 0;
let baseSpeed = 0.2;
let speedBoost = 0.5;

function init() {
  // Create scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);  // Sky blue background

  // Adjust camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 10, 20);



  // Add lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);



  // Create renderer
  renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gameCanvas') });
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Create ground
  const groundGeometry = new THREE.PlaneGeometry(5000, 5000);
  const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x228B22 });  // Forest green
  ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);



  // Create character (gray cube)
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ color: 0x808080 });  // Gray color
  character = new THREE.Mesh(geometry, material);
  character.position.y = 0.5;  // Place the cube on top of the ground
  scene.add(character);

  // Create cheese cubes
  createCheeseCubes(100); // Create 10 cheese cubes

  // Create 3D grass
  create3DGrass();

  // Add score display
  addScoreDisplay();

  // Add event listeners
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
  document.addEventListener('mousemove', onMouseMove);
  

  // Handle window resizing
  window.addEventListener('resize', onWindowResize);

  // Add debug info
  addDebugInfo();
  renderer.domElement.addEventListener('click', () => {
    renderer.domElement.requestPointerLock();
  });
  updateCameraPosition();
}

function onKeyDown(event) {
  switch (event.code) {
    case 'KeyW': moveForward = true; break;
    case 'KeyS': moveBackward = true; break;
    case 'KeyA': moveLeft = true; break;
    case 'KeyD': moveRight = true; break;
    case 'Space':
      if (!isJumping) {
        isJumping = true;
        jumpVelocity = isShiftPressed ? jumpStrength * 1.5 : jumpStrength;  // Increase jump strength when shift is pressed
      }
      break;
    case 'ShiftLeft': isShiftPressed = true; break;
  }
}

function onKeyUp(event) {
  switch (event.code) {
    case 'KeyW': moveForward = false; break;
    case 'KeyS': moveBackward = false; break;
    case 'KeyA': moveLeft = false; break;
    case 'KeyD': moveRight = false; break;
    case 'ShiftLeft': isShiftPressed = false; break;
  }
}

function onMouseMove(event) {
  cameraRotation.y -= event.movementX * mouseSensitivity;
  cameraRotation.x -= event.movementY * mouseSensitivity;
  cameraRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraRotation.x));
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function updateCharacterPosition() {
  velocity.x = 0;
  velocity.z = 0;

  let speed = baseSpeed + (isShiftPressed ? speedBoost : 0);
  if (moveForward) velocity.z -= speed;
  if (moveBackward) velocity.z += speed;
  if (moveLeft) velocity.x -= speed;
  if (moveRight) velocity.x += speed;

  // Apply camera rotation to movement
  velocity.applyEuler(new THREE.Euler(0, cameraRotation.y, 0));

  // Handle jumping
  if (isJumping) {
    character.position.y += jumpVelocity;
    jumpVelocity -= gravity;
    if (character.position.y <= 0.5) {  // Assuming ground level is at y = 0.5
      character.position.y = 0.5;
      isJumping = false;
    }
  }

  character.position.add(velocity);

  // Rotate character to face the direction of movement
  if (velocity.length() > 0) {
    character.rotation.y = Math.atan2(-velocity.x, -velocity.z);
  }

  // Check for cheese collision
  checkCheeseCollision();
}

function updateCameraPosition() {
  // Calculate camera position based on character position and offset
  let idealOffset = new THREE.Vector3().copy(cameraOffset);
  idealOffset.applyEuler(new THREE.Euler(0, cameraRotation.y, 0));
  idealOffset.add(character.position);

  camera.position.lerp(idealOffset, 0.1);
  camera.lookAt(character.position);
}

function animate() {
  requestAnimationFrame(animate);

  updateCharacterPosition();
  updateCameraPosition();

  renderer.render(scene, camera);

  // Update debug info
  updateDebugInfo();
}



function addDebugInfo() {
  const debugInfo = document.createElement('div');
  debugInfo.id = 'debugInfo';
  debugInfo.style.position = 'absolute';
  debugInfo.style.top = '10px';
  debugInfo.style.left = '10px';
  debugInfo.style.color = 'white';
  debugInfo.style.fontFamily = 'monospace';
  debugInfo.style.fontSize = '12px';
  debugInfo.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  debugInfo.style.padding = '5px';
  document.body.appendChild(debugInfo);
}

function updateDebugInfo() {
  const debugInfo = document.getElementById('debugInfo');
  debugInfo.innerHTML = `
    Character: (${character.position.x.toFixed(2)}, ${character.position.y.toFixed(2)}, ${character.position.z.toFixed(2)})<br>
    Camera: (${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)})<br>
    Camera Rotation: (${cameraRotation.x.toFixed(2)}, ${cameraRotation.y.toFixed(2)}, ${cameraRotation.z.toFixed(2)})
  `;
}

function createCheeseCubes(count) {
  for (let i = 0; i < count; i++) {
    spawnCheese();
  }
}

function spawnCheese() {
  const cheeseGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  const cheeseMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFF00 }); // Yellow color
  const cheese = new THREE.Mesh(cheeseGeometry, cheeseMaterial);
  
  // Adjust the range to cover a larger area
  const range = 500; // Example range, adjust as needed
  cheese.position.set(
    Math.random() * range - range / 2, // Random x position
    0.25, // Slightly above the ground
    Math.random() * range - range / 2  // Random z position
  );
  
  scene.add(cheese);
  cheeses.push(cheese);
}

function checkCheeseCollision() {
  for (let i = cheeses.length - 1; i >= 0; i--) {
    const cheese = cheeses[i];
    if (character.position.distanceTo(cheese.position) < 0.75) { // Collision threshold
      scene.remove(cheese);
      cheeses.splice(i, 1);
      score += 10; // Increase score
      baseSpeed += speedBoost; // Increase speed
      console.log(`Score: ${score}`); // Log score
      updateScoreDisplay(); // Update score display
      spawnCheese(); // Respawn cheese
    }
  }
}

function addScoreDisplay() {
  const scoreDisplay = document.createElement('div');
  scoreDisplay.id = 'scoreDisplay';
  scoreDisplay.style.position = 'absolute';
  scoreDisplay.style.top = '10px';
  scoreDisplay.style.right = '10px';
  scoreDisplay.style.color = 'white';
  scoreDisplay.style.fontFamily = 'monospace';
  scoreDisplay.style.fontSize = '16px';
  scoreDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  scoreDisplay.style.padding = '5px';
  document.body.appendChild(scoreDisplay);
  updateScoreDisplay();
}

function updateScoreDisplay() {
  const scoreDisplay = document.getElementById('scoreDisplay');
  scoreDisplay.innerHTML = `Score: ${score}`;
}

function create3DGrass() {
  const grassGeometry = new THREE.ConeGeometry(0.05, 0.5, 3);
  const grassMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x00ff00,
    shininess: 0,
    specular: 0x000000
  });

  const numClumps = 20000; // Number of grass clumps
  const bladesPerClump = 50; // Number of grass blades per clump
  const numInstances = numClumps * bladesPerClump;
  const instancedGrass = new THREE.InstancedMesh(grassGeometry, grassMaterial, numInstances);

  const dummy = new THREE.Object3D();
  const range = 1000; // Range to match the ground size
  const clumpSize = 5; // Size of each grass clump

  for (let i = 0; i < numClumps; i++) {
    const clumpX = Math.random() * range - range / 2;
    const clumpZ = Math.random() * range - range / 2;

    for (let j = 0; j < bladesPerClump; j++) {
      const x = clumpX + (Math.random() - 0.5) * clumpSize;
      const z = clumpZ + (Math.random() - 0.5) * clumpSize;
      const y = 0.25; // Half the height of the grass

      dummy.position.set(x, y, z);
      dummy.rotation.y = Math.random() * Math.PI;
      dummy.scale.setScalar(0.5 + Math.random() * 0.5); // Random scale between 0.5 and 1
      dummy.updateMatrix();

      instancedGrass.setMatrixAt(i * bladesPerClump + j, dummy.matrix);
    }
  }

  instancedGrass.instanceMatrix.needsUpdate = true;
  scene.add(instancedGrass);
  console.log('Instanced grass clumps added to scene');
}








init();
animate();


