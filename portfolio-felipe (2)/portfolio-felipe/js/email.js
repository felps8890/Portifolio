/**
 * email.js — Automação de notificação por e-mail com EmailJS
 * ----------------------------------------------------------
 * Por que EmailJS? Ele envia e-mails direto do navegador (client-side),
 * sem precisar de servidor ou backend, o que combina com um site estático
 * publicado no GitHub Pages. As credenciais abaixo são PÚBLICAS por natureza
 * (a Public Key foi feita para ficar no front-end); a proteção contra abuso
 * é feita no painel do EmailJS (domínios permitidos e limite de envios).
 *
 * Como trocar as credenciais: altere apenas o objeto EMAILJS_CONFIG.
 * Painel: https://dashboard.emailjs.com
 */
(function (global) {
  'use strict';

  const EMAILJS_CONFIG = {
    // Account → General → Public Key
    publicKey: 'GWH0I2bAlq5QRtU8D',
    // Email Services → Service ID
    serviceId: 'service_qgw1sh7',
    // Email Templates → Template ID
    templateId: 'template_f5q283m',
    // Destinatário das notificações (configure também no campo "To Email" do template)
    destinatario: 'felipe.barsotti@gmail.com'
  };

  let iniciado = false;

  /** Indica se a biblioteca foi carregada e as credenciais foram preenchidas. */
  function configurado() {
    return Boolean(
      global.emailjs &&
      EMAILJS_CONFIG.publicKey &&
      EMAILJS_CONFIG.serviceId &&
      EMAILJS_CONFIG.templateId
    );
  }

  function iniciar() {
    if (iniciado || !configurado()) return;
    global.emailjs.init({
      publicKey: EMAILJS_CONFIG.publicKey,
      // Evita abuso: no máximo 1 envio a cada 10 segundos por navegador.
      limitRate: { id: 'portfolio-felipe', throttle: 10000 }
    });
    iniciado = true;
  }

  /**
   * Envia a notificação de uma nova mensagem.
   * São enviados nomes de variáveis em dois padrões para funcionar tanto com
   * o template sugerido no README quanto com o template "Contact Us" padrão do EmailJS.
   * @param {Object} registro mensagem já salva no LocalStorage
   * @returns {Promise}
   */
  function enviarNotificacao(registro) {
    if (!configurado()) {
      return Promise.reject(new Error('EmailJS não configurado ou biblioteca não carregada.'));
    }
    iniciar();

    const dataFormatada = new Date(registro.data).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    });

    const parametros = {
      // Padrão sugerido no README
      from_name: registro.nome,
      from_email: registro.email,
      reply_to: registro.email,
      subject: registro.assunto,
      message: registro.mensagem,
      sent_at: dataFormatada,
      message_id: registro.id,
      to_email: EMAILJS_CONFIG.destinatario,
      // Compatibilidade com o template padrão "Contact Us" do EmailJS
      name: registro.nome,
      email: registro.email,
      title: registro.assunto,
      time: dataFormatada
    };

    return global.emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, parametros);
  }

  global.PortfolioEmail = {
    configurado: configurado,
    enviarNotificacao: enviarNotificacao
  };
})(window);
