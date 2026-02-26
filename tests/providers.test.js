/**
 * tests/providers.test.js
 * Testes de validação da configuração dos provedores de IA
 */

const { PROVIDERS, SYSTEM_PROMPT } = require('../src/js/providers');

describe('PROVIDERS — Configuração dos Provedores de IA', () => {

    const EXPECTED_PROVIDERS = ['gemini', 'openai', 'claude', 'deepseek', 'mistral', 'groq'];

    test('todos os 6 provedores existem', () => {
        const keys = Object.keys(PROVIDERS);
        expect(keys).toHaveLength(6);
        EXPECTED_PROVIDERS.forEach(p => {
            expect(PROVIDERS).toHaveProperty(p);
        });
    });

    test.each(EXPECTED_PROVIDERS)('provedor "%s" tem todas as propriedades obrigatórias', (key) => {
        const p = PROVIDERS[key];
        expect(p).toHaveProperty('name');
        expect(typeof p.name).toBe('string');
        expect(p).toHaveProperty('icon');
        expect(typeof p.icon).toBe('string');
        expect(p).toHaveProperty('supportsVision');
        expect(typeof p.supportsVision).toBe('boolean');
        expect(p).toHaveProperty('models');
        expect(Array.isArray(p.models)).toBe(true);
        expect(p.models.length).toBeGreaterThan(0);
        expect(p).toHaveProperty('keyPlaceholder');
        expect(typeof p.keyPlaceholder).toBe('string');
        expect(p).toHaveProperty('keyHint');
        expect(typeof p.keyHint).toBe('string');
        expect(p).toHaveProperty('keyLabel');
        expect(p).toHaveProperty('endpoint');
        expect(typeof p.endpoint).toBe('function');
    });

    test.each(EXPECTED_PROVIDERS)('provedor "%s" tem modelos com id e label', (key) => {
        PROVIDERS[key].models.forEach(model => {
            expect(model).toHaveProperty('id');
            expect(typeof model.id).toBe('string');
            expect(model.id.length).toBeGreaterThan(0);
            expect(model).toHaveProperty('label');
            expect(typeof model.label).toBe('string');
        });
    });

    describe('Suporte à visão de tela', () => {
        test('Gemini suporta visão', () => {
            expect(PROVIDERS.gemini.supportsVision).toBe(true);
        });
        test('OpenAI suporta visão', () => {
            expect(PROVIDERS.openai.supportsVision).toBe(true);
        });
        test('Claude suporta visão', () => {
            expect(PROVIDERS.claude.supportsVision).toBe(true);
        });
        test('DeepSeek NÃO suporta visão', () => {
            expect(PROVIDERS.deepseek.supportsVision).toBe(false);
        });
        test('Mistral NÃO suporta visão', () => {
            expect(PROVIDERS.mistral.supportsVision).toBe(false);
        });
        test('Groq NÃO suporta visão', () => {
            expect(PROVIDERS.groq.supportsVision).toBe(false);
        });
    });

    describe('Modelos padrão de cada provedor', () => {
        test('Gemini tem gemini-2.5-flash como primeiro modelo', () => {
            expect(PROVIDERS.gemini.models[0].id).toBe('gemini-2.5-flash');
        });
        test('OpenAI tem gpt-4o como primeiro modelo', () => {
            expect(PROVIDERS.openai.models[0].id).toBe('gpt-4o');
        });
        test('Claude tem claude-3-5-sonnet como primeiro modelo', () => {
            expect(PROVIDERS.claude.models[0].id).toBe('claude-3-5-sonnet-20241022');
        });
        test('DeepSeek tem deepseek-chat como primeiro modelo', () => {
            expect(PROVIDERS.deepseek.models[0].id).toBe('deepseek-chat');
        });
        test('Mistral tem mistral-large-latest como primeiro modelo', () => {
            expect(PROVIDERS.mistral.models[0].id).toBe('mistral-large-latest');
        });
        test('Groq tem llama-3.3-70b-versatile como primeiro modelo', () => {
            expect(PROVIDERS.groq.models[0].id).toBe('llama-3.3-70b-versatile');
        });
    });

    describe('Endpoints dos provedores', () => {
        test('Gemini gera URL correta com modelo', () => {
            const url = PROVIDERS.gemini.endpoint('gemini-2.5-flash');
            expect(url).toContain('generativelanguage.googleapis.com');
            expect(url).toContain('gemini-2.5-flash');
        });
        test('OpenAI retorna endpoint correto', () => {
            expect(PROVIDERS.openai.endpoint()).toContain('api.openai.com');
        });
        test('Claude retorna endpoint correto', () => {
            expect(PROVIDERS.claude.endpoint()).toContain('api.anthropic.com');
        });
        test('DeepSeek retorna endpoint correto', () => {
            expect(PROVIDERS.deepseek.endpoint()).toContain('api.deepseek.com');
        });
        test('Mistral retorna endpoint correto', () => {
            expect(PROVIDERS.mistral.endpoint()).toContain('api.mistral.ai');
        });
        test('Groq retorna endpoint correto', () => {
            expect(PROVIDERS.groq.endpoint()).toContain('api.groq.com');
        });
    });
});

describe('SYSTEM_PROMPT', () => {
    test('existe e não está vazio', () => {
        expect(typeof SYSTEM_PROMPT).toBe('string');
        expect(SYSTEM_PROMPT.length).toBeGreaterThan(100);
    });
    test('está em português do Brasil', () => {
        expect(SYSTEM_PROMPT).toContain('português do Brasil');
    });
    test('menciona Langflow', () => {
        expect(SYSTEM_PROMPT).toContain('Langflow');
    });
    test('instrui sobre análise de imagens', () => {
        expect(SYSTEM_PROMPT).toContain('imagem');
    });
});
