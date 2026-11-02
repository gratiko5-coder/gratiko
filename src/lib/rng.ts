import crypto from "crypto";

export interface SelectedOutcome {
  tierName: string;
  prizeAmountCents: number;
  isWinner: boolean;
  displayLabel: string;
  symbols: string[];
}

export function getRandomInt(min: number, max: number): number {
  // crypto.randomInt is cryptographically secure
  return crypto.randomInt(min, max);
}

const WINNING_SYMBOLS = ["⭐", "💎", "👑", "🔥", "⚡", "🍀", "7️⃣"];
const LOSING_SYMBOLS = ["🍒", "🍋", "🔔", "🍇", "🍉", "🪙", "🎲", "🎯"];

export function generateSymbolsForOutcome(isWinner: boolean, prizeAmountCents: number): string[] {
  if (isWinner) {
    // 3 matching high-value symbols for winning scratch card
    const symbolIndex = getRandomInt(0, WINNING_SYMBOLS.length);
    const winningSymbol = WINNING_SYMBOLS[symbolIndex];
    // Create a 3x3 grid (9 tiles) with at least 3 matching winning symbols
    const grid: string[] = [];
    // Place 3 winning symbols
    grid.push(winningSymbol, winningSymbol, winningSymbol);
    // Fill remaining 6 with assorted symbols
    for (let i = 0; i < 6; i++) {
      const filler = LOSING_SYMBOLS[getRandomInt(0, LOSING_SYMBOLS.length)];
      grid.push(filler);
    }
    // Fisher-Yates shuffle
    for (let i = grid.length - 1; i > 0; i--) {
      const j = getRandomInt(0, i + 1);
      [grid[i], grid[j]] = [grid[j], grid[i]];
    }
    return grid;
  } else {
    // Losing card: ensure NO 3 identical symbols occur
    const grid: string[] = [];
    const pool = [...LOSING_SYMBOLS, ...WINNING_SYMBOLS];
    const counts: Record<string, number> = {};
    while (grid.length < 9) {
      const sym = pool[getRandomInt(0, pool.length)];
      if ((counts[sym] || 0) < 2) {
        counts[sym] = (counts[sym] || 0) + 1;
        grid.push(sym);
      }
    }
    return grid;
  }
}

export function validatePrizeTiers(
  tiers: { tierName: string; probability: number; prizeAmountCents: number }[]
): { isValid: boolean; error?: string; totalProbability: number } {
  let sum = 0;
  for (const t of tiers) {
    if (t.probability <= 0) {
      return { isValid: false, error: `Probabilité invalide pour ${t.tierName}`, totalProbability: sum };
    }
    if (t.prizeAmountCents < 0) {
      return { isValid: false, error: `Montant négatif invalide pour ${t.tierName}`, totalProbability: sum };
    }
    sum += t.probability;
  }

  // Permettre une tolérance infime d'arrondi à 1.0 (100%)
  if (Math.abs(sum - 1.0) > 0.0001) {
    return {
      isValid: false,
      error: `La somme des probabilités doit être égale à 100% (actuel: ${(sum * 100).toFixed(2)}%)`,
      totalProbability: sum,
    };
  }

  return { isValid: true, totalProbability: sum };
}
