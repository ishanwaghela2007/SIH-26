import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface OllamaResponse {
  message?: { content?: string };
}

@Injectable()
export class OllamaClient {
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(config: ConfigService) {
    this.baseUrl = config
      .getOrThrow<string>('OLLAMA_BASE_URL')
      .replace(/\/$/, '');
    this.model = config.getOrThrow<string>('OLLAMA_MODEL');
    this.timeoutMs = config.get<number>('OLLAMA_TIMEOUT_MS', 30_000);
  }

  getModel(): string {
    return this.model;
  }

  async chat(system: string, user: string): Promise<Record<string, unknown>> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          stream: false,
          format: 'json',
          options: { temperature: 0 },
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new ServiceUnavailableException('LANGUAGE_MODEL_UNAVAILABLE');
      }

      const body = (await response.json()) as OllamaResponse;
      const content = body.message?.content;
      if (!content) {
        throw new ServiceUnavailableException(
          'INVALID_LANGUAGE_MODEL_RESPONSE',
        );
      }

      try {
        const parsed = JSON.parse(content) as unknown;
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new Error('not an object');
        }
        return parsed as Record<string, unknown>;
      } catch {
        throw new ServiceUnavailableException(
          'INVALID_LANGUAGE_MODEL_RESPONSE',
        );
      }
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      throw new ServiceUnavailableException('LANGUAGE_MODEL_UNAVAILABLE');
    } finally {
      clearTimeout(timeout);
    }
  }

  async isReady(): Promise<boolean> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: controller.signal,
      });
      return response.ok;
    } catch {
      return false;
    } finally {
      clearTimeout(timeout);
    }
  }
}
