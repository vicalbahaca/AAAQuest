
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
    console.log("Raw Text:", text);
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

const getSystemInstruction = (language: Language) => {
  if (language === 'es') {
    return `Eres una IA experta en accesibilidad digital (WCAG 2.1 AA+). Tu objetivo es formar a diseñadores y desarrolladores mediante contenido técnico de alta calidad y casos prácticos.`;
  }
  return `You are an AI expert in digital accessibility (WCAG 2.1 AA+). Your goal is to train designers and developers through high-quality technical content and practical cases.`;
};

const getCheckerSystemInstruction = (language: Language) => {
  const targetLang = getLanguageName(language);
  
  return `
    You are an expert Accessibility Auditor (WCAG 2.1 AA+). 
    Your goal is to document the UI screenshot following a STRICT hierarchical structure.
    Output Language: ${targetLang}.
    
    All annotations must comply with WCAG 2.1 AA.
    Provide the content as distinct strings.
    Do NOT use abbreviations. Ensure correct spelling and encoding.

    --- STEP 1: LAYOUT CLASSIFICATION ---
    Analyze the screenshot and classify 'layoutType' as 'simple' or 'complex'.
    - SIMPLE: Single focus task (Login, Modal, Simple Form).
    - COMPLEX: Dashboard, Landing Page, Multi-section view.

    --- STEP 2: GLOBAL ANNOTATIONS (STRICT ORDER) ---
    Identify findings that apply to the WHOLE page structure.
    
    1. VIEW TITLE (TÍTULO DE VISTA):
       - Propose a value for <title> based on the H1 or a brief summary.
       
    2. STRUCTURE (ESTRUCTURA - Landmarks):
       - Landmarks: header, main, nav, footer, complementary.
       - Note if landmarks are duplicate or empty.
       
    3. HEADING (ENCABEZADO):
       - List H1, H2, H3 with their text.
       - Verify no skipped heading levels.
       
    4. FOCUS ORDER (ORDEN DE FOCO):
       - Numbered list of expected focus order.
       - Note that initial focus should be on H1 on load.

    --- STEP 3: SECTIONS / COMPONENTS DETECTION ---
    If 'layoutType' is 'simple', create ONE section named "Main Content".
    If 'layoutType' is 'complex', divide the UI into distinct regions/components.
    
    **CRITICAL DETECTION RULES**:
    1. **IGNORE SYSTEM STATUS BAR**: Do NOT detect the native mobile status bar (time, battery, signal, wifi icons at the very top edge) as a section. Ignore it completely from the audit.
    2. **TOP NAVIGATION PRIORITY**: You MUST detect specific top navigation elements. Identify "Back Buttons", "Hamburger Menus", "Contextual Dropdowns", "Close Buttons", or "Top App Bars" as distinct components/sections.
    3. **BOUNDING BOX**: For each section, you MUST identify its Bounding Box (box_2d) using a normalized 0-1000 scale [ymin, xmin, ymax, xmax].
    
    Use the visible text of the main heading of the section as the region title if available, otherwise use the component type (e.g. "Header", "Navbar", "Footer", "Formulario", "Tabla").
    
    For EACH region, fill these specific categories (leave empty if not applicable, do not generate generic filler):

    1. GENERAL SPECIFIC (generalSpecific) - Name "Accesibilidad específica":
       - Component documentation: type, state, required/optional, role, visible label.
       - **CONTRAST:** Identify specific contrast issues in this section.
       - **ZOOM/REFLOW:** Identify specific risks when scaling text to 200% or zooming in this section.
       - For OTP: "6-digit OTP, required, label associated...".
    
    2. BEHAVIOR (behavior):
       - When to use aria-live="polite".
       - Label association and autocomplete rules.
       - Modals, popups, timers, redirects.

    3. ALT (alt):
       - For each non-decorative image/icon: alt="recommended text".
       - If decorative: alt="".
       - Do NOT repeat adjacent visible text.

    4. GROUPED (grouped):
       - Lists, cards, or label-value rows to be announced as a single element.
       - Specify parts read together.

    IMPORTANT: Do NOT repeat Global items (Headings, Structure, View Title, Focus Order) inside these Sections.
    `;
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
        nonTechnical: "En los siguientes niveles, esta pestaña 'Explicación' te dará detalles sobre cómo documentar componentes específicos para el equipo de desarrollo.\n\nAquí aprenderás a:\n- Definir el comportamiento esperado.\n- Especificar roles y estados.\n- Redactar textos para lectores de pantalla.\n\nEsta documentación sirve de puente entre Diseño y Desarrollo.",
        codeExamples: {
            html: `<!-- Ejemplo de botón accesible básico -->\n<button aria-label="Cerrar ventana">\n  <svg aria-hidden="true">...</svg>\n</button>`,
            ios: `// Ejemplo en Swift (UIKit)\nbutton.accessibilityLabel = "Cerrar ventana"\nbutton.accessibilityTraits = .button`,
            android: `// Ejemplo en XML (Android)\nandroid:contentDescription="Cerrar ventana"\nandroid:focusable="true"`
        },
        specificAccessibility: [],
        behavior: [],
        voiceOver: "Un **Lector de Pantalla** (Screen Reader) es un software que convierte el contenido visual en voz o braille.\n\n- Existen varios: VoiceOver (Apple), TalkBack (Android), NVDA (Windows).\n- Cada uno puede leer el mismo código de forma ligeramente distinta.\n- En esta pestaña aprenderás a verificar que lo que se 'escucha' coincide con lo que se 've'.\n\nEl QA con lector de pantalla es esencial para validar tu trabajo.",
        nvda: ""
    },
    goodPractices: [
        "Usar texto claro y sencillo.",
        "Pensar en todas las personas desde el inicio del diseño.",
        "Probar la navegación usando solo el teclado.",
        "Validar tus diseños con lectores de pantalla."
    ],
    badPractices: [
        "Usar solo el color para comunicar información (ej: error rojo).",
        "Depender exclusivamente del ratón para interactuar.",
        "Ocultar información importante por estética.",
        "Asumir que todos usan la web de la misma manera que tú."
    ],
    externalResources: [
        { title: "WCAG 2.1 (W3C)", url: "https://www.w3.org/TR/WCAG21/" },
        { title: "A11y Project", url: "https://www.a11yproject.com/" }
    ],
    test: [
        {
            question: "¿A quién beneficia principalmente la accesibilidad digital?",
            options: ["Solo a personas ciegas", "A toda la sociedad", "Solo a personas mayores", "A los programadores"],
            correctIndex: 1,
            successMessage: "¡Correcto! Beneficia a todos, incluyendo personas con discapacidad, mayores y usuarios temporales.",
            failureMessage: "Piénsalo bien. ¿Acaso los subtítulos no te ayudan en un bar ruidoso?"
        },
        {
            question: "¿Qué elemento ayuda a personas sordas en un video?",
            options: ["Alto contraste", "Subtítulos (Captions)", "Navegación por teclado", "Texto alternativo"],
            correctIndex: 1,
            successMessage: "¡Exacto! Los subtítulos son esenciales para personas con discapacidad auditiva.",
            failureMessage: "El contraste es visual. Para el audio, necesitamos texto sincronizado."
        },
        {
            question: "¿Es la accesibilidad un requisito legal?",
            options: ["No, es opcional", "Sí, en muchos países", "Solo en sitios del gobierno", "Solo para empresas grandes"],
            correctIndex: 1,
            successMessage: "¡Correcto! Existen leyes internacionales y locales que la exigen.",
            failureMessage: "Cuidado, en muchos lugares es obligatorio por ley para todo tipo de servicios."
        }
    ]
};

export const generateStudyLesson = async (
    level: number, 
    language: Language, 
    context?: AdaptiveContext
) => {
  const langName = getLanguageName(language);
  
  if (level === 1) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      return LEVEL_1_LESSON_ES; 
  }

  // Significant Difficulty Scaling
  let baseFocus = "";
  if (level >= 2 && level <= 10) {
      baseFocus = "TECNICO AVANZADO. Salto de dificultad significativo. Enfócate en semántica técnica real: roles ARIA complejos, gestión de errores de formulario, estados dinámicos y criterios de nivel AA/AAA. El usuario ya conoce los fundamentos.";
  } else if (level <= 20) {
      baseFocus = "EXPERTO. Casos de borde, widgets complejos (Datepickers, Modales anidados), lógica de anuncios para lectores de pantalla (Live Regions) y navegación por teclado no lineal.";
  }

  const prompt = `Genera una lección de accesibilidad para el Nivel ${level}.
  Idioma de respuesta EXCLUSIVO: ${langName}. Todo el contenido debe estar en este idioma.
  
  CURVA DE DIFICULTAD: ${baseFocus}
  
  REGLAS DE CONTENIDO:
  1. Paso 2 (Conceptos): 3-5 módulos. Usa listas con guiones.
  2. Paso 3 (Visual Component): ELIGE un componente visual y DEFINE sus propiedades en 'visualComponentProps' para que sea COHERENTE con la lección. 
     - Ej: Si hablas de errores, pon un MATERIAL_INPUT con state: "error" y errorText: "Descripción del error accesible".
     - Ej: Si hablas de jerarquía, usa PRODUCT_CARD con títulos claros.
  3. Paso 4 (Documentación): Asegúrate de que las descripciones de VoiceOver y NVDA coincidan con el componente del paso 3.
  4. Paso 5 (Buenas Prácticas): Consejos técnicos específicos para desarrolladores.
  5. Paso 6 (Test): 3 preguntas difíciles sobre el componente y la teoría anterior.

  Devuelve JSON estricto.`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      systemInstruction: getSystemInstruction(language),
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 0 },
      responseSchema: {
         type: Type.OBJECT,
         properties: {
            level: { type: Type.INTEGER },
            topicTag: { type: Type.STRING },
            introTitle: { type: Type.STRING },
            introSubtitle: { type: Type.STRING },
            learningPills: {
               type: Type.ARRAY,
               items: {
                  type: Type.OBJECT,
                  properties: {
                     title: { type: Type.STRING },
                     description: { type: Type.STRING },
                     icon: { type: Type.STRING, enum: ['book', 'globe', 'image', 'contrast', 'layout', 'text', 'mouse', 'code', 'eye', 'ear', 'star'] },
                     link: { type: Type.STRING }
                  },
                  required: ["title", "description", "icon"]
               }
            },
            visualComponent: { type: Type.STRING, enum: ["MATERIAL_INPUT", "IOS_BUTTON", "PRODUCT_CARD", "MODAL_DIALOG", "OTP_INPUT", "CHECKBOX_GROUP", "NONE"] },
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
                    state: { type: Type.STRING, enum: ['default', 'error', 'success', 'disabled'] },
                    items: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
            },
            documentation: {
               type: Type.OBJECT,
               properties: {
                  nonTechnical: { type: Type.STRING },
                  specificAccessibility: { type: Type.ARRAY, items: { type: Type.STRING } },
                  behavior: { type: Type.ARRAY, items: { type: Type.STRING } },
                  voiceOver: { type: Type.STRING },
                  nvda: { type: Type.STRING }
               },
               required: ["nonTechnical", "specificAccessibility", "behavior", "voiceOver", "nvda"]
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
                  },
                  required: ["title", "url"]
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
                   },
                   required: ["question", "options", "correctIndex", "successMessage", "failureMessage"]
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
  const prompt = `Genera un TEST de 10 preguntas.
  Dificultad: ${difficulty}.
  Tipo/Tema: ${type}.
  Idioma: ${langName}.
  
  Devuelve JSON array de objetos con: id, type, question, options (4 strings), correctAnswerIndex, explanation.`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      systemInstruction: getSystemInstruction(language),
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 0 },
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
          },
          required: ["id", "type", "question", "options", "correctAnswerIndex", "explanation"]
        }
      }
    }
  });

  return cleanAndParseJSON(response.text || "[]");
};

export const analyzeImage = async (base64Image: string, language: Language, userContext?: string): Promise<CheckerResult> => {
  const langName = getLanguageName(language);
  
  let prompt = `Analiza esta imagen. Si es una interfaz de usuario digital, genera la documentación de accesibilidad. Si no, marca isValidUI como false.`;
  
  if (userContext && userContext.trim()) {
    prompt += `\n\nContexto adicional proporcionado por el usuario sobre esta interfaz: "${userContext}". Tenlo en cuenta para mejorar la precisión y relevancia de las anotaciones.`;
  }

  prompt += `\n\nRespond in ${langName}.`;
  
  const response = await ai.models.generateContent({
    model: modelName,
    contents: {
      parts: [
        { inlineData: { mimeType: "image/jpeg", data: base64Image } },
        { text: prompt }
      ]
    },
    config: {
      systemInstruction: getCheckerSystemInstruction(language),
      thinkingConfig: { thinkingBudget: 0 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          isValidUI: { type: Type.BOOLEAN },
          layoutType: { type: Type.STRING, enum: ["simple", "complex"] },
          screenContext: {
             type: Type.OBJECT,
             properties: {
                device: { type: Type.STRING, description: "Desktop, Mobile, Tablet, Watch..." },
                screenType: { type: Type.STRING, description: "Dashboard, Login, Modal, Checkout, Landing..." },
                sector: { type: Type.STRING, description: "Banking, Retail, Health, Gov..." },
                description: { type: Type.STRING, description: "Breve descripción de lo que se ve en pantalla" },
                language: { type: Type.STRING, description: "Detected language of the UI text" },
                componentCount: { type: Type.INTEGER, description: "Estimated number of interactive components" }
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
                box_2d: { type: Type.ARRAY, items: { type: Type.NUMBER }, description: "Bounding box [ymin, xmin, ymax, xmax] 0-1000 scale" },
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
        },
        required: ["isValidUI", "layoutType", "globalAnnotations", "complexSections"]
      }
    }
  });

  return cleanAndParseJSON(response.text || "{}");
};

// Fix for ImageGenerationMode.tsx: Exported generateImage function using gemini-3-pro-image-preview.
export const generateImage = async (prompt: string, size: '1K' | '2K' | '4K' = '1K'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [
        {
          text: prompt,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
        imageSize: size
      },
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return part.inlineData.data;
    }
  }
  throw new Error("No image generated by the model");
};

// Fix for ImageEditorMode.tsx: Exported editImage function using gemini-2.5-flash-image.
export const editImage = async (base64Image: string, prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Image,
            mimeType: 'image/jpeg',
          },
        },
        {
          text: prompt,
        },
      ],
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return part.inlineData.data;
    }
  }
  throw new Error("No image generated from edit");
};
