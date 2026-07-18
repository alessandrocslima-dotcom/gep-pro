/* ═══════════════════════════════════════════
   GEP — Gestão de Eventos Pro
   visitas.js — Módulo de Visitas Técnicas
   ═══════════════════════════════════════════ */

/* ══════════════════════════════════════
   ESTADO DO FORMULÁRIO
══════════════════════════════════════ */

let vtEtapaAtual = 1;
const VT_TOTAL_ETAPAS = 5;

let vtDados = {};  // dados do formulário em construção
let vtEditandoId = null; // ID da VT sendo editada (null = nova)

/* ══════════════════════════════════════
   INICIALIZAÇÃO
══════════════════════════════════════ */

function vtInicializar() {
  vtRenderizarLista();
}

/* Registrar callback de navegação */
GepNav.registrarCallback('dashboard', vtInicializar);

/* ══════════════════════════════════════
   LISTA DE VISITAS
══════════════════════════════════════ */

async function vtRenderizarLista() {
  const container = document.getElementById('vtLista');
  if (!container) return;

  container.innerHTML = '<div class="vt-carregando">Carregando visitas...</div>';

  try {
    const usuario = GepAuth.usuario;
    if (!usuario) return;

    // Buscar visitas conforme perfil
    let filtros = [];
    if (!GepAuth.ehAdmin() && !GepAuth.ehCoordenador()) {
      filtros = [{ campo: 'produtorId', op: '==', valor: usuario.id }];
    } else if (GepAuth.ehCoordenador() && !GepAuth.ehAdmin()) {
      filtros = [{ campo: 'empresaId', op: '==', valor: usuario.empresa }];
    }

    const visitas = await GepFirebase.listar('visitas', filtros);

    // Ordenar por data de criação (mais recente primeiro)
    visitas.sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));

    if (!visitas.length) {
      container.innerHTML = `
        <div class="vt-vazio">
          <div class="vt-vazio-ico">📝</div>
          <p>Nenhuma visita técnica ainda.</p>
          <p>Clique em <strong>+ Nova Visita</strong> para começar.</p>
        </div>`;
      return;
    }

    container.innerHTML = visitas.map(vt => vtRenderizarCard(vt)).join('');

  } catch (e) {
    console.error('Erro ao carregar visitas:', e);
    container.innerHTML = '<div class="vt-erro">Erro ao carregar visitas. Tente novamente.</div>';
  }
}

function vtRenderizarCard(vt) {
  const data = vt.dataEvento ? GepUtils.formatarData(vt.dataEvento) : '—';
  const hora = vt.horaEvento || '—';
  const empresa = vt.empresaNome || vt.empresaId || '—';

  return `
    <div class="vt-card" data-id="${vt.id}">
      <div class="vt-card-data">
        <span class="vt-card-dia">${vt.dataEvento ? new Date(vt.dataEvento + 'T00:00:00').getDate() : '—'}</span>
        <span class="vt-card-mes">${vt.dataEvento ? ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'][new Date(vt.dataEvento + 'T00:00:00').getMonth()] : '—'}</span>
      </div>
      <div class="vt-card-info">
        <div class="vt-card-nome">${vt.nomeEvento || 'Sem nome'}</div>
        <div class="vt-card-detalhes">
          ${hora !== '—' ? `<span>🕐 ${hora}</span>` : ''}
          ${vt.endereco ? `<span>📍 ${vt.endereco}</span>` : ''}
          <span class="${vt.empresaId === 'inter' ? 'badge-inter' : 'badge-vivere'}">${empresa}</span>
          <span>👤 ${vt.produtorNome || '—'}</span>
        </div>
        <div class="vt-card-acoes">
          <button class="btn btn-sucesso btn-sm" onclick="vtAcaoWA('${vt.id}')">💬 WhatsApp</button>
          <button class="btn btn-secundario btn-sm" onclick="vtAcaoEditar('${vt.id}')">✏️ Editar</button>
          <button class="btn btn-perigo btn-sm" onclick="vtAcaoExcluir('${vt.id}')">🗑 Excluir</button>
        </div>
      </div>
    </div>`;
}

/* ══════════════════════════════════════
   FORMULÁRIO — CONTROLE GERAL
══════════════════════════════════════ */

function vtAbrirFormulario(editandoId = null) {
  vtEditandoId = editandoId;
  vtDados = {};
  vtEtapaAtual = 1;

  // Mostrar view do formulário
  document.getElementById('vwDashboard').classList.remove('ativa');
  document.getElementById('vwVtForm').classList.add('ativa');

  // Atualizar topbar
  document.getElementById('tbTitulo').textContent = editandoId ? 'Editar Visita' : 'Nova Visita Técnica';
  document.getElementById('tbBreadcrumb').innerHTML = '📝 Visitas Técnicas / ' + (editandoId ? 'Editar' : 'Nova');

  vtIrEtapa(1);
}

function vtFecharFormulario() {
  document.getElementById('vwVtForm').classList.remove('ativa');
  document.getElementById('vwDashboard').classList.add('ativa');
  document.getElementById('tbTitulo').textContent = 'Visitas Técnicas';
  document.getElementById('tbBreadcrumb').innerHTML = '📝 Visitas Técnicas';
  vtRenderizarLista();
}

function vtIrEtapa(etapa) {
  vtEtapaAtual = etapa;

  // Esconder todas as etapas
  document.querySelectorAll('.vt-etapa').forEach(e => e.classList.remove('ativa'));

  // Mostrar etapa atual
  const etapaEl = document.getElementById('vtEtapa' + etapa);
  if (etapaEl) etapaEl.classList.add('ativa');

  // Atualizar progresso
  vtAtualizarProgresso();

  // Preencher dados se editando
  if (etapa === 1) vtPreencherEtapa1();
}

function vtAtualizarProgresso() {
  // Atualizar bolinhas de progresso
  for (let i = 1; i <= VT_TOTAL_ETAPAS; i++) {
    const bolinha = document.getElementById('vtProg' + i);
    if (!bolinha) continue;
    bolinha.classList.remove('ativa', 'concluida');
    if (i === vtEtapaAtual) bolinha.classList.add('ativa');
    if (i < vtEtapaAtual)  bolinha.classList.add('concluida');
  }

  // Atualizar texto
  const textoEtapa = document.getElementById('vtTextoEtapa');
  const nomes = ['', 'Empresa', 'Local', 'Estrutura', 'Detalhes', 'Resumo'];
  if (textoEtapa) textoEtapa.textContent = `Etapa ${vtEtapaAtual} de ${VT_TOTAL_ETAPAS} — ${nomes[vtEtapaAtual]}`;
}

/* ══════════════════════════════════════
   ETAPA 1 — EMPRESA
══════════════════════════════════════ */

async function vtPreencherEtapa1() {
  // Preencher produtor automaticamente
  const usuario = GepAuth.usuario;
  const campoProd = document.getElementById('vtProdutor');
  if (campoProd && usuario) {
    campoProd.value = usuario.nome || usuario.email;
  }

  // Carregar empresas do Firestore
  await vtCarregarEmpresas();

  // Se editando, preencher empresa selecionada
  if (vtDados.empresaId) {
    const sel = document.getElementById('vtEmpresa');
    if (sel) sel.value = vtDados.empresaId;
  }
}

async function vtCarregarEmpresas() {
  const sel = document.getElementById('vtEmpresa');
  if (!sel) return;

  sel.innerHTML = '<option value="">Selecione a empresa...</option>';

  try {
    const empresas = await GepFirebase.listar('empresas');
    empresas.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
    empresas.forEach(emp => {
      const op = document.createElement('option');
      op.value = emp.id;
      op.textContent = emp.nome;
      sel.appendChild(op);
    });
  } catch (e) {
    console.error('Erro ao carregar empresas:', e);
    // Fallback com empresas padrão
    [
      { id: 'inter',  nome: 'InterEventos' },
      { id: 'vivere', nome: 'Vivere' },
      { id: 'ancom',  nome: 'AN COM' }
    ].forEach(emp => {
      const op = document.createElement('option');
      op.value = emp.id;
      op.textContent = emp.nome;
      sel.appendChild(op);
    });
  }
}

function vtAvancarEtapa1() {
  const empresa = document.getElementById('vtEmpresa').value;
  if (!empresa) {
    toast('Selecione a empresa.', 'erro');
    document.getElementById('vtEmpresa').focus();
    return;
  }

  const sel = document.getElementById('vtEmpresa');
  vtDados.empresaId   = empresa;
  vtDados.empresaNome = sel.options[sel.selectedIndex].text;

  const usuario = GepAuth.usuario;
  vtDados.produtorId   = usuario.id;
  vtDados.produtorNome = usuario.nome || usuario.email;

  vtIrEtapa(2);
}

/* ══════════════════════════════════════
   AÇÕES NOS CARDS
══════════════════════════════════════ */

function vtAcaoEditar(id) {
  toast('Editar em breve...', 'ok');
}

function vtAcaoWA(id) {
  toast('WhatsApp em breve...', 'ok');
}

function vtAcaoExcluir(id) {
  if (!GepUtils.confirmar('Excluir esta visita técnica?')) return;
  GepFirebase.excluir('visitas', id)
    .then(() => { toast('Visita excluída.', 'ok'); vtRenderizarLista(); })
    .catch(() => toast('Erro ao excluir.', 'erro'));
}

/* ── Exportar ── */
window.GepVisitas = {
  inicializar:      vtInicializar,
  abrirFormulario:  vtAbrirFormulario,
  fecharFormulario: vtFecharFormulario,
  avancarEtapa1:    vtAvancarEtapa1,
  irEtapa:          vtIrEtapa,
  acaoEditar:       vtAcaoEditar,
  acaoWA:           vtAcaoWA,
  acaoExcluir:      vtAcaoExcluir
};

/* Atalhos globais para uso no HTML */
window.vtAbrirFormulario  = vtAbrirFormulario;
window.vtFecharFormulario = vtFecharFormulario;
window.vtAvancarEtapa1    = vtAvancarEtapa1;
window.vtIrEtapa          = vtIrEtapa;
window.vtAcaoEditar       = vtAcaoEditar;
window.vtAcaoWA           = vtAcaoWA;
window.vtAcaoExcluir      = vtAcaoExcluir;
