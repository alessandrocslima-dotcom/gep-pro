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

GepNav.registrarCallback('secretarias',  cadCarregarSecretarias);
GepNav.registrarCallback('fornecedores', cadCarregarFornecedores);
GepNav.registrarCallback('catalogo',     cadCarregarCatalogo);
GepNav.registrarCallback('empresas',     cadCarregarEmpresas);

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

    lista.innerHTML = `
      <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.75rem;flex-wrap:wrap">
        <label style="display:flex;align-items:center;gap:.4rem;font-size:.85rem;cursor:pointer">
          <input type="checkbox" id="secSelTodos" onchange="cadSelecionarTodosSec(this.checked)"> Selecionar todos
        </label>
        <button class="btn btn-perigo btn-sm" id="btnExcluirSec" style="display:none" onclick="cadExcluirSelecionadasSec()">🗑 Excluir selecionadas</button>
      </div>` +
      docs.map(s => `
      <div class="cad-item">
        <input type="checkbox" class="sec-check" data-id="${s.id}" onchange="cadAtualizarBtnSec()" style="margin-right:.5rem;cursor:pointer;flex-shrink:0">
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

    lista.innerHTML = `
      <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.75rem;flex-wrap:wrap">
        <label style="display:flex;align-items:center;gap:.4rem;font-size:.85rem;cursor:pointer">
          <input type="checkbox" id="fornSelTodos" onchange="cadSelecionarTodosForn(this.checked)"> Selecionar todos
        </label>
        <button class="btn btn-perigo btn-sm" id="btnExcluirForn" style="display:none" onclick="cadExcluirSelecionadosForn()">🗑 Excluir selecionados</button>
      </div>` +
      docs.map(f => `
      <div class="cad-item">
        <input type="checkbox" class="forn-check" data-id="${f.id}" onchange="cadAtualizarBtnForn()" style="margin-right:.5rem;cursor:pointer;flex-shrink:0">
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

/* ══════════════════════════════════════
   EXCEL — FORNECEDORES
══════════════════════════════════════ */

function cadBaixarModeloFornecedor() {
  const wb = XLSX.utils.book_new();
  const dados = [
    ['Nome', 'CNPJ/CPF', 'Responsável', 'Telefone', 'Prazo de Pagamento', 'Tipo de Serviço'],
    ['1000 Beats', '019.049.677-01', 'Walter', '(21) 96557-9692', '30D', 'Som']
  ];
  const ws = XLSX.utils.aoa_to_sheet(dados);
  ws['!cols'] = [{ wch:30 },{ wch:20 },{ wch:20 },{ wch:18 },{ wch:20 },{ wch:20 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Fornecedores');
  XLSX.writeFile(wb, 'modelo_fornecedores.xlsx');
}

async function cadExportarFornecedores() {
  try {
    const docs = await GepFirebase.listar('fornecedores');
    docs.sort((a,b) => (a.nome||'').localeCompare(b.nome||''));
    const wb = XLSX.utils.book_new();
    const dados = [
      ['Nome', 'CNPJ/CPF', 'Responsável', 'Telefone', 'Prazo de Pagamento', 'Tipo de Serviço'],
      ...docs.map(f => [f.nome||'', f.doc||'', f.responsavel||'', f.telefone||'', f.prazoPg||'', f.tipoServico||''])
    ];
    const ws = XLSX.utils.aoa_to_sheet(dados);
    ws['!cols'] = [{ wch:30 },{ wch:20 },{ wch:20 },{ wch:18 },{ wch:20 },{ wch:20 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Fornecedores');
    XLSX.writeFile(wb, 'fornecedores.xlsx');
    toast('Exportado com sucesso!', 'ok');
  } catch(e) { toast('Erro ao exportar.', 'erro'); }
}

function cadImportarFornecedores() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.xlsx,.xls';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const wb   = XLSX.read(ev.target.result, { type: 'binary' });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const dados = rows.slice(1).filter(r => r[0]);
        // Buscar existentes para evitar duplicatas
        const existentes = await GepFirebase.listar('fornecedores');
        const mapaExistentes = {};
        existentes.forEach(f => { mapaExistentes[f.nome?.toLowerCase().trim()] = f.id; });
        let criados = 0, atualizados = 0;
        for (const r of dados) {
          const nome = String(r[0]||'').trim();
          const chave = nome.toLowerCase();
          const id = mapaExistentes[chave] || GepUtils.gerarId('forn');
          const ehNovo = !mapaExistentes[chave];
          await GepFirebase.salvar('fornecedores', id, {
            nome, doc: String(r[1]||'').trim(), responsavel: String(r[2]||'').trim(),
            telefone: String(r[3]||'').trim(), prazoPg: String(r[4]||'').trim(), tipoServico: String(r[5]||'').trim()
          });
          if (ehNovo) criados++; else atualizados++;
        }
        toast(`${criados} criados, ${atualizados} atualizados!`, 'ok');
        cadCarregarFornecedores();
      } catch(err) { toast('Erro ao importar. Verifique o arquivo.', 'erro'); }
    };
    reader.readAsBinaryString(file);
  };
  input.click();
}

/* ══════════════════════════════════════
   EXCEL — SECRETARIAS
══════════════════════════════════════ */

function cadBaixarModeloSecretaria() {
  const wb = XLSX.utils.book_new();
  const dados = [
    ['Nome', 'Sigla'],
    ['Secretaria Municipal de Educação', 'SME']
  ];
  const ws = XLSX.utils.aoa_to_sheet(dados);
  ws['!cols'] = [{ wch:45 },{ wch:15 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Secretarias');
  XLSX.writeFile(wb, 'modelo_secretarias.xlsx');
}

async function cadExportarSecretarias() {
  try {
    const docs = await GepFirebase.listar('secretarias');
    docs.sort((a,b) => (a.nome||'').localeCompare(b.nome||''));
    const wb = XLSX.utils.book_new();
    const dados = [
      ['Nome', 'Sigla'],
      ...docs.map(s => [s.nome||'', s.sigla||''])
    ];
    const ws = XLSX.utils.aoa_to_sheet(dados);
    ws['!cols'] = [{ wch:45 },{ wch:15 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Secretarias');
    XLSX.writeFile(wb, 'secretarias.xlsx');
    toast('Exportado com sucesso!', 'ok');
  } catch(e) { toast('Erro ao exportar.', 'erro'); }
}

function cadImportarSecretarias() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.xlsx,.xls';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const wb   = XLSX.read(ev.target.result, { type: 'binary' });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const dados = rows.slice(1).filter(r => r[0]);
        const existentes = await GepFirebase.listar('secretarias');
        const mapaExistentes = {};
        existentes.forEach(s => { mapaExistentes[s.nome?.toLowerCase().trim()] = s.id; });
        let criados = 0, atualizados = 0;
        for (const r of dados) {
          const nome = String(r[0]||'').trim();
          const chave = nome.toLowerCase();
          const id = mapaExistentes[chave] || GepUtils.gerarId('sec');
          const ehNovo = !mapaExistentes[chave];
          await GepFirebase.salvar('secretarias', id, {
            nome, sigla: String(r[1]||'').trim()
          });
          if (ehNovo) criados++; else atualizados++;
        }
        toast(`${criados} criadas, ${atualizados} atualizadas!`, 'ok');
        cadCarregarSecretarias();
      } catch(err) { toast('Erro ao importar. Verifique o arquivo.', 'erro'); }
    };
    reader.readAsBinaryString(file);
  };
  input.click();
}

/* Exports */
window.cadBaixarModeloFornecedor = cadBaixarModeloFornecedor;
window.cadExportarFornecedores   = cadExportarFornecedores;
window.cadImportarFornecedores   = cadImportarFornecedores;
window.cadBaixarModeloSecretaria = cadBaixarModeloSecretaria;
window.cadExportarSecretarias    = cadExportarSecretarias;
window.cadImportarSecretarias    = cadImportarSecretarias;

/* ══════════════════════════════════════
   EXCLUSÃO EM LOTE
══════════════════════════════════════ */

function cadAtualizarBtnForn() {
  const selecionados = document.querySelectorAll('.forn-check:checked');
  const btn = document.getElementById('btnExcluirForn');
  if (btn) {
    btn.style.display = selecionados.length ? 'inline-flex' : 'none';
    btn.textContent = `🗑 Excluir selecionados (${selecionados.length})`;
  }
}

function cadSelecionarTodosForn(checked) {
  document.querySelectorAll('.forn-check').forEach(cb => cb.checked = checked);
  cadAtualizarBtnForn();
}

async function cadExcluirSelecionadosForn() {
  const checks = document.querySelectorAll('.forn-check:checked');
  if (!checks.length) return;
  if (!GepUtils.confirmar(`Excluir ${checks.length} fornecedor(es) selecionado(s)?`)) return;
  for (const cb of checks) {
    await GepFirebase.excluir('fornecedores', cb.dataset.id);
  }
  toast(`${checks.length} excluído(s)!`, 'ok');
  cadCarregarFornecedores();
}

function cadAtualizarBtnSec() {
  const selecionados = document.querySelectorAll('.sec-check:checked');
  const btn = document.getElementById('btnExcluirSec');
  if (btn) {
    btn.style.display = selecionados.length ? 'inline-flex' : 'none';
    btn.textContent = `🗑 Excluir selecionadas (${selecionados.length})`;
  }
}

function cadSelecionarTodosSec(checked) {
  document.querySelectorAll('.sec-check').forEach(cb => cb.checked = checked);
  cadAtualizarBtnSec();
}

async function cadExcluirSelecionadasSec() {
  const checks = document.querySelectorAll('.sec-check:checked');
  if (!checks.length) return;
  if (!GepUtils.confirmar(`Excluir ${checks.length} secretaria(s) selecionada(s)?`)) return;
  for (const cb of checks) {
    await GepFirebase.excluir('secretarias', cb.dataset.id);
  }
  toast(`${checks.length} excluída(s)!`, 'ok');
  cadCarregarSecretarias();
}

window.cadAtualizarBtnForn      = cadAtualizarBtnForn;
window.cadSelecionarTodosForn   = cadSelecionarTodosForn;
window.cadExcluirSelecionadosForn = cadExcluirSelecionadosForn;
window.cadAtualizarBtnSec       = cadAtualizarBtnSec;
window.cadSelecionarTodosSec    = cadSelecionarTodosSec;
window.cadExcluirSelecionadasSec = cadExcluirSelecionadasSec;
