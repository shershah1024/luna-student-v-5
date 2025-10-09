import { withCircuitBreaker } from "./circuit-breaker";
import { ExponentialBackoff } from "./api-middleware";

// Interface for Azure OpenAI response
interface AzureOpenAIResponse {
  choices: Array<{
    message?: {
      content: string;
    };
    text?: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Configuration for Azure OpenAI
interface AzureOpenAIConfig {
  endpoint: string;
  apiKey: string;
  apiVersion: string;
  deploymentName: string;
}

class AzureOpenAIService {
  private config: AzureOpenAIConfig | null = null;
  private backoff: ExponentialBackoff;

  constructor() {
    this.backoff = new ExponentialBackoff(1000, 10000, 3); // 1s base, 10s max, 3 retries
  }

  private initConfig() {
    if (!this.config) {
      this.config = {
        endpoint: process.env.AZURE_OPENAI_ENDPOINT || "",
        apiKey: process.env.AZURE_OPENAI_API_KEY || "",
        apiVersion:
          process.env.AZURE_OPENAI_API_VERSION || "2024-02-15-preview",
        deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "",
      };
    }
    return this.config;
  }

  private validateConfig(): boolean {
    const config = this.initConfig();
    return !!(config.endpoint && config.apiKey && config.deploymentName);
  }

  private buildUrl(endpoint: "chat/completions" | "completions"): string {
    const config = this.initConfig();
    return `${config.endpoint}/openai/deployments/${config.deploymentName}/${endpoint}?api-version=${config.apiVersion}`;
  }

  private async makeRequest(
    url: string,
    body: any,
  ): Promise<AzureOpenAIResponse> {
    const config = this.initConfig();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": config.apiKey,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();

        // Handle rate limiting from Azure
        if (response.status === 429) {
          const retryAfter = response.headers.get("retry-after");
          const error = new Error(
            `Azure OpenAI rate limited. Retry after: ${retryAfter}s`,
          );
          (error as any).code = "RATE_LIMITED";
          (error as any).retryAfter = retryAfter;
          throw error;
        }

        // Handle quota exceeded
        if (response.status === 403) {
          const error = new Error("Azure OpenAI quota exceeded");
          (error as any).code = "QUOTA_EXCEEDED";
          throw error;
        }

        throw new Error(
          `Azure OpenAI API error: ${response.status} - ${errorText}`,
        );
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === "AbortError") {
        const timeoutError = new Error("Azure OpenAI request timeout");
        (timeoutError as any).code = "TIMEOUT";
        throw timeoutError;
      }

      throw error;
    }
  }

  // Chat completions with protection
  async chatCompletion(
    messages: Array<{ role: string; content: string }>,
    options: {
      maxTokens?: number;
      temperature?: number;
      topP?: number;
      stream?: boolean;
    } = {},
  ): Promise<string> {
    if (!this.validateConfig()) {
      throw new Error("Azure OpenAI configuration missing or incomplete");
    }

    return withCircuitBreaker("azureOpenAI", async () => {
      return this.backoff.execute(async () => {
        const response = await this.makeRequest(
          this.buildUrl("chat/completions"),
          {
            messages,
            max_tokens: options.maxTokens || 1000,
            temperature: options.temperature || 0.7,
            top_p: options.topP || 1,
            stream: false, // We'll handle streaming separately if needed
          },
        );

        if (!response.choices || response.choices.length === 0) {
          throw new Error("No response from Azure OpenAI");
        }

        return response.choices[0].message?.content || "";
      });
    });
  }

  // Text completion with protection (for older models)
  async textCompletion(
    prompt: string,
    options: {
      maxTokens?: number;
      temperature?: number;
      topP?: number;
    } = {},
  ): Promise<string> {
    return withCircuitBreaker("azureOpenAI", async () => {
      return this.backoff.execute(async () => {
        const response = await this.makeRequest(this.buildUrl("completions"), {
          prompt,
          max_tokens: options.maxTokens || 1000,
          temperature: options.temperature || 0.7,
          top_p: options.topP || 1,
        });

        if (!response.choices || response.choices.length === 0) {
          throw new Error("No response from Azure OpenAI");
        }

        return response.choices[0].text || "";
      });
    });
  }

  // Simplified method for common use cases
  async generateText(
    systemPrompt: string,
    userPrompt: string,
    options: {
      maxTokens?: number;
      temperature?: number;
    } = {},
  ): Promise<string> {
    return this.chatCompletion(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      options,
    );
  }

  // Health check for monitoring
  async healthCheck(): Promise<{
    healthy: boolean;
    latency?: number;
    error?: string;
  }> {
    const start = Date.now();

    if (!this.validateConfig()) {
      return {
        healthy: false,
        error: "Azure OpenAI configuration missing or incomplete",
        latency: Date.now() - start,
      };
    }

    try {
      await this.chatCompletion([{ role: "user", content: "Test" }], {
        maxTokens: 1,
        temperature: 0,
      });

      return {
        healthy: true,
        latency: Date.now() - start,
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        latency: Date.now() - start,
      };
    }
  }
}

// Singleton instance
export const azureOpenAI = new AzureOpenAIService();

// Helper functions for common patterns
export async function generateInstruction(
  context: string,
  task: string,
  options?: { maxTokens?: number },
): Promise<string> {
  const systemPrompt = `You are a helpful assistant for a German language learning platform. 
Provide clear, educational responses that help students learn German effectively.`;

  const userPrompt = `Context: ${context}

Task: ${task}

Please provide a helpful response.`;

  return azureOpenAI.generateText(systemPrompt, userPrompt, options);
}

export async function evaluateUserResponse(
  exercise: string,
  userAnswer: string,
  correctAnswer: string,
  options?: { maxTokens?: number },
): Promise<string> {
  const systemPrompt = `You are a German language teacher evaluating student responses. 
Provide constructive feedback that helps students improve their German skills.`;

  const userPrompt = `Exercise: ${exercise}
Student Answer: ${userAnswer}
Correct Answer: ${correctAnswer}

Please evaluate the student's response and provide feedback.`;

  return azureOpenAI.generateText(systemPrompt, userPrompt, options);
}
