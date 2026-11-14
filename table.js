import { moments } from './timeline.js?v=memory-loop';
import * as T from './vendor/three.module.js';

export function createBirthdayScene(stage) {
const scene = new T.Scene();
scene.background = new T.Color('#312120');
scene.fog = new T.FogExp2('#3d2b27', 0.027);
const renderer = new T.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false;
renderer.shadowMap.needsUpdate = true;
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.26;
stage.append(renderer.domElement);

const camera = new T.PerspectiveCamera(37, 1, 0.1, 65);
const target = new T.Vector3(0, 1.35, 0.14);
const scale = (x, y, z) => new T.Vector3(x, y, z);
const item = (parent, geometry, material, x, y, z, shadow = true) => {
  const mesh = new T.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = shadow;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
};
const group = (parent, x, y, z) => {
  const node = new T.Group();
  node.position.set(x, y, z);
  parent.add(node);
  return node;
};
const mat = (color, roughness = .56, metalness = 0) => new T.MeshStandardMaterial({color, roughness, metalness});
const sphere = new T.SphereGeometry(1, 26, 18);
const round = (parent, m, x, y, z, sx, sy, sz) => {
  const mesh = item(parent, sphere, m, x, y, z);
  mesh.scale.copy(scale(sx, sy, sz));
  return mesh;
};
const box = (parent,m,x,y,z,w,h,d,shadow=true) =>
  item(parent,new T.BoxGeometry(w,h,d),m,x,y,z,shadow);
const cylinder = (parent,m,x,y,z,rt,rb,h,segments=48) =>
  item(parent,new T.CylinderGeometry(rt,rb,h,segments),m,x,y,z);
function rod(parent,m,from,to,radius,segments=20) {
  const a = new T.Vector3(...from), b = new T.Vector3(...to);
  const direction = b.clone().sub(a);
  const mid = a.clone().add(b).multiplyScalar(.5);
  const mesh = cylinder(parent,m,mid.x,mid.y,mid.z,radius,radius,direction.length(),segments);
  mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),direction.normalize());
  return mesh;
}
function tube(parent,m,points,radius) {
  const curve = new T.CatmullRomCurve3(points.map((v) => new T.Vector3(...v)));
  return item(parent,new T.TubeGeometry(curve,24,radius,10,false),m,0,0,0);
}
function lathe(parent,m,x,y,z,points) {
  return item(parent,new T.LatheGeometry(points.map(([r,h])=>new T.Vector2(r,h)),96),m,x,y,z);
}
function texture(size, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  draw(canvas.getContext('2d'), size);
  const map = new T.CanvasTexture(canvas);
  map.colorSpace = T.SRGBColorSpace;
  map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return map;
}
function random(seed) {
  return () => {
    seed = (Math.imul(seed,1664525)+1013904223) >>> 0;
    return seed / 4294967296;
  };
}

const room = group(scene,0,0,0);
const tableHeight = 1.03;
const woodMap = texture(1024,(ctx,s) => {
  const rng = random(1411);
  ctx.fillStyle='#8c563d';
  ctx.fillRect(0,0,s,s);
  for(let j=0;j<8;j++){
    const y = j*s/8;
    const light = Math.round(rng()*18);
    ctx.fillStyle='rgb('+(118+light)+','+(65+light)+','+(42+light)+')';
    ctx.fillRect(0,y,s,s/8-2);
    ctx.fillStyle='#e2b08766';
    ctx.fillRect(0,y+1,s,1);
  }
  for(let i=0;i<6600;i++){
    const x=rng()*s, y=rng()*s, length=30+rng()*460;
    ctx.strokeStyle=rng()>.53?'rgba(251,206,153,'+rng()*.14+')':'rgba(33,17,13,'+rng()*.26+')';
    ctx.lineWidth=.28+rng()*1.75;
    ctx.beginPath(); ctx.moveTo(x,y);
    ctx.bezierCurveTo(x+length*.3,y+Math.sin(i)*5,x+length*.72,y+Math.sin(i*.38)*8,x+length,y+Math.sin(i*.18)*3);
    ctx.stroke();
  }
});
const maple = mat('#ffffff',.48);
maple.map = woodMap;
const umber = mat('#643927',.49);
const trim = mat('#a16745',.45);
const floor = mat('#553b31',.89);
const wallpaper = mat('#9a7566',.95);
const frameWood = mat('#543426',.7);
box(room,floor,0,-1.41,-2,40,.2,32,false);
box(room,wallpaper,0,4,-5.8,34,13,.22,false);
box(room,frameWood,0,-.9,-5.62,32,.55,.2,false);
for(let x=-15;x<=15;x+=1.8){
  box(room,mat('#aa8373',.92),x,4,-5.67,.026,12,.035,false);
}
box(room,maple,0,.88,0,10.8,.30,6.75);
for(const z of [-3.39,3.39]) box(room,trim,0,.87,z,10.84,.12,.065);
for(const x of [-5.42,5.42]) box(room,trim,x,.87,0,.065,.12,6.82);
box(room,umber,0,.58,3.08,10.2,.36,.19);
box(room,umber,0,.58,-3.08,10.2,.36,.19);
for(const x of [-4.7,4.7]) for(const z of [-2.9,2.9]){
  box(room,umber,x,-.26,z,.4,1.79,.43);
}
const clothMap=texture(256,(ctx,s)=>{
  ctx.fillStyle='#ae6665'; ctx.fillRect(0,0,s,s);
  for(let i=1;i<s;i+=3){
    ctx.strokeStyle=i%2?'#efd5c138':'#653f3b34';
    ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,s);ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,i);ctx.lineTo(s,i);ctx.stroke();
  }
  ctx.strokeStyle='#e7ad97';
  ctx.setLineDash([3,4]); ctx.strokeRect(6,6,s-12,s-12);
});
const clothMat=mat('#ffffff',.98);
clothMat.map=clothMap;
const cloth=box(room,clothMat,.2,tableHeight+.014,.16,5.45,.027,4.9,false);
cloth.rotation.y=-.066;

const bunting=group(room,0,3.60,-5.49);
const buntingY=(x)=>.063*x*x-.57;
const twine=mat('#a6795b',.9);
tube(bunting,twine,[-5,-3,0,3,5].map((x)=>[x,buntingY(x),0]),.022);
const flags=['#ad5e52','#e7ad5f','#668778','#d37b66','#cb9b61','#5e8574','#b96359'];
for(let n=0;n<flags.length;n++){
  const x=-4.15+n*1.36, y=buntingY(x);
  const pennant=new T.Shape();
  pennant.moveTo(-.49,0);pennant.lineTo(.49,0);pennant.lineTo(.08,-.8);pennant.closePath();
  const fabric=mat(flags[n],.92);fabric.side=T.DoubleSide;
  const mesh=item(bunting,new T.ExtrudeGeometry(pennant,{depth:.014,bevelEnabled:false}),fabric,x,y,.03);
  mesh.rotation.z=Math.atan(.126*x);
}
const windowFrame=group(room,-6.5,4.35,-5.52);
const blue=mat('#657484',.67);
box(windowFrame,frameWood,0,0,0,2.12,2.58,.11,false);
box(windowFrame,blue,0,0,.065,1.94,2.36,.065,false);
box(windowFrame,frameWood,0,0,.11,.06,2.4,.06,false);
box(windowFrame,frameWood,0,0,.11,2,.06,.06,false);

const porcelain=mat('#fff0de',.34);
const butter=mat('#ffdfa8',.64);
const pink=mat('#df8a93',.6);
const jam=mat('#a74453',.55);
const frosting=mat('#fff3dc',.57);
const berry=mat('#b72742',.35);
const berryDark=mat('#981c33',.47);
const leaf=mat('#507346',.78);
const seed=mat('#f1c17a',.6);
const brass=mat('#c79b5e',.35,.6);

const cakeHit=group(room,.23,tableHeight,.14);
lathe(cakeHit,porcelain,0,0,0,[[0,0],[.72,0],[.76,.04],[.69,.1],[.56,.12],[.44,.19],[.42,.3],[.59,.37],[1.12,.4],[1.7,.42],[1.8,.46],[1.8,.52],[1.7,.56],[.2,.56],[0,.56]]);
lathe(cakeHit,brass,0,0,0,[[1.78,.465],[1.810,.477],[1.81,.492],[1.78,.502]]);
function cakeLayer(m,y,h,r){
  return lathe(cakeHit,m,0,y,0,[[0,0],[r-.08,0],[r-.017,.018],[r,.045],[r,h-.025],[r-.025,h],[0,h]]);
}
cakeLayer(butter,.55,.40,1.39);
cakeLayer(jam,.91,.12,1.405);
cakeLayer(pink,1.02,.15,1.41);
cakeLayer(jam,1.16,.105,1.404);
cakeLayer(butter,1.25,.39,1.395);
lathe(cakeHit,frosting,0,1.52,0,[[0,0],[1.31,0],[1.407,.012],[1.43,.12],[1.414,.18],[1.367,.217],[1.23,.239],[0,.239]]);
const dripPositions=[],dripIndices=[];
for(let i=0;i<=96;i++){
  const a=i/96*Math.PI*2;
  const wave=Math.pow(.5+.5*Math.cos(a*10+.38*Math.sin(a*3)),2.5);
  const end=1.55-.185*wave-.045*Math.sin(3*a)**2;
  for(const [r,h] of [[1.418,1.66],[1.429,end+.023],[1.402,end]]){
    dripPositions.push(r*Math.cos(a),h,r*Math.sin(a));
  }
  if(i===0) continue;
  for(let j=0;j<2;j++){
    const k=(i-1)*3+j;
    dripIndices.push(k,k+1,k+3,k+1,k+4,k+3);
  }
}
const dripGeometry=new T.BufferGeometry();
dripGeometry.setAttribute('position',new T.Float32BufferAttribute(dripPositions,3));
dripGeometry.setIndex(dripIndices); dripGeometry.computeVertexNormals();
const dripMaterial=frosting.clone(); dripMaterial.side=T.DoubleSide;
item(cakeHit,dripGeometry,dripMaterial,0,0,0);
for(let i=0;i<12;i++){
  const a=i/12*Math.PI*2;
  const x=1.19*Math.cos(a),z=1.19*Math.sin(a);
  const puff=group(cakeHit,x,1.75,z);
  round(puff,frosting,0,.022,0,.134,.061,.134);
  for(let j=0;j<8;j++){
    const b=j*Math.PI/4;
    const petal=round(puff,frosting,Math.cos(b)*.062,.068,Math.sin(b)*.062,.058,.059,.046);
    petal.rotation.y=-b;
  }
  round(puff,frosting,0,.113,0,.074,.081,.074);
}
const berrySeedGeo=new T.SphereGeometry(1,7,5);
for(let i=0;i<7;i++){
  const a=(i+.16)/7*Math.PI*2;
  const fruit=group(cakeHit,1.00*Math.cos(a),1.88,1.00*Math.sin(a));
  fruit.rotation.z=.33*Math.cos(a);fruit.rotation.x=-.3*Math.sin(a);
  lathe(fruit,i%3===0?berryDark:berry,0,0,0,[[0,-.14],[.066,-.125],[.125,-.061],[.163,.018],[.159,.083],[.114,.119],[0,.123]]);
  for(let j=0;j<23;j++){
    const b=j*2.399963, h=-.095+(j%6)*.034, r=.162-(h<0?Math.abs(h)*.66:h*.25);
    const dot=item(fruit,berrySeedGeo,seed,r*Math.cos(b),h,r*Math.sin(b),false);
    dot.scale.set(.009,.014,.009);
  }
  for(let j=0;j<5;j++){
    const b=j*(Math.PI*2/5);
    const tip=round(fruit,leaf,.073*Math.cos(b),.104,.073*Math.sin(b),.097,.012,.035);
    tip.rotation.y=-b;
  }
}
const candleMap=texture(128,(ctx,s)=>{
  ctx.fillStyle='#ffe6d6';ctx.fillRect(0,0,s,s);
  ctx.strokeStyle='#c47079';ctx.lineWidth=13;
  for(let i=-4;i<=8;i++){
    ctx.beginPath();ctx.moveTo(i*32,-5);ctx.lineTo(i*32-s,s+5);ctx.stroke();
  }
});
candleMap.repeat.set(1,2);
candleMap.wrapT=T.RepeatWrapping;
const wax=mat('#ffffff',.49);wax.map=candleMap;
const flameMat=new T.MeshStandardMaterial({color:'#ffba58',emissive:'#ff7e19',emissiveIntensity:2.2,roughness:.48});
const flameCore=new T.MeshBasicMaterial({color:'#fff0b2'});
const wick=mat('#5a392d',.94);
const flames=[];
const candleGlow = new T.PointLight('#ffaf55',3.9,5,2);
candleGlow.position.set(.1,3.0,.15);cakeHit.add(candleGlow);
for(const [x,z,h] of [[-.43,.06,.58],[.005,-.37,.78],[.43,.04,.61]]){
  const candle=group(cakeHit,x,1.75,z);
  cylinder(candle,wax,0,h*.5,0,.059,.065,h,32);
  cylinder(candle,frosting,0,h,0,.058,.058,.015,32);
  cylinder(candle,wick,0,h+.038,0,.012,.012,.075,12);
  const flame=group(candle,0,h+.065,0);
  const tip=lathe(flame,flameMat,0,0,0,[[0,-.01],[.035,.006],[.054,.053],[.052,.099],[.029,.173],[0,.23]]);
  tip.castShadow=false;
  round(flame,flameCore,0,.050,.040,.022,.053,.011).castShadow=false;
  flames.push(flame);
}


const joyHit=group(room,2.55,tableHeight + .07,-.54);
const toy=group(joyHit,0,.16,0);toy.rotation.y=-.11;
const skin=mat('#f0bc49',.56);
const shoe=mat('#d7a53c',.52);
const hair=mat('#207ab3',.36);
const hairLight=mat('#3c9dc4',.38);
const dress=mat('#adc948',.67);
const grass=mat('#759e48',.76);
const whites=mat('#fff7da',.43);
const iris=mat('#2e82b9',.41);
const pupil=mat('#233b54',.39);
const mouth=mat('#743442',.59);
const cheeks=mat('#e88859',.68);
for(const x of [-.14,.14]){
  rod(toy,skin,[x,.06,0],[x,.55,0],.053);
  round(toy,shoe,x,.07,.066,.092,.062,.145);
}
lathe(toy,dress,0,.36,0,[[0,0],[.34,0],[.369,.034],[.325,.12],[.258,.29],[.212,.50],[.17,.69],[.19,.76],[.162,.80],[0,.80]]);
for(const [x,y,a] of [[-.126,.67,.8],[.12,.80,.95],[.017,.55,.9],[.23,.49,.75],[-.22,.45,.82],[.02,.94,.7]]){
  const radius=.36-(y-.37)*.25;
  const z=Math.sqrt(Math.max(.002,radius*radius-x*x))+.012;
  for(let i=0;i<3;i++){
    const angle=i*Math.PI/3;
    rod(toy,grass,[x-Math.cos(angle)*.045*a,y-Math.sin(angle)*.045*a,z],
        [x+Math.cos(angle)*.045*a,y+Math.sin(angle)*.045*a,z],.007,6).castShadow=false;
  }
}
rod(toy,skin,[0,1.08,0],[0,1.34,0],.095);
tube(toy,skin,[[-.14,1.08,.003],[-.30,.99,.004],[-.43,.82,.025],[-.46,.71,.12]],.047);
round(toy,skin,-.465,.695,.125,.066,.075,.052);
const wavingArm=group(toy,.15,1.08,0);
tube(wavingArm,skin,[[0,0,0],[.18,-.12,.02],[.34,-.04,.028],[.43,.22,.067]],.047);
round(wavingArm,skin,.434,.247,.071,.074,.082,.052);
for(const [i,x] of [[0,.384],[1,.421],[2,.455],[3,.482]]){
  const r=[.039,.075,.082,.055][i];
  rod(wavingArm,skin,[x,.271,.075],[x+(i-1.5)*.011,.271+r,.076],.015,8);
}
const head=group(toy,0,1.53,.02);
round(head,hair,0,.077,-.081,.412,.466,.341);
round(head,skin,0,-.024,.013,.374,.388,.321);
for(const x of [-.341,.341]) round(head,skin,x,-.073,.023,.074,.107,.064);
const fringe=[[-.185,.247,.181,.25,.10,.155,-.39],[-.045,.325,.154,.34,.125,.161,.33],[.11,.384,.096,.32,.132,.178,.48],[.23,.426,-.023,.24,.103,.166,.57],[.29,.34,.047,.18,.08,.106,.38],[-.28,.285,.083,.135,.184,.18,-.46]];
for(const [x,y,z,sx,sy,sz,angle] of fringe){
  round(head,y>.37?hairLight:hair,x,y,z,sx,sy,sz).rotation.z=angle;
}
for(const x of [-.125,.125]){
  round(head,whites,x,.032,.296,.088,.113,.049);
  round(head,iris,x+.013,.023,.337,.042,.065,.018);
  round(head,pupil,x+.017,.023,.353,.024,.046,.009);
  round(head,whites,x+.024,.046,.361,.013,.017,.006).castShadow=false;
  tube(head,hair,[[x-.074,.152,.264],[x-.019,.174,.279],[x+.055,.164,.267]],.014);
  round(head,cheeks,x*1.75,-.084,.274,.052,.023,.013).rotation.y=x*1.4;
}
round(head,skin,.015,-.044,.338,.046,.049,.044);
const smile=new T.Shape();
smile.moveTo(-.113,-.103);smile.quadraticCurveTo(0,-.136,.108,-.090);
smile.quadraticCurveTo(.07,-.228,-.009,-.222);smile.quadraticCurveTo(-.082,-.214,-.113,-.103);
item(head,new T.ShapeGeometry(smile),mouth,0,0,.296,false);
const teeth=new T.Shape();
teeth.moveTo(-.108,-.104);teeth.quadraticCurveTo(0,-.132,.102,-.093);
teeth.quadraticCurveTo(.05,-.165,-.052,-.145);teeth.quadraticCurveTo(-.09,-.14,-.108,-.104);
item(head,new T.ShapeGeometry(teeth),whites,0,0,.298,false);
const partyColors=['#e1877a','#ead088','#8ca992','#ecc7b1'];
const paperMats=partyColors.map((c)=>mat(c,.89));
const pareRng=random(203);
for(let i=0;i<72;i++){
  const x=(pareRng()-.5)*9.6, z=(pareRng()-.5)*5.7;
  if (Math.hypot(x - .23, z - .14) < 1.75) continue;
  const height=.023+pareRng()*.009;
  const paper=box(room,paperMats[i%4],x,tableHeight+height,z,.036+pareRng()*.05,.006,.064+pareRng()*.06,false);
  paper.rotation.y=pareRng()*Math.PI;
}
const bounce= new T.HemisphereLight('#ffe0be','#a67a90',1.50);
scene.add(bounce);
const key=new T.DirectionalLight('#ffdab5',3.0);
key.position.set(-4.6,9,5.4);key.castShadow=true;
key.shadow.mapSize.set(1536,1536);
Object.assign(key.shadow.camera,{left:-7.4,right:7.4,top:7.4,bottom:-6.6,near:.5,far:21});
key.shadow.normalBias=.025;
key.shadow.bias=-.00017;key.shadow.radius=3.3;
scene.add(key);
const fill=new T.DirectionalLight('#cdd5f7',1.18);
fill.position.set(6,4,1.5);scene.add(fill);


// Particle positions sampled from Joy's actual meshes in her arrival pose.
const joyCenter = new T.Vector3(0, 1.13, 0);
const particleCount = 1450;
const arrivals = new Float32Array(particleCount * 3);
const starts = new Float32Array(arrivals.length);
const positions = new Float32Array(arrivals.length);
const mistGeometry = new T.BufferGeometry();
mistGeometry.setAttribute('position', new T.BufferAttribute(positions, 3));
const mistBrush = texture(64, (ctx) => {
  const radial = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  radial.addColorStop(0, '#fff8dc');
  radial.addColorStop(.25, '#ffdb8dbc');
  radial.addColorStop(1, '#ffb15400');
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, 64, 64);
});
const joyMistMat = new T.PointsMaterial({ map: mistBrush, color: '#ffda99', size: .075,
  transparent: true, depthWrite: false, blending: T.AdditiveBlending });
const joyMist = new T.Points(mistGeometry, joyMistMat);
joyMist.frustumCulled = false;
joyHit.add(joyMist);
const randomMist = random(814);
const samples = [];
const sample = new T.Vector3();
toy.updateWorldMatrix(true, true);
toy.traverse((mesh) => {
  if (!mesh.isMesh) return;
  const vertices = mesh.geometry.getAttribute('position');
  for (let i = 0; i < vertices.count; i += 3) {
    sample.fromBufferAttribute(vertices, i);
    mesh.localToWorld(sample);
    joyHit.worldToLocal(sample);
    samples.push(sample.clone());
  }
});
for (let i = 0; i < particleCount; i++) {
  samples[Math.floor(randomMist() * samples.length)].toArray(arrivals, i * 3);
  const angle = randomMist() * Math.PI * 2;
  const spread = .75 + randomMist() * 2.3;
  starts.set([spread * Math.cos(angle), .2 + randomMist() * 3, spread * Math.sin(angle)], i * 3);
}

const joyMaterials = new Set();
const dissolve = {value: 0};
toy.traverse((mesh) => {
  if (!mesh.isMesh || joyMaterials.has(mesh.material)) return;
  const material = mesh.material;
  joyMaterials.add(material);
  material.onBeforeCompile = (shader) => {
    shader.uniforms.joyReveal = dissolve;
    shader.fragmentShader = 'uniform float joyReveal;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <alphatest_fragment>', [
      '#include <alphatest_fragment>',
      'float grain = fract(sin(dot(floor(gl_FragCoord.xy), vec2(12.9898, 78.233))) * 43758.5453);',
      'if (grain >= joyReveal && joyReveal < 1.0) discard;'
    ].join('\n'));
  };
});
const joyLight = new T.PointLight('#ffc369', 0, 6, 2);
joyLight.position.set(2.05, 2.79, 2.1);
scene.add(joyLight);

const memoryRoom = new T.Scene();
memoryRoom.background = new T.Color('#170c11');
const orbCamera = new T.PerspectiveCamera(35, 1, .1, 25);
orbCamera.position.z = 6.8;
const orb = new T.Group();
memoryRoom.add(orb);
const orbSurface = new T.ShaderMaterial({
  transparent: true, depthWrite: false,
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
    '  float rim = pow(1. - max(0., dot(normalize(eye), n)), 2.2);',
    '  float upper = pow(max(0., dot(n, normalize(vec3(-.45,.55,.75)))), 19.);',
    '  vec3 color = mix(vec3(.62,.19,.028), vec3(1.,.74,.34), rim);',
    '  gl_FragColor = vec4(mix(color, vec3(1.,.94,.76), upper), min(.99,.12+rim*.89+upper*.81));',
    '  #include <colorspace_fragment>',
    '}'
  ].join('\n')
});
const shell = new T.Mesh(sphere, orbSurface);
shell.renderOrder = 3;
orb.add(shell);
const memoryCanvas = document.createElement('canvas');
memoryCanvas.width = memoryCanvas.height = 384;
const memoryImage = new T.CanvasTexture(memoryCanvas);
memoryImage.colorSpace = T.SRGBColorSpace;
const memoryPortrait = new T.Sprite(new T.SpriteMaterial({map: memoryImage, depthWrite: false}));
memoryPortrait.scale.set(1.94, 1.94, 1);
memoryPortrait.renderOrder = 2;
orb.add(memoryPortrait);
const orbHalo = new T.Sprite(new T.SpriteMaterial({map: mistBrush, color: '#ffa342', transparent: true,
  opacity: .43, depthWrite: false, blending: T.AdditiveBlending}));
orbHalo.scale.set(3.75, 3.75, 1);
orbHalo.renderOrder = 1;
orb.add(orbHalo);

const smooth = (start, end, seconds) => T.MathUtils.smoothstep(seconds, start, end);
const clamp = T.MathUtils.clamp;
const baseFocus = new T.Vector3();
const joyFocus = new T.Vector3(1.22, 1.93, -.02);
let orbDistance = 6.8;
const flameWorld = new T.Vector3();
const ray = new T.Raycaster();
const ndc = new T.Vector2();
let size = {width: 1, height: 1};
let azimuth = .03;
let elevation = .57;
let shownAzimuth = azimuth;
let shownElevation = elevation;
let zoom = 1;
let shownZoom = 1;
let snapshot = false;

function resize(width, height) {
  size = {width, height};
  camera.aspect = orbCamera.aspect = width / height;
  camera.fov = camera.aspect < .9 ? 44 : 36;
  camera.updateProjectionMatrix();
  orbDistance = Math.max(6.8, 4.65 / orbCamera.aspect);
  orbCamera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}
function aim(seconds, reduced, resting) {
  const closeup = reduced ? 0 : smooth(moments.joyStart - .4, moments.joyEnd, seconds) * (1 - smooth(moments.textEnd, moments.orbStart - 1.2, seconds));
  const setting = resting ? 0 : smooth(0, 1.9, seconds);
  const portrait = camera.aspect < .9;
  baseFocus.set(0, portrait ? 1.59 : 1.55, .15);
  target.copy(baseFocus).lerp(joyFocus, closeup);
  const baseDistance = portrait ? Math.min(29, Math.max(13.2, 10.25 / camera.aspect)) : 12.15;
  const radius = baseDistance * T.MathUtils.lerp(shownZoom, .97, setting) * (1 - closeup * (portrait ? .17 : .10));
  const yaw = T.MathUtils.lerp(shownAzimuth, -.10 * closeup, setting);
  const tilt = T.MathUtils.lerp(shownElevation, .44 - .10 * closeup, setting);
  const span = Math.cos(tilt) * radius;
  camera.position.set(target.x + Math.sin(yaw) * span, target.y + Math.sin(tilt) * radius,
    target.z + Math.cos(yaw) * span);
  camera.lookAt(target);
  camera.updateMatrixWorld();
}
function imprint() {
  const ctx = memoryCanvas.getContext('2d');
  const canvas = renderer.domElement;
  const side = Math.min(canvas.width * .92, canvas.height * .91);
  ctx.clearRect(0, 0, 384, 384);
  ctx.save();
  ctx.beginPath();
  ctx.arc(192, 192, 189, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(canvas, (canvas.width - side) / 2, (canvas.height - side) * .46, side, side, 0, 0, 384, 384);
  ctx.fillStyle = '#ec97194a';
  ctx.fillRect(0, 0, 384, 384);
  const vignette = ctx.createRadialGradient(192, 174, 56, 192, 192, 192);
  vignette.addColorStop(0, '#ffd59100');
  vignette.addColorStop(1, '#f8ae53c9');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, 384, 384);
  ctx.restore();
  memoryImage.needsUpdate = true;
  snapshot = true;
}

function draw(seconds, reduced, phase) {
  shownAzimuth = reduced ? azimuth : T.MathUtils.lerp(shownAzimuth, azimuth, .24);
  shownElevation = reduced ? elevation : T.MathUtils.lerp(shownElevation, elevation, .24);
  shownZoom = reduced ? zoom : T.MathUtils.lerp(shownZoom, zoom, .24);
  const resting = phase === 'ready';
  if ((phase === 'done' || seconds >= moments.orbStart) && snapshot) {
    const settled = reduced || phase === 'done' ? 1 : smooth(moments.orbStart, moments.orbClear + .5, seconds);
    orb.scale.setScalar(T.MathUtils.lerp(1.59, 1.0, settled));
    orbCamera.position.z = orbDistance;
    renderer.render(memoryRoom, orbCamera);
    return;
  }
  aim(seconds, reduced, resting);
  const darkness = resting ? 0 : smooth(moments.darkFrom, moments.darkTo, seconds);
  const glow = smooth(moments.glowStart, moments.orbStart, seconds);
  const snapshotCue = seconds >= moments.textEnd + .2 && !snapshot;
  bounce.intensity = T.MathUtils.lerp(1.50, .28, darkness);
  key.intensity = T.MathUtils.lerp(3, .15, darkness);
  fill.intensity = T.MathUtils.lerp(1.18, .24, darkness);
  const ignition = smooth(0, .66, seconds);
  flames.forEach((flame, i) => {
    const level = smooth(.08 + i * .10, .51 + i * .10, seconds);
    const flicker = reduced ? 0 : Math.sin(seconds * 8 + i * 2.1) * .06;
    flame.visible = !resting && level > 0;
    flame.scale.set(.96 + .70 * glow, level * (1 + flicker + 1.1 * glow), .96 + .70 * glow);
    flame.rotation.z = flicker;
  });
  candleGlow.intensity = resting ? 0 : ignition * (23 + 80 * glow);
  renderer.toneMappingExposure = 1.11 + 2.05 * glow;

  const arrival = reduced ? Number(seconds >= moments.joyEnd - .5) : smooth(moments.joyStart, moments.joyEnd, seconds);
  const departure = smooth(moments.glowStart + 2, moments.orbStart - .2, seconds);
  toy.visible = arrival > .35 && departure < 1;
  dissolve.value = smooth(.35, .96, arrival) * (1 - departure);
  joyLight.intensity = 27 * smooth(.08, .84, arrival) * (1 - departure);
  const elapsed = seconds - moments.joyEnd;
  const speaking = smooth(moments.joyEnd, moments.joyEnd + 1.6, seconds) *
    (1 - smooth(moments.textEnd - 1, moments.textEnd + .5, seconds));
  const gesture = reduced ? 0 : speaking * (.55 * Math.sin(elapsed * 1.8) + .35 * Math.sin(elapsed * .59));
  toy.position.y = .16 + gesture * .035;
  head.rotation.z = -.075 + gesture * .09;
  wavingArm.rotation.z = -.22 + gesture * .16;

  const assembling = !reduced && seconds >= moments.joyStart && arrival < .999;
  joyMist.visible = assembling;
  if (assembling) {
    joyMistMat.opacity = smooth(0, .15, arrival) * (1 - smooth(.79, 1, arrival));
    for (let i = 0; i < particleCount; i++) {
      const index = i * 3;
      const curl = (1 - arrival) * Math.sin(i * 1.17 + seconds * 3);
      positions[index] = T.MathUtils.lerp(starts[index], arrivals[index], arrival) + curl * .32;
      positions[index + 1] = T.MathUtils.lerp(starts[index + 1], arrivals[index + 1], arrival);
      positions[index + 2] = T.MathUtils.lerp(starts[index + 2], arrivals[index + 2], arrival) + curl * .21;
    }
    mistGeometry.attributes.position.needsUpdate = true;
  }

  renderer.render(scene, camera);
  if (snapshotCue) imprint();
  // Allows a background tab to catch up directly to the ending.
  if (!snapshot && seconds >= moments.orbStart) imprint();
}
function intersectsCake(clientX, clientY, touch) {
  const rect = stage.getBoundingClientRect();
  const offsets = touch ? [[0,0], [11,0], [-11,0], [0,11], [0,-11]] : [[0,0]];
  for (const [x, y] of offsets) {
    ndc.set((clientX + x - rect.left) / rect.width * 2 - 1, -((clientY + y - rect.top) / rect.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (ray.intersectObject(cakeHit, true).some(({object}) => object.visible && object.parent.visible)) return true;
  }
  return false;
}
return {
  resize, draw, intersectsCake,
  get canvas() { return renderer.domElement; },
  get orbRadius() {
    return size.height / (2 * Math.tan(T.MathUtils.degToRad(orbCamera.fov / 2)) *
      Math.sqrt(orbDistance ** 2 - 1));
  },
  get moving() {
    return Math.abs(shownAzimuth - azimuth) + Math.abs(shownElevation - elevation) + Math.abs(shownZoom - zoom) > .002;
  },
  orbit(yaw, tilt) {
    azimuth = clamp(azimuth + yaw, -.57, .57);
    elevation = clamp(elevation + tilt, .32, .99);
  },
  zoom(factor) { zoom = clamp(zoom * factor, camera.aspect < .9 ? .88 : .77, 1.19); },
  glowPosition() {
    flames[1].getWorldPosition(flameWorld).project(camera);
    return [clamp((flameWorld.x + 1) / 2, 0, 1), clamp((1 - flameWorld.y) / 2, 0, 1)];
  },
  enterOrb(amount) {
    orb.scale.setScalar(1);
    orbCamera.position.z = T.MathUtils.lerp(orbDistance, 1.06, amount);
    renderer.render(memoryRoom, orbCamera);
  },
  resetView() {
    snapshot = false;
    azimuth = shownAzimuth = .03;
    elevation = shownElevation = .57;
    zoom = shownZoom = 1;
  }
};
}
