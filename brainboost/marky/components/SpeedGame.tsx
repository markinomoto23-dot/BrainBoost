import React, { useState, useEffect } from 'react';
import { GameSession } from '../types';
import { Zap, Play, Check, X, TrendingUp } from 'lucide-react';

interface Props {
  onComplete: (session: GameSession) => void;
  onExit: () => void;
}

const SYMBOLS_EASY = ['★', '●', '▲', '■', '♦', '♠', '♣', '♥'];
const SYMBOLS_HARD = ['←', '→', '↑', '↓', '↖', '↗', '↘', '↙']; // Directional requires more processing
const GAME_DURATION = 30; // 30 seconds

export const SpeedGame: React.FC<Props> = ({ onComplete, onExit }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  
  // Adaptive State
  const [streak, setStreak] = useState(0);
  const [difficulty, setDifficulty] = useState<'Normal' | 'Hard'>('Normal');
  
  const [card1, setCard1] = useState('');
  const [card2, setCard2] = useState('');
  const [isMatch, setIsMatch] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const generateRound = (currentStreak: number) => {
    // Adaptive Logic: If streak > 5, switch to Hard symbols
    const isHard = currentStreak >= 5;
    const pool = isHard ? SYMBOLS_HARD : SYMBOLS_EASY;
    
    // Update difficulty state for UI
    setDifficulty(isHard ? 'Hard' : 'Normal');

    const sym1 = pool[Math.floor(Math.random() * pool.length)];
    // 50% chance of match
    const match = Math.random() > 0.5;
    const sym2 = match ? sym1 : pool[Math.floor(Math.random() * pool.length)];
    
    // Ensure if match is false, they are actually different
    if (!match && sym1 === sym2) {
       const otherSymbols = pool.filter(s => s !== sym1);
       setCard2(otherSymbols[Math.floor(Math.random() * otherSymbols.length)]);
       setIsMatch(false);
    } else {
       setCard2(sym2);
       setIsMatch(sym1 === sym2);
    }
    setCard1(sym1);
  };

  const startGame = () => {
    setScore(0);
    setCorrectCount(0);
    setTotalAttempts(0);
    setStreak(0);
    setDifficulty('Normal');
    setTimeLeft(GAME_DURATION);
    setIsPlaying(true);
    generateRound(0);
  };

  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (isPlaying && timeLeft === 0) {
      endGame();
    }
  }, [isPlaying, timeLeft]);

  const handleAnswer = (userSaysMatch: boolean) => {
    const isCorrect = userSaysMatch === isMatch;
    setTotalAttempts(prev => prev + 1);
    
    let newStreak = streak;

    if (isCorrect) {
      // Score multiplier based on difficulty
      const basePoints = 50;
      const bonus = difficulty === 'Hard' ? 25 : 0;
      
      setScore(prev => prev + basePoints + bonus);
      setCorrectCount(prev => prev + 1);
      setFeedback('correct');
      
      newStreak = streak + 1;
      setStreak(newStreak);
    } else {
      setScore(prev => Math.max(0, prev - 20));
      setFeedback('wrong');
      
      // Reset streak on error - drops difficulty back to Normal
      newStreak = 0;
      setStreak(0);
    }

    setTimeout(() => setFeedback(null), 200);
    generateRound(newStreak);
  };

  const endGame = () => {
    setIsPlaying(false);
    const finalAccuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;
    onComplete({
      id: Date.now().toString(),
      gameType: 'Speed Match',
      score,
      date: new Date().toISOString(),
      accuracy: finalAccuracy,
      levelReached: streak > 5 ? 2 : 1 // Represent Hard mode as level 2
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] w-full max-w-md mx-auto p-4">
      <div className="w-full flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Zap className="text-yellow-400" /> Speed Match
          </h2>
          <div className="flex items-center gap-2 mt-1 h-6">
             {difficulty === 'Hard' && (
               <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-900/50 text-red-300 border border-red-700/50 flex items-center gap-1 animate-in slide-in-from-left duration-300">
                  <TrendingUp size={10} /> High Intensity
               </span>
             )}
          </div>
        </div>
        <div className="flex gap-4">
            <div className="text-right">
                <p className="text-xs text-slate-400">Time</p>
                <p className={`text-xl font-mono font-bold ${timeLeft < 5 ? 'text-red-500' : 'text-white'}`}>{timeLeft}s</p>
            </div>
            <div className="text-right">
                <p className="text-xs text-slate-400">Score</p>
                <p className="text-xl font-mono font-bold text-yellow-400">{score}</p>
            </div>
        </div>
      </div>

      {!isPlaying && timeLeft === GAME_DURATION && (
        <div className="text-center space-y-6 bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700">
          <p className="text-slate-300">
            Compare the two symbols quickly. Do they match?
          </p>
          <div className="bg-slate-900/50 p-4 rounded-xl text-sm text-slate-400 border border-slate-700">
             <p className="font-semibold text-yellow-400 mb-1">Adaptive Difficulty</p>
             Get 5 correct in a row to enter <span className="text-white font-bold">High Intensity</span> mode with complex symbols and bonus points.
          </div>
          <button
            onClick={startGame}
            className="px-8 py-3 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold rounded-full transition flex items-center gap-2 mx-auto"
          >
            <Play size={20} /> Start Sprint
          </button>
        </div>
      )}

      {isPlaying && (
        <div className="w-full space-y-8">
            <div className={`
                flex justify-center items-center gap-8 py-12 rounded-2xl border-2 transition-all duration-200 relative overflow-hidden
                ${feedback === 'correct' ? 'border-green-500 bg-green-900/20' : ''}
                ${feedback === 'wrong' ? 'border-red-500 bg-red-900/20' : ''}
                ${!feedback ? 'border-slate-700 bg-slate-800' : ''}
            `}>
                {/* Streak Progress Bar Background */}
                <div 
                  className="absolute bottom-0 left-0 h-1 bg-yellow-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, (streak / 5) * 100)}%` }}
                />

                <div className="text-6xl text-white font-bold">{card1}</div>
                <div className="w-px h-16 bg-slate-600"></div>
                <div className="text-6xl text-white font-bold">{card2}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() => handleAnswer(false)}
                    className="flex flex-col items-center justify-center p-6 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 rounded-xl transition border-b-4 border-slate-900 active:border-b-0 active:translate-y-1"
                >
                    <X className="w-8 h-8 text-red-400 mb-2" />
                    <span className="font-bold text-white uppercase">No Match</span>
                </button>
                <button
                    onClick={() => handleAnswer(true)}
                    className="flex flex-col items-center justify-center p-6 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 rounded-xl transition border-b-4 border-slate-900 active:border-b-0 active:translate-y-1"
                >
                    <Check className="w-8 h-8 text-green-400 mb-2" />
                    <span className="font-bold text-white uppercase">Match</span>
                </button>
            </div>
            
            <div className="text-center">
                <p className="text-xs text-slate-500 uppercase tracking-widest">
                  Streak: <span className="text-white font-mono text-lg">{streak}</span>
                </p>
            </div>
        </div>
      )}
    </div>
  );
};