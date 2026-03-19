import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = true
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
          />
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[61] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${isDanger ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
                    <X className="w-5 h-5 text-zinc-400" />
                  </button>
                </div>
                
                <h3 className="text-xl font-bold text-zinc-900 mb-2">{title}</h3>
                <p className="text-zinc-500 leading-relaxed">{message}</p>
              </div>
              
              <div className="bg-zinc-50 p-6 flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-xl font-bold text-zinc-600 hover:bg-zinc-200 transition-colors"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-white transition-all shadow-lg ${
                    isDanger 
                      ? 'bg-red-600 hover:bg-red-700 shadow-red-900/20' 
                      : 'bg-zinc-900 hover:bg-black shadow-zinc-900/20'
                  }`}
                >
                  {confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
