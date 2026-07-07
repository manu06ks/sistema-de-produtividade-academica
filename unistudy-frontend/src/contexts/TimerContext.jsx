// src/contexts/TimerContext.jsx
import { createContext, useState, useEffect } from 'react';

export const TimerContext = createContext();

export function TimerProvider({ children }) {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timerMode, setTimerMode] = useState('foco');
  const [tarefaSelecionadaTimer, setTarefaSelecionadaTimer] = useState('');

  // O useEffect do relógio agora roda globalmente aqui
  useEffect(() => {
    let interval = null;
    if (isTimerActive) {
      interval = setInterval(() => {
        if (timerMode === 'foco') setTimeElapsed((t) => t + 1);
        else if (timerMode === 'pausa') setTimeLeft((t) => {
          if (t <= 1) { 
            setIsTimerActive(false); 
            alert("Pausa concluída! De volta ao foco."); 
            setTimerMode('foco'); 
            return 0; 
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timerMode]);

  return (
    <TimerContext.Provider value={{
      timeElapsed, setTimeElapsed,
      timeLeft, setTimeLeft,
      isTimerActive, setIsTimerActive,
      timerMode, setTimerMode,
      tarefaSelecionadaTimer, setTarefaSelecionadaTimer
    }}>
      {children}
    </TimerContext.Provider>
  );
}