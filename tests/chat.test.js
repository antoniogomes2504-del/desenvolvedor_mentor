/**
 * tests/chat.test.js
 * Testes de chat, renderização de markdown e construção de mensagens
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
    app = require('../src/js/app');
});

afterEach(() => {
    jest.restoreAllMocks();
});

// ═══════════════════════════════════════════════════════════════
// renderMarkdown()
// ═══════════════════════════════════════════════════════════════
describe('renderMarkdown()', () => {

    test('renderiza **negrito** corretamente', () => {
        const result = app.renderMarkdown('Isso é **importante**');
        expect(result).toContain('<strong>importante</strong>');
    });

    test('renderiza *itálico* corretamente', () => {
        const result = app.renderMarkdown('Isso é *sutil*');
        expect(result).toContain('<em>sutil</em>');
    });

    test('renderiza `código inline` corretamente', () => {
        const result = app.renderMarkdown('Use `npm install`');
        expect(result).toContain('<code>npm install</code>');
    });

    test('renderiza bloco de código corretamente', () => {
        const result = app.renderMarkdown('```js\nconsole.log("ok")\n```');
        expect(result).toContain('<pre><code>');
        expect(result).toContain('console.log');
    });

    test('renderiza lista numerada SEM bug de duplicação', () => {
        const result = app.renderMarkdown('1. Primeiro passo\n2. Segundo passo');
        expect(result).toContain('1. Primeiro passo');
        expect(result).toContain('2. Segundo passo');
        // Verifica que NÃO tem duplicação
        expect(result).not.toContain('Primeiro passo. Primeiro passo');
    });

    test('renderiza lista não-numerada com bullet', () => {
        const result = app.renderMarkdown('- Item A\n- Item B');
        expect(result).toContain('• Item A');
        expect(result).toContain('• Item B');
    });

    test('renderiza títulos H1-H3', () => {
        const result = app.renderMarkdown('## Título Importante');
        expect(result).toContain('<strong');
        expect(result).toContain('Título Importante');
    });

    test('escapa HTML para prevenir XSS', () => {
        const result = app.renderMarkdown('<script>alert("xss")</script>');
        expect(result).not.toContain('<script>');
        expect(result).toContain('&lt;script&gt;');
    });

    test('converte quebras de linha em <br>', () => {
        const result = app.renderMarkdown('Linha 1\n\nLinha 2');
        expect(result).toContain('<br><br>');
    });
});

// ═══════════════════════════════════════════════════════════════
// addMessage()
// ═══════════════════════════════════════════════════════════════
describe('addMessage()', () => {

    test('cria mensagem do usuário com classe correta', () => {
        app.addMessage('user', 'Olá');
        const msgs = document.querySelectorAll('.msg.user');
        expect(msgs.length).toBe(1);
    });

    test('cria mensagem da IA com classe correta', () => {
        app.addMessage('ai', 'Olá! Como posso ajudar?');
        const msgs = document.querySelectorAll('.msg.ai');
        expect(msgs.length).toBe(1);
    });

    test('adiciona avatar do usuário 👤', () => {
        app.addMessage('user', 'teste');
        const bubble = document.querySelector('.msg.user');
        expect(bubble.innerHTML).toContain('👤');
    });

    test('adiciona avatar da IA 🤖', () => {
        app.addMessage('ai', 'teste');
        const bubble = document.querySelector('.msg.ai');
        expect(bubble.innerHTML).toContain('🤖');
    });

    test('inclui indicador de screenshot quando hasScreenshot=true', () => {
        app.addMessage('user', 'veja minha tela', true);
        const indicator = document.querySelector('.msg__screenshot');
        expect(indicator).not.toBeNull();
        expect(indicator.textContent).toContain('Captura de tela');
    });

    test('NÃO inclui indicador quando hasScreenshot=false', () => {
        app.addMessage('user', 'só texto');
        const indicator = document.querySelector('.msg__screenshot');
        expect(indicator).toBeNull();
    });

    test('inclui timestamp na mensagem', () => {
        app.addMessage('ai', 'teste');
        const time = document.querySelector('.msg__time');
        expect(time).not.toBeNull();
        expect(time.textContent).toMatch(/\d{2}:\d{2}/);
    });
});

// ═══════════════════════════════════════════════════════════════
// clearChat()
// ═══════════════════════════════════════════════════════════════
describe('clearChat()', () => {

    test('limpa o histórico de conversação', () => {
        app.setState({ conversationHistory: [{ role: 'user', content: 'teste' }] });
        app.clearChat();
        expect(app.getState().conversationHistory).toEqual([]);
    });

    test('substitui conteúdo do chat por mensagem de boas-vindas', () => {
        app.addMessage('user', 'msg1');
        app.addMessage('ai', 'msg2');
        app.clearChat();

        const messages = document.getElementById('messages');
        expect(messages.querySelector('.welcome')).not.toBeNull();
        expect(messages.querySelector('.msg')).toBeNull();
    });
});

// ═══════════════════════════════════════════════════════════════
// buildUserMsg() — formato por provedor
// ═══════════════════════════════════════════════════════════════
describe('buildUserMsg()', () => {

    describe('Gemini (formato parts)', () => {
        beforeEach(() => { app.setState({ selectedProvider: 'gemini' }); });

        test('mensagem de texto puro', () => {
            const msg = app.buildUserMsg('Olá', null);
            expect(msg.role).toBe('user');
            expect(msg.parts).toBeDefined();
            expect(msg.parts).toContainEqual({ text: 'Olá' });
        });

        test('mensagem com imagem', () => {
            const msg = app.buildUserMsg('Veja isso', 'base64data');
            expect(msg.parts).toHaveLength(2);
            expect(msg.parts[0]).toHaveProperty('inline_data');
            expect(msg.parts[0].inline_data.mime_type).toBe('image/jpeg');
            expect(msg.parts[0].inline_data.data).toBe('base64data');
        });
    });

    describe('Claude (formato content array)', () => {
        beforeEach(() => { app.setState({ selectedProvider: 'claude' }); });

        test('mensagem de texto puro', () => {
            const msg = app.buildUserMsg('Olá', null);
            expect(msg.role).toBe('user');
            expect(msg.content).toContainEqual({ type: 'text', text: 'Olá' });
        });

        test('mensagem com imagem', () => {
            const msg = app.buildUserMsg('Veja', 'imgdata');
            expect(msg.content).toHaveLength(2);
            expect(msg.content[0].type).toBe('image');
            expect(msg.content[0].source.type).toBe('base64');
            expect(msg.content[0].source.data).toBe('imgdata');
        });
    });

    describe('OpenAI (formato OpenAI-compat)', () => {
        beforeEach(() => { app.setState({ selectedProvider: 'openai' }); });

        test('mensagem de texto puro', () => {
            const msg = app.buildUserMsg('Olá', null);
            expect(msg.role).toBe('user');
            expect(msg.content).toBe('Olá');
        });

        test('mensagem com imagem', () => {
            const msg = app.buildUserMsg('Veja', 'imgdata');
            expect(Array.isArray(msg.content)).toBe(true);
            expect(msg.content[0].type).toBe('image_url');
            expect(msg.content[0].image_url.url).toContain('base64,imgdata');
        });
    });

    describe('Provedores sem visão (DeepSeek, Mistral, Groq)', () => {
        test('DeepSeek sem imagem retorna content como string', () => {
            app.setState({ selectedProvider: 'deepseek' });
            const msg = app.buildUserMsg('Olá', null);
            expect(msg.content).toBe('Olá');
        });

        test('Groq sem imagem retorna content como string', () => {
            app.setState({ selectedProvider: 'groq' });
            const msg = app.buildUserMsg('Teste', null);
            expect(msg.content).toBe('Teste');
        });
    });
});

// ═══════════════════════════════════════════════════════════════
// buildAssistantMsg() — role por provedor
// ═══════════════════════════════════════════════════════════════
describe('buildAssistantMsg()', () => {

    test('Gemini usa role "model" com parts', () => {
        app.setState({ selectedProvider: 'gemini' });
        const msg = app.buildAssistantMsg('Resposta');
        expect(msg.role).toBe('model');
        expect(msg.parts).toContainEqual({ text: 'Resposta' });
    });

    test('OpenAI usa role "assistant" com content', () => {
        app.setState({ selectedProvider: 'openai' });
        const msg = app.buildAssistantMsg('Resposta');
        expect(msg.role).toBe('assistant');
        expect(msg.content).toBe('Resposta');
    });

    test('Claude usa role "assistant" com content', () => {
        app.setState({ selectedProvider: 'claude' });
        const msg = app.buildAssistantMsg('Resposta');
        expect(msg.role).toBe('assistant');
        expect(msg.content).toBe('Resposta');
    });

    test('DeepSeek usa role "assistant"', () => {
        app.setState({ selectedProvider: 'deepseek' });
        const msg = app.buildAssistantMsg('OK');
        expect(msg.role).toBe('assistant');
    });
});
