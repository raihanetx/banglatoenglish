export interface TranscriptionItem {
  id: string;
  text: string;
  isUser: boolean; // true = Bengali input (Text), false = English translation
  timestamp: Date;
}

export enum RecorderState {
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  PROCESSING = 'PROCESSING',
  ERROR = 'ERROR',
}
