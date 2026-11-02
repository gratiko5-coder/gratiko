"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Lock, Mail, User, Phone, AlertCircle, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, phone, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de l'inscription");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Erreur de communication avec le serveur");
      setLoading(false);
    }
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
          <h1 className="text-2xl font-black text-white">Rejoindre GRATIKO</h1>
          <p className="text-xs text-gray-400">
            {process.env.NEXT_PUBLIC_APP_MODE === "PRODUCTION"
              ? "Créez votre compte joueur sécurisé et découvrez vos gains instantanés !"
              : "Créez votre compte joueur et recevez automatiquement 500 HTG de crédits démo !"}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-300">Nom complet</label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="ex: Jean Baptiste"
                className="w-full pl-9 pr-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

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
            <label className="text-xs font-semibold text-gray-300">Numéro de téléphone</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+509 37 XX XX XX"
                className="w-full pl-9 pr-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-300">Mot de passe (8 car. min)</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          <p className="text-[11px] text-gray-500 leading-tight">
            En créant un compte, vous confirmez être majeur et acceptez le règlement des jeux GRATIKO.
          </p>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
          >
            {loading ? "Création du compte..." : "Créer mon compte"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-gray-400">
            Déjà inscrit ?{" "}
            <Link href="/auth/login" className="text-amber-400 hover:text-amber-300 font-bold">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
