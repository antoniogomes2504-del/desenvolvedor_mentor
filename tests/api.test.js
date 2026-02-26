/**
 * tests/api.test.js
 * Testes das chamadas de API para cada provedor
 */

const { PROVIDERS, SYSTEM_PROMPT } = require('../src/js/providers');

// ── DOM mínimo ──────────────────────────────────────────────
function setupDOM() {
    document.body.innerHTML = `
        <div id="setup-screen"><div id="provider-grid"></div>
            <label id="key-label"></label><div id="key-hint"></div>
            <select id="model-select"></select>
            <input id="api-key-input" type="password" />
            <input id="context-input" type="text" />
            <button id="btn-start"></button>
        </div>
        <div id="app-screen">
            <button id="btn-share-screen"></button>
            <button id="btn-stop-screen"></button>
            <button id="btn-send"></button>
            <button id="btn-clear"></button>
            <button id="btn-change-provider"></button>
            <textarea id="chat-input"></textarea>
            <div id="messages"></div>
            <video id="screen-video"></video>
            <div id="screen-placeholder"></div>
            <div id="status-dot"></div>
            <span id="status-text"></span>
            <input id="auto-capture" type="checkbox" checked />
            <canvas id="capture-canvas"></canvas>
            <div id="no-vision-warn"></div>
            <div id="active-provider-pill">
                <span id="active-provider-icon"></span>
                <span id="active-provider-name"></span>
            </div>
            <div id="chat-panel-header"></div>
        </div>
    `;
}

let app;

beforeEach(() => {
    jest.resetModules();
    setupDOM();
    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({ drawImage: jest.fn() }));
    HTMLCanvasElement.prototype.toDataURL = jest.fn(() => 'data:image/jpeg;base64,mock');
    global.PROVIDERS = PROVIDERS;
    global.SYSTEM_PROMPT = SYSTEM_PROMPT;

    // Mock global fetch
    global.fetch = jest.fn();

    app = require('../src/js/app');
});

afterEach(() => {
    jest.restoreAllMocks();
    delete global.fetch;
});

// ── Helper: mock de fetch com resposta de sucesso ───────────
function mockFetchSuccess(data) {
    global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(data),
    });
}

function mockFetchError(status, errorMessage) {
    global.fetch.mockResolvedValue({
        ok: false,
        status,
        json: () => Promise.resolve({ error: { message: errorMessage } }),
    });
}

// ═══════════════════════════════════════════════════════════════
// callGemini()
// ═══════════════════════════════════════════════════════════════
describe('callGemini()', () => {

    beforeEach(() => {
        app.setState({
            selectedProvider: 'gemini',
            apiKey: 'test-gemini-key',
            selectedModel: 'gemini-2.5-flash',
            conversationHistory: [
                { role: 'user', parts: [{ text: 'Olá' }] },
            ],
        });
    });

    test('monta URL correta com apiKey e modelo', async () => {
        mockFetchSuccess({
            candidates: [{ content: { parts: [{ text: 'Resposta Gemini' }] } }],
        });

        await app.callGemini();

        const url = global.fetch.mock.calls[0][0];
        expect(url).toContain('gemini-2.5-flash');
        expect(url).toContain('key=test-gemini-key');
        expect(url).toContain('generativelanguage.googleapis.com');
    });

    test('envia SYSTEM_PROMPT como system_instruction', async () => {
        mockFetchSuccess({
            candidates: [{ content: { parts: [{ text: 'OK' }] } }],
        });

        await app.callGemini();

        const body = JSON.parse(global.fetch.mock.calls[0][1].body);
        expect(body.system_instruction.parts[0].text).toBe(SYSTEM_PROMPT);
    });

    test('envia histórico de conversação no body', async () => {
        mockFetchSuccess({
            candidates: [{ content: { parts: [{ text: 'OK' }] } }],
        });

        await app.callGemini();

        const body = JSON.parse(global.fetch.mock.calls[0][1].body);
        expect(body.contents).toHaveLength(1);
        expect(body.contents[0].parts[0].text).toBe('Olá');
    });

    test('retorna texto da resposta', async () => {
        mockFetchSuccess({
            candidates: [{ content: { parts: [{ text: 'Resposta do Gemini' }] } }],
        });

        const result = await app.callGemini();
        expect(result).toBe('Resposta do Gemini');
    });

    test('lança erro quando res.ok = false', async () => {
        mockFetchError(401, 'API key invalid');
        await expect(app.callGemini()).rejects.toThrow('API key invalid');
    });
});

// ═══════════════════════════════════════════════════════════════
// callOpenAICompat()
// ═══════════════════════════════════════════════════════════════
describe('callOpenAICompat()', () => {

    beforeEach(() => {
        app.setState({
            selectedProvider: 'openai',
            apiKey: 'sk-test-key',
            selectedModel: 'gpt-4o',
            conversationHistory: [
                { role: 'user', content: 'Olá' },
            ],
        });
    });

    test('envia header Authorization: Bearer correto', async () => {
        mockFetchSuccess({
            choices: [{ message: { content: 'Resposta' } }],
        });

        await app.callOpenAICompat('https://api.openai.com/v1/chat/completions');

        const headers = global.fetch.mock.calls[0][1].headers;
        expect(headers.Authorization).toBe('Bearer sk-test-key');
    });

    test('envia SYSTEM_PROMPT como primeira mensagem do sistema', async () => {
        mockFetchSuccess({
            choices: [{ message: { content: 'OK' } }],
        });

        await app.callOpenAICompat('https://api.openai.com/v1/chat/completions');

        const body = JSON.parse(global.fetch.mock.calls[0][1].body);
        expect(body.messages[0].role).toBe('system');
        expect(body.messages[0].content).toBe(SYSTEM_PROMPT);
    });

    test('envia modelo correto no body', async () => {
        mockFetchSuccess({
            choices: [{ message: { content: 'OK' } }],
        });

        await app.callOpenAICompat('https://api.openai.com/v1/chat/completions');

        const body = JSON.parse(global.fetch.mock.calls[0][1].body);
        expect(body.model).toBe('gpt-4o');
    });

    test('retorna texto da resposta', async () => {
        mockFetchSuccess({
            choices: [{ message: { content: 'Olá do GPT!' } }],
        });

        const result = await app.callOpenAICompat('https://api.openai.com/v1/chat/completions');
        expect(result).toBe('Olá do GPT!');
    });

    test('lança erro quando res.ok = false', async () => {
        mockFetchError(429, 'Rate limit exceeded');
        await expect(
            app.callOpenAICompat('https://api.openai.com/v1/chat/completions')
        ).rejects.toThrow('Rate limit exceeded');
    });

    test('provedores sem visão convertem imagens para texto simples', async () => {
        app.setState({
            selectedProvider: 'deepseek',
            selectedModel: 'deepseek-chat',
            conversationHistory: [
                {
                    role: 'user',
                    content: [
                        { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,abc' } },
                        { type: 'text', text: 'Olha essa tela' },
                    ],
                },
            ],
        });

        mockFetchSuccess({
            choices: [{ message: { content: 'OK' } }],
        });

        await app.callOpenAICompat('https://api.deepseek.com/chat/completions');

        const body = JSON.parse(global.fetch.mock.calls[0][1].body);
        // O histórico deve ser simplificado: content deve ser string, não array
        const userMsg = body.messages.find(m => m.role === 'user');
        expect(typeof userMsg.content).toBe('string');
        expect(userMsg.content).toBe('Olha essa tela');
    });

    test('provedores COM visão mantém imagens no histórico', async () => {
        app.setState({
            selectedProvider: 'openai',
            selectedModel: 'gpt-4o',
            conversationHistory: [
                {
                    role: 'user',
                    content: [
                        { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,abc' } },
                        { type: 'text', text: 'Olha essa tela' },
                    ],
                },
            ],
        });

        mockFetchSuccess({
            choices: [{ message: { content: 'OK' } }],
        });

        await app.callOpenAICompat('https://api.openai.com/v1/chat/completions');

        const body = JSON.parse(global.fetch.mock.calls[0][1].body);
        const userMsg = body.messages.find(m => m.role === 'user');
        expect(Array.isArray(userMsg.content)).toBe(true);
    });
});

// ═══════════════════════════════════════════════════════════════
// callClaude()
// ═══════════════════════════════════════════════════════════════
describe('callClaude()', () => {

    beforeEach(() => {
        app.setState({
            selectedProvider: 'claude',
            apiKey: 'sk-ant-test-key',
            selectedModel: 'claude-3-5-sonnet-20241022',
            conversationHistory: [
                { role: 'user', content: [{ type: 'text', text: 'Olá' }] },
            ],
        });
    });

    test('envia header x-api-key correto', async () => {
        mockFetchSuccess({
            content: [{ text: 'Resposta Claude' }],
        });

        await app.callClaude();

        const headers = global.fetch.mock.calls[0][1].headers;
        expect(headers['x-api-key']).toBe('sk-ant-test-key');
    });

    test('envia header anthropic-version correto', async () => {
        mockFetchSuccess({
            content: [{ text: 'OK' }],
        });

        await app.callClaude();

        const headers = global.fetch.mock.calls[0][1].headers;
        expect(headers['anthropic-version']).toBe('2023-06-01');
    });

    test('envia header anthropic-dangerous-direct-browser-access', async () => {
        mockFetchSuccess({
            content: [{ text: 'OK' }],
        });

        await app.callClaude();

        const headers = global.fetch.mock.calls[0][1].headers;
        expect(headers['anthropic-dangerous-direct-browser-access']).toBe('true');
    });

    test('envia SYSTEM_PROMPT como campo system (não mensagem)', async () => {
        mockFetchSuccess({
            content: [{ text: 'OK' }],
        });

        await app.callClaude();

        const body = JSON.parse(global.fetch.mock.calls[0][1].body);
        expect(body.system).toBe(SYSTEM_PROMPT);
        // Verifica que NÃO há mensagem de sistema no array messages
        const sysMsg = body.messages.find(m => m.role === 'system');
        expect(sysMsg).toBeUndefined();
    });

    test('retorna texto da resposta', async () => {
        mockFetchSuccess({
            content: [{ text: 'Resposta do Claude' }],
        });

        const result = await app.callClaude();
        expect(result).toBe('Resposta do Claude');
    });

    test('lança erro quando res.ok = false', async () => {
        mockFetchError(403, 'Invalid API key');
        await expect(app.callClaude()).rejects.toThrow('Invalid API key');
    });

    test('chama endpoint correto', async () => {
        mockFetchSuccess({
            content: [{ text: 'OK' }],
        });

        await app.callClaude();

        const url = global.fetch.mock.calls[0][0];
        expect(url).toBe('https://api.anthropic.com/v1/messages');
    });
});

// ═══════════════════════════════════════════════════════════════
// callProvider() — despacho
// ═══════════════════════════════════════════════════════════════
describe('callProvider()', () => {

    test('chama callGemini quando selectedProvider é gemini', async () => {
        app.setState({
            selectedProvider: 'gemini',
            apiKey: 'key',
            selectedModel: 'gemini-2.5-flash',
            conversationHistory: [],
        });

        mockFetchSuccess({
            candidates: [{ content: { parts: [{ text: 'OK' }] } }],
        });

        const result = await app.callProvider();
        expect(result).toBe('OK');
        expect(global.fetch.mock.calls[0][0]).toContain('googleapis.com');
    });

    test('lança erro para provedor desconhecido', async () => {
        app.setState({ selectedProvider: 'inexistente' });
        await expect(app.callProvider()).rejects.toThrow('Provedor desconhecido');
    });
});
