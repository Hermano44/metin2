import * as THREE from 'three';

const game = document.querySelector('#game');
const loading = document.querySelector('#loading');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9bb7c2);
scene.fog = new THREE.Fog(0x9bb7c2, 28, 95);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 180);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
game.prepend(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xddeeff, 0x52613b, 2));
const sun = new THREE.DirectionalLight(0xffe2b3, 2.2);
sun.position.set(-18, 30, 15);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
scene.add(sun);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(180, 180),
  new THREE.MeshStandardMaterial({ color: 0x647b48, roughness: 1 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const grid = new THREE.GridHelper(180, 45, 0x536644, 0x71845c);
grid.position.y = 0.015;
grid.material.transparent = true;
grid.material.opacity = 0.16;
scene.add(grid);

function makeTree(x, z, scale = 1) {
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.16, .23, 1.6, 7), new THREE.MeshStandardMaterial({ color: 0x60452c }));
  trunk.position.set(x, .8 * scale, z);
  trunk.scale.setScalar(scale);
  trunk.castShadow = true;
  scene.add(trunk);
  const crown = new THREE.Mesh(new THREE.ConeGeometry(1.05, 2.8, 7), new THREE.MeshStandardMaterial({ color: 0x35583a, roughness: 1 }));
  crown.position.set(x, 2.65 * scale, z);
  crown.scale.setScalar(scale);
  crown.castShadow = true;
  scene.add(crown);
}
for (let i = 0; i < 34; i++) {
  const a = (i / 34) * Math.PI * 2;
  const r = 17 + (i % 4) * 2.2;
  makeTree(Math.cos(a) * r, Math.sin(a) * r, .8 + (i % 3) * .16);
}

const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(1.15, 0), new THREE.MeshStandardMaterial({ color: 0x756b68, roughness: 1 }));
stone.position.set(5, 1, -8);
stone.castShadow = true;
scene.add(stone);

const player = new THREE.Group();
const body = new THREE.Mesh(new THREE.CapsuleGeometry(.42, .85, 4, 8), new THREE.MeshStandardMaterial({ color: 0x9b2930, roughness: .8 }));
body.position.y = 1.05;
body.castShadow = true;
player.add(body);
const head = new THREE.Mesh(new THREE.SphereGeometry(.3, 12, 10), new THREE.MeshStandardMaterial({ color: 0xd3a47c }));
head.position.y = 1.85;
head.castShadow = true;
player.add(head);
const sword = new THREE.Mesh(new THREE.BoxGeometry(.09, .9, .13), new THREE.MeshStandardMaterial({ color: 0xc5cbd0, metalness: .7, roughness: .3 }));
sword.position.set(.48, 1.1, -.05);
sword.rotation.z = -.25;
player.add(sword);
scene.add(player);

let cameraAngle = 0;
let cameraDistance = 7;
const keys = {};
let joyX = 0, joyY = 0;
let draggingLook = false, lastX = 0;
const joystick = document.querySelector('#joystick');
const stick = document.querySelector('#stick');
let joyPointer = null;

joystick.addEventListener('pointerdown', e => { joyPointer = e.pointerId; joystick.setPointerCapture(e.pointerId); updateJoy(e); });
joystick.addEventListener('pointermove', e => { if (e.pointerId === joyPointer) updateJoy(e); });
function endJoy(e) { if (e.pointerId !== joyPointer) return; joyPointer = null; joyX = joyY = 0; stick.style.transform = 'translate(0,0)'; }
joystick.addEventListener('pointerup', endJoy);
joystick.addEventListener('pointercancel', endJoy);
function updateJoy(e) {
  const r = joystick.getBoundingClientRect();
  const dx = e.clientX - (r.left + r.width / 2);
  const dy = e.clientY - (r.top + r.height / 2);
  const len = Math.hypot(dx, dy);
  const max = 34;
  const nx = len > max ? dx / len * max : dx;
  const ny = len > max ? dy / len * max : dy;
  joyX = nx / max; joyY = ny / max;
  stick.style.transform = `translate(${nx}px,${ny}px)`;
}
const lookArea = document.querySelector('#look-area');
lookArea.addEventListener('pointerdown', e => { draggingLook = true; lastX = e.clientX; lookArea.setPointerCapture(e.pointerId); });
lookArea.addEventListener('pointermove', e => { if (!draggingLook) return; cameraAngle -= (e.clientX - lastX) * .008; lastX = e.clientX; });
lookArea.addEventListener('pointerup', () => draggingLook = false);
lookArea.addEventListener('pointercancel', () => draggingLook = false);
addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), .04);
  let x = joyX, z = joyY;
  if (keys.w || keys.arrowup) z -= 1;
  if (keys.s || keys.arrowdown) z += 1;
  if (keys.a || keys.arrowleft) x -= 1;
  if (keys.d || keys.arrowright) x += 1;
  const input = new THREE.Vector2(x, z);
  if (input.length() > 1) input.normalize();
  if (input.lengthSq() > .01) {
    const forward = new THREE.Vector3(-Math.sin(cameraAngle), 0, -Math.cos(cameraAngle));
    const right = new THREE.Vector3(Math.cos(cameraAngle), 0, -Math.sin(cameraAngle));
    const move = right.multiplyScalar(input.x).add(forward.multiplyScalar(-input.y));
    player.position.addScaledVector(move, dt * 4.2);
    player.rotation.y = Math.atan2(move.x, move.z);
  }
  const target = new THREE.Vector3(player.position.x + Math.sin(cameraAngle) * cameraDistance, 4.1, player.position.z + Math.cos(cameraAngle) * cameraDistance);
  camera.position.lerp(target, 1 - Math.pow(.001, dt));
  camera.lookAt(player.position.x, 1.2, player.position.z);
  renderer.render(scene, camera);
}
animate();
loading?.remove();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});