/**
 * tests/capture.test.js
 * Testes de captura de tela e compartilhamento
 */

const { PROVIDERS, SYSTEM_PROMPT } = require('../src/js/providers');

// ── DOM mínimo para app.js ──────────────────────────────────
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

// ── Mocks ────────────────────────────────────────────────────
const mockDrawImage = jest.fn();
const mockGetContext = jest.fn(() => ({ drawImage: mockDrawImage }));
const mockToDataURL = jest.fn(() => 'data:image/jpeg;base64,abc123mockData');

let app;

beforeEach(() => {
    jest.resetModules();
    setupDOM();

    // Mock canvas
    HTMLCanvasElement.prototype.getContext = mockGetContext;
    HTMLCanvasElement.prototype.toDataURL = mockToDataURL;

    // Globals
    global.PROVIDERS = PROVIDERS;
    global.SYSTEM_PROMPT = SYSTEM_PROMPT;

    app = require('../src/js/app');
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe('captureFrame()', () => {

    test('retorna null quando não há stream ativo', () => {
        // mediaStream é null por padrão
        const result = app.captureFrame();
        expect(result).toBeNull();
    });

    test('retorna null quando videoEl.readyState < 2', () => {
        const videoEl = document.getElementById('screen-video');
        Object.defineProperty(videoEl, 'readyState', { value: 1, writable: true });

        app.setState({
            mediaStream: {
                getTracks: () => [],
                getVideoTracks: () => [{ addEventListener: jest.fn() }],
            },
        });

        const result = app.captureFrame();
        expect(result).toBeNull();
    });

    test('retorna null quando videoWidth ou videoHeight é 0', () => {
        const videoEl = document.getElementById('screen-video');
        Object.defineProperty(videoEl, 'readyState', { value: 4, writable: true });
        Object.defineProperty(videoEl, 'videoWidth', { value: 0, writable: true });
        Object.defineProperty(videoEl, 'videoHeight', { value: 0, writable: true });

        app.setState({
            mediaStream: {
                getTracks: () => [],
                getVideoTracks: () => [{ addEventListener: jest.fn() }],
            },
        });

        const result = app.captureFrame();
        expect(result).toBeNull();
    });

    test('retorna string base64 quando stream está ativo e vídeo pronto', () => {
        const videoEl = document.getElementById('screen-video');
        Object.defineProperty(videoEl, 'readyState', { value: 4, writable: true });
        Object.defineProperty(videoEl, 'videoWidth', { value: 800, writable: true });
        Object.defineProperty(videoEl, 'videoHeight', { value: 600, writable: true });

        app.setState({
            mediaStream: {
                getTracks: () => [],
                getVideoTracks: () => [{ addEventListener: jest.fn() }],
            },
        });

        const result = app.captureFrame();
        expect(typeof result).toBe('string');
        expect(result).toBe('abc123mockData');
    });

    test('redimensiona corretamente para no máximo 1280px de largura', () => {
        const videoEl = document.getElementById('screen-video');
        Object.defineProperty(videoEl, 'readyState', { value: 4, writable: true });
        Object.defineProperty(videoEl, 'videoWidth', { value: 1920, writable: true });
        Object.defineProperty(videoEl, 'videoHeight', { value: 1080, writable: true });

        app.setState({
            mediaStream: {
                getTracks: () => [],
                getVideoTracks: () => [{ addEventListener: jest.fn() }],
            },
        });

        app.captureFrame();

        const canvas = document.getElementById('capture-canvas');
        // ratio = min(1, 1280/1920) = 0.6667
        expect(canvas.width).toBe(Math.round(1920 * (1280 / 1920))); // 1280
        expect(canvas.height).toBe(Math.round(1080 * (1280 / 1920))); // 720
    });

    test('não redimensiona quando vídeo já é menor que 1280px', () => {
        const videoEl = document.getElementById('screen-video');
        Object.defineProperty(videoEl, 'readyState', { value: 4, writable: true });
        Object.defineProperty(videoEl, 'videoWidth', { value: 800, writable: true });
        Object.defineProperty(videoEl, 'videoHeight', { value: 600, writable: true });

        app.setState({
            mediaStream: {
                getTracks: () => [],
                getVideoTracks: () => [{ addEventListener: jest.fn() }],
            },
        });

        app.captureFrame();

        const canvas = document.getElementById('capture-canvas');
        // ratio = min(1, 1280/800) = 1
        expect(canvas.width).toBe(800);
        expect(canvas.height).toBe(600);
    });
});

describe('stopScreen()', () => {

    test('limpa o mediaStream corretamente', () => {
        const mockStop = jest.fn();
        const mockStream = {
            getTracks: () => [{ stop: mockStop }, { stop: mockStop }],
            getVideoTracks: () => [{ addEventListener: jest.fn() }],
        };

        app.setState({ mediaStream: mockStream });
        app.stopScreen();

        expect(mockStop).toHaveBeenCalledTimes(2);
        expect(app.getState().mediaStream).toBeNull();
    });

    test('esconde o vídeo e mostra o placeholder', () => {
        const mockStream = {
            getTracks: () => [{ stop: jest.fn() }],
            getVideoTracks: () => [{ addEventListener: jest.fn() }],
        };

        app.setState({ mediaStream: mockStream });
        app.stopScreen();

        const videoEl = document.getElementById('screen-video');
        const placeholder = document.getElementById('screen-placeholder');
        expect(videoEl.style.display).toBe('none');
        expect(placeholder.style.display).toBe('flex');
    });

    test('atualiza botões de compartilhar/parar', () => {
        const mockStream = {
            getTracks: () => [{ stop: jest.fn() }],
            getVideoTracks: () => [{ addEventListener: jest.fn() }],
        };

        app.setState({ mediaStream: mockStream });
        app.stopScreen();

        const btnShare = document.getElementById('btn-share-screen');
        const btnStop = document.getElementById('btn-stop-screen');
        expect(btnStop.style.display).toBe('none');
        expect(btnShare.style.display).toBe('flex');
    });

    test('não quebra quando mediaStream já é null', () => {
        app.setState({ mediaStream: null });
        expect(() => app.stopScreen()).not.toThrow();
    });
});
