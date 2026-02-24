// ═══════════════════════════════════════════════════════════════
// app.js — Lógica Principal
// Mentor IA — Langflow
// ═══════════════════════════════════════════════════════════════

// ── ESTADO ────────────────────────────────────────────────────
let selectedProvider = 'gemini';
let apiKey = '';
let selectedModel = '';
let userContext = '';
let mediaStream = null;
let conversationHistory = [];
let isProcessing = false;

// ── ELEMENTOS ─────────────────────────────────────────────────
const $ = id => document.getElementById(id);

const setupScreen = $('setup-screen');
const appScreen = $('app-screen');
const apiKeyInput = $('api-key-input');
const contextInput = $('context-input');
const keyLabel = $('key-label');
const keyHint = $('key-hint');
const modelSelect = $('model-select');
const btnStart = $('btn-start');
const btnShare = $('btn-share-screen');
const btnStop = $('btn-stop-screen');
const btnSend = $('btn-send');
const btnClear = $('btn-clear');
const btnChange = $('btn-change-provider');
const chatInput = $('chat-input');
const messagesEl = $('messages');
const videoEl = $('screen-video');
const placeholder = $('screen-placeholder');
const statusDot = $('status-dot');
const statusText = $('status-text');
const autoCapture = $('auto-capture');
const canvas = $('capture-canvas');
const ctx2d = canvas.getContext('2d');
const noVisionWarn = $('no-vision-warn');
const activePill = $('active-provider-pill');
const activePillIcon = $('active-provider-icon');
const activePillName = $('active-provider-name');
const chatPanelHdr = $('chat-panel-header');

// ═══════════════════════════════════════════════════════════════
// SETUP — GERAÇÃO DINÂMICA DOS CARDS DE PROVEDOR
// ═══════════════════════════════════════════════════════════════
function renderProviderGrid() {
    const grid = $('provider-grid');
    grid.innerHTML = '';

    Object.entries(PROVIDERS).forEach(([key, p]) => {
        const card = document.createElement('div');
        card.className = `provider-card${key === selectedProvider ? ' selected' : ''}`;
        card.dataset.provider = key;

        const visionBadge = p.supportsVision
            ? '<span class="badge--vision">👁 Vê a tela</span>'
            : '<span class="badge--no-vision">💬 Só texto</span>';

        card.innerHTML = `
      <div class="provider-card__icon" style="background:${p.iconBg}">${p.icon}</div>
      <div class="provider-card__info">
        <div class="provider-card__name">${p.name}</div>
        <div class="provider-card__desc">${p.models[0].label}</div>
        ${visionBadge}
      </div>
    `;

        card.addEventListener('click', () => {
            grid.querySelectorAll('.provider-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedProvider = key;
            updateSetupUI();
        });

        grid.appendChild(card);
    });
}

function updateSetupUI() {
    const p = PROVIDERS[selectedProvider];
    keyLabel.textContent = p.keyLabel;
    keyHint.innerHTML = p.keyHint;
    apiKeyInput.placeholder = p.keyPlaceholder;
    apiKeyInput.value = '';
    apiKeyInput.classList.remove('error');

    modelSelect.innerHTML = p.models
        .map(m => `<option value="${m.id}">${m.label}</option>`)
        .join('');
}

// Inicializar
renderProviderGrid();
updateSetupUI();

// ═══════════════════════════════════════════════════════════════
// SETUP — INICIAR SESSÃO
// ═══════════════════════════════════════════════════════════════
btnStart.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (!key) {
        apiKeyInput.classList.add('error');
        apiKeyInput.focus();
        return;
    }

    apiKey = key;
    selectedModel = modelSelect.value;
    userContext = contextInput.value.trim();

    // Trocar telas
    setupScreen.style.display = 'none';
    appScreen.classList.add('visible');
    setStatus('active', 'Pronto para ajudar');

    // Atualizar header
    const p = PROVIDERS[selectedProvider];
    activePillIcon.textContent = p.icon;
    const modelLabel = p.models.find(m => m.id === selectedModel)?.label || selectedModel;
    activePillName.textContent = `${p.name} · ${modelLabel}`;
    activePill.style.display = 'flex';
    chatPanelHdr.textContent = `💬 Chat · ${p.name}`;

    // Visão
    const supportsVision = p.supportsVision;
    noVisionWarn.style.display = supportsVision ? 'none' : 'flex';
    autoCapture.disabled = !supportsVision;
    if (!supportsVision) autoCapture.checked = false;

    // Mensagem de boas-vindas com contexto
    if (userContext) {
        addMessage('ai', `Olá! Entendido — vou levar em conta que **${userContext}**. Pode compartilhar sua tela e me fazer perguntas. Estou aqui para te guiar passo a passo! 🚀`);
        conversationHistory.push(buildUserMsg(`Contexto sobre mim: ${userContext}`, null));
        conversationHistory.push(buildAssistantMsg(`Olá! Entendido — vou levar em conta que ${userContext}. Pode compartilhar sua tela e me fazer perguntas. Estou aqui para te guiar passo a passo! 🚀`));
    }

    chatInput.focus();
});

apiKeyInput.addEventListener('input', () => apiKeyInput.classList.remove('error'));
apiKeyInput.addEventListener('keydown', e => { if (e.key === 'Enter') btnStart.click(); });

// ═══════════════════════════════════════════════════════════════
// TROCAR MODELO
// ═══════════════════════════════════════════════════════════════
btnChange.addEventListener('click', () => {
    if (mediaStream) stopScreen();
    appScreen.classList.remove('visible');
    setupScreen.style.display = 'flex';
    conversationHistory = [];
    activePill.style.display = 'none';
    resetChat();
});

// ═══════════════════════════════════════════════════════════════
// STATUS
// ═══════════════════════════════════════════════════════════════
function setStatus(type, text) {
    statusDot.className = 'status-dot ' + type;
    statusText.textContent = text;
}

// ═══════════════════════════════════════════════════════════════
// COMPARTILHAMENTO DE TELA
// ═══════════════════════════════════════════════════════════════
btnShare.addEventListener('click', async () => {
    if (!PROVIDERS[selectedProvider].supportsVision) {
        addSystemNote('⚠️ Este modelo não suporta visão de tela. Troque para Gemini, GPT-4o ou Claude para usar essa função.');
        return;
    }
    try {
        mediaStream = await navigator.mediaDevices.getDisplayMedia({
            video: { cursor: 'always' },
            audio: false,
        });
        videoEl.srcObject = mediaStream;
        videoEl.style.display = 'block';
        placeholder.style.display = 'none';
        btnShare.style.display = 'none';
        btnStop.style.display = 'flex';
        setStatus('recording', 'Tela sendo capturada');

        mediaStream.getVideoTracks()[0].addEventListener('ended', stopScreen);
        addSystemNote('✅ Tela compartilhada! Agora posso ver o que você está fazendo. Me faça uma pergunta!');
    } catch (err) {
        if (err.name !== 'NotAllowedError') {
            addSystemNote('❌ Erro ao compartilhar tela: ' + err.message);
        }
    }
});

btnStop.addEventListener('click', stopScreen);

function stopScreen() {
    if (mediaStream) {
        mediaStream.getTracks().forEach(t => t.stop());
        mediaStream = null;
    }
    videoEl.style.display = 'none';
    videoEl.srcObject = null;
    placeholder.style.display = 'flex';
    btnStop.style.display = 'none';
    btnShare.style.display = 'flex';
    setStatus('active', 'Captura encerrada');
    addSystemNote('⏹ Compartilhamento de tela encerrado.');
}

function captureFrame() {
    if (!mediaStream || videoEl.readyState < 2) return null;
    const w = videoEl.videoWidth;
    const h = videoEl.videoHeight;
    if (!w || !h) return null;
    const ratio = Math.min(1, 1280 / w);
    canvas.width = Math.round(w * ratio);
    canvas.height = Math.round(h * ratio);
    ctx2d.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.75).split(',')[1];
}

// ═══════════════════════════════════════════════════════════════
// CHAT — ENVIO DE MENSAGENS
// ═══════════════════════════════════════════════════════════════
chatInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});
chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
});
btnSend.addEventListener('click', sendMessage);
btnClear.addEventListener('click', clearChat);

async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text || isProcessing) return;

    chatInput.value = '';
    chatInput.style.height = 'auto';
    isProcessing = true;
    btnSend.disabled = true;
    setStatus('recording', 'Pensando...');

    const supportsVision = PROVIDERS[selectedProvider].supportsVision;
    const shouldCapture = autoCapture.checked && supportsVision;
    const frameB64 = shouldCapture ? captureFrame() : null;

    addMessage('user', text, !!frameB64);

    const userMsg = buildUserMsg(text, frameB64);
    conversationHistory.push(userMsg);

    const thinkingId = addThinkingBubble();

    try {
        const reply = await callProvider();
        conversationHistory.push(buildAssistantMsg(reply));
        removeThinkingBubble(thinkingId);
        addMessage('ai', reply);
        setStatus('active', 'Pronto para ajudar');
    } catch (err) {
        removeThinkingBubble(thinkingId);
        const pName = PROVIDERS[selectedProvider].name;
        addMessage('ai', `❌ **Erro ao chamar ${pName}:**\n${err.message}\n\nVerifique se sua chave de API está correta e tente novamente.`);
        setStatus('active', 'Erro na última chamada');
    }

    isProcessing = false;
    btnSend.disabled = false;
    chatInput.focus();
}

// ═══════════════════════════════════════════════════════════════
// CONSTRUÇÃO DE MENSAGENS (por provedor)
// ═══════════════════════════════════════════════════════════════
function buildUserMsg(text, frameB64) {
    // Gemini — formato parts
    if (selectedProvider === 'gemini') {
        const parts = [];
        if (frameB64) parts.push({ inline_data: { mime_type: 'image/jpeg', data: frameB64 } });
        parts.push({ text });
        return { role: 'user', parts };
    }
    // Claude — formato content array
    if (selectedProvider === 'claude') {
        const content = [];
        if (frameB64) content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: frameB64 } });
        content.push({ type: 'text', text });
        return { role: 'user', content };
    }
    // OpenAI-compat com visão
    if (frameB64) {
        return {
            role: 'user',
            content: [
                { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${frameB64}` } },
                { type: 'text', text },
            ],
        };
    }
    // Texto simples
    return { role: 'user', content: text };
}

function buildAssistantMsg(reply) {
    if (selectedProvider === 'gemini') {
        return { role: 'model', parts: [{ text: reply }] };
    }
    return { role: 'assistant', content: reply };
}

// ═══════════════════════════════════════════════════════════════
// CHAMADAS DE API
// ═══════════════════════════════════════════════════════════════
async function callProvider() {
    switch (selectedProvider) {
        case 'gemini': return callGemini();
        case 'openai': return callOpenAICompat(PROVIDERS.openai.endpoint());
        case 'claude': return callClaude();
        case 'deepseek': return callOpenAICompat(PROVIDERS.deepseek.endpoint());
        case 'mistral': return callOpenAICompat(PROVIDERS.mistral.endpoint());
        case 'groq': return callOpenAICompat(PROVIDERS.groq.endpoint());
        default: throw new Error('Provedor desconhecido');
    }
}

async function callGemini() {
    const url = `${PROVIDERS.gemini.endpoint(selectedModel)}?key=${apiKey}`;
    const body = {
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: conversationHistory,
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
    };
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.error?.message || `HTTP ${res.status}`);
    }
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sem resposta.';
}

async function callOpenAICompat(endpoint) {
    const supportsVision = PROVIDERS[selectedProvider].supportsVision;
    // Para provedores sem visão, simplificar mensagens com imagem para texto puro
    const msgs = conversationHistory.map(m => {
        if (!supportsVision && Array.isArray(m.content)) {
            const textPart = m.content.find(c => c.type === 'text');
            return { role: m.role, content: textPart ? textPart.text : '[mensagem sem texto]' };
        }
        return m;
    });
    const body = {
        model: selectedModel,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...msgs],
        max_tokens: 2048,
        temperature: 0.7,
    };
    const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.error?.message || `HTTP ${res.status}`);
    }
    const data = await res.json();
    return data?.choices?.[0]?.message?.content || 'Sem resposta.';
}

async function callClaude() {
    const body = {
        model: selectedModel,
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: conversationHistory,
    };
    const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.error?.message || `HTTP ${res.status}`);
    }
    const data = await res.json();
    return data?.content?.[0]?.text || 'Sem resposta.';
}

// ═══════════════════════════════════════════════════════════════
// RENDERIZAÇÃO DE MARKDOWN
// ═══════════════════════════════════════════════════════════════
function renderMarkdown(text) {
    return text
        // Escape HTML
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        // Blocos de código
        .replace(/```[\w]*\n?([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        // Código inline
        .replace(/`([^`\n]+)`/g, '<code>$1</code>')
        // Negrito e itálico
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        // Títulos
        .replace(/^#{1,3} (.+)$/gm, '<strong style="font-size:15px;display:block;margin:6px 0 4px">$1</strong>')
        // Listas numeradas (bug corrigido: dois grupos de captura)
        .replace(/^(\d+)\. (.+)$/gm, '<div style="padding-left:14px;margin:3px 0">$1. $2</div>')
        // Listas não-numeradas
        .replace(/^[-*] (.+)$/gm, '<div style="padding-left:14px;margin:3px 0">• $1</div>')
        // Quebras de linha
        .replace(/\n\n/g, '<br><br>')
        .replace(/\n/g, '<br>');
}

// ═══════════════════════════════════════════════════════════════
// GERENCIAMENTO DAS MENSAGENS NO DOM
// ═══════════════════════════════════════════════════════════════
function addMessage(role, text, hasScreenshot = false) {
    const div = document.createElement('div');
    div.className = `msg ${role}`;
    const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const screenshotTag = hasScreenshot ? '<div class="msg__screenshot">🖼️ Captura de tela incluída</div>' : '';

    div.innerHTML = `
    <div class="msg__avatar">${role === 'user' ? '👤' : '🤖'}</div>
    <div class="msg__body">
      <div class="msg__bubble">${renderMarkdown(text)}${screenshotTag}</div>
      <div class="msg__time">${now}</div>
    </div>
  `;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

function addSystemNote(text) {
    const div = document.createElement('div');
    div.className = 'system-note';
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

function addThinkingBubble() {
    const id = 'thinking-' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = 'msg ai';
    div.innerHTML = `
    <div class="msg__avatar">🤖</div>
    <div class="msg__body">
      <div class="msg__bubble thinking">
        Analisando
        <span class="thinking-dots">
          <span></span><span></span><span></span>
        </span>
      </div>
    </div>
  `;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return id;
}

function removeThinkingBubble(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function clearChat() {
    conversationHistory = [];
    messagesEl.innerHTML = `
    <div class="welcome">
      <div class="welcome__icon">🔄</div>
      <h3>Chat limpo! Vamos começar de novo.</h3>
      <p>Compartilhe sua tela e me faça qualquer pergunta.</p>
    </div>
  `;
}

function resetChat() {
    messagesEl.innerHTML = `
    <div class="welcome">
      <div class="welcome__icon">👋</div>
      <h3>Olá! Sou seu Mentor de Langflow</h3>
      <p>Compartilhe sua tela e me faça qualquer pergunta.<br>
      Vejo o que você está fazendo e te oriento passo a passo.</p>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS — para testes com Jest (ignorado pelo navegador)
// ═══════════════════════════════════════════════════════════════
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        // Funções puras
        renderMarkdown,
        buildUserMsg,
        buildAssistantMsg,
        // Funções de DOM
        addMessage,
        addSystemNote,
        addThinkingBubble,
        removeThinkingBubble,
        clearChat,
        resetChat,
        setStatus,
        // Funções de captura
        captureFrame,
        stopScreen,
        // Funções de API
        callProvider,
        callGemini,
        callOpenAICompat,
        callClaude,
        // Acesso ao estado interno (para testes)
        getState: () => ({
            selectedProvider, apiKey, selectedModel,
            userContext, mediaStream, conversationHistory, isProcessing,
        }),
        setState: (patch) => {
            if ('selectedProvider' in patch) selectedProvider = patch.selectedProvider;
            if ('apiKey' in patch) apiKey = patch.apiKey;
            if ('selectedModel' in patch) selectedModel = patch.selectedModel;
            if ('userContext' in patch) userContext = patch.userContext;
            if ('mediaStream' in patch) mediaStream = patch.mediaStream;
            if ('conversationHistory' in patch) conversationHistory = patch.conversationHistory;
            if ('isProcessing' in patch) isProcessing = patch.isProcessing;
        },
    };
}
