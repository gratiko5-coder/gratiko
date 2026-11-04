import { NextResponse } from "next/server";
import { getProgressiveJackpots } from "@/lib/jackpots";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getProgressiveJackpots();
    return NextResponse.json({
      success: true,
      jackpots: data,
    });
  } catch (error: any) {
    console.error("Erreur API jackpots:", error);
    return NextResponse.json(
      { error: "Impossible de récupérer les jackpots" },
      { status: 500 }
    );
  }
}
