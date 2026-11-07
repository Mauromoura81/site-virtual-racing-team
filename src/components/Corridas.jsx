import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";

export default function Corridas({ db, currentUser, currentUserProfile }) {
  const [funEvents, setFunEvents] = useState([]);
  const [inscriptionsMap, setInscriptionsMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const champSnap = await getDocs(collection(db, "events4fun"));
        let cList = [];
        let iMap = {};
        
        // Busca paralela: carrega todos os dados de uma vez sem travar a tela
        await Promise.all(champSnap.docs.map(async (docSnap) => {
          const champData = { id: docSnap.id, ...docSnap.data() };
          cList.push(champData);
          
          const inscSnap = await getDocs(collection(db, "events4fun", docSnap.id, "inscriptions"));
          let inscList = [];
          inscSnap.forEach(i => inscList.push({ id: i.id, ...i.data() }));
          iMap[docSnap.id] = inscList;
        }));
        
        setFunEvents(cList);
        setInscriptionsMap(iMap);
      } catch (err) { 
        console.error(err); 
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [db]);

  const handleToggleInscription = async (eventId, isCurrentlyInscribed) => {
    if (!currentUser) return alert("Faça login para se inscrever.");
    try {
      const docRef = doc(db, "events4fun", eventId, "inscriptions", currentUser.uid);
      if (isCurrentlyInscribed) {
        await deleteDoc(docRef); alert("Inscrição removida.");
      } else {
        await setDoc(docRef, {
          userId: currentUser.uid, fullName: currentUserProfile?.fullName || currentUser.email,
          email: currentUser.email, car: currentUserProfile?.car || "GT3", number: currentUserProfile?.number || "00",
          registeredAt: new Date().toISOString()
        });
        alert("Inscrito na corrida 4Fun!");
      }
      window.location.reload();
    } catch (err) { alert("Erro ao processar inscrição."); }
  };

  const formatarData = (dataStr) => {
    if (!dataStr) return 'Data a definir';
    const partes = dataStr.split('-'); return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-orange-500"></div>
        <p className="text-gray-400 font-bold animate-pulse uppercase tracking-wider text-xs">A carregar Corridas 4Fun...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-l-4 border-orange-500 pl-3">
        <h2 className="text-2xl font-bold text-white">Eventos Avulsos (4Fun)</h2>
        <p className="text-xs text-gray-400 mt-1">Inscrições prova a prova. Impacto de 50% no Rating VRT.</p>
      </div>

      <div className="space-y-6">
        {funEvents.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 p-8 rounded-xl text-center text-gray-500 text-sm">Nenhuma corrida programada.</div>
        ) : (
          funEvents.map(evento => {
            const inscritos = inscriptionsMap[evento.id] || [];
            const isInscribed = currentUser ? inscritos.some(i => i.userId === currentUser.uid) : false;
            const round = evento.round || {};
            const isClosed = evento.status === "Inscrições Encerradas";

            return (
              <div key={evento.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl relative">
                {round.doublePoints && <div className="absolute top-0 right-0 z-10 bg-orange-600 text-white text-[10px] font-black px-4 py-1.5 rounded-bl-xl uppercase">Pontos em Dobro</div>}
                <div className="bg-gray-950 p-6 border-b border-gray-800 flex justify-between items-start pt-8">
                  <div>
                    <div className="flex gap-2 mb-2">
                      <span className="bg-orange-950 text-orange-400 text-[10px] font-bold px-2 py-0.5 rounded border border-orange-800">4FUN (RATING 50%)</span>
                      <span className="bg-gray-800 text-gray-300 text-[10px] font-bold px-2 py-0.5 rounded">{round.category}</span>
                      {isClosed && <span className="bg-red-950 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded border border-red-800">ENCERRADO</span>}
                    </div>
                    <h3 className="text-2xl font-black text-white">{evento.title}</h3>
                    <p className="text-gray-400 text-xs mt-1">
                      <i className="fa-regular fa-calendar mr-1"></i> Data: <strong className="text-emerald-400 mr-3">{formatarData(round.date)}</strong>
                      <i className="fa-solid fa-location-dot mr-1"></i> Pista: <strong className="text-emerald-400">{round.track}</strong>
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-white">{inscritos.length}</div>
                    <div className="text-[10px] text-gray-500 uppercase font-bold">Inscritos</div>
                  </div>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs bg-gray-900">
                  <div className="space-y-3">
                    <div className="text-white font-bold border-b border-gray-800 pb-1">Sessões & Horários</div>
                    <div className="flex justify-between text-gray-400"><span>Treino ({round.durations?.treino || 15}m):</span> <span>{round.realSchedule?.treino || '--:--'}</span></div>
                    <div className="flex justify-between text-gray-400"><span>Quali ({round.durations?.quali || 15}m):</span> <span>{round.realSchedule?.quali || '--:--'}</span></div>
                    <div className="flex justify-between text-gray-400"><span>Corrida ({round.durations?.corrida || 60}m):</span> <span className="text-white font-bold">{round.realSchedule?.corrida || '--:--'}</span></div>
                  </div>
                  <div className="space-y-3">
                    <div className="text-white font-bold border-b border-gray-800 pb-1">Parâmetros do Servidor</div>
                    <div className="flex justify-between text-gray-400"><span>Clima:</span> <span>{round.weather} ({round.tempC}°C)</span></div>
                    <div className="flex justify-between text-gray-400"><span>Pit-Stops:</span> <span>{round.pits?.count} ({round.pits?.window})</span></div>
                  </div>
                </div>
                <div className="bg-gray-950 p-5 border-t border-gray-800 flex justify-end items-center">
                  <button 
                    disabled={isClosed && !isInscribed}
                    onClick={() => handleToggleInscription(evento.id, isInscribed)}
                    className={`px-8 py-3 rounded-xl font-bold text-xs uppercase transition shadow-lg 
                      ${isInscribed ? 'bg-red-950 text-red-400 border border-red-900 cursor-pointer' : 
                        isClosed ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-500 cursor-pointer'}`}
                  >
                    {isInscribed ? '✓ Inscrito (Desinscrever)' : isClosed ? 'Inscrições Encerradas' : 'Inscrever-me (4Fun)'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}