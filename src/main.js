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

// Natural terrain: subtle rolling ground instead of a visible debug grid.
const terrain = ground.geometry;
const pos = terrain.attributes.position;
for (let i=0;i<pos.count;i++) {
  const x=pos.getX(i), z=pos.getY(i);
  const h=(Math.sin(x*.11)+Math.cos(z*.13))*.22 + Math.sin((x+z)*.07)*.18;
  pos.setZ(i,h);
}
terrain.computeVertexNormals();


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
for (let i = 0; i < 54; i++) {
  const a = (i / 54) * Math.PI * 2;
  const r = 25 + (i % 5) * 2.4;
  makeTree(Math.cos(a) * r, Math.sin(a) * r, .85 + (i % 3) * .18);
}

function villageMaterial(color, roughness = .9) {
  return new THREE.MeshStandardMaterial({ color, roughness });
}
const wood = villageMaterial(0x493021);
const plaster = villageMaterial(0xb7a17b);
const roofMat = villageMaterial(0x49383a);
const stoneMat = villageMaterial(0x77766d);
const warmWindow = new THREE.MeshStandardMaterial({ color: 0xffc66e, emissive: 0xff8a24, emissiveIntensity: .65 });
function villageBox(w,h,d,mat,x,y,z, parent=scene) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
  m.position.set(x,y,z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
function makeHouse(x,z,scale=1,turn=0) {
  const house = new THREE.Group();
  house.position.set(x,0,z); house.rotation.y=turn; house.scale.setScalar(scale); scene.add(house);
  const darkWood = villageMaterial(0x38251d);
  const redWood = villageMaterial(0x70402b);
  const paper = villageMaterial(0xd9c9a4);
  const roofTile = new THREE.MeshStandardMaterial({color:0x263849,roughness:.82,side:THREE.DoubleSide});
  const gold = villageMaterial(0xb58b4b);

  // Stone base and timber-framed walls.
  villageBox(5.5,.38,4.5,stoneMat,0,.28,0,house);
  villageBox(5.05,2.65,4.05,paper,0,1.78,0,house);
  for(const px of [-2.42,0,2.42]) villageBox(.2,3,.22,darkWood,px,1.75,2.08,house);
  for(const zz of [-1.95,0,1.95]) villageBox(5,.18,.2,darkWood,0,3.02,zz,house);

  // Veranda and shoji entrance.
  villageBox(5.35,.18,.72,redWood,0,.58,2.45,house);
  for(const px of [-2.25,2.25]) villageBox(.16,2.35,.16,darkWood,px,1.75,2.7,house);
  villageBox(1.65,2.05,.12,darkWood,0,1.55,2.16,house);
  for(const px of [-.37,.37]) {
    villageBox(.68,1.82,.055,paper,px,1.56,2.24,house);
    for(let k=0;k<5;k++) villageBox(.035,1.78,.035,redWood,px-.27+k*.135,1.56,2.28,house);
    for(let k=0;k<5;k++) villageBox(.66,.035,.035,redWood,px,.83+k*.36,2.28,house);
  }
  for(const wx of [-1.72,1.72]) {
    villageBox(.92,1.12,.1,darkWood,wx,1.95,2.15,house);
    villageBox(.72,.92,.045,warmWindow,wx,1.95,2.22,house);
    for(let k=0;k<5;k++) villageBox(.035,.96,.035,redWood,wx-.3+k*.15,1.95,2.26,house);
    for(let k=0;k<5;k++) villageBox(.76,.035,.035,redWood,wx,1.95-.38+k*.19,2.26,house);
  }

  // One-piece solid roof slopes. Each panel overlaps at the ridge and eaves,
  // so no floating tile strips or disconnected roof fragments are possible.
  const roofLength=4.15, roofDepth=6.35, roofAngle=.43;
  for(const side of [-1,1]) {
    const panel=new THREE.Mesh(new THREE.BoxGeometry(roofLength,.32,roofDepth),roofTile);
    panel.position.set(side*1.78,4.12,0);
    panel.rotation.z=-side*roofAngle;
    panel.castShadow=true; panel.receiveShadow=true; house.add(panel);
    // Dark wooden fascia follows the outer eave.
    const fascia=new THREE.Mesh(new THREE.BoxGeometry(.22,.34,roofDepth+.18),redWood);
    fascia.position.set(side*3.55,3.34,0);
    fascia.rotation.z=-side*roofAngle;
    fascia.castShadow=true; house.add(fascia);
  }
  // Continuous ridge cap and front triangular gable.
  villageBox(.34,.32,6.48,darkWood,0,4.98,0,house);
  const gableShape=new THREE.Shape();
  gableShape.moveTo(-2.45,0); gableShape.lineTo(0,1.48); gableShape.lineTo(2.45,0); gableShape.closePath();
  const gable=new THREE.Mesh(new THREE.ShapeGeometry(gableShape),redWood);
  gable.position.set(0,3.02,2.13); gable.castShadow=true; house.add(gable);
  villageBox(.12,.9,.12,darkWood,0,3.68,2.17,house);
  for(const side of [-1,1]) for(const zz of [-3.12,3.12]) {
    const cap=new THREE.Mesh(new THREE.SphereGeometry(.14,8,6),gold);
    cap.position.set(side*3.52,3.42,zz); house.add(cap);
  }
  return house;
}
makeHouse(-4,-9,1.15,.35);
makeHouse(5,-13,1.0,-.25);
makeHouse(-12,5,.95,.65);
makeHouse(13,7,.9,-.45);
// Worn dirt road through the village
const road = new THREE.Mesh(new THREE.PlaneGeometry(8,48), villageMaterial(0x8b7959));
road.rotation.x=-Math.PI/2; road.position.set(0,.025,-2); scene.add(road);
const road2 = new THREE.Mesh(new THREE.PlaneGeometry(38,7), villageMaterial(0x8b7959));
road2.rotation.x=-Math.PI/2; road2.position.set(0,.03,0); scene.add(road2);
// Stone edging and scattered paving stones
for(let i=0;i<28;i++){
  const z=-23+i*1.65;
  for(const side of [-1,1]){
    const pebble=new THREE.Mesh(new THREE.DodecahedronGeometry(.22+(i%3)*.04,0),stoneMat);
    pebble.position.set(side*(4.3+(i%2)*.18),.12,z); pebble.scale.y=.45; pebble.castShadow=true; scene.add(pebble);
  }
}
function makeLantern(x,z){
  const post=new THREE.Mesh(new THREE.CylinderGeometry(.09,.13,2.7,7),wood); post.position.set(x,1.35,z); post.castShadow=true; scene.add(post);
  const lamp=new THREE.Mesh(new THREE.BoxGeometry(.48,.55,.48),warmWindow); lamp.position.set(x,2.65,z); scene.add(lamp);
  const light=new THREE.PointLight(0xffa94f,1.1,8); light.position.set(x,2.7,z); scene.add(light);
}
makeLantern(-4,-2); makeLantern(4,-8); makeLantern(4,8); makeLantern(-5,-12);
// A small stone well in the village square
const well = new THREE.Mesh(new THREE.CylinderGeometry(1.15,1.25,.8,12),stoneMat);
well.position.set(3,.4,-2); well.castShadow=true; well.receiveShadow=true; scene.add(well);
const water = new THREE.Mesh(new THREE.CircleGeometry(.92,16),new THREE.MeshStandardMaterial({color:0x426d7a,metalness:.25,roughness:.25}));
water.rotation.x=-Math.PI/2; water.position.set(3,.83,-2); scene.add(water);

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