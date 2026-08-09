# TROPICANA — Sistema de Gestão do Complexo

Protótipo navegável de alta fidelidade para apresentação ao cliente, construído em **HTML5 + CSS3 + JavaScript puro (Vanilla JS)**, sem frameworks de frontend. Os dados são fictícios e persistem no `localStorage` do navegador, simulando um backend real.

> Este é um protótipo de demonstração. Não há servidor, base de dados ou API — tudo funciona localmente no navegador.

---

## Como executar

Não é necessário instalar nada nem correr um servidor.

1. Descarregue ou extraia a pasta `tropicana/`.
2. Abra o ficheiro `index.html` diretamente no navegador (duplo clique, ou "Abrir com" → navegador).
3. Pronto — o sistema carrega e gera automaticamente os dados de demonstração na primeira utilização.

Funciona em Chrome, Edge, Firefox e Safari (desktop, tablet e telemóvel).

---

## Contas de demonstração

A senha é **`123456`** para todas as contas.

| Perfil | Email |
|---|---|
| Gestor | `admin@tropicana.co.mz` |
| Barman | `barman@tropicana.co.mz` |
| Recepcionista | `recepcao@tropicana.co.mz` |

Na página de login existem botões de acesso rápido que preenchem estas credenciais automaticamente.

---

## Estrutura do projeto

```
tropicana/
│
├── index.html          # Estrutura da aplicação (login + shell do sistema)
├── README.md            # Este ficheiro
├── css/
│   └── style.css         # Todo o design: cores, tipografia, layout, responsividade
├── js/
│   ├── data.js            # Geração de dados fictícios + camada de persistência (localStorage)
│   ├── charts.js           # Funções de renderização dos gráficos (Chart.js)
│   └── app.js               # Lógica da aplicação: login, routing, permissões, CRUD, UI
└── assets/                 # Reservado para imagens/ícones adicionais
```

---

## Perfis de acesso

O menu lateral e as permissões mudam automaticamente conforme o perfil autenticado.

**Gestor** — acesso total: usuários, produtos, estoque, vendas, quartos, reservas, cozinha, refeições, despesas, lucros, relatórios e configurações.

**Barman** — dashboard simplificado, vendas (POS), consulta de produtos e estoque, minhas vendas, recibos e perfil. Não pode editar produtos nem gerir usuários.

**Recepcionista** — dashboard simplificado, acomodação, quartos, reservas, check-in/check-out, clientes, recibos e perfil. Não acede a informação financeira nem gere produtos.

---

## Funcionalidades incluídas

- Dashboard com indicadores, 4 gráficos (Chart.js) e tabelas de últimas vendas
- Vendas do bar em interface POS (categorias, carrinho, formas de pagamento, recibo)
- Gestão de produtos e categorias, com pesquisa e filtros
- Estoque com registo de entradas, saídas e alertas de estoque baixo
- Gestão de quartos, reservas, check-in, check-out e prolongamento de estadia
- Cozinha e registo de refeições vendidas
- Despesas, lucros e relatórios com filtros por período
- Gestão de clientes com histórico de hospedagem
- Gestão de usuários (Gestor)
- Notificações, toasts, modais de confirmação e recibos com aparência profissional
- Totalmente responsivo (sidebar recolhível em telemóvel)

---

## Sobre os dados

Todos os nomes, valores e datas são fictícios, gerados automaticamente em `js/data.js` na primeira abertura do sistema (moeda em **MT**, datas de 2026). Os dados ficam guardados no `localStorage` do navegador — ou seja, permanecem entre sessões no mesmo computador/navegador, mas não são partilhados entre dispositivos.

Para repor os dados ao estado inicial, aceda a **Configurações → Repor dados de demonstração** (perfil Gestor).

---

## Aviso importante

Este protótipo serve **apenas para apresentação e validação de interface/fluxos** junto do cliente, antes do desenvolvimento do sistema real. Funcionalidades como impressão, exportação para PDF/Excel e edição de configurações mostram uma notificação a indicar que serão implementadas na versão final — não é um sistema em produção e não deve ser usado com dados reais de clientes ou operações.