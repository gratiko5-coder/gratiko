import { NextResponse } from "next/server";
import { fetchLiveSportsMatches } from "@/lib/sports";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const matches = await fetchLiveSportsMatches();
    return NextResponse.json({
      success: true,
      matches,
    });
  } catch (error: any) {
    console.error("Erreur récupération matchs:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
