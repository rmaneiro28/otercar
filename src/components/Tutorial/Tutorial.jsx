import React, { useEffect } from 'react';
import introJs from 'intro.js';
import 'intro.js/introjs.css';

const Tutorial = () => {
    useEffect(() => {
        const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');

        if (!hasSeenTutorial) {
            const intro = introJs();

            intro.setOptions({
                steps: [
                    {
                        element: 'body',
                        intro: '¡Bienvenido a OterCar! Tu sistema integral para la gestión de mantenimiento vehicular.',
                        position: 'center'
                    },
                    {
                        element: '.dashboard-stats',
                        intro: 'Aquí verás un resumen rápido del estado de tu flota, inventario y más.',
                        position: 'bottom'
                    },
                    {
                        element: 'aside',
                        intro: 'Usa el menú lateral para navegar entre Vehículos, Inventario, Mecánicos y otras secciones.',
                        position: 'right'
                    },
                    {
                        element: '.settings-link',
                        intro: 'Configura tu cuenta, cambia al modo oscuro y ajusta tus preferencias aquí.',
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
