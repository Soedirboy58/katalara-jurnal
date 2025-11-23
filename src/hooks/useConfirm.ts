'use client';

import { useState } from 'react';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export function useConfirm() {
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    resolve: ((value: boolean) => void) | null;
  }>({
    isOpen: false,
    options: { title: '', message: '' },
    resolve: null,
  });

  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        options,
        resolve,
      });
    });
  };

  const handleConfirm = () => {
    confirmState.resolve?.(true);
    setConfirmState({ isOpen: false, options: { title: '', message: '' }, resolve: null });
  };

  const handleCancel = () => {
    confirmState.resolve?.(false);
    setConfirmState({ isOpen: false, options: { title: '', message: '' }, resolve: null });
  };

  return {
    confirm,
    confirmState,
    handleConfirm,
    handleCancel,
  };
}
