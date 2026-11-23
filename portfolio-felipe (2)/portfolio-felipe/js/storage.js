/**
 * storage.js — Camada de dados do portfólio (LocalStorage + JSON)
 * ---------------------------------------------------------------
 * Toda a "base de dados" do projeto fica no LocalStorage do navegador,
 * sob a chave STORAGE_KEY, como um ARRAY de objetos serializado em JSON.
 *
 * Formato de cada registro:
 * {
 *   id:          "msg_lx2k9a_4f1c"   (identificador único)
 *   nome:        "Ana Souza"
 *   email:       "ana.souza@exemplo.com"
 *   assunto:     "Proposta de estágio"
 *   mensagem:    "Olá, Felipe..."
 *   data:        "2026-11-20T14:32:00.000Z" (ISO 8601 — data de criação)
 *   atualizadoEm: ISO 8601 | null       (data da última edição)
 *   status:      "nova" | "lida" | "respondida"
 *   origem:      "teste" | "formulario" | "admin"
 *   emailStatus: "enviado" | "falhou" | "pendente" | "nao-aplicavel"
 * }
 *
 * Este arquivo é carregado tanto no index.html quanto no pages/admin.html.
 * Ele expõe o objeto global `PortfolioStorage`.
 */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'portfolioFelipe.mensagens';
  const SEED_FLAG_KEY = 'portfolioFelipe.seedAplicado';

  /* ------------------------------------------------------------------
   * Utilitários
   * ------------------------------------------------------------------ */

  /** Gera um identificador único (usa crypto.randomUUID quando disponível). */
  function gerarId() {
    if (global.crypto && typeof global.crypto.randomUUID === 'function') {
      return 'msg_' + global.crypto.randomUUID().split('-')[0] + Date.now().toString(36);
    }
    return 'msg_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  /** Verifica se o LocalStorage está disponível (pode estar bloqueado em modo privado). */
  function storageDisponivel() {
    try {
      const teste = '__teste_storage__';
      global.localStorage.setItem(teste, '1');
      global.localStorage.removeItem(teste);
      return true;
    } catch (erro) {
      return false;
    }
  }

  /** Lê o array de mensagens do LocalStorage (JSON → objeto). */
  function lerTodas() {
    const bruto = global.localStorage.getItem(STORAGE_KEY);
    if (bruto === null) return [];
    try {
      const dados = JSON.parse(bruto);
      return Array.isArray(dados) ? dados : [];
    } catch (erro) {
      console.error('[storage] JSON inválido no LocalStorage. Os dados foram ignorados.', erro);
      return [];
    }
  }

  /** Grava o array de mensagens no LocalStorage (objeto → JSON). */
  function salvarTodas(lista) {
    global.localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
  }

  /** Remove espaços extras e limita o tamanho de um texto. */
  function limpar(texto, max) {
    return String(texto == null ? '' : texto).trim().slice(0, max || 5000);
  }

  /* ------------------------------------------------------------------
   * Validação compartilhada (formulário público e painel admin)
   * ------------------------------------------------------------------ */

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const LIMITES = {
    nome: { min: 3, max: 80 },
    email: { max: 120 },
    assunto: { min: 3, max: 120 },
    mensagem: { min: 10, max: 2000 }
  };

  /**
   * Valida os campos de uma mensagem.
   * @returns {Object} mapa campo → mensagem de erro (vazio quando tudo está correto)
   */
  function validar(dados) {
    const erros = {};
    const nome = limpar(dados.nome, 500);
    const email = limpar(dados.email, 500);
    const assunto = limpar(dados.assunto, 500);
    const mensagem = limpar(dados.mensagem, 5000);

    if (!nome) erros.nome = 'Informe seu nome.';
    else if (nome.length < LIMITES.nome.min) erros.nome = 'O nome deve ter pelo menos 3 caracteres.';
    else if (nome.length > LIMITES.nome.max) erros.nome = 'O nome deve ter no máximo 80 caracteres.';

    if (!email) erros.email = 'Informe seu e-mail.';
    else if (!EMAIL_REGEX.test(email) || email.length > LIMITES.email.max) erros.email = 'Digite um e-mail válido, por exemplo: nome@dominio.com.';

    if (!assunto) erros.assunto = 'Informe o assunto.';
    else if (assunto.length < LIMITES.assunto.min) erros.assunto = 'O assunto deve ter pelo menos 3 caracteres.';
    else if (assunto.length > LIMITES.assunto.max) erros.assunto = 'O assunto deve ter no máximo 120 caracteres.';

    if (!mensagem) erros.mensagem = 'Escreva sua mensagem.';
    else if (mensagem.length < LIMITES.mensagem.min) erros.mensagem = 'A mensagem deve ter pelo menos 10 caracteres.';
    else if (mensagem.length > LIMITES.mensagem.max) erros.mensagem = 'A mensagem deve ter no máximo 2000 caracteres.';

    return erros;
  }

  /* ------------------------------------------------------------------
   * 20 registros de teste (injetados apenas no primeiro acesso)
   * ------------------------------------------------------------------ */

  const REGISTROS_TESTE = [
    ['Ana Beatriz Souza', 'ana.souza@exemplo.com', 'Oportunidade de estágio em Frontend', 'Olá, Felipe! Vi seu portfólio e gostei bastante do cuidado com a interface. Temos uma vaga de estágio em desenvolvimento web e gostaríamos de conversar com você.', 'respondida'],
    ['Lucas Martins', 'lucas.martins@exemplo.com', 'Dúvida sobre o Pixel Store', 'Como você organizou o carrinho de compras no Pixel Store? Ficou com sessão no PHP ou salvou no banco de dados?', 'lida'],
    ['Mariana Costa', 'mariana.costa@exemplo.com', 'Parabéns pelo portfólio', 'O visual escuro com detalhes em azul ficou muito profissional. Parabéns pelo trabalho e boa sorte no curso técnico!', 'lida'],
    ['Pedro Henrique Lima', 'pedro.lima@exemplo.com', 'Projeto em grupo', 'Felipe, você toparia participar de um projeto em grupo para criar um site de agendamento para a feira de ciências da escola?', 'nova'],
    ['Juliana Ribeiro', 'juliana.ribeiro@exemplo.com', 'Feedback sobre responsividade', 'Abri o site no celular e no tablet e o layout se adaptou muito bem. Só senti falta de um modo claro, mas o escuro ficou ótimo.', 'lida'],
    ['Rafael Oliveira', 'rafael.oliveira@exemplo.com', 'Convite para hackathon', 'Estamos montando uma equipe para um hackathon estudantil de tecnologia. Precisamos de alguém com HTML, CSS e JavaScript. Tem interesse?', 'nova'],
    ['Camila Ferreira', 'camila.ferreira@exemplo.com', 'Material de estudo de PHP', 'Você poderia indicar materiais que usou para aprender PHP e MySQL? Estou começando agora e quero seguir uma boa trilha.', 'respondida'],
    ['Gabriel Almeida', 'gabriel.almeida@exemplo.com', 'Sobre segurança no login', 'Notei que o Pixel Store usa password_hash. Achei muito legal ver essa preocupação com segurança em um projeto de curso.', 'lida'],
    ['Larissa Gomes', 'larissa.gomes@exemplo.com', 'Pedido de orçamento', 'Tenho uma pequena loja de artesanato e gostaria de saber se você faz páginas simples de apresentação para negócios locais.', 'nova'],
    ['Thiago Barbosa', 'thiago.barbosa@exemplo.com', 'Grupo de estudos de JavaScript', 'Estou organizando um grupo de estudos de JavaScript às quintas-feiras depois da aula. Quer participar?', 'lida'],
    ['Beatriz Carvalho', 'beatriz.carvalho@exemplo.com', 'Dúvida sobre Bootstrap', 'Qual versão do Bootstrap você usou no portfólio? Estou tendo problemas com o menu responsivo no meu projeto.', 'respondida'],
    ['Matheus Rocha', 'matheus.rocha@exemplo.com', 'Edge Computing', 'Li sua seção sobre Edge Computing e achei a comparação com a nuvem bem didática. Vou usar como referência no meu seminário.', 'lida'],
    ['Isabela Nunes', 'isabela.nunes@exemplo.com', 'Mentoria para iniciantes', 'Sou do primeiro ano do curso e queria saber como você organiza seus estudos de programação junto com as outras matérias.', 'nova'],
    ['Vinícius Teixeira', 'vinicius.teixeira@exemplo.com', 'Erro no formulário (teste)', 'Esta é uma mensagem de teste para verificar se a validação do formulário de contato está funcionando corretamente.', 'lida'],
    ['Fernanda Araújo', 'fernanda.araujo@exemplo.com', 'Convite para palestra na turma', 'Os alunos da turma do 1º ano gostariam de ouvir sobre sua experiência desenvolvendo o Pixel Store. Teria disponibilidade?', 'nova'],
    ['Gustavo Pereira', 'gustavo.pereira@exemplo.com', 'Blockchain na prática', 'Gostei da explicação sobre blocos e hashes. Você pretende criar algum projeto prático envolvendo blockchain?', 'lida'],
    ['Letícia Moreira', 'leticia.moreira@exemplo.com', 'Colaboração em projeto open source', 'Tenho um repositório de exercícios de lógica no GitHub e estou aceitando contribuições. Se quiser ajudar, será bem-vindo!', 'nova'],
    ['Bruno Cardoso', 'bruno.cardoso@exemplo.com', 'Dica de ferramenta', 'Recomendo testar o Live Server do VS Code para desenvolver o portfólio, ele recarrega a página automaticamente a cada alteração.', 'respondida'],
    ['Amanda Duarte', 'amanda.duarte@exemplo.com', 'Feira de profissões', 'A coordenação está selecionando projetos de alunos para expor na feira de profissões. O seu portfólio seria um ótimo exemplo.', 'nova'],
    ['Diego Fernandes', 'diego.fernandes@exemplo.com', 'Cibersegurança', 'Muito boa a seção de cibersegurança. Seria legal acrescentar dicas sobre autenticação em dois fatores para os usuários.', 'lida']
  ];

  /**
   * Monta os 20 registros de teste com datas coerentes:
   * distribuídas nos últimos ~40 dias, sempre no passado, em horário comercial.
   */
  function montarRegistrosTeste() {
    const agora = new Date();
    return REGISTROS_TESTE.map(function (r, indice) {
      const data = new Date(agora);
      // Registro 0 é o mais antigo; os dias diminuem até o mais recente.
      const diasAtras = Math.round(40 - indice * 2.05);
      data.setDate(data.getDate() - diasAtras);
      data.setHours(8 + ((indice * 3) % 11), (indice * 17) % 60, 0, 0);
      if (data > agora) data.setTime(agora.getTime() - (indice + 1) * 60000);

      return {
        id: 'msg_teste_' + String(indice + 1).padStart(2, '0') + '_' + Math.random().toString(36).slice(2, 7),
        nome: r[0],
        email: r[1],
        assunto: r[2],
        mensagem: r[3],
        data: data.toISOString(),
        atualizadoEm: null,
        status: r[4],
        origem: 'teste',
        emailStatus: 'nao-aplicavel'
      };
    });
  }

  /**
   * Verifica se o LocalStorage está vazio (chave inexistente) e, apenas nesse caso,
   * injeta os 20 registros de teste. Se já existir qualquer dado, nada é alterado.
   * @returns {boolean} true se os registros foram inseridos agora.
   */
  function inicializar() {
    if (!storageDisponivel()) {
      console.warn('[storage] LocalStorage indisponível neste navegador.');
      return false;
    }
    const existente = global.localStorage.getItem(STORAGE_KEY);
    if (existente !== null) {
      return false; // Já existem dados: não duplica os registros de teste.
    }
    salvarTodas(montarRegistrosTeste());
    global.localStorage.setItem(SEED_FLAG_KEY, new Date().toISOString());
    console.info('[storage] Primeiro acesso: 20 registros de teste foram criados.');
    return true;
  }

  /* ------------------------------------------------------------------
   * CRUD
   * ------------------------------------------------------------------ */

  /** CREATE — cria um registro e devolve o objeto salvo. */
  function criar(dados) {
    const lista = lerTodas();
    const registro = {
      id: gerarId(),
      nome: limpar(dados.nome, LIMITES.nome.max),
      email: limpar(dados.email, LIMITES.email.max).toLowerCase(),
      assunto: limpar(dados.assunto, LIMITES.assunto.max),
      mensagem: limpar(dados.mensagem, LIMITES.mensagem.max),
      data: dados.data || new Date().toISOString(),
      atualizadoEm: null,
      status: dados.status || 'nova',
      origem: dados.origem || 'formulario',
      emailStatus: dados.emailStatus || 'pendente'
    };
    lista.push(registro);
    salvarTodas(lista);
    return registro;
  }

  /** READ — lista todas as mensagens (mais recentes primeiro). */
  function listar() {
    return lerTodas().sort(function (a, b) {
      return new Date(b.data) - new Date(a.data);
    });
  }

  /** READ — busca uma mensagem pelo id. */
  function buscarPorId(id) {
    return lerTodas().find(function (m) { return m.id === id; }) || null;
  }

  /** UPDATE — altera campos de um registro existente. */
  function atualizar(id, alteracoes, opcoes) {
    const lista = lerTodas();
    const indice = lista.findIndex(function (m) { return m.id === id; });
    if (indice === -1) return null;

    const permitido = ['nome', 'email', 'assunto', 'mensagem', 'status', 'emailStatus'];
    const atual = lista[indice];
    permitido.forEach(function (campo) {
      if (alteracoes[campo] !== undefined) {
        const max = LIMITES[campo] ? LIMITES[campo].max : 40;
        atual[campo] = limpar(alteracoes[campo], max);
      }
    });
    if (atual.email) atual.email = atual.email.toLowerCase();
    // Alterações automáticas (ex.: resultado do envio do e-mail) não contam como "edição".
    if (!opcoes || !opcoes.silencioso) atual.atualizadoEm = new Date().toISOString();

    lista[indice] = atual;
    salvarTodas(lista);
    return atual;
  }

  /** DELETE — remove um registro pelo id. */
  function excluir(id) {
    const lista = lerTodas();
    const nova = lista.filter(function (m) { return m.id !== id; });
    if (nova.length === lista.length) return false;
    salvarTodas(nova);
    return true;
  }

  /** Exporta todos os registros como texto JSON formatado. */
  function exportarJSON() {
    return JSON.stringify(listar(), null, 2);
  }

  /** Apaga tudo e recria os 20 registros de teste (usado pelo botão "Restaurar" do painel). */
  function restaurarTeste() {
    global.localStorage.removeItem(STORAGE_KEY);
    return inicializar();
  }

  global.PortfolioStorage = {
    STORAGE_KEY: STORAGE_KEY,
    LIMITES: LIMITES,
    disponivel: storageDisponivel,
    inicializar: inicializar,
    validar: validar,
    criar: criar,
    listar: listar,
    buscarPorId: buscarPorId,
    atualizar: atualizar,
    excluir: excluir,
    exportarJSON: exportarJSON,
    restaurarTeste: restaurarTeste
  };

  // Executa a verificação do primeiro acesso assim que o script é carregado.
  inicializar();
})(window);
