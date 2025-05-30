Guia de Desenvolvimento da Aplicação
📌 Visão Geral
Aplicação de vitrine de vendas de itens raros (como Arcanas) com redirecionamento para o WhatsApp. Os administradores controlam tudo pelo painel de controle.
Usuários só visualizam os itens, filtram por categorias, veem ofertas, destaques e clicam para negociar via WhatsApp. Não há login para usuários comuns.

🧩 Tipos de Acesso
👑 Super Admin
Pode tudo que o Admin pode

Pode cadastrar, editar e excluir outros administradores

🛠️ Admin
Login via painel

Cadastrar, editar e excluir itens

Controlar estoque manual (+1/-1)

Cadastrar categorias

Cadastrar e editar tags coloridas (com escolha de cor)

Ativar/Desativar:

Destaque

Contador de estoque

Timer (com data/hora final)

Mostrar mesmo quando esgotado

👤 Usuário Comum (visitante)
Ver página inicial (com destaques)

Filtrar por categoria

Ver página individual de item

Usar busca

Ver contador/timer quando ativo

Redirecionado para WhatsApp ao clicar em “comprar”

Ver página "Sobre" e "FAQ"

🧱 Estrutura por Etapas
Etapa 1: Inicialização
 Criar repositório

 Configurar Supabase com PostgreSQL

 Criar estrutura base do projeto (Lovable.dev, TRAE)

Etapa 2: Banco de Dados (Supabase)
Tabelas:
items

categorias

tags_coloridas

admins

Etapa 3: Autenticação
 Criar login de admin/superadmin

 Painel acessível apenas via autenticação

 Rotas protegidas

Etapa 4: Painel de Controle
 CRUD de Itens

 CRUD de Categorias

 CRUD de Tags Coloridas

 Controle de estoque (±1)

 Ativar/Desativar destaque, contador, timer

 Upload de imagens

 Inserir link para WhatsApp

Etapa 5: Área Pública
 Página Inicial

Itens em destaque

Filtros por categoria

Busca

Timer, contador, tag colorida

 Página de Categorias

 Página individual do item

 Página "FAQ"

 Página "Sobre"

Etapa 6: Interface (UI/UX)
 Layout responsivo, clean e moderno

 Foco em clareza e usabilidade no painel

Etapa 7: Testes e Deploy
 Testes funcionais e de segurança

 Redirecionamento WhatsApp

 Integração Supabase + front-end

 Feedbacks visuais (loaders, erros)