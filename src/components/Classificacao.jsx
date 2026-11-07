import React, { useState, useEffect } from 'react';
import { collection, getDocs } from "firebase/firestore";

export default function Classificacao({ db, onSelectPilot }) {
  const [championships, setChampionships] = useState([]);
  const [selectedChampId, setSelectedChampId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('GERAL');
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChampionships = async () => {
      try {
        const snap = await getDocs(collection(db, "championships"));
        let list = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() }));
        setChampionships(list);
        if (list.length > 0) setSelectedChampId(list[0].id);
      } catch (err) {
        console.error("Erro ao carregar campeonatos:", err);
      } finally {
        setLoading(false);
      }
    };
    loadChampionships();
  }, [db]);

  useEffect(() => {
    const loadClassificacao = async () => {
      if (!selectedChampId) return;
      setLoading(true);
      try {
        const inscSnap = await getDocs(collection(db, "championships", selectedChampId, "inscriptions"));
        let list = [];
        inscSnap.forEach(d => {
          const data = d.data();
          list.push({
            id: d.id,
            name: data.fullName || data.email,
            car: data.car || "GT3",
            number: data.number || "00",
            category: data.category || "PRO",
            points: data.points || 0,
            racesCount: data.racesCount || 0
          });
        });

        // Filtrar por categoria se não for GERAL
        if (selectedCategory !== 'GERAL') {
          list = list.filter(item => item.category === selectedCategory);
        }

        // Ordenar por pontos decrescente
        list.sort((a, b) => b.points - a.points);
        setStandings(list);
      } catch (err) {
        console.error("Erro ao carregar classificação:", err);
      } finally {
        setLoading(false);
      }
    };
    loadClassificacao();
  }, [selectedChampId, selectedCategory, db]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold border-l-4 border-orange-500 pl-3 text-white">Classificação Oficial dos Campeonatos</h2>
          <p className="text-xs text-gray-400 mt-1">Consulte a tabela geral ou por categorias específicas de cada temporada.</p>
        </div>

        {/* Seletor de Campeonato */}
        <select 
          value={selectedChampId} 
          onChange={e => setSelectedChampId(e.target.value)}
          className="bg-gray-900 border border-gray-800 rounded-lg p-2.5 text-white text-xs font-bold"
        >
          {championships.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>

      {/* Sub-abas de Categorias */}
      <div className="flex gap-2 border-b border-gray-800 pb-3 text-xs">
        {['GERAL', 'PRO', 'PRO-AM', 'AM'].map(cat => (
          <button 
            key={cat} 
            onClick={() => setSelectedCategory(cat)} 
            className={`px-4 py-2 rounded-lg font-bold transition cursor-pointer ${selectedCategory === cat ? 'bg-orange-600 text-white' : 'bg-gray-900 text-gray-400 hover:bg-gray-800'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Tabela de Classificação */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-gray-950 text-gray-400 uppercase tracking-wider border-b border-gray-800">
              <tr>
                <th className="py-3 px-4 font-bold">Pos</th>
                <th className="py-3 px-4 font-bold">Piloto</th>
                <th className="py-3 px-4 font-bold">Carro / Nº</th>
                <th className="py-3 px-4 font-bold">Categoria</th>
                <th className="py-3 px-4 font-bold text-center">Etapas</th>
                <th className="py-3 px-4 font-bold text-right">Pontos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr><td colSpan="6" className="text-center py-8 text-gray-500">Carregando classificação...</td></tr>
              ) : standings.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-8 text-gray-500">Nenhum piloto registrado nesta categoria para este campeonato.</td></tr>
              ) : (
                standings.map((driver, index) => (
                  <tr key={driver.id} className="hover:bg-gray-800/50 transition">
                    <td className="py-3 px-4 font-bold text-orange-400">{index + 1}º</td>
                    <td className="py-3 px-4">
                      <button onClick={() => onSelectPilot && onSelectPilot(driver)} className="font-semibold text-white hover:text-orange-400 underline cursor-pointer text-left">
                        {driver.name}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-gray-400">{driver.car} (#{driver.number})</td>
                    <td className="py-3 px-4 font-bold text-emerald-400">{driver.category}</td>
                    <td className="py-3 px-4 text-center">{driver.racesCount}</td>
                    <td className="py-3 px-4 text-right font-extrabold text-white">{driver.points} pts</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}