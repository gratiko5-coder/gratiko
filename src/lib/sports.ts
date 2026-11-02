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

// Cache mémoire pour économiser les crédits The Odds API (TTL 15 minutes)
let cachedMatches: { data: MatchOdds[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 15 * 60 * 1000;

const FALLBACK_MATCHES: MatchOdds[] = [
  {
    id: "match-epl-01",
    sportKey: "soccer_epl",
    leagueName: "Premier League",
    homeTeam: "Newcastle United",
    awayTeam: "Everton",
    commenceTime: new Date(Date.now() + 3600000 * 2).toISOString(),
    odds: { home: 2.20, draw: 3.65, away: 3.40 },
    bookmaker: "1xBet",
  },
  {
    id: "match-epl-02",
    sportKey: "soccer_epl",
    leagueName: "Premier League",
    homeTeam: "Arsenal",
    awayTeam: "Chelsea",
    commenceTime: new Date(Date.now() + 3600000 * 5).toISOString(),
    odds: { home: 1.85, draw: 3.75, away: 4.20 },
    bookmaker: "Bet365",
  },
  {
    id: "match-ucl-01",
    sportKey: "soccer_uefa_champs_league",
    leagueName: "Ligue des Champions",
    homeTeam: "Real Madrid",
    awayTeam: "Bayern Munich",
    commenceTime: new Date(Date.now() + 3600000 * 24).toISOString(),
    odds: { home: 2.30, draw: 3.50, away: 2.90 },
    bookmaker: "Pinnacle",
  },
  {
    id: "match-ucl-02",
    sportKey: "soccer_uefa_champs_league",
    leagueName: "Ligue des Champions",
    homeTeam: "Paris SG",
    awayTeam: "Manchester City",
    commenceTime: new Date(Date.now() + 3600000 * 26).toISOString(),
    odds: { home: 2.75, draw: 3.45, away: 2.45 },
    bookmaker: "Bet365",
  },
  {
    id: "match-laliga-01",
    sportKey: "soccer_spain_la_liga",
    leagueName: "La Liga",
    homeTeam: "FC Barcelone",
    awayTeam: "Atlético Madrid",
    commenceTime: new Date(Date.now() + 3600000 * 48).toISOString(),
    odds: { home: 1.95, draw: 3.60, away: 3.80 },
    bookmaker: "1xBet",
  },
  {
    id: "match-ligue1-01",
    sportKey: "soccer_france_ligue_one",
    leagueName: "Ligue 1",
    homeTeam: "Marseille",
    awayTeam: "Lyon",
    commenceTime: new Date(Date.now() + 3600000 * 50).toISOString(),
    odds: { home: 2.15, draw: 3.40, away: 3.30 },
    bookmaker: "Bet365",
  },
];

export async function fetchLiveSportsMatches(forceRefresh = false): Promise<MatchOdds[]> {
  const now = Date.now();
  if (!forceRefresh && cachedMatches && now - cachedMatches.timestamp < CACHE_TTL_MS) {
    return cachedMatches.data;
  }

  const apiKey = process.env.THE_ODDS_API_KEY || "e5a849eba1726c846c4c12457cc548b4";
  const sportsToFetch = ["soccer_epl", "soccer_uefa_champs_league", "soccer_spain_la_liga"];
  const allMatches: MatchOdds[] = [];

  for (const sport of sportsToFetch) {
    try {
      const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds?apiKey=${apiKey}&regions=eu&markets=h2h&oddsFormat=decimal`;
      const res = await fetch(url, { next: { revalidate: 900 } });
      if (!res.ok) continue;

      const data = await res.json();
      if (Array.isArray(data)) {
        for (const item of data) {
          const bookmaker = item.bookmakers?.[0];
          const market = bookmaker?.markets?.[0];
          if (!market || !market.outcomes) continue;

          let homeOdds = 2.0;
          let drawOdds = 3.2;
          let awayOdds = 3.0;

          for (const outcome of market.outcomes) {
            if (outcome.name === item.home_team) homeOdds = outcome.price;
            else if (outcome.name === item.away_team) awayOdds = outcome.price;
            else if (outcome.name === "Draw") drawOdds = outcome.price;
          }

          let league = "Football";
          if (sport === "soccer_epl") league = "Premier League";
          if (sport === "soccer_uefa_champs_league") league = "Ligue des Champions";
          if (sport === "soccer_spain_la_liga") league = "La Liga";

          allMatches.push({
            id: item.id,
            sportKey: item.sport_key,
            leagueName: league,
            homeTeam: item.home_team,
            awayTeam: item.away_team,
            commenceTime: item.commence_time,
            odds: { home: homeOdds, draw: drawOdds, away: awayOdds },
            bookmaker: bookmaker.title || "Official",
          });
        }
      }
    } catch (err) {
      console.error(`Erreur fetch sport ${sport}:`, err);
    }
  }

  const finalMatches = allMatches.length > 0 ? allMatches : FALLBACK_MATCHES;
  cachedMatches = { data: finalMatches, timestamp: now };
  return finalMatches;
}

export async function placeSportBet(params: {
  userId: string;
  matchId: string;
  selectedOutcome: "HOME" | "DRAW" | "AWAY";
  stakeCents: number;
}) {
  const matches = await fetchLiveSportsMatches();
  const match = matches.find((m) => m.id === params.matchId);
  if (!match) {
    throw new Error("Match sélectionné introuvable ou expiré.");
  }

  // Vérifier la cote associée
  let chosenOdds = 1.0;
  let selectedLabel = "";
  if (params.selectedOutcome === "HOME") {
    chosenOdds = match.odds.home;
    selectedLabel = match.homeTeam;
  } else if (params.selectedOutcome === "DRAW") {
    chosenOdds = match.odds.draw;
    selectedLabel = "Match Nul";
  } else {
    chosenOdds = match.odds.away;
    selectedLabel = match.awayTeam;
  }

  if (params.stakeCents < 5000) {
    throw new Error("La mise minimale est de 50 Gourdes (50,00 HTG).");
  }

  const potentialWinCents = Math.round(params.stakeCents * chosenOdds);

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

    const betTicketNumber = `BET-FOOT-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newBet = await tx.sportBet.create({
      data: {
        betTicketNumber,
        userId: params.userId,
        sportKey: match.sportKey,
        matchId: match.id,
        leagueName: match.leagueName,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        commenceTime: new Date(match.commenceTime),
        marketType: "h2h",
        selectedOutcome: params.selectedOutcome,
        selectedLabel,
        odds: chosenOdds,
        stakeCents: params.stakeCents,
        potentialWinCents,
        currency: user.currency || "HTG",
        countryCode: user.countryCode || "HT",
        status: "PENDING",
      },
    });

    return {
      bet: newBet,
      newBalanceCents: updatedWallet.balanceCents,
    };
  });

  // Enregistrement au Grand Livre comptable
  const split = calculateTicketFinancialSplit(params.stakeCents);

  await recordBalancedTransaction({
    idempotencyKey: `BET_STAKE_${bet.bet.id}`,
    reference: bet.bet.betTicketNumber,
    description: `Pari sportif ${bet.bet.homeTeam} vs ${bet.bet.awayTeam} (${bet.bet.selectedLabel})`,
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
