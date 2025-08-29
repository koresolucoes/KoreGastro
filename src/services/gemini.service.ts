import { Injectable, signal } from '@angular/core';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// This is a workaround for the Applet environment where 'process' might not be defined by default.
declare var process: any;

@Injectable({ providedIn: 'root' })
export class GeminiService {
  private ai: GoogleGenAI | null = null;
  loading = signal(false);

  constructor() {
    // IMPORTANT: This relies on process.env.API_KEY being set in the execution environment.
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    } else {
      console.error("API_KEY environment variable not set. Gemini features will be disabled.");
    }
  }

  async suggestRecipe(prompt: string): Promise<string> {
    if (!this.ai) {
      return "Serviço de IA não está disponível. Verifique a configuração da chave de API no ambiente.";
    }

    this.loading.set(true);
    try {
      const fullPrompt = `Gere uma única e criativa sugestão de nome e uma breve descrição para um prato de restaurante baseado nesta ideia: "${prompt}". Responda em português. O formato da resposta deve ser EXATAMENTE: \nNOME DO PRATO: [Nome do Prato]\nDESCRIÇÃO: [Descrição do Prato]`;
      
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullPrompt
      });
      return response.text;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      return 'Ocorreu um erro ao gerar a sugestão. Por favor, tente novamente.';
    } finally {
      this.loading.set(false);
    }
  }
}
