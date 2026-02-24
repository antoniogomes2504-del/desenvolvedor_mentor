// ═══════════════════════════════════════════════════════════════
// providers.js — Configuração de Provedores de IA
// Mentor IA — Langflow
// ═══════════════════════════════════════════════════════════════

const PROVIDERS = {
    gemini: {
        name: 'Google Gemini',
        icon: '🟢',
        iconBg: '#0d2b1d',
        supportsVision: true,
        keyLabel: '3. Chave de API — Google Gemini',
        keyHint: 'Obtenha em: <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a>',
        keyPlaceholder: 'AIza...',
        models: [
            { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
            { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
            { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
        ],
        endpoint: model =>
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    },

    openai: {
        name: 'ChatGPT / OpenAI',
        icon: '🤍',
        iconBg: '#1a1a1a',
        supportsVision: true,
        keyLabel: '3. Chave de API — OpenAI',
        keyHint: 'Obtenha em: <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener">platform.openai.com/api-keys</a>',
        keyPlaceholder: 'sk-...',
        models: [
            { id: 'gpt-4o', label: 'GPT-4o' },
            { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
            { id: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
        ],
        endpoint: () => 'https://api.openai.com/v1/chat/completions',
    },

    claude: {
        name: 'Claude (Anthropic)',
        icon: '🟠',
        iconBg: '#2a1a0a',
        supportsVision: true,
        keyLabel: '3. Chave de API — Anthropic',
        keyHint: 'Obtenha em: <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener">console.anthropic.com</a>',
        keyPlaceholder: 'sk-ant-...',
        models: [
            { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
            { id: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' },
            { id: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
        ],
        endpoint: () => 'https://api.anthropic.com/v1/messages',
    },

    deepseek: {
        name: 'DeepSeek',
        icon: '🔵',
        iconBg: '#0a1a2a',
        supportsVision: false,
        keyLabel: '3. Chave de API — DeepSeek',
        keyHint: 'Obtenha em: <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener">platform.deepseek.com</a>',
        keyPlaceholder: 'sk-...',
        models: [
            { id: 'deepseek-chat', label: 'DeepSeek Chat' },
            { id: 'deepseek-reasoner', label: 'DeepSeek Reasoner' },
        ],
        endpoint: () => 'https://api.deepseek.com/chat/completions',
    },

    mistral: {
        name: 'Mistral AI',
        icon: '🟣',
        iconBg: '#1a0a2a',
        supportsVision: false,
        keyLabel: '3. Chave de API — Mistral',
        keyHint: 'Obtenha em: <a href="https://console.mistral.ai/api-keys" target="_blank" rel="noopener">console.mistral.ai</a>',
        keyPlaceholder: 'Chave Mistral...',
        models: [
            { id: 'mistral-large-latest', label: 'Mistral Large' },
            { id: 'mistral-medium-latest', label: 'Mistral Medium' },
            { id: 'open-mistral-7b', label: 'Mistral 7B (open)' },
        ],
        endpoint: () => 'https://api.mistral.ai/v1/chat/completions',
    },

    groq: {
        name: 'Groq',
        icon: '⚡',
        iconBg: '#1a1a0a',
        supportsVision: false,
        keyLabel: '3. Chave de API — Groq',
        keyHint: 'Obtenha em: <a href="https://console.groq.com/keys" target="_blank" rel="noopener">console.groq.com</a>',
        keyPlaceholder: 'gsk_...',
        models: [
            { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B' },
            { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B (rápido)' },
            { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
        ],
        endpoint: () => 'https://api.groq.com/openai/v1/chat/completions',
    },
};

const SYSTEM_PROMPT = `Você é um especialista sênior em Langflow e em inteligência artificial aplicada.
O usuário está aprendendo a usar o Langflow em um ambiente corporativo e não tem experiência prévia.
Quando receber uma imagem (captura de tela), analise cuidadosamente o que está sendo exibido — interface do Langflow, código, terminal, mensagem de erro — e oriente com base no que você vê.
Responda sempre em português do Brasil, de forma clara, didática e encorajadora, como um mentor profissional ao lado do usuário.
Se não houver imagem, responda com base no contexto da conversa.
Seja objetivo e prático: explique o próximo passo, esclareça conceitos quando necessário, corrija erros com gentileza e use exemplos simples.`;

// ═══════════════════════════════════════════════════════════════
// EXPORTS — para testes com Jest (ignorado pelo navegador)
// ═══════════════════════════════════════════════════════════════
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PROVIDERS, SYSTEM_PROMPT };
}
