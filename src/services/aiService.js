
/**
 * Service to interact with local Ollama instance
 */

const OLLAMA_API_URL = 'http://localhost:11434/api/generate';
const MODEL_NAME = 'llama3';

export const generateMaintenanceInsight = async (vehicle, maintenanceHistory) => {
  try {
    // Construct the prompt
    const prompt = `
      Actúa como un experto mecánico automotriz con años de experiencia.
      Analiza los datos del siguiente vehículo y su historial de mantenimiento para recomendar el próximo servicio necesario.
      
      Vehículo: ${vehicle.marca} ${vehicle.modelo} (${vehicle.anio})
      Kilometraje actual: ${vehicle.kilometraje || 'No especificado'} km
      
      Historial de Mantenimiento Reciente:
      ${maintenanceHistory.map(m => `- ${m.fecha}: ${m.tipo} (${m.descripcion}) a los ${m.kilometraje} km`).join('\n')}
      
      Basado en esto, por favor provee:
      1. Una recomendación clara de cuál debería ser el próximo mantenimiento.
      2. Una estimación de cuándo debería realizarse (tiempo o kilometraje).
      3. Cualquier alerta sobre piezas que podrían estar desgastadas por el modelo/año.
      
      Responde en formato JSON con la siguiente estructura:
      {
        "recomendacion": "Texto breve del mantenimiento recomendado",
        "detalle": "Explicación detallada del por qué",
        "prioridad": "Alta/Media/Baja",
        "estimado": "Kilometraje o fecha estimada"
      }
      SOLO responde con el JSON, sin texto adicional.
    `;

    const response = await fetch(OLLAMA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        prompt: prompt,
        stream: false, // We want the full response at once
        format: "json" // Force JSON output mode if supported by the model version, otherwise prompt handles it
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API Error: ${response.statusText}`);
    }

    const data = await response.json();

    // Parse the response field which contains the actual text/json from the model
    try {
      return JSON.parse(data.response);
    } catch (e) {
      console.warn("Could not parse JSON from AI, returning raw text", data.response);
      return {
        recomendacion: "Análisis completado",
        detalle: data.response,
        prioridad: "Media",
        estimado: "Revisar manual"
      };
    }

  } catch (error) {
    console.error('Error generating AI insight:', error);
    throw error;
  }
};

export const chatWithAI = async (messages, contextData = {}) => {
  const OLLAMA_URL = 'http://localhost:11434/api/chat';

  // Format context data for the AI
  const contextString = `
    DATOS DEL TALLER (Usa esta información para responder):
    
    VEHÍCULOS:
    ${contextData.vehicles?.map(v => `- ${v.marca} ${v.modelo} (${v.placa}), ${v.kilometraje}km`).join('\n') || 'Ninguno'}
    
    INVENTARIO:
    ${contextData.inventory?.map(i => `- ${i.nombre}: ${i.cantidad} unid. ($${i.precio})`).join('\n') || 'Vacío'}
    
    MECÁNICOS:
    ${contextData.mechanics?.map(m => `- ${m.nombre} (${m.especialidad})`).join('\n') || 'Ninguno'}
    
    MANTENIMIENTOS RECIENTES:
    ${contextData.maintenance?.slice(0, 5).map(m => `- ${m.fecha}: ${m.tipo} (${m.costo_total})`).join('\n') || 'Ninguno'}
    `;

  // System prompt for the mechanic persona
  const systemMessage = {
    role: 'system',
    content: `Eres "OterBot", un asistente mecánico experto y amigable de la aplicación OterCar.
        Tu objetivo es ayudar a los usuarios con dudas sobre mantenimiento automotriz, diagnóstico de problemas y consejos generales.
        
        Tienes acceso a los siguientes datos del taller en tiempo real:
        ${contextString}

        Reglas:
        1. Sé conciso y directo.
        2. Usa un tono profesional pero cercano.
        3. Si no sabes algo con seguridad, recomiéndales visitar a un mecánico profesional.
        4. Tus respuestas deben ser en español.
        5. Usa la información del taller para dar respuestas personalizadas (ej. "Veo que tienes un Toyota Corolla...").`
  };

  try {
    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3',
        messages: [systemMessage, ...messages],
        stream: false
      }),
    });

    if (!response.ok) {
      throw new Error('Error connecting to Ollama');
    }

    const data = await response.json();
    return data.message;
  } catch (error) {
    console.error('AI Chat Error:', error);
    throw error;
  }
};
