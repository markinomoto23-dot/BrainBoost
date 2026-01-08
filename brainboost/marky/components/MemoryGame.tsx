import React, { useState, useEffect, useCallback } from 'react';
import { GameSession } from '../types';
import { Brain, Play, XCircle, Gauge } from 'lucide-react';

interface Props {
  onComplete: (session: GameSession) => void;
  onExit: () => void;
}

const INITIAL_SEQUENCE_LENGTH = 3;

export const MemoryGame: React.FC<Props> = ({ onComplete, onExit }) => {
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [level, setLevel] = useState(1);
  const [gameState, setGameState] = useState<'IDLE' | 'SHOWING' | 'PLAYING' | 'GAME_OVER'>('IDLE');
  const [score, setScore] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [totalClicks, setTotalClicks] = useState(0);
  const [correctClicks, setCorrectClicks] = useState(0);
  
  // Adaptive Difficulty State
  const [gridSize, setGridSize] = useState(3);
  const [flashSpeed, setFlashSpeed] = useState(600);
  const [difficultyLabel, setDifficultyLabel] = useState('Normal');

  const generateSequence = useCallback((length: number, size: number) => {
    const newSeq = [];
    for (let i = 0; i < length; i++) {
      newSeq.push(Math.floor(Math.random() * (size * size)));
    }
    return newSeq;
  }, []);

  const startGame = () => {
    setScore(0);
    setLevel(1);
    setTotalClicks(0);
    setCorrectClicks(0);
    setAccuracy(100);
    startLevel(1);
  };

  const startLevel = (lvl: number) => {
    // Adaptive Logic: Adjust grid size and speed based on performance (level)
    let newGridSize = 3;
    let newFlashSpeed = 600;
    let label = 'Normal';

    if (lvl > 3) {
      newGridSize = 4;
      label = 'Intermediate';
    }
    if (lvl > 6) {
      newGridSize = 5;
      label = 'Advanced';
    }

    // Speed up as we go
    if (lvl > 2) newFlashSpeed = 500;
    if (lvl > 5) newFlashSpeed = 400;
    if (lvl > 8) newFlashSpeed = 300;

    setGridSize(newGridSize);
    setFlashSpeed(newFlashSpeed);
    setDifficultyLabel(label);

    const length = INITIAL_SEQUENCE_LENGTH + Math.floor((lvl - 1) / 2);
    const newSeq = generateSequence(length, newGridSize);
    setSequence(newSeq);
    setUserSequence([]);
    setGameState('SHOWING');
  };

  // Use a separate state for the currently lit cell during SHOWING phase
  const [activeCell, setActiveCell] = useState<number | null>(null);

  useEffect(() => {
    if (gameState === 'SHOWING') {
      let i = 0;
      setActiveCell(null);
      
      const showNext = () => {
        if (i < sequence.length) {
          setActiveCell(sequence[i]);
          setTimeout(() => {
            setActiveCell(null);
            i++;
            setTimeout(showNext, 200); // Constant pause between flashes
          }, flashSpeed); // Dynamic flash duration
        } else {
          setGameState('PLAYING');
        }
      };
      
      // Small delay before starting
      const startTimeout = setTimeout(showNext, 500);
      return () => clearTimeout(startTimeout);
    }
  }, [gameState, sequence, flashSpeed]);

  const handleCellClick = (index: number) => {
    if (gameState !== 'PLAYING') return;

    const newTotalClicks = totalClicks + 1;
    setTotalClicks(newTotalClicks);

    const expectedIndex = sequence[userSequence.length];

    if (index === expectedIndex) {
      // Correct
      const newCorrect = correctClicks + 1;
      setCorrectClicks(newCorrect);
      setAccuracy(Math.round((newCorrect / newTotalClicks) * 100));

      const newUserSeq = [...userSequence, index];
      setUserSequence(newUserSeq);
      
      // Check if level complete
      if (newUserSeq.length === sequence.length) {
        setScore(prev => prev + (level * 100));
        setLevel(prev => prev + 1);
        setTimeout(() => startLevel(level + 1), 500);
      }
    } else {
      // Wrong
      setAccuracy(Math.round((correctClicks / newTotalClicks) * 100));
      setGameState('GAME_OVER');
    }
  };

  const finishGame = () => {
    onComplete({
      id: Date.now().toString(),
      gameType: 'Memory Matrix',
      score,
      date: new Date().toISOString(),
      accuracy: accuracy,
      levelReached: level
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] w-full max-w-md mx-auto p-4">
      <div className="w-full flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain className="text-purple-400" /> Memory Matrix
          </h2>
          <div className="flex items-center gap-2 mt-1">
             <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-900/50 text-purple-300 border border-purple-700/50">
                {difficultyLabel} ({gridSize}x{gridSize})
             </span>
             {flashSpeed < 500 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-yellow-900/50 text-yellow-300 border border-yellow-700/50 flex items-center gap-1">
                   <Gauge size={10} /> Fast
                </span>
             )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Score</p>
          <p className="text-xl font-mono font-bold text-purple-400">{score}</p>
        </div>
      </div>

      {gameState === 'IDLE' && (
        <div className="text-center space-y-6 bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700">
          <p className="text-slate-300">
            A sequence of tiles will light up. Memorize the order and repeat it back.
          </p>
          <div className="bg-slate-900/50 p-4 rounded-xl text-sm text-slate-400 border border-slate-700">
             <p className="font-semibold text-purple-400 mb-1">Adaptive Difficulty</p>
             The grid grows larger (up to 5x5) and faster as you progress levels.
          </div>
          <button
            onClick={startGame}
            className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-full transition flex items-center gap-2 mx-auto"
          >
            <Play size={20} /> Start Training
          </button>
        </div>
      )}

      {gameState === 'GAME_OVER' && (
        <div className="text-center space-y-6 bg-slate-800 p-8 rounded-2xl shadow-xl border border-red-900/50">
          <XCircle className="w-16 h-16 text-red-500 mx-auto" />
          <h3 className="text-xl font-bold text-white">Session Complete</h3>
          <div className="grid grid-cols-2 gap-4 text-left">
             <div>
               <p className="text-xs text-slate-400">Final Score</p>
               <p className="text-lg font-bold">{score}</p>
             </div>
             <div>
               <p className="text-xs text-slate-400">Level Reached</p>
               <p className="text-lg font-bold">{level}</p>
             </div>
          </div>
          <button
            onClick={finishGame}
            className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition"
          >
            View Analysis
          </button>
        </div>
      )}

      {(gameState === 'SHOWING' || gameState === 'PLAYING') && (
        <div className="space-y-4 w-full">
           <div className="flex justify-between text-xs font-mono text-slate-400 uppercase tracking-widest w-full">
              <span>Lvl {level}</span>
              <span>{gameState === 'SHOWING' ? 'Watch...' : 'Recall!'}</span>
           </div>
          <div 
            className="grid gap-2 bg-slate-800 p-4 rounded-xl shadow-inner border border-slate-700 mx-auto transition-all duration-300"
            style={{ 
                gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                maxWidth: gridSize === 5 ? '400px' : '320px' 
            }}
          >
            {Array.from({ length: gridSize * gridSize }).map((_, i) => (
              <button
                key={i}
                disabled={gameState !== 'PLAYING'}
                onClick={() => handleCellClick(i)}
                className={`
                  aspect-square rounded-md transition-all duration-150 transform
                  ${activeCell === i ? 'bg-purple-400 shadow-[0_0_15px_rgba(192,132,252,0.7)] scale-95' : 'bg-slate-700'}
                  ${gameState === 'PLAYING' ? 'hover:bg-slate-600 active:scale-90' : ''}
                `}
              />
            ))}
          </div>
        </div>
      )}
      
      {gameState !== 'IDLE' && gameState !== 'GAME_OVER' && (
        <button onClick={finishGame} className="mt-8 text-xs text-slate-500 hover:text-white underline">
          End Session Early
        </button>
      )}
    </div>
  );
};