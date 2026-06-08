let audioCtx = null;

export function ensureAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

export function warmAudio() {
    ensureAudio();
    const buffer = audioCtx.createBuffer(1, 1, 22050);
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start();
}

export function playTone(freq, type, duration, vol = 0.15) {
    ensureAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}
export function playAchievement() {
    playTone(784, 'triangle', 0.08, 0.12);
    setTimeout(() => playTone(988, 'triangle', 0.12, 0.12), 100);
    setTimeout(() => playTone(1175, 'triangle', 0.2, 0.1), 220);
}
export function playClick() { playTone(520, 'triangle', 0.06, 0.08); }
export function playSnap() {
    playTone(440, 'sine', 0.15, 0.2);
    setTimeout(() => playTone(660, 'sine', 0.2, 0.15), 80);
    setTimeout(() => playTone(880, 'sine', 0.3, 0.1), 160);
}
export function playStar() {
    playTone(523, 'sine', 0.1, 0.12);
    setTimeout(() => playTone(659, 'sine', 0.1, 0.12), 100);
    setTimeout(() => playTone(784, 'sine', 0.15, 0.12), 200);
}
export function playWin() {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playTone(f, 'sine', 0.25, 0.1), i * 120));
}

export function initAudioWarmup() {
    document.addEventListener('pointerdown', warmAudio, { once: true });
    document.addEventListener('touchstart', warmAudio, { once: true });
}

export function playQuizSelect() {
    playTone(880, 'sine', 0.06, 0.1);
    setTimeout(() => playTone(1100, 'sine', 0.1, 0.08), 60);
}
export function playHover() {
    playTone(880, 'sine', 0.03, 0.05);
    setTimeout(() => playTone(1320, 'sine', 0.05, 0.04), 30);
}