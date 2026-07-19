/* ═══════════════════════════════════════════
   GEP — Gestão de Eventos Pro
   cadastros.js — Secretarias, Fornecedores, Catálogo, Empresas
   ═══════════════════════════════════════════ */

/* ══════════════════════════════════════
   ESTADO
══════════════════════════════════════ */

let cadAbaAtual = 'secretarias';

/* ══════════════════════════════════════
   INICIALIZAÇÃO
══════════════════════════════════════ */

function cadInicializar() {
  cadIrAba('secretarias');
}

GepNav.registrarCallback('fornecedores',  () => cadInicializar());
GepNav.registrarCallback('secretarias',   () => cadInicializar());
GepNav.registrarCallback('catalogo',      () => cadInicializar());

function cadIrAba(aba) {
  cadAbaAtual = aba;

  // Atualizar abas
  document.querySelectorAll('.cad-aba').forEach(el => {
    el.classList.toggle('ativa', el.dataset.aba === aba);
  });

  // Esconder todos os painéis
  document.querySelectorAll('.cad-painel').forEach(el => el.style.display = 'none');

  // Mostrar painel correto
  const painel = document.getElementById('cad-' + aba);
  if (painel) painel.style.display = 'block';

  // Carregar dados
  const fns = {
    secretarias:  cadCarregarSecretarias,
    fornecedores: cadCarregarFornecedores,
    catalogo:     cadCarregarCatalogo,
    empresas:     cadCarregarEmpresas
  };
  if (fns[aba]) fns[aba]();
}

/* ══════════════════════════════════════
   SECRETARIAS
══════════════════════════════════════ */

async function cadCarregarSecretarias() {
  const lista = document.getElementById('cadSecLista');
  if (!lista) return;
  lista.innerHTML = '<p style="color:#94A3B8;font-size:.85rem">Carregando...</p>';

  try {
    const docs = await GepFirebase.listar('secretarias');
    docs.sort((a,b) => (a.nome||'').localeCompare(b.nome||''));

    if (!docs.length) {
      lista.innerHTML = '<p style="color:#94A3B8;font-size:.85rem;text-align:center;padding:2rem">Nenhuma secretaria cadastrada.</p>';
      return;
    }

    lista.innerHTML = docs.map(s => `
      <div class="cad-item">
        <div class="cad-item-info">
          <div class="cad-item-nome">${s.nome}</div>
          ${s.sigla ? `<div class="cad-item-detalhe">${s.sigla}</div>` : ''}
        </div>
        <div class="cad-item-acoes">
          <button class="btn btn-secundario btn-sm" onclick="cadEditarSecretaria('${s.id}')">✏️</button>
          <button class="btn btn-perigo btn-sm" onclick="cadExcluir('secretarias','${s.id}', cadCarregarSecretarias)">🗑</button>
        </div>
      </div>`).join('');
  } catch(e) {
    lista.innerHTML = '<p style="color:#DC2626;font-size:.85rem">Erro ao carregar.</p>';
  }
}

function cadNovaSecretaria() {
  document.getElementById('cadSecId').value    = '';
  document.getElementById('cadSecNome').value  = '';
  document.getElementById('cadSecSigla').value = '';
  cadAbrirModal('modalSecretaria');
}

function cadEditarSecretaria(id) {
  GepFirebase.buscar('secretarias', id).then(s => {
    if (!s) return;
    document.getElementById('cadSecId').value    = s.id;
    document.getElementById('cadSecNome').value  = s.nome || '';
    document.getElementById('cadSecSigla').value = s.sigla || '';
    cadAbrirModal('modalSecretaria');
  });
}

async function cadSalvarSecretaria() {
  const nome  = document.getElementById('cadSecNome').value.trim();
  const sigla = document.getElementById('cadSecSigla').value.trim();
  const id    = document.getElementById('cadSecId').value || GepUtils.gerarId('sec');

  if (!nome) { toast('Digite o nome da secretaria.', 'erro'); return; }

  try {
    await GepFirebase.salvar('secretarias', id, { nome, sigla });
    toast('Secretaria salva!', 'ok');
    cadFecharModal('modalSecretaria');
    cadCarregarSecretarias();
  } catch(e) { toast('Erro ao salvar.', 'erro'); }
}

/* ══════════════════════════════════════
   FORNECEDORES
══════════════════════════════════════ */

async function cadCarregarFornecedores() {
  const lista = document.getElementById('cadFornLista');
  if (!lista) return;
  lista.innerHTML = '<p style="color:#94A3B8;font-size:.85rem">Carregando...</p>';

  try {
    const docs = await GepFirebase.listar('fornecedores');
    docs.sort((a,b) => (a.nome||'').localeCompare(b.nome||''));

    if (!docs.length) {
      lista.innerHTML = '<p style="color:#94A3B8;font-size:.85rem;text-align:center;padding:2rem">Nenhum fornecedor cadastrado.</p>';
      return;
    }

    lista.innerHTML = docs.map(f => `
      <div class="cad-item">
        <div class="cad-item-info">
          <div class="cad-item-nome">${f.nome}</div>
          <div class="cad-item-detalhe">
            ${f.tipoServico ? `<span class="badge-inter">${f.tipoServico}</span>` : ''}
            ${f.telefone ? `📞 ${f.telefone}` : ''}
            ${f.prazoPg ? `⏱ ${f.prazoPg}` : ''}
          </div>
        </div>
        <div class="cad-item-acoes">
          <button class="btn btn-secundario btn-sm" onclick="cadEditarFornecedor('${f.id}')">✏️</button>
          <button class="btn btn-perigo btn-sm" onclick="cadExcluir('fornecedores','${f.id}', cadCarregarFornecedores)">🗑</button>
        </div>
      </div>`).join('');
  } catch(e) {
    lista.innerHTML = '<p style="color:#DC2626;font-size:.85rem">Erro ao carregar.</p>';
  }
}

function cadNovoFornecedor() {
  ['cadFornId','cadFornNome','cadFornDoc','cadFornResp','cadFornTel','cadFornPrazo','cadFornTipo'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  cadAbrirModal('modalFornecedor');
}

function cadEditarFornecedor(id) {
  GepFirebase.buscar('fornecedores', id).then(f => {
    if (!f) return;
    document.getElementById('cadFornId').value    = f.id;
    document.getElementById('cadFornNome').value  = f.nome || '';
    document.getElementById('cadFornDoc').value   = f.doc || '';
    document.getElementById('cadFornResp').value  = f.responsavel || '';
    document.getElementById('cadFornTel').value   = f.telefone || '';
    document.getElementById('cadFornPrazo').value = f.prazoPg || '';
    document.getElementById('cadFornTipo').value  = f.tipoServico || '';
    cadAbrirModal('modalFornecedor');
  });
}

async function cadSalvarFornecedor() {
  const nome       = document.getElementById('cadFornNome').value.trim();
  const doc        = document.getElementById('cadFornDoc').value.trim();
  const responsavel = document.getElementById('cadFornResp').value.trim();
  const telefone   = document.getElementById('cadFornTel').value.trim();
  const prazoPg    = document.getElementById('cadFornPrazo').value.trim();
  const tipoServico = document.getElementById('cadFornTipo').value.trim();
  const id         = document.getElementById('cadFornId').value || GepUtils.gerarId('forn');

  if (!nome) { toast('Digite o nome do fornecedor.', 'erro'); return; }

  try {
    await GepFirebase.salvar('fornecedores', id, { nome, doc, responsavel, telefone, prazoPg, tipoServico });
    toast('Fornecedor salvo!', 'ok');
    cadFecharModal('modalFornecedor');
    cadCarregarFornecedores();
  } catch(e) { toast('Erro ao salvar.', 'erro'); }
}

/* ══════════════════════════════════════
   CATÁLOGO
══════════════════════════════════════ */

const CAT_CATEGORIAS = ['Som', 'Iluminação', 'Estrutura', 'Alimentação', 'Logística', 'Produtor', 'Outros'];

async function cadCarregarCatalogo() {
  const lista = document.getElementById('cadCatLista');
  if (!lista) return;
  lista.innerHTML = '<p style="color:#94A3B8;font-size:.85rem">Carregando...</p>';

  try {
    const docs = await GepFirebase.listar('catalogo');
    docs.sort((a,b) => (a.nome||'').localeCompare(b.nome||''));

    if (!docs.length) {
      lista.innerHTML = '<p style="color:#94A3B8;font-size:.85rem;text-align:center;padding:2rem">Nenhum item no catálogo.</p>';
      return;
    }

    lista.innerHTML = docs.map(c => `
      <div class="cad-item">
        <div class="cad-item-info">
          <div class="cad-item-nome">${c.nome}</div>
          <div class="cad-item-detalhe">
            ${c.categoria ? `<span class="badge-inter">${c.categoria}</span>` : ''}
            ${c.descricaoPadrao ? `<span style="color:#64748B">${c.descricaoPadrao}</span>` : ''}
            ${c.periodoPadrao ? `<span style="background:#F0FDF4;color:#166534;font-size:.7rem;padding:.1rem .4rem;border-radius:4px;font-weight:600">${c.periodoPadrao}</span>` : ''}
          </div>
        </div>
        <div class="cad-item-acoes">
          <button class="btn btn-secundario btn-sm" onclick="cadEditarCatalogo('${c.id}')">✏️</button>
          <button class="btn btn-perigo btn-sm" onclick="cadExcluir('catalogo','${c.id}', cadCarregarCatalogo)">🗑</button>
        </div>
      </div>`).join('');
  } catch(e) {
    lista.innerHTML = '<p style="color:#DC2626;font-size:.85rem">Erro ao carregar.</p>';
  }
}

function cadNovoCatalogo() {
  ['cadCatId','cadCatNome','cadCatDesc'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('cadCatCategoria').value = '';
  document.getElementById('cadCatPeriodo').value   = 'Unid';
  cadAbrirModal('modalCatalogo');
}

function cadEditarCatalogo(id) {
  GepFirebase.buscar('catalogo', id).then(c => {
    if (!c) return;
    document.getElementById('cadCatId').value        = c.id;
    document.getElementById('cadCatNome').value      = c.nome || '';
    document.getElementById('cadCatCategoria').value = c.categoria || '';
    document.getElementById('cadCatDesc').value      = c.descricaoPadrao || '';
    document.getElementById('cadCatPeriodo').value   = c.periodoPadrao || 'Unid';
    cadAbrirModal('modalCatalogo');
  });
}

async function cadSalvarCatalogo() {
  const nome           = document.getElementById('cadCatNome').value.trim();
  const categoria      = document.getElementById('cadCatCategoria').value;
  const descricaoPadrao = document.getElementById('cadCatDesc').value.trim();
  const periodoPadrao  = document.getElementById('cadCatPeriodo').value;
  const id             = document.getElementById('cadCatId').value || GepUtils.gerarId('cat');

  if (!nome) { toast('Digite o nome do serviço.', 'erro'); return; }

  try {
    await GepFirebase.salvar('catalogo', id, { nome, categoria, descricaoPadrao, periodoPadrao });
    toast('Item salvo no catálogo!', 'ok');
    cadFecharModal('modalCatalogo');
    cadCarregarCatalogo();
  } catch(e) { toast('Erro ao salvar.', 'erro'); }
}

/* ══════════════════════════════════════
   EMPRESAS
══════════════════════════════════════ */

async function cadCarregarEmpresas() {
  const lista = document.getElementById('cadEmpLista');
  if (!lista) return;
  lista.innerHTML = '<p style="color:#94A3B8;font-size:.85rem">Carregando...</p>';

  try {
    const docs = await GepFirebase.listar('empresas');
    docs.sort((a,b) => (a.nome||'').localeCompare(b.nome||''));

    if (!docs.length) {
      lista.innerHTML = '<p style="color:#94A3B8;font-size:.85rem;text-align:center;padding:2rem">Nenhuma empresa cadastrada.</p>';
      return;
    }

    lista.innerHTML = docs.map(e => `
      <div class="cad-item">
        <div class="cad-item-info">
          <div class="cad-item-nome">${e.nome}</div>
        </div>
        <div class="cad-item-acoes">
          <button class="btn btn-secundario btn-sm" onclick="cadEditarEmpresa('${e.id}')">✏️</button>
          <button class="btn btn-perigo btn-sm" onclick="cadExcluir('empresas','${e.id}', cadCarregarEmpresas)">🗑</button>
        </div>
      </div>`).join('');
  } catch(e) {
    lista.innerHTML = '<p style="color:#DC2626;font-size:.85rem">Erro ao carregar.</p>';
  }
}

function cadNovaEmpresa() {
  document.getElementById('cadEmpId').value   = '';
  document.getElementById('cadEmpNome').value = '';
  cadAbrirModal('modalEmpresa');
}

function cadEditarEmpresa(id) {
  GepFirebase.buscar('empresas', id).then(e => {
    if (!e) return;
    document.getElementById('cadEmpId').value   = e.id;
    document.getElementById('cadEmpNome').value = e.nome || '';
    cadAbrirModal('modalEmpresa');
  });
}

async function cadSalvarEmpresa() {
  const nome = document.getElementById('cadEmpNome').value.trim();
  const id   = document.getElementById('cadEmpId').value || GepUtils.gerarId('emp');

  if (!nome) { toast('Digite o nome da empresa.', 'erro'); return; }

  try {
    await GepFirebase.salvar('empresas', id, { nome });
    toast('Empresa salva!', 'ok');
    cadFecharModal('modalEmpresa');
    cadCarregarEmpresas();
  } catch(e) { toast('Erro ao salvar.', 'erro'); }
}

/* ══════════════════════════════════════
   UTILITÁRIOS
══════════════════════════════════════ */

function cadExcluir(colecao, id, callback) {
  if (!GepUtils.confirmar('Excluir este item?')) return;
  GepFirebase.excluir(colecao, id)
    .then(() => { toast('Excluído com sucesso.', 'ok'); callback(); })
    .catch(() => toast('Erro ao excluir.', 'erro'));
}

function cadAbrirModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'flex';
}

function cadFecharModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

/* ── Exportar ── */
window.GepCadastros = { inicializar: cadInicializar };
window.cadIrAba           = cadIrAba;
window.cadNovaSecretaria  = cadNovaSecretaria;
window.cadEditarSecretaria = cadEditarSecretaria;
window.cadSalvarSecretaria = cadSalvarSecretaria;
window.cadNovoFornecedor  = cadNovoFornecedor;
window.cadEditarFornecedor = cadEditarFornecedor;
window.cadSalvarFornecedor = cadSalvarFornecedor;
window.cadNovoCatalogo    = cadNovoCatalogo;
window.cadEditarCatalogo  = cadEditarCatalogo;
window.cadSalvarCatalogo  = cadSalvarCatalogo;
window.cadNovaEmpresa     = cadNovaEmpresa;
window.cadEditarEmpresa   = cadEditarEmpresa;
window.cadSalvarEmpresa   = cadSalvarEmpresa;
window.cadExcluir         = cadExcluir;
window.cadFecharModal     = cadFecharModal;
