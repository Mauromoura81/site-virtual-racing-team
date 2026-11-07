import React, { useState, useEffect } from 'react';
import { collection, getDocs } from "firebase/firestore";

export default function Mural({ db, currentUser }) {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        const snap = await getDocs(collection(db, "announcements"));
        let list = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() }));
        setAnnouncements(list);
      } catch (err) {
        console.error(err);
      }
    };
    loadAnnouncements();
  }, [db]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold border-l-4 border-emerald-500 pl-3 text-white">Mural de Avisos Oficiais</h2>
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="text-gray-500 text-xs bg-gray-900 border border-gray-800 p-6 rounded-xl text-center">
            Nenhum aviso publicado no mural até o momento.
          </div>
        ) : (
          announcements.map(a => (
            <div key={a.id} className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-xl space-y-2">
              <h3 className="text-lg font-bold text-white">{a.title}</h3>
              <p className="text-xs text-gray-300 whitespace-pre-line leading-relaxed">{a.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}