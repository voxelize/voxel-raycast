import {
  WebGLRenderer,
  PerspectiveCamera,
  Scene,
  Vector3,
  BoxBufferGeometry,
  MeshBasicMaterial,
  Mesh,
  MeshNormalMaterial,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { AABB } from '../../dist';

const scene = new Scene();
const camera = new PerspectiveCamera();
const renderer = new WebGLRenderer({ antialias: true });

// camera
camera.position.set(6, 3, -10);
camera.lookAt(new Vector3(0, 0, 0));

// renderer
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x7ec0ee, 1);

// controls
const controls = new OrbitControls(camera, renderer.domElement);

// test
const mat = new MeshNormalMaterial();

const makeBlock = (width, height, depth) => {
  const geo = new BoxBufferGeometry(width, height, depth);
  const mesh = new Mesh(geo, mat);

  return {
    aabb: new AABB(
      -width / 2,
      -height / 2,
      -depth / 2,
      width / 2,
      height / 2,
      depth / 2,
    ),
    mesh,
  };
};

// render loop
const onAnimationFrameHandler = (timeStamp) => {
  controls.update();

  // mesh.rotateY(0.1);
  // mesh.rotateZ(0.1);
  renderer.render(scene, camera);

  window.requestAnimationFrame(onAnimationFrameHandler);
};
window.requestAnimationFrame(onAnimationFrameHandler);

// resize
const windowResizeHanlder = () => {
  const { innerHeight, innerWidth } = window;
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
};
windowResizeHanlder();
window.addEventListener('resize', windowResizeHanlder);

// dom
document.body.style.margin = 0;
document.body.appendChild(renderer.domElement);
