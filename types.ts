
export const TilePattern = {
  MARBLE: 'Marble',
  WOOD: 'Polished Wood',
  STONE: 'Rough Stone',
  GLASS: 'Frosted Glass',
  METAL: 'Brushed Steel',
  NEON: 'Glowing Neon',
  MOSAIC: 'Colorful Mosaic',
  CERAMIC: 'Glazed Ceramic'
} as const;

export type TilePattern = typeof TilePattern[keyof typeof TilePattern];

export const PyramidBase = {
  SQUARE: 'Square',
  TRIANGULAR: 'Triangular'
} as const;

export type PyramidBase = typeof PyramidBase[keyof typeof PyramidBase];

export type LightDirection = 'Top-Down' | 'Side-lit' | 'Frontal' | 'High-Contrast';

export type SupportedLanguage = 'English' | 'Chinese' | 'Spanish' | 'Korean';

export interface GenerationParams {
  levels: number;
  baseSize: number;
  tileColor: string;
  pattern: TilePattern;
  baseType: PyramidBase;
  backgroundStyle: string;
  lightDirection: LightDirection;
  lightIntensity: number;
  shadowsEnabled: boolean;
  referenceImage?: string; // Base64 encoded image
}

export interface GenerationHistory {
  id: string;
  imageUrl: string;
  params: GenerationParams;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  audioBase64?: string;
}
