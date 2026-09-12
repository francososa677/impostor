import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldAlert, Plus, Users, Search, HelpCircle, Flame } from "lucide-react";
import { GlassCard } from "../components/GlassCard.js";
import { Button } from "../components/Button.js";

export const HomePage: React.FC = () => {
  const [code, setCode] = useState("");
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const navigate = useNavigate();

  const handleJoinWithCode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode.length === 5) {
      navigate(`/join/${cleanCode}`);
    }
  };

  return (
    <div className="min-h-[calc(100vh-65px)] flex flex-col items-center justify-center px-4 py-8 max-w-4xl mx-auto">
      {/* Hero Title & Mystery Atmosphere */}
      <div className="text-center space-y-4 mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-crimson-950/60 border border-crimson-500/30 text-crimson-400 text-xs font-semibold uppercase tracking-wider animate-pulse">
          <Flame className="w-4 h-4 text-crimson-500" />
          <span>Juego de Deducción Social Realtime</span>
        </div>

        <h1 className="font-heading font-black text-5xl sm:text-7xl tracking-tight text-white uppercase">
          ¿Quién es el <span className="crimson-gradient-text crimson-glow">Impostor</span>?
        </h1>

        <p className="text-zinc-400 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
          Todos reciben la misma palabra secreta... excepto los impostores. Decí palabras sutiles,
          descubrí las miradas sospechosas y votá antes de que te engañen.
        </p>
      </div>

      {/* Main Actions Grid */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
        {/* Create Room */}
        <GlassCard glow className="p-6 flex flex-col justify-between hover:scale-[1.02] transition-transform">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-crimson-600/20 border border-crimson-500/30 text-crimson-400 flex items-center justify-center mb-4">
              <Plus className="w-6 h-6" />
            </div>
            <h2 className="font-heading font-bold text-xl text-white">Crear Nueva Sala</h2>
            <p className="text-xs text-zinc-400 mt-1">
              Configurá las categorías, cantidad de impostores y modos de juego presencial o virtual.
            </p>
          </div>
          <Link to="/create" className="mt-6">
            <Button variant="primary" size="lg" className="w-full">
              Crear Sala
            </Button>
          </Link>
        </GlassCard>

        {/* Join Room by Code */}
        <GlassCard className="p-6 flex flex-col justify-between hover:scale-[1.02] transition-transform">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-dark-800 border border-white/10 text-zinc-300 flex items-center justify-center mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h2 className="font-heading font-bold text-xl text-white">Unirse a una Sala</h2>
            <p className="text-xs text-zinc-400 mt-1">
              Ingresá el código de 5 letras que te compartió tu amigo para entrar directo.
            </p>
          </div>

          <form onSubmit={handleJoinWithCode} className="mt-6 flex flex-col gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="CÓDIGO (ej. K7F9Q)"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={5}
                className="w-full px-4 py-3 rounded-xl bg-dark-900 border border-white/10 text-center font-mono font-bold text-lg text-white uppercase placeholder:text-zinc-600 focus:outline-none focus:border-crimson-500 transition-colors"
              />
            </div>
            <Button
              type="submit"
              variant="secondary"
              size="lg"
              disabled={code.trim().length !== 5}
              className="w-full"
            >
              Entrar
            </Button>
          </form>
        </GlassCard>
      </div>

      {/* Secondary Quick Links */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link to="/lobby">
          <Button variant="ghost" size="sm" icon={<Search className="w-4 h-4 text-crimson-400" />}>
            Explorar Salas Públicas
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          icon={<HelpCircle className="w-4 h-4 text-zinc-400" />}
          onClick={() => setShowHowToPlay(true)}
        >
          ¿Cómo se juega?
        </Button>
      </div>

      {/* How To Play Modal */}
      {showHowToPlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <GlassCard glow className="w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-crimson-400" />
                <h3 className="font-heading font-bold text-lg text-white">Reglas del Juego</h3>
              </div>
              <button
                onClick={() => setShowHowToPlay(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-zinc-300">
              <div className="flex gap-3 items-start">
                <div className="p-2 rounded-lg bg-crimson-950/60 border border-crimson-500/30 text-crimson-400 font-bold shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-white mb-0.5">Palabra Secreta</h4>
                  <p className="text-zinc-400">
                    Todos los jugadores reciben la misma palabra secreta excepto el o los impostores.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="p-2 rounded-lg bg-crimson-950/60 border border-crimson-500/30 text-crimson-400 font-bold shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-white mb-0.5">Ronda de Palabras</h4>
                  <p className="text-zinc-400">
                    Por turnos, cada jugador dice o escribe una sola palabra relacionada con su palabra secreta sin revelarla. Los impostores deben improvisar y disimular.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="p-2 rounded-lg bg-crimson-950/60 border border-crimson-500/30 text-crimson-400 font-bold shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-white mb-0.5">Discusión y Votación</h4>
                  <p className="text-zinc-400">
                    Al terminar la ronda, todos discuten y votan en secreto a quién eliminar. El más votado queda expulsado.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="p-2 rounded-lg bg-crimson-950/60 border border-crimson-500/30 text-crimson-400 font-bold shrink-0">
                  4
                </div>
                <div>
                  <h4 className="font-bold text-white mb-0.5">Condiciones de Victoria</h4>
                  <p className="text-zinc-400">
                    Los inocentes ganan si expulsan a todos los impostores. Los impostores ganan si igualan en número a los inocentes o si descubren la palabra en su última oportunidad.
                  </p>
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              className="w-full mt-6"
              onClick={() => setShowHowToPlay(false)}
            >
              ¡Entendido!
            </Button>
          </GlassCard>
        </div>
      )}
    </div>
  );
};
