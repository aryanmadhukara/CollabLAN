// WebLLM offline AI - loads a small model for code explanation
// Uses WebGPU when available, falls back gracefully

import type { MLCEngine, ChatCompletionMessageParam } from '@mlc-ai/web-llm';

let engine: MLCEngine | null = null;
let isLoading = false;
let loadProgress = 0;

type ProgressCallback = (progress: number, status: string) => void;

const MODEL_ID = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC';

export async function initWebLLM(onProgress?: ProgressCallback): Promise<boolean> {
  if (engine) return true;
  if (isLoading) return false;

  // Check WebGPU support
  if (!navigator.gpu) {
    console.warn('[WebLLM] WebGPU not supported in this browser');
    return false;
  }

  isLoading = true;
  try {
    const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
    
    engine = await CreateMLCEngine(MODEL_ID, {
      initProgressCallback: (report) => {
        loadProgress = report.progress;
        onProgress?.(report.progress, report.text);
      },
    });
    
    isLoading = false;
    return true;
  } catch (err) {
    console.error('[WebLLM] Failed to initialize:', err);
    isLoading = false;
    return false;
  }
}

export function getLoadProgress() {
  return loadProgress;
}

export function isModelLoaded() {
  return engine !== null;
}

export function isModelLoading() {
  return isLoading;
}

export async function ensureWebLLMReady(onProgress?: ProgressCallback): Promise<boolean> {
  if (engine) return true;
  return initWebLLM(onProgress);
}

async function runCompletion(messages: ChatCompletionMessageParam[], options?: { temperature?: number; max_tokens?: number }) {
  if (!engine) {
    throw new Error('Model not loaded. Call initWebLLM() first.');
  }

  const reply = await engine.chat.completions.create({
    messages,
    temperature: options?.temperature ?? 0.4,
    max_tokens: options?.max_tokens ?? 400,
  });

  return reply.choices[0]?.message?.content || 'No response generated.';
}

export async function explainCode(code: string, language: string): Promise<string> {
  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `You are a helpful code tutor. Explain code clearly and concisely in 2-4 sentences. Focus on what the code does, not line-by-line. Use simple language.`,
    },
    {
      role: 'user',
      content: `Explain this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``,
    },
  ];

  return runCompletion(messages, {
    temperature: 0.3,
    max_tokens: 300,
  });
}

export async function generateAISummary(tasks: { title: string; status: string; assignee: string }[]): Promise<string> {
  const taskList = tasks.map(t => `- ${t.title} (${t.status}, assigned to ${t.assignee})`).join('\n');

  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: 'You are a project manager. Provide a brief work summary with progress insights.',
    },
    {
      role: 'user',
      content: `Summarize this team's progress:\n\n${taskList}`,
    },
  ];

  return runCompletion(messages, {
    temperature: 0.4,
    max_tokens: 400,
  });
}

export async function chatWithWorkspaceAssistant({
  prompt,
  recentMessages,
  tasks,
  currentUser,
  peerCount,
  history = [],
}: {
  prompt: string;
  recentMessages: Array<{ sender: string; text: string; timestamp: number }>;
  tasks: Array<{ title: string; description: string; status: string; assignee: string; lastEdited: string }>;
  currentUser: { name: string };
  peerCount: number;
  history?: ChatCompletionMessageParam[];
}): Promise<string> {
  const taskSummary = tasks.length
    ? tasks
        .slice(0, 10)
        .map(task => {
          const description = task.description ? ` Description: ${task.description}.` : '';
          const notes = task.lastEdited ? ` Notes: ${task.lastEdited}.` : '';
          return `- ${task.title} (${task.status}, assignee: ${task.assignee}).${description}${notes}`;
        })
        .join('\n')
    : 'No tasks have been created yet.';

  const chatSummary = recentMessages.length
    ? recentMessages
        .slice(-8)
        .map(msg => `- ${msg.sender}: ${msg.text}`)
        .join('\n')
    : 'No recent team chat messages.';

  const sanitizedHistory = history.filter(
    message => message.role === 'user' || message.role === 'assistant',
  );

  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `You are CollabLAN Assistant, an offline collaboration copilot inside a LAN workspace. Give practical, concise help for planning, coding, debugging, standups, and teammate coordination. Use the provided workspace context when relevant, and be honest when context is missing.

Workspace context:
Current user: ${currentUser.name}
Connected peers: ${peerCount}

Tasks:
${taskSummary}

Recent team chat:
${chatSummary}`,
    },
    ...sanitizedHistory,
    {
      role: 'user',
      content: prompt,
    },
  ];

  return runCompletion(messages, {
    temperature: 0.5,
    max_tokens: 500,
  });
}
