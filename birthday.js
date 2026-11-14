const stage = document.querySelector('#stage');
const action = document.querySelector('#birthday-action');
const status = document.querySelector('#birthday-status');
const line = document.querySelector('#line');
const light = document.querySelector('#candlelight');
const audio = document.querySelector('#birthday-audio');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const endTime = 30.3;
const cues = [
  {start: 2.25, end: 8.65, greeting: true, text: 'Happy Birthday, Linlin!'},
  {start: 11.42, end: 16.15, text: 'Here’s to all the things you’ll learn, and to good health along the way.'},
  {start: 16.27, end: 21.65, text: 'And here’s to our friendship, Linlin. Let’s make a whole shelf of happy memories.'}
];

let scene;
let phase = 'ready';
let startedAt = 0;
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
  action.disabled = phase === 'playing';
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
  const cue = cues.find(({start, end}) => seconds >= start && seconds < end);
  if (cue !== activeCue) {
    activeCue = cue;
    line.textContent = cue?.text ?? '';
    line.classList.toggle('greeting', !!cue?.greeting);
    if (cue) status.textContent = cue.text;
  }
  if (!cue) {
    line.style.opacity = '0';
    return;
  }
  const rise = smooth(cue.start, cue.start + 1.15, seconds);
  const fade = smooth(cue.end - 1.18, cue.end, seconds);
  line.style.opacity = String(rise * (1 - fade));
  line.style.transform = reducedMotion.matches ? '' : 'translateY(' + ((1 - rise) * 18 - fade * 10) + 'px)';
}

function paintScene(seconds) {
  const running = phase !== 'ready';
  stage.toggleAttribute('data-ignited', running);
  stage.toggleAttribute('data-orb', seconds >= 26.3);
  if (!scene) {
    stage.style.setProperty('--dark', String(.72 * smooth(.72, 1.48, seconds)));
    return;
  }
  try {
    scene.draw(seconds, reducedMotion.matches, phase);
    const [x, y] = scene.glowPosition();
    light.style.setProperty('--light-x', x * 100 + '%');
    light.style.setProperty('--light-y', y * 100 + '%');
  } catch (error) {
    console.error(error);
    fallback();
  }
}
function render(now) {
  frame = 0;
  const seconds = phase === 'ready' ? 0 : phase === 'done' ? endTime : Math.max(0, (now - startedAt) / 1000);
  paintScene(seconds);
  paintWords(seconds);
  const bloom = smooth(22.05, 26.2, seconds) * (1 - smooth(26.38, 28.62, seconds));
  light.style.opacity = String(bloom);

  if (phase === 'playing' && seconds >= endTime) {
    phase = 'done';
    stage.dataset.phase = phase;
    stage.style.cursor = 'pointer';
    action.textContent = 'Return to the birthday table';
    action.disabled = false;
    status.textContent = 'A golden birthday memory. Tap the orb to return to the birthday table.';
  }
  if (phase === 'playing' || scene?.moving) requestDraw();
}
function requestDraw() {
  if (!frame && !document.hidden) frame = requestAnimationFrame(render);
}

function start() {
  if (phase !== 'ready') return;
  phase = 'playing';
  stage.dataset.phase = phase;
  stage.style.cursor = '';
  action.disabled = true;
  status.textContent = 'The candles are lit.';
  startedAt = performance.now();
  audio.currentTime = 0;
  audio.play().catch(() => {
    // If the browser blocked playback, a later click can join the music to the scene.
  });
  requestDraw();
}
function reset() {
  if (phase !== 'done') return;
  phase = 'ready';
  stage.dataset.phase = phase;
  stage.style.cursor = '';
  action.textContent = 'Light the birthday candles';
  status.textContent = '';
  audio.pause();
  audio.currentTime = 0;
  scene?.reset();
  requestDraw();
}
action.addEventListener('click', () => phase === 'done' ? reset() : start());
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
  if (phase === 'playing') {
    if (audio.paused && !audio.seeking && audio.currentTime === 0) {
      audio.currentTime = Math.min(audio.duration || endTime, (performance.now() - startedAt) / 1000);
      audio.play().catch(() => { audio.currentTime = 0; });
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
    if (event.pointerType !== 'mouse' || phase === 'playing') return;
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
  if (phase === 'done' && onOrb(x, y)) reset();
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
  const {createBirthdayScene} = await import('./table.js?v=finale');
  scene = createBirthdayScene(stage);
  scene.canvas.addEventListener('webglcontextlost', fallback);
  action.disabled = false;
  resize();
} catch (error) {
  console.error(error);
  fallback();
}
