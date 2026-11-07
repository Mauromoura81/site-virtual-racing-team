import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs } from "firebase/firestore";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

export default function Protestos({ db, currentUser, currentUserProfile }) {
  const [championships, setChampionships] = useState([]);
  const [selectedChamp, setSelectedChamp] = useState(null);
  
  const [rounds, setRounds] = useState([]);
  const [selectedRound, setSelectedRound] = useState('');
  
  const [enrolledDrivers, setEnrolledDrivers] = useState([]);
  const [accusedDriver, setAccusedDriver] = useState('');
  
  const [lap, setLap] = useState('');
  const [description, setDescription] = useState('');
  
  const [videoFile, setVideoFile] = useState(null);
  const [videoLink, setVideoLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const storage = getStorage(); // Inicializa o Firebase Storage para o upload de vídeos

  useEffect(() => {
    const loadChampionships = async () => {
      try {
        const snap = await getDocs(collection(db, "championships"));
        const champs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setChampionships(champs);
      } catch (err) { console.error(err); }
    };
    loadChampionships();
  }, [db]);

  // Quando o piloto escolhe um Campeonato, carregamos as Etapas e os Pilotos Inscritos nele
  const handleChampChange = async (champId) => {
    const champ = championships.find(c => c.id === champId);
    setSelectedChamp(champ || null);
    setSelectedRound('');
    setAccusedDriver('');
    
    if (champ) {
      setRounds(champ.rounds || []);
      try {
        const inscSnap = await getDocs(collection(db, "championships", champId, "inscriptions"));
        const inscritos = inscSnap.docs.map(d => d.data());
        // Remove o próprio autor da lista de acusados
        setEnrolledDrivers(inscritos.filter(d => d.userId !== currentUser?.uid));
      } catch (err) { console.error(err); }
    } else {
      setRounds([]);
      setEnrolledDrivers([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return alert("Faça login para enviar um protesto.");
    if (!selectedChamp || !selectedRound || !accusedDriver) return alert("Preencha Campeonato, Etapa e Acusado.");
    if (!videoFile && !videoLink) return alert("Forneça o arquivo de vídeo do lance ou o link.");

    setIsSubmitting(true);
    let finalVideoUrl = videoLink;

    try {
      // Se houver ficheiro (ex: vídeo do WhatsApp), faz o upload para o Firebase Storage
      if (videoFile) {
        const fileRef = storageRef(storage, `protests/${Date.now()}_${videoFile.name}`);
        await uploadBytes(fileRef, videoFile);
        finalVideoUrl = await getDownloadURL(fileRef);
      }

      await addDoc(collection(db, "protests"), {
        championshipId: selectedChamp.id,
        championshipTitle: selectedChamp.title,
        round: selectedRound,
        authorId: currentUser.uid,
        authorName: currentUserProfile?.fullName || currentUser.email,
        accused: accusedDriver,
        lap: lap,
        description: description,
        videoUrl: finalVideoUrl,
        status: "Aberto",
        penalty: "",
        createdAt: new Date().toISOString()
      });

      alert("Protesto enviado com sucesso para a Comissão de Prova.");
      // Limpar formulário
      setSelectedChamp(null); setRounds([]); setEnrolledDrivers([]);
      setSelectedRound(''); setAccusedDriver(''); setLap(''); setDescription(''); setVideoFile(null); setVideoLink('');
    } catch (err) {
      console.error(err);
      alert("Erro ao enviar. Se o upload de vídeo falhou, verifique as regras do Firebase Storage ou use a opção de Link.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-l-4 border-red-500 pl-3">
        <h2 className="text-2xl font-bold text-white">Secretaria de Prova (Protestos)</h2>
        <p className="text-xs text-gray-400 mt-1">Submeta lances para análise. Selecione o campeonato, a etapa e o piloto envolvido.</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-xl space-y-6 text-xs">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-400 mb-1">Campeonato</label>
              <select value={selectedChamp?.id || ''} onChange={e => handleChampChange(e.target.value)} required className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-white">
                <option value="">Selecione o Campeonato...</option>
                {championships.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-gray-400 mb-1">Etapa (Prova)</label>
              <select value={selectedRound} onChange={e => setSelectedRound(e.target.value)} required disabled={!selectedChamp} className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-white disabled:opacity-50">
                <option value="">Selecione a Etapa...</option>
                {rounds.map((r, i) => <option key={i} value={`Etapa ${i+1}: ${r.track}`}>Etapa {i+1}: {r.track}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-red-400 font-bold mb-1">Piloto Acusado</label>
              <select value={accusedDriver} onChange={e => setAccusedDriver(e.target.value)} required disabled={!selectedChamp} className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-white disabled:opacity-50">
                <option value="">Selecione na lista de inscritos...</option>
                {enrolledDrivers.map((d, i) => <option key={i} value={d.fullName}>{d.fullName} (#{d.number})</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-950 p-4 rounded-xl border border-gray-800">
            <div>
              <label className="block text-gray-400 mb-1 font-bold">Enviar Vídeo (Telemóvel/PC)</label>
              <input type="file" accept="video/*" onChange={e => setVideoFile(e.target.files[0])} className="w-full bg-gray-900 border border-gray-800 rounded p-2 text-white text-[11px] file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-orange-600 file:text-white hover:file:bg-orange-500 cursor-pointer" />
              <p className="text-[10px] text-gray-500 mt-1">Formatos aceites: MP4, MOV, gravados do WhatsApp, etc.</p>
            </div>
            
            <div>
              <label className="block text-gray-400 mb-1">Ou insira o Link do Vídeo (YouTube, Drive)</label>
              <input type="url" value={videoLink} onChange={e => setVideoLink(e.target.value)} placeholder="https://..." className="w-full bg-gray-900 border border-gray-800 rounded p-2.5 text-white" />
              <p className="text-[10px] text-gray-500 mt-1">Use esta opção caso o vídeo seja muito pesado ou já esteja online.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <label className="block text-gray-400 mb-1">Volta / Minuto</label>
              <input type="text" value={lap} onChange={e => setLap(e.target.value)} required placeholder="Ex: Volta 4 ou 12:35" className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-white" />
            </div>
            <div className="md:col-span-3">
              <label className="block text-gray-400 mb-1">Descrição e Justificação do Lance</label>
              <textarea rows="3" value={description} onChange={e => setDescription(e.target.value)} required placeholder="Descreva o que aconteceu..." className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-white"></textarea>
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className={`w-full font-bold px-6 py-3 rounded-xl transition text-sm ${isSubmitting ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 text-white cursor-pointer'}`}>
            {isSubmitting ? 'A enviar ficheiros, aguarde...' : 'Submeter Protesto Oficial'}
          </button>
        </form>
      </div>
    </div>
  );
}