import { cueSheet, moments } from './timeline.js?v=joy-arrival';

const stage = document.querySelector('#stage');
const action = document.querySelector('#birthday-action');
const status = document.querySelector('#birthday-status');
const line = document.querySelector('#line');
const poem = document.querySelector('#poem');
const light = document.querySelector('#candlelight');
const audio = document.querySelector('#birthday-audio');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let scene;
let phase = 'ready';
let startedAt = 0;
let returningAt = null;
let audioBlocked = false;
let frame = 0;
let activeCue;
let gesture;
let pinch;
const pointers = new Map();

function smooth(from, to, value) {
  const t = Math.max(0, Math.min(1, (value - from) / (to - from)));
  return t * t * (3 - 2 * t);
}
function fallback() {
  scene = null;
  stage.dataset.flat = '';
  action.disabled = phase === 'playing' || phase === 'returning';
  requestDraw();
}
function resize() {
  if (scene) {
    try { scene.resize(stage.clientWidth, stage.clientHeight); }
    catch (error) { console.error(error); fallback(); }
  }
  requestDraw();
}

function paintWords(seconds) {
  const cue = cueSheet.find(({start, end}) => seconds >= start && seconds < end);
  if (cue !== activeCue) {
    activeCue = cue;
    line.textContent = cue?.text ?? '';
    line.classList.toggle('greeting', !!cue?.greeting);
    line.classList.toggle('poem-lead', !!cue?.poem);
    poem.hidden = !cue?.poem;
    poem.textContent = cue?.poem ?? '';
    if (cue) status.textContent = cue.text;
  }
  if (!cue) {
    line.style.opacity = poem.style.opacity = '0';
    return;
  }
  const rise = smooth(cue.start, cue.start + 1.42, seconds);
  const fade = smooth(cue.end - 1.48, cue.end, seconds);
  line.style.opacity = String(rise * (1 - fade));
  line.style.transform = reducedMotion.matches ? '' : 'translateY(' + ((1 - rise) * 15 - fade * 8) + 'px)';
  if (cue.poem) {
    const verse = smooth(cue.poemAt, cue.poemAt + 1.23, seconds);
    poem.style.opacity = String(verse * (1 - fade));
    if (seconds >= cue.poemAt && status.textContent === cue.text) {
      const quote = document.createElement('span');
      quote.lang = 'zh-Hans';
      quote.textContent = cue.poem;
      status.append(' ', quote);
    }
  }
}

function paintScene(seconds, enter = 0) {
  stage.toggleAttribute('data-ignited', phase !== 'ready');
  stage.toggleAttribute('data-orb', phase === 'returning' || seconds >= moments.orbStart);
  stage.style.setProperty('--enter', String(enter));
  if (!scene) {
    stage.style.setProperty('--dark', String(.72 * smooth(moments.darkFrom, moments.darkTo, seconds)));
    return;
  }
  try {
    if (phase === 'returning') scene.enterOrb(enter);
    else scene.draw(seconds, reducedMotion.matches, phase);
    if (phase === 'returning') {
      light.style.setProperty('--light-x', '50%');
      light.style.setProperty('--light-y', '50%');
    } else {
      const [x, y] = scene.glowPosition();
      const landing = returningAt === null ? 1 : smooth(0, 1.13, seconds);
      light.style.setProperty('--light-x', (50 + (x * 100 - 50) * landing) + '%');
      light.style.setProperty('--light-y', (50 + (y * 100 - 50) * landing) + '%');
    }
  } catch (error) {
    console.error(error);
    fallback();
  }
}

function render(now) {
  frame = 0;
  const returnAge = phase === 'returning' ? Math.max(0, (now - returningAt) / 1000) : 0;
  if (phase === 'returning' && returnAge >= moments.returnTime) {
    beginShow(returningAt + moments.returnTime * 1000, false);
  }

  if (phase === 'returning') {
    const push = reducedMotion.matches ? 0 : smooth(0, moments.returnTime, returnAge);
    paintScene(moments.end, push);
    paintWords(0);
    light.style.opacity = String(smooth(.92, moments.returnTime - .15, returnAge));
  } else {
    const seconds = phase === 'ready' ? 0 : phase === 'done' ? moments.end :
      Math.max(0, (now - startedAt) / 1000);
    paintScene(seconds);
    paintWords(seconds);
    const bloom = smooth(moments.glowStart, moments.orbStart - .1, seconds) *
      (1 - smooth(moments.orbStart + .08, moments.orbClear, seconds));
    const openingGlow = returningAt !== null && phase === 'playing' ? 1 - smooth(0, 1.13, seconds) : 0;
    light.style.opacity = String(Math.max(bloom, openingGlow));
    if (phase === 'playing' && seconds >= moments.end) {
      phase = 'done';
      stage.dataset.phase = phase;
      stage.style.cursor = 'pointer';
      action.textContent = 'Enter the golden memory and replay the birthday';
      action.disabled = false;
      status.textContent = 'A golden birthday memory. Tap the orb to replay the birthday.';
    }
  }
  if (phase === 'playing' || phase === 'returning' || scene?.moving) requestDraw();
}
function requestDraw() {
  if (!frame && !document.hidden) frame = requestAnimationFrame(render);
}

function playAudio(offset = 0) {
  audioBlocked = false;
  audio.currentTime = Math.max(0, offset);

  audio.play().catch(() => { audioBlocked = true; });
}

function beginShow(time, playMusic) {
  phase = 'playing';
  stage.dataset.phase = phase;
  stage.style.cursor = '';
  action.disabled = true;
  status.textContent = 'The candles are lit.';
  startedAt = time;
  if (playMusic) playAudio(moments.returnTime);
  requestDraw();
}
function start() {
  if (phase === 'ready') beginShow(performance.now(), true);
}
function returnThroughOrb() {
  if (phase !== 'done') return;
  phase = 'returning';
  stage.dataset.phase = phase;
  stage.style.cursor = '';
  action.disabled = true;
  status.textContent = 'Entering the golden birthday memory.';
  returningAt = performance.now();
  scene?.resetView();
  // The recording includes a silent lead-in for the camera move through the orb.
  playAudio();
  requestDraw();
}
action.addEventListener('click', () => phase === 'done' ? returnThroughOrb() : start());
action.addEventListener('keydown', (event) => {
  if (phase !== 'ready' || !scene) return;
  const direction = {ArrowLeft: [.08, 0], ArrowRight: [-.08, 0], ArrowUp: [0, .08], ArrowDown: [0, -.08]}[event.key];
  if (!direction) return;
  event.preventDefault();
  scene.orbit(...direction);
  requestDraw();
});

function onCake(x, y, touch) {
  if (scene) return scene.intersectsCake(x, y, touch);
  const rect = stage.getBoundingClientRect();
  return Math.abs(x - rect.width * .5) < Math.min(rect.width * .39, rect.height * .28) &&
    y > rect.height * .19 && y < rect.height * .69;
}
function onOrb(x, y) {
  return Math.hypot(x - stage.clientWidth / 2, y - stage.clientHeight / 2) <
    (scene?.orbRadius ?? Math.min(stage.clientWidth * .20, 117.5)) * 1.08;
}
function distanceBetweenTouches() {
  const [a, b] = pointers.values();
  return Math.max(1, Math.hypot(a.x - b.x, a.y - b.y));
}
stage.addEventListener('pointerdown', (event) => {
  if (event.target === action || event.button !== 0) return;
  if (phase === 'returning') return;
  if (phase === 'playing') {
    if (audioBlocked) {
      const seconds = moments.returnTime + (performance.now() - startedAt) / 1000;
      if (seconds < audio.duration) playAudio(seconds);
    }
    return;
  }
  if (pointers.size && event.pointerType !== 'touch') return;
  if (pointers.size === 2) return;
  const {pointerId: id, clientX: x, clientY: y} = event;
  pointers.set(id, {x, y});
  stage.setPointerCapture(id);
  if (pointers.size === 2) {
    gesture = null;
    pinch = distanceBetweenTouches();
    return;
  }
  const touch = event.pointerType === 'touch';
  const hit = phase === 'done' ? onOrb(x, y) : onCake(x, y, touch);
  gesture = {id, x, y, lastX: x, lastY: y, hit, touch, dragging: false};
});

stage.addEventListener('pointermove', (event) => {
  const {pointerId: id, clientX: x, clientY: y} = event;
  if (pointers.has(id)) pointers.set(id, {x, y});
  if (pinch && phase === 'ready' && scene) {
    const next = distanceBetweenTouches();
    scene.zoom(pinch / next);
    pinch = next;
    requestDraw();
    return;
  }
  if (!gesture) {
    if (event.pointerType !== 'mouse' || phase === 'playing' || phase === 'returning') return;
    const hit = phase === 'done' ? onOrb(x, y) : onCake(x, y, false);
    stage.style.cursor = hit ? 'pointer' : '';
    return;
  }
  if (id !== gesture.id || phase !== 'ready' || !scene) return;
  if (!gesture.dragging && Math.hypot(x - gesture.x, y - gesture.y) < 7) return;
  gesture.dragging = true;
  stage.classList.add('dragging');
  stage.style.cursor = 'grabbing';
  scene.orbit((gesture.lastX - x) * .0042, (y - gesture.lastY) * .004);
  gesture.lastX = x;
  gesture.lastY = y;
  requestDraw();
});
function release(event, tap) {
  const {pointerId: id, clientX: x, clientY: y} = event;
  pointers.delete(id);
  if (pinch) {
    pinch = null;
    return;
  }
  if (!gesture || id !== gesture.id) return;
  const {hit, dragging, touch} = gesture;
  const close = Math.hypot(x - gesture.x, y - gesture.y) < 9;
  gesture = null;
  stage.classList.remove('dragging');
  stage.style.cursor = '';
  if (!tap || dragging || !hit || !close) return;
  if (phase === 'done' && onOrb(x, y)) returnThroughOrb();
  else if (phase === 'ready' && onCake(x, y, touch)) start();
}
stage.addEventListener('pointerup', (event) => release(event, true));
stage.addEventListener('pointercancel', (event) => release(event, false));
stage.addEventListener('lostpointercapture', (event) => release(event, false));
stage.addEventListener('wheel', (event) => {
  if (phase !== 'ready' || !scene || event.ctrlKey || event.metaKey || event.deltaY === 0) return;
  event.preventDefault();
  scene.zoom(event.deltaY > 0 ? 1.07 : .935);
  requestDraw();
}, {passive: false});

new ResizeObserver(resize).observe(stage);
reducedMotion.addEventListener('change', requestDraw);
document.addEventListener('visibilitychange', requestDraw);
try {
  const {createBirthdayScene} = await import('./table.js?v=joy-arrival');
  scene = createBirthdayScene(stage);
  scene.canvas.addEventListener('webglcontextlost', fallback);
  action.disabled = false;
  resize();
} catch (error) {
  console.error(error);
  fallback();
}
