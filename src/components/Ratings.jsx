import React, { useState, useEffect } from 'react';
import { collection, getDocs } from "firebase/firestore";

export default function Ratings({ db }) {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRatings = async () => {
      try {
        const snap = await getDocs(collection(db, "ratings"));
        let list = [];
        snap.forEach(d => {
          list.push({ id: d.id, ...d.data() });
        });
        // Ordenar por rating decrescente
        list.sort((a, b) => (b.ratingScore || 0) - (a.ratingScore || 0));
        setRatings(list);
      } catch (err) {
        console.error("Erro ao carregar ratings: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    loadRatings();
  }, [db]);

  if (loading) {
    return <div className="text-gray-400 text-center py-12 text-xs">Carregando sistema de Rating VRT...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold border-l-4 border-emerald-500 pl-3 text-white">Rating Oficial VRT</h2>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-gray-950 text-gray-400 uppercase tracking-wider border-b border-gray-800">
              <tr>
                <th className="py-3 px-4 font-bold">Ranking</th>
                <th className="py-3 px-4 font-bold">Piloto</th>
                <th className="py-3 px-4 font-bold text-center">Confrontos / H2H</th>
                <th className="py-3 px-4 font-bold text-center">Aproveitamento</th>
                <th className="py-3 px-4 font-bold text-right">Pontuação VRT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {ratings.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500">Nenhum piloto pontuado no Rating VRT atualmente.</td>
                </tr>
              ) : (
                ratings.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-800/50 transition">
                    <td className="py-3 px-4 font-bold text-emerald-400">#{index + 1}</td>
                    <td className="py-3 px-4 font-semibold text-white">{item.driverName}</td>
                    <td className="py-3 px-4 text-center text-gray-400">{item.h2hRecord || "0/0"}</td>
                    <td className="py-3 px-4 text-center font-medium">{item.percentage || "0"}%</td>
                    <td className="py-3 px-4 text-right font-extrabold text-emerald-400">{item.ratingScore || 1000} VRT</td>
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