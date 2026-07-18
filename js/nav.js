/* ═══════════════════════════════════════════
   GEP — Gestão de Eventos Pro
   nav.js — Navegação entre módulos
   ═══════════════════════════════════════════ */

/* ── Mapa de páginas ── */
const PAGINAS = {
  'dashboard':       { titulo: 'Visitas Técnicas',   icone: '📝', view: 'vwDashboard'   },
  'orcamentos':      { titulo: 'Orçamentos',          icone: '💰', view: 'vwOrcamentos'  },
  'agenda':          { titulo: 'Agenda de Eventos',   icone: '📅', view: 'vwAgenda'      },
  'realizados':      { titulo: 'Eventos Realizados',  icone: '✅', view: 'vwRealizados'  },
  'fornecedores':    { titulo: 'Fornecedores',        icone: '🤝', view: 'vwFornecedores'},
  'secretarias':     { titulo: 'Secretarias',         icone: '🏛', view: 'vwSecretarias' },
  'catalogo':        { titulo: 'Catálogo',            icone: '📦', view: 'vwCatalogo'    },
  'relatorios':      { titulo: 'Relatórios',          icone: '📊', view: 'vwRelatorios'  },
  'administracao':   { titulo: 'Administração',       icone: '⚙️', view: 'vwAdministracao'},
  'ajuda':           { titulo: 'Ajuda',               icone: '❓', view: 'vwAjuda'       }
};

/* ── Página atual ── */
let paginaAtual = null;

/* ══════════════════════════════════════
   NAVEGAÇÃO
══════════════════════════════════════ */

function irParaPagina(pagina) {
  const cfg = PAGINAS[pagina];
  if (!cfg) {
    console.warn('Página não encontrada:', pagina);
    return;
  }

  // Esconder todas as views
  document.querySelectorAll('.view').forEach(v => v.classList.remove('ativa'));

  // Mostrar a view correta
  const view = document.getElementById(cfg.view);
  if (view) {
    view.classList.add('ativa');
  } else {
    console.warn('View não encontrada:', cfg.view);
    return;
  }

  // Atualizar topbar
  atualizarTopbar(cfg);

  // Atualizar menu lateral
  atualizarMenuAtivo(pagina);

  // Fechar sidebar no celular
  fecharSidebarMobile();

  // Guardar página atual
  paginaAtual = pagina;

  // Chamar callback de inicialização da página
  inicializarPagina(pagina);

  // Scroll para o topo
  window.scrollTo(0, 0);
}

/* ══════════════════════════════════════
   TOPBAR
══════════════════════════════════════ */

function atualizarTopbar(cfg) {
  const titulo = document.getElementById('tbTitulo');
  const bread  = document.getElementById('tbBreadcrumb');
  if (titulo) titulo.textContent = cfg.titulo;
  if (bread)  bread.innerHTML = `<span>${cfg.icone} ${cfg.titulo}</span>`;
}

/* ══════════════════════════════════════
   MENU LATERAL
══════════════════════════════════════ */

function atualizarMenuAtivo(pagina) {
  document.querySelectorAll('.sb-item').forEach(item => {
    item.classList.toggle('ativo', item.dataset.pagina === pagina);
  });
}

/* ══════════════════════════════════════
   SIDEBAR MOBILE
══════════════════════════════════════ */

function abrirSidebarMobile() {
  document.getElementById('sidebar').classList.add('aberto');
  document.getElementById('sbOverlay').classList.add('ativo');
  document.body.style.overflow = 'hidden';
}

function fecharSidebarMobile() {
  document.getElementById('sidebar').classList.remove('aberto');
  document.getElementById('sbOverlay').classList.remove('ativo');
  document.body.style.overflow = '';
}

/* ══════════════════════════════════════
   CALLBACKS DE INICIALIZAÇÃO
══════════════════════════════════════ */

function inicializarPagina(pagina) {
  // Cada módulo registra seu próprio callback
  const cb = _callbacks[pagina];
  if (typeof cb === 'function') {
    try { cb(); } catch (e) { console.error('Erro ao inicializar página', pagina, e); }
  }
}

/* Mapa de callbacks — cada módulo registra o seu */
const _callbacks = {};

function registrarCallback(pagina, fn) {
  _callbacks[pagina] = fn;
}

/* ── Exportar ── */
window.GepNav = {
  ir:                 irParaPagina,
  registrarCallback:  registrarCallback,
  abrirSidebar:       abrirSidebarMobile,
  fecharSidebar:      fecharSidebarMobile,
  get paginaAtual()   { return paginaAtual; },
  PAGINAS
};
