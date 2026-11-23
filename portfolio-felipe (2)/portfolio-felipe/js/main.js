/**
 * main.js — Interações da página pública
 * --------------------------------------
 * 1. Navbar inteligente (esconde ao descer, mostra ao subir) + barra de progresso
 * 2. Animações de entrada (IntersectionObserver)
 * 3. Efeito de digitação no Hero
 * 4. Carrossel de screenshots (sincroniza botões)
 * 5. Formulário de contato (validação + LocalStorage + EmailJS)
 * 6. Acesso oculto ao painel administrativo
 */
(function () {
  'use strict';

  const $ = function (seletor, raiz) { return (raiz || document).querySelector(seletor); };
  const $$ = function (seletor, raiz) { return Array.prototype.slice.call((raiz || document).querySelectorAll(seletor)); };
  const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------
   * 1. Navbar inteligente, progresso de leitura e "voltar ao topo"
   * ------------------------------------------------------------------ */
  function iniciarNavbar() {
    const nav = $('#siteNav');
    const progresso = $('#scrollProgress');
    const voltarTopo = $('#backToTop');
    let ultimoY = window.scrollY;
    let agendado = false;

    function atualizar() {
      const y = window.scrollY;
      const alturaTotal = document.documentElement.scrollHeight - window.innerHeight;

      nav.classList.toggle('is-scrolled', y > 20);
      // Esconde só depois de passar do hero e quando o usuário está descendo
      const descendo = y > ultimoY;
      const menuAberto = document.querySelector('.dropdown-menu.show') || document.querySelector('.offcanvas.show');
      nav.classList.toggle('is-hidden', descendo && y > 480 && !menuAberto);

      if (progresso && alturaTotal > 0) progresso.style.width = (y / alturaTotal) * 100 + '%';
      if (voltarTopo) voltarTopo.classList.toggle('show', y > 700);

      ultimoY = y;
      agendado = false;
    }

    window.addEventListener('scroll', function () {
      if (!agendado) {
        window.requestAnimationFrame(atualizar);
        agendado = true;
      }
    }, { passive: true });
    atualizar();

    if (voltarTopo) {
      voltarTopo.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: reduzirMovimento ? 'auto' : 'smooth' });
      });
    }

    // Ao clicar num link do menu mobile, fecha o offcanvas
    const offcanvasEl = $('#mobileNav');
    if (offcanvasEl && window.bootstrap) {
      const offcanvas = window.bootstrap.Offcanvas.getOrCreateInstance(offcanvasEl);
      $$('a[href^="#"]', offcanvasEl).forEach(function (link) {
        link.addEventListener('click', function () { offcanvas.hide(); });
      });
    }

    // Ao navegar por um link interno, garante que a navbar fique visível
    $$('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function () {
        setTimeout(function () { nav.classList.remove('is-hidden'); }, 900);
      });
    });
  }


  /* ------------------------------------------------------------------
   * Destaca no menu a seção que está visível (scrollspy próprio,
   * agrupando as 4 subseções de Conhecimento e de Tendências)
   * ------------------------------------------------------------------ */
  function iniciarScrollspy() {
    const grupos = {
      inicio: ['inicio'],
      sobre: ['sobre'],
      conhecimento: ['conhecimento', 'humanas', 'natureza', 'matematica', 'linguagens'],
      tendencias: ['tendencias', 'ciberseguranca', 'blockchain', 'automacao', 'edge'],
      projetos: ['projetos'],
      contato: ['contato']
    };
    const secoes = [];
    Object.keys(grupos).forEach(function (grupo) {
      grupos[grupo].forEach(function (id) {
        const el = document.getElementById(id);
        if (el) secoes.push({ el: el, grupo: grupo });
      });
    });
    const links = $$('[data-spy]');
    let agendado = false;

    function atualizar() {
      const linha = window.scrollY + window.innerHeight * 0.35;
      let atual = 'inicio';
      secoes.forEach(function (s) {
        if (s.el.getBoundingClientRect().top + window.scrollY <= linha) atual = s.grupo;
      });
      // No fim da página, o último item fica ativo
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) atual = 'contato';
      links.forEach(function (l) { l.classList.toggle('active', l.dataset.spy === atual); });
      agendado = false;
    }
    window.addEventListener('scroll', function () {
      if (!agendado) { agendado = true; window.requestAnimationFrame(atualizar); }
    }, { passive: true });
    window.addEventListener('resize', atualizar);
    atualizar();
  }

  /* ------------------------------------------------------------------
   * 2. Animações de entrada discretas
   * ------------------------------------------------------------------ */
  function iniciarReveal() {
    const elementos = $$('.reveal');
    if (reduzirMovimento || !('IntersectionObserver' in window)) {
      elementos.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    const observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (entrada.isIntersecting) {
          entrada.target.classList.add('is-visible');
          observador.unobserve(entrada.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    elementos.forEach(function (el) { observador.observe(el); });
  }

  /* ------------------------------------------------------------------
   * 3. Efeito de digitação (somente textos verdadeiros sobre o Felipe)
   * ------------------------------------------------------------------ */
  function iniciarDigitacao() {
    const alvo = $('#typed');
    if (!alvo || reduzirMovimento) return;
    const frases = [
      'Desenvolvimento Web',
      'Estudante de Tecnologia da Informação',
      'HTML5 · CSS3 · JavaScript',
      'PHP · MySQL',
      'Aprendendo algo novo todos os dias'
    ];
    let frase = 0;
    let letra = frases[0].length;
    let apagando = true;

    function passo() {
      const atual = frases[frase];
      if (apagando) {
        letra--;
        alvo.textContent = atual.slice(0, letra);
        if (letra === 0) {
          apagando = false;
          frase = (frase + 1) % frases.length;
        }
        setTimeout(passo, 35);
      } else {
        const proxima = frases[frase];
        letra++;
        alvo.textContent = proxima.slice(0, letra);
        if (letra === proxima.length) {
          apagando = true;
          setTimeout(passo, 2200);
          return;
        }
        setTimeout(passo, 65);
      }
    }
    setTimeout(passo, 2600);
  }

  /* ------------------------------------------------------------------
   * 4. Carrossel do projeto em destaque
   * ------------------------------------------------------------------ */
  function iniciarCarrossel() {
    const carrossel = $('#pixelCarousel');
    if (!carrossel) return;
    const botoes = $$('.shots-nav button');
    carrossel.addEventListener('slide.bs.carousel', function (evento) {
      botoes.forEach(function (b, i) {
        const ativo = i === evento.to;
        b.classList.toggle('active', ativo);
        if (ativo) b.setAttribute('aria-current', 'true');
        else b.removeAttribute('aria-current');
      });
    });
  }

  /* ------------------------------------------------------------------
   * 5. Formulário de contato
   * ------------------------------------------------------------------ */
  function iniciarFormulario() {
    const form = $('#contactForm');
    if (!form) return;

    const campos = ['nome', 'email', 'assunto', 'mensagem'];
    const alerta = $('#formAlert');
    const botao = $('#submitBtn');
    const contador = $('#charCount');
    const textarea = $('#mensagem');
    const limite = PortfolioStorage.LIMITES.mensagem.max;
    let enviando = false;

    function lerDados() {
      const dados = {};
      campos.forEach(function (c) { dados[c] = form.elements[c].value; });
      return dados;
    }

    function mostrarErros(erros, somenteCampo) {
      campos.forEach(function (campo) {
        if (somenteCampo && somenteCampo !== campo) return;
        const input = form.elements[campo];
        const feedback = $('#' + campo + '-erro');
        if (erros[campo]) {
          input.classList.add('is-invalid');
          input.classList.remove('is-valid');
          input.setAttribute('aria-invalid', 'true');
          input.setAttribute('aria-describedby', campo + '-erro');
          feedback.textContent = erros[campo];
        } else {
          input.classList.remove('is-invalid');
          input.removeAttribute('aria-invalid');
          if (input.value.trim()) input.classList.add('is-valid');
          feedback.textContent = '';
        }
      });
    }

    function exibirAlerta(tipo, titulo, texto) {
      const icones = { success: 'bi-check-circle-fill', warning: 'bi-exclamation-triangle-fill', error: 'bi-x-circle-fill' };
      alerta.className = 'form-alert form-alert--' + tipo + ' show';
      alerta.innerHTML = '<i class="bi ' + icones[tipo] + '"></i><div><strong></strong><p></p></div>';
      alerta.querySelector('strong').textContent = titulo;
      alerta.querySelector('p').textContent = texto;
    }

    function esconderAlerta() {
      alerta.className = 'form-alert';
      alerta.innerHTML = '';
    }

    function carregando(ativo) {
      enviando = ativo;
      botao.disabled = ativo;
      $('.btn-label', botao).classList.toggle('d-none', ativo);
      $('.btn-loading', botao).classList.toggle('d-none', !ativo);
    }

    function atualizarContador() {
      const tamanho = textarea.value.length;
      contador.textContent = tamanho + ' / ' + limite;
      contador.classList.toggle('is-limit', tamanho > limite * 0.9);
    }

    // Validação em tempo real: depois que o campo foi tocado, revalida ao digitar
    campos.forEach(function (campo) {
      const input = form.elements[campo];
      input.addEventListener('blur', function () {
        if (input.value.trim() || input.dataset.tocado) {
          input.dataset.tocado = '1';
          mostrarErros(PortfolioStorage.validar(lerDados()), campo);
        }
      });
      input.addEventListener('input', function () {
        if (input.dataset.tocado || input.classList.contains('is-invalid')) {
          mostrarErros(PortfolioStorage.validar(lerDados()), campo);
        }
      });
    });
    textarea.addEventListener('input', atualizarContador);
    atualizarContador();

    form.addEventListener('submit', function (evento) {
      evento.preventDefault();
      if (enviando) return;
      esconderAlerta();

      // Honeypot: se o campo invisível foi preenchido, provavelmente é um robô
      if (form.elements.website.value) {
        exibirAlerta('success', 'Mensagem recebida!', 'Obrigado pelo contato.');
        form.reset();
        return;
      }

      const dados = lerDados();
      const erros = PortfolioStorage.validar(dados);
      campos.forEach(function (c) { form.elements[c].dataset.tocado = '1'; });
      mostrarErros(erros);

      if (Object.keys(erros).length > 0) {
        exibirAlerta('error', 'Verifique os campos destacados.', 'Todos os campos são obrigatórios e o e-mail precisa ter um formato válido.');
        const primeiro = form.elements[Object.keys(erros)[0]];
        primeiro.focus();
        return;
      }

      if (!PortfolioStorage.disponivel()) {
        exibirAlerta('error', 'Não foi possível salvar.', 'O armazenamento local está bloqueado neste navegador. Envie um e-mail para felipe.barsotti@gmail.com.');
        return;
      }

      carregando(true);

      // 1º passo: salva SEMPRE no LocalStorage (mesmo que o e-mail falhe depois)
      const registro = PortfolioStorage.criar({
        nome: dados.nome,
        email: dados.email,
        assunto: dados.assunto,
        mensagem: dados.mensagem,
        origem: 'formulario',
        emailStatus: 'pendente'
      });

      // 2º passo: tenta enviar a notificação por e-mail (EmailJS)
      PortfolioEmail.enviarNotificacao(registro)
        .then(function () {
          PortfolioStorage.atualizar(registro.id, { emailStatus: 'enviado' }, { silencioso: true });
          exibirAlerta('success', 'Mensagem enviada com sucesso!', 'Obrigado, ' + registro.nome.split(' ')[0] + '! Sua mensagem foi salva e eu fui notificado por e-mail. Responderei assim que possível.');
          form.reset();
          campos.forEach(function (c) {
            form.elements[c].classList.remove('is-valid', 'is-invalid');
            delete form.elements[c].dataset.tocado;
          });
          atualizarContador();
        })
        .catch(function (erro) {
          console.warn('[email] Falha no envio pelo EmailJS:', erro);
          PortfolioStorage.atualizar(registro.id, { emailStatus: 'falhou' }, { silencioso: true });
          // Mostra o motivo técnico devolvido pelo EmailJS (ajuda a corrigir a configuração)
          let detalhe = '';
          if (erro && (erro.status || erro.text)) detalhe = 'Erro ' + (erro.status || '') + ': ' + (erro.text || '');
          else if (erro && erro.message) detalhe = erro.message;
          exibirAlerta('warning', 'Mensagem salva, mas a notificação por e-mail falhou.',
            'Sua mensagem foi registrada com sucesso. Se preferir, escreva também para felipe.barsotti@gmail.com.' +
            (detalhe ? ' (Detalhe técnico: ' + detalhe + ')' : ''));
          form.reset();
          campos.forEach(function (c) {
            form.elements[c].classList.remove('is-valid', 'is-invalid');
            delete form.elements[c].dataset.tocado;
          });
          atualizarContador();
        })
        .finally(function () {
          carregando(false);
          alerta.scrollIntoView({ behavior: reduzirMovimento ? 'auto' : 'smooth', block: 'center' });
        });
    });
  }

  /* ------------------------------------------------------------------
   * 6. Acesso oculto ao painel administrativo
   *    - Digitar a palavra "admin" em qualquer lugar da página (fora de campos de texto)
   *    - Ou abrir a página com #admin no final do endereço (index.html#admin)
   *    - Ou acessar diretamente pages/admin.html
   * ------------------------------------------------------------------ */
  function iniciarAcessoAdmin() {
    const URL_ADMIN = 'pages/admin.html';
    const SEQUENCIA = 'admin';
    let digitado = '';

    if (window.location.hash === '#admin') {
      window.location.replace(URL_ADMIN);
      return;
    }
    window.addEventListener('hashchange', function () {
      if (window.location.hash === '#admin') window.location.href = URL_ADMIN;
    });

    document.addEventListener('keydown', function (evento) {
      const alvo = evento.target;
      const digitandoEmCampo = alvo && (alvo.tagName === 'INPUT' || alvo.tagName === 'TEXTAREA' || alvo.isContentEditable);
      if (digitandoEmCampo || evento.ctrlKey || evento.metaKey || evento.altKey) return;
      if (!evento.key || evento.key.length !== 1) return;

      digitado = (digitado + evento.key.toLowerCase()).slice(-SEQUENCIA.length);
      if (digitado === SEQUENCIA) {
        digitado = '';
        window.location.href = URL_ADMIN;
      }
    });
  }

  /* ------------------------------------------------------------------ */
  document.addEventListener('DOMContentLoaded', function () {
    const ano = $('#year');
    if (ano) ano.textContent = new Date().getFullYear();

    iniciarAcessoAdmin();
    iniciarNavbar();
    iniciarScrollspy();
    iniciarReveal();
    iniciarDigitacao();
    iniciarCarrossel();
    iniciarFormulario();
  });
})();
