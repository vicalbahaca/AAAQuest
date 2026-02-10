
import { GoogleGenAI, Type } from "@google/genai";
import { Difficulty, TestType, CheckerResult, Language, StudyLesson, AdaptiveContext, TestQuestion, TRANSLATIONS, VisualComponentType } from "../types";

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

const LEVEL_SPECS: Record<number, { name: string, visual: VisualComponentType, description: string, label: string, prop: string }> = {
  1: { name: "Button", visual: "M3_BUTTON", description: "Basic CTA button", label: "Enviar Formulario", prop: "buttonText" },
  2: { name: "Checkbox", visual: "M3_CHECKBOX", description: "Single or group checkbox", label: "Acepto los términos y condiciones", prop: "items" },
  3: { name: "Carousel", visual: "NONE", description: "Product carousel with multiple visible items", label: "Productos relacionados", prop: "ariaLabel" },
  4: { name: "Link", visual: "NONE", description: "Text link and icon link", label: "Ir a la página de ayuda", prop: "label" },
  5: { name: "Text Field", visual: "M3_TEXT_FIELD", description: "Material design input", label: "Correo electrónico", prop: "label" },
  6: { name: "List", visual: "NONE", description: "Unordered/ordered with semantic structure", label: "Lista de tareas", prop: "label" },
  7: { name: "Radio Button", visual: "M3_RADIO_GROUP", description: "Group with exclusive selection", label: "Opción Premium", prop: "items" },
  8: { name: "Tabs", visual: "NONE", description: "Navigation with panel switching", label: "Mi Perfil", prop: "label" },
  9: { name: "Loader", visual: "NONE", description: "Spinner with live region announcements", label: "Cargando contenido", prop: "ariaLabel" },
  10: { name: "Switch", visual: "M3_SWITCH", description: "Toggle with on/off states", label: "Activar modo oscuro", prop: "label" }
};

// ============================================================================
// HELPERS
// ============================================================================
const cleanAndParseJSON = <T>(text: string, context: string = 'AI response'): T => {
  try {
    let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    cleaned = cleaned
      .replace(/[\n\r\t]/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/\\(?!["\\/bfnrt])/g, '\\\\');
    
    return JSON.parse(cleaned) as T;
  } catch (e) {
    console.error(`JSON Parse Error in ${context}:`, e);
    try {
      const lastBrace = text.lastIndexOf('}');
      if (lastBrace > 0) {
        const truncated = text.substring(0, lastBrace + 1);
        return JSON.parse(truncated) as T;
      }
    } catch (salvageError) {}
    throw new Error(`Failed to parse ${context}.`);
  }
};

const getLanguageName = (language: Language): string => LANGUAGE_NAMES[language];

const getSystemInstruction = (language: Language): string => {
  const lang = getLanguageName(language);
  return `You are an expert Accessibility Auditor (WCAG 2.1 AA+). Output strictly in ${lang}. Your mission is to train designers/developers with PERFECT CONSISTENCY between visual examples, code, and screen reader output.`;
};

// ============================================================================
// PROMPT BUILDER
// ============================================================================
const buildLessonPrompt = (level: number, language: Language, context?: AdaptiveContext): string => {
  const spec = LEVEL_SPECS[level] || LEVEL_SPECS[1];
  const langName = getLanguageName(language);
  
  // Specific instructions per level
  let specificInstructions = "";
  if (level === 3) {
     specificInstructions = `
**SPECIAL CASE: CAROUSEL (Level 3)**
- Carousel Type: Product carousel with multiple visible items (3 visible, 6 total).
- Key Features:
  1. Use 'inert' attribute on hidden products (items 4-6).
  2. Implement navigation buttons (Previous/Next) with proper ARIA labels.
  3. Add live region for announcing navigation changes.
  4. Focus management: when reaching end, move focus to opposite arrow.
  5. Visible range indicator: "Mostrando productos 1 a 3 de 6".
- ARIA Structure:
  <section aria-roledescription="carrusel" aria-label="${spec.label}">
    <div role="group" aria-roledescription="slide" aria-label="Productos 1 a 3 de 6">...</div>
    <div inert>...</div>
    <div aria-live="polite" class="sr-only"></div>
  </section>
`;
  }

  // Construct prop specific prompt
  let propInstruction = "";
  if (spec.prop === 'items') {
      propInstruction = `Set 'visualComponentProps.items' to ["${spec.label}"].`;
  } else {
      propInstruction = `Set 'visualComponentProps.${spec.prop}' to "${spec.label}".`;
  }

  return `
CRITICAL MISSION: Generate a comprehensive accessibility lesson for Level ${level} (${spec.name}).
Language: ${langName}
Visual Component to generate: ${spec.visual} (${spec.description})
${context ? `User Context: Last Score ${context.lastScore}%, Trend ${context.trend}` : ''}

${specificInstructions}

**CRITICAL RULES (MUST FOLLOW):**
1. **NO 'dp' UNITS**: NEVER mention "dp". ALWAYS use "píxeles" or "px".
2. **MARKDOWN HEADERS**: In 'documentation.nonTechnical', use '###' for these exact sections:
   - ### ¿Qué es este componente?
   - ### Rol y Elemento Nativo
   - ### Nombre Accesible
   - ### Estados del Componente
   - ### Comportamiento y Contexto de Uso
3. **EXACT LABEL CONSISTENCY**: The label "${spec.label}" MUST be used identically in:
   - visualComponentProps
   - HTML code (<label> or aria-label)
   - Swift code (accessibilityLabel)
   - Android code (android:text or contentDescription)
   - Screen Reader outputs ("${spec.label}, ...")

STEP 1: VISUAL COMPONENT PROPS
Set 'visualComponent' to "${spec.visual}".
${propInstruction}
If the component is M3_BUTTON, set 'buttonText' to "${spec.label}".
If the component is M3_TEXT_FIELD, set 'label' to "${spec.label}".
If the component is M3_CHECKBOX or M3_RADIO_GROUP, set 'items' array containing "${spec.label}".
If the component is M3_SWITCH, set 'label' to "${spec.label}".

STEP 2: NON-TECHNICAL DOCUMENTATION (Markdown)
Write clear explanations using the ### headers defined above.
Explain the importance of the specific label "${spec.label}".

STEP 3: CODE EXAMPLES
Generate COMPLETE, PRODUCTION-READY code in 3 platforms.
**CRITICAL**: Use "${spec.label}" in the code.

<!-- HTML Example -->
<button>${spec.label}</button> or <label>${spec.label}</label>

<!-- iOS Example (Swift) -->
button.setTitle("${spec.label}", ...) or accessibilityLabel = "${spec.label}"

<!-- Android Example (XML) -->
android:text="${spec.label}" or android:contentDescription="${spec.label}"

STEP 4: SCREEN READER DOCUMENTATION (Markdown)

**Mobile (VoiceOver/TalkBack)**:
- Gesto: [Specific Gesture]
- Salida: "${spec.label}, [ROLE], [STATE]"

**Desktop (NVDA)**:
- Tecla: [Specific Key]
- Salida: "[ROLE], ${spec.label}, [STATE]"

STEP 5: TEST QUESTIONS
Generate EXACTLY 3 questions.

Output strict JSON matching the StudyLesson schema.
`;
};

// ============================================================================
// FUNCIONES EXPORTADAS
// ============================================================================

export const explainConceptSimply = async (
  phrase: string, 
  topic: string, 
  language: Language
): Promise<string> => {
  const langName = getLanguageName(language);
  const prompt = `Context: Student learning "${topic}". Explain "${phrase}" in simple ${langName} (B2 level). Max 2 paragraphs. Avoid jargon.`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: { temperature: 0.7, maxOutputTokens: 200 }
  });

  return response.text || "No explanation generated.";
};

export const generateStudyLesson = async (
  level: number, 
  language: Language, 
  context?: AdaptiveContext
): Promise<StudyLesson> => {
  const prompt = buildLessonPrompt(level, language, context);

  const aiResponse = await ai.models.generateContent({
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
            visualComponent: { 
              type: Type.STRING, 
              enum: ['M3_TEXT_FIELD', 'M3_BUTTON', 'M3_CARD', 'M3_SWITCH', 'M3_CHIPS', 'M3_CHECKBOX', 'M3_RADIO_GROUP', 'M3_FAB', 'NONE']
            },
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
                    items: { type: Type.ARRAY, items: { type: Type.STRING } },
                    secondaryText: { type: Type.STRING },
                    checked: { type: Type.BOOLEAN },
                    iconName: { type: Type.STRING }
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

  const parsedLesson = cleanAndParseJSON<StudyLesson>(aiResponse.text || "{}", 'Study Lesson');

  if (!parsedLesson.test || parsedLesson.test.length !== 3) {
    if (parsedLesson.test && parsedLesson.test.length > 3) {
      parsedLesson.test = parsedLesson.test.slice(0, 3);
    }
    while (!parsedLesson.test || parsedLesson.test.length < 3) {
      if (!parsedLesson.test) parsedLesson.test = [];
      parsedLesson.test.push({
        question: "Review Question",
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctIndex: 0,
        successMessage: "Correct",
        failureMessage: "Review content"
      });
    }
  }

  return parsedLesson;
};

export const generateTest = async (
  difficulty: Difficulty, 
  type: TestType, 
  language: Language
): Promise<TestQuestion[]> => {
  const langName = getLanguageName(language);
  const prompt = `10 ${difficulty} questions on "${type}" accessibility (${langName}). Multiple choice, 4 options, 1 correct. Include brief explanation.`;

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

export const analyzeImage = async (
  base64Image: string, 
  language: Language, 
  userContext?: string
): Promise<CheckerResult> => {
  const langName = getLanguageName(language);
  const prompt = `Analyze UI for WCAG 2.1 AA (${langName}). ${userContext ? `Context: ${userContext}` : ''}. Output valid JSON compatible with CheckerResult type.

CRITICAL VISUAL DETECTION RULES:
- Treat icon-only controls as interactive buttons or links when they appear in common UI positions or affordances.
- Explicitly detect: back arrow (often top-left), close "X" (often top-right), kebab/menu, search, share, edit, settings, filter, and chevron navigation.
- If an icon looks tappable (inside a circle, pill, or with hover/pressed states), assume it is a control and note required accessible name (e.g., "Back", "Close").
- Flag missing labels for icon-only buttons and insufficient touch target size.
- Consider top app bars/headers: leading icon = Back, trailing icon = Close or overflow, unless context contradicts.`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: { 
      parts: [
        { inlineData: { mimeType: "image/jpeg", data: base64Image } }, 
        { text: prompt }
      ] 
    },
    config: {
      systemInstruction: getSystemInstruction(language),
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
                          box_2d: { type: Type.ARRAY, items: { type: Type.INTEGER } },
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

export const generateImage = async (prompt: string, size: '1K' | '2K' | '4K' = '1K'): Promise<string> => {
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

export const editImage = async (base64Image: string, prompt: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ inlineData: { data: base64Image, mimeType: 'image/jpeg' } }, { text: prompt }] },
  });
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) return part.inlineData.data;
  }
  throw new Error("No image edited");
};
