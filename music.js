export function connectBirthdayMusic(audio, button, onChange) {
  const preference = 'linlin-birthday:music-muted';
  let wantsMusic = true;
  let started = false;
  let pending = null;

  try {
    wantsMusic = localStorage.getItem(preference) !== '1';
  } catch {
    // Playback still works when storage is unavailable.
  }

  function sync() {
    const playing = !audio.paused && !audio.error;
    button.setAttribute('aria-pressed', String(playing));
    button.firstChild.textContent = playing ? '暂停音乐' : '播放音乐';
    button.lastElementChild.textContent = playing ? 'Pause music' : 'Play music';
    onChange(playing);
  }

  function start() {
    if (pending || !wantsMusic || !audio.paused) return;
    pending = audio.play().then(() => {
      if (wantsMusic) started = true;
      else audio.pause();
    }).catch(() => {
      // Another click can retry if the browser or device blocked playback.
    }).finally(() => {
      pending = null;
      sync();
    });
  }

  button.addEventListener('click', () => {
    wantsMusic = audio.paused && !pending;
    try {
      localStorage.setItem(preference, wantsMusic ? '0' : '1');
    } catch {
      // A preference only affects the current visit if storage is unavailable.
    }
    if (wantsMusic) start();
    else audio.pause();
    sync();
  });
  document.addEventListener('click', (event) => {
    if (!event.isTrusted || event.target.closest('#music')) return;
    if (!started) start();
  });
  for (const event of ['play', 'pause', 'error']) audio.addEventListener(event, sync);
  return {
    get playing() { return !audio.paused && !audio.error; },
    startOnGesture() { if (!started) start(); }
  };
}
