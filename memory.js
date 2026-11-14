import * as THREE from './vendor/three.module.js';

const duration = 5.4;
const storageKey = 'linlin-birthday:nov14-memory:v1';
const smooth = (start, end, time) => THREE.MathUtils.smoothstep(time, start, end);

export function createBirthdayMemory(room, tableHeight, cake, joy, hand) {
  const pedestal = new THREE.Group();
  pedestal.position.set(2.70, tableHeight + .04, -1.62);
  room.add(pedestal);

  const gold = new THREE.MeshStandardMaterial({color: '#cf9651', metalness: .64, roughness: .36});
  const velvet = new THREE.MeshStandardMaterial({color: '#574039', roughness: .88});
  function addBase(geometry, material, height) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = height;
    mesh.castShadow = mesh.receiveShadow = true;
    pedestal.add(mesh);
  }
  const footprint = [
    [0, .014], [.43, .014], [.49, .05], [.49, .11], [.46, .144], [.36, .163],
    [.30, .21], [.28, .27], [.34, .31], [.40, .33], [.41, .36], [.38, .39], [.28, .34], [0, .33]
  ];
  addBase(new THREE.LatheGeometry(footprint.map(([x,y]) => new THREE.Vector2(x,y)), 64), gold, 0);
  addBase(new THREE.SphereGeometry(.31, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), velvet, .33);
  pedestal.children.at(-1).scale.y = .17;
  // A transparent picking surface matches the saved orb while leaving its glass free to render separately.
  const pickSurface = new THREE.Mesh(new THREE.SphereGeometry(.43, 16, 12),
    new THREE.MeshBasicMaterial({visible: false}));
  pickSurface.position.y = .75;
  pedestal.add(pickSurface);

  const orb = new THREE.Group();
  room.add(orb);
  orb.visible = false;
  const glass = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    vertexShader: [
      'varying vec3 sphereNormal;',
      'varying vec3 eye;',
      'void main() {',
      '  vec4 p = modelViewMatrix * vec4(position, 1.);',
      '  sphereNormal = normalize(normalMatrix * normal);',
      '  eye = normalize(-p.xyz);',
      '  gl_Position = projectionMatrix * p;',
      '}'
    ].join('\n'),
    fragmentShader: [
      'varying vec3 sphereNormal;',
      'varying vec3 eye;',
      'void main() {',
      '  vec3 n = normalize(sphereNormal);',
      '  float rim = pow(1. - max(0., dot(normalize(eye), n)), 1.9);',
      '  float sheen = pow(max(0., dot(n, normalize(vec3(-.53, .63, .62)))), 16.);',
      '  float lower = (1. - smoothstep(-.93, -.25, n.y));',
      '  vec3 gold = mix(vec3(1., .55, .12), vec3(1., .87, .48), rim);',
      '  gl_FragColor = vec4(mix(gold, vec3(1., .99, .83), sheen), min(.96, .12 + rim*.79 + sheen*.60 + lower*.18));',
      '  #include <colorspace_fragment>',
      '}'
    ].join('\n')
  });
  const contents = new THREE.Mesh(new THREE.SphereGeometry(.98, 48, 28), glass);
  contents.renderOrder = 3;
  orb.add(contents);

  const image = document.createElement('canvas');
  image.width = image.height = 256;
  const photo = new THREE.CanvasTexture(image);
  photo.colorSpace = THREE.SRGBColorSpace;
  const portrait = new THREE.Sprite(new THREE.SpriteMaterial({map: photo, depthWrite: false, opacity: .97}));
  portrait.scale.set(1.83, 1.83, 1);
  portrait.renderOrder = 2;
  orb.add(portrait);

  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = glowCanvas.height = 64;
  const glowBrush = glowCanvas.getContext('2d');
  const glowFill = glowBrush.createRadialGradient(32,32,0,32,32,32);
  glowFill.addColorStop(0, '#ffc050b8');
  glowFill.addColorStop(.40, '#ffaf474b');
  glowFill.addColorStop(1, '#ffb24400');
  glowBrush.fillStyle = glowFill;
  glowBrush.fillRect(0,0,64,64);
  const glowMap = new THREE.CanvasTexture(glowCanvas);
  glowMap.colorSpace = THREE.SRGBColorSpace;
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({map: glowMap, transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false, opacity: .9}));
  halo.scale.set(3.35, 3.35, 1);
  halo.renderOrder = 4;
  orb.add(halo);
  const orbLight = new THREE.PointLight('#ffac52', 0, 7, 2);
  orb.add(orbLight);

  const count = 65;
  const stars = new Float32Array(count * 3);
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.BufferAttribute(stars, 3));
  const starlight = new THREE.PointsMaterial({
    color: '#ffd484', map: glowMap, size: .12, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const sparks = new THREE.Points(starGeometry, starlight);
  sparks.visible = false;
  sparks.frustumCulled = false;
  room.add(sparks);

  const start = new THREE.Vector3(cake.position.x, tableHeight + 2.70, cake.position.z + .05);
  const collection = pedestal.position.clone().add(new THREE.Vector3(0, .75, 0));
  const held = new THREE.Vector3();
  const current = new THREE.Vector3();
  const firstArc = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const handLocal = new THREE.Vector3(.43, .28, .08);
  let phase = 'idle';
  let since = 0;
  let collected = false;
  let snapshotReady = false;

  function imprint(canvas) {
    const ctx = image.getContext('2d');
    const side = Math.min(canvas.width * .83, canvas.height * .78);
    ctx.clearRect(0, 0, 256, 256);
    ctx.save();
    ctx.beginPath();
    ctx.arc(128, 128, 127, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#e89434';
    ctx.fillRect(0, 0, 256, 256);
    if (side > 0) ctx.drawImage(canvas,
      (canvas.width - side) * .5, (canvas.height - side) * .53, side, side, 0, 0, 256, 256);
    ctx.fillStyle = '#dc801928';
    ctx.fillRect(0, 0, 256, 256);
    const light = ctx.createRadialGradient(110, 99, 20, 128, 128, 128);
    light.addColorStop(0, '#fff4b800');
    light.addColorStop(.66, '#ffc96121');
    light.addColorStop(1, '#ffa636ed');
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, 256, 256);
    ctx.restore();
    photo.needsUpdate = true;
    snapshotReady = true;
  }

  function restore(onRestore) {
    let saved;
    try { saved = localStorage.getItem(storageKey); } catch { return; }
    if (!saved?.startsWith('data:image/webp;base64,') && !saved?.startsWith('data:image/png;base64,')) return;
    const still = new Image();
    still.onload = () => {
      if (phase !== 'idle') return;
      const ctx = image.getContext('2d');
      ctx.clearRect(0, 0, 256, 256);
      ctx.drawImage(still, 0, 0, 256, 256);
      photo.needsUpdate = true;
      snapshotReady = true;
      finish();
      onRestore();
    };
    still.src = saved;
  }

  function finish() {
    phase = 'saved';
    collected = true;
    orb.visible = true;
    orb.position.copy(collection);
    orb.scale.setScalar(.41);
    orbLight.intensity = .8;
    sparks.visible = false;
  }

  function startFinale(now, canvas, reduced) {
    if (!snapshotReady) imprint(canvas);
    since = now;
    phase = 'playing';
    if (reduced) save();
  }

  function save() {
    finish();
    try { localStorage.setItem(storageKey, image.toDataURL('image/webp', .82)); } catch {
      // The orb can still be kept for this visit if browser storage is unavailable.
    }
  }

  function update(now, reduced) {
    if (phase !== 'playing') return false;
    const elapsed = Math.max(0, (now - since) / 1000);
    if (reduced || elapsed >= duration) {
      save();
      return true;
    }

    const flight = smooth(1.48, 3.32, elapsed);
    const drop = smooth(3.78, 5.13, elapsed);
    held.copy(handLocal);
    hand.localToWorld(held);
    room.worldToLocal(held);
    held.x += .25;
    held.z += .27;
    held.y += .19;
    firstArc.copy(start).lerp(held, flight);
    firstArc.y += Math.sin(Math.PI * flight) * .66;
    current.copy(firstArc).lerp(collection, drop);
    current.y += Math.sin(Math.PI * drop) * .58;
    orb.position.copy(current);
    orb.visible = elapsed > .30;
    const formation = smooth(.30, 1.30, elapsed);
    orb.scale.setScalar((.035 + .49 * formation) * (1 - .22 * drop));
    orbLight.intensity = (.55 + 2.5 * formation) * (1 - .60 * drop);

    sparks.visible = elapsed > .04 && elapsed < 5.16;
    starlight.opacity = (1 - smooth(4.43, 5.16, elapsed)) * .91;
    for (let i = 0; i < count; i++) {
      const radius = (1 - formation) * (.65 + (i % 11) * .16) + .56 - drop * .30;
      const theta = i * 2.399963 + elapsed * (.58 + (i % 7) * .13);
      const y = Math.sin(i * 1.22 + elapsed * 1.8) * radius;
      direction.set(Math.cos(theta) * radius, y * .52, Math.sin(theta) * radius);
      if (i % 4 === 0) direction.multiplyScalar(.55);
      direction.add(current).toArray(stars, i * 3);
    }
    starGeometry.attributes.position.needsUpdate = true;
    return false;
  }
  return {
    pedestal,
    orbit: {x: (joy.position.x + pedestal.position.x) * .50 - .83, y: tableHeight + 1.04, z: -.71},
    get phase() { return phase; },
    get collected() { return collected; },
    start: startFinale,
    restore,
    update
  };
}
