/**
 * admin.js — Painel administrativo oculto (CRUD com LocalStorage)
 * ---------------------------------------------------------------
 * CREATE  → botão "Nova mensagem" (modal de formulário)
 * READ    → dashboard, mensagens recentes, tabela com busca/filtros/paginação e modal de detalhes
 * UPDATE  → botão "Editar" (mesmo modal) e troca rápida de status no modal de detalhes
 * DELETE  → botão "Excluir" com modal de confirmação
 *
 * Toda a leitura/gravação passa pelo objeto global PortfolioStorage (js/storage.js),
 * que converte os registros para JSON antes de salvar no LocalStorage.
 */
(function () {
  'use strict';

  /* ==================================================================
   * ACESSO (proteção apenas demonstrativa)
   * ATENÇÃO: uma senha escrita no JavaScript pode ser lida por qualquer
   * pessoa que abrir o código-fonte. Isto NÃO é segurança real de produção;
   * serve só para cumprir o requisito acadêmico de "área oculta".
   * Em produção, a autenticação deve acontecer em um servidor (backend).
   * ================================================================== */
  const SENHA_ADMIN = 'felipe@03TI3';
  const SESSAO_KEY = 'portfolioFelipe.adminSessao';
  const POR_PAGINA = 8;

  const $ = function (s, r) { return (r || document).querySelector(s); };
  const $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  const ROTULO_STATUS = { nova: 'Nova', lida: 'Lida', respondida: 'Respondida' };
  const ROTULO_ORIGEM = { formulario: 'formulário', admin: 'painel', teste: 'teste' };
  const ROTULO_EMAIL = {
    enviado: 'Notificação enviada por e-mail',
    falhou: 'Falha no envio do e-mail (mensagem salva localmente)',
    pendente: 'Envio de e-mail pendente',
    'nao-aplicavel': 'Sem envio de e-mail (registro de teste/painel)'
  };

  const estado = {
    busca: '',
    status: '',
    origem: '',
    periodo: '',
    ordem: 'recentes',
    pagina: 1,
    idSelecionado: null
  };

  let modais = {};

  /* ------------------------------------------------------------------
   * Utilitários
   * ------------------------------------------------------------------ */

  /** Escapa HTML para impedir que o conteúdo das mensagens execute código (XSS). */
  function esc(texto) {
    return String(texto == null ? '' : texto)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function iniciais(nome) {
    const partes = String(nome || '?').trim().split(/\s+/);
    return ((partes[0] || '')[0] + ((partes.length > 1 ? partes[partes.length - 1] : '')[0] || '')).toUpperCase();
  }

  function formatarData(iso, completo) {
    const d = new Date(iso);
    if (isNaN(d)) return '—';
    return d.toLocaleString('pt-BR', completo
      ? { dateStyle: 'long', timeStyle: 'short' }
      : { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function tempoRelativo(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.round(diff / 60000);
    if (min < 1) return 'agora';
    if (min < 60) return 'há ' + min + ' min';
    const h = Math.round(min / 60);
    if (h < 24) return 'há ' + h + ' h';
    const dias = Math.round(h / 24);
    if (dias === 1) return 'ontem';
    if (dias < 30) return 'há ' + dias + ' dias';
    return formatarData(iso).split(' ')[0];
  }

  function badgeStatus(status) {
    return '<span class="badge-status badge-status--' + esc(status) + '">' + esc(ROTULO_STATUS[status] || status) + '</span>';
  }

  /** Feedback visual (toast do Bootstrap). */
  function toast(mensagem, tipo) {
    const icones = { success: 'bi-check-circle-fill', error: 'bi-x-octagon-fill', info: 'bi-info-circle-fill' };
    const el = document.createElement('div');
    el.className = 'toast toast-dark align-items-center ' + (tipo || 'success');
    el.setAttribute('role', 'status');
    el.innerHTML = '<div class="d-flex"><div class="toast-body"><i class="bi ' + icones[tipo || 'success'] + '"></i><span></span></div>' +
      '<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Fechar"></button></div>';
    el.querySelector('span').textContent = mensagem;
    $('#toasts').appendChild(el);
    const t = new bootstrap.Toast(el, { delay: 3200 });
    el.addEventListener('hidden.bs.toast', function () { el.remove(); });
    t.show();
  }

  /* ------------------------------------------------------------------
   * Tela de acesso
   * ------------------------------------------------------------------ */
  function iniciarAcesso() {
    const gate = $('#gate');
    const form = $('#gateForm');
    const input = $('#gatePassword');
    const erro = $('#gateError');

    if (sessionStorage.getItem(SESSAO_KEY) === 'ok') {
      abrirPainel();
      return;
    }
    input.focus();

    $('#pwToggle').addEventListener('click', function () {
      const visivel = input.type === 'text';
      input.type = visivel ? 'password' : 'text';
      this.innerHTML = visivel ? '<i class="bi bi-eye"></i>' : '<i class="bi bi-eye-slash"></i>';
      this.setAttribute('aria-label', visivel ? 'Mostrar senha' : 'Ocultar senha');
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (input.value === SENHA_ADMIN) {
        sessionStorage.setItem(SESSAO_KEY, 'ok');
        erro.textContent = '';
        abrirPainel();
      } else {
        erro.textContent = input.value ? 'Senha incorreta. Tente novamente.' : 'Digite a senha de acesso.';
        input.classList.add('is-invalid');
        gate.classList.remove('shake');
        void gate.offsetWidth; // reinicia a animação
        gate.classList.add('shake');
        input.select();
      }
    });
    input.addEventListener('input', function () { input.classList.remove('is-invalid'); erro.textContent = ''; });
  }

  function abrirPainel() {
    $('#gate').classList.add('d-none');
    $('#adminApp').classList.remove('d-none');
    iniciarPainel();
  }

  /* ------------------------------------------------------------------
   * Leitura e filtros
   * ------------------------------------------------------------------ */
  function filtrar(lista) {
    const termo = estado.busca.trim().toLowerCase();
    const limite = estado.periodo ? Date.now() - Number(estado.periodo) * 86400000 : 0;
    const inicioHoje = new Date(); inicioHoje.setHours(0, 0, 0, 0);

    let resultado = lista.filter(function (m) {
      if (estado.status && m.status !== estado.status) return false;
      if (estado.origem && m.origem !== estado.origem) return false;
      if (estado.periodo === '1' && new Date(m.data) < inicioHoje) return false;
      if (estado.periodo && estado.periodo !== '1' && new Date(m.data).getTime() < limite) return false;
      if (termo) {
        const alvo = (m.nome + ' ' + m.email + ' ' + m.assunto + ' ' + m.mensagem).toLowerCase();
        if (alvo.indexOf(termo) === -1) return false;
      }
      return true;
    });

    resultado.sort(function (a, b) {
      if (estado.ordem === 'antigas') return new Date(a.data) - new Date(b.data);
      if (estado.ordem === 'nome') return a.nome.localeCompare(b.nome, 'pt-BR');
      return new Date(b.data) - new Date(a.data);
    });
    return resultado;
  }

  /* ------------------------------------------------------------------
   * Renderização
   * ------------------------------------------------------------------ */
  function renderizarTudo(idDestaque) {
    const todas = PortfolioStorage.listar();
    renderizarEstatisticas(todas);
    renderizarRecentes(todas);
    renderizarBarras(todas);
    renderizarTabela(todas, idDestaque);
    renderizarInfoStorage();
  }

  function renderizarEstatisticas(todas) {
    const semana = Date.now() - 7 * 86400000;
    const viaForm = todas.filter(function (m) { return m.origem === 'formulario'; });
    const enviados = viaForm.filter(function (m) { return m.emailStatus === 'enviado'; }).length;

    $('#statTotal').textContent = todas.length;
    $('#statNovas').textContent = todas.filter(function (m) { return m.status === 'nova'; }).length;
    $('#statSemana').textContent = todas.filter(function (m) { return new Date(m.data).getTime() >= semana; }).length;
    $('#statForm').textContent = viaForm.length;
    $('#statEmail').textContent = viaForm.length ? enviados + ' com e-mail enviado' : 'Nenhuma ainda';
    $('#sideCount').textContent = todas.length;
  }

  function renderizarRecentes(todas) {
    const ul = $('#recentList');
    const recentes = todas.slice(0, 5);
    if (!recentes.length) {
      ul.innerHTML = '<li class="empty py-4"><i class="bi bi-inbox"></i>Sem mensagens.</li>';
      return;
    }
    ul.innerHTML = recentes.map(function (m) {
      return '<li><button type="button" class="recent-item" data-ver="' + esc(m.id) + '">' +
        '<span class="avatar">' + esc(iniciais(m.nome)) + '</span>' +
        '<span class="recent-item__main">' +
          '<span class="recent-item__top"><span class="recent-item__name">' + esc(m.nome) + '</span>' +
          '<span class="recent-item__date">' + esc(tempoRelativo(m.data)) + '</span></span>' +
          '<span class="recent-item__subj">' + esc(m.assunto) + '</span>' +
        '</span>' + badgeStatus(m.status) +
      '</button></li>';
    }).join('');
  }

  function barras(alvo, contagem, total, classes, rotulos) {
    $(alvo).innerHTML = Object.keys(contagem).map(function (chave) {
      const pct = total ? Math.round((contagem[chave] / total) * 100) : 0;
      return '<div class="bar-row"><span>' + esc(rotulos[chave]) + '</span>' +
        '<div class="bar-track" role="progressbar" aria-label="' + esc(rotulos[chave]) + '" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100">' +
        '<div class="bar-fill ' + (classes ? 'bar-fill--' + chave : '') + '" data-w="' + pct + '"></div></div>' +
        '<span>' + contagem[chave] + '</span></div>';
    }).join('');
    // Anima a largura depois de inserir no DOM
    requestAnimationFrame(function () {
      $$(alvo + ' .bar-fill').forEach(function (f) { f.style.width = f.dataset.w + '%'; });
    });
  }

  function renderizarBarras(todas) {
    const porStatus = { nova: 0, lida: 0, respondida: 0 };
    const porOrigem = { formulario: 0, admin: 0, teste: 0 };
    todas.forEach(function (m) {
      if (porStatus[m.status] !== undefined) porStatus[m.status]++;
      if (porOrigem[m.origem] !== undefined) porOrigem[m.origem]++;
    });
    barras('#statusBars', porStatus, todas.length, true, { nova: 'Novas', lida: 'Lidas', respondida: 'Respondidas' });
    barras('#origemBars', porOrigem, todas.length, false, { formulario: 'Formulário', admin: 'Painel', teste: 'Teste' });
  }

  function renderizarTabela(todas, idDestaque) {
    const filtradas = filtrar(todas);
    const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
    if (estado.pagina > totalPaginas) estado.pagina = totalPaginas;
    const inicio = (estado.pagina - 1) * POR_PAGINA;
    const pagina = filtradas.slice(inicio, inicio + POR_PAGINA);

    $('#tabela').innerHTML = pagina.map(function (m) {
      return '<tr class="' + (m.status === 'nova' ? 'is-new ' : '') + (m.id === idDestaque ? 'flash' : '') + '" data-id="' + esc(m.id) + '">' +
        '<td><div class="cell-sender"><span class="avatar">' + esc(iniciais(m.nome)) + '</span>' +
          '<div><strong>' + esc(m.nome) + '</strong><small>' + esc(m.email) + '</small></div></div></td>' +
        '<td class="cell-subject"><strong>' + esc(m.assunto) + '</strong>' +
          '<small><span class="badge-origem">' + esc(ROTULO_ORIGEM[m.origem] || m.origem) + '</span> ' + esc(m.mensagem.slice(0, 70)) + '</small></td>' +
        '<td class="cell-date d-none d-xxl-table-cell">' + esc(formatarData(m.data)) + '</td>' +
        '<td>' + badgeStatus(m.status) + '</td>' +
        '<td class="text-end"><div class="actions">' +
          '<button type="button" class="icon-btn" data-ver="' + esc(m.id) + '" title="Visualizar" aria-label="Visualizar mensagem de ' + esc(m.nome) + '"><i class="bi bi-eye"></i></button>' +
          '<button type="button" class="icon-btn icon-btn--edit" data-editar="' + esc(m.id) + '" title="Editar" aria-label="Editar mensagem de ' + esc(m.nome) + '"><i class="bi bi-pencil"></i></button>' +
          '<button type="button" class="icon-btn icon-btn--del" data-excluir="' + esc(m.id) + '" title="Excluir" aria-label="Excluir mensagem de ' + esc(m.nome) + '"><i class="bi bi-trash"></i></button>' +
        '</div></td></tr>';
    }).join('');

    $('#vazio').classList.toggle('d-none', filtradas.length > 0);
    $('#resultInfo').textContent = filtradas.length
      ? 'Mostrando ' + (inicio + 1) + '–' + (inicio + pagina.length) + ' de ' + filtradas.length + (filtradas.length !== todas.length ? ' (filtrado de ' + todas.length + ')' : '')
      : '0 resultados';

    renderizarPaginacao(totalPaginas);
  }

  function renderizarPaginacao(totalPaginas) {
    const nav = $('#paginacao');
    if (totalPaginas <= 1) { nav.innerHTML = ''; return; }
    let html = '<button type="button" data-pag="' + (estado.pagina - 1) + '" ' + (estado.pagina === 1 ? 'disabled' : '') + ' aria-label="Página anterior"><i class="bi bi-chevron-left"></i></button>';
    for (let i = 1; i <= totalPaginas; i++) {
      html += '<button type="button" data-pag="' + i + '" class="' + (i === estado.pagina ? 'active' : '') + '"' + (i === estado.pagina ? ' aria-current="page"' : '') + '>' + i + '</button>';
    }
    html += '<button type="button" data-pag="' + (estado.pagina + 1) + '" ' + (estado.pagina === totalPaginas ? 'disabled' : '') + ' aria-label="Próxima página"><i class="bi bi-chevron-right"></i></button>';
    nav.innerHTML = html;
  }

  function renderizarInfoStorage() {
    const bruto = localStorage.getItem(PortfolioStorage.STORAGE_KEY) || '';
    $('#storageKey').textContent = PortfolioStorage.STORAGE_KEY;
    $('#storageSize').textContent = (new Blob([bruto]).size / 1024).toFixed(1) + ' KB em JSON';
  }

  /* ------------------------------------------------------------------
   * READ — modal de detalhes
   * ------------------------------------------------------------------ */
  function abrirDetalhes(id) {
    let m = PortfolioStorage.buscarPorId(id);
    if (!m) { toast('Registro não encontrado.', 'error'); return; }

    // Ao abrir uma mensagem nova, ela passa automaticamente para "lida"
    if (m.status === 'nova') {
      m = PortfolioStorage.atualizar(id, { status: 'lida' }, { silencioso: true });
      renderizarTudo();
    }
    estado.idSelecionado = id;

    $('#modalVerTitulo').textContent = m.assunto;
    $('#modalVerCorpo').innerHTML =
      '<div class="detail-grid">' +
        '<div class="detail"><small>Nome</small><span>' + esc(m.nome) + '</span></div>' +
        '<div class="detail"><small>E-mail</small><span>' + esc(m.email) + '</span></div>' +
        '<div class="detail"><small>Data de envio</small><span>' + esc(formatarData(m.data, true)) + '</span></div>' +
        '<div class="detail"><small>Status</small><span>' + badgeStatus(m.status) + ' <span class="badge-origem ms-1">' + esc(ROTULO_ORIGEM[m.origem] || m.origem) + '</span></span></div>' +
      '</div>' +
      '<small class="mono text-muted-3 d-block mb-2">MENSAGEM</small>' +
      '<div class="message-body">' + esc(m.mensagem) + '</div>' +
      '<p class="small text-muted-3 mt-3 mb-0"><i class="bi bi-envelope me-1"></i>' + esc(ROTULO_EMAIL[m.emailStatus] || '—') +
        (m.atualizadoEm ? ' · Editado em ' + esc(formatarData(m.atualizadoEm)) : '') +
        ' · ID: <code>' + esc(m.id) + '</code></p>';

    $('#verStatus').value = m.status;
    $('#btnResponder').href = 'mailto:' + encodeURIComponent(m.email) + '?subject=' + encodeURIComponent('Re: ' + m.assunto);
    modais.ver.show();
  }

  /* ------------------------------------------------------------------
   * CREATE / UPDATE — modal de formulário
   * ------------------------------------------------------------------ */
  const CAMPOS_FORM = { nome: '#regNome', email: '#regEmail', assunto: '#regAssunto', mensagem: '#regMensagem' };

  function limparErrosForm() {
    Object.keys(CAMPOS_FORM).forEach(function (c) {
      $(CAMPOS_FORM[c]).classList.remove('is-invalid');
      $(CAMPOS_FORM[c] + '-erro').textContent = '';
    });
  }

  function abrirFormulario(id) {
    const form = $('#formRegistro');
    form.reset();
    limparErrosForm();
    $('#regId').value = '';
    $('#regMeta').textContent = '';

    if (id) {
      const m = PortfolioStorage.buscarPorId(id);
      if (!m) { toast('Registro não encontrado.', 'error'); return; }
      $('#modalFormTitulo').textContent = 'Editar mensagem';
      $('#regId').value = m.id;
      $('#regNome').value = m.nome;
      $('#regEmail').value = m.email;
      $('#regAssunto').value = m.assunto;
      $('#regMensagem').value = m.mensagem;
      $('#regStatus').value = m.status;
      $('#regMeta').textContent = 'Criada em ' + formatarData(m.data) + (m.atualizadoEm ? ' · última edição em ' + formatarData(m.atualizadoEm) : '');
    } else {
      $('#modalFormTitulo').textContent = 'Nova mensagem';
      $('#regStatus').value = 'nova';
    }
    modais.form.show();
  }

  function salvarFormulario(e) {
    e.preventDefault();
    const dados = {
      nome: $('#regNome').value,
      email: $('#regEmail').value,
      assunto: $('#regAssunto').value,
      mensagem: $('#regMensagem').value,
      status: $('#regStatus').value
    };
    const erros = PortfolioStorage.validar(dados);
    limparErrosForm();
    if (Object.keys(erros).length) {
      Object.keys(erros).forEach(function (c) {
        $(CAMPOS_FORM[c]).classList.add('is-invalid');
        $(CAMPOS_FORM[c] + '-erro').textContent = erros[c];
      });
      $(CAMPOS_FORM[Object.keys(erros)[0]]).focus();
      toast('Corrija os campos destacados.', 'error');
      return;
    }

    const id = $('#regId').value;
    let salvo;
    if (id) {
      salvo = PortfolioStorage.atualizar(id, dados);           // UPDATE
      toast('Mensagem atualizada com sucesso.', 'success');
    } else {
      dados.origem = 'admin';
      dados.emailStatus = 'nao-aplicavel';
      salvo = PortfolioStorage.criar(dados);                   // CREATE
      estado.pagina = 1;
      toast('Mensagem criada com sucesso.', 'success');
    }
    modais.form.hide();
    renderizarTudo(salvo && salvo.id);
  }

  /* ------------------------------------------------------------------
   * DELETE — com confirmação
   * ------------------------------------------------------------------ */
  function pedirExclusao(id) {
    const m = PortfolioStorage.buscarPorId(id);
    if (!m) return;
    estado.idSelecionado = id;
    $('#excluirTexto').innerHTML = 'A mensagem de <strong>' + esc(m.nome) + '</strong> — “' + esc(m.assunto) + '” — será removida permanentemente do LocalStorage.';
    modais.excluir.show();
  }

  function confirmarExclusao() {
    if (PortfolioStorage.excluir(estado.idSelecionado)) {
      toast('Mensagem excluída.', 'success');
    } else {
      toast('Não foi possível excluir.', 'error');
    }
    estado.idSelecionado = null;
    modais.excluir.hide();
    renderizarTudo();
  }

  /* ------------------------------------------------------------------
   * JSON — visualizar, copiar e exportar
   * ------------------------------------------------------------------ */
  function exportarJson() {
    const blob = new Blob([PortfolioStorage.exportarJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mensagens-portfolio-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast('Arquivo JSON exportado.', 'info');
  }

  /* ------------------------------------------------------------------
   * Eventos
   * ------------------------------------------------------------------ */
  function executarAcao(acao) {
    const sidebar = bootstrap.Offcanvas.getInstance($('#adminSidebar'));
    if (sidebar) sidebar.hide();

    switch (acao) {
      case 'novo': abrirFormulario(null); break;
      case 'exportar': exportarJson(); break;
      case 'ver-json':
        $('#jsonView').textContent = PortfolioStorage.exportarJSON();
        modais.json.show();
        break;
      case 'restaurar': modais.restaurar.show(); break;
      case 'sair':
        sessionStorage.removeItem(SESSAO_KEY);
        window.location.href = '../index.html';
        break;
    }
  }

  function ligarEventos() {
    // Ações gerais (sidebar, topo, modais)
    document.addEventListener('click', function (e) {
      const acao = e.target.closest('[data-action]');
      if (acao) { executarAcao(acao.dataset.action); return; }

      const ver = e.target.closest('[data-ver]');
      if (ver) { abrirDetalhes(ver.dataset.ver); return; }

      const editar = e.target.closest('[data-editar]');
      if (editar) { abrirFormulario(editar.dataset.editar); return; }

      const excluir = e.target.closest('[data-excluir]');
      if (excluir) { pedirExclusao(excluir.dataset.excluir); return; }

      const pag = e.target.closest('[data-pag]');
      if (pag && !pag.disabled) {
        estado.pagina = Number(pag.dataset.pag);
        renderizarTabela(PortfolioStorage.listar());
        $('#mensagens').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    // Duplo clique na linha abre os detalhes
    $('#tabela').addEventListener('dblclick', function (e) {
      const tr = e.target.closest('tr[data-id]');
      if (tr && !e.target.closest('button')) abrirDetalhes(tr.dataset.id);
    });

    // Navegação lateral
    $$('.side-nav a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function () {
        $$('.side-nav a[href^="#"]').forEach(function (x) { x.classList.remove('active'); });
        a.classList.add('active');
        const sidebar = bootstrap.Offcanvas.getInstance($('#adminSidebar'));
        if (sidebar) sidebar.hide();
      });
    });

    // Busca e filtros
    let atraso;
    $('#busca').addEventListener('input', function () {
      clearTimeout(atraso);
      const valor = this.value;
      atraso = setTimeout(function () {
        estado.busca = valor;
        estado.pagina = 1;
        renderizarTabela(PortfolioStorage.listar());
      }, 180);
    });
    [['#filtroStatus', 'status'], ['#filtroOrigem', 'origem'], ['#filtroPeriodo', 'periodo'], ['#ordenacao', 'ordem']].forEach(function (par) {
      $(par[0]).addEventListener('change', function () {
        estado[par[1]] = this.value;
        estado.pagina = 1;
        renderizarTabela(PortfolioStorage.listar());
      });
    });
    $('#limparFiltros').addEventListener('click', function () {
      estado.busca = ''; estado.status = ''; estado.origem = ''; estado.periodo = ''; estado.ordem = 'recentes'; estado.pagina = 1;
      $('#busca').value = ''; $('#filtroStatus').value = ''; $('#filtroOrigem').value = ''; $('#filtroPeriodo').value = ''; $('#ordenacao').value = 'recentes';
      renderizarTabela(PortfolioStorage.listar());
      toast('Filtros limpos.', 'info');
    });

    // Modal de detalhes: status rápido, editar, excluir
    $('#verStatus').addEventListener('change', function () {
      PortfolioStorage.atualizar(estado.idSelecionado, { status: this.value });
      toast('Status alterado para "' + ROTULO_STATUS[this.value] + '".', 'success');
      renderizarTudo(estado.idSelecionado);
    });
    $('#btnVerEditar').addEventListener('click', function () {
      const id = estado.idSelecionado;
      modais.ver.hide();
      abrirFormulario(id);
    });
    $('#btnVerExcluir').addEventListener('click', function () {
      const id = estado.idSelecionado;
      modais.ver.hide();
      pedirExclusao(id);
    });

    $('#formRegistro').addEventListener('submit', salvarFormulario);
    $('#confirmarExcluir').addEventListener('click', confirmarExclusao);
    $('#confirmarRestaurar').addEventListener('click', function () {
      PortfolioStorage.restaurarTeste();
      estado.pagina = 1;
      modais.restaurar.hide();
      renderizarTudo();
      toast('20 registros de teste restaurados.', 'success');
    });
    $('#copiarJson').addEventListener('click', function () {
      const texto = $('#jsonView').textContent;
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(texto).then(function () { toast('JSON copiado.', 'info'); });
      } else {
        const range = document.createRange();
        range.selectNodeContents($('#jsonView'));
        const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
        document.execCommand('copy');
        sel.removeAllRanges();
        toast('JSON copiado.', 'info');
      }
    });

    // Atualiza o painel se as mensagens mudarem em outra aba (ex.: formulário do site)
    window.addEventListener('storage', function (e) {
      if (e.key === PortfolioStorage.STORAGE_KEY) {
        renderizarTudo();
        toast('Novos dados recebidos de outra aba.', 'info');
      }
    });
  }

  function iniciarPainel() {
    modais = {
      ver: new bootstrap.Modal('#modalVer'),
      form: new bootstrap.Modal('#modalForm'),
      excluir: new bootstrap.Modal('#modalExcluir'),
      restaurar: new bootstrap.Modal('#modalRestaurar'),
      json: new bootstrap.Modal('#modalJson')
    };
    $('#todayLabel').textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    ligarEventos();
    renderizarTudo();
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!PortfolioStorage.disponivel()) {
      document.body.innerHTML = '<p class="p-5 text-center">O LocalStorage está indisponível neste navegador.</p>';
      return;
    }
    iniciarAcesso();
  });
})();
