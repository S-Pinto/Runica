import { useState, useEffect } from 'react';

/**
 * Custom hook per rilevare se il dispositivo di input primario è touch.
 * Utilizza la media query `(pointer: coarse)`, che è l'approccio moderno e affidabile
 * per distinguere i touchscreen (coarse) dai mouse/trackpad (fine).
 * @returns {boolean} True se il dispositivo è touch, altrimenti false.
 */
export const useIsTouchDevice = (): boolean => {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    // Questa media query è il modo più corretto per rilevare un dispositivo touch.
    // È più affidabile del controllo della larghezza dello schermo (lo userAgent sniffing è sconsigliato).
    const mediaQuery = window.matchMedia('(pointer: coarse)');

    const updateTouch = () => {
      setIsTouch(mediaQuery.matches);
    };

    updateTouch(); // Imposta lo stato iniziale

    // Aggiunge un listener per i cambiamenti (es. se si collega/scollega un mouse)
    mediaQuery.addEventListener('change', updateTouch);

    return () => mediaQuery.removeEventListener('change', updateTouch);
  }, []);

  return isTouch;
};