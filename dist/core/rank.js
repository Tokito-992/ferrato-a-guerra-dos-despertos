/** Rank competitivo do Véu: pressão, multiplicador de pontos e leitura visual. */
export const RANKS = ['D', 'C', 'B', 'A', 'S', 'SS'];
const RANK_VALUES = {
    D: 0,
    C: 1,
    B: 2,
    A: 3,
    S: 4,
    SS: 5,
};
const RANK_COLORS = {
    D: '#8d94aa',
    C: '#8df4a8',
    B: '#56e3ff',
    A: '#ffd166',
    S: '#ff8a3d',
    SS: '#ff6a9a',
};
export function isRank(value) {
    return typeof value === 'string' && RANKS.includes(value);
}
export function rankValue(rank) {
    return RANK_VALUES[rank];
}
export function rankColor(rank) {
    return RANK_COLORS[rank];
}
/** A pressão sobe com combos, abates e ondas limpas; cai quando o jogador apanha. */
export function rankFromPressure(pressure) {
    const p = Math.max(0, Math.min(100, pressure));
    if (p >= 92)
        return 'SS';
    if (p >= 78)
        return 'S';
    if (p >= 60)
        return 'A';
    if (p >= 42)
        return 'B';
    if (p >= 24)
        return 'C';
    return 'D';
}
export function rankMultiplier(rank) {
    return 1 + rankValue(rank) * 0.08;
}
//# sourceMappingURL=rank.js.map