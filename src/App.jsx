import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';

// Importação dos Componentes
import Mural from './components/Mural';
import Campeonatos from './components/Campeonatos';
import Classificacao from './components/Classificacao';
import Ratings from './components/Ratings';
import Corridas from './components/Corridas';
import Protestos from './components/Protestos';
import Admin from './components/Admin';
import PilotModal from './components/PilotModal';

const ACC_CARS_LIST = [
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

// ATENÇÃO: Insira aqui a sua chave real da API do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCNju-z3AvURu8M6YSO3ukNtFBYYs0t2-w",
  authDomain: "site-virtual-racing-team.firebaseapp.com",
  projectId: "site-virtual-racing-team",
  storageBucket: "site-virtual-racing-team.firebasestorage.app",
  messagingSenderId: "647741498721",
  appId: "1:647741498721:web:09b636402b20aaa2fbd120"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);

export default function App() {
  const [currentTab, setCurrentTab] = useState('home');
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [selectedPilot, setSelectedPilot] = useState(null);
  
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [editFullName, setEditFullName] = useState('');
  const [editPsnId, setEditPsnId] = useState('');
  const [editCar, setEditCar] = useState('Ferrari 296 GT3');
  const [editNumber, setEditNumber] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setShowLoginModal(false);
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            setCurrentUserProfile(userSnap.data());
          } else {
            const defaultProfile = {
              uid: user.uid,
              email: user.email,
              fullName: user.displayName || user.email.split('@')[0],
              psnXboxId: "",
              car: "Ferrari 296 GT3",
              number: "00",
              ratingScore: 1000,
              h2hRecord: "0 / 0",
              percentage: "0"
            };
            await setDoc(userDocRef, defaultProfile);
            setCurrentUserProfile(defaultProfile);
          }
        } catch (err) { console.error("Erro ao carregar perfil:", err); }
      } else {
        setCurrentUser(null);
        setCurrentUserProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try { await signInWithPopup(auth, provider); } 
    catch (err) { alert("Aviso: Verifique se as chaves da API do Firebase estão corretas no App.jsx."); }
  };

  const handleLogout = async () => {
    try { await signOut(auth); } catch (err) { console.error(err); }
  };

  const openEditProfile = () => {
    setEditFullName(currentUserProfile?.fullName || '');
    setEditPsnId(currentUserProfile?.psnXboxId || '');
    setEditCar(currentUserProfile?.car || 'Ferrari 296 GT3');
    setEditNumber(currentUserProfile?.number || '00');
    setShowProfileModal(true);
  };

 const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      const userRef = doc(db, "users", currentUser.uid);
      const updatedData = {
        fullName: editFullName,
        psnXboxId: editPsnId,
        car: editCar,
        number: editNumber
      };
      await setDoc(userRef, updatedData, { merge: true });
      setCurrentUserProfile(prev => ({ ...prev, ...updatedData }));
      
      // 1. Fecha o modal imediatamente
      setShowProfileModal(false);
      
      // 2. Dispara o aviso depois que a janela já fechou
      setTimeout(() => {
        alert("Perfil atualizado com sucesso!");
      }, 100);

    } catch (err) {
      console.error("Erro ao salvar perfil:", err);
      alert("Erro ao atualizar o perfil.");
    }
  };

  const isAdmin = currentUser?.email === "mauro12moura@gmail.com";

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans flex flex-col">
      
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-4">
          
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('home')}>
            <img src="/Logo vrt.jpeg" alt="Liga VRT Logo" className="h-12 w-12 object-cover rounded-full shadow-lg border-2 border-emerald-600/50" />
            <div>
              <h1 className="text-lg font-extrabold text-white tracking-wide">LIGA VRT</h1>
              <p className="text-[10px] text-gray-400">Virtual Sim Racing Platform</p>
            </div>
          </div>

          <nav className="flex flex-wrap gap-1 text-xs font-semibold">
            <button onClick={() => setCurrentTab('home')} className={`px-3 py-2 rounded-lg transition ${currentTab === 'home' ? 'bg-emerald-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`}>Início</button>
            <button onClick={() => setCurrentTab('mural')} className={`px-3 py-2 rounded-lg transition ${currentTab === 'mural' ? 'bg-emerald-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`}>Mural</button>
            <button onClick={() => setCurrentTab('campeonatos')} className={`px-3 py-2 rounded-lg transition ${currentTab === 'campeonatos' ? 'bg-emerald-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`}>Campeonatos</button>
            <button onClick={() => setCurrentTab('classificacao')} className={`px-3 py-2 rounded-lg transition ${currentTab === 'classificacao' ? 'bg-emerald-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`}>Classificação</button>
            <button onClick={() => setCurrentTab('ratings')} className={`px-3 py-2 rounded-lg transition ${currentTab === 'ratings' ? 'bg-emerald-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`}>Ratings</button>
            <button onClick={() => setCurrentTab('corridas')} className={`px-3 py-2 rounded-lg transition ${currentTab === 'corridas' ? 'bg-emerald-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`}>4Funs</button>
            <button onClick={() => setCurrentTab('protestos')} className={`px-3 py-2 rounded-lg transition ${currentTab === 'protestos' ? 'bg-emerald-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`}>Protestos</button>
            
            {isAdmin && (
              <button onClick={() => setCurrentTab('admin')} className={`px-3 py-2 rounded-lg transition font-bold ${currentTab === 'admin' ? 'bg-orange-600 text-white' : 'text-orange-400 hover:bg-gray-800'}`}>🛡️ ADM</button>
            )}
          </nav>

          <div className="flex items-center space-x-3 text-xs">
            {currentUser ? (
              <div className="flex items-center space-x-3 bg-gray-950 px-3 py-1.5 rounded-lg border border-gray-800">
                <div className="text-right flex flex-col justify-center pr-2">
                  <div className="font-bold text-white text-xs">{currentUserProfile?.fullName || currentUser.email}</div>
                  <div className="text-[10px] text-emerald-400 font-extrabold">{currentUserProfile?.ratingScore || 1000} VRT Score</div>
                </div>
                <div className="flex items-center border-l border-gray-800 pl-3 space-x-2">
                  <button onClick={openEditProfile} className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded font-bold cursor-pointer transition shadow">Perfil</button>
                  <button onClick={handleLogout} className="bg-red-950 hover:bg-red-900 text-red-400 px-3 py-1.5 rounded font-bold cursor-pointer transition shadow">Sair</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowLoginModal(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg transition shadow flex items-center gap-2">
                Entrar / Login
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 flex-grow w-full">
        {currentTab === 'home' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-emerald-950 via-gray-900 to-gray-900 border border-emerald-800/40 rounded-2xl p-8 shadow-2xl">
              <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-500/30">Temporada 2026</span>
              <h2 className="text-3xl md:text-4xl font-black text-white mt-4 tracking-tight">A Emoção do Automobilismo Virtual Começa Aqui</h2>
              <p className="text-gray-300 text-xs md:text-sm mt-3 max-w-2xl leading-relaxed">Competições de elite, campeonatos e sistema avançado de Rating VRT em React.</p>
              {!currentUser && (
                <div className="mt-6">
                  <button onClick={() => setShowLoginModal(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition text-xs uppercase tracking-wider">
                    Fazer Login para Participar
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {currentTab === 'mural' && <Mural db={db} currentUser={currentUser} />}
        {currentTab === 'campeonatos' && <Campeonatos db={db} currentUser={currentUser} currentUserProfile={currentUserProfile} />}
        {currentTab === 'classificacao' && <Classificacao db={db} onSelectPilot={setSelectedPilot} />}
        {currentTab === 'ratings' && <Ratings db={db} onSelectPilot={setSelectedPilot} />}
        {currentTab === 'corridas' && <Corridas db={db} currentUser={currentUser} currentUserProfile={currentUserProfile} />}
        {currentTab === 'protestos' && <Protestos db={db} currentUser={currentUser} currentUserProfile={currentUserProfile} />}
        {currentTab === 'admin' && <Admin db={db} currentUser={currentUser} />}
      </main>

      {showLoginModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6 text-center">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-white">Piloto, identifique-se</h3>
              <button onClick={() => setShowLoginModal(false)} className="text-gray-400 hover:text-white font-bold text-xl">✕</button>
            </div>
            <p className="text-xs text-gray-300">Entre com sua conta Google para participar das corridas oficiais, consultar seu Rating e aceder a área de membros.</p>
            <button onClick={handleGoogleLogin} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition shadow-lg text-xs uppercase tracking-wider flex items-center justify-center gap-2">
              Entrar com Conta Google
            </button>
          </div>
        </div>
      )}

      {showProfileModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-white">Meu Perfil de Piloto</h3>
              <button onClick={() => setShowProfileModal(false)} className="text-gray-400 hover:text-white font-bold text-xl">✕</button>
            </div>
            
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">Nome de Exibição (Real ou Apelido)</label>
                <input type="text" value={editFullName} onChange={e => setEditFullName(e.target.value)} required className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-white" />
              </div>
              <div>
                <label className="block text-orange-400 mb-1 font-bold">ID PSN / XBOX (Obrigatório)</label>
                <input type="text" value={editPsnId} onChange={e => setEditPsnId(e.target.value)} required placeholder="Sua Gamertag ou PSN ID..." className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-white" />
                <p className="text-[10px] text-gray-500 mt-1">Este ID será usado para convites no servidor.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 mb-1">Carro Preferido (ACC)</label>
                  <select value={editCar} onChange={e => setEditCar(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-white">
                    {ACC_CARS_LIST.map(car => <option key={car} value={car}>{car}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Número</label>
                  <input type="number" value={editNumber} onChange={e => setEditNumber(e.target.value)} placeholder="Ex: 99" className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2.5 text-white" />
                </div>
              </div>
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition shadow-lg uppercase tracking-wider mt-2 cursor-pointer">
                Salvar Alterações
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedPilot && <PilotModal db={db} pilot={selectedPilot} onClose={() => setSelectedPilot(null)} />}

      <footer className="bg-gray-900 border-t border-gray-800 py-6 text-center text-xs text-gray-500 mt-12">
        <p>Liga VRT © 2026 — Plataforma de Sim Racing Profissional.</p>
      </footer>
    </div>
  );
}