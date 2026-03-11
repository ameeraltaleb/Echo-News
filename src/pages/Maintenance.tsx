import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 text-center border border-zinc-100">
        <div className="inline-flex p-5 bg-amber-50 text-amber-600 rounded-full mb-8 animate-bounce">
          <AlertTriangle className="w-12 h-12" />
        </div>
        <h1 className="text-4xl font-black text-zinc-900 mb-4 tracking-tighter">Under Maintenance</h1>
        <p className="text-zinc-500 text-lg mb-8 leading-relaxed">
          We're currently performing some scheduled maintenance to improve your experience. 
          We'll be back online shortly!
        </p>
        <div className="flex items-center justify-center gap-2 text-zinc-400 font-bold uppercase tracking-widest text-sm">
          <Clock className="w-4 h-4" />
          <span>Estimated time: 30 mins</span>
        </div>
        <div className="mt-10 pt-8 border-t border-zinc-100">
          <div className="flex items-center justify-center gap-2">
            <div className="bg-primary text-white font-bold text-lg px-2 py-1 tracking-wider">ECHO</div>
            <span className="font-bold text-lg tracking-tight">NEWS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
