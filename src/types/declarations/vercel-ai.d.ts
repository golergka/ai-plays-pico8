declare module '@vercel/ai' {
  export interface ChatOptions {
    model: string;
    memoize?: boolean;
    temperature?: number;
    maxTokens?: number;
  }
  
  export class Chat {
    constructor(options: ChatOptions);
    send(message: string): Promise<string>;
  }
}