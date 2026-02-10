
export type AspectRatio = '1:1' | '4:3' | '16:9' | '9:16' | '3:4';
export type Unit = 'px' | 'in' | 'cm' | 'mm';

export interface EditHistoryItem {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}

export enum EditMode {
  REMOVE = 'REMOVE',
  ADD_OBJECT = 'ADD_OBJECT',
  BACKGROUND = 'BACKGROUND',
  EXPAND = 'EXPAND',
  CUSTOM = 'CUSTOM',
  BEAUTY = 'BEAUTY',
  FACE_SWAP = 'FACE_SWAP',
  COMPOSER = 'COMPOSER'
}

export interface ToolConfig {
  id: EditMode;
  name: string;
  icon: string;
  placeholder: string;
  description: string;
  systemPrompt?: string;
}
