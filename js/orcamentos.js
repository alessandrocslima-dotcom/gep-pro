/* ═══════════════════════════════════════════
   GEP — Gestão de Eventos Pro
   orcamentos.js — Planilha Inicial
   ═══════════════════════════════════════════ */

/* ══════════════════════════════════════
   ESTADO
══════════════════════════════════════ */

let orcVtId      = null;   // ID da VT vinculada
let orcId        = null;   // ID do orçamento
let orcLinhas    = [];     // linhas da tabela de serviços
let orcVtDados   = {};     // dados da VT

/* ══════════════════════════════════════
   INICIALIZAÇÃO
══════════════════════════════════════ */

function orcInicializar() {
  orcRenderizarLista();
}

GepNav.registrarCallback('orcamentos', orcInicializar);

/* ══════════════════════════════════════
   LISTA DE ORÇAMENTOS
══════════════════════════════════════ */

async function orcRenderizarLista() {
  const container = document.getElementById('orcLista');
  if (!container) return;

  container.innerHTML = '<p style="color:#94A3B8;font-size:.85rem;padding:1rem">Carregando...</p>';

  try {
    const usuario = GepAuth.usuario;
    let filtros = [];
    if (!GepAuth.ehAdmin() && !GepAuth.ehCoordenador()) {
      filtros = [{ campo: 'produtorId', op: '==', valor: usuario.id }];
    } else if (GepAuth.ehCoordenador() && !GepAuth.ehAdmin()) {
      filtros = [{ campo: 'empresaId', op: '==', valor: usuario.empresa }];
    }

    const orcamentos = await GepFirebase.listar('orcamentos', filtros);
    orcamentos.sort((a,b) => new Date(b.criadoEm||0) - new Date(a.criadoEm||0));

    if (!orcamentos.length) {
      container.innerHTML = `
        <div style="text-align:center;padding:3rem;color:#94A3B8">
          <div style="font-size:3rem;margin-bottom:1rem">💰</div>
          <p>Nenhum orçamento ainda.</p>
          <p style="font-size:.85rem;margin-top:.5rem">Clique em <strong>📤 Enviar p/ Orçamento</strong> em uma visita técnica.</p>
        </div>`;
      return;
    }

    const STATUS = {
      elaboracao: { label: 'Em elaboração', bg: '#FEF3C7', cor: '#92400E' },
      enviado:    { label: 'Enviado',        bg: '#DBEAFE', cor: '#1D4ED8' },
      aprovado:   { label: 'Aprovado',       bg: '#DCFCE7', cor: '#166534' },
      recusado:   { label: 'Recusado',       bg: '#FEE2E2', cor: '#991B1B' }
    };

    container.innerHTML = orcamentos.map(o => {
      const st    = STATUS[o.status] || STATUS.elaboracao;
      const total = orcCalcularTotal(o.linhas || []);
      const data  = o.dataInicio ? new Date(o.dataInicio+'T00:00:00').toLocaleDateString('pt-BR') : '—';
      const hora  = (o.horaInicio || '') + (o.horaFim ? ' às ' + o.horaFim : '');
      return `
        <div class="orc-card">
          <div class="orc-card-topo">
            <div class="orc-card-esquerda">
              ${o.numEvento ? `<div class="orc-card-num">Nº ${o.numEvento}</div>` : ''}
              <div class="orc-card-nome">${o.nomeEvento || 'Sem nome'}</div>
              <div class="orc-card-info">
                ${o.local    ? `<span>📍 ${o.local}</span>` : ''}
                ${hora       ? `<span>🕐 ${hora}</span>` : ''}
                ${(o.empresaNome||o.empresaId) ? `<span class="badge-inter">${o.empresaNome||o.empresaId}</span>` : ''}
                ${o.produtorNome ? `<span>👤 ${o.produtorNome}</span>` : ''}
                ${o.dataInicio   ? `<span>📅 ${data}</span>` : ''}
              </div>
            </div>
            <div class="orc-card-direita">
              <div class="orc-card-total">R$ ${total.toLocaleString('pt-BR', {minimumFractionDigits:2})}</div>
              <span class="orc-card-status" style="background:${st.bg};color:${st.cor}">${st.label}</span>
            </div>
          </div>
          <div class="orc-card-acoes">
            <button class="btn btn-sucesso btn-sm" onclick="orcWACotacao('${o.id}')">💬 WA Cotação</button>
            <button class="btn btn-secundario btn-sm" onclick="orcAbrirPlanilha('${o.id}')">✏️ Editar</button>
            <button class="btn btn-secundario btn-sm" onclick="toast('Exportar Excel em breve...','ok')">📥 Exportar</button>
            <button class="btn btn-perigo btn-sm" onclick="orcExcluir('${o.id}')">🗑 Excluir</button>
          </div>
        </div>`;
    }).join('');

  } catch(e) {
    container.innerHTML = '<p style="color:#DC2626;font-size:.85rem;padding:1rem">Erro ao carregar orçamentos.</p>';
  }
}

/* ══════════════════════════════════════
   AÇÕES DO CARD
══════════════════════════════════════ */

async function orcWACotacao(id) {
  try {
    const orc = await GepFirebase.buscar('orcamentos', id);
    if (!orc || !orc.linhas || !orc.linhas.length) {
      toast('Nenhuma demanda no orçamento.', 'erro');
      return;
    }

    function fmtData(iso) {
      if (!iso) return '—';
      return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR');
    }

    let msg = '💰 SOLICITAÇÃO DE COTAÇÃO\n';
    msg += '━━━━━━━━━━━━━━━━━━━━━━\n\n';
    msg += '📋 EVENTO: ' + (orc.nomeEvento || '—') + '\n';
    msg += '📅 Data: ' + fmtData(orc.dataInicio) + (orc.horaInicio ? ' às ' + orc.horaInicio : '') + '\n';
    msg += '📍 Local: ' + (orc.local || '—') + '\n\n';
    msg += '📦 ITENS PARA COTAÇÃO:\n';
    orc.linhas.forEach((l, i) => {
      msg += `${i+1}. ${l.servico}`;
      if (l.descricao) msg += ` — ${l.descricao}`;
      msg += ` | Qtd: ${l.qtde} | Freq: ${l.freq} | ${l.periodo}\n`;
    });
    msg += '\nPor favor, informe o valor unitário de cada item.\n';
    msg += '\nAtenciosamente,\n' + (orc.produtorNome || 'Produtor') + ' — InterEventos';

    window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
  } catch(e) {
    toast('Erro ao gerar mensagem.', 'erro');
  }
}

async function orcExcluir(id) {
  if (!GepUtils.confirmar('Excluir este orçamento? Esta ação não pode ser desfeita.')) return;
  try {
    await GepFirebase.excluir('orcamentos', id);
    toast('Orçamento excluído.', 'ok');
    orcRenderizarLista();
  } catch(e) {
    toast('Erro ao excluir.', 'erro');
  }
}

/* ══════════════════════════════════════
   ABRIR PLANILHA
══════════════════════════════════════ */

async function orcAbrirDaVT(vtId) {
  try {
    // Verificar se já existe orçamento para esta VT
    const existentes = await GepFirebase.listar('orcamentos', [
      { campo: 'vtId', op: '==', valor: vtId }
    ]);

    if (existentes.length) {
      await orcAbrirPlanilha(existentes[0].id);
    } else {
      // Criar novo orçamento a partir da VT
      const vt = await GepFirebase.buscar('visitas', vtId);
      if (!vt) { toast('Visita não encontrada.', 'erro'); return; }

      const usuario = GepAuth.usuario;
      const novoId  = GepUtils.gerarId('orc');
      const linhas  = (vt.demandas || []).map(d => ({
        servico:    d.servico || '',
        descricao:  d.descricao || '',
        qtde:       d.qtde || 1,
        precoUnit:  0,
        freq:       d.freq || 1,
        periodo:    d.periodo || 'Unid',
        valorFinal: 0,
        fornecedor: '',
        formaPgto:  '',
        obs:        ''
      }));

      const dados = {
        vtId,
        nomeEvento:   vt.nomeEvento || '',
        clienteNome:  vt.clienteNome || '',
        dataInicio:   vt.dataInicio || '',
        dataFim:      vt.dataFim || '',
        horaInicio:   vt.horaInicio || '',
        horaFim:      vt.horaFim || '',
        local:        vt.endereco || '',
        publico:      vt.publico || '',
        dataMontagem: vt.dataMontagem || '',
        horaMontagem: vt.horaMontagem || '',
        linhas,
        verbaProd:    0,
        fator:        1.8,
        status:       'elaboracao',
        numEvento:    '',
        empresaId:    vt.empresaId || '',
        empresaNome:  vt.empresaNome || '',
        produtorId:   usuario.id,
        produtorNome: usuario.nome || usuario.email,
        criadoEm:     new Date().toISOString()
      };

      await GepFirebase.salvar('orcamentos', novoId, dados);

      // Marcar VT como enviada
      await GepFirebase.atualizar('visitas', vtId, { orcEnviado: true, orcId: novoId });

      await orcAbrirPlanilha(novoId);
    }
  } catch(e) {
    console.error(e);
    toast('Erro ao abrir orçamento.', 'erro');
  }
}

async function orcAbrirPlanilha(id) {
  try {
    const orc = await GepFirebase.buscar('orcamentos', id);
    if (!orc) { toast('Orçamento não encontrado.', 'erro'); return; }

    orcId    = id;
    orcLinhas = orc.linhas || [];

    // Preencher cabeçalho
    const campos = {
      'orcNumEvento':   orc.numEvento || '',
      'orcCliente':     orc.clienteNome || orc.clienteId || '',
      'orcNomeEvento':  orc.nomeEvento || '',
      'orcDataInicio':  orc.dataInicio || '',
      'orcDataFim':     orc.dataFim || '',
      'orcHoraInicio':  orc.horaInicio || '',
      'orcHoraFim':     orc.horaFim || '',
      'orcLocal':       orc.local || '',
      'orcPublico':     orc.publico || '',
      'orcDataMont':    orc.dataMontagem || '',
      'orcHoraMont':    orc.horaMontagem || '',
      'orcVerbaProd':   orc.verbaProd || 0,
      'orcFator':       orc.fator || 1.8
    };

    Object.entries(campos).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    });

    // Status
    const stEl = document.getElementById('orcStatus');
    if (stEl) stEl.value = orc.status || 'elaboracao';

    // Produtor
    const prodEl = document.getElementById('orcProdutorNome');
    const prodNome = orc.produtorNome || (GepAuth.usuario && (GepAuth.usuario.nome || GepAuth.usuario.email)) || '—';
    if (prodEl) prodEl.textContent = prodNome;

    // Renderizar tabela
    orcRenderizarTabela();

    // Mostrar planilha, esconder lista
    document.getElementById('orcViewLista').style.display = 'none';
    document.getElementById('orcViewPlanilha').style.display = 'block';

  } catch(e) {
    console.error(e);
    toast('Erro ao abrir planilha.', 'erro');
  }
}

/* ══════════════════════════════════════
   TABELA DE SERVIÇOS
══════════════════════════════════════ */

function orcRenderizarTabela() {
  const tbody = document.getElementById('orcTbody');
  if (!tbody) return;

  tbody.innerHTML = orcLinhas.map((l, i) => `
    <tr class="orc-linha" data-idx="${i}">
      <td><input class="orc-cell" value="${l.servico||''}" onchange="orcUpdateLinha(${i},'servico',this.value)" placeholder="Serviço"></td>
      <td><input class="orc-cell" value="${l.descricao||''}" onchange="orcUpdateLinha(${i},'descricao',this.value)" placeholder="Descrição"></td>
      <td><input class="orc-cell orc-num" type="number" value="${l.qtde||1}" min="1" onchange="orcUpdateLinha(${i},'qtde',+this.value);orcRecalcularLinha(${i})"></td>
      <td><input class="orc-cell orc-money" type="number" value="${l.precoUnit||0}" min="0" step="0.01" onchange="orcUpdateLinha(${i},'precoUnit',+this.value);orcRecalcularLinha(${i})" placeholder="0,00"></td>
      <td><input class="orc-cell orc-num" type="number" value="${l.freq||1}" min="1" onchange="orcUpdateLinha(${i},'freq',+this.value);orcRecalcularLinha(${i})"></td>
      <td>
        <select class="orc-cell orc-sel" onchange="orcUpdateLinha(${i},'periodo',this.value);orcRecalcularLinha(${i})">
          <option value="Unid" ${l.periodo==='Unid'?'selected':''}>Unid</option>
          <option value="Dia"  ${l.periodo==='Dia'?'selected':''}>Dia</option>
        </select>
      </td>
      <td class="orc-total-cell" id="orcTotal${i}">R$ ${orcFormatarValor(l.valorFinal||0)}</td>
      <td><input class="orc-cell" value="${l.fornecedor||''}" onchange="orcUpdateLinha(${i},'fornecedor',this.value)" placeholder="Fornecedor"></td>
      <td><input class="orc-cell orc-pgto" value="${l.formaPgto||''}" onchange="orcUpdateLinha(${i},'formaPgto',this.value)" placeholder="30D"></td>
      <td><input class="orc-cell" value="${l.obs||''}" onchange="orcUpdateLinha(${i},'obs',this.value)" placeholder="—"></td>
      <td><button class="orc-del-btn" onclick="orcRemoverLinha(${i})" title="Remover">✕</button></td>
    </tr>`).join('');

  orcAtualizarTotais();
}

function orcUpdateLinha(idx, campo, valor) {
  if (orcLinhas[idx]) orcLinhas[idx][campo] = valor;
}

function orcRecalcularLinha(idx) {
  const l = orcLinhas[idx];
  if (!l) return;
  l.valorFinal = (l.qtde||0) * (l.precoUnit||0) * (l.freq||1);
  const el = document.getElementById('orcTotal' + idx);
  if (el) el.textContent = 'R$ ' + orcFormatarValor(l.valorFinal);
  orcAtualizarTotais();
}

function orcAdicionarLinha() {
  orcLinhas.push({ servico:'', descricao:'', qtde:1, precoUnit:0, freq:1, periodo:'Unid', valorFinal:0, fornecedor:'', formaPgto:'', obs:'' });
  orcRenderizarTabela();
  // Focar na última linha
  setTimeout(() => {
    const inputs = document.querySelectorAll('#orcTbody tr:last-child input');
    if (inputs.length) inputs[0].focus();
  }, 50);
}

function orcRemoverLinha(idx) {
  if (!GepUtils.confirmar('Remover este serviço?')) return;
  orcLinhas.splice(idx, 1);
  orcRenderizarTabela();
}

function orcAtualizarTotais() {
  const subtotal = orcCalcularTotal(orcLinhas);
  const verba    = parseFloat(document.getElementById('orcVerbaProd')?.value) || 0;
  const fator    = parseFloat(document.getElementById('orcFator')?.value) || 1.8;
  const total    = subtotal + verba;
  const totalFator = total * fator;

  const set = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = 'R$ ' + orcFormatarValor(val); };
  set('orcSubtotal', subtotal);
  set('orcTotalEvento', total);
  set('orcTotalFator', totalFator);
}

function orcCalcularTotal(linhas) {
  return (linhas||[]).reduce((acc, l) => acc + (l.valorFinal||0), 0);
}

function orcFormatarValor(val) {
  return Number(val||0).toLocaleString('pt-BR', { minimumFractionDigits:2, maximumFractionDigits:2 });
}

/* ══════════════════════════════════════
   SALVAR
══════════════════════════════════════ */

async function orcSalvar() {
  if (!orcId) return;
  const btn = document.getElementById('orcBtnSalvar');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Salvando...'; }

  try {
    const dados = {
      numEvento:    document.getElementById('orcNumEvento')?.value || '',
      clienteNome:  document.getElementById('orcCliente')?.value.trim() || '',
      nomeEvento:   document.getElementById('orcNomeEvento')?.value || '',
      dataInicio:   document.getElementById('orcDataInicio')?.value || '',
      dataFim:      document.getElementById('orcDataFim')?.value || '',
      horaInicio:   document.getElementById('orcHoraInicio')?.value || '',
      horaFim:      document.getElementById('orcHoraFim')?.value || '',
      local:        document.getElementById('orcLocal')?.value || '',
      publico:      document.getElementById('orcPublico')?.value || '',
      dataMontagem: document.getElementById('orcDataMont')?.value || '',
      horaMontagem: document.getElementById('orcHoraMont')?.value || '',
      verbaProd:    parseFloat(document.getElementById('orcVerbaProd')?.value) || 0,
      fator:        parseFloat(document.getElementById('orcFator')?.value) || 1.8,
      status:       document.getElementById('orcStatus')?.value || 'elaboracao',
      linhas:       orcLinhas,
      atualizadoEm: new Date().toISOString()
    };

    await GepFirebase.salvar('orcamentos', orcId, dados);
    toast('Orçamento salvo! ✓', 'ok');
  } catch(e) {
    toast('Erro ao salvar.', 'erro');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '💾 Salvar'; }
  }
}

/* ══════════════════════════════════════
   VOLTAR PARA LISTA
══════════════════════════════════════ */

function orcVoltarLista() {
  document.getElementById('orcViewPlanilha').style.display = 'none';
  document.getElementById('orcViewLista').style.display = 'block';
  orcId = null;
  orcLinhas = [];
  orcRenderizarLista();
}

/* ── Exportar ── */
window.GepOrcamentos     = { inicializar: orcInicializar };
window.orcAbrirDaVT      = orcAbrirDaVT;
window.orcAbrirPlanilha  = orcAbrirPlanilha;
window.orcVoltarLista    = orcVoltarLista;
window.orcAdicionarLinha = orcAdicionarLinha;
window.orcRemoverLinha   = orcRemoverLinha;
window.orcUpdateLinha    = orcUpdateLinha;
window.orcRecalcularLinha = orcRecalcularLinha;
window.orcAtualizarTotais = orcAtualizarTotais;
window.orcSalvar         = orcSalvar;
window.orcWACotacao       = orcWACotacao;
window.orcExcluir         = orcExcluir;
