/**
 * Service to interact with Groq AI API
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL_NAME = 'llama-3.3-70b-versatile';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`
});

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

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          { role: "system", content: "Eres un asistente mecánico experto que responde siempre en formato JSON." },
          { role: "user", content: prompt }
        ],
        temperature: 0.5,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Groq API Error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    try {
      return JSON.parse(content);
    } catch (e) {
      console.warn("Could not parse JSON from AI, returning raw text", content);
      return {
        recomendacion: "Análisis completado",
        detalle: content,
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
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [systemMessage, ...messages],
        temperature: 0.7,
        max_tokens: 1024
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Groq API Error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return { role: 'assistant', content: data.choices[0]?.message?.content };
  } catch (error) {
    console.error('AI Chat Error:', error);
    throw error;
  }
};
