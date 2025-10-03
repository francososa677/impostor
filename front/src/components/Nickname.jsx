import { useState } from "react";

export default function Nickname({ setNickname }) {
  const [input, setInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() !== "") {
      setNickname(input.trim());
    } else {
      alert("Por favor ingresa un nickname");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">
          Ingresa tu nickname
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tu nickname"
            className="p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg max-w-xs mx-auto"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white p-3 rounded text-lg hover:bg-blue-600 transition max-w-xs mx-auto"
          >
            Continuar
          </button>
        </form>
      </div>
    </div>
  );
}
