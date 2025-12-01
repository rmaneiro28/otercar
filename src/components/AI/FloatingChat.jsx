import React, { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import AIChat from './AIChat';

const FloatingChat = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50 flex flex-col items-end gap-4">
            {/* Chat Window */}
            {isOpen && (
                <div className="w-[350px] md:w-[400px] shadow-2xl rounded-2xl overflow-hidden border border-slate-200 animate-in slide-in-from-bottom-10 fade-in duration-200">
                    <AIChat />
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center
                    ${isOpen
                        ? 'bg-slate-800 text-white rotate-90'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
            >
                {isOpen ? (
                    <X className="w-6 h-6" />
                ) : (
                    <MessageSquare className="w-6 h-6" />
                )}
            </button>
        </div>
    );
};

export default FloatingChat;
