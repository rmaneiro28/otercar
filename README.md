# 🚗 OterCar - Sistema Inteligente de Gestión Vehicular

OterCar es una plataforma integral diseñada para modernizar la gestión de flotas y talleres mecánicos. Combina herramientas tradicionales de administración con Inteligencia Artificial para optimizar el mantenimiento, predecir costos y mejorar la comunicación con los clientes.

![OterCar Dashboard](https://via.placeholder.com/800x400?text=OterCar+Dashboard+2.0)

## ✨ Características Principales

### 🧠 Inteligencia Artificial (NUEVO)
*   **Diagnóstico Predictivo:** Análisis automático del historial de mantenimiento para sugerir próximos servicios.
*   **Estimación de Costos:** Cálculo de presupuestos basado en precios reales de inventario y mano de obra.
*   **Alertas Inteligentes:** Notificaciones automáticas sobre anomalías o servicios urgentes.

### 📅 Agenda y Vencimientos (NUEVO)
*   **Calendario Visual:** Vista mensual con indicadores de colores para vencimientos de documentos (SOAT, Tecno, Pólizas).
*   **Recordatorios Automáticos:** El sistema escanea diariamente la flota y alerta sobre documentos por vencer (30 días antes).

### 📱 Comunicación y Reportes (NUEVO)
*   **Integración WhatsApp:** Botones "Click-to-Chat" con mensajes contextuales pre-redactados para contactar a propietarios.
*   **Reportes PDF:** Generación de "Hoja de Vida" del vehículo con un clic, incluyendo historial completo y costos totales.

### ⛽ Control de Combustible (NUEVO)
*   **Registro de Cargas:** Monitoreo de litros, costos y kilometraje.
*   **Calculadora de Tanqueo:** Estimación de costo para llenar el tanque según la capacidad del vehículo (detectada por IA).

### 🛠️ Gestión Operativa
*   **Flota:** Expediente digital completo por vehículo (VIN, Placa, Color, Dueño).
*   **Mantenimiento:** Historial detallado de reparaciones con control de repuestos usados.
*   **Inventario:** Control de stock en tiempo real con descuento automático al registrar servicios.
*   **Directorio:** Gestión de Mecánicos, Tiendas y Propietarios.

## 🚀 Tecnologías

*   **Frontend:** React 18 + Vite
*   **UI/UX:** Tailwind CSS + Lucide Icons + Recharts
*   **Backend:** Supabase (Auth, Database, Storage, Realtime)
*   **IA:** Groq API (Llama3)
*   **Utilidades:** jsPDF (Reportes), date-fns (Fechas), React-Calendar.

## 📦 Instalación y Configuración

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/tu-usuario/otercar.git
    cd otercar
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Configurar Variables de Entorno (.env):**
    ```env
    VITE_SUPABASE_URL=tu_url_supa
    VITE_SUPABASE_ANON_KEY=tu_key_supa
    VITE_GROQ_API_KEY=tu_api_key_groq
    ```

4.  **Iniciar Servidor:**
    ```bash
    npm run dev
    ```

## 🗄️ Estructura de Base de Datos (Supabase)

El sistema utiliza las siguientes tablas principales:

*   `vehiculos`: Datos maestros de la flota.
*   `propietarios`: Dueños de vehículos (CRM básico).
*   `mantenimientos`: Bitácora de servicios.
*   `inventario`: Repuestos y costos.
*   `recomendaciones_ia`: Historial de análisis generados por la IA.
*   `documentos_vehiculo`: Archivos y fechas de vencimiento.
*   `notificaciones`: Sistema de alertas in-app.

## 📂 Estructura del Proyecto

```
src/
├── components/
│   ├── AI/              # Componentes de Inteligencia Artificial
│   ├── Dashboard/       # Gráficos y widgets
│   ├── Forms/           # Formularios de captura
│   ├── Layout/          # Sidebar, Navbar, MobileMenu
│   └── UI/              # Modales, Botones, Cards
├── context/
│   ├── AuthContext.jsx  # Manejo de Sesión
│   └── DataContext.jsx  # Estado Global (Vehículos, Inventario, IA)
├── pages/               # Vistas (Calendar, Fuel, Maintenance, etc.)
├── services/
│   ├── aiService.js     # Conexión con Groq
│   └── pdfService.js    # Generador de Reportes
└── App.jsx              # Router Principal
```

## 🤝 Soporte

Para dudas técnicas o reportar bugs, contactar al equipo de desarrollo (Rúbel Maneiro).
