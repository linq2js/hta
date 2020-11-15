import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import stoneObjectURL from "./stone_3.glb";
import logoObjectURL from "./3d.glb";
let mixer;

const clock = new THREE.Clock();
const container = document.getElementById("container");

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xbfe3dd);

const camera = new THREE.PerspectiveCamera(
  40,
  window.innerWidth / window.innerHeight,
  1,
  100
);
camera.position.set(5, 3, 0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(-1, 1, -2.5);
controls.update();
controls.enablePan = false;
controls.enableDamping = true;

scene.add(new THREE.HemisphereLight(0xffffff, 0x000000, 0.4));

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 2, 8);
scene.add(dirLight);

// envmap
const path = "textures/cube/Park2/";
const format = ".jpg";
const envMap = new THREE.CubeTextureLoader().load([
  path + "posx" + format,
  path + "negx" + format,
  path + "posy" + format,
  path + "negy" + format,
  path + "posz" + format,
  path + "negz" + format,
]);

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/examples/js/libs/draco/");

const loader = new GLTFLoader();

loader.setDRACOLoader(dracoLoader);

loader.load(
  logoObjectURL,
  function (gltf) {
    const model = gltf.scene;

    model.scale.set(0.2, 0.2, 0.2);
    model.position.set(1, 1.5, -2);

    scene.add(model);

    mixer = new THREE.AnimationMixer(model);
    mixer.clipAction(gltf.animations[0]).play();

    animate();
  },
  undefined,
  function (e) {
    console.error(e);
  }
);

loader.load(
  stoneObjectURL,
  function (gltf) {
    const model = gltf.scene;

    model.scale.set(0.2, 0.2, 0.2);
    model.position.set(1, 1.5, -2);

    scene.add(model);

    mixer = new THREE.AnimationMixer(model);
    mixer.clipAction(gltf.animations[0]).play();

    animate();
  },
  undefined,
  function (e) {
    console.error(e);
  }
);

window.onresize = function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
};

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  mixer.update(delta);

  controls.update();

  renderer.render(scene, camera);
}
