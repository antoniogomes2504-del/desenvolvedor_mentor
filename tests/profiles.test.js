/**
 * tests/profiles.test.js
 * Testes do sistema de perfis de especialista
 */

const { PROVIDERS, SYSTEM_PROMPT } = require('../src/js/providers');
const { PROFILES } = require('../src/js/profiles');

// ── DOM mínimo COM elementos de perfil ──────────────────────
function setupDOM() {
    document.body.innerHTML = `
        <div id="setup-screen">
            <div id="profile-grid"></div>
            <div id="custom-prompt-area" style="display:none">
                <textarea id="custom-prompt-input"></textarea>
            </div>
            <div id="provider-grid"></div>
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
            <div id="active-profile-pill" style="display:none">
                <span id="active-profile-icon"></span>
                <span id="active-profile-name"></span>
            </div>
            <div id="chat-panel-header"></div>
        </div>
    `;
}

let app;

beforeEach(() => {
    jest.resetModules();
    localStorage.clear();
    setupDOM();
    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({ drawImage: jest.fn() }));
    HTMLCanvasElement.prototype.toDataURL = jest.fn(() => 'data:image/jpeg;base64,mock');
    global.PROVIDERS = PROVIDERS;
    global.SYSTEM_PROMPT = SYSTEM_PROMPT;
    global.PROFILES = PROFILES;
    app = require('../src/js/app');
});

afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
});

// ═══════════════════════════════════════════════════════════════
// ESTRUTURA DO ARRAY PROFILES
// ═══════════════════════════════════════════════════════════════
describe('PROFILES — estrutura', () => {

    test('PROFILES é um array com 10 perfis', () => {
        expect(Array.isArray(PROFILES)).toBe(true);
        expect(PROFILES).toHaveLength(10);
    });

    const expectedIds = ['langflow', 'architect', 'python', 'qa', 'frontend', 'uxui', 'devops', 'database', 'dify', 'custom'];

    test.each(expectedIds)('perfil "%s" existe no array', (id) => {
        const found = PROFILES.find(p => p.id === id);
        expect(found).toBeDefined();
    });

    test('cada perfil tem as propriedades obrigatórias: id, name, icon, desc, systemPrompt', () => {
        PROFILES.forEach(p => {
            expect(p).toHaveProperty('id');
            expect(p).toHaveProperty('name');
            expect(p).toHaveProperty('icon');
            expect(p).toHaveProperty('desc');
            expect(p).toHaveProperty('systemPrompt');
        });
    });

    test('cada perfil tem id único', () => {
        const ids = PROFILES.map(p => p.id);
        const uniqueIds = [...new Set(ids)];
        expect(uniqueIds).toHaveLength(ids.length);
    });

    test('cada perfil tem name do tipo string não-vazio', () => {
        PROFILES.forEach(p => {
            expect(typeof p.name).toBe('string');
            expect(p.name.length).toBeGreaterThan(0);
        });
    });

    test('cada perfil tem icon do tipo string não-vazio', () => {
        PROFILES.forEach(p => {
            expect(typeof p.icon).toBe('string');
            expect(p.icon.length).toBeGreaterThan(0);
        });
    });

    test('cada perfil tem desc do tipo string não-vazio', () => {
        PROFILES.forEach(p => {
            expect(typeof p.desc).toBe('string');
            expect(p.desc.length).toBeGreaterThan(0);
        });
    });
});

// ═══════════════════════════════════════════════════════════════
// SYSTEM PROMPTS POR PERFIL
// ═══════════════════════════════════════════════════════════════
describe('PROFILES — systemPrompt', () => {

    const profilesComPrompt = ['langflow', 'architect', 'python', 'qa', 'frontend', 'uxui', 'devops', 'database', 'dify'];

    test.each(profilesComPrompt)('perfil "%s" tem systemPrompt não-nulo', (id) => {
        const profile = PROFILES.find(p => p.id === id);
        expect(profile.systemPrompt).not.toBeNull();
        expect(typeof profile.systemPrompt).toBe('string');
        expect(profile.systemPrompt.length).toBeGreaterThan(20);
    });

    test('perfil "custom" tem systemPrompt null', () => {
        const custom = PROFILES.find(p => p.id === 'custom');
        expect(custom.systemPrompt).toBeNull();
    });

    test.each(profilesComPrompt)('systemPrompt de "%s" contém instrução em português', (id) => {
        const profile = PROFILES.find(p => p.id === id);
        expect(profile.systemPrompt).toMatch(/portugu[eê]s/i);
    });

    test('perfil "langflow" menciona Langflow no systemPrompt', () => {
        const profile = PROFILES.find(p => p.id === 'langflow');
        expect(profile.systemPrompt).toMatch(/langflow/i);
    });

    test('perfil "python" menciona Python no systemPrompt', () => {
        const profile = PROFILES.find(p => p.id === 'python');
        expect(profile.systemPrompt).toMatch(/python/i);
    });
});

// ═══════════════════════════════════════════════════════════════
// SELEÇÃO DE PERFIL E TROCA DE SYSTEM PROMPT
// ═══════════════════════════════════════════════════════════════
describe('selectProfile()', () => {

    test('selecionar perfil "python" muda activeSystemPrompt', () => {
        app.selectProfile('python');
        const state = app.getState();
        expect(state.selectedProfile).toBe('python');
        const pythonProfile = PROFILES.find(p => p.id === 'python');
        expect(state.activeSystemPrompt).toBe(pythonProfile.systemPrompt);
    });

    test('selecionar perfil "frontend" muda activeSystemPrompt', () => {
        app.selectProfile('frontend');
        const state = app.getState();
        expect(state.selectedProfile).toBe('frontend');
        const frontendProfile = PROFILES.find(p => p.id === 'frontend');
        expect(state.activeSystemPrompt).toBe(frontendProfile.systemPrompt);
    });

    test('selecionar perfil "devops" muda activeSystemPrompt', () => {
        app.selectProfile('devops');
        const state = app.getState();
        expect(state.activeSystemPrompt).toBe(PROFILES.find(p => p.id === 'devops').systemPrompt);
    });

    test('selecionar perfil inexistente não muda estado', () => {
        app.selectProfile('langflow');
        const before = app.getState().activeSystemPrompt;
        app.selectProfile('perfil_inexistente');
        expect(app.getState().activeSystemPrompt).toBe(before);
    });

    test('trocar entre perfis muda o activeSystemPrompt corretamente', () => {
        app.selectProfile('python');
        const pythonPrompt = app.getState().activeSystemPrompt;

        app.selectProfile('database');
        const dbPrompt = app.getState().activeSystemPrompt;

        expect(pythonPrompt).not.toBe(dbPrompt);
        expect(dbPrompt).toBe(PROFILES.find(p => p.id === 'database').systemPrompt);
    });

    test('selecionar perfil "custom" sem texto no textarea usa SYSTEM_PROMPT fallback', () => {
        app.selectProfile('custom');
        const state = app.getState();
        expect(state.selectedProfile).toBe('custom');
        // Sem texto no textarea, deve cair no fallback
        expect(state.activeSystemPrompt).toBe(SYSTEM_PROMPT);
    });
});

// ═══════════════════════════════════════════════════════════════
// PERSISTÊNCIA COM localStorage
// ═══════════════════════════════════════════════════════════════
describe('localStorage — persistência de perfil', () => {

    test('selecionar perfil salva no localStorage', () => {
        app.selectProfile('devops');
        expect(localStorage.getItem('mentor_profile')).toBe('devops');
    });

    test('selecionar outro perfil atualiza localStorage', () => {
        app.selectProfile('python');
        expect(localStorage.getItem('mentor_profile')).toBe('python');

        app.selectProfile('qa');
        expect(localStorage.getItem('mentor_profile')).toBe('qa');
    });

    test('na inicialização, recupera perfil salvo do localStorage', () => {
        jest.resetModules();
        localStorage.setItem('mentor_profile', 'database');
        setupDOM();
        HTMLCanvasElement.prototype.getContext = jest.fn(() => ({ drawImage: jest.fn() }));
        HTMLCanvasElement.prototype.toDataURL = jest.fn(() => 'data:image/jpeg;base64,mock');
        global.PROVIDERS = PROVIDERS;
        global.SYSTEM_PROMPT = SYSTEM_PROMPT;
        global.PROFILES = PROFILES;

        const freshApp = require('../src/js/app');
        const state = freshApp.getState();
        expect(state.selectedProfile).toBe('database');
        expect(state.activeSystemPrompt).toBe(PROFILES.find(p => p.id === 'database').systemPrompt);
    });

    test('perfil inválido no localStorage cai no padrão "langflow"', () => {
        jest.resetModules();
        localStorage.setItem('mentor_profile', 'perfil_invalido_xyz');
        setupDOM();
        HTMLCanvasElement.prototype.getContext = jest.fn(() => ({ drawImage: jest.fn() }));
        HTMLCanvasElement.prototype.toDataURL = jest.fn(() => 'data:image/jpeg;base64,mock');
        global.PROVIDERS = PROVIDERS;
        global.SYSTEM_PROMPT = SYSTEM_PROMPT;
        global.PROFILES = PROFILES;

        const freshApp = require('../src/js/app');
        const state = freshApp.getState();
        expect(state.selectedProfile).toBe('langflow');
    });

    test('NÃO salva apiKey no localStorage', () => {
        app.setState({ apiKey: 'chave-secreta-123' });
        const allKeys = Object.keys(localStorage);
        allKeys.forEach(key => {
            expect(localStorage.getItem(key)).not.toBe('chave-secreta-123');
        });
    });
});

// ═══════════════════════════════════════════════════════════════
// RENDERIZAÇÃO DO GRID DE PERFIS
// ═══════════════════════════════════════════════════════════════
describe('renderProfileGrid()', () => {

    test('gera 10 cards de perfil no grid', () => {
        const grid = document.getElementById('profile-grid');
        const cards = grid.querySelectorAll('.profile-card');
        expect(cards.length).toBe(10);
    });

    test('card selecionado por padrão tem classe "selected"', () => {
        const grid = document.getElementById('profile-grid');
        const selected = grid.querySelectorAll('.profile-card.selected');
        expect(selected.length).toBe(1);
    });

    test('cada card tem data-profile com id correto', () => {
        const grid = document.getElementById('profile-grid');
        const expectedIds = ['langflow', 'architect', 'python', 'qa', 'frontend', 'uxui', 'devops', 'database', 'dify', 'custom'];
        expectedIds.forEach(id => {
            const card = grid.querySelector(`[data-profile="${id}"]`);
            expect(card).not.toBeNull();
        });
    });

    test('cards exibem nome e descrição do perfil', () => {
        PROFILES.forEach(p => {
            const card = document.querySelector(`[data-profile="${p.id}"]`);
            expect(card.textContent).toContain(p.name);
            expect(card.textContent).toContain(p.desc);
        });
    });

    test('cards exibem emoji/ícone do perfil', () => {
        PROFILES.forEach(p => {
            const card = document.querySelector(`[data-profile="${p.id}"]`);
            expect(card.textContent).toContain(p.icon);
        });
    });

    test('selecionar "custom" mostra textarea de prompt', () => {
        app.selectProfile('custom');
        const area = document.getElementById('custom-prompt-area');
        expect(area.style.display).toBe('block');
    });

    test('selecionar perfil não-custom esconde textarea', () => {
        app.selectProfile('custom');
        app.selectProfile('python');
        const area = document.getElementById('custom-prompt-area');
        expect(area.style.display).toBe('none');
    });
});
