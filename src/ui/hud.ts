/** HUD de combate: vida, habilidade, combo, ondas e chefe. */

import type { Boss } from '../entities/boss.js';
import type { Player } from '../entities/player.js';
import type { StageDef } from '../data/stages.js';
import { clamp, hexToRgba } from '../core/math.js';
import { FONTS, bar, glow, label, panel, roundRectPath } from '../render/theme.js';
import { drawCharacterPortrait } from '../render/characters.js';

export interface HudBanner {
  text: string;
  sub: string;
  color: string;
  t: number;
  max: number;
}

export interface HudData {
  player: Player;
  stage: StageDef;
  waveIndex: number;
  waveCount: number;
  waveLabel: string;
  boss: Boss | null;
  kills: number;
  time: number;
  banner: HudBanner | null;
  showHints: boolean;
}

const VIEW_W = 1280;
const VIEW_H = 720;

function bannerAlpha(b: HudBanner): number {
  const inT = clamp(b.t / 0.28, 0, 1);
  const outT = clamp((b.max - b.t) / 0.5, 0, 1);
  return Math.min(inT, outT);
}

function abilityLabel(p: Player): string {
  if (p.abilityReady) return 'PRONTA';
  return `${p.abilityCd.toFixed(1)}s`;
}

export function drawHud(ctx: CanvasRenderingContext2D, data: HudData, viewTime: number): void {
  const p = data.player;
  const def = p.def;
  const c = def.colors;
  const accent = c.accent;

  // Vinheta de perigo.
  if (p.hpRatio < 0.32 && !p.dead) {
    const pulse = 0.5 + Math.sin(viewTime * 5) * 0.2;
    const g = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.34, VIEW_W / 2, VIEW_H / 2, VIEW_W * 0.68);
    g.addColorStop(0, 'rgba(255,20,50,0)');
    g.addColorStop(1, `rgba(255,20,50,${0.3 * pulse})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  // ------------------------------------------------------------ jogador
  panel(ctx, 20, 16, 392, 146, {
    fill: 'rgba(5, 8, 16, 0.72)',
    border: hexToRgba(accent, 0.3),
    glow: hexToRgba(accent, 0.18),
    cut: 14,
  });
  ctx.fillStyle = hexToRgba(accent, 0.9);
  ctx.fillRect(20, 16, 3, 146);

  // Retrato.
  ctx.save();
  ctx.beginPath();
  ctx.arc(76, 86, 42, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fill();
  ctx.strokeStyle = hexToRgba(accent, 0.5);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.clip();
  ctx.translate(76, 86);
  ctx.scale(0.82, 0.82);
  ctx.translate(-76, -86);
  drawCharacterPortrait(ctx, def, 76, 86, 100, viewTime);
  ctx.restore();

  label(ctx, def.name.toUpperCase(), 128, 48, 24, '#f2f5ff', {
    weight: 800,
    spacing: 1.2,
    glow: hexToRgba(accent, 0.35),
  });
  label(ctx, `${def.epithet.toUpperCase()} · ${def.combat.toUpperCase()}`, 128, 66, 10.5, hexToRgba(accent, 0.85), {
    font: FONTS.mono,
    spacing: 0.8,
  });

  // Vida.
  const hpW = 262;
  bar(ctx, 128, 78, hpW, 16, p.hpRatio, p.hpRatio < 0.3 ? '#ff3357' : accent, 'rgba(255,255,255,0.08)');
  // Marcas de vida.
  ctx.save();
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 10; i++) {
    const x = 128 + (hpW / 10) * i;
    ctx.beginPath();
    ctx.moveTo(x, 78);
    ctx.lineTo(x, 94);
    ctx.stroke();
  }
  ctx.restore();
  label(ctx, `${Math.ceil(p.hp)} / ${p.maxHp}`, 384, 90.5, 11, '#ffffff', {
    align: 'right',
    font: FONTS.mono,
    weight: 700,
    outline: 'rgba(0,0,0,0.8)',
    outlineWidth: 3,
  });

  // Habilidade.
  const ready = p.abilityReady;
  const boxCol = ready ? accent : 'rgba(130,140,165,0.6)';
  ctx.save();
  ctx.fillStyle = ready ? hexToRgba(accent, 0.22) : 'rgba(255,255,255,0.05)';
  roundRectPath(ctx, 128, 104, 22, 22, 3);
  ctx.fill();
  ctx.strokeStyle = boxCol;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  if (!ready) {
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#000000';
    ctx.fillRect(128, 104, 22, 22);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  label(ctx, 'E', 139, 120, 13, ready ? '#ffffff' : 'rgba(190,196,214,0.55)', {
    align: 'center',
    weight: 800,
    font: FONTS.mono,
  });
  label(ctx, def.ability.name.toUpperCase(), 160, 120, 12.5, ready ? '#e8edf9' : 'rgba(180,188,208,0.55)', {
    weight: 700,
    spacing: 0.4,
  });

  bar(ctx, 128, 132, hpW, 5, ready ? 1 : 1 - p.abilityCd / Math.max(0.01, p.abilityMax), ready ? c.accent : '#7a8298');
  label(ctx, abilityLabel(p), 390, 139.5, 9.5, ready ? hexToRgba(accent, 0.9) : 'rgba(180,188,208,0.5)', {
    align: 'right',
    font: FONTS.mono,
    spacing: 0.6,
  });

  // Dash.
  const dashReady = p.dashCd <= 0.01;
  label(ctx, 'DASH', 128, 153, 9, dashReady ? hexToRgba(c.glow, 0.8) : 'rgba(160,168,190,0.35)', {
    font: FONTS.mono,
    spacing: 1,
  });
  for (let i = 0; i < 4; i++) {
    const filled = dashReady || (1 - p.dashCd / Math.max(0.01, p.dashCd + 0.9)) * 4 > i;
    ctx.fillStyle = filled ? hexToRgba(c.glow, 0.8) : 'rgba(255,255,255,0.1)';
    ctx.fillRect(164 + i * 13, 147, 9, 5);
  }
  // Estado de combo passivo.
  if (p.charId === 'miriam') {
    label(ctx, `CALOR ${Math.round(p.heat)}%`, 390, 153, 9, '#ff9b3c', { align: 'right', font: FONTS.mono });
  } else if (p.charId === 'ravi') {
    label(ctx, `RITMO x${(p.damageMultiplier()).toFixed(2)}`, 390, 153, 9, c.accent, { align: 'right', font: FONTS.mono });
  } else if (p.charId === 'ozric') {
    label(ctx, `DRENADO ${Math.round(p.drained)}`, 390, 153, 9, '#ff6a7a', { align: 'right', font: FONTS.mono });
  } else if (p.charId === 'elodie') {
    label(ctx, p.auraWindow > 0 ? 'LAMPEJO ATIVO' : 'LÂMINA SERENA', 390, 153, 9, '#fff4cd', { align: 'right', font: FONTS.mono });
  } else if (p.charId === 'kael') {
    label(ctx, 'GRAVIDADE ESTÁVEL', 390, 153, 9, '#9d8bff', { align: 'right', font: FONTS.mono });
  } else if (p.charId === 'thryc') {
    label(ctx, 'MEMÓRIA ECOADA', 390, 153, 9, '#b48bff', { align: 'right', font: FONTS.mono });
  }

  // ------------------------------------------------------------ fase / onda
  const cx = VIEW_W / 2;
  ctx.save();
  const strip = ctx.createLinearGradient(cx - 260, 0, cx + 260, 0);
  strip.addColorStop(0, 'rgba(5,8,16,0)');
  strip.addColorStop(0.2, 'rgba(5,8,16,0.65)');
  strip.addColorStop(0.8, 'rgba(5,8,16,0.65)');
  strip.addColorStop(1, 'rgba(5,8,16,0)');
  ctx.fillStyle = strip;
  ctx.fillRect(cx - 260, 14, 520, 78);
  ctx.restore();

  label(ctx, `${data.stage.subtitle.toUpperCase()} · ${data.stage.location.toUpperCase()}`, cx, 30, 10, hexToRgba(data.stage.palette.accent, 0.8), {
    align: 'center',
    font: FONTS.mono,
    spacing: 1.1,
  });
  label(ctx, data.stage.name.toUpperCase(), cx, 54, 24, '#f2f5ff', {
    align: 'center',
    weight: 800,
    spacing: 2.2,
    glow: hexToRgba(data.stage.palette.accent, 0.4),
  });
  const flowLabel = data.boss
    ? `CHEFE DO PLANO — ${data.waveLabel.toUpperCase()}`
    : `ONDA ${Math.min(data.waveIndex + 1, data.waveCount)} / ${data.waveCount} — ${data.waveLabel.toUpperCase()}`;
  label(ctx, flowLabel, cx, 74, 10.5, data.boss ? hexToRgba(data.boss.def.colors.accent, 0.85) : 'rgba(190,198,220,0.72)', {
    align: 'center',
    font: FONTS.mono,
    spacing: 0.7,
  });

  // Progresso da fase.
  const pw = 360;
  bar(ctx, cx - pw / 2, 82, pw, 4, clamp(p.x / data.stage.width, 0, 1), data.stage.palette.accent, 'rgba(255,255,255,0.08)');

  // ------------------------------------------------------------ combo / abates
  if (p.comboHits > 1) {
    const scale = 1 + clamp(p.comboTimerDisplay / 2.4, 0, 1) * 0.1;
    ctx.save();
    ctx.translate(1242, 54);
    ctx.scale(scale, scale);
    label(ctx, `${p.comboHits}`, 0, 0, 40, '#ffffff', {
      align: 'right',
      weight: 800,
      outline: 'rgba(0,0,0,0.6)',
      outlineWidth: 6,
      glow: hexToRgba(accent, 0.8),
      font: FONTS.ui,
    });
    label(ctx, 'HITS', 4, 8, 13, hexToRgba(accent, 0.95), {
      align: 'right',
      weight: 800,
      font: FONTS.mono,
      spacing: 1.4,
    });
    ctx.restore();
    bar(ctx, 1122, 64, 120, 3, clamp(p.comboTimerDisplay / 2.4, 0, 1), accent, 'rgba(255,255,255,0.1)');
  } else {
    label(ctx, 'COMBO', 1248, 54, 10, 'rgba(170,178,200,0.35)', {
      align: 'right',
      font: FONTS.mono,
      spacing: 1.4,
    });
  }
  label(ctx, `ABATES ${String(data.kills).padStart(3, '0')}`, 1248, 88, 10.5, 'rgba(190,198,220,0.65)', {
    align: 'right',
    font: FONTS.mono,
    spacing: 1,
  });
  label(ctx, `MELHOR ${String(Math.max(p.bestCombo, p.comboHits)).padStart(2, '0')}`, 1248, 104, 10.5, hexToRgba(data.stage.palette.accent, 0.6), {
    align: 'right',
    font: FONTS.mono,
    spacing: 1,
  });

  // ------------------------------------------------------------ chefe
  const boss = data.boss;
  if (boss && !boss.dead) {
    const bw = 600;
    const bx = cx - bw / 2;
    const by = 650;
    const bossCol = boss.def.colors.accent;
    ctx.save();
    const bg = ctx.createLinearGradient(0, by - 64, 0, by + 28);
    bg.addColorStop(0, 'rgba(5,8,16,0)');
    bg.addColorStop(0.5, 'rgba(5,8,16,0.78)');
    bg.addColorStop(1, 'rgba(5,8,16,0.9)');
    ctx.fillStyle = bg;
    ctx.fillRect(bx - 60, by - 64, bw + 120, 98);
    ctx.restore();

    label(ctx, boss.def.name.toUpperCase(), cx, by - 26, 22, '#ffffff', {
      align: 'center',
      weight: 800,
      spacing: 2,
      glow: hexToRgba(bossCol, 0.55),
      outline: 'rgba(0,0,0,0.65)',
      outlineWidth: 4,
    });
    label(ctx, `${boss.def.title.toUpperCase()} · ${boss.phaseName.toUpperCase()}`, cx, by - 9, 10, hexToRgba(bossCol, 0.9), {
      align: 'center',
      font: FONTS.mono,
      spacing: 1,
    });

    bar(ctx, bx, by, bw, 14, boss.hpRatio, bossCol, 'rgba(255,255,255,0.08)');
    // Marcadores de fase.
    for (let i = 1; i < boss.def.phases.length; i++) {
      const ratio = boss.def.phases[i].threshold;
      const x = bx + bw * ratio;
      ctx.strokeStyle = 'rgba(0,0,0,0.65)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, by - 1);
      ctx.lineTo(x, by + 15);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, by);
      ctx.lineTo(x, by + 14);
      ctx.stroke();
    }
    if (boss.phaseFlash > 0) {
      ctx.save();
      ctx.globalAlpha = boss.phaseFlash * 0.55;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx, by, bw, 14);
      ctx.restore();
    }
    // Fase atual em pips.
    for (let i = 0; i < boss.def.phases.length; i++) {
      ctx.fillStyle = i <= boss.phaseIndex ? bossCol : 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.arc(bx + bw + 18 + i * 14, by + 7, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    if (boss.state === 'windup' && boss.attackLabel) {
      const a = clamp(boss.stateT / Math.max(0.01, boss.attackWindup), 0, 1);
      const pillW = 210;
      ctx.save();
      ctx.fillStyle = 'rgba(5,8,16,0.82)';
      roundRectPath(ctx, cx - pillW / 2, by - 112, pillW, 30, 15);
      ctx.fill();
      ctx.strokeStyle = hexToRgba(bossCol, 0.7);
      ctx.stroke();
      ctx.fillStyle = hexToRgba(bossCol, 0.2 + a * 0.35);
      roundRectPath(ctx, cx - pillW / 2 + 2, by - 110, (pillW - 4) * a, 26, 13);
      ctx.fill();
      ctx.restore();
      label(ctx, boss.attackLabel, cx, by - 92, 12.5, '#ffffff', {
        align: 'center',
        weight: 800,
        font: FONTS.mono,
        spacing: 1.8,
      });
    }
  }

  // ------------------------------------------------------------ faixa de anúncio
  const banner = data.banner;
  if (banner) {
    const a = bannerAlpha(banner);
    if (a > 0.01) {
      ctx.save();
      ctx.globalAlpha = a;
      const bg = ctx.createLinearGradient(0, 188, VIEW_W, 188);
      bg.addColorStop(0, 'rgba(5,8,16,0)');
      bg.addColorStop(0.25, 'rgba(5,8,16,0.72)');
      bg.addColorStop(0.75, 'rgba(5,8,16,0.72)');
      bg.addColorStop(1, 'rgba(5,8,16,0)');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 176, VIEW_W, 104);
      ctx.strokeStyle = hexToRgba(banner.color, 0.4);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(340, 176);
      ctx.lineTo(940, 176);
      ctx.moveTo(340, 280);
      ctx.lineTo(940, 280);
      ctx.stroke();
      ctx.restore();

      label(ctx, banner.text.toUpperCase(), cx, 233, 42, '#ffffff', {
        align: 'center',
        weight: 800,
        spacing: 5,
        glow: banner.color,
        outline: 'rgba(0,0,0,0.5)',
        outlineWidth: 5,
        alpha: a,
      });
      label(ctx, banner.sub.toUpperCase(), cx, 260, 12, hexToRgba(banner.color, 0.95), {
        align: 'center',
        font: FONTS.mono,
        spacing: 2.2,
        alpha: a,
      });
    }
  }

  // ------------------------------------------------------------ dicas
  if (data.showHints) {
    ctx.save();
    ctx.globalAlpha = clamp((18 - data.time) / 4, 0, 1);
    label(ctx, 'A/D MOVER   ESPAÇO PULAR   J LEVE   K PESADO   L DASH   E HABILIDADE', 24, 702, 10.5, 'rgba(210,216,232,0.55)', {
      font: FONTS.mono,
      spacing: 1,
      outline: 'rgba(0,0,0,0.7)',
      outlineWidth: 3,
    });
    ctx.restore();
  }
  label(ctx, 'ESC PAUSAR · M ÁUDIO', 1256, 702, 10, 'rgba(170,178,200,0.45)', {
    align: 'right',
    font: FONTS.mono,
    spacing: 1,
    outline: 'rgba(0,0,0,0.7)',
    outlineWidth: 3,
  });

  // Pulso de habilidade pronta.
  if (ready && p.abilityFlash <= 0) {
    const pulse = 0.5 + Math.sin(viewTime * 3.4) * 0.5;
    glow(ctx, 139, 115, 22 + pulse * 6, accent, 0.14 + pulse * 0.1);
  }
}
