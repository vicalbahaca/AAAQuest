import { GoogleGenAI, Type } from "@google/genai";
import { Difficulty, TestType, CheckerResult, Language, StudyLesson, AdaptiveContext, TestQuestion } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const modelName = 'gemini-3-flash-preview';

// ============================================================================
// CONSTANTES CENTRALIZADAS
// ============================================================================
const LANGUAGE_NAMES: Record<Language, string> = {
  es: 'Español',
  en: 'English',
  zh: '中文',
  ru: 'Русский',
  hi: 'हिन्दी'
};

// ============================================================================
// PLANTILLAS DE PROMPTS REUTILIZABLES
// ============================================================================
const PROMPT_TEMPLATES = {
  roleContext: (language: Language) => 
    `You are an expert Accessibility Auditor (WCAG 2.1 AA+). Output strictly in ${LANGUAGE_NAMES[language]}.`,
  
  formatRules: `
CRITICAL FORMAT RULES:
- NO numbering (1., 2., 3.) in explanatory text
- NO section prefixes like "CONTEXT:", "CONCLUSION:", "REQUIREMENT:"
- Output only direct, clear sentences
- Use Markdown ONLY where explicitly required`,

  screenReaderInstructions: `
SCREEN READER OUTPUT FORMAT:
Mobile (VoiceOver/TalkBack):
- Gesture: [action]
- Output: "[exact speech]"

Desktop (NVDA):
- Key: [shortcut]
- Output: "[exact speech]"`,

  codeStructure: `
CODE REQUIREMENTS:
- Complete, valid, production-ready code
- Include all necessary ARIA attributes
- Follow platform conventions (HTML5, Swift, Kotlin/XML)
- Add inline comments for accessibility-critical parts`
};

// ============================================================================
// HELPERS
// ============================================================================
const cleanAndParseJSON = <T>(text: string, context: string = 'AI response'): T => {
  try {
    // Remove markdown code blocks
    let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Fix common JSON issues
    cleaned = cleaned
      // Fix unterminated strings by removing control characters
      .replace(/[\n\r\t]/g, ' ')
      // Fix multiple spaces
      .replace(/\s+/g, ' ')
      // Ensure proper string escaping
      .replace(/\\(?!["\\/bfnrt])/g, '\\\\');
    
    return JSON.parse(cleaned) as T;
  } catch (e) {
    console.error(`JSON Parse Error in ${context}:`, e);
    console.error('Raw text (first 500 chars):', text.substring(0, 500));
    console.error('Raw text (last 500 chars):', text.substring(Math.max(0, text.length - 500)));
    
    // Try to salvage partial JSON
    try {
      // Find the last complete object
      const lastBrace = text.lastIndexOf('}');
      if (lastBrace > 0) {
        const truncated = text.substring(0, lastBrace + 1);
        const cleanedTruncated = truncated
          .replace(/```json\n?/g, '').replace(/```\n?/g, '')
          .replace(/[\n\r\t]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        console.warn('Attempting to parse truncated JSON...');
        return JSON.parse(cleanedTruncated) as T;
      }
    } catch (salvageError) {
      console.error('Could not salvage JSON');
    }
    
    throw new Error(`Failed to parse ${context}. The AI response was incomplete or malformed.`);
  }
};

const getLanguageName = (language: Language): string => LANGUAGE_NAMES[language];

const getSystemInstruction = (language: Language): string => {
  const lang = getLanguageName(language);
  return `Expert in WCAG 2.1 AA+ accessibility. Train designers/developers. Output: ${lang}. Be concise, technical, actionable.`;
};

// ============================================================================
// NIVEL 1 HARDCODED (CURADO)
// ============================================================================
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
        { 
          question: "¿A quién beneficia la accesibilidad digital?", 
          options: ["Solo personas ciegas", "A toda la sociedad", "Solo personas mayores", "Solo programadores"], 
          correctIndex: 1, 
          successMessage: "¡Correcto! La accesibilidad beneficia a todos.", 
          failureMessage: "Piénsalo bien. La accesibilidad no es solo para un grupo específico." 
        }
    ]
};

// ============================================================================
// FUNCIONES EXPORTADAS
// ============================================================================

/**
 * Explica un concepto técnico de accesibilidad de forma simple
 */
export const explainConceptSimply = async (
  phrase: string, 
  topic: string, 
  language: Language
): Promise<string> => {
  const langName = getLanguageName(language);
  
  const prompt = `Context: Student learning "${topic}" accessibility basics.
Technical phrase: "${phrase}"

Task: Explain in simple ${langName} (B2 level, age 10+).
- Max 2 short paragraphs
- Use friendly tone & analogies
- Avoid jargon`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: 200,
    }
  });

  return response.text || "No explanation generated.";
};

/**
 * Genera una lección de estudio adaptada al nivel
 */
export const generateStudyLesson = async (
  level: number, 
  language: Language, 
  context?: AdaptiveContext
): Promise<StudyLesson> => {
  const langName = getLanguageName(language);
  
  if (level === 1) return LEVEL_1_LESSON_ES;

  const difficulty = level <= 10 
    ? "Advanced technical: Complex ARIA, dynamic states" 
    : "Expert: Widgets, Live Regions, edge cases";

  const prompt = `Generate Level ${level} accessibility lesson (${langName}).
Difficulty: ${difficulty}
${context ? `Adaptive: User scored ${context.lastScore}%, trend: ${context.trend}` : ''}

LESSON STRUCTURE:
1. Topic & intro (clear, motivating)
2. 4 learning pills (title, description, icon name)
3. Visual component demo with props
4. **DOCUMENTATION** (critical):
   - nonTechnical: Role, State, Expected Behavior (Markdown)
   - codeExamples: Complete HTML, Swift, XML/Kotlin
   - mobileScreenReader: VoiceOver/TalkBack gestures & speech output
   - desktopScreenReader: NVDA keys & speech output
5. Do's & Don'ts (4 each, short)
6. 1 external resource (W3C/MDN preferred)
7. 1 test question (4 options)

${PROMPT_TEMPLATES.formatRules}
${PROMPT_TEMPLATES.codeStructure}
${PROMPT_TEMPLATES.screenReaderInstructions}

Return strict JSON matching schema.`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      systemInstruction: getSystemInstruction(language),
      responseMimeType: "application/json",
      maxOutputTokens: 8192,
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
                  icon: { type: Type.STRING } 
                },
                required: ["title", "description", "icon"]
              } 
            },
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
         required: ["level", "topicTag", "introTitle", "introSubtitle", "learningPills", 
                   "visualComponent", "documentation", "goodPractices", "badPractices", 
                   "externalResources", "test"]
      }
    }
  });

  return cleanAndParseJSON<StudyLesson>(response.text || "{}", 'Study Lesson');
};

/**
 * Genera preguntas de test según dificultad y tipo
 */
export const generateTest = async (
  difficulty: Difficulty, 
  type: TestType, 
  language: Language
): Promise<TestQuestion[]> => {
  const langName = getLanguageName(language);
  
  const prompt = `10 ${difficulty} questions on "${type}" accessibility (${langName}).
Format: Multiple choice, 4 options, 1 correct.
Include brief explanation for each.`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      systemInstruction: getSystemInstruction(language),
      responseMimeType: "application/json",
      maxOutputTokens: 2500,
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
  
  return cleanAndParseJSON<TestQuestion[]>(response.text || "[]", 'Test Questions');
};

/**
 * Analiza una imagen UI para auditoría de accesibilidad
 */
export const analyzeImage = async (
  base64Image: string, 
  language: Language, 
  userContext?: string
): Promise<CheckerResult> => {
  const langName = getLanguageName(language);

  const prompt = `Analyze UI for WCAG 2.1 AA (${langName}).
${userContext ? `Context: ${userContext}` : ''}

JSON RULES: Keep text concise. Max 80 chars per string. No line breaks.

OUTPUT:

1. SCREEN CONTEXT (screenContext)
- screenType: Describe the PURPOSE (e.g., "Generacion de extracto", "Perfil de usuario", "Formulario de pago")
- description: Brief context

2. VIEW TITLE (viewTitle array)
CRITICAL RULES:
- For normal screens: Use the H1 text with minimal context. Example: "Generar Extracto EUR"
- For modals: State "Modal sobre [main screen title]" + modal's title
- For elements without native title: State "Este elemento no requiere title" + suggest one
- Output ONE clear sentence only

3. STRUCTURE (structure array)
Always include native mobile elements:
- "Menu nativo superior" (if present)
- "Main: [content description]"
- "Footer fijo inferior" (if fixed bottom button/nav present)

4. HEADINGS (heading array)
List all h1-h6 detected with format "hN: Text"

5. FOCUS ORDER (focusOrder array)
List EVERY interactive element separately.
Format: "N. [Type] - [Label]"
Examples:
"1. Button - Volver"
"2. Heading - EUR Extracto"
"3. Tab - PDF"

6. COMPLEX SECTIONS (complexSections array)
ONE element = ONE section.

Each section needs:
- regionTitle: Descriptive element name
- box_2d: [ymin, xmin, ymax, xmax] (scale 0-1000, min 50 units) - MANDATORY
- categories:
  * generalSpecific: ["role: X", "Alt/label: Y"] OR ["role: X", "label: Y"] if no alt
  * behavior: 
    - Keyboard: NEVER use "Deslizar". Use "Enter/Space", "Tab", "Flechas", "Esc"
    - Action: Be specific (e.g., "Regresa a pantalla anterior", "Ajusta posicion horizontalmente")
  * alt: 
    - For icons/images WITH decorative purpose: ["alt: \"\""]
    - For icons/images WITH informative purpose: ["alt: description"]
    - For elements WITHOUT icons/images: [] (empty array)
  * grouped: [] (ONLY for actual form groups like radio buttons, otherwise EMPTY)

ALT RULES (CRITICAL):
- Icon buttons: Combine in generalSpecific as "Alt/label: X"
- Decorative icons: alt array contains ["alt: \"\""]
- No icon/image: alt array is EMPTY []
- NEVER put "Decorative" as text, use alt: ""

KEYBOARD RULES:
- Pickers/Selectors: "Flechas" (not "Deslizar")
- Buttons: "Enter/Space"
- Tabs: "Flechas"

GROUPED RULES:
- ONLY use for semantic groups (radio buttons in same fieldset, related checkboxes)
- DO NOT use for visual grouping
- Most elements: [] (empty)

Example correct output:
{
  "regionTitle": "Boton Volver",
  "categories": {
    "generalSpecific": ["role: button", "Alt/label: Volver"],
    "behavior": ["Keyboard: Enter/Space", "Action: Regresa a pantalla anterior"],
    "alt": [],
    "grouped": []
  }
}

{
  "regionTitle": "Selector de Periodo",
  "categories": {
    "generalSpecific": ["role: button", "label: Periodo Mes"],
    "behavior": ["Keyboard: Enter", "Action: Abre menu de seleccion"],
    "alt": ["alt: \"\""],
    "grouped": []
  }
}

Return valid JSON.`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: { 
      parts: [
        { inlineData: { mimeType: "image/jpeg", data: base64Image } }, 
        { text: prompt }
      ] 
    },
    config: {
      systemInstruction: PROMPT_TEMPLATES.roleContext(language),
      responseMimeType: "application/json",
      maxOutputTokens: 8192,
      temperature: 0.3,
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
                  },
                  required: ["viewTitle", "structure", "heading", "focusOrder"]
              },
              complexSections: {
                  type: Type.ARRAY,
                  items: {
                      type: Type.OBJECT,
                      properties: {
                          regionTitle: { type: Type.STRING },
                          box_2d: { 
                              type: Type.ARRAY, 
                              items: { type: Type.INTEGER },
                              description: "MANDATORY: [ymin, xmin, ymax, xmax] scale 0-1000"
                          },
                          categories: {
                              type: Type.OBJECT,
                              properties: {
                                  generalSpecific: { type: Type.ARRAY, items: { type: Type.STRING } },
                                  behavior: { type: Type.ARRAY, items: { type: Type.STRING } },
                                  alt: { type: Type.ARRAY, items: { type: Type.STRING } },
                                  grouped: { type: Type.ARRAY, items: { type: Type.STRING } }
                              },
                              required: ["generalSpecific", "behavior", "alt", "grouped"]
                          }
                      },
                      required: ["regionTitle", "box_2d", "categories"]
                  }
              }
          },
          required: ["isValidUI", "layoutType", "screenContext", "globalAnnotations", "complexSections"]
      }
    }
  });
  
  return cleanAndParseJSON<CheckerResult>(response.text || "{}", 'Image Analysis');
};

/**
 * Genera una imagen usando Gemini
 */
export const generateImage = async (
  prompt: string, 
  size: '1K' | '2K' | '4K' = '1K'
): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts: [{ text: prompt }] },
    config: { imageConfig: { aspectRatio: "1:1", imageSize: size } },
  });
  
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) return part.inlineData.data;
  }
  
  throw new Error("No image generated");
};

/**
 * Edita una imagen existente
 */
export const editImage = async (
  base64Image: string, 
  prompt: string
): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { 
      parts: [
        { inlineData: { data: base64Image, mimeType: 'image/jpeg' } }, 
        { text: prompt }
      ] 
    },
  });
  
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) return part.inlineData.data;
  }
  
  throw new Error("No image edited");
};
