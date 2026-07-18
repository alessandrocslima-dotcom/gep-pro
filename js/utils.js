/* ═══════════════════════════════════════════
   GEP — Gestão de Eventos Pro
   utils.js — Funções utilitárias compartilhadas
   ═══════════════════════════════════════════ */

/* ══════════════════════════════════════
   TOAST (notificações)
══════════════════════════════════════ */

let _toastTimer = null;

function toast(msg, tipo = 'ok', duracao = 3000) {
  const el = document.getElementById('toast');
  if (!el) return;

  el.textContent = msg;
  el.className = `${tipo} visivel`;

  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => {
    el.classList.remove('visivel');
  }, duracao);
}

/* ══════════════════════════════════════
   FORMATAÇÃO DE DATAS
══════════════════════════════════════ */

/* Formata data ISO para DD/MM/AAAA */
function formatarData(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('pt-BR');
  } catch { return iso; }
}

/* Formata data ISO para texto longo: "Segunda, 15 de Julho de 2026" */
function formatarDataLonga(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('pt-BR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  } catch { return iso; }
}

/* Data e hora atual no formato ISO */
function agora() {
  return new Date().toISOString();
}

/* Data atual no formato AAAA-MM-DD */
function hoje() {
  return new Date().toISOString().split('T')[0];
}

/* Saudação por horário */
function saudacao() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

/* ══════════════════════════════════════
   FORMATAÇÃO DE VALORES
══════════════════════════════════════ */

/* Formata número para moeda BRL */
function formatarMoeda(valor) {
  if (valor === null || valor === undefined) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL'
  }).format(Number(valor) || 0);
}

/* ══════════════════════════════════════
   GERAÇÃO DE IDs
══════════════════════════════════════ */

function gerarId(prefixo = 'id') {
  return `${prefixo}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

/* ══════════════════════════════════════
   VALIDAÇÕES
══════════════════════════════════════ */

function vazio(val) {
  return val === null || val === undefined || String(val).trim() === '';
}

function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ══════════════════════════════════════
   CONFIRMAÇÃO
══════════════════════════════════════ */

function confirmar(msg) {
  return window.confirm(msg);
}

/* ══════════════════════════════════════
   WHATSAPP
══════════════════════════════════════ */

function abrirWhatsApp(telefone, mensagem) {
  const tel = telefone.replace(/\D/g, '');
  const url = `https://wa.me/55${tel}?text=${encodeURIComponent(mensagem)}`;
  window.open(url, '_blank');
}

/* ══════════════════════════════════════
   WAZE / GPS
══════════════════════════════════════ */

function abrirWaze(endereco) {
  const url = `https://waze.com/ul?q=${encodeURIComponent(endereco)}&navigate=yes`;
  window.open(url, '_blank');
}

function abrirGoogleMaps(endereco) {
  const url = `https://maps.google.com/?q=${encodeURIComponent(endereco)}`;
  window.open(url, '_blank');
}

/* ── Exportar ── */
window.GepUtils = {
  toast,
  formatarData,
  formatarDataLonga,
  agora,
  hoje,
  saudacao,
  formatarMoeda,
  gerarId,
  vazio,
  validarEmail,
  confirmar,
  abrirWhatsApp,
  abrirWaze,
  abrirGoogleMaps
};

/* Atalhos globais */
window.toast = toast;
