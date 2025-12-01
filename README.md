# 🚗 OterCar - Sistema de Gestión de Mantenimiento Vehicular

OterCar es una aplicación web moderna y robusta diseñada para facilitar la gestión integral del mantenimiento de flotas vehiculares. Permite administrar vehículos, inventario de repuestos, mecánicos, tiendas y registros de mantenimiento, todo en una interfaz intuitiva y estéticamente agradable.

![Dashboard Preview](https://via.placeholder.com/800x400?text=OterCar+Dashboard+Preview)

## ✨ Características Principales

*   **📊 Dashboard Interactivo:** Vista general con estadísticas clave, actividad reciente y estado de la flota.
*   **🚗 Gestión de Vehículos:** Registro completo de vehículos con detalles como marca, modelo, año, VIN y kilometraje.
*   **🔧 Inventario de Repuestos:** Control de stock, precios y asociación de repuestos con vehículos específicos.
*   **👨‍🔧 Directorio de Mecánicos:** Gestión de perfiles de mecánicos con especialidades y contacto.
*   **🏪 Gestión de Tiendas:** Registro de proveedores y tiendas de repuestos.
*   **📝 Registro de Mantenimientos:** Historial detallado de servicios realizados, costos y notas.
*   **🔐 Autenticación y Seguridad:** Sistema de login seguro, perfiles de usuario y control de acceso basado en roles (RBAC) mediante Supabase.
*   **🔔 Notificaciones:** Sistema de alertas en tiempo real para acciones importantes (registro, errores, etc.).
*   **👤 Perfil de Usuario:** Gestión de información personal y avatar.
*   **📱 Diseño Responsivo:** Interfaz adaptada para funcionar perfectamente en escritorio y dispositivos móviles.

## 🛠️ Tecnologías Utilizadas

*   **Frontend:** [React](https://reactjs.org/) (con [Vite](https://vitejs.dev/))
*   **Estilos:** [Tailwind CSS](https://tailwindcss.com/)
*   **Base de Datos y Auth:** [Supabase](https://supabase.com/) (PostgreSQL)
*   **Iconos:** [Lucide React](https://lucide.dev/)
*   **Enrutamiento:** [React Router](https://reactrouter.com/)
*   **Notificaciones:** [Sonner](https://sonner.emilkowal.ski/)

## 🚀 Comenzando

Sigue estos pasos para configurar el proyecto localmente.

### Prerrequisitos

*   Node.js (v16 o superior)
*   npm o yarn
*   Una cuenta en Supabase

### Instalación

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/tu-usuario/otercar.git
    cd otercar
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Configurar variables de entorno:**
    Crea un archivo `.env` en la raíz del proyecto y agrega tus credenciales de Supabase:
    ```env
    VITE_SUPABASE_URL=tu_url_de_supabase
    VITE_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
    # Opcional: API Key para funciones de IA (Futuro)
    # VITE_GEMINI_API_KEY=tu_api_key
    ```

4.  **Iniciar el servidor de desarrollo:**
    ```bash
    npm run dev
    ```

## 🗄️ Configuración de Base de Datos

Para que la aplicación funcione correctamente, debes ejecutar los scripts SQL proporcionados en el Editor SQL de Supabase en el siguiente orden:

1.  **Esquema Base:** Crea las tablas principales (`vehiculos`, `inventario`, `mecanicos`, `tiendas`).
2.  **`supabase_rbac.sql`:** Configura la tabla de perfiles y las políticas de seguridad (RLS).
3.  **`associate_parts.sql`:** Añade la relación entre inventario y vehículos.
4.  **`fix_recursion.sql`:** **(IMPORTANTE)** Corrige problemas de recursión infinita en las políticas de seguridad.

## 📂 Estructura del Proyecto

```
src/
├── components/
│   ├── Forms/       # Formularios para crear/editar entidades
│   ├── Layout/      # Componentes estructurales (Sidebar, Header, Layout)
│   └── UI/          # Componentes de interfaz reutilizables
├── context/         # Contextos de React (AuthContext, DataContext)
├── pages/           # Vistas principales de la aplicación
├── services/        # Servicios de integración (ej. AI)
├── App.jsx          # Componente raíz y configuración de rutas
└── main.jsx         # Punto de entrada
```

## 🤝 Contribución

¡Las contribuciones son bienvenidas! Por favor, abre un issue o envía un pull request para mejoras y correcciones.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.
