import { prisma } from "./prisma";
import { recordBalancedTransaction, ACCOUNT_CODES, calculateTicketFinancialSplit } from "./finance";

export interface MatchOdds {
  id: string;
  sportKey: string;
  leagueName: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  odds: {
    home: number;
    draw: number;
    away: number;
  };
  bookmaker: string;
}

export interface BetSelectionDetail {
  matchId: string;
  sportKey: string;
  leagueName: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  selectedOutcome: "HOME" | "DRAW" | "AWAY";
  selectedLabel: string;
  odds: number;
}

export interface BetSelectionInput {
  matchId: string;
  selectedOutcome: "HOME" | "DRAW" | "AWAY";
}

// Cache mémoire pour économiser les crédits The Odds API (TTL 15 minutes)
let cachedMatches: { data: MatchOdds[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 15 * 60 * 1000;

export const FALLBACK_MATCHES: MatchOdds[] = [
  {
    id: "match-ucl-01",
    sportKey: "soccer_uefa_champs_league",
    leagueName: "Ligue des Champions",
    homeTeam: "Real Madrid",
    awayTeam: "Bayern Munich",
    commenceTime: new Date(Date.now() + 3600000 * 4).toISOString(),
    odds: { home: 2.30, draw: 3.50, away: 2.90 },
    bookmaker: "Pinnacle",
  },
  {
    id: "match-ucl-02",
    sportKey: "soccer_uefa_champs_league",
    leagueName: "Ligue des Champions",
    homeTeam: "Paris SG",
    awayTeam: "Manchester City",
    commenceTime: new Date(Date.now() + 3600000 * 6).toISOString(),
    odds: { home: 2.75, draw: 3.45, away: 2.45 },
    bookmaker: "Bet365",
  },
  {
    id: "match-epl-01",
    sportKey: "soccer_epl",
    leagueName: "Premier League",
    homeTeam: "Arsenal",
    awayTeam: "Chelsea",
    commenceTime: new Date(Date.now() + 3600000 * 8).toISOString(),
    odds: { home: 1.85, draw: 3.75, away: 4.20 },
    bookmaker: "Bet365",
  },
  {
    id: "match-epl-02",
    sportKey: "soccer_epl",
    leagueName: "Premier League",
    homeTeam: "Newcastle United",
    awayTeam: "Everton",
    commenceTime: new Date(Date.now() + 3600000 * 10).toISOString(),
    odds: { home: 2.20, draw: 3.65, away: 3.40 },
    bookmaker: "1xBet",
  },
  {
    id: "match-laliga-01",
    sportKey: "soccer_spain_la_liga",
    leagueName: "La Liga",
    homeTeam: "FC Barcelone",
    awayTeam: "Atlético Madrid",
    commenceTime: new Date(Date.now() + 3600000 * 12).toISOString(),
    odds: { home: 1.95, draw: 3.60, away: 3.80 },
    bookmaker: "1xBet",
  },
  {
    id: "match-seriea-01",
    sportKey: "soccer_italy_serie_a",
    leagueName: "Serie A",
    homeTeam: "Atalanta Bergamo",
    awayTeam: "Parme Calcio",
    commenceTime: new Date(Date.now() + 3600000 * 14).toISOString(),
    odds: { home: 1.51, draw: 4.70, away: 5.80 },
    bookmaker: "Bet365",
  },
  {
    id: "match-primeira-01",
    sportKey: "soccer_portugal_primeira_liga",
    leagueName: "Primeira Liga",
    homeTeam: "Benfica Lisbon",
    awayTeam: "FC Alverca SAD",
    commenceTime: new Date(Date.now() + 3600000 * 16).toISOString(),
    odds: { home: 1.10, draw: 9.00, away: 17.00 },
    bookmaker: "1xBet",
  },
  {
    id: "match-ligue1-01",
    sportKey: "soccer_france_ligue_one",
    leagueName: "Ligue 1",
    homeTeam: "Marseille",
    awayTeam: "Lyon",
    commenceTime: new Date(Date.now() + 3600000 * 18).toISOString(),
    odds: { home: 2.15, draw: 3.40, away: 3.30 },
    bookmaker: "Bet365",
  },
  {
    id: "match-superlig-01",
    sportKey: "soccer_turkey_super_league",
    leagueName: "Süper Lig",
    homeTeam: "Galatasaray",
    awayTeam: "Fenerbahçe",
    commenceTime: new Date(Date.now() + 3600000 * 20).toISOString(),
    odds: { home: 2.05, draw: 3.30, away: 3.25 },
    bookmaker: "Pinnacle",
  },
];

export async function fetchLiveSportsMatches(forceRefresh = false): Promise<MatchOdds[]> {
  const now = Date.now();
  if (!forceRefresh && cachedMatches && now - cachedMatches.timestamp < CACHE_TTL_MS) {
    return cachedMatches.data;
  }

  const apiKey = process.env.THE_ODDS_API_KEY || "e5a849eba1726c846c4c12457cc548b4";
  const sportsToFetch = [
    { key: "soccer_epl", name: "Premier League" },
    { key: "soccer_uefa_champs_league", name: "Ligue des Champions" },
    { key: "soccer_spain_la_liga", name: "La Liga" },
    { key: "soccer_italy_serie_a", name: "Serie A" },
    { key: "soccer_france_ligue_one", name: "Ligue 1" },
  ];

  const allMatches: MatchOdds[] = [];

  for (const item of sportsToFetch) {
    try {
      const url = `https://api.the-odds-api.com/v4/sports/${item.key}/odds?apiKey=${apiKey}&regions=eu&markets=h2h&oddsFormat=decimal`;
      const res = await fetch(url, { next: { revalidate: 900 } });
      if (!res.ok) continue;

      const data = await res.json();
      if (Array.isArray(data)) {
        for (const matchItem of data) {
          const bookmaker = matchItem.bookmakers?.[0];
          const market = bookmaker?.markets?.[0];
          if (!market || !market.outcomes) continue;

          let homeOdds = 2.0;
          let drawOdds = 3.2;
          let awayOdds = 3.0;

          for (const outcome of market.outcomes) {
            if (outcome.name === matchItem.home_team) homeOdds = outcome.price;
            else if (outcome.name === matchItem.away_team) awayOdds = outcome.price;
            else if (outcome.name === "Draw") drawOdds = outcome.price;
          }

          allMatches.push({
            id: matchItem.id,
            sportKey: matchItem.sport_key,
            leagueName: item.name,
            homeTeam: matchItem.home_team,
            awayTeam: matchItem.away_team,
            commenceTime: matchItem.commence_time,
            odds: { home: homeOdds, draw: drawOdds, away: awayOdds },
            bookmaker: bookmaker.title || "Official",
          });
        }
      }
    } catch (err) {
      console.error(`Erreur fetch sport ${item.key}:`, err);
    }
  }

  // Si l'API retourne peu de matchs (ex: trêve internationale ou hors saison), fusionner avec les fixtures phares
  const combinedMatches = allMatches.length >= 4 ? allMatches : [...allMatches, ...FALLBACK_MATCHES];

  // Dédupliquer par ID
  const uniqueMatchesMap = new Map<string, MatchOdds>();
  for (const m of combinedMatches) {
    if (!uniqueMatchesMap.has(m.id)) {
      uniqueMatchesMap.set(m.id, m);
    }
  }

  const finalMatches = Array.from(uniqueMatchesMap.values());
  cachedMatches = { data: finalMatches, timestamp: now };
  return finalMatches;
}

export async function placeSportBet(params: {
  userId: string;
  stakeCents: number;
  selections: BetSelectionInput[];
  // Support rétro-compatible si matchId simple
  matchId?: string;
  selectedOutcome?: "HOME" | "DRAW" | "AWAY";
}) {
  // 1. Normaliser les sélections
  let inputSelections: BetSelectionInput[] = params.selections || [];
  if (inputSelections.length === 0 && params.matchId && params.selectedOutcome) {
    inputSelections = [{ matchId: params.matchId, selectedOutcome: params.selectedOutcome }];
  }

  if (inputSelections.length === 0) {
    throw new Error("Aucun match sélectionné pour ce coupon.");
  }

  if (params.stakeCents < 1000) {
    throw new Error("La mise minimale est de 10 Gourdes (10,00 HTG).");
  }

  // 2. Charger les matchs pour valider les cotes
  const availableMatches = await fetchLiveSportsMatches();
  const detailedSelections: BetSelectionDetail[] = [];
  let totalOddsAccumulated = 1.0;

  for (const sel of inputSelections) {
    const match = availableMatches.find((m) => m.id === sel.matchId) ||
      FALLBACK_MATCHES.find((m) => m.id === sel.matchId);

    if (!match) {
      throw new Error(`Match ${sel.matchId} introuvable ou expiré.`);
    }

    let odds = match.odds.home;
    let label = match.homeTeam;
    if (sel.selectedOutcome === "DRAW") {
      odds = match.odds.draw;
      label = "Match Nul";
    } else if (sel.selectedOutcome === "AWAY") {
      odds = match.odds.away;
      label = match.awayTeam;
    }

    totalOddsAccumulated *= odds;

    detailedSelections.push({
      matchId: match.id,
      sportKey: match.sportKey,
      leagueName: match.leagueName,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      commenceTime: match.commenceTime,
      selectedOutcome: sel.selectedOutcome,
      selectedLabel: label,
      odds,
    });
  }

  const totalOdds = parseFloat(totalOddsAccumulated.toFixed(2));
  const isMultiple = detailedSelections.length > 1;
  const betType = isMultiple ? "MULTIPLE" : "SIMPLE";
  const potentialWinCents = Math.round(params.stakeCents * totalOdds);

  const primarySelection = detailedSelections[0];
  const ticketPrefix = isMultiple ? "BET-MULTI" : "BET-FOOT";
  const betTicketNumber = `${ticketPrefix}-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

  // 3. Transaction atomique de débit du portefeuille et création du ticket
  const bet = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: params.userId },
      include: { wallet: true },
    });

    if (!user || !user.wallet) {
      throw new Error("Portefeuille introuvable.");
    }

    if (user.wallet.balanceCents < params.stakeCents) {
      throw new Error("Ou pa gen ase lajan nan bous ou pou parye.");
    }

    // Débiter immédiatement le portefeuille du joueur
    const updatedWallet = await tx.wallet.update({
      where: { userId: params.userId },
      data: {
        balanceCents: { decrement: params.stakeCents },
      },
    });

    const newBet = await tx.sportBet.create({
      data: {
        betTicketNumber,
        userId: params.userId,
        sportKey: primarySelection.sportKey,
        matchId: isMultiple ? `multi-${detailedSelections.length}` : primarySelection.matchId,
        leagueName: isMultiple ? `Combiné Multi-Ligues (${detailedSelections.length})` : primarySelection.leagueName,
        homeTeam: isMultiple ? `Combiné (${detailedSelections.length} sélections)` : primarySelection.homeTeam,
        awayTeam: isMultiple ? `${primarySelection.homeTeam} + ${detailedSelections.length - 1} autres` : primarySelection.awayTeam,
        commenceTime: new Date(primarySelection.commenceTime),
        marketType: isMultiple ? "accumulator" : "h2h",
        selectedOutcome: isMultiple ? "MULTIPLE" : primarySelection.selectedOutcome,
        selectedLabel: isMultiple ? `${detailedSelections.length} Sélections Combinées` : primarySelection.selectedLabel,
        odds: totalOdds,
        stakeCents: params.stakeCents,
        potentialWinCents,
        currency: user.currency || "HTG",
        countryCode: user.countryCode || "HT",
        betType,
        selectionsJson: JSON.stringify(detailedSelections),
        status: "PENDING",
      },
    });

    return {
      bet: newBet,
      newBalanceCents: updatedWallet.balanceCents,
    };
  });

  // 4. Enregistrement au Grand Livre comptable en partie double
  const split = calculateTicketFinancialSplit(params.stakeCents);

  await recordBalancedTransaction({
    idempotencyKey: `BET_STAKE_${bet.bet.id}`,
    reference: bet.bet.betTicketNumber,
    description: isMultiple
      ? `Pari Combiné (${detailedSelections.length} matchs) - Cote ${totalOdds}`
      : `Pari sportif ${primarySelection.homeTeam} vs ${primarySelection.awayTeam} (${primarySelection.selectedLabel})`,
    transactionType: "TICKET_PURCHASE",
    amountCents: params.stakeCents,
    currency: bet.bet.currency,
    countryCode: bet.bet.countryCode,
    relatedEntityId: bet.bet.id,
    entries: [
      { accountCode: ACCOUNT_CODES.PLAYER_BALANCES, entryType: "DEBIT", amountCents: params.stakeCents },
      { accountCode: ACCOUNT_CODES.GROSS_SALES, entryType: "CREDIT", amountCents: params.stakeCents },
    ],
  });

  await recordBalancedTransaction({
    idempotencyKey: `BET_ALLOC_${bet.bet.id}`,
    reference: `ALLOC-${bet.bet.betTicketNumber}`,
    description: `Ventilation 20% Comm / 32% Réserve / 48% Caisse Pari`,
    transactionType: "COMMISSION_ALLOCATION",
    amountCents: params.stakeCents,
    currency: bet.bet.currency,
    countryCode: bet.bet.countryCode,
    relatedEntityId: bet.bet.id,
    entries: [
      { accountCode: ACCOUNT_CODES.GROSS_SALES, entryType: "DEBIT", amountCents: params.stakeCents },
      { accountCode: ACCOUNT_CODES.OPERATOR_COMMISSION, entryType: "CREDIT", amountCents: split.commissionCents },
      { accountCode: ACCOUNT_CODES.RESERVE_FUND, entryType: "CREDIT", amountCents: split.reserveCents },
      { accountCode: ACCOUNT_CODES.PRIZE_POOL, entryType: "CREDIT", amountCents: split.prizeBudgetCents },
    ],
  });

  return bet;
}
