import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";

const ACC_TRACKS = [
  "Barcelona", "Brands Hatch", "COTA (Circuit of the Americas)", "Donington Park", "Hungaroring", 
  "Imola", "Indianapolis", "Kyalami", "Laguna Seca", "Misano", "Monza", "Mount Panorama (Bathurst)", 
  "Nürburgring 24h (Nordschleife)", "Nürburgring GP", "Oulton Park", "Paul Ricard", "Red Bull Ring", 
  "Silverstone", "Snetterton", "Spa-Francorchamps", "Suzuka", "Valencia", "Watkins Glen", "Zandvoort", "Zolder"
];
const ACC_CATEGORIES = ["GT3", "GT4", "GT2", "PORSCHE CUP", "LAMBO ST", "FERRARI CHALLENGE", "Marca Única"];
const ACC_CARS = [
  "Aston Martin V12 Vantage GT3", "Aston Martin Vantage V8 GT3", "Audi R8 LMS GT3", "Audi R8 LMS GT3 Evo", "Audi R8 LMS GT3 Evo II", 
  "Bentley Continental GT3 2015", "Bentley Continental GT3 2018", "BMW M6 GT3", "BMW M4 GT3", "Emil Frey Jaguar G3", 
  "Ferrari 488 GT3", "Ferrari 488 GT3 Evo", "Ferrari 296 GT3", "Honda NSX GT3", "Honda NSX GT3 Evo", 
  "Lamborghini Huracan GT3", "Lamborghini Huracan GT3 Evo", "Lamborghini Huracan GT3 Evo2", "Lexus RC F GT3", 
  "McLaren 650S GT3", "McLaren 720S GT3", "McLaren 720S GT3 Evo", "Mercedes-AMG GT3", "Mercedes-AMG GT3 Evo", 
  "Nissan GT-R Nismo GT3 2015", "Nissan GT-R Nismo GT3 2018", "Porsche 911 GT3 R (991)", "Porsche 911 GT3 R (991.2)", "Porsche 911 GT3 R (992)", "Reiter Engineering R-EX GT3",
  "Alpine A110 GT4", "Aston Martin Vantage GT4", "Audi R8 LMS GT4", "BMW M4 GT4", "Chevrolet Camaro GT4.R", 
  "Ginetta G55 GT4", "KTM X-Bow GT4", "Maserati Granturismo MC GT4", "McLaren 570S GT4", "Mercedes-AMG GT4", "Porsche 718 Cayman GT4 Clubsport",
  "Audi R8 LMS GT2", "KTM X-Bow GT2", "Maserati MC20 GT2", "Mercedes-AMG GT2", "Porsche 911 GT2 RS CS Evo", "Porsche 935",
  "Porsche 991.2 GT3 Cup", "Porsche 992 GT3 Cup", "Lamborghini Huracan ST", "Lamborghini Huracan ST Evo2", 
  "Ferrari 488 Challenge Evo", "BMW M2 CS Racing"
];

// As durações que você solicitou em minutos
const ACC_DURATIONS = [5, 10, 15, 20, 30, 45, 60, 75, 90, 105, 120, 150, 180];

export default function Admin({ db, currentUser }) {
  const [adminTab, setAdminTab] = useState('campeonatos');

  const [championshipsList, setChampionshipsList] = useState([]);
  const [events4FunList, setEvents4FunList] = useState([]);
  
  useEffect(() => { loadBaseData(); }, [db]);

  const loadBaseData = async () => {
    try {
      const champSnap = await getDocs(collection(db, "championships")); 
      setChampionshipsList(champSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      
      const funSnap = await getDocs(collection(db, "events4fun")); 
      setEvents4FunList(funSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error(err); }
  };

  // --- ESTADOS: CAMPEONATOS ---
  const [champTitle, setChampTitle] = useState('');
  const [eventType, setEventType] = useState('principal');
  const [bopAtivo, setBopAtivo] = useState(true);
  const [numEtapas, setNumEtapas] = useState(1);
  const [champDesc, setChampDesc] = useState('');
  const [pointsSystem, setPointsSystem] = useState('25, 18, 15, 12, 10, 8, 6, 4, 2, 1');
  const [extraPole, setExtraPole] = useState(2);
  const [extraFastestLap, setExtraFastestLap] = useState(1);
  const [extraProAm, setExtraProAm] = useState(1);
  const [extraAm, setExtraAm] = useState(1);
  const [discardRounds, setDiscardRounds] = useState(1);
  const [etapas, setEtapas] = useState([]);

  useEffect(() => {
    const novasEtapas = [...etapas];
    while (novasEtapas.length < numEtapas) {
      novasEtapas.push({
        track: 'Monza', date: '', doublePoints: false,
        durations: { treino: 15, quali: 15, corrida: 60 },
        realSchedule: { treino: '', quali: '', corrida: '' }, virtualSchedule: { treino: '', quali: '', corrida: '' },
        category: 'GT3', allowedCars: [], pits: { count: 1, window: '10 min', tyres: true, refuel: true, fixed25s: false },
        weather: 'Dinâmico', timeProgression: '1x', tempC: '24'
      });
    }
    setEtapas(novasEtapas.slice(0, numEtapas));
  }, [numEtapas]);

  const handleEtapaChange = (index, field, subfield, value) => {
    const newEtapas = [...etapas];
    if (subfield) newEtapas[index][field][subfield] = value; else newEtapas[index][field] = value;
    setEtapas(newEtapas);
  };

  const handleCarSelection = (index, carName) => {
    const newEtapas = [...etapas];
    const currentCars = newEtapas[index].allowedCars;
    if (currentCars.includes(carName)) newEtapas[index].allowedCars = currentCars.filter(c => c !== carName);
    else newEtapas[index].allowedCars = [...currentCars, carName];
    setEtapas(newEtapas);
  };

  const handleCreateChampionship = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "championships"), {
        title: champTitle, simulator: "Assetto Corsa Competizione", eventType, bopAtivo, description: champDesc,
        scoring: { pointsSystem, extraPole: Number(extraPole), extraFastestLap: Number(extraFastestLap), extraProAm: Number(extraProAm), extraAm: Number(extraAm), discardRounds: Number(discardRounds) },
        rounds: etapas, status: "Inscrições Abertas", createdAt: new Date().toISOString()
      });
      alert("Campeonato oficial criado com sucesso!");
      setChampTitle(''); setNumEtapas(1); loadBaseData();
    } catch (err) { alert("Erro ao criar campeonato."); }
  };

  // --- ESTADOS: 4FUN ---
  const defaultFunEtapa = {
    track: 'Monza', date: '', doublePoints: false,
    durations: { treino: 15, quali: 15, corrida: 60 },
    realSchedule: { treino: '', quali: '', corrida: '' }, virtualSchedule: { treino: '', quali: '', corrida: '' },
    category: 'GT3', allowedCars: [], pits: { count: 1, window: 'Livre', tyres: true, refuel: true, fixed25s: false },
    weather: 'Seco', timeProgression: '1x', tempC: '24'
  };
  const [funTitle, setFunTitle] = useState('');
  const [funEtapa, setFunEtapa] = useState(defaultFunEtapa);

  const handleCreate4Fun = async (e) => {
    e.preventDefault();
    if(!funTitle) return alert("Dê um nome ao evento!");
    try {
      await addDoc(collection(db, "events4fun"), {
        title: funTitle, simulator: "Assetto Corsa Competizione", eventType: "4fun", bopAtivo: false,
        round: funEtapa, status: "Inscrições Abertas", createdAt: new Date().toISOString()
      });
      alert("Evento 4Fun criado com sucesso! As inscrições já estão abertas.");
      setFunTitle(''); setFunEtapa(defaultFunEtapa); loadBaseData();
    } catch (err) { alert("Erro ao criar 4Fun."); }
  };

  // --- AÇÕES DO PAINEL GERIR ---
  const handleDeleteDoc = async (collectionName, id, name) => {
    if (!window.confirm(`Excluir definitivamente "${name}"? Esta ação não pode ser desfeita.`)) return;
    try { await deleteDoc(doc(db, collectionName, id)); loadBaseData(); } catch (err) { alert("Erro ao excluir."); }
  };

  const handleToggleStatus = async (collectionName, id, currentStatus) => {
    const newStatus = currentStatus === "Inscrições Abertas" ? "Inscrições Encerradas" : "Inscrições Abertas";
    try { await updateDoc(doc(db, collectionName, id), { status: newStatus }); loadBaseData(); } 
    catch (err) { alert("Erro ao alterar o status."); }
  };

  const renderEtapaConfig = (etapa, index, is4Fun = false) => {
    const handleChange = (field, subfield, value) => {
      if (is4Fun) {
        const newEtapa = { ...funEtapa };
        if (subfield) newEtapa[field][subfield] = value; else newEtapa[field] = value;
        setFunEtapa(newEtapa);
      } else handleEtapaChange(index, field, subfield, value);
    };

    return (
      <div key={index} className="bg-gray-950 p-5 rounded-xl border border-gray-800 space-y-5 relative">
        {!is4Fun && <h4 className="text-emerald-400 font-black text-sm absolute -top-3 left-4 bg-gray-950 px-2 border border-gray-800 rounded">Etapa {index + 1}</h4>}
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          <div><label className="block text-gray-400 mb-1">Pista da Corrida</label><select value={etapa.track} onChange={e => handleChange('track', null, e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded p-1.5 text-white">{ACC_TRACKS.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
          <div><label className="block text-gray-400 mb-1">Data da Corrida</label><input type="date" value={etapa.date} onChange={e => handleChange('date', null, e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded p-1.5 text-white" /></div>
          <div><label className="block text-gray-400 mb-1">Categoria de Carros</label><select value={etapa.category} onChange={e => handleChange('category', null, e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded p-1.5 text-white">{ACC_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          <div><label className="flex items-center space-x-2 text-gray-300 cursor-pointer h-full pt-4"><input type="checkbox" checked={etapa.doublePoints} onChange={e => handleChange('doublePoints', null, e.target.checked)} className="accent-orange-500 w-5 h-5" /><span className="font-bold text-orange-400 text-xs">Pontuação Dobrada (x2)</span></label></div>
        </div>

        {etapa.category === "Marca Única" && (
          <div className="bg-gray-900 p-3 rounded border border-orange-800/50">
            <label className="block text-orange-400 font-bold mb-2 text-[10px] uppercase tracking-wider">Selecione os Carros (Múltipla Escolha)</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {ACC_CARS.map(car => (
                <label key={car} className="flex items-center space-x-2 text-gray-300 cursor-pointer hover:text-white">
                  <input type="checkbox" checked={etapa.allowedCars.includes(car)} onChange={() => is4Fun ? (funEtapa.allowedCars.includes(car) ? setFunEtapa({...funEtapa, allowedCars: funEtapa.allowedCars.filter(c => c !== car)}) : setFunEtapa({...funEtapa, allowedCars: [...funEtapa.allowedCars, car]})) : handleCarSelection(index, car)} className="accent-orange-500" />
                  <span className="text-[10px] leading-tight">{car}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-900 p-4 rounded-xl border border-gray-800">
          <div className="space-y-3">
            <h5 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider border-b border-gray-800 pb-1">Duração (Minutos)</h5>
            <div className="flex items-center gap-2"><span className="w-14 text-gray-400">Treino:</span><select value={etapa.durations?.treino || 15} onChange={e => handleChange('durations', 'treino', Number(e.target.value))} className="flex-1 bg-gray-950 border border-gray-800 rounded p-1 text-white">{ACC_DURATIONS.map(d => <option key={d} value={d}>{d} min</option>)}</select></div>
            <div className="flex items-center gap-2"><span className="w-14 text-gray-400">Quali:</span><select value={etapa.durations?.quali || 15} onChange={e => handleChange('durations', 'quali', Number(e.target.value))} className="flex-1 bg-gray-950 border border-gray-800 rounded p-1 text-white">{ACC_DURATIONS.map(d => <option key={d} value={d}>{d} min</option>)}</select></div>
            <div className="flex items-center gap-2"><span className="w-14 text-gray-400">Corrida:</span><select value={etapa.durations?.corrida || 60} onChange={e => handleChange('durations', 'corrida', Number(e.target.value))} className="flex-1 bg-gray-950 border border-gray-800 rounded p-1 text-white">{ACC_DURATIONS.map(d => <option key={d} value={d}>{d} min</option>)}</select></div>
          </div>
          <div className="space-y-3">
            <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-800 pb-1">Horários Reais</h5>
            <div className="flex items-center gap-2"><span className="w-14 text-gray-400">Treino:</span><input type="time" value={etapa.realSchedule.treino} onChange={e => handleChange('realSchedule', 'treino', e.target.value)} className="flex-1 bg-gray-950 border border-gray-800 rounded p-1 text-white" /></div>
            <div className="flex items-center gap-2"><span className="w-14 text-gray-400">Quali:</span><input type="time" value={etapa.realSchedule.quali} onChange={e => handleChange('realSchedule', 'quali', e.target.value)} className="flex-1 bg-gray-950 border border-gray-800 rounded p-1 text-white" /></div>
            <div className="flex items-center gap-2"><span className="w-14 text-gray-400">Corrida:</span><input type="time" value={etapa.realSchedule.corrida} onChange={e => handleChange('realSchedule', 'corrida', e.target.value)} className="flex-1 bg-gray-950 border border-gray-800 rounded p-1 text-white" /></div>
          </div>
          <div className="space-y-3">
            <h5 className="text-[10px] font-bold text-blue-400 uppercase tracking-wider border-b border-gray-800 pb-1">In-Game (Virtual)</h5>
            <div className="flex items-center gap-2"><span className="w-14 text-gray-400">Treino:</span><input type="time" value={etapa.virtualSchedule.treino} onChange={e => handleChange('virtualSchedule', 'treino', e.target.value)} className="flex-1 bg-gray-950 border border-gray-800 rounded p-1 text-white" /></div>
            <div className="flex items-center gap-2"><span className="w-14 text-gray-400">Quali:</span><input type="time" value={etapa.virtualSchedule.quali} onChange={e => handleChange('virtualSchedule', 'quali', e.target.value)} className="flex-1 bg-gray-950 border border-gray-800 rounded p-1 text-white" /></div>
            <div className="flex items-center gap-2"><span className="w-14 text-gray-400">Corrida:</span><input type="time" value={etapa.virtualSchedule.corrida} onChange={e => handleChange('virtualSchedule', 'corrida', e.target.value)} className="flex-1 bg-gray-950 border border-gray-800 rounded p-1 text-white" /></div>
          </div>
        </div>

        <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div><label className="block text-gray-400 mb-1">Nº de Paradas</label><select value={etapa.pits.count} onChange={e => handleChange('pits', 'count', Number(e.target.value))} className="w-full bg-gray-950 border border-gray-800 rounded p-1.5 text-white"><option value={0}>0</option><option value={1}>1</option><option value={2}>2</option><option value={3}>3</option><option value={4}>4</option></select></div>
            {etapa.pits.count > 0 && (
              <>
                <div><label className="block text-gray-400 mb-1">Janela de Pit</label><select value={etapa.pits.window} onChange={e => handleChange('pits', 'window', e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded p-1.5 text-white"><option value="Livre">Livre</option><option value="5 min">5 min</option><option value="10 min">10 min</option><option value="15 min">15 min</option><option value="20 min">20 min</option></select></div>
                <div><label className="block text-gray-400 mb-1">Troca Pneus?</label><select value={etapa.pits.tyres ? "yes" : "no"} onChange={e => handleChange('pits', 'tyres', e.target.value === "yes")} className="w-full bg-gray-950 border border-gray-800 rounded p-1.5 text-white"><option value="yes">Sim</option><option value="no">Não</option></select></div>
                <div><label className="block text-gray-400 mb-1">Reabast.?</label><select value={etapa.pits.refuel ? "yes" : "no"} onChange={e => handleChange('pits', 'refuel', e.target.value === "yes")} className="w-full bg-gray-950 border border-gray-800 rounded p-1.5 text-white"><option value="yes">Sim</option><option value="no">Não</option></select></div>
                <div><label className="block text-gray-400 mb-1">Fixo 25s?</label><select value={etapa.pits.fixed25s ? "yes" : "no"} onChange={e => handleChange('pits', 'fixed25s', e.target.value === "yes")} className="w-full bg-gray-950 border border-gray-800 rounded p-1.5 text-white"><option value="yes">Sim</option><option value="no">Não</option></select></div>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><label className="block text-gray-400 mb-1">Clima</label><select value={etapa.weather} onChange={e => handleChange('weather', null, e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded p-1.5 text-white"><option value="Seco">Seco</option><option value="Chuva">Chuva</option><option value="Dinâmico">Dinâmico</option></select></div>
          <div><label className="block text-gray-400 mb-1">Prog. de Tempo</label><select value={etapa.timeProgression} onChange={e => handleChange('timeProgression', null, e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded p-1.5 text-white"><option value="1x">1x</option><option value="2x">2x</option><option value="3x">3x</option><option value="4x">4x</option><option value="10x">10x</option></select></div>
          <div><label className="block text-gray-400 mb-1">Temp. (°C)</label><input type="number" value={etapa.tempC} onChange={e => handleChange('tempC', null, e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded p-1.5 text-white" /></div>
        </div>
      </div>
    );
  };

  if (!currentUser || currentUser.email !== "mauro12moura@gmail.com") return <div className="text-center py-20 text-red-400 font-bold">Acesso Restrito.</div>;

  return (
    <div className="space-y-6">
      <div className="border-l-4 border-orange-500 pl-3"><h2 className="text-2xl font-bold text-white">Painel Administrativo</h2></div>

      <div className="flex flex-wrap gap-2 border-b border-gray-800 pb-4 text-xs">
        <button onClick={() => setAdminTab('campeonatos')} className={`px-4 py-2 rounded-lg font-bold transition ${adminTab === 'campeonatos' ? 'bg-orange-600 text-white' : 'bg-gray-900 text-gray-400 hover:bg-gray-800'}`}>Criar Campeonato</button>
        <button onClick={() => setAdminTab('4fun')} className={`px-4 py-2 rounded-lg font-bold transition ${adminTab === '4fun' ? 'bg-orange-600 text-white' : 'bg-gray-900 text-gray-400 hover:bg-gray-800'}`}>Criar 4Fun</button>
        <button onClick={() => setAdminTab('gerir')} className={`px-4 py-2 rounded-lg font-bold transition ${adminTab === 'gerir' ? 'bg-red-900 text-white' : 'bg-gray-900 text-gray-400 hover:bg-gray-800'}`}>Gerir Eventos & Inscrições</button>
      </div>

      {adminTab === 'campeonatos' && (
        <form onSubmit={handleCreateChampionship} className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-xl space-y-6 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2"><label className="block text-gray-400 mb-1">Nome do Campeonato</label><input type="text" value={champTitle} onChange={e => setChampTitle(e.target.value)} required className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white" /></div>
            <div><label className="block text-gray-400 mb-1">Tipo de Evento</label><select value={eventType} onChange={e => setEventType(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white"><option value="principal">Principal (Rating 100%)</option><option value="paralelo">Paralelo (Rating 70%)</option></select></div>
            <div className="flex flex-col justify-end"><label className="flex items-center space-x-2 text-gray-300 cursor-pointer h-10"><input type="checkbox" checked={bopAtivo} onChange={e => setBopAtivo(e.target.checked)} className="accent-orange-500 w-4 h-4" /><span className="font-bold">BOP VRT ATIVO</span></label></div>
          </div>
          <div><label className="block text-gray-400 mb-1">Nº de Etapas</label><input type="number" min="1" max="20" value={numEtapas} onChange={e => setNumEtapas(Number(e.target.value))} className="w-32 bg-gray-950 border border-gray-800 rounded p-2 text-white font-bold text-lg text-center" /></div>
          {etapas.map((etapa, idx) => renderEtapaConfig(etapa, idx, false))}
          <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl cursor-pointer w-full text-sm">Lançar Campeonato Oficial</button>
        </form>
      )}

      {adminTab === '4fun' && (
        <form onSubmit={handleCreate4Fun} className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-xl space-y-6 text-xs">
          <div><label className="block text-gray-400 mb-1">Nome do Evento 4Fun</label><input type="text" value={funTitle} onChange={e => setFunTitle(e.target.value)} required className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white" placeholder="Ex: 4Fun Monza Madness" /></div>
          {renderEtapaConfig(funEtapa, 0, true)}
          <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl cursor-pointer w-full text-sm">Lançar Evento 4Fun</button>
        </form>
      )}

      {adminTab === 'gerir' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-xl space-y-6 text-xs">
          <div className="space-y-3">
            <h4 className="font-bold text-emerald-400 border-b border-gray-800 pb-1">Gestão de Campeonatos</h4>
            {championshipsList.map(c => (
              <div key={c.id} className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-950 p-3 rounded border border-gray-800 gap-3">
                <div>
                  <div className="text-white font-bold text-sm">{c.title}</div>
                  <div className={`text-[10px] font-black mt-1 ${c.status === "Inscrições Abertas" ? "text-emerald-400" : "text-red-400"}`}>STATUS: {c.status.toUpperCase()}</div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <button onClick={() => handleToggleStatus("championships", c.id, c.status)} className="flex-1 md:flex-none bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded font-bold transition">
                    {c.status === "Inscrições Abertas" ? "Encerrar Inscrições" : "Reabrir Inscrições"}
                  </button>
                  <button onClick={() => handleDeleteDoc("championships", c.id, c.title)} className="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded font-bold transition">Apagar</button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3 pt-6">
            <h4 className="font-bold text-orange-400 border-b border-gray-800 pb-1">Gestão de Eventos 4Fun</h4>
            {events4FunList.map(c => (
              <div key={c.id} className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-950 p-3 rounded border border-gray-800 gap-3">
                <div>
                  <div className="text-white font-bold text-sm">{c.title}</div>
                  <div className={`text-[10px] font-black mt-1 ${c.status === "Inscrições Abertas" ? "text-emerald-400" : "text-red-400"}`}>STATUS: {c.status?.toUpperCase() || 'INSCRIÇÕES ABERTAS'}</div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <button onClick={() => handleToggleStatus("events4fun", c.id, c.status || "Inscrições Abertas")} className="flex-1 md:flex-none bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded font-bold transition">
                    {c.status === "Inscrições Encerradas" ? "Reabrir Inscrições" : "Encerrar Inscrições"}
                  </button>
                  <button onClick={() => handleDeleteDoc("events4fun", c.id, c.title)} className="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded font-bold transition">Apagar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}