import * as T from './vendor/three.module.js';
import { createBirthdayMemory } from './memory.js?v=1';
import { connectBirthdayMusic } from './music.js?v=1';

const $ = (id) => document.getElementById(id);
const stage = $('stage');
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
const motion = matchMedia('(prefers-reduced-motion: reduce)');
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


const lampHit=group(room,-3.48,tableHeight,-1.35);
const enamel=mat('#526a59',.37);
const bulbMat=new T.MeshStandardMaterial({color:'#ffe5ae',emissive:'#f7ac58',emissiveIntensity:1.8,roughness:.42});
lathe(lampHit,enamel,0,0,0,[[0,0],[.63,0],[.7,.04],[.7,.11],[.66,.16],[.45,.21],[0,.21]]);
lathe(lampHit,brass,0,0,0,[[.66,.054],[.706,.058],[.706,.074],[.66,.078]]);
tube(lampHit,brass,[[0,.18,0],[0,.8,-.15],[-.18,1.7,-.4],[.08,2.54,-.40],[.58,2.79,-.20],[.95,2.64,0]],.075);
const shade=group(lampHit,.95,2.40,.04);
shade.rotation.z=.20;
shade.rotation.x=-.10;
const switchPivot = group(lampHit, -.32, .17, .36);
round(switchPivot, brass, 0, 0, 0, .10, .044, .10);
const toggle = group(switchPivot, 0, .035, 0);
cylinder(toggle, brass, 0, .045, 0, .024, .033, .09, 16);
round(toggle, brass, 0, .097, 0, .034, .035, .034);

const inner=enamel.clone();inner.side=T.DoubleSide;
lathe(shade,inner,0,0,0,[[.67,0],[.69,.04],[.64,.16],[.56,.25],[.40,.38],[.25,.44],[.14,.55],[.11,.64],[0,.65]]);
lathe(shade,brass,0,0,0,[[.682,-.01],[.708,.016],[.702,.049],[.677,.072]]);
round(shade,bulbMat,0,-.015,0,.17,.17,.17);
const lampKey=new T.SpotLight('#ffd298',34,13,Math.PI*.32,.64,1.6);
lampKey.position.set(-2.55,3.40,-1.22);lampKey.target.position.set(.15,1.05,.8);
scene.add(lampKey,lampKey.target);

const letterHit=group(room,-2.68,tableHeight+.012,1.27);
letterHit.rotation.y=.29;
const envelopeMap=texture(512,(ctx,s)=>{
  const gradient=ctx.createLinearGradient(0,0,s,s);
  gradient.addColorStop(0,'#e8bf86');gradient.addColorStop(1,'#f4d6a7');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,s,s);
  const rand=random(1411);
  for(let i=0;i<3600;i++){
    ctx.fillStyle=i%2?'#fff5dc28':'#95644215';
    ctx.fillRect(rand()*s,rand()*s,1+rand()*2,1);
  }
  const polygon=(points, fill)=>{
    ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x*s,y*s):ctx.moveTo(x*s,y*s));
    ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle='#9e6b486e';ctx.lineWidth=2;ctx.stroke();
  };
  polygon([[0,0],[.5,.57],[0,1]],'#eac18d');
  polygon([[1,0],[.5,.57],[1,1]],'#e7bb83');

  ctx.textAlign='center';ctx.fillStyle='#7d4841';ctx.font='italic 73px Georgia';ctx.fillText('Linlin',s*.5,s*.85);
});
const envelopeTop=mat('#ffffff',.92);envelopeTop.map=envelopeMap;
const envelopeEdge=mat('#d9ad77',.91);
box(letterHit,[envelopeEdge,envelopeEdge,envelopeTop,envelopeEdge,envelopeEdge,envelopeEdge],0,.06,0,1.85,.12,1.26);
const seal=mat('#a94954',.45);
const sealSoft=mat('#cf716c',.58);
const waxSeal = cylinder(letterHit,seal,0,.145,.073,.107,.125,.057);
const heart= new T.Shape();
heart.moveTo(0,-.049);heart.bezierCurveTo(-.136,.041,-.047,.106,0,.053);
heart.bezierCurveTo(.047,.106,.136,.041,0,-.049);
const stamp=item(letterHit,new T.ShapeGeometry(heart),sealSoft,0,.177,.073,false);stamp.rotation.x=-Math.PI/2;

// The flap pivots on the back seam and reveals the card beneath it.
const flapPivot = group(letterHit, 0, .128, -.626);
const flapShape = new T.Shape();
flapShape.moveTo(-.92, 0);
flapShape.lineTo(.92, 0);
flapShape.lineTo(0, -.765);
flapShape.closePath();
const flapPaper = mat('#f8deb3', .95);
flapPaper.side = T.DoubleSide;
const flap = item(flapPivot, new T.ShapeGeometry(flapShape), flapPaper, 0, 0, 0);
flap.rotation.x = -Math.PI / 2;
const sealGroup = group(flapPivot, 0, 0, .699);
sealGroup.add(stamp, waxSeal);
stamp.position.z = waxSeal.position.z = 0;
stamp.position.y -= .128;
waxSeal.position.y -= .128;

const greeting = group(letterHit, 0, .135, 0);
const cardFace = texture(512, (ctx, size) => {
  ctx.fillStyle = '#fff1d6';
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = '#ac6c5f';
  ctx.lineWidth = 3;
  ctx.strokeRect(18, 18, size - 36, size - 36);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#8a434b';
  ctx.font = 'italic 69px Georgia';
  ctx.fillText('For Linlin', size / 2, 249);
  ctx.font = '42px Georgia';
  ctx.fillText('11 · 14', size / 2, 319);
});
const greetingPaper = mat('#ffffff', .95);
greetingPaper.map = cardFace;
const paperEdge = mat('#e8c99a', .9);
box(greeting, [paperEdge,paperEdge,greetingPaper,paperEdge,paperEdge,paperEdge], 0, 0, 0, 1.53, .032, .94);
greeting.visible = false;

const joyHit=group(room,3.45,tableHeight,-.16);
const toy=group(joyHit,0,.16,0);toy.rotation.y=-.11;
lathe(joyHit,brass,0,0,0,[[0,0],[.53,0],[.59,.035],[.61,.074],[.60,.117],[.54,.144],[0,.144]]);
lathe(joyHit,mat('#755240',.54),0,0,0,[[0,.142],[.50,.142],[.53,.148],[.50,.169],[0,.169]]);
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
const joyRing=group(joyHit,0,1.46,0);
const starShape=new T.Shape();
for(let i=0;i<8;i++){
  const a=i*Math.PI/4, r=i%2?.039:.12;
  const x=Math.cos(a)*r,y=Math.sin(a)*r;
  i===0?starShape.moveTo(x,y):starShape.lineTo(x,y);
}
starShape.closePath();
const starMaterial=new T.MeshStandardMaterial({color:'#ffe08d',emissive:'#ffb950',emissiveIntensity:.8,side:T.DoubleSide});
for(const [x,y,z] of [[.6,.53,.08],[-.50,.28,.14],[.53,.02,.23],[-.49,-.25,0]]){
  item(joyRing,new T.ShapeGeometry(starShape),starMaterial,x,y,z,false).rotation.z=.12;
}
joyRing.visible=false;

// Pancit bihon and calamansi, served on a glazed oval platter.
const pancitHit = group(room, 2.80, tableHeight + .04, 2.05);
pancitHit.rotation.y = -.24;
const ceramic = mat('#eedfc2', .37);
const rim = mat('#537b71', .41);
const platter = lathe(pancitHit, ceramic, 0, 0, 0,
  [[0,.018],[.59,.018],[.81,.042],[.92,.091],[.99,.155],[.96,.194],[.90,.170],[.80,.118],[0,.118]]);
platter.scale.z = .69;
const plateRim = lathe(pancitHit, rim, 0, 0, 0, [[.927,.181],[.953,.190],[.973,.182],[.986,.169]]);
plateRim.scale.z = .69;

const noodleRandom = random(2468);
const noodleColors = ['#a16c39', '#bf8746', '#d8a15d', '#e0b475'].map((color) => mat(color, .60));
const stock = mat('#ac7541', .66);
round(pancitHit, stock, -.089, .184, -.035, .73, .112, .37);
for (let i = 0; i < 33; i++) {
  const depth = (noodleRandom() - .50) * .72;
  const length = .62 + noodleRandom() * .80;
  const phase = noodleRandom() * Math.PI * 2;
  const variation = .05 + noodleRandom() * .077;
  const xOffset = -.082 + (noodleRandom() - .50) * .15;
  const points = Array.from({length: 17}, (_, n) => {
    const t = n / 16;
    const x = (t - .5) * length + xOffset;
    const z = depth + Math.sin(t * 8 + phase) * variation;
    const arch = Math.max(0, 1 - (x / .86) ** 2 - (z / .61) ** 2);
    const y = .156 + Math.sqrt(arch) * (.125 + noodleRandom() * .048);
    return [x, y, z];
  });
  tube(pancitHit, noodleColors[i % noodleColors.length], points, .009 + noodleRandom() * .004).castShadow = false;
}
const carrot = mat('#d47843', .59);
const cabbage = mat('#a5ae57', .68);
const scallion = mat('#50774a', .65);
for (let i = 0; i < 28; i++) {
  const angle = noodleRandom() * Math.PI * 2;
  const reach = .24 + .70 * Math.sqrt(noodleRandom());
  const x = -.085 + Math.cos(angle) * reach * .67;
  const z = -.04 + Math.sin(angle) * reach * .35;
  const y = .19 + .14 * Math.sqrt(1 - reach ** 2);
  const garnish = box(pancitHit, [carrot, cabbage, scallion][i % 3],
    x, y, z, .09 + noodleRandom() * .12, .015, i % 3 === 1 ? .052 : .024, false);
  garnish.rotation.set(.10, angle, .12);
}
const citrusRind = mat('#719545', .58);
const citrusPith = mat('#f1d98a', .71);
const citrusFlesh = mat('#e8ad43', .49);
for (const [x, z, tilt] of [[.59,.265,.26],[.36,.414,-.23]]) {
  const lime = group(pancitHit, x, .185, z);
  lime.rotation.set(tilt, .2, -.20);
  lathe(lime, citrusRind, 0, 0, 0, [[0,0],[.105,.019],[.143,.079],[.148,.125],[0,.124]]);
  cylinder(lime, citrusPith, 0, .127, 0, .140, .140, .010, 32);
  for (let segment = 0; segment < 8; segment++) {
    const angle = segment * Math.PI / 4;
    const wedge = round(lime, citrusFlesh, .057 * Math.cos(angle), .136,
      .057 * Math.sin(angle), .061, .010, .022);
    wedge.rotation.y = -angle;
  }
}

// A walnut music box with a moving brass cylinder and a gold winding key.
const musicHit = group(room, -3.21, tableHeight, -.01);
musicHit.rotation.y = .20;
const boxWood = mat('#6b3e3f', .44);
const insetWood = mat('#512b36', .67);
box(musicHit, boxWood, 0, .185, 0, 1.25, .36, .81);
box(musicHit, brass, 0, .055, 0, 1.32, .035, .86);
box(musicHit, brass, 0, .335, 0, 1.28, .035, .84);
box(musicHit, insetWood, 0, .355, 0, 1.12, .025, .69);
const lid = group(musicHit, 0, .35, -.40);
lid.rotation.x = -.82;
box(lid, boxWood, 0, .04, .405, 1.26, .10, .83);
box(lid, brass, 0, -.016, .398, 1.10, .016, .67);
box(lid, insetWood, 0, -.03, .398, 1.01, .014, .59);
const cylinderReel = group(musicHit, -.18, .43, .035);
rod(cylinderReel, brass, [-.31,0,0], [.31,0,0], .092, 32);
for (let i = 0; i < 6; i++) {
  const ring = item(cylinderReel, new T.TorusGeometry(.093, .008, 8, 24), brass, i * .1 - .25, 0, 0, false);
  ring.rotation.y = Math.PI / 2;
  round(cylinderReel, brass, i * .10 - .25, Math.cos(i) * .095, Math.sin(i) * .095, .019, .022, .021);
}
const windingKey = group(musicHit, .14, .204, .431);
rod(windingKey, brass, [0,0,0], [0,0,.091], .023);
for (const x of [-.057, .057]) {
  item(windingKey, new T.TorusGeometry(.049, .015, 9, 24), brass, x, 0, .087);
}
const indicator = new T.MeshStandardMaterial({
  color: '#c38c4b', emissive: '#ffad3d', emissiveIntensity: 0, roughness: .48
});
round(musicHit, indicator, -.41, .217, .411, .034, .034, .018);
const music = connectBirthdayMusic($('birthday-audio'), $('music'), (playing) => {
  indicator.emissiveIntensity = playing ? 1.8 : 0;
  requestDraw();
});

const partyColors=['#e1877a','#ead088','#8ca992','#ecc7b1'];
const paperMats=partyColors.map((c)=>mat(c,.89));
const pareRng=random(203);
for(let i=0;i<72;i++){
  const x=(pareRng()-.5)*9.6, z=(pareRng()-.5)*5.7;
  if (Math.hypot(x - .23, z - .14) < 1.75 || Math.hypot(x - 2.80, z - 2.05) < 1.05) continue;
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

const memory = createBirthdayMemory(room, tableHeight, cakeHit, joyHit, wavingArm);
const actions = new Map([
  [memory.pedestal, { id: 'memory', height: 1.10, radius: .57 }],
  [cakeHit, { id: 'candle', height: 2.83, radius: 1.87 }],
  [joyHit, { id: 'joy', height: 2.39, radius: .72 }],
  [letterHit, { id: 'letter', height: .22, radius: 1.02 }],
  [lampHit, { id: 'lamp', height: 3.13, radius: .82 }],
  [musicHit, { id: 'music', height: .92, radius: .76 }],
  [pancitHit, { id: 'pancit', height: .34, radius: 1.03 }]
]);
const objects = [...actions.keys()];
const ray = new T.Raycaster();
const coord = new T.Vector2();
const projection = new T.Vector3();
const origin = new T.Vector3();
const label = $('object-label');
const hint = $('explore-hint');
const keyboardControls = document.querySelectorAll('.object-action');
const marks = new Map(objects.map((object, index) => {
  const mark = document.createElement('i');
  mark.className = 'discovery-mark';
  mark.setAttribute('aria-hidden', 'true');
  mark.style.animationDelay = -index * .33 + 's';
  stage.after(mark);
  return [object, mark];
}));
let exploring = false;
let guideTimer;
function showGuide() {
  exploring = true;
  hint.hidden = false;
  hint.classList.remove('dismissed');
  clearTimeout(guideTimer);
  guideTimer = setTimeout(hideGuide, 6400);
  requestDraw();
}
function hideGuide() {
  if (!exploring) return;
  exploring = false;
  clearTimeout(guideTimer);
  hint.classList.add('dismissed');
  for (const mark of marks.values()) mark.hidden = true;
}
const labels = {
  view: ['方向键转动，回车切换视角', 'Arrow keys to orbit. Enter to switch views.'],
  candle: ['吹蜡烛', 'Blow out the candles'],
  relight: ['重新点亮', 'Relight the candles'],
  joy: ['跟乐乐打招呼', 'Say hi to Joy'],
  letter: ['拆开信封', 'Open the envelope'],
  memory: ['看看今天的记忆球', 'Revisit the birthday memory'],
  pancit: ['看看这盘生日面', 'Discover the birthday noodles'],
  music: ['播放生日歌', 'Play the birthday song'],
  pauseMusic: ['暂停生日歌', 'Pause the birthday song'],
  lamp: ['切到烛光', 'Switch to candlelight'],
  brighten: ['打开房间灯光', 'Brighten the room']
};
const highlight = item(room, new T.RingGeometry(.9, 1, 64),
  new T.MeshBasicMaterial({color: '#ffc780', transparent: true, opacity: .36, depthWrite: false, side: T.DoubleSide}),
  0, tableHeight + .035, 0, false);
highlight.rotation.x = -Math.PI / 2;
highlight.visible = false;
const smoke = flames.map((flame) => {
  const cloud = group(flame.parent, 0, flame.position.y, 0);
  const vapor = new T.MeshBasicMaterial({color: '#e8d9d3', transparent: true, opacity: 0, depthWrite: false});
  round(cloud, vapor, 0, 0, 0, .08, .14, .08).castShadow = false;
  cloud.visible = false;
  return {cloud, vapor};
});

let azimuth = .03, elevation = .57, shownAzimuth = azimuth, shownElevation = elevation;
let distance = 12, zoom = 1, shownZoom = 1, portrait = false;
let dim = false, dimMix = 0, dimBegin = -Infinity, dimFrom = 0;
let snuffed = false, candleStart = -Infinity, joyStart = -Infinity, letterStart = -Infinity;
let frame = 0, gesture = null, hovered = null, hoverPoint = null, nextAngle = 0;
let hoverDirty = false;
let keyboardObject = null;
let keyboardView = false;
const touches = new Map();
let pinch = null;
let pendingDialog = null;
let letterClose = -Infinity;
const orbitSteps = [[.03,.57],[-.35,.45],[.32,.83]];
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const easeOut = (value) => 1 - (1 - clamp(value, 0, 1)) ** 3;
const interpolate = (a, b, t) => a + (b - a) * t;

const mouseOffsets = [[0, 0]];
const touchOffsets = [[0, 0], [10, 0], [-10, 0], [0, 10], [0, -10]];
function hit(x, y, finger = false) {
  const rect = renderer.domElement.getBoundingClientRect();
  const offsets = finger ? touchOffsets : mouseOffsets;
  for (const [dx, dy] of offsets) {
    coord.set(((x + dx - rect.left) / rect.width) * 2 - 1, -((y + dy - rect.top) / rect.height) * 2 + 1);
    ray.setFromCamera(coord, camera);
    for (const {object} of ray.intersectObjects(objects, true)) {
      let node = object;
      while (node?.visible && !actions.has(node)) node = node.parent;
      if (actions.has(node) && node.visible && (node !== memory.pedestal || memory.collected)) return node;
    }
  }
  return null;
}
function setActionLabel(labelId) {
  if (label.dataset.action === labelId) return;
  const [zh, en] = labels[labelId];
  const english = document.createElement('span');
  english.lang = 'en';
  english.textContent = en;
  label.replaceChildren(zh, english);
  label.dataset.action = labelId;
}
function projectObject(object, height) {
  origin.set(0, height, 0);
  projection.copy(object.localToWorld(origin)).project(camera);
  return [(projection.x + 1) * stage.clientWidth / 2, (1 - projection.y) * stage.clientHeight / 2];
}
function updateHover() {
  const object = keyboardObject || hovered;
  label.toggleAttribute('data-keyboard', !!keyboardObject || keyboardView);
  if (keyboardView) {
    setActionLabel('view');
    label.style.left = '50%';
    label.style.top = Math.max(94, stage.clientHeight - 22) + 'px';
    label.hidden = false;
    highlight.visible = false;
    return;
  }
  if (!object) {
    label.hidden = true;
    highlight.visible = false;
    return;
  }
  const {id, height, radius} = actions.get(object);
  const labelId = id === 'music' && music.playing ? 'pauseMusic' : id === 'lamp' && dim ? 'brighten' : id === 'candle' && snuffed ? 'relight' : id;
  setActionLabel(labelId);
  const [x, y] = projectObject(object, height);
  label.style.left = clamp(x, 85, stage.clientWidth - 85) + 'px';
  label.style.top = clamp(y - 9, 94, stage.clientHeight - 26) + 'px';
  label.hidden = false;
  highlight.position.x = object.position.x;
  highlight.position.z = object.position.z;
  const oval = id === 'letter' || id === 'pancit';
  highlight.scale.set(radius, radius * (oval ? .73 : 1), 1);
  highlight.rotation.z = oval ? object.rotation.y : 0;
  highlight.visible = true;
}
function updateDiscoveryMarks() {
  if (!exploring) return;
  for (const [object, mark] of marks) {
    const {height} = actions.get(object);
    const [x, y] = projectObject(object, height);
    mark.hidden = (object === memory.pedestal && !memory.collected) || object === hovered || x < 12 || x > stage.clientWidth - 12 || y < 85 || y > stage.clientHeight - 20;
    if (!mark.hidden) {
      mark.style.left = x + 'px';
      mark.style.top = (y - 10) + 'px';
    }
  }
}
function clearHover() {
  hoverPoint = null;
  hovered = null;
  stage.style.cursor = '';
  requestDraw();
}
function size() {
  const {width, height} = stage.getBoundingClientRect();
  if (width < 1 || height < 1) return;
  camera.aspect = width / height;
  portrait = camera.aspect < .9;
  camera.fov = portrait ? 44 : 36;
  distance = portrait ? Math.min(29, Math.max(13.2, 10.8 / camera.aspect)) : 12.4;
  normalFocus.set(0, portrait ? 1.57 : 1.53, portrait ? .07 : .17);
  if (!returnView) target.copy(normalFocus);
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
  hoverDirty = true;
  requestDraw();
}
new ResizeObserver(size).observe(stage);

let noticeTimer;
function message(copy) {
  $('notice').textContent = copy;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => $('notice').textContent = '', 4100);
}
for (const button of keyboardControls) {
  button.addEventListener('focus', () => {
    if (!button.matches(':focus-visible')) return;
    hideGuide();
    clearHover();
    keyboardView = button.id === 'view';
    keyboardObject = objects.find((object) => actions.get(object).id === button.id) || null;
    requestDraw();
  });
  button.addEventListener('blur', () => {
    keyboardObject = null;
    keyboardView = false;
    requestDraw();
  });
}
$('view').addEventListener('keydown', (event) => {
  const offsets = {ArrowLeft: [.10, 0], ArrowRight: [-.10, 0], ArrowUp: [0, .09], ArrowDown: [0, -.09]};
  if (event.key === 'Home') {
    [azimuth, elevation] = orbitSteps[0];
    nextAngle = 0;
    zoom = 1;
  } else if (Object.hasOwn(offsets, event.key)) {
    const [yaw, pitch] = offsets[event.key];
    azimuth = clamp(azimuth + yaw, -.61, .61);
    elevation = clamp(elevation + pitch, .27, 1.07);
  } else return;
  event.preventDefault();
  requestDraw();
});
$('view').addEventListener('click', () => {
  nextAngle = (nextAngle + 1) % orbitSteps.length;
  [azimuth, elevation] = orbitSteps[nextAngle];
  zoom = 1;
  requestDraw();
});
$('lamp').addEventListener('click', () => {
  dim = !dim;
  dimBegin = performance.now();
  dimFrom = dimMix;
  $('lamp').setAttribute('aria-pressed', String(dim));
  message(dim ? '烛光模式 · Candlelight' : '房间灯光 · Room light');
  requestDraw();
});
const rng = random(1114);
const particles = Array.from({length: 54}, (_, i) => {
  const mesh = box(room, paperMats[i % 4], 0, 0, 0, .069, .018, .137, false);
  mesh.visible = false;
  const angle = rng() * Math.PI * 2, speed = .7 + rng() * 2.6;
  return {mesh, dx: Math.cos(angle) * speed, dz: Math.sin(angle) * speed, dy: 1.5 + rng() * 3, spin: .8 + rng() * 7};
});
function setCandleLabel(out) {
  const button = $('candle');
  button.firstChild.textContent = out ? '重新点亮' : '吹蜡烛';
  button.lastElementChild.textContent = out ? 'Relight' : 'Blow candles';
  button.setAttribute('aria-pressed', String(out));
}
$('candle').addEventListener('click', () => {
  snuffed = !snuffed;
  candleStart = performance.now();
  setCandleLabel(snuffed);
  if (snuffed) message('许个愿吧，琳琳。 · Make a wish, Linlin.');
  else {
    clearTimeout(noticeTimer);
    $('notice').textContent = '';
  }
  requestDraw();
});
function openWithMotion(dialogId, triggerId, duration) {
  if (pendingDialog || document.querySelector('dialog[open]')) return;
  clearHover();
  const button = $(triggerId);
  const dialog = $(dialogId);
  if (motion.matches) {
    dialog.showModal();
    return;
  }
  button.setAttribute('aria-busy', 'true');
  pendingDialog = setTimeout(() => {
    pendingDialog = null;
    button.removeAttribute('aria-busy');
    if (!document.querySelector('dialog[open]')) dialog.showModal();
  }, duration);
  if (triggerId === 'joy') joyStart = performance.now();
  else {
    letterStart = performance.now();
    letterClose = -Infinity;
  }
  requestDraw();
}
$('pancit').addEventListener('click', () => {
  if (pendingDialog || document.querySelector('dialog[open]')) return;
  clearHover();
  $('pancit-card').showModal();
});
$('joy').addEventListener('click', () => {
  if (memory.phase === 'playing') return;
  if (memory.collected) $('memory').click();
  else openWithMotion('joy-card', 'joy', 1050);
});
$('memory').addEventListener('click', () => {
  if (memory.phase === 'saved' && !document.querySelector('dialog[open]')) {
    clearHover();
    $('memory-card').showModal();
  }
});
$('letter').addEventListener('click', () => {
  if (!stage.closest('.failed')) openWithMotion('card', 'letter', 650);
});
$('card').addEventListener('close', () => {
  letterClose = performance.now();
  requestDraw();
});

const caption = $('memory-caption');
let captionTimer;
let finaleSince = 0;
let finaleStage = -1;
let returnView = null;
const normalFocus = new T.Vector3();
const finalFocus = new T.Vector3(memory.orbit.x, memory.orbit.y, memory.orbit.z);
const captions = [
  ['等一下，今天有好多值得留下来的瞬间！', 'Wait! There’s so much from today I want to keep!'],
  ['看，烛光、生日面，还有我们一起笑的这一刻。', 'Look! The candles, the birthday noodles, and this moment we shared.'],
  ['接住啦！这颗给你，琳琳。', 'Got it! This one is yours, Linlin.'],
  ['今天的记忆收好了。点亮着的球，可以再看一眼。', 'Today’s memory is safe. Tap the glowing orb to revisit it.']
];
function finaleCaption(step) {
  if (finaleStage === step) return;
  finaleStage = step;
  const [zh, en] = captions[step];
  const english = document.createElement('span');
  english.lang = 'en';
  english.textContent = en;
  caption.replaceChildren(zh, english);
  caption.hidden = false;
}
function playFinale() {
  if (memory.phase === 'playing') return;
  const dialog = document.querySelector('dialog[open]');
  if (dialog) dialog.close();
  hideGuide();
  clearHover();
  clearTimeout(captionTimer);
  keyboardObject = null;
  keyboardView = false;
  gesture = null;
  touches.clear();
  pinch = null;
  stage.classList.remove('dragging');
  clearTimeout(noticeTimer);
  $('notice').textContent = '';
  finaleSince = performance.now();
  finaleStage = -1;
  finaleCaption(0);
  returnView = {azimuth, elevation, zoom};
  // Draw immediately before capturing: the WebGL drawing buffer may be cleared between frames.
  if (!memory.collected) renderer.render(scene, camera);
  memory.start(finaleSince, renderer.domElement, motion.matches);
  $('memory').hidden = true;
  for (const control of keyboardControls) control.disabled = true;
  requestDraw();
}
$('collect-memory').addEventListener('click', playFinale);
$('replay-memory').addEventListener('click', playFinale);

function finishFinale() {
  for (const control of keyboardControls) control.disabled = false;
  $('memory').hidden = false;
  azimuth = returnView.azimuth;
  elevation = returnView.elevation;
  zoom = returnView.zoom;
  returnView = null;
  finaleCaption(3);
  if (document.activeElement === document.body) {
    $('memory').focus({preventScroll: true});
    if (!$('memory').matches(':focus-visible')) $('memory').blur();
  }
  captionTimer = setTimeout(() => { caption.hidden = true; }, 6900);
}
function fingerDistance() {
  const [a, b] = touches.values();
  return Math.hypot(a.x - b.x, a.y - b.y);
}
function beginGesture(event, tap) {
  const {pointerId: id, clientX: x, clientY: y, pointerType} = event;
  gesture = {id, x, y, azimuth: shownAzimuth, elevation: shownElevation,
    action: tap ? hit(x, y, pointerType === 'touch') : null, drag: false};
}
stage.addEventListener('pointerdown', (event) => {
  if (event.button !== 0 || memory.phase === 'playing') return;
  if (event.pointerType === 'touch') {
    if (touches.size === 2) return;
    touches.set(event.pointerId, {x: event.clientX, y: event.clientY});
    if (touches.size === 2) {
      gesture = null;
      pinch = {distance: Math.max(1, fingerDistance()), zoom: shownZoom};
      stage.setPointerCapture(event.pointerId);
      hideGuide();
      clearHover();
      return;
    }
  } else if (gesture || pinch) return;
  if (document.activeElement?.matches('.object-action')) document.activeElement.blur();
  beginGesture(event, true);
  stage.setPointerCapture(event.pointerId);
});
stage.addEventListener('pointermove', (event) => {
  if (touches.has(event.pointerId)) {
    touches.set(event.pointerId, {x: event.clientX, y: event.clientY});
    if (pinch) {
      zoom = clamp(pinch.zoom * pinch.distance / Math.max(1, fingerDistance()), portrait ? .86 : .76, 1.2);
      requestDraw();
      return;
    }
  }
  if (!gesture) {
    if (event.pointerType === 'mouse') {
      hoverPoint = [event.clientX, event.clientY];
      hoverDirty = true;
      requestDraw();
    }
    return;
  }
  if (event.pointerId !== gesture.id) return;
  const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
  if (!gesture.drag && Math.hypot(dx, dy) < 7) return;
  gesture.drag = true;
  hideGuide();
  if (hovered || hoverPoint) clearHover();
  stage.classList.add('dragging');
  azimuth = clamp(gesture.azimuth - dx * .0045, -.61, .61);
  elevation = clamp(gesture.elevation + dy * .004, .27, 1.07);
  requestDraw();
});
function release(event, click) {
  touches.delete(event.pointerId);
  if (pinch) {
    if (touches.size > 1) return;
    pinch = null;
    if (touches.size) {
      const [id, {x, y}] = touches.entries().next().value;
      beginGesture({pointerId: id, clientX: x, clientY: y, pointerType: 'touch'}, false);
    }
    return;
  }
  if (!gesture || gesture.id !== event.pointerId) return;
  const {action, drag, x, y} = gesture;
  gesture = null;
  stage.classList.remove('dragging');
  const withinTap = Math.hypot(event.clientX - x, event.clientY - y) < 7;
  if (click && !drag && withinTap) {
    if (action && action === hit(event.clientX, event.clientY, event.pointerType === 'touch')) {
      hideGuide();
      const actionId = actions.get(action).id;
      if (actionId !== 'music') music.startOnGesture();
      $(actionId).click();
    } else if (!action && event.pointerType === 'touch') {
      showGuide();
    }
  }
  requestDraw();
}
stage.addEventListener('pointerup', (event) => release(event, true));
stage.addEventListener('pointercancel', (event) => release(event, false));
stage.addEventListener('lostpointercapture', (event) => release(event, false));
stage.addEventListener('pointerleave', clearHover);
stage.addEventListener('wheel', (event) => {
  if (event.ctrlKey || event.metaKey || event.deltaY === 0 || memory.phase === 'playing') return;
  event.preventDefault();
  hideGuide();
  zoom = clamp(zoom + Math.sign(event.deltaY) * .07, portrait ? .86 : .76, 1.2);
  requestDraw();
}, {passive: false});
stage.addEventListener('webglcontextlost', () => window.showTableFallback(), true);
document.addEventListener('visibilitychange', () => {if (!document.hidden) requestDraw();});
motion.addEventListener('change', requestDraw);

function requestDraw(){
  if(!frame&&!document.hidden)frame=requestAnimationFrame(render);
}
let lastRender = 0;
let wasWaving = false;
let wasUnfolding = false;
function render(time) {
  frame = 0;
  const dt = Math.min(60, time - lastRender);
  lastRender = time;
  const moving = !motion.matches;
  if (moving && music.playing) {
    cylinderReel.rotation.x += dt * .003;
    windingKey.rotation.z -= dt * .0012;
  }
  const ease = !moving || gesture?.drag ? 1 : 1 - Math.exp(-dt / 85);
  shownAzimuth = interpolate(shownAzimuth, azimuth, ease);
  shownElevation = interpolate(shownElevation, elevation, ease);
  shownZoom = interpolate(shownZoom, zoom, ease);
  const finaleTime = returnView ? Math.max(0, (time - finaleSince) / 1000) : 0;
  let memoryCamera = 0;
  if (returnView && memory.phase === 'playing') {
    memoryCamera = T.MathUtils.smoothstep(finaleTime, .50, 2.72) *
      (1 - T.MathUtils.smoothstep(finaleTime, 4.38, 5.38));
    finaleCaption(finaleTime < 1.18 ? 0 : finaleTime < 3.05 ? 1 : 2);
  }
  target.copy(normalFocus).lerp(finalFocus, memoryCamera);
  const cameraDistance = distance * shownZoom * (1 - memoryCamera * (portrait ? .16 : .25));
  const span = Math.cos(shownElevation) * cameraDistance;
  camera.position.set(target.x + Math.sin(shownAzimuth) * span,
    target.y + Math.sin(shownElevation) * cameraDistance,
    target.z + Math.cos(shownAzimuth) * span);
  camera.lookAt(target);
  camera.updateMatrixWorld();

  const lightProgress = moving ? easeOut((time - dimBegin) / 610) : 1;
  dimMix = interpolate(dimFrom, Number(dim), lightProgress);
  toggle.rotation.x = interpolate(-.43, .43, dimMix);
  const closingLight = returnView && moving ? memoryCamera * .77 : 0;
  const roomDim = Math.max(dimMix, closingLight);
  key.intensity = interpolate(3, .56, roomDim);
  fill.intensity = interpolate(1.18, .44, roomDim);
  bounce.intensity = interpolate(1.5, .46, roomDim);
  lampKey.intensity = interpolate(34, 54, dimMix);
  bulbMat.emissiveIntensity = interpolate(1.8, 3.2, dimMix);
  renderer.toneMappingExposure = interpolate(1.26, 1.14, dimMix);

  const candleAge = (time - candleStart) / 1000;
  for (let i = 0; i < flames.length; i++) {
    const elapsed = candleAge - i * .09;
    const burn = moving && snuffed ? 1 - easeOut((elapsed + .04) / .18) : Number(!snuffed);
    const t = time * .008 + i * 1.7;
    const flame = flames[i];
    flame.visible = burn > .012;
    flame.rotation.z = moving ? .10 * Math.sin(t) - (1 - burn) * .53 : 0;
    const flicker = moving ? Math.sin(t * 1.2) : 0;
    flame.scale.set(1 + .045 * flicker, burn * (1 + .11 * flicker), 1);
    const {cloud, vapor} = smoke[i];
    cloud.visible = moving && snuffed && elapsed > .12 && elapsed < 1.28;
    if (cloud.visible) {
      const rise = (elapsed - .12) / 1.16;
      cloud.position.x = .33 * rise + .049 * Math.sin(rise * 8);
      cloud.position.y = flame.position.y + .64 * rise;
      cloud.scale.setScalar(.55 + 2.7 * rise);
      vapor.opacity = Math.sin(Math.PI * rise) * .25;
    }
  }
  candleGlow.intensity = 3.9 * (snuffed ? moving ? 1 - easeOut(candleAge / .36) : 0 : 1);

  const waving = (time - joyStart) / 1000;
  const activeJoy = moving && waving >= 0 && waving < 1.13;
  const hop = activeJoy ? Math.sin(Math.PI * waving / 1.13) : 0;
  const reaching = memoryCamera * T.MathUtils.smoothstep(finaleTime, 1.10, 2.55);
  wavingArm.rotation.z = activeJoy ? hop * .45 * Math.sin(waving * 23) : .33 * reaching;
  toy.position.y = .16 + .13 * hop + .06 * reaching;
  toy.rotation.y = -.11 + .30 * hop - .48 * reaching;
  head.rotation.z = activeJoy ? .095 * hop * Math.sin(waving * 12) : .18 * reaching;
  joyRing.visible = activeJoy;
  joyRing.rotation.z = activeJoy ? waving * .30 : 0;

  const letterAge = (time - letterStart) / 1000;
  const closeAge = (time - letterClose) / 1000;
  const closing = moving && closeAge >= 0 && closeAge < .43;
  const opening = moving && closeAge === Infinity && (letterAge < .65 || $('card').open);
  const flapAmount = closing ? 1 - easeOut((closeAge - .17) / .26) : opening ? easeOut(letterAge / .36) : 0;
  const slide = closing ? 1 - easeOut(closeAge / .24) : opening ? easeOut((letterAge - .25) / .40) : 0;
  const unfolding = opening || closing;
  flapPivot.rotation.x = -flapAmount * 2.22;
  greeting.visible = slide > .01;
  greeting.position.set(0, .135 + .23 * slide, .81 * slide);
  greeting.rotation.x = -.29 * slide;

  const burst = candleAge - .25;
  const activeBurst = moving && snuffed && burst >= 0 && burst < 1.47;
  for (const {mesh, dx, dz, dy, spin} of particles) {
    mesh.visible = activeBurst;
    if (activeBurst) {
      mesh.position.set(cakeHit.position.x + dx * burst,
        Math.max(tableHeight + .021, 3.65 + dy * burst - 4.7 * burst * burst),
        cakeHit.position.z + dz * burst);
      mesh.rotation.set(burst * spin, burst * dx, burst * spin * .47);
    }
  }

  const cameraMoving = Math.abs(azimuth - shownAzimuth) + Math.abs(elevation - shownElevation) +
    Math.abs(zoom - shownZoom) > .002;
  if (hoverPoint && !gesture && (hoverDirty || cameraMoving)) {
    hoverDirty = false;
    hovered = hit(...hoverPoint);
    stage.style.cursor = hovered ? 'pointer' : '';
  }
  if (memory.update(time, !moving) || (returnView && memory.phase === 'saved')) finishFinale();
  updateHover();
  updateDiscoveryMarks();
  if (activeJoy || wasWaving || unfolding !== wasUnfolding || closing || (opening && letterAge < .66) || lightProgress < 1 || returnView) {
    renderer.shadowMap.needsUpdate = true;
  }
  wasWaving = activeJoy;
  wasUnfolding = unfolding;
  renderer.render(scene, camera);
  if (cameraMoving || activeJoy || closing || returnView || (moving && (music.playing || lightProgress < 1 || letterAge < .66 || !snuffed || candleAge < 1.74))) requestDraw();
}
size();
$('loading').hidden = true;
showGuide();
memory.restore(() => {
  $('memory').hidden = false;
  requestDraw();
});
