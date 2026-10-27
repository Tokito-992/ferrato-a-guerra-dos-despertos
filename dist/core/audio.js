/**
 * Áudio 100% procedural (WebAudio): trilha sintetizada por fase e efeitos
 * gerados em tempo real. Nenhum arquivo externo é necessário.
 */
/** Base sonora de cada arco. Cada capítulo aplica uma variação de humor. */
const ARC_BASES = [
    // Arco I — apocalipse urbano, rock industrial.
    { bpm: 94, root: 40, scale: [0, 2, 3, 5, 7, 8, 10], progression: [0, 0, 5, 3], padType: 'sawtooth', bassType: 'square', arp: false, drums: 1, padGain: 0.05 },
    // Arco II — cinzas, phrygian pesado.
    { bpm: 104, root: 38, scale: [0, 1, 3, 5, 7, 8, 10], progression: [0, 1, 5, 4], padType: 'sawtooth', bassType: 'sawtooth', arp: false, drums: 1.15, padGain: 0.045 },
    // Arco III — órbita, synthwave gélido.
    { bpm: 86, root: 45, scale: [0, 2, 3, 5, 7, 9, 10], progression: [0, 3, 5, 4], padType: 'triangle', bassType: 'sine', arp: true, drums: 0.75, padGain: 0.055 },
    // Arco IV — inferno, corais distorcidos.
    { bpm: 118, root: 36, scale: [0, 1, 3, 4, 6, 8, 10], progression: [0, 0, 3, 1], padType: 'sawtooth', bassType: 'square', arp: false, drums: 1.3, padGain: 0.05 },
    // Arco V — céu decadente, coro.
    { bpm: 74, root: 43, scale: [0, 2, 4, 5, 7, 9, 11], progression: [0, 5, 3, 4], padType: 'sine', bassType: 'triangle', arp: true, drums: 0.55, padGain: 0.07 },
    // Arco VI — Nexus, cosmos colossal.
    { bpm: 132, root: 33, scale: [0, 2, 3, 6, 7, 8, 11], progression: [0, 4, 1, 5], padType: 'sawtooth', bassType: 'sawtooth', arp: true, drums: 1.2, padGain: 0.06 },
];
/** Seis humores por arco: entrada, tensão, exploração, ascensão, clímax e finale. */
const CHAPTER_MOODS = [
    { bpm: 0.9, root: 0, progression: [0, 0, 0, 0], arp: false, drums: 0.78, pad: 1.15 },
    { bpm: 0.96, root: 2, progression: [0, 2, 0, 1], arp: false, drums: 0.9, pad: 1.05 },
    { bpm: 1.0, root: -2, progression: [0, 3, 1, 2], arp: true, drums: 1.0, pad: 1.0 },
    { bpm: 1.04, root: 5, progression: [0, 1, 2, 3], arp: true, drums: 1.06, pad: 1.05 },
    { bpm: 1.08, root: 7, progression: [0, 4, 1, 5], arp: true, drums: 1.14, pad: 1.12 },
    { bpm: 1.12, root: 0, progression: [0, 0, 3, 1], arp: true, drums: 1.28, pad: 1.2 },
];
export const STAGE_THEME_COUNT = 36;
export const BOSS_THEME_OFFSET = STAGE_THEME_COUNT;
const STAGE_THEMES = [];
for (let arc = 0; arc < ARC_BASES.length; arc++) {
    const base = ARC_BASES[arc];
    for (let chapter = 0; chapter < CHAPTER_MOODS.length; chapter++) {
        const mood = CHAPTER_MOODS[chapter];
        STAGE_THEMES.push({
            bpm: Math.round(base.bpm * mood.bpm),
            root: base.root + mood.root,
            scale: base.scale,
            progression: base.progression.map((step, index) => (step + mood.progression[index]) % 12),
            padType: base.padType,
            bassType: base.bassType,
            arp: base.arp || mood.arp,
            drums: Number((base.drums * mood.drums).toFixed(2)),
            padGain: Number((base.padGain * mood.pad).toFixed(3)),
        });
    }
}
/** Temas de chefe: mais graves, rápidos e dissonantes que o arco correspondente. */
const BOSS_THEMES = ARC_BASES.map((base, arc) => ({
    bpm: Math.round(base.bpm * 1.22 + 6),
    root: base.root - 5,
    scale: [0, 1, 3, 5, 7, 8, 11],
    progression: [0, 1, 5, 4].map((step) => (step + arc) % 12),
    padType: 'sawtooth',
    bassType: 'square',
    arp: true,
    drums: 1.5,
    padGain: 0.07,
}));
const THEMES = [...STAGE_THEMES, ...BOSS_THEMES];
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
export class AudioEngine {
    constructor() {
        this.ctx = null;
        this.master = null;
        this.musicBus = null;
        this.sfxBus = null;
        this.musicFilter = null;
        this.noiseBuffer = null;
        this.timer = null;
        this.step = 0;
        this.nextTime = 0;
        this.theme = THEMES[0];
        this.musicOn = false;
        this.masters = 0.9;
        this.ambienceGain = null;
        this.ambienceNodes = [];
        this.ambienceKind = null;
        this.muted = false;
    }
    init() {
        if (this.ctx) {
            void this.ctx.resume();
            return;
        }
        const Ctor = window.AudioContext ?? window.webkitAudioContext;
        if (!Ctor)
            return;
        const ctx = new Ctor();
        this.ctx = ctx;
        this.master = ctx.createGain();
        this.master.gain.value = this.muted ? 0 : this.masters;
        this.master.connect(ctx.destination);
        this.musicFilter = ctx.createBiquadFilter();
        this.musicFilter.type = 'lowpass';
        this.musicFilter.frequency.value = 3800;
        this.musicFilter.Q.value = 0.6;
        this.musicBus = ctx.createGain();
        this.musicBus.gain.value = 0.5;
        this.musicBus.connect(this.musicFilter);
        this.musicFilter.connect(this.master);
        this.sfxBus = ctx.createGain();
        this.sfxBus.gain.value = 0.85;
        this.sfxBus.connect(this.master);
        // Buffer de ruído reaproveitado por vários efeitos.
        const len = Math.floor(ctx.sampleRate * 1.2);
        const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < len; i++)
            data[i] = Math.random() * 2 - 1;
        this.noiseBuffer = buffer;
        void ctx.resume();
    }
    setMuted(muted) {
        this.muted = muted;
        if (this.ctx && this.master) {
            this.master.gain.setTargetAtTime(muted ? 0 : this.masters, this.ctx.currentTime, 0.05);
        }
    }
    toggleMuted() {
        this.setMuted(!this.muted);
        return this.muted;
    }
    // ---------------------------------------------------------------- trilha
    playMusic(themeIndex) {
        this.init();
        if (!this.ctx)
            return;
        const theme = THEMES[Math.max(0, Math.min(THEMES.length - 1, themeIndex))];
        if (this.musicOn && this.theme === theme)
            return;
        this.stopMusic();
        this.theme = theme;
        this.musicOn = true;
        this.step = 0;
        this.nextTime = this.ctx.currentTime + 0.08;
        this.timer = window.setInterval(() => this.scheduler(), 30);
    }
    stopMusic() {
        if (this.timer !== null) {
            window.clearInterval(this.timer);
            this.timer = null;
        }
        this.musicOn = false;
        if (this.ctx && this.musicBus) {
            this.musicBus.gain.cancelScheduledValues(this.ctx.currentTime);
            this.musicBus.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.08);
            // Restaura o volume para a próxima trilha.
            window.setTimeout(() => {
                if (this.ctx && this.musicBus) {
                    this.musicBus.gain.setValueAtTime(0.5, this.ctx.currentTime);
                }
            }, 220);
        }
    }
    /** Trilha de chefe: 36–41, uma para cada arco. */
    playBossMusic(arc) {
        const index = BOSS_THEME_OFFSET + Math.max(0, Math.min(BOSS_THEMES.length - 1, Math.round(arc) - 1));
        this.playMusic(index);
    }
    /**
     * Camada de ambiente contínua por plano. É independente da trilha para que
     * o jogador ainda sinta o cenário durante o silêncio entre músicas.
     */
    playAmbience(kind) {
        this.init();
        const ctx = this.ctx;
        if (!ctx || !this.master)
            return;
        if (this.ambienceKind === kind && this.ambienceGain)
            return;
        this.stopAmbience();
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.9);
        gain.connect(this.master);
        this.ambienceGain = gain;
        this.ambienceKind = kind;
        const now = ctx.currentTime;
        switch (kind) {
            case 'embers':
                this.addAmbienceNoise(gain, now, 'bandpass', 850, 0.7, 0.052, 0.18, 170);
                this.addAmbienceOsc(gain, now, 55, 'sine', 0.03);
                this.addAmbienceOsc(gain, now, 82.4, 'triangle', 0.016, 6);
                break;
            case 'ash':
                this.addAmbienceNoise(gain, now, 'lowpass', 480, 0.8, 0.06, 0.11, 230);
                this.addAmbienceOsc(gain, now, 41.2, 'sawtooth', 0.016);
                this.addAmbienceOsc(gain, now, 61.7, 'sine', 0.011);
                break;
            case 'stars':
                this.addAmbienceNoise(gain, now, 'highpass', 5200, 0.6, 0.018, 0.05, 900);
                this.addAmbienceOsc(gain, now, 220, 'sine', 0.011);
                this.addAmbienceOsc(gain, now, 329.6, 'triangle', 0.007, 4);
                break;
            case 'magma':
                this.addAmbienceNoise(gain, now, 'lowpass', 260, 0.9, 0.075, 0.07, 110);
                this.addAmbienceOsc(gain, now, 36.7, 'sawtooth', 0.028);
                this.addAmbienceOsc(gain, now, 55, 'sine', 0.016, -5);
                break;
            case 'feathers':
                this.addAmbienceNoise(gain, now, 'bandpass', 1600, 0.9, 0.028, 0.13, 420);
                this.addAmbienceOsc(gain, now, 440, 'sine', 0.011);
                this.addAmbienceOsc(gain, now, 659.3, 'triangle', 0.007);
                break;
            case 'cosmic':
                this.addAmbienceNoise(gain, now, 'lowpass', 900, 0.7, 0.045, 0.04, 180);
                this.addAmbienceOsc(gain, now, 27.5, 'sine', 0.038);
                this.addAmbienceOsc(gain, now, 41.2, 'sine', 0.018, 3);
                this.addAmbienceOsc(gain, now, 82.4, 'triangle', 0.009, -4);
                break;
        }
    }
    stopAmbience() {
        const ctx = this.ctx;
        if (!ctx || !this.ambienceGain) {
            this.ambienceKind = null;
            return;
        }
        const gain = this.ambienceGain;
        const nodes = this.ambienceNodes;
        this.ambienceGain = null;
        this.ambienceNodes = [];
        this.ambienceKind = null;
        gain.gain.cancelScheduledValues(ctx.currentTime);
        gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.08);
        window.setTimeout(() => {
            for (const node of nodes) {
                try {
                    node.stop();
                }
                catch {
                    // O nó já pode ter sido finalizado.
                }
            }
            try {
                gain.disconnect();
            }
            catch {
                // Sem conexões restantes.
            }
        }, 320);
    }
    addAmbienceOsc(bus, time, freq, type, level, detune = 0) {
        const ctx = this.ctx;
        if (!ctx)
            return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        osc.detune.value = detune;
        gain.gain.value = level;
        osc.connect(gain);
        gain.connect(bus);
        osc.start(time);
        this.ambienceNodes.push(osc);
    }
    addAmbienceNoise(bus, time, filterType, freq, q, level, lfoRate, lfoDepth) {
        const ctx = this.ctx;
        if (!ctx || !this.noiseBuffer)
            return;
        const src = ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        src.loop = true;
        const filter = ctx.createBiquadFilter();
        filter.type = filterType;
        filter.frequency.value = freq;
        filter.Q.value = q;
        const gain = ctx.createGain();
        gain.gain.value = level;
        src.connect(filter);
        filter.connect(gain);
        gain.connect(bus);
        src.start(time);
        this.ambienceNodes.push(src);
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = Math.max(0.01, lfoRate);
        lfoGain.gain.value = lfoDepth;
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start(time);
        this.ambienceNodes.push(lfo);
    }
    scheduler() {
        const ctx = this.ctx;
        if (!ctx || !this.musicOn)
            return;
        const stepDur = 60 / this.theme.bpm / 4; // semicolcheias
        while (this.nextTime < ctx.currentTime + 0.18) {
            this.scheduleStep(this.step, this.nextTime);
            this.step++;
            this.nextTime += stepDur;
        }
    }
    scheduleStep(step, time) {
        const ctx = this.ctx;
        const bus = this.musicBus;
        if (!ctx || !bus)
            return;
        const t = this.theme;
        const bar = Math.floor(step / 16) % 4;
        const s16 = step % 16;
        const root = t.root + t.progression[bar];
        const stepDur = 60 / t.bpm / 4;
        // Bumbo / caixa / chimbal.
        if (s16 === 0 || s16 === 8)
            this.kick(time, 0.5 * t.drums);
        if (s16 === 4 || s16 === 12)
            this.snare(time, 0.24 * t.drums);
        if (s16 % 2 === 0)
            this.hat(time, 0.05 * t.drums + 0.01);
        // Baixo em colcheias.
        if (s16 % 4 === 0 || s16 === 6 || s16 === 14) {
            const off = s16 === 6 ? 3 : s16 === 14 ? 5 : 0;
            this.musicTone(midi(root - 12 + off), time, stepDur * 1.6, 0.11, t.bassType, 620);
        }
        // Pad sustentado em cada compasso.
        if (s16 === 0) {
            const chord = [0, t.scale[2], t.scale[4], t.scale[6]];
            chord.forEach((c, i) => {
                this.musicTone(midi(root + 12 + c), time, stepDur * 14, t.padGain / (i * 0.4 + 1), t.padType, 2200);
            });
        }
        // Arpejo celestial/cósmico.
        if (t.arp) {
            const pattern = [0, 2, 4, 6, 4, 2, 7, 4];
            const oct = [0, 12, 12, 24][Math.floor(step / 16) % 4];
            const note = t.scale[pattern[s16 % pattern.length] % t.scale.length];
            this.musicTone(midi(root + 24 + oct + note), time, stepDur * 0.9, 0.03, 'triangle', 6000);
        }
        // Sino esparso no último tema.
        if (t.bpm > 120 && s16 === 10) {
            this.musicTone(midi(root + 31), time, stepDur * 3, 0.03, 'sine', 8000);
        }
    }
    musicTone(freq, time, dur, gain, type, cutoff) {
        const ctx = this.ctx;
        const bus = this.musicBus;
        if (!ctx || !bus)
            return;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = cutoff;
        osc.type = type;
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, time);
        g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), time + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
        osc.connect(g);
        g.connect(filter);
        filter.connect(bus);
        osc.start(time);
        osc.stop(time + dur + 0.05);
    }
    kick(time, gain) {
        const ctx = this.ctx;
        const bus = this.musicBus;
        if (!ctx || !bus)
            return;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, time);
        osc.frequency.exponentialRampToValueAtTime(46, time + 0.16);
        g.gain.setValueAtTime(gain, time);
        g.gain.exponentialRampToValueAtTime(0.0001, time + 0.2);
        osc.connect(g);
        g.connect(bus);
        osc.start(time);
        osc.stop(time + 0.24);
    }
    snare(time, gain) {
        const ctx = this.ctx;
        const bus = this.musicBus;
        if (!ctx || !bus || !this.noiseBuffer)
            return;
        const src = ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1900;
        filter.Q.value = 0.9;
        const g = ctx.createGain();
        g.gain.setValueAtTime(gain, time);
        g.gain.exponentialRampToValueAtTime(0.0001, time + 0.13);
        src.connect(filter);
        filter.connect(g);
        g.connect(bus);
        src.start(time);
        src.stop(time + 0.16);
    }
    hat(time, gain) {
        const ctx = this.ctx;
        const bus = this.musicBus;
        if (!ctx || !bus || !this.noiseBuffer)
            return;
        const src = ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 7800;
        const g = ctx.createGain();
        g.gain.setValueAtTime(gain, time);
        g.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);
        src.connect(filter);
        filter.connect(g);
        g.connect(bus);
        src.start(time);
        src.stop(time + 0.06);
    }
    // ---------------------------------------------------------------- efeitos
    sfx(name) {
        if (this.muted)
            return;
        this.init();
        const ctx = this.ctx;
        if (!ctx)
            return;
        const t = ctx.currentTime;
        switch (name) {
            case 'hit':
                this.tone(t, 210, 'square', 0.12, 0.09, 60);
                this.noise(t, 0.07, 0.18, 1400, 'bandpass');
                break;
            case 'heavy':
                this.tone(t, 120, 'sawtooth', 0.26, 0.22, 42);
                this.noise(t, 0.16, 0.3, 700, 'lowpass');
                break;
            case 'zap':
                this.tone(t, 1600, 'sawtooth', 0.26, 0.13, 220);
                this.tone(t + 0.02, 900, 'square', 0.22, 0.12, 120);
                this.noise(t, 0.1, 0.15, 5200, 'highpass');
                break;
            case 'magma':
                this.tone(t, 70, 'sawtooth', 0.5, 0.22, 34);
                this.noise(t, 0.42, 0.28, 420, 'lowpass');
                break;
            case 'gravity':
                this.tone(t, 300, 'sine', 0.55, 0.16, 40);
                this.tone(t, 150, 'triangle', 0.5, 0.14, 30);
                break;
            case 'slash':
                this.noise(t, 0.16, 0.2, 3200, 'bandpass');
                this.tone(t, 720, 'sawtooth', 0.16, 0.06, 180);
                break;
            case 'seal':
                this.tone(t, 880, 'sine', 0.4, 0.12, 880);
                this.tone(t + 0.06, 1320, 'sine', 0.5, 0.1, 1320);
                this.tone(t + 0.12, 1760, 'triangle', 0.5, 0.08, 1760);
                break;
            case 'heal':
                this.tone(t, 520, 'sine', 0.18, 0.1, 780);
                this.tone(t + 0.08, 780, 'sine', 0.22, 0.1, 1040);
                break;
            case 'blink':
                this.tone(t, 300, 'triangle', 0.2, 0.1, 1500);
                this.noise(t, 0.12, 0.08, 4200, 'highpass');
                break;
            case 'explode':
                this.noise(t, 0.55, 0.38, 1200, 'lowpass');
                this.tone(t, 90, 'sawtooth', 0.45, 0.3, 30);
                break;
            case 'jump':
                this.tone(t, 380, 'triangle', 0.13, 0.08, 720);
                break;
            case 'land':
                this.noise(t, 0.08, 0.07, 500, 'lowpass');
                break;
            case 'dash':
                this.noise(t, 0.2, 0.14, 2600, 'bandpass');
                this.tone(t, 500, 'sawtooth', 0.16, 0.05, 160);
                break;
            case 'hurt':
                this.tone(t, 260, 'sawtooth', 0.22, 0.16, 90);
                this.noise(t, 0.12, 0.14, 900, 'lowpass');
                break;
            case 'death':
                this.tone(t, 220, 'sawtooth', 0.7, 0.2, 50);
                this.noise(t + 0.05, 0.5, 0.18, 600, 'lowpass');
                break;
            case 'ui':
                this.tone(t, 660, 'square', 0.06, 0.035, 660);
                break;
            case 'select':
                this.tone(t, 520, 'triangle', 0.07, 0.05, 720);
                break;
            case 'confirm':
                this.tone(t, 480, 'triangle', 0.1, 0.07, 760);
                this.tone(t + 0.08, 760, 'triangle', 0.12, 0.06, 1100);
                break;
            case 'wave':
                this.tone(t, 440, 'sine', 0.3, 0.12, 660);
                this.tone(t + 0.1, 660, 'sine', 0.3, 0.11, 880);
                this.tone(t + 0.2, 880, 'sine', 0.35, 0.1, 1100);
                break;
            case 'boss':
                this.tone(t, 55, 'sawtooth', 1.2, 0.3, 55);
                this.tone(t + 0.1, 82, 'square', 1.0, 0.18, 40);
                this.noise(t, 0.8, 0.2, 260, 'lowpass');
                break;
            case 'roar':
                this.tone(t, 90, 'sawtooth', 0.9, 0.28, 40);
                this.tone(t + 0.05, 140, 'square', 0.8, 0.2, 60);
                this.noise(t, 0.7, 0.24, 500, 'lowpass');
                break;
            case 'echo':
                this.tone(t, 700, 'sine', 0.3, 0.08, 1400);
                this.tone(t + 0.1, 1050, 'sine', 0.3, 0.06, 2100);
                break;
            case 'beam':
                this.tone(t, 1200, 'sawtooth', 0.6, 0.09, 200);
                this.tone(t, 300, 'square', 0.6, 0.08, 90);
                break;
            case 'abilityRavi':
                this.tone(t, 1800, 'sawtooth', 0.34, 0.16, 220);
                this.tone(t + 0.035, 900, 'square', 0.3, 0.12, 140);
                this.tone(t + 0.1, 2400, 'sine', 0.28, 0.08, 3200);
                this.noise(t, 0.18, 0.16, 5600, 'highpass');
                break;
            case 'abilityMiriam':
                this.tone(t, 62, 'sawtooth', 0.54, 0.34, 28);
                this.tone(t + 0.08, 220, 'triangle', 0.42, 0.15, 72);
                this.noise(t, 0.48, 0.3, 430, 'lowpass');
                break;
            case 'abilityKael':
                this.tone(t, 560, 'sine', 0.58, 0.17, 52);
                this.tone(t + 0.04, 260, 'triangle', 0.52, 0.13, 38);
                this.tone(t + 0.2, 900, 'sine', 0.3, 0.06, 120);
                this.noise(t, 0.38, 0.07, 300, 'lowpass');
                break;
            case 'abilityOzric':
                this.tone(t, 130, 'sawtooth', 0.48, 0.24, 38);
                this.tone(t + 0.07, 720, 'sawtooth', 0.28, 0.13, 90);
                this.noise(t, 0.3, 0.18, 950, 'bandpass');
                break;
            case 'abilityElodie':
                [880, 1320, 1760].forEach((freq, i) => {
                    this.tone(t + i * 0.05, freq, 'sine', 0.56, 0.09, freq * 1.01);
                });
                this.noise(t, 0.24, 0.07, 6500, 'highpass');
                break;
            case 'abilityThryc':
                this.tone(t, 520, 'sine', 0.46, 0.13, 1040);
                this.tone(t + 0.14, 780, 'sine', 0.48, 0.09, 1560);
                this.tone(t + 0.28, 1040, 'triangle', 0.56, 0.07, 2080);
                this.noise(t + 0.1, 0.28, 0.07, 3000, 'bandpass');
                break;
            case 'victory':
                [523, 659, 784, 1046].forEach((f, i) => this.tone(t + i * 0.13, f, 'triangle', 0.6, 0.12, f));
                break;
            case 'gameover':
                [392, 330, 262, 196].forEach((f, i) => this.tone(t + i * 0.18, f, 'sawtooth', 0.7, 0.12, f * 0.9));
                break;
        }
    }
    tone(time, freq, type, dur, gain, endFreq) {
        const ctx = this.ctx;
        const bus = this.sfxBus;
        if (!ctx || !bus)
            return;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(Math.max(20, freq), time);
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), time + dur);
        g.gain.setValueAtTime(0.0001, time);
        g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), time + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
        osc.connect(g);
        g.connect(bus);
        osc.start(time);
        osc.stop(time + dur + 0.03);
    }
    noise(time, dur, gain, cutoff, filterType) {
        const ctx = this.ctx;
        const bus = this.sfxBus;
        if (!ctx || !bus || !this.noiseBuffer)
            return;
        const src = ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        const filter = ctx.createBiquadFilter();
        filter.type = filterType;
        filter.frequency.value = cutoff;
        filter.Q.value = 1.1;
        const g = ctx.createGain();
        g.gain.setValueAtTime(gain, time);
        g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
        src.connect(filter);
        filter.connect(g);
        g.connect(bus);
        src.start(time);
        src.stop(time + dur + 0.02);
    }
}
//# sourceMappingURL=audio.js.map