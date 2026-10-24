/** Movesets únicos por personagem. Todos os golpes usam hitboxes próprias. */
export const MOVESETS = {
    // RAVI — acrobático elétrico, golpes rápidos e combo longo.
    ravi: {
        light1: { id: 'ravi_l1', label: 'Jab Voltaico', startup: 0.045, active: 0.08, recovery: 0.13, damage: 7, w: 84, h: 62, offsetX: 50, offsetY: 62, advance: 150, chain: 'light2', hitstun: 0.18, sfx: 'slash', arc: 74 },
        light2: { id: 'ravi_l2', label: 'Gancho Elétrico', startup: 0.045, active: 0.09, recovery: 0.14, damage: 9, w: 92, h: 70, offsetX: 56, offsetY: 66, advance: 165, chain: 'light3', hitstun: 0.2, sfx: 'slash', arc: 82 },
        light3: { id: 'ravi_l3', label: 'Chute Tempestade', startup: 0.075, active: 0.12, recovery: 0.22, damage: 15, w: 112, h: 92, offsetX: 64, offsetY: 58, knockback: 210, launch: 235, hitstun: 0.35, advance: 120, shake: 0.25, sfx: 'zap', arc: 96 },
        heavy: { id: 'ravi_h', label: 'Giro Relâmpago', startup: 0.16, active: 0.22, recovery: 0.26, damage: 19, w: 190, h: 110, offsetX: 0, offsetY: 60, knockback: 280, launch: 150, hitstun: 0.32, hits: 2, hitInterval: 0.14, shake: 0.4, sfx: 'zap', arc: 110 },
        air: { id: 'ravi_air', label: 'Voadora Elétrica', startup: 0.06, active: 0.22, recovery: 0.18, damage: 14, w: 106, h: 96, offsetX: 24, offsetY: 46, launch: 110, hitstun: 0.28, dive: true, shake: 0.22, sfx: 'zap', arc: 80 },
    },
    // MIRIAM — tank ofensivo, lento, com super armor nos golpes.
    miriam: {
        light1: { id: 'miriam_l1', label: 'Marreta de Ferro', startup: 0.15, active: 0.1, recovery: 0.24, damage: 13, w: 96, h: 82, offsetX: 56, offsetY: 64, advance: 110, chain: 'light2', hitstun: 0.24, armor: true, shake: 0.18, sfx: 'heavy', arc: 84 },
        light2: { id: 'miriam_l2', label: 'Quebra-Escudo', startup: 0.16, active: 0.12, recovery: 0.28, damage: 17, w: 112, h: 96, offsetX: 62, offsetY: 60, knockback: 220, advance: 120, chain: 'light3', hitstun: 0.3, armor: true, shake: 0.24, sfx: 'heavy', arc: 92 },
        light3: { id: 'miriam_l3', label: 'Pressão Tectônica', startup: 0.24, active: 0.16, recovery: 0.36, damage: 25, w: 168, h: 110, offsetX: 58, offsetY: 54, knockback: 300, launch: 190, hitstun: 0.42, armor: true, shake: 0.5, sfx: 'magma', arc: 110 },
        heavy: { id: 'miriam_h', label: 'Soco Sísmico', startup: 0.36, active: 0.18, recovery: 0.42, damage: 30, w: 230, h: 96, offsetX: 40, offsetY: 44, knockback: 340, launch: 210, hitstun: 0.45, armor: true, trigger: 'shockwave', shake: 0.8, sfx: 'magma', arc: 130 },
        air: { id: 'miriam_air', label: 'Meteoro de Fuligem', startup: 0.14, active: 0.2, recovery: 0.3, damage: 21, w: 128, h: 120, offsetX: 20, offsetY: 40, knockback: 260, launch: 80, hitstun: 0.35, dive: true, shake: 0.45, sfx: 'heavy', arc: 90 },
    },
    // KAEL — zoner gravitacional, projéteis e campo.
    kael: {
        light1: { id: 'kael_l1', label: 'Feixe de Massa', startup: 0.09, active: 0.06, recovery: 0.2, damage: 9, w: 34, h: 40, offsetX: 30, offsetY: 62, projectile: { speed: 620, radius: 11, damage: 9, style: 'plasma', life: 0.85 }, sfx: 'gravity', arc: 40 },
        light2: { id: 'kael_l2', label: 'Dupla Orbital', startup: 0.09, active: 0.06, recovery: 0.24, damage: 8, w: 34, h: 40, offsetX: 30, offsetY: 62, projectile: { speed: 650, radius: 9, damage: 8, style: 'plasma', life: 0.85, count: 2, spread: 0.12 }, sfx: 'gravity', arc: 40 },
        light3: { id: 'kael_l3', label: 'Colapso Próximo', startup: 0.14, active: 0.12, recovery: 0.3, damage: 16, w: 128, h: 100, offsetX: 58, offsetY: 58, knockback: 260, launch: 200, hitstun: 0.35, advance: 80, shake: 0.35, sfx: 'gravity', arc: 96 },
        heavy: { id: 'kael_h', label: 'Poço de Massa', startup: 0.2, active: 0.05, recovery: 0.4, damage: 8, w: 80, h: 80, offsetX: 70, offsetY: 55, trigger: 'gravityWell', sfx: 'gravity', arc: 60 },
        air: { id: 'kael_air', label: 'Queda Orbital', startup: 0.1, active: 0.14, recovery: 0.24, damage: 12, w: 80, h: 80, offsetX: 24, offsetY: 50, projectile: { speed: 520, radius: 10, damage: 12, style: 'plasma', life: 0.8, gravity: 420 }, sfx: 'gravity', arc: 50 },
    },
    // OZRIC — foice, alcance médio, múltiplos golpes e drenagem.
    ozric: {
        light1: { id: 'ozric_l1', label: 'Corte do Exilado', startup: 0.1, active: 0.12, recovery: 0.18, damage: 12, w: 142, h: 96, offsetX: 82, offsetY: 62, advance: 110, chain: 'light2', hitstun: 0.22, sfx: 'slash', arc: 118 },
        light2: { id: 'ozric_l2', label: 'Arco Carmesim', startup: 0.11, active: 0.13, recovery: 0.2, damage: 14, w: 156, h: 104, offsetX: 88, offsetY: 60, advance: 130, chain: 'light3', hitstun: 0.24, sfx: 'slash', arc: 128 },
        light3: { id: 'ozric_l3', label: 'Sentença', startup: 0.16, active: 0.16, recovery: 0.3, damage: 20, w: 176, h: 120, offsetX: 94, offsetY: 58, knockback: 240, launch: 160, hitstun: 0.38, advance: 140, status: 'burn', shake: 0.32, sfx: 'slash', arc: 140 },
        heavy: { id: 'ozric_h', label: 'Moinho de Almas', startup: 0.22, active: 0.4, recovery: 0.36, damage: 7, w: 210, h: 130, offsetX: 30, offsetY: 58, hits: 4, hitInterval: 0.1, advance: 200, knockback: 120, hitstun: 0.16, status: 'burn', shake: 0.2, sfx: 'slash', arc: 150 },
        air: { id: 'ozric_air', label: 'Foice Descendente', startup: 0.12, active: 0.16, recovery: 0.24, damage: 17, w: 150, h: 120, offsetX: 34, offsetY: 48, launch: 90, hitstun: 0.3, status: 'burn', shake: 0.28, sfx: 'slash', arc: 120 },
    },
    // ÉLODIE — estocadas precisas, contra-ataque e marcação.
    elodie: {
        light1: { id: 'elodie_l1', label: 'Estocada da Aurora', startup: 0.055, active: 0.08, recovery: 0.14, damage: 10, w: 132, h: 44, offsetX: 74, offsetY: 62, advance: 170, chain: 'light2', hitstun: 0.18, sfx: 'slash', arc: 80 },
        light2: { id: 'elodie_l2', label: 'Corte Ascendente', startup: 0.055, active: 0.09, recovery: 0.16, damage: 12, w: 120, h: 90, offsetX: 66, offsetY: 64, advance: 140, chain: 'light3', hitstun: 0.22, sfx: 'slash', arc: 96 },
        light3: { id: 'elodie_l3', label: 'Julgamento Estelar', startup: 0.09, active: 0.12, recovery: 0.26, damage: 18, w: 150, h: 100, offsetX: 76, offsetY: 60, knockback: 190, launch: 120, hitstun: 0.34, advance: 120, status: 'mark', shake: 0.25, sfx: 'slash', arc: 120 },
        heavy: { id: 'elodie_h', label: 'Postura de Contra-ataque', startup: 0.04, active: 0.55, recovery: 0.32, damage: 0, w: 0, h: 0, offsetX: 0, offsetY: 60, trigger: 'counter', invuln: true, sfx: 'seal' },
        air: { id: 'elodie_air', label: 'Pena de Luz', startup: 0.07, active: 0.14, recovery: 0.22, damage: 15, w: 118, h: 96, offsetX: 30, offsetY: 50, launch: 100, hitstun: 0.28, sfx: 'slash', arc: 100 },
    },
    // THRYC — lâminas de espaço-tempo, fendas e ecos.
    thryc: {
        light1: { id: 'thryc_l1', label: 'Fio do Nexus', startup: 0.06, active: 0.1, recovery: 0.15, damage: 10, w: 118, h: 84, offsetX: 60, offsetY: 62, advance: 150, chain: 'light2', hitstun: 0.2, sfx: 'echo', arc: 94 },
        light2: { id: 'thryc_l2', label: 'Corte Espelhado', startup: 0.06, active: 0.1, recovery: 0.17, damage: 11, w: 128, h: 92, offsetX: 64, offsetY: 60, advance: 160, chain: 'light3', hitstun: 0.22, sfx: 'echo', arc: 100 },
        light3: { id: 'thryc_l3', label: 'Passo Entre Planos', startup: 0.1, active: 0.14, recovery: 0.26, damage: 17, w: 146, h: 116, offsetX: 70, offsetY: 58, knockback: 230, launch: 170, hitstun: 0.34, advance: 300, shake: 0.28, sfx: 'blink', arc: 118 },
        heavy: { id: 'thryc_h', label: 'Fenda Temporal', startup: 0.2, active: 0.18, recovery: 0.34, damage: 24, w: 160, h: 130, offsetX: 96, offsetY: 56, trigger: 'rift', hitstun: 0.4, shake: 0.4, sfx: 'echo', arc: 130 },
        air: { id: 'thryc_air', label: 'Cissura Aérea', startup: 0.08, active: 0.14, recovery: 0.24, damage: 15, w: 120, h: 100, offsetX: 30, offsetY: 48, launch: 90, hitstun: 0.28, sfx: 'echo', arc: 104 },
    },
};
//# sourceMappingURL=movesets.js.map