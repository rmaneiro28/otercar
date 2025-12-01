import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const [connectionError, setConnectionError] = useState(false);

    useEffect(() => {
        // Check active session
        const getSession = async () => {
            try {
                // Create a promise that rejects after 10 seconds
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Session check timed out')), 10000)
                );

                // Race between getSession and timeout
                const { data: { session } } = await Promise.race([
                    supabase.auth.getSession(),
                    timeoutPromise
                ]);

                if (session?.user) {
                    setUser(session.user);
                    // Fetch profile in background to avoid blocking app load if DB is slow/locked
                    fetchProfile(session.user.id);
                } else {
                    setUser(null);
                    setProfile(null);
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                // Only show connection error if we really can't get a session
                // setConnectionError(true); 
                // Actually, let's keep it simple: if session check fails, we assume logged out or offline
                setUser(null);
                setProfile(null);
            } finally {
                setLoading(false);
            }
        };

        getSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                setUser(session.user);
                fetchProfile(session.user.id);
            } else {
                setUser(null);
                setProfile(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('perfiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
            } else {
                setProfile(data);
            }
        } catch (error) {
            console.error('Error in fetchProfile:', error);
        }
    };


    const signUp = async (email, password, fullName) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
            },
        });

        if (error) {
            toast.error('Error al registrarse: ' + error.message);
        } else if (data?.user) {
            // Create profile entry
            const { error: profileError } = await supabase.from('perfiles').insert([
                { id: data.user.id, nombre_completo: fullName, email: email, rol: 'usuario' }
            ]);

            if (profileError) {
                toast.error('Usuario creado, pero hubo un error al crear el perfil.');
            } else {
                toast.success('¡Registro exitoso! Bienvenido.');
            }
        }

        return { data, error };
    };

    const signIn = (email, password) => {
        return supabase.auth.signInWithPassword({
            email,
            password,
        });
    };

    const signOut = () => {
        return supabase.auth.signOut();
    };

    const value = {
        user,
        profile, // Expose profile with role
        signUp,
        signIn,
        signOut,
    };

    if (connectionError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-red-100">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Error de Conexión</h2>
                    <p className="text-slate-600 mb-6">
                        No se pudo conectar con el servidor. Esto puede deberse a una conexión lenta o credenciales incorrectas.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium w-full"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                <div className="min-h-screen flex items-center justify-center bg-slate-50">
                    <div className="text-center">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-500">Cargando sistema...</p>
                    </div>
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};
