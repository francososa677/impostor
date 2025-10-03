import { useState, useEffect } from "react";

export default function Voting({ room, nickname, onVote, onTimeEnd }) {
  const [votes, setVotes] = useState(room.votes || {});
  const [eliminated, setEliminated] = useState(room.eliminated);
  const [timeLeft, setTimeLeft] = useState(120); // 120 segundos
  const [startTime] = useState(Date.now());
  const [votingEnded, setVotingEnded] = useState(false);
  const isEliminated = room.words && room.words[nickname] && room.words[nickname].includes("ELIMINADO");

  useEffect(() => {
    if (!room.players || !room.roomName) return;
    let timerId;
    let pollId;

    function updateTime() {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const left = Math.max(120 - elapsed, 0);
      setTimeLeft(left);

      if (
        !votingEnded &&
        (left <= 0 || Object.keys(votes).length === room.players.length)
      ) {
        setVotingEnded(true);
        clearInterval(timerId);
        clearInterval(pollId);

        fetch(`http://localhost:5000/rooms/${room.roomName}/endVoting`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
          .then((res) => res.json())
          .then((data) => {
            setVotes(data.votes);
            setEliminated(data.eliminated);
            if (onTimeEnd) onTimeEnd(data);
          })
          .catch((err) => console.error(err));
      }
    }

    function pollVotes() {
      fetch(`http://localhost:5000/rooms/${room.roomName}`)
        .then((res) => res.json())
        .then((data) => {
          setVotes(data.votes || {});
          setEliminated(data.eliminated);
        })
        .catch((err) => console.error(err));
    }

    timerId = setInterval(updateTime, 1000);
    pollId = setInterval(pollVotes, 1000);

    return () => {
      clearInterval(timerId);
      clearInterval(pollId);
    };
  }, [room, startTime, votingEnded, votes, onTimeEnd]); // 🔹 <-- cierre del useEffect

  const vote = async (player) => {
    try {
      const res = await fetch(
        `http://localhost:5000/rooms/${room.roomName}/vote`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ voter: nickname, voted: player }),
        }
      );
      const data = await res.json();
      setVotes(data.votes);
      setEliminated(data.eliminated);
      if (onVote) onVote(data);
    } catch (err) {
      console.error(err);
    }
  };

  const canVote = room.turnOrder.every(
    (p) => room.words[p]?.length > 0 || room.readyPlayers?.[p]
  );

  return (
    <div className="flex flex-col gap-4 mt-4">
      <h3 className="text-xl font-bold">Fase de votación</h3>
      <p>Tiempo restante: {timeLeft} segundos</p>

      {!isEliminated && (Array.isArray(room.players) ? room.players : [])
        .filter(Boolean)
        .map((player) => {
          if (player === nickname) return null; // no votarse a sí mismo
          if (room.words && room.words[player] && room.words[player].includes("ELIMINADO")) return null; // no mostrar si está eliminado
          return (
            <div key={player} className="flex items-center gap-2">
              <span>{player}</span>
              <button
                disabled={!canVote || (votes && votes[nickname]) || timeLeft <= 0}
                onClick={() => vote(player)}
                className="bg-blue-500 text-white px-3 py-1 rounded disabled:opacity-50"
              >
                Votar
              </button>
            </div>
          );
        })}

      <div className="mt-4">
        <h4>Votos:</h4>
        {votes &&
          typeof votes === "object" &&
          Object.entries(votes).map(([voter, voted]) => (
            <p key={voter}>
              {voter} votó a {voted}
            </p>
          ))}
      </div>

      {eliminated && (
        <div className="mt-4 text-red-600 font-bold">
          {eliminated} ha sido eliminado.
        </div>
      )}
      {eliminated === null &&
        canVote &&
        Object.keys(votes).length === room.players.length && (
          <div className="mt-4 text-yellow-600 font-bold">
            Empate, se inicia nueva ronda
          </div>
        )}

      {timeLeft <= 0 && !eliminated && (
        <div className="mt-4 text-gray-600 font-bold">
          El tiempo se agotó. Los votos que no se emitieron no cuentan.
        </div>
      )}
    </div>
  );
}
