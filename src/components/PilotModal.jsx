import React, { useState, useEffect } from 'react';
import { collection, getDocs } from "firebase/firestore";

export default function PilotModal({ db, pilot, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPilotHistory = async () => {
      try {
        const snap = await getDocs(collection(db, "standings"));
        let pilotResults = [];
        snap.forEach(d => {
          const data = d.data();
          if (data.userId === pilot.id || data.name === pilot.name || data.fullName === pilot.fullName) {
            pilotResults.push({ id: d.id, ...data });
          }
        });
        setHistory(pilotResults);
      } catch (err) {
        console.error("Erro ao carregar histórico:", err);
      } finally {
        setLoading(false);
      }
    };
    if (pilot) loadPilotHistory();
  }, [db, pilot]);

  if (!pilot) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-2xl p-6 shadow-2xl space-y-6 text-xs text-gray-300">
        <div className="flex justify-between items-start border-b border-gray-800 pb-4">
          <div>
            <span className="bg-emerald-950 text-emerald-400 font-bold px-2.5 py-0.5 rounded uppercase border border-emerald-800/50 text-[10px]">
              Perfil do Piloto VRT
            </span>
            <h3 className="text-2xl font-extrabold text-white mt-1">{pilot.name || pilot.fullName || pilot.driverName}</h3>
            <p className="text-gray-400 mt-0.5">Carro: <strong className="text-white">{pilot.car || "GT3"}</strong> | Nº: <strong className="text-emerald-400">#{pilot.number || "00"}</strong></p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-lg font-bold p-2 cursor-pointer">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Resumo de Rating e Estatísticas */}
        <div className="grid grid-cols-3 gap-4 bg-gray-950 p-4 rounded-xl border border-gray-800 text-center">
          <div>
            <div className="text-gray-500 text-[10px] uppercase font-bold">Rating VRT</div>
            <div className="text-lg font-extrabold text-emerald-400 mt-1">{pilot.ratingScore || 1000} VRT</div>
          </div>
          <div>
            <div className="text-gray-500 text-[10px] uppercase font-bold">Confrontos H2H</div>
            <div className="text-lg font-extrabold text-white mt-1">{pilot.h2hRecord || "0 / 0"}</div>
          </div>
          <div>
            <div className="text-gray-500 text-[10px] uppercase font-bold">Aproveitamento</div>
            <div className="text-lg font-extrabold text-orange-400 mt-1">{pilot.percentage || "0"}%</div>
          </div>
        </div>

        {/* Histórico de Participações e Resultados */}
        <div>
          <h4 className="font-bold text-white text-sm mb-3">Histórico de Resultados em Campeonatos</h4>
          {loading ? (
            <div className="text-center py-6 text-gray-500">A carregar histórico...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-6 bg-gray-950 rounded-lg text-gray-500 border border-gray-800">
              Nenhum registo de resultado encontrado para este piloto nas tabelas ativas.
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {history.map((h, i) => (
                <div key={i} className="bg-gray-950 p-3 rounded-lg border border-gray-800 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-white">{h.championshipTitle || "Campeonato Oficial VRT"}</div>
                    <div className="text-gray-500 text-[11px]">Corridas disputadas: {h.racesCount || 1}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-400 font-bold">{h.points || 0} pts</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2 border-t border-gray-800">
          <button onClick={onClose} className="bg-gray-800 hover:bg-gray-700 text-white font-bold px-5 py-2 rounded-lg cursor-pointer">
            Fechar Perfil
          </button>
        </div>
      </div>
    </div>
  );
}