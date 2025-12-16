/**
 * Service to interact with Groq AI API
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL_NAME = 'llama-3.1-8b-instant';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`
});

export const generateMaintenanceInsight = async (vehicle, maintenanceHistory, inventory = []) => {
  try {
    // Format inventory for the AI
    const inventoryText = inventory.length > 0
      ? inventory.map(i => `- ${i.nombre}: $${i.precio} (Stock: ${i.cantidad})`).join('\n')
      : "No hay información de inventario disponible.";

    // Construct the prompt
    const prompt = `
      Actúa como un experto mecánico automotriz y cotizador de servicios.
      Analiza los datos del siguiente vehículo, su historial y EL INVENTARIO DISPONIBLE para recomendar el próximo servicio y ESTIMAR SU COSTO.
      
      Vehículo: ${vehicle.marca} ${vehicle.modelo} (${vehicle.anio})
      Kilometraje actual: ${vehicle.kilometraje || 'No especificado'} km
      
      Historial Reciente:
      ${maintenanceHistory.map(m => `- ${m.fecha}: ${m.tipo} (${m.descripcion})`).join('\n')}
      
      INVENTARIO Y PRECIOS (Usa estos precios exactos para tu presupuesto):
      ${inventoryText}
      
      Basado en esto, provee:
      1. Recomendación del próximo servicio.
      2. Estimación de cuándo realizarlo.
      3. PRESUPUESTO ESTIMADO: Suma el precio de los repuestos del inventario necesarios + $30 (mano de obra estimada).
      
      Responde en formato JSON con la siguiente estructura:
      {
        "recomendacion": "Título breve del servicio",
        "detalle": "Explicación técnica",
        "prioridad": "Alta/Media/Baja",
        "estimado": "Kilometraje o texto",
        "fecha_estimada": "YYYY-MM-DD", // CALCULA UNA FECHA APROXIMADA (Asume 40km/dia si es por kilometraje)
        "costo_estimado": 100, // Número con el costo total calculado
        "partes_sugeridas": ["Aceite 10w30", "Filtro de Aceite"] // Lista de partes del inventario usadas
      }
      SOLO responde con el JSON.
    `;

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          { role: "system", content: "Eres un asistente mecánico y cotizador experto. Respondes siempre en JSON válido." },
          { role: "user", content: prompt }
        ],
        temperature: 0.4, // Lower temperature to be more precise with math/prices
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
      console.warn("Could not parse JSON from AI", content);
      return {
        recomendacion: "Análisis completado",
        detalle: content,
        prioridad: "Media",
        estimado: "Revisar manual",
        costo_estimado: 0,
        partes_sugeridas: []
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
    content: `Eres "OterBot", un asistente mecánico experto de la aplicación OterCar.
        
        TU OBJETIVO PRINCIPAL: Responder preguntas BASÁNDOTE EXCLUSIVAMENTE en los datos del taller proporcionados abajo.
        
        DATOS DEL TALLER (TU ÚNICA FUENTE DE VERDAD):
        ${contextString}

        REGLAS ESTRICTAS (MCP - Model Context Protocol):
        1. SOLO responde usando la información listada en "DATOS DEL TALLER".
        2. Si la respuesta no está en los datos, di explícitamente: "No tengo información sobre eso en la base de datos del taller."
        3. NO inventes datos, NO uses conocimiento general externo (a menos que sea para explicar un término técnico mencionado en los datos).
        4. Si te preguntan sobre un vehículo que no está en la lista, di que no está registrado.
        5. Sé conciso, profesional y directo.
        6. Tus respuestas deben ser siempre en español.
        
        Ejemplo: Si te preguntan "¿Qué aceite usa mi carro?", busca en el inventario o historial. Si no está, di que no tienes registro de ese dato.`
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

export const parseMaintenanceVoice = async (text) => {
  try {
    const prompt = `
      Analiza el siguiente texto dictado por un mecánico y extrae la información para un reporte de mantenimiento.
      Texto: "${text}"
      
      Extrae los siguientes campos en formato JSON:
      - tipo: "Mantenimiento Preventivo", "Mantenimiento Correctivo", "Reparación", "Revisión General" (Elige el más adecuado)
      - descripcion: Descripción técnica detallada y formal de lo que se mencionó.
      - kilometraje: (Número) Si se menciona kilometraje, extráelo. Si no, null.
      - costo_estimado: (Número) Si se menciona costo o precio, extráelo. Si no, null.
      
      Responde SOLO con el JSON.
    `;

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          { role: "system", content: "Eres un asistente que estructura datos de voz a JSON." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      }),
    });

    if (response.status === 429) {
      throw new Error('Límite de uso de IA alcanzado. Intenta de nuevo en unos segundos.');
    }

    if (!response.ok) throw new Error('Error IA');
    const data = await response.json();
    return JSON.parse(data.choices[0]?.message?.content);

  } catch (error) {
    console.error('Error parsing voice:', error);
    return null;
  }
};

export const getVehicleSpecs = async (vehicleText) => {
  try {
    const prompt = `
      Actúa como una base de datos de especificaciones técnicas de autos.
      Proporciona la capacidad del tanque de combustible (en Litros) para el siguiente vehículo: "${vehicleText}".
      
      Si no tienes el dato exacto, da una estimación precisa basada en el segmento y año del vehículo.
      
      Responde SOLO con un objeto JSON:
      {
        "capacity": 50
      }
      (Donde el número es la capacidad en litros).
    `;

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          { role: "system", content: "Eres una API de especificaciones de autos. Responde solo JSON." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) throw new Error('Error IA Specs');
    const data = await response.json();
    const result = JSON.parse(data.choices[0]?.message?.content);
    return result?.capacity || 50;

  } catch (error) {
    console.error('Error getting specs:', error);
    return null;
  }
};
