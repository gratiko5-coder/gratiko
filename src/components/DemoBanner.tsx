"use client";

import React from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";

export default function DemoBanner({ notice }: { notice?: string }) {
  return (
    <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-gray-950 font-semibold px-4 py-2 text-xs md:text-sm text-center shadow-md flex items-center justify-center gap-2">
      <AlertTriangle className="w-4 h-4 shrink-0 text-gray-950" />
      <span>
        <strong>MODE DÉMONSTRATION SÉCURISÉ :</strong> {notice || "Crédits et gains fictifs. Aucune transaction financière réelle n'est traitée sans agrément légal préalable."}
      </span>
      <ShieldCheck className="w-4 h-4 shrink-0 text-gray-950" />
    </div>
  );
}
