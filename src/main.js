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
const armor = new THREE.MeshStandardMaterial({ color: 0x87343b, metalness: .28, roughness: .62 });
const darkSteel = new THREE.MeshStandardMaterial({ color: 0x303b49, metalness: .72, roughness: .32 });
const steel = new THREE.MeshStandardMaterial({ color: 0xb9c4ce, metalness: .82, roughness: .24 });
const skin = new THREE.MeshStandardMaterial({ color: 0xc99570, roughness: .9 });
const leather = new THREE.MeshStandardMaterial({ color: 0x493126, roughness: .95 });
function part(geometry, material, position, rotation = null) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  if (rotation) mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  player.add(mesh);
  return mesh;
}
// Boots and legs
part(new THREE.BoxGeometry(.34,.42,.42), leather, [-.23,.24,0]);
part(new THREE.BoxGeometry(.34,.42,.42), leather, [.23,.24,0]);
part(new THREE.CylinderGeometry(.17,.2,.58,7), darkSteel, [-.23,.72,0]);
part(new THREE.CylinderGeometry(.17,.2,.58,7), darkSteel, [.23,.72,0]);
// Armored torso, waist and chest plate
part(new THREE.CylinderGeometry(.36,.48,.82,8), armor, [0,1.35,0]);
part(new THREE.BoxGeometry(.76,.18,.48), leather, [0,.96,0]);
part(new THREE.BoxGeometry(.58,.62,.12), darkSteel, [0,1.4,.27]);
part(new THREE.BoxGeometry(.16,.62,.055), steel, [0,1.4,.345]);
part(new THREE.BoxGeometry(.58,.12,.07), steel, [0,1.68,.34]);
// Shoulders and arms
part(new THREE.SphereGeometry(.27,8,7), steel, [-.49,1.72,0]);
part(new THREE.SphereGeometry(.27,8,7), steel, [.49,1.72,0]);
part(new THREE.CylinderGeometry(.13,.17,.55,7), armor, [-.55,1.3,0], [0,0,-.12]);
part(new THREE.CylinderGeometry(.13,.17,.55,7), armor, [.55,1.3,0], [0,0,.12]);
part(new THREE.SphereGeometry(.14,8,7), skin, [-.58,1.0,0]);
part(new THREE.SphereGeometry(.14,8,7), skin, [.58,1.0,0]);
// Head, hair and simple warrior helmet
part(new THREE.SphereGeometry(.27,12,10), skin, [0,2.02,0]);
part(new THREE.SphereGeometry(.285,10,7,0,Math.PI*2,0,Math.PI*.55), leather, [0,2.12,0]);
part(new THREE.BoxGeometry(.58,.12,.38), steel, [0,2.18,0]);
part(new THREE.ConeGeometry(.12,.32,6), steel, [0,2.38,0]);
// Sword in right hand
const weapon = new THREE.Group();
const blade = new THREE.Mesh(new THREE.BoxGeometry(.105,.92,.055), steel);
blade.position.y = .53; weapon.add(blade);
const guard = new THREE.Mesh(new THREE.BoxGeometry(.42,.075,.12), darkSteel);
guard.position.y = .08; weapon.add(guard);
const grip = new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,.28,7), leather);
grip.position.y = -.09; weapon.add(grip);
weapon.position.set(.7,.82,-.02);
weapon.rotation.z = -.2;
weapon.traverse(o => { if (o.isMesh) o.castShadow = true; });
player.add(weapon);
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