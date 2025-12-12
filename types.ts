export enum AspectRatio {
  SQUARE = '1:1',
  LANDSCAPE = '16:9',
  PORTRAIT = '9:16',
  WIDE = '21:9',
  FOUR_THREE = '4:3'
}

export interface GenerationConfig {
  prompt: string;
  ratio: AspectRatio;
  scale: number; // 0.1 to 1.0 (how much space the original image takes)
}

export interface GeneratedResult {
  imageUrl: string;
  prompt: string;
  timestamp: number;
}
