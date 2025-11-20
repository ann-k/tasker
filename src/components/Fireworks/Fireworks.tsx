import { useEffect, useRef } from 'react';

import { Fireworks as FireworksJS } from 'fireworks-js';

const Fireworks = ({ active, onComplete }: { active: boolean; onComplete?: () => void }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fireworksRef = useRef<FireworksJS | null>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    // Создаем экземпляр fireworks только когда active становится true
    if (!fireworksRef.current) {
      fireworksRef.current = new FireworksJS(containerRef.current, {
        autoresize: true,
        opacity: 0.5,
        acceleration: 1.05,
        friction: 0.97,
        gravity: 1.5,
        particles: 100,
        traceLength: 3,
        traceSpeed: 10,
        explosion: 8,
        intensity: 50,
        flickering: 50,
        lineStyle: 'round',
        hue: { min: 0, max: 360 },
        delay: { min: 15, max: 30 },
        rocketsPoint: { min: 50, max: 50 },
        lineWidth: { explosion: { min: 3, max: 6 }, trace: { min: 2, max: 4 } },
        brightness: { min: 50, max: 80 },
        decay: { min: 0.015, max: 0.03 },
        mouse: { click: false, move: false, max: 1 },
        sound: {
          enabled: true,
          files: ['/assets/sounds/success.wav'],
          volume: { min: 0.3, max: 0.6 },
        },
      });
    }

    // Запускаем анимацию и сразу запускаем несколько фейерверков
    fireworksRef.current.start();
    fireworksRef.current.launch(3);

    // Останавливаем запуск новых фейерверков через 3 секунды, но ждем завершения всех
    const timeout = setTimeout(async () => {
      if (fireworksRef.current) {
        // Используем waitStop для плавного завершения всех фейерверков
        await fireworksRef.current.waitStop();
      }
      if (onComplete) {
        onComplete();
      }
    }, 1000);

    return () => {
      clearTimeout(timeout);
      if (fireworksRef.current) {
        fireworksRef.current.stop();
      }
    };
  }, [active, onComplete]);

  useEffect(() => {
    return () => {
      if (fireworksRef.current) {
        fireworksRef.current.stop();
        fireworksRef.current = null;
      }
    };
  }, []);

  if (!active) return null;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        minWidth: '100%',
        minHeight: '100%',
        zIndex: 1300,
        pointerEvents: 'none',
      }}
    />
  );
};

export default Fireworks;
