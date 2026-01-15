
import { GoogleGenAI, Modality } from "@google/genai";
import { GenerationParams, SupportedLanguage } from "../types.ts";

const APP_DOCUMENTATION = `
PyraGen 3D Tile Architect Documentation:
- Purpose: Generates 3D isometric architectural renders of pyramids made of stacked boxes/tiles.
- Controls:
  * Levels: Controls the height (2 to 15).
  * Base Scale: Controls horizontal scale (3x3 to 20x20).
  * Aesthetics: Patterns include Marble, Wood, Stone, Glass, Metal, Neon, Mosaic, Ceramic.
  * Studio Lighting: Direction and Intensity (10-100%).
  * Shadows: Toggle architectural shadows.
- AI Refinement: Users can prompt edits (e.g., "Add snow").
- Text-to-Speech: High-quality audio responses from the consultant.
`;

const getApiKey = () => {
  return typeof process !== 'undefined' ? process.env.API_KEY || "" : "";
};

export const generatePyramidImage = async (params: GenerationParams): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  const textPrompt = `
    A high-quality 3D isometric architectural render of a pyramid structure built from stacked 3D cubes/boxes.
    ${params.referenceImage ? "CRITICAL: Use the attached image as a geometric and stylistic guide." : ""}
    
    Structure Details:
    - Base: ${params.baseType} base, ${params.baseSize}x${params.baseSize} footprint.
    - Height: ${params.levels} tapering levels.
    - Tile/Box Material: ${params.pattern} texture.
    - Primary Color Scheme: ${params.tileColor}.
    - Lighting: ${params.lightDirection} lighting, ${params.lightIntensity}% intensity. 
    - Shadows: ${params.shadowsEnabled ? 'Sharp architectural shadows.' : 'Soft ambient lighting.'}
    - Style: Professional 3D studio render, sharp geometric edges, clean modern design.
    - Background: ${params.backgroundStyle}.
  `.trim();

  const parts: any[] = [{ text: textPrompt }];

  if (params.referenceImage) {
    const match = params.referenceImage.match(/^data:(image\/\w+);base64,(.+)$/);
    if (match) {
      parts.unshift({
        inlineData: {
          mimeType: match[1],
          data: match[2]
        }
      });
    }
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data found");
  } catch (error) {
    console.error("Gemini Image Generation Error:", error);
    throw error;
  }
};

export const editPyramidImage = async (base64Image: string, editPrompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const match = base64Image.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) throw new Error("Invalid image format");

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { mimeType: match[1], data: match[2] } },
          { text: `Edit this 3D architectural render based on this request: ${editPrompt}. Maintain the 3D pyramid structure but apply requested changes.` }
        ]
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No edited image data found");
  } catch (error) {
    console.error("Gemini Image Edit Error:", error);
    throw error;
  }
};

export const getChatResponse = async (userMessage: string, history: any[], language: SupportedLanguage = 'English') => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const chat = ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: `You are an expert architectural consultant for the PyraGen 3D Tile Architect app.
      CRITICAL: You must respond ONLY in ${language}.
      Use the documentation: ${APP_DOCUMENTATION}`,
    }
  });

  const response = await chat.sendMessage({ message: userMessage });
  return response.text;
};

export const generateSpeechData = async (text: string): Promise<string | null> => {
  if (!text || text.trim().length === 0) return null;
  const cleanText = text.replace(/[*_#`~>|]/g, '').trim();
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: cleanText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (err) {
    console.error("Speech generation error:", err);
    return null;
  }
};

export const playAudio = async (base64Audio: string, onEnded?: () => void) => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  const bytes = atob(base64Audio);
  const array = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) array[i] = bytes.charCodeAt(i);
  
  const dataInt16 = new Int16Array(array.buffer);
  const buffer = audioContext.createBuffer(1, dataInt16.length, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;

  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);
  if (onEnded) source.onended = onEnded;
  source.start();
  return { source, context: audioContext };
};
