/* ═══════════════════════════════════════════
   GEP — Gestão de Eventos Pro
   auth.js — Autenticação e permissões
   ═══════════════════════════════════════════ */

/* ── Usuário atual ── */
let usuarioAtual = null;

/* ── Perfis disponíveis ── */
const PERFIS = {
  admin:    { label: 'Administrador',      nivel: 3 },
  coord:    { label: 'Coordenador',        nivel: 2 },
  produtor: { label: 'Produtor',           nivel: 1 }
};

/* ── Empresas ── */
const EMPRESAS = {
  inter:  { label: 'InterEventos', cor: 'inter'  },
  vivere: { label: 'Vivere',       cor: 'vivere' }
};

/* ══════════════════════════════════════
   INICIALIZAÇÃO
══════════════════════════════════════ */

function inicializarAuth() {
  GepFirebase.observarAuth(async (userFirebase) => {
    if (userFirebase) {
      // Usuário logado no Firebase — buscar perfil no Firestore
      try {
        const perfil = await GepFirebase.buscarPerfil(userFirebase.uid);
        if (perfil && perfil.ativo !== false) {
          usuarioAtual = { ...perfil, uid: userFirebase.uid, email: userFirebase.email };
          aoLogar();
        } else {
          // Perfil não encontrado ou desativado
          await GepFirebase.logout();
          mostrarErroLogin('Usuário sem acesso ao sistema.');
        }
      } catch (e) {
        console.error('Erro ao buscar perfil:', e);
        mostrarErroLogin('Erro ao carregar perfil. Tente novamente.');
      }
    } else {
      // Não está logado
      usuarioAtual = null;
      aoDeslogar();
    }
  });
}

/* ══════════════════════════════════════
   LOGIN / LOGOUT
══════════════════════════════════════ */

async function fazerLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const senha = document.getElementById('loginSenha').value;
  const btn   = document.getElementById('btnLogin');
  const erro  = document.getElementById('loginErro');

  if (!email || !senha) {
    mostrarErroLogin('Preencha e-mail e senha.');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Entrando...';
  erro.classList.remove('ativo');

  try {
    await GepFirebase.login(email, senha);
    // onAuthStateChanged vai cuidar do resto
  } catch (e) {
    btn.disabled = false;
    btn.textContent = 'Entrar';
    const msgs = {
      'auth/user-not-found':  'Usuário não encontrado.',
      'auth/wrong-password':  'Senha incorreta.',
      'auth/invalid-email':   'E-mail inválido.',
      'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos.',
      'auth/user-disabled':   'Usuário desativado.'
    };
    mostrarErroLogin(msgs[e.code] || 'Erro ao entrar. Tente novamente.');
  }
}

async function fazerLogout() {
  try {
    await GepFirebase.logout();
  } catch (e) {
    console.error('Erro ao sair:', e);
  }
}

async function redefinirSenha() {
  const email = document.getElementById('loginEmail').value.trim();
  if (!email) {
    mostrarErroLogin('Digite seu e-mail para redefinir a senha.');
    return;
  }
  try {
    await GepFirebase.redefinirSenha(email);
    mostrarErroLogin('✅ E-mail de redefinição enviado!');
  } catch (e) {
    mostrarErroLogin('Erro ao enviar e-mail. Verifique o endereço.');
  }
}

/* ══════════════════════════════════════
   CALLBACKS
══════════════════════════════════════ */

function aoLogar() {
  // Esconder login, mostrar app
  document.getElementById('pgLogin').classList.remove('ativo');
  document.getElementById('pgApp').classList.add('ativo');

  // Atualizar UI com dados do usuário
  atualizarUIUsuario();

  // Aplicar permissões no menu
  aplicarPermissoesMenu();

  // Iniciar observador de manutenção
  iniciarObservadorManutencao();

  // Navegar para o dashboard
  GepNav.ir('dashboard');

  console.log('✅ Logado como:', usuarioAtual.nome, '|', usuarioAtual.perfil);
}

function aoDeslogar() {
  document.getElementById('pgApp').classList.remove('ativo');
  document.getElementById('pgLogin').classList.add('ativo');

  // Limpar campos de login
  const email = document.getElementById('loginEmail');
  const senha = document.getElementById('loginSenha');
  if (email) email.value = '';
  if (senha) senha.value = '';

  // Resetar botão
  const btn = document.getElementById('btnLogin');
  if (btn) { btn.disabled = false; btn.textContent = 'Entrar'; }
}

/* ══════════════════════════════════════
   UI DO USUÁRIO
══════════════════════════════════════ */

function atualizarUIUsuario() {
  const u = usuarioAtual;
  if (!u) return;

  // Avatar com inicial do nome
  const inicial = (u.nome || u.email || '?')[0].toUpperCase();
  const avatar  = document.getElementById('sbAvatar');
  if (avatar) avatar.textContent = inicial;

  // Nome e perfil na sidebar
  const nome   = document.getElementById('sbNome');
  const perfil = document.getElementById('sbPerfil');
  if (nome)   nome.textContent   = u.nome || u.email;
  if (perfil) perfil.textContent = PERFIS[u.perfil]?.label || u.perfil;

  // Nome na topbar
  const tbNome = document.getElementById('tbNomeUsuario');
  if (tbNome) tbNome.textContent = u.nome || u.email;
}

function mostrarErroLogin(msg) {
  const el = document.getElementById('loginErro');
  if (el) { el.textContent = msg; el.classList.add('ativo'); }
}

/* ══════════════════════════════════════
   PERMISSÕES
══════════════════════════════════════ */

/* Verificar se usuário tem permissão */
function temPermissao(nivelMinimo) {
  if (!usuarioAtual) return false;
  const nivel = PERFIS[usuarioAtual.perfil]?.nivel || 0;
  return nivel >= nivelMinimo;
}

function ehAdmin()       { return usuarioAtual?.perfil === 'admin'; }
function ehCoordenador() { return usuarioAtual?.perfil === 'coord' || ehAdmin(); }
function ehProdutor()    { return !!usuarioAtual; }

/* Aplicar visibilidade no menu conforme perfil */
function aplicarPermissoesMenu() {
  const u = usuarioAtual;
  if (!u) return;

  // Itens só para admin/coordenador
  document.querySelectorAll('[data-permissao="coord"]').forEach(el => {
    el.style.display = ehCoordenador() ? '' : 'none';
  });

  // Itens só para admin
  document.querySelectorAll('[data-permissao="admin"]').forEach(el => {
    el.style.display = ehAdmin() ? '' : 'none';
  });
}

/* Filtrar registros por visibilidade do usuário */
function filtrarPorVisibilidade(lista) {
  if (!usuarioAtual) return [];
  if (ehAdmin()) return lista; // Admin vê tudo
  if (ehCoordenador()) {
    // Coordenador vê da sua empresa
    return lista.filter(item => item.empresaId === usuarioAtual.empresa);
  }
  // Produtor vê só os seus
  return lista.filter(item => item.produtorId === usuarioAtual.id);
}

/* ══════════════════════════════════════
   MODO MANUTENÇÃO
══════════════════════════════════════ */

let _unsubManutencao = null;

function iniciarObservadorManutencao() {
  if (_unsubManutencao) _unsubManutencao();
  _unsubManutencao = GepFirebase.observarConfig((config) => {
    const emManutencao = config?.manutencao === true;
    const overlay = document.getElementById('overlayManutencao');
    if (!overlay) return;
    if (emManutencao && !ehAdmin()) {
      overlay.classList.add('ativo');
    } else {
      overlay.classList.remove('ativo');
    }
  });
}

/* ── Exportar ── */
window.GepAuth = {
  inicializar:          inicializarAuth,
  fazerLogin:           fazerLogin,
  fazerLogout:          fazerLogout,
  redefinirSenha:       redefinirSenha,
  get usuario()         { return usuarioAtual; },
  ehAdmin,
  ehCoordenador,
  ehProdutor,
  temPermissao,
  filtrarPorVisibilidade,
  PERFIS,
  EMPRESAS
};
