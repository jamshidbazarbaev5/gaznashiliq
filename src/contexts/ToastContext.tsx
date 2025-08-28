import React, {createContext, useContext, useState, ReactNode} from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastData {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType, duration?: number) => void;
  hideToast: () => void;
  currentToast: ToastData | null;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({children}) => {
  const [currentToast, setCurrentToast] = useState<ToastData | null>(null);

  const showToast = (
    message: string,
    type: ToastType,
    duration: number = 3000,
  ) => {
    const id = Date.now().toString();
    setCurrentToast({
      id,
      message,
      type,
      duration,
    });
  };

  const hideToast = () => {
    setCurrentToast(null);
  };

  return (
    <ToastContext.Provider
      value={{
        showToast,
        hideToast,
        currentToast,
      }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
