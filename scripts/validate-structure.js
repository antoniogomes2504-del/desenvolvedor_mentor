#!/usr/bin/env node
/**
 * scripts/validate-structure.js
 * Validação de estrutura do projeto antes de commit/deploy
 * 
 * Detecta:
 * 1. Arquivos duplicados (mesmo nome em src/ e na raiz)
 * 2. Arquivos que deveriam estar apenas em src/
 * 3. Referências quebradas em index.html
 * 
 * Uso: node scripts/validate-structure.js
 * Retorna exit code 1 se encontrar problemas.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const errors = [];
const warnings = [];

console.log('🔍 Validando estrutura do projeto...\n');

// ═══════════════════════════════════════════════════════════════
// 1. Verificar arquivos duplicados: raiz vs src/
// ═══════════════════════════════════════════════════════════════
function checkDuplicates() {
    console.log('📁 Verificando arquivos duplicados...');

    // Coletar todos os arquivos em src/ recursivamente
    const srcFiles = new Map();
    function walkSrc(dir, prefix = '') {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                walkSrc(fullPath, prefix + entry.name + '/');
            } else {
                srcFiles.set(entry.name, prefix + entry.name);
            }
        }
    }
    walkSrc(SRC);

    // Verificar se algum arquivo na raiz tem o mesmo nome que em src/
    const rootEntries = fs.readdirSync(ROOT, { withFileTypes: true });
    const ignoreDirs = new Set(['.git', '.github', 'node_modules', 'coverage', 'src', 'tests', 'scripts']);
    const ignoreFiles = new Set([
        'package.json', 'package-lock.json', 'README.md', '.gitignore',
        '.env', '.env.local', '.env.example',
    ]);

    for (const entry of rootEntries) {
        if (entry.isDirectory() && ignoreDirs.has(entry.name)) continue;
        if (entry.isDirectory()) continue;
        if (ignoreFiles.has(entry.name)) continue;

        if (srcFiles.has(entry.name)) {
            errors.push(
                `❌ DUPLICADO: "${entry.name}" existe na raiz E em src/${srcFiles.get(entry.name)}\n` +
                `   → Remova o arquivo da raiz: ${path.join(ROOT, entry.name)}`
            );
        } else {
            // Arquivo na raiz que não está no src/ — pode ser legado
            const ext = path.extname(entry.name).toLowerCase();
            if (['.js', '.css', '.html'].includes(ext)) {
                warnings.push(
                    `⚠️  LEGADO: "${entry.name}" na raiz não pertence à estrutura src/\n` +
                    `   → Considere mover para src/ ou deletar`
                );
            }
        }
    }

    if (errors.length === 0 && warnings.length === 0) {
        console.log('   ✅ Nenhum arquivo duplicado encontrado\n');
    }
}

// ═══════════════════════════════════════════════════════════════
// 2. Verificar que git não rastreia arquivos proibidos
// ═══════════════════════════════════════════════════════════════
function checkGitTracking() {
    console.log('🔒 Verificando rastreamento do git...');

    const { execSync } = require('child_process');
    let trackedFiles;
    try {
        trackedFiles = execSync('git ls-files', { cwd: ROOT, encoding: 'utf-8' })
            .trim()
            .split('\n')
            .filter(Boolean);
    } catch {
        console.log('   ⏭  Não é um repositório git, pulando...\n');
        return;
    }

    // Arquivos que NÃO devem estar rastreados
    const forbidden = ['app.js', 'index.html', 'providers.js', 'style.css', 'langflow-mentor.html'];
    for (const file of forbidden) {
        if (trackedFiles.includes(file)) {
            errors.push(
                `❌ GIT: "${file}" está sendo rastreado pelo git mas deveria estar no .gitignore\n` +
                `   → Execute: git rm --cached ${file}`
            );
        }
    }

    if (errors.length === 0) {
        console.log('   ✅ Nenhum arquivo proibido rastreado pelo git\n');
    }
}

// ═══════════════════════════════════════════════════════════════
// 3. Verificar referências no index.html
// ═══════════════════════════════════════════════════════════════
function checkHTMLReferences() {
    console.log('🔗 Verificando referências no index.html...');

    const indexPath = path.join(SRC, 'index.html');
    if (!fs.existsSync(indexPath)) {
        errors.push('❌ src/index.html não encontrado!');
        return;
    }

    const html = fs.readFileSync(indexPath, 'utf-8');

    // Encontrar todos os src= e href= locais
    const refRegex = /(?:src|href)=["'](?!https?:\/\/|\/\/|#|data:|mailto:)([^"']+)["']/g;
    let match;
    while ((match = refRegex.exec(html)) !== null) {
        const ref = match[1];
        const resolvedPath = path.join(SRC, ref);
        if (!fs.existsSync(resolvedPath)) {
            errors.push(
                `❌ REFERÊNCIA QUEBRADA: index.html referencia "${ref}" mas o arquivo não existe\n` +
                `   → Esperado em: ${resolvedPath}`
            );
        }
    }

    if (errors.length === 0) {
        console.log('   ✅ Todas as referências estão corretas\n');
    }
}

// ═══════════════════════════════════════════════════════════════
// 4. Verificar estrutura obrigatória
// ═══════════════════════════════════════════════════════════════
function checkRequiredStructure() {
    console.log('📋 Verificando arquivos obrigatórios...');

    const required = [
        'src/index.html',
        'src/assets/style.css',
        'src/js/app.js',
        'src/js/providers.js',
        'src/js/profiles.js',
        'tests/providers.test.js',
        'tests/capture.test.js',
        'tests/chat.test.js',
        'tests/api.test.js',
        'tests/profiles.test.js',
        'package.json',
        '.gitignore',
        'README.md',
    ];

    for (const file of required) {
        const fullPath = path.join(ROOT, file);
        if (!fs.existsSync(fullPath)) {
            errors.push(`❌ FALTANDO: Arquivo obrigatório "${file}" não encontrado`);
        }
    }

    if (errors.length === 0) {
        console.log('   ✅ Todos os arquivos obrigatórios existem\n');
    }
}

// ═══════════════════════════════════════════════════════════════
// Executar todas as verificações
// ═══════════════════════════════════════════════════════════════
checkDuplicates();
checkGitTracking();
checkHTMLReferences();
checkRequiredStructure();

// Resultado final
console.log('════════════════════════════════════════════════');
if (warnings.length > 0) {
    console.log('\n⚠️  AVISOS:');
    warnings.forEach(w => console.log(`   ${w}`));
}

if (errors.length > 0) {
    console.log('\n❌ ERROS ENCONTRADOS:');
    errors.forEach(e => console.log(`   ${e}`));
    console.log(`\n🚫 Validação FALHOU — ${errors.length} erro(s) encontrado(s)`);
    console.log('   Corrija os erros acima antes de fazer commit/push.\n');
    process.exit(1);
} else {
    console.log('\n✅ Validação PASSOU — estrutura do projeto está correta!\n');
    process.exit(0);
}
