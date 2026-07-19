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
  const dataISO = vt.dataInicio || vt.dataEvento || null;
  const hora    = vt.horaInicio || vt.horaEvento || null;
  const empresa = vt.empresaNome || vt.empresaId || '—';
  const MESES   = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];

  let dia = '—', mes = '—';
  if (dataISO) {
    const dt = new Date(dataISO + 'T00:00:00');
    dia = dt.getDate();
    mes = MESES[dt.getMonth()];
  }

  return `
    <div class="vt-card" data-id="${vt.id}">
      <div class="vt-card-data">
        <span class="vt-card-dia">${dia}</span>
        <span class="vt-card-mes">${mes}</span>
      </div>
      <div class="vt-card-info">
        <div class="vt-card-nome">${vt.nomeEvento || 'Sem nome'}</div>
        <div class="vt-card-detalhes">
          ${hora ? `<span>🕐 ${hora}</span>` : ''}
          ${vt.endereco ? `<span>📍 ${vt.endereco}</span>` : ''}
          <span class="${vt.empresaId === 'inter' ? 'badge-inter' : 'badge-vivere'}">${empresa}</span>
          <span>👤 ${vt.produtorNome || '—'}</span>
        </div>
        <div class="vt-card-acoes">
          <button class="btn btn-sucesso btn-sm" onclick="vtAcaoWA('${vt.id}')">💬 WhatsApp</button>
          <button class="btn btn-secundario btn-sm" onclick="vtAcaoEditar('${vt.id}')">✏️ Editar</button>
          <button class="btn btn-primario btn-sm" onclick="vtAcaoEnviarOrcamento('${vt.id}')">📤 Enviar p/ Orçamento</button>
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
  if (etapa === 2) vtPreencherEtapa2();
  if (etapa === 3) vtPreencherEtapa3();
  if (etapa === 4) vtPreencherEtapa4();
  if (etapa === 5) vtPreencherEtapa5();
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
  // Carregar secretarias
  await vtCarregarSecretarias();

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

function vtAcaoEnviarOrcamento(id) {
  toast('Módulo de Orçamentos em breve...', 'ok');
}

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


/* ══════════════════════════════════════
   ETAPA 2 — LOCAL
══════════════════════════════════════ */

let vtContatos = []; // lista de contatos importantes
let vtGPS = null;    // coordenadas GPS capturadas

function vtToggleCliente() {
  const tipo = document.querySelector('input[name="vtTipoCliente"]:checked').value;
  document.getElementById('vtBlocoSecretaria').style.display = tipo === 'secretaria' ? 'block' : 'none';
  document.getElementById('vtBlocoOutroCliente').style.display = tipo === 'outro' ? 'block' : 'none';
}

async function vtCarregarSecretarias() {
  const sel = document.getElementById('vtSecretaria');
  if (!sel) return;
  sel.innerHTML = '<option value="">Selecione a secretaria...</option>';
  try {
    const secs = await GepFirebase.listar('secretarias');
    secs.sort((a,b) => (a.nome||'').localeCompare(b.nome||''));
    secs.forEach(s => {
      const op = document.createElement('option');
      op.value = s.id;
      op.textContent = s.nome + (s.sigla ? ' ('+s.sigla+')' : '');
      sel.appendChild(op);
    });
  } catch(e) { console.error('Erro ao carregar secretarias:', e); }
}

let vtGPSRisco = null;

function vtCapturarGPSRisco() {
  const btn = document.getElementById('vtBtnGPSRisco');
  if (!navigator.geolocation) { toast('GPS não disponível.', 'erro'); return; }
  if (btn) { btn.textContent = '⏳ Capturando...'; btn.disabled = true; }
  navigator.geolocation.getCurrentPosition(
    pos => {
      vtGPSRisco = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      if (btn) { btn.textContent = '✅ GPS capturado'; btn.disabled = false; }
      toast('GPS do ponto de encontro capturado!', 'ok');
    },
    () => {
      if (btn) { btn.textContent = '📍 Capturar GPS'; btn.disabled = false; }
      toast('Não foi possível capturar o GPS.', 'erro');
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

function vtAbrirWazeRisco() {
  const end = document.getElementById('vtPontoEncontro').value.trim();
  if (vtGPSRisco) window.open('https://waze.com/ul?ll='+vtGPSRisco.lat+','+vtGPSRisco.lng+'&navigate=yes','_blank');
  else if (end) window.open('https://waze.com/ul?q='+encodeURIComponent(end)+'&navigate=yes','_blank');
  else toast('Digite o endereço ou capture o GPS primeiro.', 'erro');
}

function vtAbrirMapsRisco() {
  const end = document.getElementById('vtPontoEncontro').value.trim();
  if (vtGPSRisco) window.open('https://maps.google.com/?q='+vtGPSRisco.lat+','+vtGPSRisco.lng,'_blank');
  else if (end) window.open('https://maps.google.com/?q='+encodeURIComponent(end),'_blank');
  else toast('Digite o endereço ou capture o GPS primeiro.', 'erro');
}

function vtPreencherEtapa2() {
  // Preencher campos se já tiver dados
  const campos = ['vtNomeEvento','vtTipoEvento','vtEndereco','vtDataInicio',
                  'vtDataFim','vtHoraInicio','vtHoraFim','vtDataMontagem',
                  'vtHoraMontagem','vtPublico','vtPontoEncontro','vtContatoLocal'];
  const chaves = ['nomeEvento','tipoEvento','endereco','dataInicio',
                  'dataFim','horaInicio','horaFim','dataMontagem',
                  'horaMontagem','publico','pontoEncontro','contatoLocal'];

  campos.forEach((id, i) => {
    const el = document.getElementById(id);
    if (el && vtDados[chaves[i]]) el.value = vtDados[chaves[i]];
  });

  // Área de risco
  if (vtDados.areaRisco !== undefined) {
    const sim = document.getElementById('vtRiscoSim');
    const nao = document.getElementById('vtRiscoNao');
    if (vtDados.areaRisco) { if(sim) sim.checked = true; }
    else { if(nao) nao.checked = true; }
    vtToggleRisco();
  }

  // Contatos
  vtContatos = vtDados.contatos || [];
  vtRenderizarContatos();
}

function vtToggleRisco() {
  const sim = document.getElementById('vtRiscoSim');
  const bloco = document.getElementById('vtBlocoRisco');
  if (bloco) bloco.style.display = (sim && sim.checked) ? 'block' : 'none';
}

function vtAdicionarContato() {
  const nome = document.getElementById('vtContatoNome').value.trim();
  const tel  = document.getElementById('vtContatoTel').value.trim();
  if (!nome) { toast('Digite o nome do contato.', 'erro'); return; }
  vtContatos.push({ nome, tel });
  document.getElementById('vtContatoNome').value = '';
  document.getElementById('vtContatoTel').value  = '';
  vtRenderizarContatos();
}

function vtRemoverContato(idx) {
  vtContatos.splice(idx, 1);
  vtRenderizarContatos();
}

function vtRenderizarContatos() {
  const lista = document.getElementById('vtListaContatos');
  if (!lista) return;
  if (!vtContatos.length) {
    lista.innerHTML = '<p style="color:#94A3B8;font-size:.8rem">Nenhum contato adicionado.</p>';
    return;
  }
  lista.innerHTML = vtContatos.map((c, i) => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:.5rem .75rem;background:#F8FAFC;border-radius:8px;margin-bottom:.4rem;font-size:.85rem">
      <div>
        <span style="font-weight:600">${c.nome}</span>
        ${c.tel ? `<span style="color:#64748B;margin-left:.5rem">${c.tel}</span>` : ''}
      </div>
      <button onclick="vtRemoverContato(${i})" style="background:none;border:none;color:#DC2626;cursor:pointer;font-size:1rem">✕</button>
    </div>`).join('');
}

function vtCapturarGPS() {
  const btn = document.getElementById('vtBtnGPS');
  if (!navigator.geolocation) {
    toast('GPS não disponível neste dispositivo.', 'erro');
    return;
  }
  if (btn) { btn.textContent = '⏳ Capturando...'; btn.disabled = true; }
  navigator.geolocation.getCurrentPosition(
    pos => {
      vtGPS = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      if (btn) { btn.textContent = '✅ GPS capturado'; btn.disabled = false; }
      toast('GPS capturado com sucesso!', 'ok');
    },
    err => {
      if (btn) { btn.textContent = '📍 Capturar GPS'; btn.disabled = false; }
      toast('Não foi possível capturar o GPS.', 'erro');
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

function vtAbrirWaze() {
  const end = document.getElementById('vtEndereco').value.trim();
  if (vtGPS) {
    window.open(`https://waze.com/ul?ll=${vtGPS.lat},${vtGPS.lng}&navigate=yes`, '_blank');
  } else if (end) {
    window.open(`https://waze.com/ul?q=${encodeURIComponent(end)}&navigate=yes`, '_blank');
  } else {
    toast('Digite o endereço ou capture o GPS primeiro.', 'erro');
  }
}

function vtAbrirMaps() {
  const end = document.getElementById('vtEndereco').value.trim();
  if (vtGPS) {
    window.open(`https://maps.google.com/?q=${vtGPS.lat},${vtGPS.lng}`, '_blank');
  } else if (end) {
    window.open(`https://maps.google.com/?q=${encodeURIComponent(end)}`, '_blank');
  } else {
    toast('Digite o endereço ou capture o GPS primeiro.', 'erro');
  }
}

function vtAvancarEtapa2() {
  const nomeEvento = document.getElementById('vtNomeEvento').value.trim();
  const endereco   = document.getElementById('vtEndereco').value.trim();
  const dataInicio = document.getElementById('vtDataInicio').value;
  const horaInicio = document.getElementById('vtHoraInicio').value;

  if (!nomeEvento) { toast('Digite o nome do evento.', 'erro'); document.getElementById('vtNomeEvento').focus(); return; }
  if (!endereco)   { toast('Digite o endereço do evento.', 'erro'); document.getElementById('vtEndereco').focus(); return; }
  if (!dataInicio) { toast('Selecione a data de início.', 'erro'); return; }
  if (!horaInicio) { toast('Selecione a hora de início.', 'erro'); return; }

  const riscoSim = document.getElementById('vtRiscoSim');

  const tipoCliente = document.querySelector('input[name="vtTipoCliente"]:checked').value;
  vtDados.tipoCliente   = tipoCliente;
  if (tipoCliente === 'secretaria') {
    const sel = document.getElementById('vtSecretaria');
    vtDados.clienteId   = sel.value;
    vtDados.clienteNome = sel.options[sel.selectedIndex]?.text || '';
  } else {
    vtDados.clienteId   = '';
    vtDados.clienteNome = document.getElementById('vtOutroCliente').value.trim();
  }
  vtDados.nomeEvento    = nomeEvento;
  vtDados.tipoEvento    = document.getElementById('vtTipoEvento').value.trim();
  vtDados.endereco      = endereco;
  vtDados.gps           = vtGPS;
  vtDados.dataInicio    = dataInicio;
  vtDados.dataFim       = document.getElementById('vtDataFim').value;
  vtDados.horaInicio    = horaInicio;
  vtDados.horaFim       = document.getElementById('vtHoraFim').value;
  vtDados.dataMontagem  = document.getElementById('vtDataMontagem').value;
  vtDados.horaMontagem  = document.getElementById('vtHoraMontagem').value;
  vtDados.publico       = document.getElementById('vtPublico').value.trim();
  vtDados.contatos      = vtContatos;
  vtDados.areaRisco     = riscoSim && riscoSim.checked;
  vtDados.gpsRisco      = vtGPSRisco;
  vtDados.pontoEncontro = document.getElementById('vtPontoEncontro').value.trim();
  vtDados.contatoLocal  = document.getElementById('vtContatoLocal').value.trim();

  vtIrEtapa(3);
}


/* ══════════════════════════════════════
   ETAPA 3 — ESTRUTURA / DEMANDAS
══════════════════════════════════════ */

let vtDemandas = [];
let vtCatalogo = [];
let vtEditandoDemanda = null; // índice da demanda sendo editada

async function vtPreencherEtapa3() {
  // Carregar catálogo
  try {
    vtCatalogo = await GepFirebase.listar('catalogo');
    vtCatalogo.sort((a,b) => (a.nome||'').localeCompare(b.nome||''));
  } catch(e) { vtCatalogo = []; }

  // Preencher demandas se já tiver dados
  vtDemandas = vtDados.demandas || [];
  vtRenderizarDemandas();
}

function vtRenderizarDemandas() {
  const lista = document.getElementById('vtListaDemandas');
  if (!lista) return;

  if (!vtDemandas.length) {
    lista.innerHTML = '<p style="color:#94A3B8;font-size:.85rem;text-align:center;padding:1rem">Nenhuma demanda adicionada.<br>Clique em <strong>+ Adicionar</strong> para começar.</p>';
    return;
  }

  lista.innerHTML = vtDemandas.map((d, i) => `
    <div style="display:grid;grid-template-columns:2fr 2fr 60px 60px 80px 36px 36px;gap:.4rem;align-items:center;padding:.6rem .5rem;background:#F8FAFC;border-radius:8px;margin-bottom:.4rem">
      <div style="font-size:.85rem;font-weight:600;color:#0F172A">${d.servico || '—'}</div>
      <div style="font-size:.8rem;color:#64748B">${d.descricao || '—'}</div>
      <div style="font-size:.8rem;text-align:center;color:#0F172A">${d.qtde || 1}</div>
      <div style="font-size:.8rem;text-align:center;color:#0F172A">${d.freq || 1}</div>
      <div style="font-size:.8rem;text-align:center"><span style="background:#DBEAFE;color:#1D4ED8;padding:.15rem .5rem;border-radius:99px;font-size:.75rem;font-weight:600">${d.periodo || 'Unid'}</span></div>
      <button onclick="vtEditarDemanda(${i})" style="background:none;border:none;color:#2563EB;cursor:pointer;font-size:1rem;padding:0" title="Editar">✏️</button>
      <button onclick="vtRemoverDemanda(${i})" style="background:none;border:none;color:#DC2626;cursor:pointer;font-size:1rem;padding:0" title="Remover">✕</button>
    </div>`).join('');
}

function vtBuscarCatalogo() {
  const termo = document.getElementById('vtBuscaServico').value.toLowerCase().trim();
  const sugestoes = document.getElementById('vtSugestoes');
  if (!termo || termo.length < 2) { sugestoes.style.display = 'none'; return; }

  const filtrados = vtCatalogo.filter(c => (c.nome||'').toLowerCase().includes(termo)).slice(0, 8);
  if (!filtrados.length) { sugestoes.style.display = 'none'; return; }

  sugestoes.innerHTML = filtrados.map(c => `
    <div onclick="vtSelecionarServico('${c.nome}')"
         style="padding:.6rem 1rem;cursor:pointer;font-size:.875rem;border-bottom:1px solid #F1F5F9;hover:background:#F8FAFC">
      ${c.nome}
    </div>`).join('');
  sugestoes.style.display = 'block';
}

function vtSelecionarServico(nome) {
  document.getElementById('vtBuscaServico').value = nome;
  document.getElementById('vtSugestoes').style.display = 'none';
}

function vtEditarDemanda(idx) {
  const d = vtDemandas[idx];
  if (!d) return;
  vtEditandoDemanda = idx;

  document.getElementById('vtBuscaServico').value  = d.servico || '';
  document.getElementById('vtDescServico').value   = d.descricao || '';
  document.getElementById('vtQtdeServico').value   = d.qtde || 1;
  document.getElementById('vtFreqServico').value   = d.freq || 1;
  document.getElementById('vtPeriodoServico').value = d.periodo || 'Unid';

  // Mudar botão para "Salvar alteração"
  const btn = document.getElementById('vtBtnAdicionarDemanda');
  if (btn) { btn.textContent = '✅ Salvar'; btn.style.background = '#16A34A'; }

  document.getElementById('vtBuscaServico').focus();
  document.getElementById('vtBuscaServico').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function vtAdicionarDemanda() {
  const servico  = document.getElementById('vtBuscaServico').value.trim();
  const descricao = document.getElementById('vtDescServico').value.trim();
  const qtde     = parseInt(document.getElementById('vtQtdeServico').value) || 1;
  const freq     = parseInt(document.getElementById('vtFreqServico').value) || 1;
  const periodo  = document.getElementById('vtPeriodoServico').value;

  if (!servico) { toast('Digite ou selecione o serviço.', 'erro'); document.getElementById('vtBuscaServico').focus(); return; }

  if (vtEditandoDemanda !== null) {
    vtDemandas[vtEditandoDemanda] = { servico, descricao, qtde, freq, periodo };
    vtEditandoDemanda = null;
    const btn = document.getElementById('vtBtnAdicionarDemanda');
    if (btn) { btn.textContent = '+ Adicionar'; btn.style.background = ''; }
    toast('Demanda atualizada!', 'ok');
  } else {
    vtDemandas.push({ servico, descricao, qtde, freq, periodo });
  }
  vtRenderizarDemandas();

  // Limpar campos
  document.getElementById('vtBuscaServico').value  = '';
  document.getElementById('vtDescServico').value   = '';
  document.getElementById('vtQtdeServico').value   = '1';
  document.getElementById('vtFreqServico').value   = '1';
  document.getElementById('vtPeriodoServico').value = 'Unid';
  document.getElementById('vtBuscaServico').focus();
}

function vtRemoverDemanda(idx) {
  vtDemandas.splice(idx, 1);
  vtRenderizarDemandas();
}

function vtAvancarEtapa3() {
  vtDados.demandas = vtDemandas;
  vtIrEtapa(4);
}


/* ══════════════════════════════════════
   ETAPA 4 — OBSERVAÇÕES
══════════════════════════════════════ */

function vtPreencherEtapa4() {
  const campo = document.getElementById('vtObservacoes');
  if (campo && vtDados.observacoes) campo.value = vtDados.observacoes;
}

function vtAvancarEtapa4() {
  vtDados.observacoes = document.getElementById('vtObservacoes').value.trim();
  vtIrEtapa(5);
}


/* ══════════════════════════════════════
   ETAPA 5 — RESUMO
══════════════════════════════════════ */

function vtPreencherEtapa5() {
  const el = document.getElementById('vtResumoConteudo');
  if (!el) return;

  const d = vtDados;

  // Formatar data
  function fmtData(iso) {
    if (!iso) return '—';
    const dt = new Date(iso + 'T00:00:00');
    return dt.toLocaleDateString('pt-BR');
  }

  let html = '';

  // Cabeçalho
  html += `<div class="vt-resumo-bloco">
    <div class="vt-resumo-linha"><strong>🗺 VISITA TÉCNICA</strong> | ${d.empresaNome || '—'}</div>
    <div class="vt-resumo-linha">👤 Produtor: ${d.produtorNome || '—'}</div>
  </div>`;

  // Evento
  html += `<div class="vt-resumo-bloco">
    <div class="vt-resumo-titulo">📋 EVENTO</div>
    <div class="vt-resumo-linha">- Nome: ${d.nomeEvento || '—'}</div>
    <div class="vt-resumo-linha">- Endereço: ${d.endereco || '—'}</div>`;

  if (d.gps) {
    html += `<div class="vt-resumo-linha">- <a href="https://maps.google.com/?q=${d.gps.lat},${d.gps.lng}" target="_blank" style="color:#2563EB">📍 Google Maps</a> | <a href="https://waze.com/ul?ll=${d.gps.lat},${d.gps.lng}&navigate=yes" target="_blank" style="color:#2563EB">🗺 Waze</a></div>`;
  } else if (d.endereco) {
    html += `<div class="vt-resumo-linha">- <a href="https://maps.google.com/?q=${encodeURIComponent(d.endereco)}" target="_blank" style="color:#2563EB">📍 Google Maps</a> | <a href="https://waze.com/ul?q=${encodeURIComponent(d.endereco)}&navigate=yes" target="_blank" style="color:#2563EB">🗺 Waze</a></div>`;
  }

  if (d.dataInicio) html += `<div class="vt-resumo-linha">- Data: ${fmtData(d.dataInicio)}${d.horaInicio ? ' às ' + d.horaInicio : ''}</div>`;
  if (d.dataFim)   html += `<div class="vt-resumo-linha">- Término: ${fmtData(d.dataFim)}${d.horaFim ? ' às ' + d.horaFim : ''}</div>`;
  if (d.publico)   html += `<div class="vt-resumo-linha">- Público: ${d.publico}</div>`;
  html += '</div>';

  // Área de risco
  if (d.areaRisco) {
    html += `<div class="vt-resumo-bloco">
      <div class="vt-resumo-titulo">⚠️ ÁREA DE RISCO</div>`;
    if (d.pontoEncontro) html += `<div class="vt-resumo-linha">- Ponto de encontro: ${d.pontoEncontro}</div>`;
    if (d.contatoLocal)  html += `<div class="vt-resumo-linha">- Contato: ${d.contatoLocal}</div>`;
    html += '</div>';
  }

  // Montagem — aparece se tiver data OU horário
  if (d.dataMontagem || d.horaMontagem) {
    let montStr = '';
    if (d.dataMontagem) montStr += fmtData(d.dataMontagem);
    if (d.horaMontagem) montStr += (montStr ? ' às ' : '') + d.horaMontagem;
    html += `<div class="vt-resumo-bloco">
      <div class="vt-resumo-titulo">🔧 MONTAGEM</div>
      <div class="vt-resumo-linha">- ${montStr || '—'}</div>
    </div>`;
  }

  // Demandas
  if (d.demandas && d.demandas.length) {
    html += `<div class="vt-resumo-bloco">
      <div class="vt-resumo-titulo">📦 DEMANDAS</div>`;
    d.demandas.forEach(dem => {
      html += `<div class="vt-resumo-linha">- ${dem.servico}${dem.descricao ? ' ('+dem.descricao+')' : ''} — Qtd: ${dem.qtde}</div>`;
    });
    html += '</div>';
  }

  // Observações
  if (d.observacoes) {
    html += `<div class="vt-resumo-bloco">
      <div class="vt-resumo-titulo">📝 OBSERVAÇÕES</div>
      <div class="vt-resumo-linha" style="white-space:pre-wrap">${d.observacoes}</div>
    </div>`;
  }

  el.innerHTML = html;
}

async function vtSalvarVisita() {
  const btn = document.getElementById('vtBtnSalvar');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Salvando...'; }

  try {
    const usuario = GepAuth.usuario;
    const agora = new Date().toISOString();

    const dados = {
      ...vtDados,
      produtorId:   usuario.id,
      produtorNome: usuario.nome || usuario.email,
      empresaId:    vtDados.empresaId,
      criadoEm:     vtEditandoId ? vtDados.criadoEm : agora,
      atualizadoEm: agora
    };

    const id = vtEditandoId || GepUtils.gerarId('vt');
    await GepFirebase.salvar('visitas', id, dados);

    toast('Visita técnica salva com sucesso! ✓', 'ok');
    setTimeout(() => vtFecharFormulario(), 800);

  } catch(e) {
    console.error('Erro ao salvar:', e);
    toast('Erro ao salvar. Tente novamente.', 'erro');
    if (btn) { btn.disabled = false; btn.textContent = '✅ Salvar Visita'; }
  }
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
window.vtAvancarEtapa2    = vtAvancarEtapa2;
window.vtToggleCliente    = vtToggleCliente;
window.vtCapturarGPSRisco = vtCapturarGPSRisco;
window.vtAbrirWazeRisco   = vtAbrirWazeRisco;
window.vtAbrirMapsRisco   = vtAbrirMapsRisco;
window.vtBuscarCatalogo   = vtBuscarCatalogo;
window.vtSelecionarServico = vtSelecionarServico;
window.vtAdicionarDemanda = vtAdicionarDemanda;
window.vtRemoverDemanda   = vtRemoverDemanda;
window.vtEditarDemanda    = vtEditarDemanda;
window.vtAvancarEtapa3    = vtAvancarEtapa3;
window.vtAvancarEtapa4    = vtAvancarEtapa4;
window.vtSalvarVisita     = vtSalvarVisita;
window.vtToggleRisco      = vtToggleRisco;
window.vtAdicionarContato = vtAdicionarContato;
window.vtRemoverContato   = vtRemoverContato;
window.vtCapturarGPS      = vtCapturarGPS;
window.vtAbrirWaze        = vtAbrirWaze;
window.vtAbrirMaps        = vtAbrirMaps;
window.vtIrEtapa          = vtIrEtapa;
window.vtAcaoEditar           = vtAcaoEditar;
window.vtAcaoEnviarOrcamento  = vtAcaoEnviarOrcamento;
window.vtAcaoWA           = vtAcaoWA;
window.vtAcaoExcluir      = vtAcaoExcluir;
