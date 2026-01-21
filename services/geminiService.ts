import { GoogleGenAI, Type } from "@google/genai";
import { Difficulty, TestType, CheckerResult, Language, StudyLesson, AdaptiveContext } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const modelName = 'gemini-3-flash-preview';

// Helper to clean Markdown JSON blocks and parse safely
const cleanAndParseJSON = (text: string) => {
  try {
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON Parse Error:", e);
    throw new Error("Failed to parse AI response. Please try again.");
  }
};

const getLanguageName = (language: Language): string => {
  const map: Record<Language, string> = {
    es: 'Español',
    en: 'English',
    zh: 'Chinese (Simplified)',
    ru: 'Russian',
    hi: 'Hindi'
  };
  return map[language] || 'English';
};

/**
 * Genera una explicación simplificada para un concepto técnico de accesibilidad.
 */
export const explainConceptSimply = async (phrase: string, topic: string, language: Language): Promise<string> => {
  const langName = getLanguageName(language);
  const prompt = `Actúa como un experto en accesibilidad digital y pedagogía. 
  CONTEXTO: Estoy estudiando conceptos fundamentales de accesibilidad sobre "${topic}".
  FRASE TÉCNICA: "${phrase}"
  
  TAREA: Explica esta frase de forma muy simple, como si se la explicaras a un niño de 10 años (Nivel B2). 
  Usa un lenguaje cercano, amable y analogías si es necesario. Máximo 2 párrafos cortos.
  IDIOMA: ${langName}.`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      temperature: 0.7,
      topP: 0.9,
    }
  });

  return response.text || "No se pudo generar la explicación.";
};

const getSystemInstruction = (language: Language) => {
  if (language === 'es') {
    return `Eres una IA experta en accesibilidad digital (WCAG 2.1 AA+). Tu objetivo es formar a diseñadores y desarrolladores mediante contenido técnico de alta calidad y casos prácticos.`;
  }
  return `You are an AI expert in digital accessibility (WCAG 2.1 AA+). Your goal is to train designers and developers through high-quality technical content and practical cases.`;
};

const getCheckerSystemInstruction = (language: Language) => {
  const targetLang = getLanguageName(language);
  return `You are an expert Accessibility Auditor (WCAG 2.1 AA+). Output Language: ${targetLang}. ...`;
};

// HARDCODED CONTENT FOR LEVEL 1 (Curated Onboarding)
const LEVEL_1_LESSON_ES: StudyLesson = {
    level: 1,
    topicTag: "Fundamentos",
    introTitle: "Introducción a la accesibilidad digital",
    introSubtitle: "¿Qué es, por qué es importante y por qué deberías aprenderlo?",
    learningPills: [
        {
            title: "Inclusión para Todos",
            description: "La accesibilidad digital asegura que todas las personas puedan usar la web, independientemente de sus capacidades.\n- Permite que personas con discapacidad visual, auditiva, motriz y cognitiva interactúen con sitios y apps.\n- Garantiza igualdad de acceso a la información.\n- No beneficia solo a unos pocos, beneficia a toda la sociedad.\nEs un derecho fundamental en el entorno digital.",
            icon: "globe"
        },
        {
            title: "¿Por qué es Importante?",
            description: "Crear productos accesibles tiene múltiples beneficios:\n- Mejora la experiencia de usuario (UX) para todas las personas.\n- Facilita el uso a personas mayores o con limitaciones temporales (como un brazo roto).\n- Mejora el SEO y posicionamiento web.\n- Es un requisito legal en muchos países.\nRefleja valores éticos y responsabilidad social.",
            icon: "star"
        },
        {
            title: "Ejemplos Cotidianos",
            description: "Probablemente ya usas funciones de accesibilidad a diario:\n- Subtítulos en vídeos (útiles en entornos ruidosos).\n- Texto alternativo en imágenes (mejora la búsqueda).\n- Buen contraste de texto (facilita la lectura bajo el sol).\n- Navegación con teclado (más rápida para usuarios avanzados).\nSon mejoras simples con impacto real.",
            icon: "eye"
        },
        {
            title: "Impacto Legal y Ético",
            description: "La accesibilidad no es opcional, es necesaria:\n- Existen leyes como la ADA y estándares como las WCAG.\n- Hay riesgos legales significativos si no se cumple.\n- Tenemos la responsabilidad ética de no excluir a nadie.\n- Es vital para la dignidad y autonomía de las personas.\nEs una obligación moral y profesional.",
            icon: "contrast"
        }
    ],
    visualComponent: "NONE",
    documentation: {
        nonTechnical: "### Guía para Diseño y Producto\nLa documentación es el puente entre el diseño y el código. Para garantizar la accesibilidad, debemos especificar claramente qué hace cada elemento.\n\n**Elementos a definir:**\n- **Rol:** ¿Qué es este elemento? (Botón, Enlace, Encabezado)\n- **Nombre Accesible:** ¿Cómo se llama? (Ej: 'Cerrar', 'Enviar formulario')\n- **Estado:** ¿Cómo está? (Activo, Deshabilitado, Expandido)\n\n**Comportamiento esperado:**\n- El foco debe ser visible siempre.\n- El orden de tabulación debe ser lógico (izquierda a derecha, arriba a abajo).\n- Los mensajes de error deben ser descriptivos y no solo depender del color rojo.",
        codeExamples: {
            html: `<!-- Ejemplo: Botón Accesible -->\n<button type="button" aria-label="Cerrar modal">\n  <span aria-hidden="true">X</span>\n</button>\n\n<!-- Ejemplo: Imagen con Texto Alternativo -->\n<img src="perro.jpg" alt="Un perro labrador corriendo en el parque" />`,
            ios: `// Ejemplo Swift (UIKit)\nlet closeButton = UIButton()\ncloseButton.accessibilityLabel = "Cerrar modal"\ncloseButton.accessibilityTraits = .button\ncloseButton.accessibilityHint = "Cierra la ventana actual"`,
            android: `<!-- Ejemplo XML (Android) -->\n<ImageButton\n    android:id="@+id/close_btn"\n    android:contentDescription="Cerrar modal"\n    android:focusable="true" />`
        },
        mobileScreenReader: "### VoiceOver (iOS) y TalkBack (Android)\n\n**Gesto:** Tocar el elemento una vez.\n**Lectura esperada:**\n- 'Cerrar modal, Botón'\n- 'Un perro labrador corriendo en el parque, Imagen'\n\n**Gesto:** Deslizar (Swipe) a la derecha.\n**Acción:** Mueve el foco al siguiente elemento lógico.",
        desktopScreenReader: "### NVDA (Windows)\n\n**Acción:** Pulsar tecla 'Tab' para llegar al botón.\n**Lectura esperada:**\n- 'Cerrar modal, botón'\n\n**Acción:** Flechas arriba/abajo para leer contenido.\n**Lectura esperada:**\n- 'Gráfico, Un perro labrador corriendo en el parque'"
    },
    goodPractices: ["Usar texto claro y sencillo.", "Pensar en todas las personas.", "Probar con teclado.", "Validar con lectores."],
    badPractices: ["Usar solo color.", "Depender del ratón.", "Ocultar info.", "Asumir uso estándar."],
    externalResources: [{ title: "WCAG 2.1 (W3C)", url: "https://www.w3.org/TR/WCAG21/" }],
    test: [
        { question: "¿A quién beneficia?", options: ["Personas ciegas", "Sociedad", "Mayores", "Programadores"], correctIndex: 1, successMessage: "¡Correcto!", failureMessage: "Piénsalo bien." }
    ]
};

export const generateStudyLesson = async (level: number, language: Language, context?: AdaptiveContext) => {
  const langName = getLanguageName(language);
  if (level === 1) return LEVEL_1_LESSON_ES;

  let baseFocus = "";
  if (level >= 2 && level <= 10) {
      baseFocus = "TECNICO AVANZADO. Salto de dificultad significativo. ARIA complejo, estados dinámicos.";
  } else if (level <= 20) {
      baseFocus = "EXPERTO. Widgets complejos, Live Regions.";
  }

  const prompt = `Genera una lección para el Nivel ${level} en ${langName}. 
  ${baseFocus}
  
  REGLAS PARA EL PASO 4 (DOCUMENTACIÓN):
  1. "nonTechnical": Explica claramente el Rol, Estado y Comportamiento esperado del componente visual elegido. Usa Markdown.
  2. "codeExamples": Genera código completo y valido para HTML, Swift (iOS) y XML (Android) del componente.
  3. "mobileScreenReader": Explica cómo VoiceOver/TalkBack deben leer el componente (gestos y output de voz).
  4. "desktopScreenReader": Explica cómo NVDA debe leer el componente (teclas y output de voz).
  
  Devuelve JSON estricto.`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      systemInstruction: getSystemInstruction(language),
      responseMimeType: "application/json",
      responseSchema: {
         type: Type.OBJECT,
         properties: {
            level: { type: Type.INTEGER },
            topicTag: { type: Type.STRING },
            introTitle: { type: Type.STRING },
            introSubtitle: { type: Type.STRING },
            learningPills: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING }, icon: { type: Type.STRING } } } },
            visualComponent: { type: Type.STRING },
            visualComponentProps: { 
                type: Type.OBJECT,
                properties: {
                    label: { type: Type.STRING },
                    placeholder: { type: Type.STRING },
                    helperText: { type: Type.STRING },
                    errorText: { type: Type.STRING },
                    buttonText: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    ariaLabel: { type: Type.STRING },
                    role: { type: Type.STRING },
                    state: { type: Type.STRING },
                    items: { type: Type.ARRAY, items: { type: Type.STRING } }
                } 
            },
            documentation: { 
                type: Type.OBJECT,
                properties: {
                    nonTechnical: { type: Type.STRING },
                    codeExamples: { 
                        type: Type.OBJECT, 
                        properties: { 
                            html: { type: Type.STRING }, 
                            ios: { type: Type.STRING }, 
                            android: { type: Type.STRING } 
                        },
                        required: ["html", "ios", "android"]
                    },
                    mobileScreenReader: { type: Type.STRING },
                    desktopScreenReader: { type: Type.STRING }
                },
                required: ["nonTechnical", "codeExamples", "mobileScreenReader", "desktopScreenReader"]
            },
            goodPractices: { type: Type.ARRAY, items: { type: Type.STRING } },
            badPractices: { type: Type.ARRAY, items: { type: Type.STRING } },
            externalResources: { 
                type: Type.ARRAY, 
                items: { 
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        url: { type: Type.STRING }
                    }
                } 
            },
            test: { 
                type: Type.ARRAY, 
                items: { 
                    type: Type.OBJECT,
                    properties: {
                        question: { type: Type.STRING },
                        options: { type: Type.ARRAY, items: { type: Type.STRING } },
                        correctIndex: { type: Type.INTEGER },
                        successMessage: { type: Type.STRING },
                        failureMessage: { type: Type.STRING }
                    }
                } 
            }
         },
         required: ["level", "topicTag", "introTitle", "introSubtitle", "learningPills", "visualComponent", "documentation", "goodPractices", "badPractices", "externalResources", "test"]
      }
    }
  });

  return cleanAndParseJSON(response.text || "{}");
};

export const generateTest = async (difficulty: Difficulty, type: TestType, language: Language) => {
  const langName = getLanguageName(language);
  const response = await ai.models.generateContent({
    model: modelName,
    contents: `Genera 10 preguntas de test sobre ${type} con dificultad ${difficulty} en ${langName}.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: { 
        type: Type.ARRAY, 
        items: { 
            type: Type.OBJECT,
            properties: {
                id: { type: Type.INTEGER },
                type: { type: Type.STRING },
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswerIndex: { type: Type.INTEGER },
                explanation: { type: Type.STRING }
            }
        } 
      }
    }
  });
  return cleanAndParseJSON(response.text || "[]");
};

export const analyzeImage = async (base64Image: string, language: Language, userContext?: string): Promise<CheckerResult> => {
  const langName = getLanguageName(language);

  const prompt = `Analiza esta UI en ${langName}.
  ${userContext ? `CONTEXTO DEL USUARIO: ${userContext}` : ''}

  ERES UN AUDITOR EXPERTO EN ACCESIBILIDAD (WCAG 2.1 AA). ANALIZA Y DOCUMENTA:

  === 1. TÍTULO DE VISTA (globalAnnotations.viewTitle) ===
  Analiza el contenido detectado y devuelve un array de strings con frases directas.
  IMPORTANTE - REGLAS DE FORMATO ESTRICTAS:
  - NO uses numeración (1., 2., 3.) dentro del texto.
  - NO uses prefijos de sección en negrita o mayúsculas (ej: NO pongas "CONTEXTO:", NO pongas "CONCLUSIÓN:", NO pongas "REQUISITO CRÍTICO:").
  - Solo devuelve las frases explicativas directas.

  Guía de contenido para las frases:
  - Indica si es una vista de app convencional o un documento/PDF incrustado.
  - Explica las implicaciones de navegación (ej: si no tiene título de vista nativo).
  - Menciona el requisito del nombre del archivo si es un documento (debe ser legible).
  - Sugiere un título accesible específico para el contenedor/visor (ej: "Vista de Certificado - AAAQuest").
  - Termina con una recomendación de implementación clara.

  === 2. ORDEN DE FOCO (globalAnnotations.focusOrder) ===
  Analiza el contenido visual y genera una LISTA ORDENADA y JERÁRQUICA que represente fielmente el recorrido de un lector de pantalla (Screen Reader).
  
  REGLAS DE FORMATO (ESTRICTO):
  1. Usa numeración secuencial (1., 2., 3., …).
  2. Para cada elemento, indica el TIPO DE COMPONENTE seguido de su contenido.
     Formato: "N. [Tipo] - [Contenido]"
     
     Ejemplos válidos:
     "1. Botón - Menú Principal"
     "2. Encabezado - Resultados de Búsqueda"
     "3. Texto - 24 resultados encontrados"

  3. AGRUPACIÓN JERÁRQUICA (Subniveles):
     Si detectas un bloque informativo (como una tarjeta, una fila de tabla o un grupo de datos relacionados), usa subnumeración para sus elementos internos.
     Ejemplo:
     "4. Tarjeta de Producto - Zapatillas Running"
     "4.1. Imagen - Foto de las zapatillas"
     "4.2. Texto - Precio: 99€"
     "4.3. Botón - Añadir al carrito"

  4. RESTRICCIONES (CRÍTICO):
     - NO uses bullets.
     - NO incluyas conclusiones, resúmenes ni validaciones al final de la lista.
     - Devuelve EXCLUSIVAMENTE los ítems de la lista detectada.
     - Respeta estrictamente el orden visual (arriba-abajo, izquierda-derecha).

  Genera el reporte JSON estricto.`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: { parts: [{ inlineData: { mimeType: "image/jpeg", data: base64Image } }, { text: prompt }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: { 
          type: Type.OBJECT,
          properties: {
              isValidUI: { type: Type.BOOLEAN },
              layoutType: { type: Type.STRING },
              screenContext: { 
                  type: Type.OBJECT,
                  properties: {
                      device: { type: Type.STRING },
                      screenType: { type: Type.STRING },
                      sector: { type: Type.STRING },
                      description: { type: Type.STRING },
                      language: { type: Type.STRING },
                      componentCount: { type: Type.INTEGER }
                  }
              },
              globalAnnotations: {
                  type: Type.OBJECT,
                  properties: {
                      viewTitle: { type: Type.ARRAY, items: { type: Type.STRING } },
                      structure: { type: Type.ARRAY, items: { type: Type.STRING } },
                      heading: { type: Type.ARRAY, items: { type: Type.STRING } },
                      focusOrder: { type: Type.ARRAY, items: { type: Type.STRING } }
                  }
              },
              complexSections: {
                  type: Type.ARRAY,
                  items: {
                      type: Type.OBJECT,
                      properties: {
                          regionTitle: { type: Type.STRING },
                          box_2d: { type: Type.ARRAY, items: { type: Type.INTEGER } },
                          categories: {
                              type: Type.OBJECT,
                              properties: {
                                  generalSpecific: { type: Type.ARRAY, items: { type: Type.STRING } },
                                  behavior: { type: Type.ARRAY, items: { type: Type.STRING } },
                                  alt: { type: Type.ARRAY, items: { type: Type.STRING } },
                                  grouped: { type: Type.ARRAY, items: { type: Type.STRING } }
                              }
                          }
                      }
                  }
              }
          }
      }
    }
  });
  return cleanAndParseJSON(response.text || "{}");
};

export const generateImage = async (prompt: string, size: '1K' | '2K' | '4K' = '1K'): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts: [{ text: prompt }] },
    config: { imageConfig: { aspectRatio: "1:1", imageSize: size } },
  });
  for (const part of response.candidates[0].content.parts) if (part.inlineData) return part.inlineData.data;
  throw new Error("No image generated");
};

export const editImage = async (base64Image: string, prompt: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ inlineData: { data: base64Image, mimeType: 'image/jpeg' } }, { text: prompt }] },
  });
  for (const part of response.candidates[0].content.parts) if (part.inlineData) return part.inlineData.data;
  throw new Error("No image generated");
};
