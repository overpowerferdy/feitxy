/** Short, distinct chimes for rest and workout timers. Works offline in the WebView. */
let audioContext: AudioContext | null = null;

type AlertKind = 'rest' | 'finish';

export function playTimerAlert(kind: AlertKind = 'rest') {
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    audioContext ??= new Ctor();
    const ctx = audioContext;
    void ctx.resume();

    const start = ctx.currentTime + 0.01;
    const notes = kind === 'finish' ? [784, 988, 1319] : [659, 880, 659];
    notes.forEach((frequency, index) => {
      const at = start + index * 0.19;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, at);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.16, at + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.17);
      osc.connect(gain).connect(ctx.destination);
      osc.start(at);
      osc.stop(at + 0.18);
    });

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(kind === 'finish' ? [120, 70, 180] : 110);
    }
  } catch {
    // Audio can be blocked before the first tap; timers still work silently.
  }
}
