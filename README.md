# 🤖 Mentor IA — Langflow

[![Testes Automatizados](https://github.com/antoniogomes2504-del/desenvolvedor_mentor/actions/workflows/tests.yml/badge.svg)](https://github.com/antoniogomes2504-del/desenvolvedor_mentor/actions/workflows/tests.yml)
[![Deploy GitHub Pages](https://github.com/antoniogomes2504-del/desenvolvedor_mentor/actions/workflows/deploy.yml/badge.svg)](https://github.com/antoniogomes2504-del/desenvolvedor_mentor/actions/workflows/deploy.yml)

> Assistente de IA com visão de tela em tempo real para aprender Langflow — roda 100% no navegador, sem backend.

## ✨ Funcionalidades

- 🖥️ **Compartilhamento de tela ao vivo** — a IA vê o que você está fazendo
- 💬 **Chat em tempo real** — pergunte qualquer coisa sobre Langflow
- 🧠 **6 provedores de IA** — Gemini, OpenAI, Claude, DeepSeek, Mistral, Groq
- 👁️ **Visão de tela** — Gemini, GPT-4o e Claude analisam suas capturas
- 📱 **Responsivo** — funciona no desktop e mobile
- 🔒 **Privacidade total** — sua chave de API fica apenas no navegador
- 🎨 **Tema escuro moderno** — interface premium com animações suaves
- 📝 **Markdown no chat** — negrito, itálico, código, listas

## 🚀 Como usar

### Uso local (sem instalação)
Basta abrir o arquivo `src/index.html` no navegador (Chrome ou Edge recomendados):

```bash
# Clone o repositório
git clone https://github.com/antoniogomes2504-del/desenvolvedor_mentor.git
cd desenvolvedor_mentor

# Abra no navegador
start src/index.html      # Windows
open src/index.html       # macOS
xdg-open src/index.html   # Linux
```

### Online (GitHub Pages)
Acesse: **[https://antoniogomes2504-del.github.io/desenvolvedor_mentor/](https://antoniogomes2504-del.github.io/desenvolvedor_mentor/)**

## 🧪 Testes automatizados

O projeto usa **Jest** com **jsdom** para testes automatizados:

```bash
# Instalar dependências de desenvolvimento
npm install

# Rodar todos os testes com cobertura
npm test

# Rodar testes em modo watch (desenvolvimento)
npm run test:watch

# Rodar testes em modo CI (sem interação)
npm run test:ci
```

### Cobertura dos testes

| Arquivo de teste      | O que testa                                               |
| --------------------- | --------------------------------------------------------- |
| `providers.test.js`   | Configuração dos 6 provedores, modelos, visão, endpoints  |
| `capture.test.js`     | Captura de tela, redimensionamento, stop/cleanup          |
| `chat.test.js`        | Markdown, mensagens, histórico, formatos por provedor     |
| `api.test.js`         | Chamadas HTTP, headers, erros, strip de imagens           |

**Meta de cobertura:** 80% de linhas e funções.

## 📁 Estrutura do projeto

```
desenvolvedor_mentor/
├── src/
│   ├── index.html          # Página principal
│   ├── assets/
│   │   └── style.css       # Estilos (dark theme, responsivo)
│   └── js/
│       ├── app.js           # Lógica principal
│       └── providers.js     # Configuração dos provedores de IA
├── tests/
│   ├── providers.test.js    # Testes de provedores
│   ├── capture.test.js      # Testes de captura de tela
│   ├── chat.test.js         # Testes de chat e markdown
│   └── api.test.js          # Testes de chamadas de API
├── .github/
│   └── workflows/
│       ├── tests.yml        # CI: testes em todo push/PR
│       └── deploy.yml       # CD: deploy no GitHub Pages
├── package.json             # Dependências e scripts
├── .gitignore               # Ignora node_modules, coverage, .env
└── README.md                # Este arquivo
```

## 🔑 Chaves de API

Cada provedor requer uma chave de API gratuita ou paga:

| Provedor  | Como obter a chave                                              | Visão |
| --------- | --------------------------------------------------------------- | ----- |
| Gemini    | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) | ✅     |
| OpenAI    | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) | ✅     |
| Claude    | [console.anthropic.com](https://console.anthropic.com/settings/keys) | ✅     |
| DeepSeek  | [platform.deepseek.com](https://platform.deepseek.com/api_keys) | ❌     |
| Mistral   | [console.mistral.ai](https://console.mistral.ai/api-keys)      | ❌     |
| Groq      | [console.groq.com](https://console.groq.com/keys)              | ❌     |

## 🤝 Como contribuir

1. Faça um **fork** do repositório
2. Crie uma branch para sua feature: `git checkout -b feature/minha-feature`
3. Faça suas alterações e adicione testes
4. Rode os testes: `npm test`
5. Faça commit: `git commit -m "feat: descrição da feature"`
6. Envie sua branch: `git push origin feature/minha-feature`
7. Abra um **Pull Request**

> ⚠️ Todo PR roda os testes automaticamente. O merge só é liberado se os testes passarem.

## 🔒 Segurança e Privacidade

- ✅ Chaves de API ficam **apenas na memória do navegador** (nunca salvas)
- ✅ Nenhum dado é enviado para servidores próprios
- ✅ Capturas de tela são enviadas **diretamente** para a API do provedor escolhido
- ✅ Código 100% aberto e auditável

## 🛠️ Tecnologias

- HTML5, CSS3, JavaScript (ES2020+)
- [Jest](https://jestjs.io/) + jsdom para testes
- [GitHub Actions](https://github.com/features/actions) para CI/CD
- [GitHub Pages](https://pages.github.com/) para deploy

---

Feito com ❤️ para a comunidade Langflow 🇧🇷
