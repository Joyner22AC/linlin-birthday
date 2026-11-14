import * as T from './vendor/three.module.js';

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
  polygon([[0,0],[1,0],[.5,.61]],'#f8deb3');
  ctx.textAlign='center';ctx.fillStyle='#7d4841';ctx.font='italic 73px Georgia';ctx.fillText('Linlin',s*.5,s*.85);
});
const envelopeTop=mat('#ffffff',.92);envelopeTop.map=envelopeMap;
const envelopeEdge=mat('#d9ad77',.91);
box(letterHit,[envelopeEdge,envelopeEdge,envelopeTop,envelopeEdge,envelopeEdge,envelopeEdge],0,.06,0,1.85,.12,1.26);
const seal=mat('#a94954',.45);
const sealSoft=mat('#cf716c',.58);
cylinder(letterHit,seal,0,.145,.073,.107,.125,.057);
const heart= new T.Shape();
heart.moveTo(0,-.049);heart.bezierCurveTo(-.136,.041,-.047,.106,0,.053);
heart.bezierCurveTo(.047,.106,.136,.041,0,-.049);
const stamp=item(letterHit,new T.ShapeGeometry(heart),sealSoft,0,.177,.073,false);stamp.rotation.x=-Math.PI/2;

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

const partyColors=['#e1877a','#ead088','#8ca992','#ecc7b1'];
const paperMats=partyColors.map((c)=>mat(c,.89));
const pareRng=random(203);
for(let i=0;i<72;i++){
  const x=(pareRng()-.5)*9.6, z=(pareRng()-.5)*5.7;
  if(Math.hypot(x-.23,z-.14)<1.75)continue;
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

const actions=new Map([[cakeHit,'candle'],[joyHit,'joy'],[letterHit,'letter'],[lampHit,'lamp']]);
const ray=new T.Raycaster();
const coord=new T.Vector2();
function hit(x,y){
  const rect=renderer.domElement.getBoundingClientRect();
  coord.set((x-rect.left)/rect.width*2-1,-(y-rect.top)/rect.height*2+1);
  ray.setFromCamera(coord,camera);
  for(const {object} of ray.intersectObjects([...actions.keys()],true)){
    if(!object.visible || (object.parent===joyRing&&!joyRing.visible))continue;
    let group=object.parent;
    while(group&&!actions.has(group))group=group.parent;
    if(group)return actions.get(group);
  }
  return null;
}

let azimuth=.03, elevation=.57, shownAzimuth=azimuth, shownElevation=elevation;
let distance=12, portrait=false, dim=false, snuffed=false, burstStart=-Infinity, joyStart=-Infinity;
let frame=0, gesture=null, nextAngle=0;
const orbitSteps=[[.03,.57],[-.35,.45],[.32,.83]];
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
function size(){
  const {width,height}=stage.getBoundingClientRect();
  if(width<1||height<1)return;
  camera.aspect=width/height;
  portrait=camera.aspect<.9;
  camera.fov=portrait ? 44 : 36;
  distance=portrait?Math.min(29,Math.max(13.2,10.8/camera.aspect)):12.4;
  target.set(0,portrait ? 1.57 : 1.53,portrait ? .07 : .17);
  camera.updateProjectionMatrix();
  renderer.setSize(width,height,false);
  requestDraw();
}
new ResizeObserver(size).observe(stage);
function message(copy){
  $('notice').textContent=copy;
  clearTimeout(message.timer);
  message.timer=setTimeout(()=>$('notice').textContent='',4100);
}
$('view').addEventListener('click',()=>{
  nextAngle=(nextAngle+1)%orbitSteps.length;
  [azimuth,elevation]=orbitSteps[nextAngle];
  requestDraw();
});
$('lamp').addEventListener('click',()=>{
  dim=!dim;
  $('lamp').setAttribute('aria-pressed',String(dim));
  key.intensity=dim ? .56 : 3.0; fill.intensity=dim ? .44 : 1.18; bounce.intensity=dim ? .46 : 1.50;
  lampKey.intensity=dim?54:34; bulbMat.emissiveIntensity=dim?3.2:1.8;
  renderer.toneMappingExposure=dim?1.14:1.26;
  requestDraw();
});
const rng=random(1114);
const particles=Array.from({length:54},(_,i)=>{
  const mesh=box(room,paperMats[i%4],0,0,0,.069,.018,.137,false);
  mesh.visible=false;
  const a=rng()*Math.PI*2, speed=.7+rng()*2.6;
  return {mesh,dx:Math.cos(a)*speed,dz:Math.sin(a)*speed,dy:1.5+rng()*3.0,spin:.8+rng()*7};
});
$('candle').addEventListener('click',()=>{
  snuffed=!snuffed;
  flames.forEach((f)=>f.visible=!snuffed);
  candleGlow.intensity=snuffed?0:3.9;
  const candle=$('candle');
  candle.setAttribute('aria-pressed',String(snuffed));
  candle.firstChild.textContent=snuffed?'重新点亮':'吹蜡烛';
  candle.lastElementChild.textContent=snuffed?'Relight':'Blow candles';
  if(snuffed){
    burstStart=performance.now();
    message('许个愿吧，琳琳。 · Make a wish, Linlin.');
  }
  requestDraw();
});
let joyTimer;
$('joy').addEventListener('click',()=>{
  if($('joy-card').open||joyTimer)return;
  joyStart=performance.now();
  const open=()=>{joyTimer=0;if(!$('card').open)$('joy-card').showModal();};
  if(motion.matches)open();
  else joyTimer=setTimeout(open,1060);
  requestDraw();
});
$('card').addEventListener('close',()=>$('letter').focus({preventScroll:true}));
$('joy-card').addEventListener('close',()=>$('joy').focus({preventScroll:true}));

stage.addEventListener('pointerdown',(e)=>{
  if(!e.isPrimary||e.button!==0)return;
  gesture={id:e.pointerId,x:e.clientX,y:e.clientY,azimuth,elevation,drag:false};
  stage.setPointerCapture(e.pointerId);
});
stage.addEventListener('pointermove',(e)=>{
  if(!gesture){
    if(e.pointerType==='mouse')stage.style.cursor=hit(e.clientX,e.clientY)?'pointer':'grab';
    return;
  }
  if(e.pointerId!==gesture.id)return;
  const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;
  if(!gesture.drag&&Math.hypot(dx,dy)<7)return;
  gesture.drag=true; stage.classList.add('dragging');stage.style.cursor='grabbing';
  azimuth=clamp(gesture.azimuth-dx*.0045,-.61,.61);
  elevation=clamp(gesture.elevation+dy*.004,.27,1.07);
  requestDraw();
});
function release(e, click){
  if(!gesture||gesture.id!==e.pointerId)return;
  const drag=gesture.drag;
  gesture=null;stage.classList.remove('dragging');stage.style.cursor='grab';
  if(click&&!drag){
    const action=hit(e.clientX,e.clientY);
    if(action)$(action).click();
  }
}
stage.addEventListener('pointerup',(e)=>release(e,true));
stage.addEventListener('pointercancel',(e)=>release(e,false));
stage.addEventListener('lostpointercapture',(e)=>release(e,false));
stage.addEventListener('webglcontextlost',()=>window.showTableFallback(),true);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)requestDraw();});
motion.addEventListener('change',requestDraw);

function requestDraw(){
  if(!frame&&!document.hidden)frame=requestAnimationFrame(render);
}
let wasWaving=false;
function render(time){
  frame=0;
  const ease=motion.matches||gesture?.drag?1:.14;
  shownAzimuth+= (azimuth-shownAzimuth)*ease;
  shownElevation+= (elevation-shownElevation)*ease;
  const span=Math.cos(shownElevation)*distance;
  camera.position.set(target.x+Math.sin(shownAzimuth)*span,target.y+Math.sin(shownElevation)*distance,target.z+Math.cos(shownAzimuth)*span);
  camera.lookAt(target);
  const waving=(time-joyStart)*.001;
  const activeJoy=!motion.matches&&waving>=0&&waving<1.15;
  wavingArm.rotation.z=activeJoy ? .36*Math.sin(waving*18) : 0;
  toy.position.y=activeJoy ? .16+.12*Math.sin(Math.PI*waving/1.15) : .16;
  joyRing.visible=activeJoy;
  joyRing.rotation.z=activeJoy?waving*.24:0;
  const burst=(time-burstStart)*.001;
  const activeBurst=!motion.matches&&burst>=0&&burst<1.47;
  for(const {mesh,dx,dz,dy,spin} of particles){
    mesh.visible=activeBurst;
    if(activeBurst){
      mesh.position.set(cakeHit.position.x+dx*burst,Math.max(1.06,3.64+dy*burst-4.7*burst*burst),cakeHit.position.z+dz*burst);
      mesh.rotation.set(burst*spin,burst*dx,burst*spin*.47);
    }
  }
  if(!snuffed&&!motion.matches)flames.forEach((flame,i)=>{
    const t=time*.008+i*1.7;
    flame.rotation.z=.10*Math.sin(t);
    flame.scale.set(1+.045*Math.sin(t*1.6),1+.11*Math.sin(t*1.2),1);
  });
  if(activeJoy || wasWaving) renderer.shadowMap.needsUpdate = true;
  wasWaving=activeJoy;
  renderer.render(scene,camera);
  const turning=Math.abs(azimuth-shownAzimuth)+Math.abs(elevation-shownElevation)>.002;
  if(turning||activeBurst||activeJoy||(!snuffed&&!motion.matches))requestDraw();
}
size();
$('loading').hidden=true;
