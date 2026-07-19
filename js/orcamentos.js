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
      const bordaCor = o.avulso ? '#F59E0B' : 'var(--cor-acento)';
      return `
        <div class="orc-card" style="border-left-color:${bordaCor}">
          <div class="orc-card-topo">
            <div class="orc-card-esquerda">
              <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.2rem">
                ${o.numEvento ? `<div class="orc-card-num">Nº ${o.numEvento}</div>` : ''}
                ${o.avulso ? `<span style="background:#FEF3C7;color:#92400E;font-size:.7rem;font-weight:700;padding:.15rem .5rem;border-radius:99px">🟡 AVULSO</span>` : ''}
              </div>
              <div class="orc-card-nome">${o.nomeEvento || 'Sem nome'}</div>
              <div class="orc-card-info">
                ${o.local    ? `<span>📍 ${o.local}</span>` : ''}
                ${hora       ? `<span>🕐 ${hora}</span>` : ''}
                ${(() => { const en = o.empresaNome || (o.empresaId === 'inter' ? 'InterEventos' : o.empresaId === 'vivere' ? 'Vivere' : o.empresaId); return en ? `<span class="badge-inter">${en}</span>` : ''; })()}
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
   ORÇAMENTO AVULSO
══════════════════════════════════════ */

async function orcNovoAvulso() {
  try {
    const usuario = GepAuth.usuario;
    const novoId  = GepUtils.gerarId('orc');

    const dados = {
      vtId:         null,
      avulso:       true,
      nomeEvento:   '',
      clienteNome:  '',
      dataInicio:   '',
      dataFim:      '',
      horaInicio:   '',
      horaFim:      '',
      local:        '',
      publico:      '',
      dataMontagem: '',
      horaMontagem: '',
      linhas:       [],
      linhasFechamento: [],
      verbaProd:    0,
      fator:        1.8,
      status:       'elaboracao',
      numEvento:    '',
      empresaId:    usuario.empresa || '',
      empresaNome:  usuario.empresaNome || (usuario.empresa === 'inter' ? 'InterEventos' : usuario.empresa === 'vivere' ? 'Vivere' : usuario.empresa) || '',
      produtorId:   usuario.id,
      produtorNome: usuario.nome || usuario.email,
      criadoEm:     new Date().toISOString()
    };

    await GepFirebase.salvar('orcamentos', novoId, dados);
    toast('Orçamento avulso criado!', 'ok');
    orcRenderizarLista();
  } catch(e) {
    console.error(e);
    toast('Erro ao criar orçamento avulso.', 'erro');
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
    orcLinhas   = orc.linhas || [];
    fchLinhas   = orc.linhasFechamento || [];

    // Preencher cabeçalho
    // Formatar datas para exibição (input type=date usa AAAA-MM-DD internamente — ok)
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

    // Resetar para aba inicial
    orcAbaAtual = 'inicial';
    fchLinhas   = [];
    orcIrAba('inicial');
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
      linhasFechamento: fchLinhas,
      atualizadoEm: new Date().toISOString()
    };

    await GepFirebase.salvar('orcamentos', orcId, dados);
    toast('Orçamento salvo! ✓', 'ok');
    setTimeout(() => orcVoltarLista(), 800);
  } catch(e) {
    toast('Erro ao salvar.', 'erro');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '💾 Salvar'; }
  }
}

/* ══════════════════════════════════════
   ABAS ESTILO EXCEL
══════════════════════════════════════ */

let orcAbaAtual = 'inicial';
let fchLinhas   = [];

function orcIrAba(aba) {
  orcAbaAtual = aba;

  // Atualizar abas visuais
  document.querySelectorAll('.orc-aba-excel').forEach(el => el.classList.remove('ativa'));
  const btnAba = document.getElementById('orcAba' + aba.charAt(0).toUpperCase() + aba.slice(1));
  if (btnAba) btnAba.classList.add('ativa');

  // Mostrar/esconder conteúdo
  const inicial    = document.getElementById('orcConteudoInicial');
  const fechamento = document.getElementById('orcConteudoFechamento');
  if (inicial)    inicial.style.display    = aba === 'inicial'    ? 'block' : 'none';
  if (fechamento) fechamento.style.display = aba === 'fechamento' ? 'block' : 'none';

  if (aba === 'fechamento') fchCarregar();
}

function fchCarregar() {
  // Replicar cabeçalho da Inicial (só leitura)
  function fmtDt(iso) {
    if (!iso) return '—';
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('pt-BR');
  }
  const campos = {
    'fchNumEvento':  document.getElementById('orcNumEvento')?.value || '—',
    'fchCliente':    document.getElementById('orcCliente')?.value || '—',
    'fchNomeEvento': document.getElementById('orcNomeEvento')?.value || '—',
    'fchDataInicio': fmtDt(document.getElementById('orcDataInicio')?.value),
    'fchDataFim':    fmtDt(document.getElementById('orcDataFim')?.value),
    'fchHoraInicio': document.getElementById('orcHoraInicio')?.value || '—',
    'fchHoraFim':    document.getElementById('orcHoraFim')?.value || '—',
    'fchPublico':    document.getElementById('orcPublico')?.value || '—',
    'fchLocal':      document.getElementById('orcLocal')?.value || '—',
    'fchDataMont':   fmtDt(document.getElementById('orcDataMont')?.value),
    'fchHoraMont':   document.getElementById('orcHoraMont')?.value || '—'
  };
  Object.entries(campos).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val || '—';
  });

  // Produtor e Empresa
  const prodEl = document.getElementById('fchProdutorNome');
  if (prodEl) prodEl.textContent = document.getElementById('orcProdutorNome')?.textContent || '—';
  const empEl = document.getElementById('fchEmpresaNome');
  if (empEl) empEl.textContent = (GepAuth.usuario?.empresaNome || GepAuth.usuario?.empresa || '—');

  // Sincronizar linhas da Inicial se fechamento ainda não foi editado
  if (!fchLinhas.length) {
    fchLinhas = JSON.parse(JSON.stringify(orcLinhas)); // cópia profunda
  }
  fchRenderizarTabela();
}

function fchRenderizarTabela() {
  const tbody = document.getElementById('fchTbody');
  if (!tbody) return;

  tbody.innerHTML = fchLinhas.map((l, i) => `
    <tr>
      <td><input class="orc-cell" value="${l.servico||''}" onchange="fchUpdateLinha(${i},'servico',this.value)" placeholder="Serviço"></td>
      <td><input class="orc-cell" value="${l.descricao||''}" onchange="fchUpdateLinha(${i},'descricao',this.value)" placeholder="Descrição"></td>
      <td><input class="orc-cell orc-num" type="number" value="${l.qtde||1}" min="1" onchange="fchUpdateLinha(${i},'qtde',+this.value);fchRecalcularLinha(${i})"></td>
      <td><input class="orc-cell orc-money" type="number" value="${l.precoUnit||0}" min="0" step="0.01" onchange="fchUpdateLinha(${i},'precoUnit',+this.value);fchRecalcularLinha(${i})"></td>
      <td><input class="orc-cell orc-num" type="number" value="${l.freq||1}" min="1" onchange="fchUpdateLinha(${i},'freq',+this.value);fchRecalcularLinha(${i})"></td>
      <td>
        <select class="orc-cell orc-sel" onchange="fchUpdateLinha(${i},'periodo',this.value);fchRecalcularLinha(${i})">
          <option value="Unid" ${l.periodo==='Unid'?'selected':''}>Unid</option>
          <option value="Dia"  ${l.periodo==='Dia'?'selected':''}>Dia</option>
        </select>
      </td>
      <td class="orc-total-cell" id="fchTotal${i}">R$ ${orcFormatarValor(l.valorFinal||0)}</td>
      <td><input class="orc-cell" value="${l.fornecedor||''}" onchange="fchUpdateLinha(${i},'fornecedor',this.value)" placeholder="Fornecedor"></td>
      <td><input class="orc-cell orc-pgto" value="${l.formaPgto||''}" onchange="fchUpdateLinha(${i},'formaPgto',this.value)" placeholder="30D"></td>
      <td><input class="orc-cell" value="${l.obs||''}" onchange="fchUpdateLinha(${i},'obs',this.value)" placeholder="—"></td>
      <td><button class="orc-del-btn" onclick="fchRemoverLinha(${i})">✕</button></td>
    </tr>`).join('');

  fchAtualizarSubtotal();
}

function fchUpdateLinha(idx, campo, valor) {
  if (fchLinhas[idx]) fchLinhas[idx][campo] = valor;
}

function fchRecalcularLinha(idx) {
  const l = fchLinhas[idx];
  if (!l) return;
  l.valorFinal = (l.qtde||0) * (l.precoUnit||0) * (l.freq||1);
  const el = document.getElementById('fchTotal' + idx);
  if (el) el.textContent = 'R$ ' + orcFormatarValor(l.valorFinal);
  fchAtualizarSubtotal();
}

function fchAdicionarLinha() {
  fchLinhas.push({ servico:'', descricao:'', qtde:1, precoUnit:0, freq:1, periodo:'Unid', valorFinal:0, fornecedor:'', formaPgto:'', obs:'' });
  fchRenderizarTabela();
}

function fchRemoverLinha(idx) {
  if (!GepUtils.confirmar('Remover este serviço?')) return;
  fchLinhas.splice(idx, 1);
  fchRenderizarTabela();
}

function fchAtualizarSubtotal() {
  const sub = fchLinhas.reduce((acc, l) => acc + (l.valorFinal||0), 0);
  const el  = document.getElementById('fchSubtotal');
  if (el) el.textContent = 'R$ ' + orcFormatarValor(sub);
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
window.orcIrAba          = orcIrAba;
window.fchAdicionarLinha = fchAdicionarLinha;
window.fchRemoverLinha   = fchRemoverLinha;
window.fchUpdateLinha    = fchUpdateLinha;
window.fchRecalcularLinha = fchRecalcularLinha;
window.orcAdicionarLinha = orcAdicionarLinha;
window.orcRemoverLinha   = orcRemoverLinha;
window.orcUpdateLinha    = orcUpdateLinha;
window.orcRecalcularLinha = orcRecalcularLinha;
window.orcAtualizarTotais = orcAtualizarTotais;
window.orcSalvar         = orcSalvar;
window.orcWACotacao       = orcWACotacao;
window.orcNovoAvulso      = orcNovoAvulso;
window.orcExcluir         = orcExcluir;
