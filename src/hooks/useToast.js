import { useState } from 'react';

/**
 * useToast – hook para exibir mensagens temporárias (toast) na UI.
 * Retorna a mensagem atual (string | null) e a função showToast(msg, duration).
 * O componente pai é responsável por renderizar o toast usando a string retornada.
 */
export function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = (message, duration = 3000) => {
    setToast(message);
    setTimeout(() => setToast(null), duration);
  };

  return { toast, showToast };
}

export default useToast;
