/**
 * Áudio 100% procedural (WebAudio): trilha sintetizada por fase e efeitos
 * gerados em tempo real. Nenhum arquivo externo é necessário.
 *
 * A trilha usa uma forma longa de 32 compassos dividida em quatro seções
 * (verso, ascensão, clímax e respiro). Cada tema tem progressão própria,
 * pad, baixo, arpejo, bateria e uma melodia gerada a partir de um motivo.
 * Reverb e delay também são sintetizados no navegador.
 */
/** Base sonora de cada arco. Cada capítulo aplica uma variação de humor. */
const ARC_BASES = [
    // Arco I — apocalipse urbano, rock industrial.
    { bpm: 92, root: 40, scale: [0, 2, 3, 5, 7, 8, 10], progression: [0, 5, 3, 4, 0, 5, 6, 4], padType: 'sawtooth', bassType: 'square', leadType: 'triangle', arp: false, drums: 1, padGain: 0.05, leadGain: 1, seed: 11, boss: false, arc: 1 },
    // Arco II — cinzas, phrygian pesado.
    { bpm: 100, root: 38, scale: [0, 1, 3, 5, 7, 8, 10], progression: [0, 1, 5, 4, 0, 6, 5, 1], padType: 'sawtooth', bassType: 'sawtooth', leadType: 'triangle', arp: false, drums: 1.15, padGain: 0.045, leadGain: 1.05, seed: 23, boss: false, arc: 2 },
    // Arco III — órbita, synthwave gélido.
    { bpm: 88, root: 45, scale: [0, 2, 3, 5, 7, 9, 10], progression: [0, 3, 5, 4, 0, 3, 6, 4], padType: 'triangle', bassType: 'sine', leadType: 'sine', arp: true, drums: 0.75, padGain: 0.055, leadGain: 1.05, seed: 37, boss: false, arc: 3 },
    // Arco IV — inferno, corais distorcidos.
    { bpm: 112, root: 36, scale: [0, 2, 3, 5, 7, 8, 11], progression: [0, 5, 3, 4, 0, 5, 1, 4], padType: 'sawtooth', bassType: 'square', leadType: 'sawtooth', arp: false, drums: 1.3, padGain: 0.05, leadGain: 1.1, seed: 41, boss: false, arc: 4 },
    // Arco V — céu decadente, coro etéreo.
    { bpm: 76, root: 43, scale: [0, 2, 4, 6, 7, 9, 11], progression: [0, 4, 5, 3, 0, 4, 3, 4], padType: 'sine', bassType: 'triangle', leadType: 'sine', arp: true, drums: 0.55, padGain: 0.07, leadGain: 1.15, seed: 53, boss: false, arc: 5 },
    // Arco VI — Nexus, cosmos colossal.
    { bpm: 124, root: 33, scale: [0, 1, 4, 5, 7, 8, 11], progression: [0, 5, 3, 4, 0, 6, 5, 4], padType: 'sawtooth', bassType: 'sawtooth', leadType: 'triangle', arp: true, drums: 1.2, padGain: 0.06, leadGain: 1.25, seed: 67, boss: false, arc: 6 },
];
/** Seis humores por arco: entrada, tensão, exploração, ascensão, clímax e finale. */
const CHAPTER_MOODS = [
    { bpm: 0.9, transpose: 0, rotate: 0, arp: false, drums: 0.7, pad: 1.16, lead: 0.82 },
    { bpm: 0.95, transpose: 2, rotate: 1, arp: false, drums: 0.86, pad: 1.08, lead: 0.9 },
    { bpm: 1.0, transpose: -2, rotate: 2, arp: true, drums: 1.0, pad: 1.0, lead: 1.0 },
    { bpm: 1.04, transpose: 3, rotate: 3, arp: true, drums: 1.08, pad: 1.04, lead: 1.08 },
    { bpm: 1.08, transpose: 5, rotate: 4, arp: true, drums: 1.16, pad: 1.1, lead: 1.18 },
    { bpm: 1.12, transpose: 0, rotate: 5, arp: true, drums: 1.28, pad: 1.2, lead: 1.28 },
];
export const STAGE_THEME_COUNT = 36;
const round2 = (value) => Math.round(value * 100) / 100;
const round3 = (value) => Math.round(value * 1000) / 1000;
const STAGE_THEMES = [];
for (let arc = 0; arc < ARC_BASES.length; arc++) {
    const base = ARC_BASES[arc];
    for (let chapter = 0; chapter < CHAPTER_MOODS.length; chapter++) {
        const mood = CHAPTER_MOODS[chapter];
        const progression = base.progression.map((_, index) => base.progression[(index + mood.rotate) % base.progression.length]);
        STAGE_THEMES.push({
            ...base,
            bpm: Math.round(base.bpm * mood.bpm),
            root: base.root + mood.transpose,
            progression,
            arp: base.arp || mood.arp,
            drums: round2(base.drums * mood.drums),
            padGain: round3(base.padGain * mood.pad),
            leadGain: round2(base.leadGain * mood.lead),
            seed: base.seed * 97 + chapter * 13 + arc * 7,
        });
    }
}
/**
 * Temas de combate: entram quando a fase vira `combat`. São mais rápidos,
 * usam uma escala frígia e um pulso de baixo constante para criar urgência,
 * mas ficam abaixo da trilha de chefe em intensidade.
 */
const COMBAT_THEMES = ARC_BASES.map((base, index) => ({
    ...base,
    bpm: Math.round(base.bpm * 1.26 + 5),
    root: base.root + (index % 2 === 0 ? 1 : -1),
    scale: [0, 1, 3, 5, 7, 8, 11],
    progression: [0, 1, 5, 4, 0, 3, 1, 6],
    padType: 'sawtooth',
    bassType: 'sawtooth',
    leadType: 'square',
    arp: true,
    drums: round2(base.drums * 1.5),
    padGain: round3(base.padGain * 0.9),
    leadGain: round2(base.leadGain * 0.92),
    seed: base.seed * 71 + 211 + index * 29,
    boss: false,
    tension: true,
}));
/** Temas de chefe: mais graves, rápidos e dissonantes que o arco correspondente. */
const BOSS_THEMES = ARC_BASES.map((base, index) => ({
    ...base,
    bpm: Math.round(base.bpm * 1.18 + 8),
    root: base.root - 5,
    scale: [0, 1, 3, 5, 7, 8, 11],
    progression: [0, 1, 5, 4, 0, 6, 1, 4],
    padType: 'sawtooth',
    bassType: 'square',
    leadType: 'sawtooth',
    arp: true,
    drums: round2(base.drums * 1.45),
    padGain: round3(base.padGain * 1.1),
    leadGain: 1.4,
    seed: base.seed * 53 + 101 + index * 17,
    boss: true,
}));
/** Tema principal: mais lento, lírico, pensado para a tela-título. */
const TITLE_THEME = {
    bpm: 72,
    root: 45,
    scale: [0, 2, 4, 5, 7, 9, 11],
    progression: [0, 4, 5, 3, 0, 4, 1, 4],
    padType: 'sine',
    bassType: 'triangle',
    leadType: 'triangle',
    arp: true,
    drums: 0.32,
    padGain: 0.078,
    leadGain: 1.15,
    seed: 9001,
    boss: false,
    arc: 0,
};
export const COMBAT_THEME_OFFSET = STAGE_THEME_COUNT;
export const BOSS_THEME_OFFSET = COMBAT_THEME_OFFSET + COMBAT_THEMES.length;
const THEMES = [...STAGE_THEMES, ...COMBAT_THEMES, ...BOSS_THEMES, TITLE_THEME];
/** Índice do tema usado em menus, créditos, tutorial e vitória. */
export const TITLE_THEME_INDEX = BOSS_THEME_OFFSET + BOSS_THEMES.length;
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
/** Gerador determinístico para que cada tema tenha sempre o mesmo motivo. */
function rng(seed) {
    let a = seed >>> 0;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
/** Energia de cada seção da forma: verso, ascensão, clímax e respiro. */
const SECTION_ENERGY = [0.62, 0.84, 1, 0.72];
/** Plano de motivos por seção e por par de compassos. */
const PHRASE_PLAN = [
    [0, 0, 3, 0],
    [0, 1, 0, 2],
    [2, 1, 3, 2],
    [3, 0, 3, 0],
];
export class AudioEngine {
    constructor() {
        this.ctx = null;
        this.master = null;
        this.musicFilter = null;
        this.sfxBus = null;
        this.reverb = null;
        this.reverbReturn = null;
        this.sfxReverbSend = null;
        this.delay = null;
        this.delayFeedback = null;
        this.delayReturn = null;
        this.noiseBuffer = null;
        this.timer = null;
        this.step = 0;
        this.nextTime = 0;
        this.theme = THEMES[0];
        this.themeIndex = -1;
        this.musicOn = false;
        this.masters = 0.9;
        this.track = null;
        this.retiring = [];
        this.melodyCache = new Map();
        this.ambienceGain = null;
        this.ambienceNodes = [];
        this.ambienceKind = null;
        this.lastEnemyDown = 0;
        this.enemyDownBurst = 0;
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
        this.musicFilter.frequency.value = 3600;
        this.musicFilter.Q.value = 0.5;
        this.musicFilter.connect(this.master);
        this.sfxBus = ctx.createGain();
        this.sfxBus.gain.value = 0.82;
        this.sfxBus.connect(this.master);
        // Reverb procedural com cauda longa e reflexões iniciais.
        this.reverb = ctx.createConvolver();
        this.reverb.buffer = this.makeImpulse(ctx);
        const revHigh = ctx.createBiquadFilter();
        revHigh.type = 'highpass';
        revHigh.frequency.value = 170;
        const revLow = ctx.createBiquadFilter();
        revLow.type = 'lowpass';
        revLow.frequency.value = 6200;
        this.reverbReturn = ctx.createGain();
        this.reverbReturn.gain.value = 0.55;
        this.reverb.connect(revHigh);
        revHigh.connect(revLow);
        revLow.connect(this.reverbReturn);
        this.reverbReturn.connect(this.master);
        this.sfxReverbSend = ctx.createGain();
        this.sfxReverbSend.gain.value = 0.1;
        this.sfxBus.connect(this.sfxReverbSend);
        this.sfxReverbSend.connect(this.reverb);
        // Delay com realimentação curta para dar profundidade à melodia.
        this.delay = ctx.createDelay(2);
        this.delay.delayTime.value = 0.32;
        const delayLow = ctx.createBiquadFilter();
        delayLow.type = 'lowpass';
        delayLow.frequency.value = 2900;
        this.delayFeedback = ctx.createGain();
        this.delayFeedback.gain.value = 0.24;
        this.delay.connect(delayLow);
        delayLow.connect(this.delayFeedback);
        this.delayFeedback.connect(this.delay);
        this.delayReturn = ctx.createGain();
        this.delayReturn.gain.value = 0.32;
        delayLow.connect(this.delayReturn);
        this.delayReturn.connect(this.master);
        // Buffer de ruído reaproveitado por vários efeitos.
        const len = Math.floor(ctx.sampleRate * 1.5);
        const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < len; i++)
            data[i] = Math.random() * 2 - 1;
        this.noiseBuffer = buffer;
        void ctx.resume();
    }
    makeImpulse(ctx) {
        const seconds = 2.9;
        const length = Math.floor(ctx.sampleRate * seconds);
        const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
        for (let channel = 0; channel < 2; channel++) {
            const data = buffer.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                const t = i / length;
                const decay = Math.pow(1 - t, 2.7);
                data[i] = (Math.random() * 2 - 1) * decay * 0.62;
            }
            const reflections = [0.017, 0.029, 0.047, 0.073, 0.109, 0.151];
            reflections.forEach((secondsAt, index) => {
                const at = Math.floor(secondsAt * ctx.sampleRate) + channel * 37;
                if (at < length)
                    data[at] += (index % 2 === 0 ? 1 : -1) * 0.28;
            });
        }
        return buffer;
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
        const index = Math.max(0, Math.min(THEMES.length - 1, Math.round(themeIndex)));
        if (this.musicOn && this.themeIndex === index)
            return;
        this.stopMusic(0.45);
        this.theme = THEMES[index];
        this.themeIndex = index;
        this.musicOn = true;
        this.step = 0;
        this.nextTime = this.ctx.currentTime + 0.12;
        if (this.delay) {
            const beat = 60 / this.theme.bpm;
            this.delay.delayTime.setTargetAtTime(Math.min(1.35, beat * 0.72), this.ctx.currentTime, 0.08);
        }
        this.startTrack();
        this.timer = window.setInterval(() => this.scheduler(), 25);
    }
    startTrack() {
        const ctx = this.ctx;
        if (!ctx || !this.musicFilter || !this.reverb || !this.delay)
            return;
        const now = ctx.currentTime;
        const bus = ctx.createGain();
        bus.gain.setValueAtTime(0.0001, now);
        bus.gain.exponentialRampToValueAtTime(0.46, now + 0.9);
        bus.connect(this.musicFilter);
        const wet = ctx.createGain();
        wet.gain.value = 1;
        wet.connect(bus);
        const dry = ctx.createGain();
        dry.gain.value = 1;
        dry.connect(bus);
        const reverbSend = ctx.createGain();
        reverbSend.gain.value = 0.4;
        wet.connect(reverbSend);
        reverbSend.connect(this.reverb);
        const delaySend = ctx.createGain();
        delaySend.gain.value = 0.2;
        wet.connect(delaySend);
        delaySend.connect(this.delay);
        this.track = { bus, wet, dry, reverbSend, delaySend };
    }
    stopMusic(fade = 0.4) {
        if (this.timer !== null) {
            window.clearInterval(this.timer);
            this.timer = null;
        }
        this.musicOn = false;
        const track = this.track;
        this.track = null;
        if (!this.ctx || !track)
            return;
        const now = this.ctx.currentTime;
        const wait = Math.max(0.05, fade);
        try {
            track.bus.gain.cancelScheduledValues(now);
            track.bus.gain.setValueAtTime(0.46, now);
            track.bus.gain.exponentialRampToValueAtTime(0.0001, now + wait);
        }
        catch {
            // Automação já finalizada.
        }
        this.retiring.push(track);
        window.setTimeout(() => {
            this.disconnectTrack(track);
            this.retiring = this.retiring.filter((item) => item !== track);
        }, (wait + 0.9) * 1000);
    }
    disconnectTrack(track) {
        for (const node of [track.reverbSend, track.delaySend, track.wet, track.dry, track.bus]) {
            try {
                node.disconnect();
            }
            catch {
                // Nó já desconectado.
            }
        }
    }
    /** Trilha de tensão do combate: uma variação por arco. */
    playCombatMusic(arc) {
        const index = COMBAT_THEME_OFFSET + Math.max(0, Math.min(COMBAT_THEMES.length - 1, Math.round(arc) - 1));
        this.playMusic(index);
    }
    /** Trilha de chefe: uma para cada arco, com prioridade sobre a de combate. */
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
                this.addAmbienceOsc(gain, now, 55, 'sine', 0.012);
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
        const stepDur = 60 / this.theme.bpm / 4;
        while (this.nextTime < ctx.currentTime + 0.22) {
            this.scheduleStep(this.step, this.nextTime);
            this.step++;
            this.nextTime += stepDur;
        }
    }
    scheduleStep(step, time) {
        const ctx = this.ctx;
        const track = this.track;
        if (!ctx || !track)
            return;
        const t = this.theme;
        const stepDur = 60 / t.bpm / 4;
        const bar = Math.floor(step / 16);
        const s16 = step % 16;
        const cycleBar = bar % 32;
        const section = Math.floor(cycleBar / 8);
        const slot = Math.floor((cycleBar % 8) / 2);
        const energy = SECTION_ENERGY[section];
        const chordDeg = t.progression[bar % t.progression.length];
        const swing = s16 % 2 === 1 ? stepDur * 0.045 : 0;
        const at = time + swing + (Math.random() - 0.5) * 0.004;
        if (s16 === 0) {
            this.musicFilter?.frequency.setTargetAtTime(2450 + energy * 2600, time, 0.4);
        }
        // Transições entre seções.
        if (cycleBar === 0 && s16 === 0) {
            this.impact(at, 0.5);
            this.crash(at, 0.2 * t.drums);
        }
        else if (cycleBar === 8 && s16 === 0) {
            this.impact(at, 0.26);
        }
        else if (cycleBar === 16 && s16 === 0) {
            this.impact(at, 0.4);
            this.crash(at, 0.16 * t.drums);
        }
        else if (cycleBar === 24 && s16 === 0) {
            this.impact(at, 0.22);
        }
        if ((cycleBar === 15 || cycleBar === 31) && s16 === 0) {
            this.riser(at, stepDur * 15, 0.1);
        }
        if (t.tension && (cycleBar === 7 || cycleBar === 23) && s16 === 0) {
            this.riser(at, stepDur * 15, 0.055);
        }
        // Drone de tensão: segunda menor grave, trocando a cada quatro compassos.
        if (t.tension && s16 === 0 && cycleBar % 4 === 0) {
            const droneDur = stepDur * 62;
            this.padVoice(this.scaleMidi(t, chordDeg, -12), at, droneDur, t.padGain * 0.8, 'sawtooth', 0);
            this.padVoice(this.scaleMidi(t, chordDeg + 1, -12), at, droneDur, t.padGain * 0.38, 'sawtooth', 0);
        }
        // Bateria.
        const d = t.drums * energy;
        if (s16 === 0 || s16 === 8)
            this.kick(at, 0.5 * d);
        if (section >= 1 && (s16 === 6 || s16 === 14))
            this.kick(at, 0.24 * d);
        if ((t.boss || t.tension) && (s16 === 3 || s16 === 11))
            this.kick(at, 0.2 * d);
        if (s16 === 4 || s16 === 12)
            this.snare(at, 0.24 * d);
        if (section >= 1 && s16 === 15)
            this.snare(at, 0.1 * d);
        if (section >= 1 && s16 === 7)
            this.snare(at, 0.06 * d);
        if (t.tension && cycleBar % 8 === 7 && s16 >= 12) {
            this.snare(at, (0.05 + (s16 - 12) * 0.018) * d);
        }
        if (s16 % 2 === 0)
            this.hat(at, (s16 % 4 === 0 ? 0.05 : 0.03) * d, false);
        if (section >= 2 && s16 % 2 === 1)
            this.hat(at, 0.018 * d, false);
        if (t.tension && section === 1 && s16 % 2 === 1)
            this.hat(at, 0.016 * d, false);
        if (section >= 1 && s16 === 14)
            this.hat(at, 0.055 * d, true);
        if (slot === 3 && s16 >= 12)
            this.tom(at, [210, 175, 140, 110][s16 - 12], 0.12 * d);
        // Baixo: no combate, ostinato contínuo em vez de notas espaçadas.
        const bassPattern = t.tension
            ? section === 0
                ? [0, 4, 8, 12]
                : [0, 2, 4, 6, 8, 10, 12, 14]
            : section === 0
                ? [0, 6, 10]
                : section === 1
                    ? [0, 4, 8, 12]
                    : section === 2
                        ? [0, 2, 4, 6, 8, 10, 12, 14]
                        : [0, 8];
        const bassIndex = bassPattern.indexOf(s16);
        if (bassIndex >= 0) {
            const offsets = [0, 0, 4, 0, 7, 0, 4, 0];
            const offset = offsets[bassIndex % offsets.length];
            const dur = stepDur * (section === 3 ? 7 : section === 0 ? 5 : 3.2);
            this.bassVoice(this.scaleMidi(t, chordDeg + offset, -12), at, dur, 0.115 * energy, t.bassType);
        }
        // Pad sustentado, com nona no clímax.
        if (s16 === 0) {
            const tones = section === 2 ? [0, 2, 4, 6, 8] : [0, 2, 4, 6];
            const dur = stepDur * (section === 3 ? 18 : 15);
            tones.forEach((tone, index) => {
                const freq = this.scaleMidi(t, chordDeg + tone, 12);
                const gain = (t.padGain * (0.55 + energy * 0.5)) / (1 + index * 0.35);
                this.padVoice(freq, at, dur, gain, t.padType, index % 2 === 0 ? -0.35 : 0.35);
            });
            if (section >= 1) {
                this.padVoice(this.scaleMidi(t, chordDeg, 24), at, dur, t.padGain * 0.32, 'sine', 0);
            }
        }
        // Stabs dissonantes no contratempo: o "sobressalto" da trilha de combate.
        if (t.tension && section >= 1 && s16 === 6) {
            this.leadVoice(this.scaleMidi(t, chordDeg + 1, 12), at, stepDur * 2.1, 0.024, 'sawtooth', 0.9);
            this.leadVoice(this.scaleMidi(t, chordDeg + 6, 12), at, stepDur * 2.1, 0.018, 'sawtooth', 0.7);
        }
        // Arpejo.
        if (t.arp || section >= 2) {
            const rate = section === 0 ? 4 : section === 1 ? 2 : 1;
            if (s16 % rate === 0) {
                const index = Math.floor(step / rate) % 8;
                const tones = [0, 2, 4, 6, 8, 6, 4, 2];
                const freq = this.scaleMidi(t, chordDeg + tones[index], 24);
                this.pluck(freq, at, stepDur * 1.5, 0.02 * energy * t.leadGain, 'triangle', 6500, index % 2 === 0 ? -0.3 : 0.3);
            }
            if (section === 2 && s16 === 8) {
                this.pluck(this.scaleMidi(t, chordDeg + 8, 36), at, stepDur * 3, 0.012 * t.leadGain, 'sine', 9500, 0);
            }
        }
        // Melodia: motivo de dois compassos, variado por seção.
        const phrase = this.phrases(t)[PHRASE_PLAN[section][slot] % 4];
        const melodyStep = step % 32;
        for (const note of phrase.notes) {
            if (note.step !== melodyStep)
                continue;
            const chordTones = [0, 2, 4, 6, 8];
            let degree = chordDeg + chordTones[note.tone % chordTones.length];
            if (note.pass)
                degree += melodyStep % 8 < 4 ? 1 : -1;
            const octave = 24;
            const freq = this.scaleMidi(t, degree, octave);
            const dur = Math.max(stepDur * 1.4, note.len * stepDur);
            const gain = 0.07 * t.leadGain * note.vel * (0.7 + energy * 0.35);
            this.leadVoice(freq, at, dur, gain, t.leadType, note.vel);
            if (section === 2) {
                this.leadVoice(this.scaleMidi(t, degree - 2, octave), at, dur, gain * 0.32, 'sine', note.vel * 0.8);
                this.pluck(this.scaleMidi(t, degree, 36), at, stepDur * 2.4, gain * 0.22, 'sine', 9500, 0);
            }
        }
    }
    scaleMidi(theme, degree, semitones) {
        const len = theme.scale.length;
        const wrapped = ((degree % len) + len) % len;
        const oct = Math.floor(degree / len);
        // `semitones` é um deslocamento fixo (12 = uma oitava acima, -12 = uma
        // abaixo); a oitava diatônica vem de `degree`, não do deslocamento.
        return midi(theme.root + theme.scale[wrapped] + oct * 12 + semitones);
    }
    /** Motivos determinísticos de dois compassos, com contorno e respiração. */
    phrases(theme) {
        const cached = this.melodyCache.get(theme.seed);
        if (cached)
            return cached;
        const random = rng(theme.seed);
        const rhythms = [
            [0, 4, 6, 10, 12, 16, 20, 24, 28],
            [0, 6, 8, 12, 16, 22, 24, 30],
            [0, 8, 12, 16, 20, 24, 28],
            [0, 2, 4, 8, 12, 14, 16, 20, 24, 28, 30],
            [0, 4, 8, 10, 16, 18, 24, 26],
        ];
        const contours = [
            [0, 1, 2, 3, 2, 1, 0, 1, 2],
            [2, 1, 0, 1, 2, 3, 4, 3, 2],
            [4, 3, 2, 1, 0, 1, 2, 3, 4],
            [0, 2, 4, 2, 0, 1, 2, 1, 0],
            [3, 2, 1, 0, 1, 2, 3, 2, 1],
        ];
        const phrases = [];
        for (let p = 0; p < 4; p++) {
            const rhythm = rhythms[Math.floor(random() * rhythms.length)];
            const contour = contours[Math.floor(random() * contours.length)];
            const notes = [];
            rhythm.forEach((step, index) => {
                const next = rhythm[index + 1] ?? 32;
                const len = Math.max(1, Math.min(6, next - step - 1));
                notes.push({
                    step,
                    tone: contour[index % contour.length],
                    len,
                    vel: 0.65 + random() * 0.35,
                    pass: index > 0 && random() < 0.16,
                });
            });
            phrases.push({ notes });
        }
        this.melodyCache.set(theme.seed, phrases);
        return phrases;
    }
    // ------------------------------------------------------------- instrumentos
    padVoice(freq, time, dur, gain, type, pan) {
        const ctx = this.ctx;
        const dest = this.track?.wet;
        if (!ctx || !dest)
            return;
        const oscA = ctx.createOscillator();
        const oscB = ctx.createOscillator();
        oscA.type = type;
        oscB.type = type;
        oscA.frequency.value = freq;
        oscB.frequency.value = freq;
        oscA.detune.value = -6;
        oscB.detune.value = 6;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1500 + Math.random() * 700;
        filter.Q.value = 0.45;
        const g = ctx.createGain();
        const level = Math.max(0.0002, gain);
        g.gain.setValueAtTime(0.0001, time);
        g.gain.exponentialRampToValueAtTime(level, time + 0.4);
        g.gain.setValueAtTime(level, time + dur * 0.62);
        g.gain.exponentialRampToValueAtTime(0.0001, time + dur + 1.1);
        const panner = ctx.createStereoPanner();
        panner.pan.value = pan;
        oscA.connect(filter);
        oscB.connect(filter);
        filter.connect(g);
        g.connect(panner);
        panner.connect(dest);
        oscA.start(time);
        oscB.start(time);
        oscA.stop(time + dur + 1.2);
        oscB.stop(time + dur + 1.2);
    }
    pluck(freq, time, dur, gain, type, cutoff, pan) {
        const ctx = this.ctx;
        const dest = this.track?.wet;
        if (!ctx || !dest)
            return;
        const osc = ctx.createOscillator();
        osc.type = type;
        osc.frequency.value = freq;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(cutoff, time);
        filter.frequency.exponentialRampToValueAtTime(Math.max(400, cutoff * 0.35), time + dur);
        filter.Q.value = 0.8;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, time);
        g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), time + 0.006);
        g.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain * 0.3), time + Math.min(dur * 0.4, 0.12));
        g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
        const panner = ctx.createStereoPanner();
        panner.pan.value = pan;
        osc.connect(filter);
        filter.connect(g);
        g.connect(panner);
        panner.connect(dest);
        osc.start(time);
        osc.stop(time + dur + 0.05);
    }
    leadVoice(freq, time, dur, gain, type, vel) {
        const ctx = this.ctx;
        const dest = this.track?.wet;
        if (!ctx || !dest)
            return;
        const osc = ctx.createOscillator();
        const shadow = ctx.createOscillator();
        osc.type = type;
        shadow.type = type;
        osc.frequency.value = freq;
        shadow.frequency.value = freq;
        osc.detune.value = (Math.random() - 0.5) * 5;
        shadow.detune.value = 6;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 3600;
        filter.Q.value = 0.6;
        const g = ctx.createGain();
        const level = Math.max(0.0002, gain);
        g.gain.setValueAtTime(0.0001, time);
        g.gain.exponentialRampToValueAtTime(level, time + 0.035);
        g.gain.setValueAtTime(level * 0.82, time + Math.max(0.08, dur * 0.55));
        g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
        const shadowGain = ctx.createGain();
        shadowGain.gain.value = 0.38;
        shadow.connect(shadowGain);
        shadowGain.connect(filter);
        osc.connect(filter);
        filter.connect(g);
        g.connect(dest);
        if (dur > 0.24) {
            const lfo = ctx.createOscillator();
            const lfoGain = ctx.createGain();
            lfo.frequency.value = 4.4 + vel * 1.4;
            lfoGain.gain.value = 3.4;
            lfo.connect(lfoGain);
            lfoGain.connect(osc.detune);
            lfo.start(time);
            lfo.stop(time + dur + 0.05);
        }
        osc.start(time);
        shadow.start(time);
        osc.stop(time + dur + 0.06);
        shadow.stop(time + dur + 0.06);
    }
    bassVoice(freq, time, dur, gain, type) {
        const ctx = this.ctx;
        const dest = this.track?.dry;
        if (!ctx || !dest)
            return;
        const osc = ctx.createOscillator();
        const sub = ctx.createOscillator();
        osc.type = type;
        sub.type = 'sine';
        osc.frequency.value = freq;
        sub.frequency.value = freq;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 520;
        filter.Q.value = 0.7;
        const g = ctx.createGain();
        const subGain = ctx.createGain();
        subGain.gain.value = 0.65;
        const level = Math.max(0.0002, gain);
        g.gain.setValueAtTime(0.0001, time);
        g.gain.exponentialRampToValueAtTime(level, time + 0.012);
        g.gain.exponentialRampToValueAtTime(Math.max(0.0001, level * 0.68), time + 0.12);
        g.gain.setValueAtTime(Math.max(0.0001, level * 0.62), time + Math.max(0.16, dur * 0.6));
        g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
        osc.connect(filter);
        sub.connect(subGain);
        subGain.connect(filter);
        filter.connect(g);
        g.connect(dest);
        osc.start(time);
        sub.start(time);
        osc.stop(time + dur + 0.05);
        sub.stop(time + dur + 0.05);
    }
    kick(time, gain) {
        const ctx = this.ctx;
        const dest = this.track?.dry;
        if (!ctx || !dest)
            return;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(148, time);
        osc.frequency.exponentialRampToValueAtTime(44, time + 0.17);
        g.gain.setValueAtTime(gain, time);
        g.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);
        osc.connect(g);
        g.connect(dest);
        osc.start(time);
        osc.stop(time + 0.26);
        this.noiseTo(dest, time, 0.018, 0.05, 4200, 'highpass', { attack: 0.001 });
    }
    snare(time, gain) {
        const ctx = this.ctx;
        const dest = this.track?.dry;
        if (!ctx || !dest || !this.noiseBuffer)
            return;
        const src = ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1850;
        filter.Q.value = 0.85;
        const g = ctx.createGain();
        g.gain.setValueAtTime(gain, time);
        g.gain.exponentialRampToValueAtTime(0.0001, time + 0.14);
        src.connect(filter);
        filter.connect(g);
        g.connect(dest);
        src.start(time);
        src.stop(time + 0.17);
        this.toneTo(dest, time, 190, 'triangle', 0.08, gain * 0.35, 140);
    }
    hat(time, gain, open) {
        const ctx = this.ctx;
        const dest = this.track?.dry;
        if (!ctx || !dest)
            return;
        this.noiseTo(dest, time, open ? 0.2 : 0.035, gain, 8200, 'highpass', { attack: 0.001 });
    }
    tom(time, freq, gain) {
        const ctx = this.ctx;
        const dest = this.track?.dry;
        if (!ctx || !dest)
            return;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.55, time + 0.18);
        g.gain.setValueAtTime(gain, time);
        g.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);
        osc.connect(g);
        g.connect(dest);
        osc.start(time);
        osc.stop(time + 0.25);
    }
    crash(time, gain) {
        const dest = this.track?.wet;
        if (!dest)
            return;
        this.noiseTo(dest, time, 1.3, gain, 3800, 'highpass', { attack: 0.004 });
        this.noiseTo(dest, time, 0.7, gain * 0.6, 7200, 'bandpass', { q: 0.7, attack: 0.002 });
    }
    impact(time, power) {
        const dest = this.track?.wet;
        if (!dest)
            return;
        this.toneTo(dest, time, 105, 'sine', 0.55, 0.26 * power, 32, { attack: 0.004 });
        this.noiseTo(dest, time, 0.42, 0.18 * power, 900, 'lowpass', { attack: 0.003 });
        this.noiseTo(dest, time, 0.16, 0.1 * power, 5200, 'highpass', { attack: 0.001 });
    }
    riser(time, dur, gain) {
        const dest = this.track?.wet;
        if (!dest)
            return;
        this.noiseTo(dest, time, dur, gain, 320, 'bandpass', {
            endCutoff: 6800,
            q: 1.2,
            attack: dur * 0.75,
        });
        this.toneTo(dest, time, 180, 'sawtooth', dur, gain * 0.22, 720, { attack: dur * 0.8, filter: 1600 });
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
        const pan = () => (Math.random() - 0.5) * 0.34;
        switch (name) {
            case 'hit':
                this.noise(t, 0.045, 0.14, 5200, 'highpass', { attack: 0.001, pan: pan() });
                this.tone(t, 190, 'square', 0.1, 0.1, 70, { filter: 1800, pan: pan() });
                this.tone(t, 92, 'sine', 0.14, 0.16, 42);
                break;
            case 'heavy':
                this.tone(t, 128, 'sawtooth', 0.3, 0.2, 36, { filter: 900, attack: 0.004 });
                this.tone(t, 68, 'sine', 0.36, 0.24, 28);
                this.noise(t, 0.22, 0.18, 720, 'lowpass');
                this.noise(t, 0.05, 0.1, 4200, 'highpass', { attack: 0.001 });
                break;
            case 'zap':
                this.tone(t, 1900, 'sawtooth', 0.18, 0.13, 260, { filter: 4200, pan: pan() });
                this.tone(t + 0.02, 920, 'square', 0.16, 0.1, 130, { filter: 2600 });
                this.noise(t, 0.12, 0.12, 6200, 'highpass', { attack: 0.001 });
                this.chime(t + 0.03, 2400, 0.035, 0.18);
                break;
            case 'magma':
                this.tone(t, 64, 'sawtooth', 0.58, 0.24, 27, { filter: 420, attack: 0.01 });
                this.tone(t, 42, 'sine', 0.62, 0.2, 22);
                this.noise(t, 0.46, 0.2, 380, 'lowpass');
                this.noise(t + 0.1, 0.22, 0.08, 1800, 'bandpass', { q: 1.4 });
                break;
            case 'gravity':
                this.tone(t, 280, 'sine', 0.62, 0.15, 34, { attack: 0.08 });
                this.tone(t, 140, 'triangle', 0.6, 0.12, 30, { attack: 0.1 });
                this.noise(t, 0.5, 0.09, 220, 'bandpass', { endCutoff: 1800, q: 1.4, attack: 0.08 });
                break;
            case 'slash':
                this.noise(t, 0.18, 0.2, 5200, 'bandpass', { endCutoff: 1500, q: 1.1 });
                this.tone(t, 880, 'sawtooth', 0.16, 0.06, 190, { filter: 3000 });
                this.chime(t + 0.02, 2600, 0.03, 0.2);
                break;
            case 'seal':
                this.tone(t, 330, 'sine', 0.5, 0.08, 330, { attack: 0.02 });
                this.chord(t + 0.02, [660, 990, 1320, 1760], 'sine', 0.55, 0.075, 0.055);
                break;
            case 'heal':
                this.chord(t, [523, 659, 784, 1046], 'sine', 0.52, 0.06, 0.07, { attack: 0.03 });
                this.chime(t + 0.16, 2093, 0.022, 0.5);
                break;
            case 'blink':
                this.tone(t, 220, 'triangle', 0.22, 0.09, 1900, { filter: 5000 });
                this.noise(t, 0.14, 0.08, 900, 'highpass', { endCutoff: 7200, attack: 0.004 });
                this.chime(t + 0.05, 1800, 0.025, 0.2);
                break;
            case 'explode':
                this.tone(t, 90, 'sawtooth', 0.5, 0.3, 25, { filter: 700, attack: 0.003 });
                this.noise(t, 0.55, 0.3, 1100, 'lowpass');
                this.noise(t, 0.13, 0.12, 4200, 'highpass', { attack: 0.001 });
                break;
            case 'jump':
                this.tone(t, 330, 'triangle', 0.16, 0.075, 680, { filter: 2600 });
                this.noise(t, 0.05, 0.03, 3200, 'highpass', { attack: 0.001 });
                break;
            case 'land':
                this.tone(t, 122, 'sine', 0.11, 0.11, 48);
                this.noise(t, 0.09, 0.055, 620, 'lowpass');
                break;
            case 'dash':
                this.noise(t, 0.2, 0.12, 800, 'bandpass', { endCutoff: 4200, q: 0.9 });
                this.tone(t, 430, 'sawtooth', 0.18, 0.045, 120, { filter: 1400 });
                break;
            case 'hurt':
                this.tone(t, 280, 'sawtooth', 0.24, 0.14, 80, { filter: 1200 });
                this.tone(t + 0.02, 140, 'square', 0.18, 0.08, 60);
                this.noise(t, 0.12, 0.1, 900, 'lowpass');
                break;
            case 'death':
                [330, 262, 196, 131].forEach((freq, index) => {
                    this.tone(t + index * 0.12, freq, 'sawtooth', 0.42, 0.11, freq * 0.82, { filter: 1300 });
                });
                this.tone(t, 82, 'sine', 0.9, 0.16, 32, { attack: 0.03 });
                this.noise(t + 0.06, 0.6, 0.12, 520, 'lowpass');
                break;
            case 'enemyDown': {
                // Morte de inimigo comum: curta, arejada e com três variações para não
                // virar um loop. Vários abates no mesmo instante dividem o volume.
                const gap = t - this.lastEnemyDown;
                this.enemyDownBurst = gap < 0.075 ? this.enemyDownBurst + 1 : 0;
                this.lastEnemyDown = t;
                const duck = 1 / (1 + this.enemyDownBurst * 0.55);
                const pan = (Math.random() - 0.5) * 0.5;
                const variant = Math.floor(Math.random() * 3);
                const f = 620 + Math.random() * 380;
                if (variant === 0) {
                    this.tone(t, f, 'triangle', 0.12, 0.05 * duck, f * 0.62, { filter: 4200, pan });
                    this.noise(t, 0.055, 0.022 * duck, 4600, 'highpass', { attack: 0.001, pan });
                }
                else if (variant === 1) {
                    this.tone(t, f * 0.62, 'sine', 0.16, 0.045 * duck, f * 0.4, { filter: 2600, pan });
                    this.noise(t, 0.11, 0.026 * duck, 1500, 'bandpass', { q: 0.7, pan });
                }
                else {
                    this.chime(t, f * 1.7, 0.022 * duck, 0.13);
                    this.noise(t + 0.01, 0.04, 0.014 * duck, 5600, 'highpass', { attack: 0.001, pan });
                }
                this.tone(t, 138, 'sine', 0.08, 0.02 * duck, 82);
                break;
            }
            case 'eliteDown': {
                // Abate de elite: média, com brilho e ar, sem o peso do estrondo de chefe.
                const pan = (Math.random() - 0.5) * 0.34;
                const base = 190 + Math.random() * 50;
                this.tone(t, base, 'triangle', 0.22, 0.075, 88, { filter: 1800, pan });
                this.tone(t + 0.012, 520, 'sine', 0.16, 0.045, 250, { filter: 4200, pan });
                this.noise(t, 0.24, 0.055, 1500, 'bandpass', { endCutoff: 480, q: 0.8, pan });
                this.chime(t + 0.06, 1280 + Math.random() * 180, 0.022, 0.2);
                this.tone(t, 110, 'sine', 0.2, 0.045, 54);
                break;
            }
            case 'ui':
                this.tone(t, 880, 'sine', 0.07, 0.035, 880, { filter: 5200 });
                this.tone(t + 0.008, 1320, 'sine', 0.05, 0.014, 1320);
                break;
            case 'select':
                this.tone(t, 620, 'triangle', 0.08, 0.045, 760, { filter: 4200 });
                this.chime(t + 0.02, 1240, 0.018, 0.16);
                break;
            case 'confirm':
                this.chord(t, [523, 784, 1046], 'triangle', 0.18, 0.055, 0.06, { attack: 0.006 });
                this.chime(t + 0.1, 1568, 0.03, 0.34);
                break;
            case 'wave':
                this.chord(t, [392, 523, 659], 'sawtooth', 0.4, 0.055, 0.12, { filter: 1800, attack: 0.02 });
                this.tone(t, 196, 'triangle', 0.5, 0.08, 196, { attack: 0.02 });
                break;
            case 'boss':
                this.impact(t, 0.9);
                this.chord(t + 0.04, [55, 82, 110, 164], 'sawtooth', 1.25, 0.075, 0.03, { filter: 620, attack: 0.02 });
                this.noise(t + 0.1, 1.1, 0.14, 380, 'lowpass');
                break;
            case 'roar':
                this.tone(t, 92, 'sawtooth', 0.9, 0.22, 38, { filter: 800, detune: -7, attack: 0.02 });
                this.tone(t, 96, 'sawtooth', 0.9, 0.18, 40, { filter: 800, detune: 7, attack: 0.02 });
                this.tone(t + 0.04, 140, 'square', 0.7, 0.14, 55);
                this.noise(t, 0.75, 0.2, 520, 'lowpass');
                break;
            case 'echo':
                this.chime(t, 660, 0.055, 0.5);
                this.chime(t + 0.14, 880, 0.042, 0.55);
                this.chime(t + 0.28, 1320, 0.03, 0.65);
                break;
            case 'beam':
                this.tone(t, 1400, 'sawtooth', 0.5, 0.08, 220, { filter: 3000 });
                this.tone(t, 280, 'square', 0.5, 0.06, 70);
                this.noise(t, 0.32, 0.06, 2600, 'bandpass', { endCutoff: 500, q: 1.1 });
                break;
            case 'abilityRavi':
                this.tone(t, 1800, 'sawtooth', 0.34, 0.15, 240, { filter: 5000 });
                this.tone(t + 0.04, 900, 'square', 0.3, 0.1, 120, { filter: 2600 });
                this.noise(t, 0.18, 0.14, 5600, 'highpass');
                this.chord(t + 0.06, [880, 1320, 1760], 'triangle', 0.28, 0.045, 0.02);
                break;
            case 'abilityMiriam':
                this.tone(t, 62, 'sawtooth', 0.55, 0.28, 28, { filter: 400 });
                this.noise(t, 0.48, 0.24, 430, 'lowpass');
                this.chord(t + 0.06, [110, 165, 220], 'sawtooth', 0.5, 0.055, 0.03, { filter: 800 });
                break;
            case 'abilityKael':
                this.tone(t, 560, 'sine', 0.6, 0.16, 52, { attack: 0.05 });
                this.tone(t + 0.04, 260, 'triangle', 0.55, 0.12, 38, { attack: 0.06 });
                this.chord(t + 0.2, [660, 990, 1320], 'sine', 0.5, 0.04, 0.04);
                this.noise(t, 0.4, 0.06, 300, 'lowpass', { endCutoff: 2200, attack: 0.2 });
                break;
            case 'abilityOzric':
                this.noise(t, 0.22, 0.2, 4800, 'bandpass', { endCutoff: 1200, q: 1.2 });
                this.tone(t, 130, 'sawtooth', 0.48, 0.22, 38, { filter: 700 });
                this.chord(t + 0.05, [82, 123, 164], 'sawtooth', 0.55, 0.05, 0.03, { filter: 600 });
                break;
            case 'abilityElodie':
                this.chord(t, [880, 1108, 1320, 1760], 'sine', 0.6, 0.045, 0.06, { attack: 0.02 });
                this.chime(t + 0.22, 2637, 0.025, 0.7);
                this.noise(t, 0.35, 0.05, 3000, 'highpass', { endCutoff: 9000, attack: 0.15 });
                break;
            case 'abilityThryc':
                this.chime(t, 660, 0.05, 0.6);
                this.chime(t + 0.14, 880, 0.04, 0.7);
                this.chime(t + 0.28, 1320, 0.03, 0.85);
                this.noise(t + 0.1, 0.3, 0.05, 3000, 'bandpass', { q: 1.3 });
                break;
            case 'victory': {
                const progression = [
                    [523, 659, 784],
                    [587, 740, 880],
                    [659, 784, 988],
                    [784, 988, 1175],
                ];
                progression.forEach((chord, index) => {
                    this.chord(t + index * 0.32, chord, 'triangle', 0.5, 0.065, 0.02, { attack: 0.01 });
                });
                this.tone(t, 131, 'sine', 1.6, 0.12, 131, { attack: 0.02 });
                this.chime(t + 1.3, 2093, 0.03, 0.9);
                break;
            }
            case 'gameover': {
                const progression = [
                    [392, 494, 587],
                    [349, 440, 523],
                    [294, 370, 440],
                    [220, 277, 330],
                ];
                progression.forEach((chord, index) => {
                    this.chord(t + index * 0.22, chord, 'sawtooth', 0.5, 0.055, 0.015, { filter: 1400 });
                });
                this.tone(t, 110, 'sine', 1.4, 0.12, 40, { attack: 0.05 });
                break;
            }
        }
    }
    chime(time, freq, gain, dur = 0.5) {
        this.tone(time, freq, 'sine', dur, gain, freq, { attack: 0.005, filter: 9000 });
        this.tone(time, freq * 2.01, 'sine', dur * 0.65, gain * 0.25, freq * 2.01, { attack: 0.005 });
    }
    chord(time, freqs, type, dur, gain, stagger = 0.05, opts = {}) {
        freqs.forEach((freq, index) => {
            this.tone(time + index * stagger, freq, type, dur, gain, freq, opts);
        });
    }
    tone(time, freq, type, dur, gain, endFreq, opts = {}) {
        this.toneTo(this.sfxBus, time, freq, type, dur, gain, endFreq, opts);
    }
    toneTo(dest, time, freq, type, dur, gain, endFreq, opts = {}) {
        const ctx = this.ctx;
        if (!ctx || !dest)
            return;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(Math.max(20, freq), time);
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), time + dur);
        if (opts.detune)
            osc.detune.value = opts.detune;
        const attack = Math.max(0.002, opts.attack ?? 0.012);
        g.gain.setValueAtTime(0.0001, time);
        g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), time + attack);
        g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
        let tail = g;
        if (opts.filter) {
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = opts.filter;
            filter.Q.value = opts.q ?? 0.8;
            g.connect(filter);
            tail = filter;
        }
        if (opts.pan) {
            const panner = ctx.createStereoPanner();
            panner.pan.value = opts.pan;
            tail.connect(panner);
            tail = panner;
        }
        tail.connect(dest);
        osc.connect(g);
        osc.start(time);
        osc.stop(time + dur + 0.04);
    }
    noise(time, dur, gain, cutoff, filterType, opts = {}) {
        this.noiseTo(this.sfxBus, time, dur, gain, cutoff, filterType, opts);
    }
    noiseTo(dest, time, dur, gain, cutoff, filterType, opts = {}) {
        const ctx = this.ctx;
        if (!ctx || !dest || !this.noiseBuffer)
            return;
        const src = ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        const filter = ctx.createBiquadFilter();
        filter.type = filterType;
        filter.frequency.setValueAtTime(Math.max(20, cutoff), time);
        filter.Q.value = opts.q ?? 1.05;
        if (opts.endCutoff) {
            filter.frequency.exponentialRampToValueAtTime(Math.max(20, opts.endCutoff), time + dur);
        }
        const g = ctx.createGain();
        const attack = Math.max(0.001, opts.attack ?? 0.004);
        g.gain.setValueAtTime(0.0001, time);
        g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), time + attack);
        g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
        let tail = g;
        if (opts.pan) {
            const panner = ctx.createStereoPanner();
            panner.pan.value = opts.pan;
            tail.connect(panner);
            tail = panner;
        }
        src.connect(filter);
        filter.connect(g);
        tail.connect(dest);
        src.start(time);
        src.stop(time + dur + 0.03);
    }
}
//# sourceMappingURL=audio.js.map