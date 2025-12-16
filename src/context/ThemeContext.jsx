import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../supabaseClient';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    const { user, profile } = useAuth();

    const [theme, setTheme] = useState(() => {
        // Check local storage first
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) return savedTheme;

        // Then check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }

        return 'light';
    });

    // Valid themes
    const validThemes = ['light', 'dark'];

    useEffect(() => {
        // Sync with profile if available
        if (profile?.theme && validThemes.includes(profile.theme) && profile.theme !== theme) {
            setTheme(profile.theme);
        }
    }, [profile]);

    useEffect(() => {
        const root = window.document.documentElement;

        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = async () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);

        if (user) {
            try {
                const { error } = await supabase
                    .from('perfiles')
                    .update({ theme: newTheme })
                    .eq('id', user.id);

                if (error) console.error('Error syncing theme:', error);
            } catch (err) {
                console.error('Error syncing theme:', err);
            }
        }
    };

    const setMode = (mode) => {
        setTheme(mode);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setMode }}>
            {children}
        </ThemeContext.Provider>
    );
};
