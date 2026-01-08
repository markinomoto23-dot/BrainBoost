import React, { useState, useEffect } from 'react';
import { View, GameSession, UserStats, AIFeedback, UserProfile } from './types';
import { MemoryGame } from './components/MemoryGame';
import { SpeedGame } from './components/SpeedGame';
import { Activity, Brain, Home, User, Zap, Trophy, Lightbulb, GraduationCap, ArrowRight, LogOut } from 'lucide-react';
import { getPersonalizedCoaching, generateDailyFact } from './services/geminiService';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function App() {
  const [currentView, setCurrentView] = useState<View>(View.AUTH);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({
    totalScore: 0,
    streakDays: 0,
    gamesPlayed: 0,
    history: []
  });
  const [lastFeedback, setLastFeedback] = useState<AIFeedback | null>(null);
  const [dailyFact, setDailyFact] = useState<string>("Loading daily brain fact...");
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  useEffect(() => {
    generateDailyFact().then(setDailyFact);
  }, []);

  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('username') as string;
    const grade = formData.get('grade') as string;
    
    if (name) {
      setUser({
        name,
        grade,
        joinedDate: new Date().toLocaleDateString()
      });
      // Reset stats for new user
      setUserStats({
        totalScore: 0,
        streakDays: 1,
        gamesPlayed: 0,
        history: []
      });
      setCurrentView(View.HOME);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView(View.AUTH);
    setLastFeedback(null);
  };

  const handleGameComplete = async (session: GameSession) => {
    setLoadingFeedback(true);
    const newHistory = [...userStats.history, session];
    setUserStats(prev => ({
      totalScore: prev.totalScore + session.score,
      gamesPlayed: prev.gamesPlayed + 1,
      streakDays: prev.streakDays, 
      history: newHistory
    }));

    try {
      const feedback = await getPersonalizedCoaching(session, newHistory);
      setLastFeedback(feedback);
    } catch (e) {
      console.error("Failed to get feedback");
    } finally {
      setLoadingFeedback(false);
      setCurrentView(View.DASHBOARD);
    }
  };

  const NavButton = ({ view, icon: Icon, label }: { view: View; icon: React.ElementType; label: string }) => (
    <button
      onClick={() => setCurrentView(view)}
      className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 ${
        currentView === view ? 'text-purple-400 bg-purple-900/20' : 'text-slate-400 hover:text-slate-200'
      }`}
    >
      <Icon size={24} />
      <span className="text-[10px] font-medium uppercase tracking-wide">{label}</span>
    </button>
  );

  const renderAuth = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-8 animate-in fade-in duration-700">
       <div className="text-center space-y-2">
         <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-5 rounded-2xl inline-block mb-4 shadow-lg shadow-purple-500/20">
           <Brain size={56} className="text-white" />
         </div>
         <h1 className="text-4xl font-bold text-white tracking-tight">BrainBoost</h1>
         <p className="text-slate-400 text-lg">Cognitive Training for Students</p>
       </div>
       
       <form onSubmit={handleRegister} className="w-full max-w-sm bg-slate-800/80 backdrop-blur-sm p-8 rounded-3xl border border-slate-700/50 shadow-2xl space-y-6">
         <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-white">Create Account</h2>
            <p className="text-xs text-slate-500 mt-1">Join to track your brain scores</p>
         </div>
         
         <div className="space-y-2">
           <label className="text-sm font-medium text-slate-300 ml-1">Student Name</label>
           <div className="relative group">
              <User className="absolute left-3 top-3 text-slate-500 group-focus-within:text-purple-400 transition" size={18} />
              <input 
                name="username"
                required
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition placeholder:text-slate-600"
                placeholder="Enter your name"
              />
           </div>
         </div>
  
         <div className="space-y-2">
           <label className="text-sm font-medium text-slate-300 ml-1">Grade Level</label>
           <div className="relative group">
              <GraduationCap className="absolute left-3 top-3 text-slate-500 group-focus-within:text-purple-400 transition" size={18} />
              <select 
                name="grade"
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition appearance-none cursor-pointer"
              >
                 <option value="Junior High">Junior High (7-9)</option>
                 <option value="Senior High">Senior High (10-12)</option>
                 <option value="College">College / University</option>
              </select>
           </div>
         </div>
  
         <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-purple-900/20 mt-4 flex items-center justify-center gap-2 transform active:scale-[0.98]">
           Start Training <ArrowRight size={18} />
         </button>
       </form>
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case View.AUTH:
        return renderAuth();

      case View.HOME:
        return (
          <div className="space-y-8 pb-20 animate-in slide-in-from-bottom-4 duration-500">
            {/* Header / Daily Insight */}
            <header className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-3xl p-6 shadow-xl border border-white/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Brain size={140} />
              </div>
              <div className="relative z-10">
                <h1 className="text-3xl font-bold text-white mb-1">
                    Hello, {user?.name.split(' ')[0]}
                </h1>
                <p className="text-purple-200 text-sm mb-6 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                    Ready for your daily workout?
                </p>
                
                <div className="bg-black/20 backdrop-blur-md p-4 rounded-xl border border-white/5">
                    <div className="flex gap-2 items-center mb-2">
                    <Lightbulb className="text-yellow-400 shrink-0" size={16} />
                    <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">Daily Fact</span>
                    </div>
                    <p className="text-sm text-slate-100 italic leading-relaxed">"{dailyFact}"</p>
                </div>
              </div>
            </header>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700/50 flex flex-col items-center justify-center shadow-lg">
                 <Trophy className="text-yellow-500 mb-2" size={28} />
                 <span className="text-2xl font-bold text-white">{userStats.totalScore}</span>
                 <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total Score</span>
              </div>
              <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700/50 flex flex-col items-center justify-center shadow-lg">
                 <Activity className="text-green-500 mb-2" size={28} />
                 <span className="text-2xl font-bold text-white">{userStats.gamesPlayed}</span>
                 <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Sessions</span>
              </div>
            </div>

            {/* Game Selection */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className="text-purple-400" size={20}/> Training Modules
              </h2>
              <div className="grid gap-4">
                <button
                  onClick={() => setCurrentView(View.GAME_MEMORY)}
                  className="group bg-slate-800 hover:bg-slate-750 active:bg-slate-700 transition p-4 rounded-2xl border border-slate-700 flex items-center gap-5 text-left shadow-lg hover:shadow-purple-900/10 hover:border-purple-500/30"
                >
                  <div className="p-4 rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition duration-300">
                    <Brain size={28} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">Memory Matrix</h3>
                    <p className="text-sm text-slate-400 group-hover:text-slate-300 transition">Train Visuospatial Working Memory</p>
                  </div>
                </button>

                <button
                  onClick={() => setCurrentView(View.GAME_SPEED)}
                  className="group bg-slate-800 hover:bg-slate-750 active:bg-slate-700 transition p-4 rounded-2xl border border-slate-700 flex items-center gap-5 text-left shadow-lg hover:shadow-yellow-900/10 hover:border-yellow-500/30"
                >
                  <div className="p-4 rounded-xl bg-yellow-500/10 text-yellow-400 group-hover:bg-yellow-500 group-hover:text-slate-900 transition duration-300">
                    <Zap size={28} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">Speed Match</h3>
                    <p className="text-sm text-slate-400 group-hover:text-slate-300 transition">Improve Processing Speed</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        );

      case View.GAME_MEMORY:
        return <MemoryGame onComplete={handleGameComplete} onExit={() => setCurrentView(View.HOME)} />;
      
      case View.GAME_SPEED:
        return <SpeedGame onComplete={handleGameComplete} onExit={() => setCurrentView(View.HOME)} />;

      case View.DASHBOARD:
        return (
          <div className="space-y-6 pb-20 animate-in slide-in-from-right duration-500">
            <h2 className="text-2xl font-bold text-white mb-6">Performance Analysis</h2>
            
            {loadingFeedback ? (
               <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 text-center animate-pulse">
                  <Brain className="mx-auto text-purple-500 mb-4 animate-bounce" size={40} />
                  <p className="text-slate-300">Analyzing cognitive performance with Gemini AI...</p>
               </div>
            ) : lastFeedback ? (
              <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 p-6 rounded-2xl border border-purple-500/30 shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="text-purple-400" size={20} />
                  <h3 className="font-bold text-purple-100 uppercase tracking-wide text-sm">AI Coach Insight</h3>
                </div>
                <div className="space-y-4">
                  <p className="text-lg text-white font-medium leading-snug">"{lastFeedback.summary}"</p>
                  <div className="grid gap-3">
                    <div className="bg-slate-900/60 p-3 rounded-xl border-l-4 border-green-500">
                      <p className="text-[10px] text-slate-400 uppercase mb-1 font-bold">Strength</p>
                      <p className="text-sm text-slate-200">{lastFeedback.strength}</p>
                    </div>
                    <div className="bg-slate-900/60 p-3 rounded-xl border-l-4 border-yellow-500">
                      <p className="text-[10px] text-slate-400 uppercase mb-1 font-bold">Focus Area</p>
                      <p className="text-sm text-slate-200">{lastFeedback.areaForImprovement}</p>
                    </div>
                    <div className="bg-slate-900/60 p-3 rounded-xl border-l-4 border-blue-500">
                      <p className="text-[10px] text-slate-400 uppercase mb-1 font-bold">Pro Tip</p>
                      <p className="text-sm text-slate-200">{lastFeedback.tip}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
                <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 text-center">
                    <Brain className="mx-auto text-slate-600 mb-3" size={32} />
                    <p className="text-slate-400">Complete a game to receive AI coaching insights.</p>
                </div>
            )}

            <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 h-64 shadow-lg">
              <h3 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">Score History</h3>
              {userStats.history.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={userStats.history.slice(-10)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="gameType" stroke="#94a3b8" tick={{fontSize: 10}} interval={0} axisLine={false} tickLine={false} />
                    <YAxis stroke="#94a3b8" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9', borderRadius: '8px' }}
                        itemStyle={{ color: '#c084fc' }}
                        cursor={{stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2}}
                    />
                    <Line type="monotone" dataKey="score" stroke="#c084fc" strokeWidth={3} dot={{ fill: '#c084fc', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, fill: '#fff' }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm">No data yet</div>
              )}
            </div>
          </div>
        );

      case View.PROFILE:
        return (
          <div className="space-y-6 pb-20 animate-in slide-in-from-right duration-500">
             <div className="text-center py-8">
                <div className="w-24 h-24 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-white shadow-xl border-4 border-slate-800">
                   {user?.name.charAt(0)}
                </div>
                <h2 className="text-2xl font-bold text-white">{user?.name}</h2>
                <p className="text-purple-400">{user?.grade}</p>
                <p className="text-xs text-slate-500 mt-1">Joined {user?.joinedDate}</p>
             </div>

             <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                   <span className="text-slate-300">Total Score</span>
                   <span className="text-white font-mono font-bold">{userStats.totalScore}</span>
                </div>
                <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                   <span className="text-slate-300">Games Played</span>
                   <span className="text-white font-mono font-bold">{userStats.gamesPlayed}</span>
                </div>
                <div className="p-4 flex justify-between items-center">
                   <span className="text-slate-300">Current Streak</span>
                   <span className="text-white font-mono font-bold">{userStats.streakDays} Days</span>
                </div>
             </div>

             <button 
               onClick={handleLogout}
               className="w-full bg-slate-800 hover:bg-red-900/30 text-red-400 hover:text-red-300 font-medium py-3 rounded-xl transition border border-slate-700 hover:border-red-900/50 flex items-center justify-center gap-2"
             >
               <LogOut size={18} /> Sign Out
             </button>
          </div>
        );
      
      default:
        return <div>View not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-purple-500/30">
      <main className="max-w-md mx-auto min-h-screen relative flex flex-col">
        <div className="flex-1 p-6">
            {renderContent()}
        </div>

        {/* Bottom Navigation - Only show if user is logged in and not in game */}
        {user && currentView !== View.GAME_MEMORY && currentView !== View.GAME_SPEED && (
          <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-lg border-t border-white/5 z-50">
            <div className="max-w-md mx-auto flex justify-around p-2">
              <NavButton view={View.HOME} icon={Home} label="Home" />
              <NavButton view={View.DASHBOARD} icon={Activity} label="Stats" />
              <NavButton view={View.PROFILE} icon={User} label="Profile" />
            </div>
          </nav>
        )}
      </main>
    </div>
  );
}