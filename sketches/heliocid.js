// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require("three");

// Include any additional ThreeJS examples below
require("three/examples/js/controls/OrbitControls");

const canvasSketch = require("canvas-sketch");

const settings = {
  // Make the loop animated
  duration: 5,
  animate: true,
  // Get a WebGL canvas rather than 2D
  context: "webgl",
};

const sketch = ({ context }) => {
  // Create a renderer
  const renderer = new THREE.WebGLRenderer({
    canvas: context.canvas,
  });

  // WebGL background color
  renderer.setClearColor("#000", 1);
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  // Setup a camera
  const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 100);
  camera.position.set(0, -4, 0);
  camera.lookAt(new THREE.Vector3());

  // Setup camera controller
  const controls = new THREE.OrbitControls(camera, context.canvas);

  // Setup your scene
  const scene = new THREE.Scene();

  // Setup a geometry
  function heliocid(u, v, target) {
    let alpha = Math.PI * 2 * (u - 0.5);
    let theta = Math.PI * 2 * (v - 0.5);
    let t = 10 * v;
    let bottom = 1 + Math.cosh(alpha) * Math.cosh(theta);

    const x = (Math.sinh(alpha) * Math.cos(t * theta)) / bottom;
    const y = (Math.sinh(alpha) * Math.sin(t * theta)) / bottom;
    const z = (Math.cosh(alpha) * 1.5 * Math.sinh(theta)) / bottom;
    target.set(x, y, z);
  }

  const geometry = new THREE.ParametricGeometry(heliocid, 100, 100);

  // Setup a material
  function getMaterial() {
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xffff00,
      roughness: 0,
      metalness: 0.5,
      clearcoat: 1,
      clearcoatRoughness: 0.4,
      side: THREE.DoubleSide,
    });

    material.onBeforeCompile = function (shader) {
      shader.uniforms.playhead = {
        value: 0,
      };

      shader.fragmentShader = `uniform float playhead;\n` + shader.fragmentShader

      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <logdepthbuf_fragment>",
        `

        float diff = dot(vec3(1), vNormal);
        vec3 a = vec3(0.5, 0.5, 0.5);
        vec3 b = vec3(0.5, 0.5, 0.5);
        vec3 c = vec3(2.0, 1.0, 0);
        vec3 d = vec3(0.5, 0.2, 0.25);

        vec3 cc = a + b * cos(2.0 * 3.1415 * (c * diff + d + playhead * 3.0));

        diffuseColor.rgb = cc;
        ` + "#include <logdepthbuf_fragment>"
      );
    };

    return material;
  }

  const material = getMaterial();

  // Setup a mesh with geometry + material
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // add Balls
  const ballGeom = new THREE.IcosahedronBufferGeometry(0.23, 5)
  const ball1 = new THREE.Mesh(ballGeom, getMaterial())
  ball1.castShadow = ball1.receiveShadow = true
  scene.add(ball1)

  const ball2 = new THREE.Mesh(ballGeom, getMaterial())
  ball2.castShadow = ball2.receiveShadow = true
  scene.add(ball2)
  //light
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const light = new THREE.DirectionalLight(0xffffff, 2);

  light.position.x = 1;
  light.position.y = -10;
  light.position.z = 1;
  light.castShadow = true
  light.shadow.mapSize.width = 2048
  light.shadow.mapSize.height = 2048
  light.shadow.camera.right = 2
  light.shadow.camera.left = -2
  light.shadow.camera.top = 2
  light.shadow.camera.bottom = -2
  // light.shadow.bias = 0.00001

  scene.add(light);
  // draw each frame
  return {
    // Handle resize events here
    resize({ pixelRatio, viewportWidth, viewportHeight }) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(viewportWidth, viewportHeight, false);
      camera.aspect = viewportWidth / viewportHeight;
      camera.updateProjectionMatrix();
    },
    // Update & render your scene here
    render({ time, playhead }) {
      let theta1 = playhead * 2 * Math.PI
      let theta2 = playhead * 2 * Math.PI + Math.PI

      ball1.position.x = 0.5 * Math.sin(theta1)
      ball1.position.y = 0.5 * Math.cos(theta1)

      ball2.position.x = 0.5 * Math.sin(theta2)
      ball2.position.y = 0.5 * Math.cos(theta2)

      mesh.rotation.z = playhead * Math.PI * -2;
      controls.update();
      renderer.render(scene, camera);
    },
    // Dispose of events & renderer for cleaner hot-reloading
    unload() {
      controls.dispose();
      renderer.dispose();
    },
  };
};

canvasSketch(sketch, settings);
