"use client";

import React, { useState, useEffect } from "react";

export default function JackpotTickerBanner() {
  const [silver, setSilver] = useState(14661);
  const [gold, setGold] = useState(10039);
  const [maximum, setMaximum] = useState(2500000);

  // Animation légère de progression de jackpot
  useEffect(() => {
    const timer = setInterval(() => {
      setSilver((prev) => prev + Math.floor(Math.random() * 3));
      setGold((prev) => prev + Math.floor(Math.random() * 5));
      setMaximum((prev) => prev + Math.floor(Math.random() * 12));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const renderDigits = (num: number, minLength = 5) => {
    const str = num.toString().padStart(minLength, "0");
    return (
      <div className="flex items-center gap-0.5 bg-black/90 px-2 py-1 rounded-md border border-amber-500/50 shadow-inner">
        {str.split("").map((digit, idx) => (
          <span
            key={idx}
            className="w-4 sm:w-5 h-6 bg-gradient-to-b from-gray-900 via-gray-950 to-black text-amber-400 font-mono font-black text-xs sm:text-sm flex items-center justify-center rounded border border-amber-500/30 shadow-sm"
          >
            {digit}
          </span>
        ))}
        <span className="text-[10px] text-amber-300 font-bold ml-1">HTG</span>
      </div>
    );
  };

  return (
    <div className="w-full bg-gradient-to-r from-gray-950 via-indigo-950/80 to-gray-950 border-y border-amber-500/20 py-2.5 px-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-3 sm:gap-8 text-center">
        {/* Silver Jackpot */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] sm:text-xs font-black tracking-wider text-gray-300 uppercase">
            SILVER JACKPOT
          </span>
          {renderDigits(silver, 5)}
        </div>

        {/* Gold Jackpot */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] sm:text-xs font-black tracking-wider text-amber-400 uppercase">
            GOLD JACKPOT
          </span>
          {renderDigits(gold, 5)}
        </div>

        {/* Maximum Jackpot */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] sm:text-xs font-black tracking-wider text-yellow-300 uppercase">
            MAXIMUM JACKPOT
          </span>
          {renderDigits(maximum, 7)}
        </div>
      </div>
    </div>
  );
}
