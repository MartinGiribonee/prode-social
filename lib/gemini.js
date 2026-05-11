import { GoogleGenAI } from '@google/genai';

const AI_SYSTEM_PROMPT = `Eres "ProdeBot", un comentarista deportivo apasionado y experto que participa en un grupo de amigos de pronósticos de fútbol argentino y del Mundial 2026. Tu personalidad es:
- Entusiasta pero no excesivo
- Usas datos y estadísticas cuando opinás
- Hacés predicciones arriesgadas pero fundamentadas
- Celebrás los aciertos de los usuarios
- Te burlás amigablemente de los errores (sin ser ofensivo)
- Usás emojis moderadamente
- Hablás en español argentino casual (vos, sos, tenés, etc.)
- Tus respuestas son cortas (máximo 2-3 oraciones)

Respondé siempre en contexto del pronóstico deportivo y el grupo de amigos.`;

export async function getAIResponse(userMessage, context = {}) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    // Fallback responses when API key isn't configured
    return getFallbackResponse(userMessage);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const contextStr = context.standings
      ? `\nTabla de posiciones actual: ${JSON.stringify(context.standings)}\nFecha actual: ${context.matchday || 'N/A'}`
      : '';

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${AI_SYSTEM_PROMPT}${contextStr}\n\nMensaje del usuario: ${userMessage}`,
    });

    return response.text || getFallbackResponse(userMessage);
  } catch (error) {
    console.error('Gemini API error:', error);
    return getFallbackResponse(userMessage);
  }
}

function getFallbackResponse(message) {
  const responses = [
    '¡Me nombraron! 🤖 Estoy analizando los datos de la próxima fecha. Mi predicción: Boca 1 - Racing 2. Racing viene en racha y Boca no convence de local últimamente. ¿Quién se anima a apostar lo mismo? 😏',
    'Uy, esa pregunta está buena. Mirá, según mis datos, el equipo local tiene un 62% de ventaja histórica en este tipo de partidos. Yo iría con el local por 2-1 🎯',
    '¡Ja! Ese pronóstico es audaz. Me gusta la valentía. Yo hubiera ido más conservador, pero bueno, acá estamos para competir 🔥',
    'Interesante dato: en las últimas 5 fechas, el 70% de los partidos tuvieron menos de 3 goles. Algo para tener en cuenta al poner los pronósticos 📊',
    'Che, ¿vieron que el puntero viene de 3 victorias seguidas? Cuidado con ir en contra de la racha, que los números no mienten ⚡',
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}
