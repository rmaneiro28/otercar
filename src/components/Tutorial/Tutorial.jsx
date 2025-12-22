import React, { useEffect } from 'react';
import introJs from 'intro.js';
import 'intro.js/introjs.css';
import '../../styles/Tutorial.css';

const Tutorial = () => {
    useEffect(() => {
        const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');

        if (!hasSeenTutorial) {
            const intro = introJs();

            intro.setOptions({
                steps: [
                    {
                        element: 'body',
                        intro: '<div class="flex flex-col items-center text-center"><div class="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-4"><img src="/Isotipo.png" class="w-10 h-10 object-contain" /></div><h3 class="font-bold text-lg mb-1">¡Bienvenido a OterCar!</h3><p>Tu asistente inteligente para el cuidado y gestión de tus vehículos.</p></div>',
                        position: 'center'
                    },
                    {
                        element: '.dashboard-stats',
                        intro: '<h4 class="font-bold text-blue-600 dark:text-blue-400 mb-1">Tu Flota de un Vistazo</h4>Aquí verás métricas clave como el gasto acumulado, vehículos activos y alertas críticas.',
                        position: 'bottom'
                    },
                    {
                        element: 'aside',
                        intro: '<h4 class="font-bold text-blue-600 dark:text-blue-400 mb-1">Navegación Intuitiva</h4>Accede rápidamente a tu inventario de repuestos, agenda de mantenimientos y mecánicos.',
                        position: 'right'
                    },
                    {
                        element: '.settings-link',
                        intro: '<h4 class="font-bold text-blue-600 dark:text-blue-400 mb-1">Personalización</h4>Ajusta tu perfil, gestiona tu plan y activa el modo oscuro para una mejor experiencia nocturna.',
                        position: 'right'
                    }
                ],
                nextLabel: 'Siguiente',
                prevLabel: 'Anterior',
                doneLabel: '¡Listo!',
                showStepNumbers: true,
                showBullets: true,
                exitOnOverlayClick: false,
                overlayOpacity: 0.5,
                scrollToElement: true
            });

            intro.onexit(() => {
                localStorage.setItem('hasSeenTutorial', 'true');
            });

            intro.oncomplete(() => {
                localStorage.setItem('hasSeenTutorial', 'true');
            });

            // Small delay to ensure elements are mounted
            setTimeout(() => {
                intro.start();
            }, 1000);
        }
    }, []);

    return null; // The library handles the UI overlay
};

export default Tutorial;
