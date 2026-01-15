
import { GoogleGenAI, Modality } from "@google/genai";
import { GenerationParams, SupportedLanguage } from "../types";

const APP_DOCUMENTATION = `
PyraGen 3D Tile Architect Documentation:
- Purpose: Generates 3D isometric architectural renders of pyramids made of stacked boxes/tiles.
- Controls:
  * Levels: Controls the height of the pyramid (2 to 15 levels).
  * Base Scale: Controls the horizontal footprint (3x3 to 20x20 scale).
  * Base Geometry: Choose between Square or Triangular bases.
  * Tile Aesthetics: Patterns include Marble, Polished Wood, Rough Stone, Frosted Glass, Brushed Steel, Glowing Neon, Colorful Mosaic, and Glazed Ceramic.
  * Colors: Custom hex colors can be applied to the tiles.
  * Studio Lighting: Directions include Top-Down, Side-lit, Frontal, and High-Contrast. Intensity ranges from 10% to 100%. Shadows can be toggled On/Off.
  * Background Environment: Users can describe custom settings like "Space", "Lush Jungle", or "Cyberpunk City".
  * Image Guide: Users can upload a reference image to influence the geometry and style of the generation.
- Features:
  * Image Editing: Once generated, use the prompt box below the image to refine it (e.g., "Add rain", "Change tiles to gold").
  * Text-to-Speech: The consultant provides high-quality audio responses.
  * History: Previous designs are saved in the sidebar for the current session.
`;

export const generatePyramidImage = async (params: GenerationParams): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  
  const textPrompt = `
    A high-quality 3D isometric architectural render of a pyramid structure built from stacked 3D cubes/boxes.
    ${params.referenceImage ? "CRITICAL: Use the attached image as a geometric and stylistic guide for the composition and perspective." : ""}
    
    Structure Details:
    - Base: ${params.baseType} base with a ${params.baseSize}x${params.baseSize} dimension.
    - Height: ${params.levels} levels of stacked boxes tapering upwards.
    - Tile/Box Material: ${params.pattern} texture.
    - Primary Color Scheme: ${params.tileColor}.
    - Lighting: ${params.lightDirection} lighting with ${params.lightIntensity}% intensity. 
    - Shadows: ${params.shadowsEnabled ? 'Sharp architectural shadows enabled.' : 'Soft ambient lighting, minimal shadows.'}
    - Style: Precise geometric alignment, professional 3D studio lighting, sharp edges.
    - Background: ${params.backgroundStyle}.
    - Mood: Clean, architectural, modern design aesthetic.
    
    The resulting image MUST look like individual tiles or bricks neatly stacked to form a pyramid, but inspired by the guide if provided.
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
    
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Gemini Image Generation Error:", error);
    throw error;
  }
};

export const editPyramidImage = async (base64Image: string, editPrompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  
  const match = base64Image.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) throw new Error("Invalid image format");
  const mimeType = match[1];
  const data = match[2];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { mimeType, data } },
          { text: `Edit this 3D architectural render based on this request: ${editPrompt}. Maintain the 3D pyramid structure but apply the changes requested.` }
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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  const chat = ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: `You are an expert architectural consultant for the PyraGen 3D Tile Architect app.
      CRITICAL: You must respond ONLY in the following language: ${language}.
      
      Use the following documentation to help users understand how to use the app and what its capabilities are:
      ${APP_DOCUMENTATION}
      
      Always be professional, helpful, and concise. If a user asks about a feature not mentioned, politely explain you are focused on 3D pyramid tile architecture.`,
    }
  });

  const response = await chat.sendMessage({ message: userMessage });
  return response.text;
};

export const generateSpeechData = async (text: string): Promise<string | null> => {
  if (!text || text.trim().length === 0) return null;
  
  // Strip Markdown and LaTeX for smoother TTS and to prevent some 500 errors
  const cleanText = text
    .replace(/[*_#`~>|]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\$\$[\s\S]*?\$\$/g, '')
    .replace(/\$[\s\S]*?\$/g, '')
    .replace(/\\begin\{.*?\}/g, '')
    .replace(/\\end\{.*?\}/g, '')
    .trim();

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
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

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) {
      console.warn("Speech generation returned empty audio data.");
      return null;
    }
    return audioData;
  } catch (err) {
    console.error("Speech generation error detail:", err);
    return null;
  }
};

export const playAudio = async (base64Audio: string, onEnded?: () => void) => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  const bytes = atob(base64Audio);
  const len = bytes.length;
  const array = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    array[i] = bytes.charCodeAt(i);
  }
  
  const dataInt16 = new Int16Array(array.buffer);
  const buffer = audioContext.createBuffer(1, dataInt16.length, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }

  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);
  if (onEnded) source.onended = onEnded;
  source.start();
  return { source, context: audioContext };
};
