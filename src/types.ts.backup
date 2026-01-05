// Types for WhatsApp Bot Cloudflare Worker

export interface Env {
  API_KEY: string;
  BASE_URL: string;
  SESSION: string;
  OPENROUTER_KEY: string;
  'db-tugas': D1Database;
  [key: string]: any;
}

export interface WorkerEnv {
  APIkey: string;
  baseUrl: string;
  session: string;
  openrouterKey: string;
}

export interface WhatsAppEvent {
  event: string;
  payload: WhatsAppPayload;
}

export interface WhatsAppPayload {
  from: string;
  body: string;
  participant?: string;
  id: string;
  [key: string]: any;
}

export interface GroupPayload {
  type: string;
  group: {
    id: string;
  };
  participants: Participant[];
}

export interface Participant {
  id: string;
}

export interface Command {
  command: string;
  description: string;
}

export interface Feature {
  icon: string;
  title: string;
  description: string;
}

export interface Pantun {
  [index: number]: string[];
}

export interface DoaHarian {
  title: string;
  arabic: string;
  latin: string;
  translation: string;
}

export interface MathQuestion {
  question: string;
  answer: number;
  options: number[];
}

export interface ToxicResult {
  isToxic: boolean;
  found: string[];
}

export interface BitcoinPriceResponse {
  bitcoin?: {
    usd?: number;
    idr?: number;
  };
}

export interface SendTextRequest {
  chatId: string;
  text: string;
  session: string;
  reply_to?: string;
  header?: string;
  body?: string;
  footer?: string;
  buttons?: Button[];
  mentions?: string[];
}

export interface Button {
  type: 'reply' | 'call' | 'copy' | 'url';
  text: string;
  phoneNumber?: string;
  copyCode?: string;
  url?: string;
}

export interface SendTextResponse {
  status: string;
  sent?: SendTextRequest;
  apiResult?: string;
  result?: any;
  error?: string;
  priceUsd?: number;
  priceIdr?: number;
  questions?: MathQuestion[];
}

export interface WelcomeMessageResponse {
  status: string;
}

export interface HelpResponse {
  status: string;
  result: any;
}