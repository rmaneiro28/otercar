import React from 'react';
import { MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

const WhatsAppButton = ({ phone, message, label = "Contactar", compact = false, className = "" }) => {

    const handleClick = (e) => {
        e.stopPropagation();

        if (!phone) {
            toast.error("El propietario no tiene número registrado.");
            return;
        }

        // Clean phone number: remove spaces, -, (, )
        let cleanPhone = phone.replace(/\D/g, '');

        // Ensure international format (simplified for this context)
        // Ideally, we'd check country codes, but assuming input might vary
        // If it sends without country code, WA tries to guess or prompts user.

        const encodedMessage = encodeURIComponent(message);
        const url = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

        window.open(url, '_blank');
    };

    if (compact) {
        return (
            <button
                onClick={handleClick}
                className={`p-2 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors ${className}`}
                title={label}
            >
                <MessageCircle className="w-4 h-4" />
            </button>
        );
    }

    return (
        <button
            onClick={handleClick}
            className={`flex items-center gap-2 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg transition-colors ${className}`}
        >
            <MessageCircle className="w-4 h-4" />
            <span>{label}</span>
        </button>
    );
};

export default WhatsAppButton;
