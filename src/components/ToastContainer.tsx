import React from 'react';
import Toast from './Toast';
import {useToast} from '../contexts/ToastContext';

const ToastContainer: React.FC = () => {
  const {currentToast, hideToast} = useToast();

  if (!currentToast) {
    return null;
  }

  return (
    <Toast
      message={currentToast.message}
      type={currentToast.type}
      visible={true}
      duration={currentToast.duration}
      onHide={hideToast}
    />
  );
};

export default ToastContainer;
