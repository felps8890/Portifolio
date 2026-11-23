# Portfólio Web Dinâmico — Felipe Barsotti Prado de Carvalho

> Atividade Final do 4º Bimestre · Curso Técnico em Tecnologia da Informação · Turma **03TI3**

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Bootstrap](https://img.shields.io/badge/Bootstrap_5.3-7952B3?logo=bootstrap&logoColor=white)
![EmailJS](https://img.shields.io/badge/Automação-EmailJS-2f7bff)

---

## 1. Nome do projeto

**Portfólio Web Dinâmico — felipe.dev**

## 2. Descrição

Portfólio pessoal com visual *Dark Premium*, desenvolvido do zero com **HTML5, CSS3, JavaScript e Bootstrap**, sem construtores de sites e sem frameworks como React ou Vue. O site reúne:

| Seção | Conteúdo |
|---|---|
| **Apresentação pessoal** | Nome, foto, perfil profissional, hard skills, soft skills e experiência |
| **Áreas do Conhecimento** (4 seções) | Ciências Humanas, Ciências da Natureza, Matemática e Linguagens — como cada uma contribuiu para minha lógica de programação |
| **Tendências Tecnológicas** (4 seções) | Cibersegurança, Blockchain, Automação e Robótica, Edge Computing |
| **Galeria de Projetos** | Pixel Store em destaque (com capturas de tela reais) e os demais repositórios do GitHub |
| **Contato** | Formulário com validação, armazenamento em LocalStorage (JSON) e notificação por e-mail via EmailJS |
| **Painel administrativo oculto** | CRUD completo das mensagens, dashboard, busca, filtros e exportação em JSON |

## 3. Objetivo

Demonstrar, como em um processo seletivo para desenvolvedor Frontend, domínio em:

- construção de interfaces responsivas (*Mobile First*);
- manipulação de dados no lado do cliente (*client-side*) com a API **LocalStorage** e o formato **JSON**;
- integração com um serviço de **automação** (EmailJS) para notificação real por e-mail.

## 4. Tecnologias utilizadas

| Tecnologia | Uso no projeto |
|---|---|
| **HTML5** | Estrutura semântica (`header`, `nav`, `main`, `section`, `article`, `figure`, `footer`), formulários e SVGs |
| **CSS3** | Variáveis CSS, **Flexbox**, **CSS Grid**, **Media Queries** (Mobile First), animações, glassmorphism |
| **JavaScript (ES6)** | Validação, LocalStorage, JSON, CRUD, filtros, paginação, animações com `IntersectionObserver` |
| **Bootstrap 5.3.3** | Grid responsivo, navbar/offcanvas, dropdowns, carrossel, modais e toasts |
| **Bootstrap Icons 1.11.3** | Ícones da interface |
| **EmailJS (@emailjs/browser 4)** | Automação do envio de notificações por e-mail |
| Fontes Inter, Space Grotesk e JetBrains Mono | Tipografia (arquivos locais, licença OFL) |

> Todas as bibliotecas estão **dentro do projeto** (`assets/vendor/`), então o site funciona mesmo sem internet — apenas o envio de e-mail precisa de conexão.

## 5. Estrutura de pastas

```
portfolio-felipe/
├── index.html                 # Página pública (todas as seções)
├── README.md                  # Esta documentação
├── css/
│   ├── style.css              # Estilos do site (Mobile First)
│   └── admin.css              # Estilos do painel administrativo
├── js/
│   ├── storage.js             # Camada de dados: LocalStorage + JSON + 20 registros de teste
│   ├── email.js               # Integração com EmailJS (credenciais aqui)
│   ├── main.js                # Interações da página e formulário de contato
│   └── admin.js               # Painel administrativo (CRUD)
├── pages/
│   └── admin.html             # Painel administrativo oculto
└── assets/
    ├── images/
    │   ├── felipe.jpg         # Minha foto
    │   └── projetos/          # Capturas de tela reais do Pixel Store
    ├── icons/
    │   └── favicon.svg
    └── vendor/                # Bootstrap, Bootstrap Icons, EmailJS e fontes (locais)
```

## 6. Como executar localmente

O projeto é 100% estático — não precisa instalar nada.

**Opção A — abrir direto:** dê dois cliques em `index.html`.

**Opção B — servidor local (recomendado):**

- **VS Code:** instale a extensão *Live Server*, clique com o botão direito em `index.html` → **Open with Live Server**.
- **Python:** dentro da pasta do projeto, rode `python -m http.server 8080` e acesse `http://localhost:8080`.

> O LocalStorage é separado por origem (endereço). Se você abrir pelo arquivo e depois pelo Live Server, cada um terá seus próprios dados — isso é normal.

## 7. Como configurar o EmailJS

### Por que o EmailJS? (Etapa 2.2)

O site é **estático** (sem servidor/back-end) e será publicado no **GitHub Pages**, que não executa PHP nem Node.js. O **EmailJS** resolve isso: ele envia e-mails **direto do navegador** por meio de uma API, usando um serviço de e-mail conectado (como o Gmail). Os motivos da escolha:

- **Não exige back-end** — combina com HTML + CSS + JS puros;
- **Notificação real** chega na caixa de entrada (`felipe.barsotti@gmail.com`);
- **Plano gratuito** suficiente para o projeto (200 e-mails/mês);
- **Template configurável** no painel, sem alterar o código;
- **Proteções no painel**: limite de envios e lista de domínios permitidos.

A Public Key do EmailJS foi feita para ficar no front-end (não é uma senha). Mesmo assim, recomenda-se restringir os domínios permitidos no painel.

### Credenciais usadas

Ficam em `js/email.js`, no objeto `EMAILJS_CONFIG`:

```js
const EMAILJS_CONFIG = {
  publicKey:  'GWH0I2bAlq5QRtU8D',   // Account → General → Public Key
  serviceId:  'service_qgw1sh7',     // Email Services → Service ID
  templateId: 'template_f5q283m',    // Email Templates → Template ID
  destinatario: 'felipe.barsotti@gmail.com'
};
```

### Passo a passo no painel (https://dashboard.emailjs.com)

1. **Conta:** crie/acesse sua conta no EmailJS.
2. **Email Services → Add New Service → Gmail:** conecte `felipe.barsotti@gmail.com`. Copie o **Service ID**.
3. **Email Templates → Create New Template** e preencha:
   - **Subject:** `Nova mensagem do portfólio: {{subject}}`
   - **To Email:** `felipe.barsotti@gmail.com`
   - **From Name:** `{{from_name}}`
   - **Reply To:** `{{reply_to}}`
   - **Content:**
     ```
     Você recebeu uma nova mensagem pelo portfólio.

     Nome: {{from_name}}
     E-mail: {{from_email}}
     Assunto: {{subject}}
     Data: {{sent_at}}

     Mensagem:
     {{message}}

     ID do registro: {{message_id}}
     ```
   Salve e copie o **Template ID**.
4. **Account → General:** copie a **Public Key**.
5. (Recomendado) **Account → Security:** em *Allowed origins/domains*, adicione o endereço do GitHub Pages (ex.: `https://felps8890.github.io`) e `http://localhost`/`http://127.0.0.1` para testes.
6. Cole os três valores em `js/email.js` e teste enviando o formulário.

> **Compatibilidade:** o código também envia as variáveis `{{name}}`, `{{email}}`, `{{title}}` e `{{time}}`, usadas no template padrão *Contact Us* do EmailJS. Assim, o template já existente também funciona.

### Variáveis enviadas ao template

| Variável | Conteúdo |
|---|---|
| `from_name` / `name` | Nome do visitante |
| `from_email` / `email` / `reply_to` | E-mail do visitante |
| `subject` / `title` | Assunto |
| `message` | Mensagem |
| `sent_at` / `time` | Data e hora do envio |
| `message_id` | ID do registro no LocalStorage |
| `to_email` | E-mail de destino |

### Status do teste

As credenciais já estão configuradas no código. Durante o desenvolvimento, o ambiente usado **não tinha acesso de rede ao servidor do EmailJS**, então o envio real **ainda precisa ser confirmado no seu navegador**: envie uma mensagem pelo formulário e verifique a caixa de entrada (e o spam). Se o envio falhar, a mensagem continua salva no LocalStorage e o painel mostra o status “Falha no envio do e-mail”.

## 8. Como funciona o armazenamento (LocalStorage + JSON)

- Todas as mensagens ficam em **uma única chave** do LocalStorage: `portfolioFelipe.mensagens`.
- O valor é um **array de objetos convertido para JSON** com `JSON.stringify()` e lido de volta com `JSON.parse()` (arquivo `js/storage.js`).
- Formato de cada registro:

```json
{
  "id": "msg_9f3a1c2bm3x8k1",
  "nome": "Ana Beatriz Souza",
  "email": "ana.souza@exemplo.com",
  "assunto": "Oportunidade de estágio em Frontend",
  "mensagem": "Olá, Felipe! ...",
  "data": "2026-11-20T14:32:00.000Z",
  "atualizadoEm": null,
  "status": "nova | lida | respondida",
  "origem": "formulario | admin | teste",
  "emailStatus": "enviado | falhou | pendente | nao-aplicavel"
}
```

**Fluxo do formulário de contato:**

1. Valida os campos (todos obrigatórios; e-mail com formato válido; limites de tamanho).
2. **Salva primeiro no LocalStorage** — a mensagem nunca se perde.
3. Tenta enviar a notificação pelo **EmailJS**.
4. Atualiza o campo `emailStatus` para `enviado` ou `falhou` e mostra a mensagem de sucesso ou de aviso.

Para ver os dados “crus”: **F12 → Application (Aplicativo) → Local Storage →** o endereço do site → `portfolioFelipe.mensagens`. No painel administrativo também há os botões **Ver JSON** e **Exportar JSON**.

## 9. Como acessar o painel administrativo oculto

Não existe botão de admin na página pública. Há três formas de acesso:

| Forma | Como fazer |
|---|---|
| **Atalho secreto** | Com a página inicial aberta (fora dos campos do formulário), digite as letras **`admin`** no teclado |
| **Rota com hash** | Acesse `index.html#admin` |
| **Rota direta** | Acesse `pages/admin.html` |

**Senha de acesso:** `felipe@03TI3`

> ⚠️ **Aviso de segurança:** a senha está escrita no JavaScript (`js/admin.js`), então qualquer pessoa que abrir o código pode lê-la. Isso **não é proteção real** e não deve ser usado em produção. Aqui ela atende apenas ao requisito acadêmico de “acesso oculto”. Em um sistema real, a autenticação seria feita em um servidor, com senhas armazenadas como *hash*. A sessão dura até fechar a aba (`sessionStorage`); use **Sair** para encerrar antes.

## 10. Como testar o CRUD

Depois de entrar no painel:

| Operação | Como testar |
|---|---|
| **CREATE** | Clique em **Nova mensagem**, preencha os campos e clique em **Salvar**. Teste também salvar com campos vazios ou e-mail inválido — o painel bloqueia. Mensagens enviadas pelo formulário do site também são criações. |
| **READ** | Veja o **dashboard** (total, não lidas, últimos 7 dias, enviadas pelo formulário, gráficos por status/origem), as **mensagens recentes** e a **tabela**. Clique no ícone 👁 (ou dê duplo clique na linha) para abrir o **modal de detalhes** com nome, e-mail, assunto, mensagem e data. |
| **UPDATE** | Clique no ícone ✏️ para editar qualquer campo, ou mude o **status** direto no modal de detalhes. Abrir uma mensagem “nova” a marca como “lida”. |
| **DELETE** | Clique no ícone 🗑. Um **modal de confirmação** aparece antes de excluir. |
| **Busca e filtros** | Pesquise por nome, e-mail, assunto ou texto; filtre por status, origem e período; ordene por data ou nome. |
| **Feedback** | Todas as operações exibem notificações (toasts). |

Dica: deixe o site em uma aba e o painel em outra. Ao enviar o formulário, o painel se atualiza sozinho.

## 11. Como funcionam os 20 registros automáticos

Implementado em `PortfolioStorage.inicializar()` (`js/storage.js`), executado sempre que o site ou o painel é carregado:

1. Verifica se a chave `portfolioFelipe.mensagens` **existe** no LocalStorage.
2. Se **não existir** (primeiro acesso), cria **20 registros de teste** com nomes e e-mails fictícios (`@exemplo.com`), assuntos e mensagens variados, **IDs únicos**, status variados e **datas coerentes** (espalhadas pelos últimos ~40 dias, sempre no passado).
3. Se **já existir** qualquer dado, **nada é inserido** — os registros não se duplicam ao recarregar a página.

Para refazer o teste do primeiro acesso:
- no painel, clique em **Restaurar 20 registros**; **ou**
- no navegador, apague a chave em **F12 → Application → Local Storage** (ou rode `localStorage.clear()` no Console) e recarregue a página.

## 12. Link do repositório

- **Repositório do portfólio:** `https://github.com/felps8890/portfolio-felipe` *(após publicar)*
- **Site publicado (GitHub Pages):** `https://felps8890.github.io/portfolio-felipe/` *(após ativar o Pages)*
- **Perfil no GitHub:** https://github.com/felps8890
- **Projeto em destaque — Pixel Store:** https://github.com/felps8890/Pixel-store

---

## Publicar no GitHub

**Pelo site do GitHub (sem terminal):**

1. Acesse https://github.com/new, nomeie o repositório `portfolio-felipe`, deixe **Public** e clique em **Create repository**.
2. Clique em **uploading an existing file** e arraste **o conteúdo** da pasta `portfolio-felipe` (o `index.html` precisa ficar na raiz do repositório).
3. Clique em **Commit changes**.

**Pelo terminal (Git):**

```bash
cd portfolio-felipe
git init
git add .
git commit -m "Portfólio Web Dinâmico - Atividade Final 4º Bimestre"
git branch -M main
git remote add origin https://github.com/felps8890/portfolio-felipe.git
git push -u origin main
```

**Ativar o GitHub Pages:** no repositório, vá em **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / `(root)` → Save**. Em 1–2 minutos o site estará em `https://felps8890.github.io/portfolio-felipe/`. Depois, adicione esse domínio nas origens permitidas do EmailJS.

## Entregar pelo Microsoft Teams

1. Abra o **Teams → Equipes →** turma **03TI3 → Tarefas** e abra a *Atividade Final do 4º Bimestre*.
2. Clique em **+ Adicionar trabalho → Carregar deste dispositivo** e anexe o arquivo **`portfolio-felipe.zip`** (backup da versão final).
3. Clique em **+ Adicionar trabalho → Link** e cole o link do **repositório no GitHub** (e, se quiser, o link do **GitHub Pages**).
4. Clique em **Entregar** e confira se o status mudou para “Entregue”.

## Testes realizados

- [x] Todas as seções obrigatórias do PDF presentes (apresentação, 4 áreas, 4 tendências, projetos, contato).
- [x] 20 registros criados no primeiro acesso, com IDs únicos e datas no passado; sem duplicação ao recarregar.
- [x] Formulário bloqueia campos vazios e e-mail inválido; mensagens de erro por campo.
- [x] Mensagem salva no LocalStorage mesmo quando o envio de e-mail falha (aviso exibido).
- [x] Painel: login, CREATE, READ (modal), UPDATE, DELETE com confirmação, busca, filtros, paginação, JSON.
- [x] Conteúdo das mensagens é escapado (proteção contra XSS na tabela e nos modais).
- [x] Acesso oculto pelo atalho `admin`, por `#admin` e pela rota direta.
- [x] Sem rolagem horizontal em 320 px, 390 px, 768 px, 820 px, 1280 px e 1440 px.
- [x] Nenhum erro de JavaScript no console.
- [ ] Envio real pelo EmailJS — **confirmar no navegador** (ver seção 7).

---

Desenvolvido por **Felipe Barsotti Prado de Carvalho** · Turma 03TI3 · felipe.barsotti@gmail.com
