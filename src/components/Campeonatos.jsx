import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";

export default function Campeonatos({ db, currentUser, currentUserProfile }) {
  const [championships, setChampionships] = useState([]);
  const [inscriptionsMap, setInscriptionsMap] = useState({});
  const [loading, setLoading] = useState(true); // NOVO ESTADO DE CARREGAMENTO

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const champSnap = await getDocs(collection(db, "championships"));
        let cList = [];
        let iMap = {};
        
        // Busca paralela: carrega todos os dados de uma vez sem travar a tela
        await Promise.all(champSnap.docs.map(async (docSnap) => {
          const champData = { id: docSnap.id, ...docSnap.data() };
          cList.push(champData);
          
          const inscSnap = await getDocs(collection(db, "championships", docSnap.id, "inscriptions"));
          let inscList = [];
          inscSnap.forEach(i => inscList.push({ id: i.id, ...i.data() }));
          iMap[docSnap.id] = inscList;
        }));
        
        setChampionships(cList);
        setInscriptionsMap(iMap);
      } catch (err) { 
        console.error(err); 
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [db]);

  const handleToggleInscription = async (champId, isCurrentlyInscribed) => {
    if (!currentUser) return alert("Faça login para se inscrever.");
    try {
      const docRef = doc(db, "championships", champId, "inscriptions", currentUser.uid);
      if (isCurrentlyInscribed) {
        if (!window.confirm("Deseja cancelar a sua inscrição?")) return;
        await deleteDoc(docRef);
        alert("Inscrição removida.");
      } else {
        await setDoc(docRef, {
          userId: currentUser.uid, fullName: currentUserProfile?.fullName || currentUser.email,
          email: currentUser.email, car: currentUserProfile?.car || "GT3", number: currentUserProfile?.number || "00",
          category: "Em Análise", registeredAt: new Date().toISOString()
        });
        alert("Inscrição Global realizada!");
      }
      window.location.reload();
    } catch (err) { alert("Erro ao processar inscrição."); }
  };

  const formatarData = (dataStr) => {
    if (!dataStr) return 'Data a definir';
    const partes = dataStr.split('-'); return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  // TELA DE CARREGAMENTO ANIMADA
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-emerald-500"></div>
        <p className="text-gray-400 font-bold animate-pulse uppercase tracking-wider text-xs">A carregar Campeonatos Oficiais...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-l-4 border-emerald-500 pl-3">
        <h2 className="text-2xl font-bold text-white">Campeonatos Oficiais</h2>
        <p className="text-xs text-gray-400 mt-1">Visão geral do calendário e informações das etapas.</p>
      </div>

      <div className="space-y-8">
        {championships.map(champ => {
          const inscritos = inscriptionsMap[champ.id] || [];
          const isInscribed = currentUser ? inscritos.some(i => i.userId === currentUser.uid) : false;
          const isClosed = champ.status === "Inscrições Encerradas";
          const etapas = champ.rounds || [];

          return (
            <div key={champ.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl">
              <div className="bg-gray-950 p-6 border-b border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex gap-2 mb-2 flex-wrap">
                    <span className="bg-emerald-950 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-800">{champ.simulator}</span>
                    <span className="bg-orange-950 text-orange-400 text-[10px] font-bold px-2 py-0.5 rounded border border-orange-800">Rating {champ.eventType === 'principal' ? '100%' : '70%'}</span>
                    {isClosed && <span className="bg-red-950 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded border border-red-800">ENCERRADO</span>}
                  </div>
                  <h3 className="text-3xl font-black text-white uppercase tracking-wide">{champ.title}</h3>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-3xl font-black text-white">{inscritos.length}</div>
                  <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Inscritos</div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {etapas.map((etapa, idx) => (
                    <div key={idx} className="bg-gray-950 border border-gray-800 rounded-lg p-4 flex flex-col justify-between relative overflow-hidden">
                      {etapa.doublePoints && <div className="absolute top-0 right-0 bg-orange-600 text-white text-[9px] font-black px-3 py-1 rounded-bl-lg uppercase tracking-wider">Pontos em Dobro (x2)</div>}
                      <div className="flex justify-between items-start mb-3 mt-2">
                        <div>
                          <span className="text-emerald-400 font-bold text-[10px] uppercase">Etapa {idx + 1} • {formatarData(etapa.date)}</span>
                          <h5 className="text-lg font-bold text-white mt-0.5">{etapa.track || "Pista a definir"}</h5>
                        </div>
                        <div className="text-right pr-2"><span className="bg-gray-800 text-gray-300 text-[10px] font-bold px-2 py-1 rounded">{etapa.category}</span></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-[11px] text-gray-400 border-t border-gray-800 pt-3">
                        <div className="space-y-1">
                          <div className="text-white font-bold"><i className="fa-solid fa-stopwatch text-orange-400 mr-1"></i> Quali: <span className="text-gray-400 font-normal">{etapa.realSchedule?.quali || '--:--'} ({etapa.durations?.quali || 15}m)</span></div>
                          <div className="text-white font-bold"><i className="fa-solid fa-flag-checkered text-emerald-400 mr-1"></i> Corrida: <span className="text-gray-400 font-normal">{etapa.realSchedule?.corrida || '--:--'} ({etapa.durations?.corrida || 60}m)</span></div>
                        </div>
                        <div className="space-y-1">
                          <div><span className="font-bold text-white">Clima:</span> {etapa.weather} ({etapa.tempC}°C)</div>
                          <div><span className="font-bold text-white">Paradas:</span> {etapa.pits?.count} ({etapa.pits?.window})</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-950 p-5 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-xs text-gray-500">
                  <strong className="text-blue-400">Descartes Permitidos:</strong> {champ.scoring?.discardRounds} Etapa(s)
                </div>
                <button 
                  disabled={isClosed && !isInscribed}
                  onClick={() => handleToggleInscription(champ.id, isInscribed)}
                  className={`w-full md:w-auto px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-lg 
                    ${isInscribed ? 'bg-red-950 text-red-400 hover:bg-red-900 border border-red-900 cursor-pointer' : 
                      isClosed ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-500 cursor-pointer'}`}
                >
                  {isInscribed ? '✓ Inscrito (Cancelar)' : isClosed ? 'Inscrições Encerradas' : 'Inscrever-me na Temporada'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}