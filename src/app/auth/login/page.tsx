"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Lock, Mail, AlertCircle, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Identifiants invalides");
        setLoading(false);
        return;
      }

      if (data.user?.role !== "PLAYER") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch {
      setError("Erreur de connexion au serveur");
      setLoading(false);
    }
  };

  const handleDemoFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="bg-gray-900/80 border border-gray-800 rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-3">
          <Link href="/" className="inline-block">
            <img
              src="/logo.png"
              alt="GRATIKO"
              className="h-14 w-auto mx-auto object-contain"
            />
          </Link>
          <h1 className="text-2xl font-black text-white">Connexion à GRATIKO</h1>
          <p className="text-xs text-gray-400">Accédez à vos tickets et à votre portefeuille sécurisé.</p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-300">Adresse email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.email@domaine.com"
                className="w-full pl-9 pr-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-300">Mot de passe</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
          >
            {loading ? "Connexion en cours..." : "Se connecter"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Raccourcis Comptes Démo Sandbox */}
        <div className="p-4 bg-gray-950/70 border border-indigo-900/40 rounded-2xl space-y-2 text-xs">
          <p className="font-bold text-amber-300 text-[11px] uppercase tracking-wider">
            Comptes de démonstration préconfigurés :
          </p>
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => handleDemoFill("joueur@gratiko.demo", "GratikoPlayer2026!")}
              className="text-left px-2.5 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-300 flex justify-between items-center transition-colors"
            >
              <span>🎮 <strong>Joueur Démo</strong> (Solde: 1 000 HTG)</span>
              <span className="text-[10px] text-amber-400 font-mono">Cliquer</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill("superadmin@gratiko.demo", "GratikoAdmin2026!")}
              className="text-left px-2.5 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-300 flex justify-between items-center transition-colors"
            >
              <span>🛡️ <strong>Super-Admin</strong> (Accès global & grand livre)</span>
              <span className="text-[10px] text-amber-400 font-mono">Cliquer</span>
            </button>
          </div>
        </div>

        <div className="text-center pt-2">
          <p className="text-xs text-gray-400">
            Pas encore de compte ?{" "}
            <Link href="/auth/register" className="text-amber-400 hover:text-amber-300 font-bold">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
