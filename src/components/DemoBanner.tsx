"use client";

import React from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";

export default function DemoBanner({ notice }: { notice?: string }) {
  return (
    <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-gray-950 font-semibold px-2.5 sm:px-4 py-1.5 text-[11px] sm:text-xs md:text-sm text-center shadow-md flex items-center justify-center gap-1.5 sm:gap-2 leading-tight w-full max-w-full overflow-hidden">
      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-gray-950" />
      <span className="break-words">
        <strong className="font-black">MODE DÉMONSTRATION SÉCURISÉ :</strong>{" "}
        {notice || "Crédits et gains fictifs. Aucune transaction financière réelle n'est traitée sans agrément légal préalable."}
      </span>
      <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-gray-950 hidden sm:inline-block" />
    </div>
  );
}
