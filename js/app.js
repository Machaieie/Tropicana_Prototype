/* ==========================================================================
   TROPICANA — app.js
   Aplicação principal: autenticação, routing, permissões, renderização
   ========================================================================== */

let DB = null;
let session = null;
let cart = [];
let posCategoria = 'Todas';
let currentSection = 'dashboard';
let currentRoomFilter = 'Todos';

const SESSION_KEY = 'tropicana_session';

/* ---------------- ícones ---------------- */
function ic(name, cls) { return `<i data-lucide="${name}" class="${cls || ''}"></i>`; }
function icons() { if (window.lucide) lucide.createIcons(); }

/* ---------------- itens de navegação ---------------- */
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard', group: 'Principal', roles: ['Gestor', 'Barman', 'Recepcionista'] },
  { id: 'vendas', label: 'Vendas', icon: 'shopping-cart', group: 'Operações', roles: ['Gestor', 'Barman'] },
  { id: 'acomodacao', label: 'Acomodação', icon: 'bed-double', group: 'Operações', roles: ['Gestor', 'Recepcionista'] },
  { id: 'reservas', label: 'Reservas', icon: 'calendar-check', group: 'Operações', roles: ['Gestor', 'Recepcionista'] },
  { id: 'cozinha', label: 'Cozinha', icon: 'chef-hat', group: 'Operações', roles: ['Gestor'] },
  { id: 'refeicoes', label: 'Refeições', icon: 'utensils', group: 'Operações', roles: ['Gestor'] },
  { id: 'estoque', label: 'Estoque', icon: 'boxes', group: 'Operações', roles: ['Gestor', 'Barman'] },
  { id: 'produtos', label: 'Produtos', icon: 'package', group: 'Gestão', roles: ['Gestor', 'Barman'] },
  { id: 'clientes', label: 'Clientes', icon: 'users', group: 'Gestão', roles: ['Gestor', 'Recepcionista'] },
  { id: 'usuarios', label: 'Usuários', icon: 'user-cog', group: 'Gestão', roles: ['Gestor'] },
  { id: 'quartos', label: 'Quartos', icon: 'door-open', group: 'Gestão', roles: ['Gestor'] },
  { id: 'despesas', label: 'Despesas', icon: 'wallet', group: 'Financeiro', roles: ['Gestor'] },
  { id: 'lucros', label: 'Lucros', icon: 'piggy-bank', group: 'Financeiro', roles: ['Gestor'] },
  { id: 'rel-vendas', label: 'Relatório de vendas', icon: 'bar-chart-3', group: 'Relatórios', roles: ['Gestor'] },
  { id: 'rel-acomodacao', label: 'Relatório de acomodação', icon: 'file-text', group: 'Relatórios', roles: ['Gestor'] },
  { id: 'configuracoes', label: 'Configurações', icon: 'settings', group: 'Sistema', roles: ['Gestor'] },
  { id: 'perfil', label: 'Meu perfil', icon: 'user', group: 'Sistema', roles: ['Gestor', 'Barman', 'Recepcionista'] }
];

const TITLES = {
  dashboard: 'Dashboard', vendas: 'Vendas', acomodacao: 'Acomodação', reservas: 'Reservas',
  cozinha: 'Cozinha', refeicoes: 'Refeições vendidas', estoque: 'Estoque', produtos: 'Produtos',
  clientes: 'Clientes', usuarios: 'Usuários', quartos: 'Quartos', despesas: 'Despesas',
  lucros: 'Lucros', 'rel-vendas': 'Relatório de vendas', 'rel-acomodacao': 'Relatório de acomodação',
  configuracoes: 'Configurações', perfil: 'Meu perfil'
};

/* ==========================================================================
   INICIALIZAÇÃO / LOGIN
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  DB = getDB();
  const savedSession = localStorage.getItem(SESSION_KEY);
  if (savedSession) {
    session = JSON.parse(savedSession);
    startApp();
  }
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
});

function fillLogin(email, pass) {
  document.getElementById('loginEmail').value = email;
  document.getElementById('loginPass').value = pass;
}

function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const pass = document.getElementById('loginPass').value.trim();
  const err = document.getElementById('loginError');
  const user = DB.usuarios.find(u => u.email.toLowerCase() === email);
  if (!user || pass !== '123456' || user.estado !== 'Ativo') {
    err.textContent = !user ? 'Credenciais inválidas. Verifique o email e a senha.' :
      user.estado !== 'Ativo' ? 'Este utilizador está inativo. Contacte o administrador.' :
      'Credenciais inválidas. Verifique o email e a senha.';
    err.style.display = 'block';
    return;
  }
  user.ultimoAcesso = new Date().toISOString();
  saveDB(DB);
  session = { id: user.id, nome: user.nome, email: user.email, perfil: user.perfil };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  startApp();
}

function logout() {
  localStorage.removeItem(SESSION_KEY);
  session = null;
  document.getElementById('appShell').classList.remove('active');
  document.getElementById('loginScreen').style.display = 'grid';
  document.getElementById('loginForm').reset();
  document.getElementById('loginError').style.display = 'none';
}

function startApp() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('appShell').classList.add('active');
  buildSidebar();
  const who = document.getElementById('sidebarUser');
  who.querySelector('.avatar').textContent = session.nome.split(' ').map(n => n[0]).slice(0, 2).join('');
  who.querySelector('b').textContent = session.nome;
  who.querySelector('span').textContent = session.perfil;
  renderNotifDropdown();
  navigate('dashboard');
}

/* ==========================================================================
   SIDEBAR / NAVEGAÇÃO
   ========================================================================== */
function buildSidebar() {
  const groups = {};
  NAV_ITEMS.filter(i => i.roles.includes(session.perfil)).forEach(i => {
    groups[i.group] = groups[i.group] || [];
    groups[i.group].push(i);
  });
  let html = '';
  Object.keys(groups).forEach(g => {
    html += `<div class="nav-group"><div class="nav-group-label">${g}</div>`;
    groups[g].forEach(i => {
      html += `<div class="nav-item" data-nav="${i.id}" onclick="navigate('${i.id}')">${ic(i.icon)}<span>${i.label}</span></div>`;
    });
    html += `</div>`;
  });
  document.getElementById('sidebarNav').innerHTML = html;
  icons();
}

function navigate(section) {
  currentSection = section;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.nav === section));
  document.getElementById('pageTitle').textContent = TITLES[section] || 'Tropicana';
  closeSidebarMobile();
  const renderers = {
    dashboard: renderDashboard, vendas: renderVendas, acomodacao: renderAcomodacao,
    reservas: renderReservas, cozinha: renderCozinha, refeicoes: renderRefeicoes,
    estoque: renderEstoque, produtos: renderProdutos, clientes: renderClientes,
    usuarios: renderUsuarios, quartos: renderQuartos, despesas: renderDespesas,
    lucros: renderLucros, 'rel-vendas': renderRelVendas, 'rel-acomodacao': renderRelAcomodacao,
    configuracoes: renderConfiguracoes, perfil: renderPerfil
  };
  (renderers[section] || renderDashboard)();
  window.scrollTo(0, 0);
  document.getElementById('content').scrollTop = 0;
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('open');
}
function closeSidebarMobile() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('open');
}

function can(action) {
  const p = session.perfil;
  const rules = {
    editProdutos: ['Gestor'], gerenciarUsuarios: ['Gestor'], gerenciarQuartos: ['Gestor'],
    verFinanceiro: ['Gestor'], gerenciarEstoque: ['Gestor', 'Barman']
  };
  return (rules[action] || ['Gestor']).includes(p);
}

/* ==========================================================================
   TOASTS / MODAL / CONFIRM
   ========================================================================== */
function showToast(msg, type = 'success') {
  const stack = document.getElementById('toastStack');
  const iconMap = { success: 'check-circle-2', error: 'x-circle', info: 'info' };
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = `${ic(iconMap[type] || 'check-circle-2')}<span>${msg}</span>`;
  stack.appendChild(el);
  icons();
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 300); }, 3200);
}

function notImplemented(feature) {
  showToast(`"${feature}" será implementada na versão final do sistema.`, 'info');
}

function openModal(title, bodyHtml, footHtml, wide = false) {
  const overlay = document.getElementById('modalOverlay');
  overlay.innerHTML = `
    <div class="modal-box ${wide ? 'wide' : ''}">
      <div class="modal-head"><h3>${title}</h3><button class="modal-close" onclick="closeModal()">${ic('x')}</button></div>
      <div class="modal-body">${bodyHtml}</div>
      ${footHtml ? `<div class="modal-foot">${footHtml}</div>` : ''}
    </div>`;
  overlay.classList.add('open');
  icons();
}
function closeModal() { document.getElementById('modalOverlay').classList.remove('open'); document.getElementById('modalOverlay').innerHTML = ''; }

function confirmAction(msg, onYes) {
  openModal('Confirmar ação', `
    <div class="confirm-box">
      <div class="warn-icon">${ic('alert-triangle')}</div>
      <p>${msg}</p>
    </div>`,
    `<button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>
     <button class="btn btn-danger" id="confirmYesBtn">Confirmar</button>`);
  document.getElementById('confirmYesBtn').onclick = () => { onYes(); closeModal(); };
}

/* ==========================================================================
   TOPBAR — NOTIFICAÇÕES
   ========================================================================== */
function renderNotifDropdown() {
  const colorMap = { danger: 'var(--vermelho)', warning: 'var(--dourado)', success: 'var(--verde)', info: 'var(--azul)' };
  const html = DB.notificacoes.map(n => `
    <div class="notif-item">
      <div class="notif-dot" style="background:${colorMap[n.tipo]}"></div>
      <div class="txt">${n.texto}<small>${fmtDateTime(n.data)}</small></div>
    </div>`).join('') || `<div class="notif-item">Sem notificações novas.</div>`;
  document.getElementById('notifList').innerHTML = html;
  document.getElementById('notifCount').classList.toggle('hidden', DB.notificacoes.length === 0);
}
function toggleNotifDropdown() { document.getElementById('notifDropdown').classList.toggle('open'); }
function pushNotif(tipo, texto) {
  DB.notificacoes.unshift({ tipo, texto, data: new Date().toISOString() });
  DB.notificacoes = DB.notificacoes.slice(0, 8);
  saveDB(DB);
  renderNotifDropdown();
}

document.addEventListener('click', (e) => {
  const dd = document.getElementById('notifDropdown');
  const btn = document.getElementById('notifBtn');
  if (dd && !dd.contains(e.target) && btn && !btn.contains(e.target)) dd.classList.remove('open');
});

/* ==========================================================================
   DASHBOARD
   ========================================================================== */
function renderDashboard() {
  const hoje = new Date(2026, 7, 8).toDateString();
  const vendasHoje = DB.vendas.filter(v => new Date(v.data).toDateString() === hoje && v.status === 'Concluída');
  const totalHoje = vendasHoje.reduce((s, v) => s + v.total, 0);
  const receitaMes = DB.vendas.filter(v => v.status === 'Concluída').reduce((s, v) => s + v.total, 0)
    + DB.reservas.filter(r => r.estado !== 'Cancelada').reduce((s, r) => s + r.valor, 0)
    + DB.refeicoes.reduce((s, r) => s + r.total, 0);
  const despesasMes = DB.despesas.reduce((s, d) => s + d.valor, 0);
  const lucroMes = receitaMes - despesasMes;
  const ocupados = DB.quartos.filter(q => q.estado === 'Ocupado').length;
  const disponiveis = DB.quartos.filter(q => q.estado === 'Livre').length;
  const clientesHoje = new Set(DB.reservas.filter(r => new Date(r.entrada).toDateString() === hoje).map(r => r.cliente)).size;
  const estoqueBaixo = DB.produtos.filter(p => p.estado !== 'Disponível').length;

  const cardsGestor = `
    <div class="grid g-4">
      ${statCard('Vendas hoje', fmtMoney(totalHoje), 'shopping-bag', 'verde', '+' + vendasHoje.length + ' transações')}
      ${statCard('Receita mensal', fmtMoney(receitaMes), 'trending-up', 'dourado', 'Todas as áreas')}
      ${statCard('Lucro mensal', fmtMoney(lucroMes), 'piggy-bank', 'azul', lucroMes >= 0 ? 'Resultado positivo' : 'Resultado negativo', lucroMes >= 0)}
      ${statCard('Despesas', fmtMoney(despesasMes), 'wallet', 'vermelho', DB.despesas.length + ' lançamentos')}
    </div>
    <div class="grid g-4 mt-16">
      ${statCard('Quartos ocupados', ocupados, 'bed-double', 'vermelho', DB.quartos.length + ' quartos no total')}
      ${statCard('Quartos disponíveis', disponiveis, 'door-open', 'verde', 'Prontos para reserva')}
      ${statCard('Clientes hoje', clientesHoje, 'users', 'azul', 'Check-ins do dia')}
      ${statCard('Estoque baixo', estoqueBaixo, 'alert-triangle', 'dourado', 'Produtos a repor')}
    </div>`;

  const cardsSimples = `
    <div class="grid g-3">
      ${statCard(session.perfil === 'Barman' ? 'Vendas hoje' : 'Check-ins hoje', session.perfil === 'Barman' ? fmtMoney(totalHoje) : clientesHoje, session.perfil === 'Barman' ? 'shopping-bag' : 'log-in', 'verde')}
      ${statCard(session.perfil === 'Barman' ? 'Transações hoje' : 'Quartos ocupados', session.perfil === 'Barman' ? vendasHoje.length : ocupados, session.perfil === 'Barman' ? 'receipt' : 'bed-double', 'dourado')}
      ${statCard(session.perfil === 'Barman' ? 'Produtos c/ estoque baixo' : 'Quartos disponíveis', session.perfil === 'Barman' ? estoqueBaixo : disponiveis, session.perfil === 'Barman' ? 'boxes' : 'door-open', 'azul')}
    </div>`;

  document.getElementById('content').innerHTML = `
    <div class="card" style="background:linear-gradient(120deg,#0B4A33,#0F8C5A); color:#fff; margin-bottom:22px;">
      <h1 class="display" style="color:#fff; font-size:1.6rem;">Bom dia, ${session.nome.split(' ')[0]} 👋</h1>
      <p style="color:rgba(255,255,255,0.8); margin-top:6px; font-size:0.9rem;">Aqui está o resumo do Complexo Tropicana — ${fmtDate(new Date(2026, 7, 8).toISOString())}.</p>
    </div>
    ${session.perfil === 'Gestor' ? cardsGestor : cardsSimples}
    ${session.perfil === 'Gestor' ? `
    <div class="grid g-2 mt-24">
      <div class="card chart-card"><div class="card-title">Vendas dos últimos 7 dias</div><div class="card-sub">Receita diária do bar</div><canvas id="chVendas7"></canvas></div>
      <div class="card chart-card"><div class="card-title">Receitas por área</div><div class="card-sub">Distribuição por unidade de negócio</div><canvas id="chAreas"></canvas></div>
    </div>
    <div class="grid g-2 mt-16">
      <div class="card chart-card"><div class="card-title">Formas de pagamento</div><div class="card-sub">Volume por método</div><canvas id="chPagamento"></canvas></div>
      <div class="card chart-card"><div class="card-title">Produtos mais vendidos</div><div class="card-sub">Top 6 do mês</div><canvas id="chProdutos"></canvas></div>
    </div>` : ''}
    <div class="section-head"><h2>${session.perfil === 'Barman' ? 'Minhas últimas vendas' : 'Últimas vendas'}</h2>
      ${session.perfil !== 'Recepcionista' ? `<div class="actions"><button class="btn btn-primary btn-sm" onclick="navigate('vendas')">${ic('plus')} Nova venda</button></div>` : ''}
    </div>
    ${tableUltimasVendas()}
    ${session.perfil === 'Gestor' ? `
    <div class="section-head"><h2>Quartos ocupados</h2><div class="actions"><button class="btn btn-ghost btn-sm" onclick="navigate('quartos')">Ver todos</button></div></div>
    <div class="grid g-4">${DB.quartos.filter(q => q.estado === 'Ocupado').slice(0, 4).map(roomCard).join('') || emptyState('bed', 'Sem quartos ocupados', 'Todos os quartos estão livres neste momento.')}</div>
    <div class="section-head"><h2>Alertas de estoque</h2><div class="actions"><button class="btn btn-ghost btn-sm" onclick="navigate('estoque')">Ver estoque</button></div></div>
    ${tableAlertasEstoque()}` : ''}
  `;
  icons();
  if (session.perfil === 'Gestor') {
    renderVendas7Dias('chVendas7', DB);
    renderReceitasPorArea('chAreas', DB);
    renderFormasPagamento('chPagamento', DB);
    renderProdutosMaisVendidos('chProdutos', DB);
  }
}

function statCard(label, value, icon, color, trendTxt, isUp = true) {
  return `<div class="card stat-card">
    <div class="icon-box bg-${color}">${ic(icon)}</div>
    <div class="label">${label}</div>
    <div class="value">${typeof value === 'number' ? value : value}</div>
    ${trendTxt ? `<div class="trend ${isUp ? 'up' : 'down'}">${ic(isUp ? 'arrow-up-right' : 'arrow-down-right')} ${trendTxt}</div>` : ''}
  </div>`;
}

function tableUltimasVendas() {
  let vendas = DB.vendas.slice(0, 8);
  if (session.perfil === 'Barman') vendas = DB.vendas.filter(v => v.operador === session.nome).slice(0, 8);
  if (!vendas.length) return emptyState('receipt', 'Sem vendas registadas', 'As vendas realizadas aparecerão aqui.');
  return `<div class="table-wrap"><div class="table-scroll"><table>
    <thead><tr><th>Nº</th><th>Data</th><th>Operador</th><th>Produto/Serviço</th><th>Valor</th><th>Pagamento</th><th>Status</th><th></th></tr></thead>
    <tbody>${vendas.map(v => `
      <tr><td class="mono">${v.numero}</td><td>${fmtDateTime(v.data)}</td><td>${v.operador}</td>
      <td>${v.itens.map(i => i.produto).slice(0, 2).join(', ')}${v.itens.length > 2 ? '…' : ''}</td>
      <td class="mono">${fmtMoney(v.total)}</td><td>${badgePagamento(v.pagamento)}</td>
      <td>${badgeStatusVenda(v.status)}</td>
      <td><div class="action-icons"><button onclick="verRecibo(${v.id})" title="Recibo">${ic('receipt', 'w-4')}</button></div></td></tr>`).join('')}
    </tbody></table></div></div>`;
}

function tableAlertasEstoque() {
  const baixos = DB.produtos.filter(p => p.estado !== 'Disponível').slice(0, 6);
  if (!baixos.length) return emptyState('check-circle', 'Estoque saudável', 'Nenhum produto com estoque baixo ou esgotado.');
  return `<div class="table-wrap"><div class="table-scroll"><table>
    <thead><tr><th>Produto</th><th>Categoria</th><th>Estoque</th><th>Mínimo</th><th>Status</th></tr></thead>
    <tbody>${baixos.map(p => `<tr><td>${p.nome}</td><td>${p.categoria}</td><td class="mono">${p.estoque}</td><td class="mono">${p.estoqueMinimo}</td><td>${badgeEstoque(p.estado)}</td></tr>`).join('')}</tbody>
    </table></div></div>`;
}

function emptyState(icon, title, sub) {
  return `<div class="table-wrap"><div class="empty-state">${ic(icon)}<h3>${title}</h3><p>${sub}</p></div></div>`;
}

function badgePagamento(f) {
  const map = { 'Dinheiro': 'verde', 'M-Pesa': 'dourado', 'E-Mola': 'dourado', 'POS': 'azul', 'Transferência': 'azul' };
  return `<span class="badge badge-${map[f] || 'cinza'}">${f}</span>`;
}
function badgeStatusVenda(s) { return s === 'Concluída' ? `<span class="badge badge-verde">${ic('check', 'w-3')} Concluída</span>` : `<span class="badge badge-vermelho">${ic('x', 'w-3')} Cancelada</span>`; }
function badgeEstoque(e) {
  const map = { 'Disponível': 'verde', 'Estoque baixo': 'dourado', 'Esgotado': 'vermelho' };
  return `<span class="badge badge-${map[e]}"><span class="badge-dot"></span>${e}</span>`;
}
function badgeQuarto(e) {
  const map = { 'Livre': 'verde', 'Ocupado': 'vermelho', 'Reservado': 'dourado', 'Em limpeza': 'azul', 'Manutenção': 'cinza' };
  return `<span class="badge badge-${map[e]}"><span class="badge-dot"></span>${e}</span>`;
}
function badgeGeral(e, map) { return `<span class="badge badge-${map[e] || 'cinza'}">${e}</span>`; }

/* ==========================================================================
   PRODUTOS
   ========================================================================== */
function renderProdutos() {
  document.getElementById('content').innerHTML = `
    <div class="table-wrap">
      <div class="table-toolbar">
        <div class="search-box">${ic('search')}<input id="prodSearch" placeholder="Pesquisar produto ou código..." oninput="filterProdutos()"></div>
        <div class="filter-row">
          <select id="prodCatFilter" onchange="filterProdutos()"><option value="">Todas categorias</option>${CATEGORIAS_PRODUTO.map(c => `<option>${c}</option>`).join('')}</select>
          ${can('editProdutos') ? `<button class="btn btn-primary btn-sm" onclick="openProductModal()">${ic('plus')} Novo produto</button>` : ''}
        </div>
      </div>
      <div class="table-scroll"><table>
        <thead><tr><th>Código</th><th>Produto</th><th>Categoria</th><th>Preço compra</th><th>Preço venda</th><th>Estoque</th><th>Mínimo</th><th>Estado</th>${can('editProdutos') ? '<th></th>' : ''}</tr></thead>
        <tbody id="prodTbody"></tbody>
      </table></div>
    </div>`;
  filterProdutos();
}
function filterProdutos() {
  const q = (document.getElementById('prodSearch').value || '').toLowerCase();
  const cat = document.getElementById('prodCatFilter').value;
  const rows = DB.produtos.filter(p => (!cat || p.categoria === cat) && (p.nome.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q)));
  document.getElementById('prodTbody').innerHTML = rows.length ? rows.map(p => `
    <tr><td class="mono">${p.codigo}</td><td><b>${p.nome}</b></td><td>${p.categoria}</td>
    <td class="mono">${fmtMoney(p.precoCompra)}</td><td class="mono">${fmtMoney(p.precoVenda)}</td>
    <td class="mono">${p.estoque}</td><td class="mono">${p.estoqueMinimo}</td><td>${badgeEstoque(p.estado)}</td>
    ${can('editProdutos') ? `<td><div class="action-icons">
      <button onclick="openProductModal(${p.id})" title="Editar">${ic('pencil', 'w-4')}</button>
      <button class="danger" onclick="deleteProduct(${p.id})" title="Eliminar">${ic('trash-2', 'w-4')}</button>
    </div></td>` : ''}</tr>`).join('') :
    `<tr><td colspan="9"><div class="empty-state">${ic('package-search')}<h3>Nenhum produto encontrado</h3><p>Tente ajustar a pesquisa ou os filtros.</p></div></td></tr>`;
  icons();
}
function openProductModal(id) {
  const p = id ? DB.produtos.find(x => x.id === id) : null;
  openModal(p ? 'Editar produto' : 'Novo produto', `
    <div class="grid g-2">
      <div class="field"><label>Nome</label><input id="fNome" value="${p ? p.nome : ''}"></div>
      <div class="field"><label>Código</label><input id="fCodigo" value="${p ? p.codigo : 'PRD-' + pad(DB.produtos.length + 1, 4)}"></div>
      <div class="field"><label>Categoria</label><select id="fCategoria">${CATEGORIAS_PRODUTO.map(c => `<option ${p && p.categoria === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
      <div class="field"><label>Estoque mínimo</label><input type="number" id="fMin" value="${p ? p.estoqueMinimo : 10}"></div>
      <div class="field"><label>Preço de compra (MT)</label><input type="number" id="fCompra" value="${p ? p.precoCompra : ''}"></div>
      <div class="field"><label>Preço de venda (MT)</label><input type="number" id="fVenda" value="${p ? p.precoVenda : ''}"></div>
      <div class="field"><label>Quantidade em estoque</label><input type="number" id="fQtd" value="${p ? p.estoque : 0}"></div>
    </div>
    <div class="field"><label>Descrição</label><textarea id="fDesc" rows="2">${p ? p.descricao : ''}</textarea></div>
  `, `<button class="btn btn-ghost" onclick="closeModal()">Cancelar</button><button class="btn btn-primary" onclick="saveProduct(${id || 'null'})">${ic('check')} Guardar produto</button>`);
}
function saveProduct(id) {
  const nome = document.getElementById('fNome').value.trim();
  if (!nome) { showToast('Indique o nome do produto.', 'error'); return; }
  const estoque = parseInt(document.getElementById('fQtd').value) || 0;
  const min = parseInt(document.getElementById('fMin').value) || 10;
  const data = {
    nome, codigo: document.getElementById('fCodigo').value, categoria: document.getElementById('fCategoria').value,
    descricao: document.getElementById('fDesc').value, precoCompra: parseFloat(document.getElementById('fCompra').value) || 0,
    precoVenda: parseFloat(document.getElementById('fVenda').value) || 0, estoque, estoqueMinimo: min,
    estado: estoque === 0 ? 'Esgotado' : estoque <= min ? 'Estoque baixo' : 'Disponível'
  };
  if (id) {
    Object.assign(DB.produtos.find(p => p.id === id), data);
    showToast('Produto atualizado com sucesso.');
  } else {
    data.id = Math.max(0, ...DB.produtos.map(p => p.id)) + 1;
    DB.produtos.push(data);
    showToast('Produto adicionado com sucesso.');
  }
  saveDB(DB); closeModal(); renderProdutos();
}
function deleteProduct(id) {
  confirmAction('Tem a certeza que deseja eliminar este produto? Esta ação não pode ser desfeita.', () => {
    DB.produtos = DB.produtos.filter(p => p.id !== id); saveDB(DB); renderProdutos(); showToast('Produto eliminado.', 'info');
  });
}

/* ==========================================================================
   ESTOQUE
   ========================================================================== */
function renderEstoque() {
  const total = DB.produtos.length;
  const disp = DB.produtos.filter(p => p.estado === 'Disponível').length;
  const baixo = DB.produtos.filter(p => p.estado === 'Estoque baixo').length;
  const esgotado = DB.produtos.filter(p => p.estado === 'Esgotado').length;
  document.getElementById('content').innerHTML = `
    <div class="grid g-4">
      ${statCard('Total de produtos', total, 'boxes', 'azul')}
      ${statCard('Disponíveis', disp, 'check-circle', 'verde')}
      ${statCard('Estoque baixo', baixo, 'alert-triangle', 'dourado')}
      ${statCard('Esgotados', esgotado, 'x-circle', 'vermelho')}
    </div>
    <div class="section-head"><h2>Movimentações de estoque</h2>
      <div class="actions">
        <button class="btn btn-ghost btn-sm" onclick="openStockModal('Saída')">${ic('arrow-up-right')} Registar saída</button>
        <button class="btn btn-primary btn-sm" onclick="openStockModal('Entrada')">${ic('arrow-down-right')} Registar entrada</button>
      </div>
    </div>
    <div class="table-wrap"><div class="table-scroll"><table>
      <thead><tr><th>Data</th><th>Produto</th><th>Tipo</th><th>Quantidade</th><th>Responsável</th><th>Observação</th></tr></thead>
      <tbody id="movTbody"></tbody>
    </table></div></div>`;
  const rows = DB.movimentos.slice().reverse();
  document.getElementById('movTbody').innerHTML = rows.length ? rows.map(m => `
    <tr><td>${fmtDateTime(m.data)}</td><td>${m.produto}</td>
    <td>${badgeGeral(m.tipo, { Entrada: 'verde', Saída: 'vermelho', Ajuste: 'azul' })}</td>
    <td class="mono">${m.quantidade}</td><td>${m.responsavel}</td><td>${m.obs || '—'}</td></tr>`).join('') :
    `<tr><td colspan="6"><div class="empty-state">${ic('history')}<h3>Sem movimentações</h3><p>Registe uma entrada ou saída de estoque para começar.</p></div></td></tr>`;
  icons();
}
function openStockModal(tipo) {
  openModal(`Registar ${tipo.toLowerCase()} de estoque`, `
    <div class="field"><label>Produto</label><select id="mProd">${DB.produtos.map(p => `<option value="${p.id}">${p.nome} (estoque: ${p.estoque})</option>`).join('')}</select></div>
    <div class="field"><label>Quantidade</label><input type="number" id="mQtd" min="1" value="1"></div>
    <div class="field"><label>Observação</label><input id="mObs" placeholder="Opcional"></div>
  `, `<button class="btn btn-ghost" onclick="closeModal()">Cancelar</button><button class="btn btn-primary" onclick="saveMovimento('${tipo}')">${ic('check')} Confirmar</button>`);
}
function saveMovimento(tipo) {
  const prod = DB.produtos.find(p => p.id == document.getElementById('mProd').value);
  const qtd = parseInt(document.getElementById('mQtd').value) || 0;
  if (qtd <= 0) { showToast('Indique uma quantidade válida.', 'error'); return; }
  if (tipo === 'Saída' && qtd > prod.estoque) { showToast('Quantidade maior que o estoque disponível.', 'error'); return; }
  prod.estoque += tipo === 'Entrada' ? qtd : -qtd;
  prod.estado = prod.estoque === 0 ? 'Esgotado' : prod.estoque <= prod.estoqueMinimo ? 'Estoque baixo' : 'Disponível';
  DB.movimentos.push({ data: new Date().toISOString(), produto: prod.nome, tipo, quantidade: qtd, responsavel: session.nome, obs: document.getElementById('mObs').value });
  saveDB(DB); closeModal(); renderEstoque(); showToast(`${tipo} de estoque registada com sucesso.`);
}

/* ==========================================================================
   VENDAS (POS)
   ========================================================================== */
function renderVendas() {
  cart = [];
  document.getElementById('content').innerHTML = `
    <div class="pos-layout">
      <div>
        <div class="pos-cats" id="posCats"></div>
        <div class="product-grid" id="posGrid"></div>
      </div>
      <div class="cart-card">
        <div class="cart-head"><b>Carrinho</b><span class="text-muted mono" id="cartCount">0 itens</span></div>
        <div class="cart-items" id="cartItems"><div class="empty-state" style="padding:30px 10px;">${ic('shopping-cart')}<p>Adicione produtos ao carrinho</p></div></div>
        <div class="cart-summary">
          <div class="row"><span>Subtotal</span><span class="mono" id="cSub">0 MT</span></div>
          <div class="row"><span>Desconto</span><span class="mono" id="cDesc">0 MT</span></div>
          <div class="row total"><span>Total</span><span class="mono" id="cTotal">0 MT</span></div>
          <label style="font-size:0.78rem; color:var(--cinza-texto); display:block; margin-bottom:6px;">Forma de pagamento</label>
          <div class="pay-methods" id="payMethods"></div>
          <button class="btn btn-primary btn-block" onclick="finalizeSale()">${ic('check-circle-2')} Finalizar venda</button>
        </div>
      </div>
    </div>`;
  const cats = ['Todas', ...CATEGORIAS_BAR];
  document.getElementById('posCats').innerHTML = cats.map(c => `<div class="cat-chip ${c === posCategoria ? 'active' : ''}" onclick="setPosCat('${c}')">${c}</div>`).join('');
  const payIcons = ['Dinheiro', 'M-Pesa', 'E-Mola', 'POS', 'Transferência'];
  document.getElementById('payMethods').innerHTML = payIcons.map((f, i) => `<div class="pay-chip ${i === 0 ? 'active' : ''}" data-pay="${f}" onclick="setPay('${f}')">${f}</div>`).join('');
  window.selectedPay = 'Dinheiro';
  renderPosGrid();
  icons();
}
function setPosCat(c) { posCategoria = c; renderVendas(); }
function setPay(f) { window.selectedPay = f; document.querySelectorAll('.pay-chip').forEach(p => p.classList.toggle('active', p.dataset.pay === f)); }
const PROD_ICON = { 'Cervejas': 'beer', 'Refrigerantes': 'cup-soda', 'Água': 'droplet', 'Sumos': 'citrus', 'Bebidas alcoólicas': 'wine', 'Snacks': 'cookie' };
function renderPosGrid() {
  const list = DB.produtos.filter(p => CATEGORIAS_BAR.includes(p.categoria) && (posCategoria === 'Todas' || p.categoria === posCategoria));
  document.getElementById('posGrid').innerHTML = list.map(p => `
    <div class="prod-card" onclick="addToCart(${p.id})">
      <div class="prod-icon">${ic(PROD_ICON[p.categoria] || 'package')}</div>
      <div class="prod-name">${p.nome}</div>
      <div class="prod-price mono">${fmtMoney(p.precoVenda)}</div>
      <div class="prod-stock">Estoque: ${p.estoque}</div>
    </div>`).join('') || emptyState('search-x', 'Sem produtos nesta categoria', '');
  icons();
}
function addToCart(id) {
  const p = DB.produtos.find(x => x.id === id);
  if (p.estoque <= 0) { showToast('Produto sem estoque disponível.', 'error'); return; }
  const item = cart.find(i => i.id === id);
  if (item) { if (item.qtd < p.estoque) item.qtd++; else { showToast('Estoque insuficiente.', 'error'); return; } }
  else cart.push({ id, nome: p.nome, preco: p.precoVenda, qtd: 1 });
  renderCart();
}
function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  const p = DB.produtos.find(x => x.id === id);
  item.qtd += delta;
  if (item.qtd <= 0) cart = cart.filter(i => i.id !== id);
  else if (item.qtd > p.estoque) { item.qtd -= delta; showToast('Estoque insuficiente.', 'error'); }
  renderCart();
}
function renderCart() {
  document.getElementById('cartCount').textContent = cart.reduce((s, i) => s + i.qtd, 0) + ' itens';
  document.getElementById('cartItems').innerHTML = cart.length ? cart.map(i => `
    <div class="cart-item">
      <div style="flex:1;"><div class="ci-name">${i.nome}</div><div class="ci-sub mono">${fmtMoney(i.preco)} un.</div></div>
      <div class="qty-control"><button onclick="changeQty(${i.id},-1)">−</button><span class="mono">${i.qtd}</span><button onclick="changeQty(${i.id},1)">+</button></div>
      <div class="mono" style="width:70px; text-align:right; font-weight:600;">${fmtMoney(i.preco * i.qtd)}</div>
    </div>`).join('') : `<div class="empty-state" style="padding:30px 10px;">${ic('shopping-cart')}<p>Adicione produtos ao carrinho</p></div>`;
  const sub = cart.reduce((s, i) => s + i.preco * i.qtd, 0);
  document.getElementById('cSub').textContent = fmtMoney(sub);
  document.getElementById('cDesc').textContent = fmtMoney(0);
  document.getElementById('cTotal').textContent = fmtMoney(sub);
  icons();
}
function finalizeSale() {
  if (!cart.length) { showToast('O carrinho está vazio.', 'error'); return; }
  const total = cart.reduce((s, i) => s + i.preco * i.qtd, 0);
  cart.forEach(i => { const p = DB.produtos.find(x => x.id === i.id); p.estoque -= i.qtd; p.estado = p.estoque === 0 ? 'Esgotado' : p.estoque <= p.estoqueMinimo ? 'Estoque baixo' : 'Disponível'; });
  const numero = 'VND-2026-' + pad(DB.seq.venda++);
  const venda = { id: Math.max(0, ...DB.vendas.map(v => v.id)) + 1, numero, data: new Date().toISOString(), operador: session.nome, itens: cart.map(i => ({ produto: i.nome, qtd: i.qtd, preco: i.preco, subtotal: i.preco * i.qtd })), total, pagamento: window.selectedPay, status: 'Concluída' };
  DB.vendas.unshift(venda);
  pushNotif('success', `Venda ${numero} realizada com sucesso.`);
  saveDB(DB);
  const lastCart = cart.slice();
  cart = [];
  openModal('Venda realizada com sucesso', `
    <div style="text-align:center; padding:6px 0 18px;">
      <div class="icon-box bg-verde" style="width:60px;height:60px;border-radius:50%;margin:0 auto 14px;">${ic('check-circle-2')}</div>
      <p class="text-muted">Número da venda</p>
      <h2 class="mono" style="margin-top:4px;">${numero}</h2>
      <p class="mono mt-8" style="font-size:1.3rem; color:var(--verde);">${fmtMoney(total)}</p>
    </div>`,
    `<button class="btn btn-ghost" onclick="closeModal(); renderVendas();">Nova venda</button>
     <button class="btn btn-primary" onclick="closeModal(); verRecibo(${venda.id});">${ic('printer')} Imprimir recibo</button>`);
}

function verRecibo(vendaId) {
  const v = DB.vendas.find(x => x.id === vendaId);
  openModal('Recibo', `
    <div class="receipt">
      <div class="rc-head"><b>TROPICANA</b><span>Complexo Turístico &amp; Gestão</span></div>
      <hr>
      <div class="rc-row"><span>Recibo Nº</span><span>REC-${pad(v.id + 100)}</span></div>
      <div class="rc-row"><span>Data</span><span>${fmtDateTime(v.data)}</span></div>
      <div class="rc-row"><span>Operador</span><span>${v.operador}</span></div>
      <hr>
      ${v.itens.map(i => `<div class="rc-row"><span>${i.qtd}x ${i.produto}</span><span>${fmtMoney(i.subtotal)}</span></div>`).join('')}
      <hr>
      <div class="rc-total"><span>TOTAL</span><span>${fmtMoney(v.total)}</span></div>
      <div class="rc-row mt-8"><span>Pagamento</span><span>${v.pagamento}</span></div>
      <p style="text-align:center; margin-top:16px; color:var(--cinza-texto);">Obrigado pela preferência!</p>
    </div>`,
    `<button class="btn btn-ghost" onclick="closeModal()">Fechar</button><button class="btn btn-primary" onclick="notImplemented('Impressão de recibo')">${ic('printer')} Imprimir</button>`);
}

/* ==========================================================================
   RELATÓRIO DE VENDAS
   ========================================================================== */
function renderRelVendas() {
  document.getElementById('content').innerHTML = `
    <div class="table-wrap">
      <div class="table-toolbar">
        <div class="filter-row">
          <select id="relPeriodo" onchange="filterRelVendas()">
            <option value="hoje">Hoje</option><option value="semana">Esta semana</option>
            <option value="mes" selected>Este mês</option><option value="ano">Este ano</option>
          </select>
        </div>
        <div class="filter-row">
          <button class="btn btn-ghost btn-sm" onclick="notImplemented('Impressão')">${ic('printer')} Imprimir</button>
          <button class="btn btn-ghost btn-sm" onclick="notImplemented('Exportação em PDF')">${ic('file-down')} Exportar PDF</button>
          <button class="btn btn-ghost btn-sm" onclick="notImplemented('Exportação em Excel')">${ic('sheet')} Exportar Excel</button>
        </div>
      </div>
      <div id="relSummary"></div>
      <div class="table-scroll"><table>
        <thead><tr><th>Nº</th><th>Data</th><th>Operador</th><th>Itens</th><th>Valor</th><th>Pagamento</th><th>Status</th></tr></thead>
        <tbody id="relTbody"></tbody>
      </table></div>
    </div>`;
  filterRelVendas();
}
function filterRelVendas() {
  const periodo = document.getElementById('relPeriodo').value;
  const now = new Date(2026, 7, 8, 23, 59, 59);
  let start;
  if (periodo === 'hoje') start = new Date(2026, 7, 8, 0, 0, 0);
  else if (periodo === 'semana') { start = new Date(now); start.setDate(start.getDate() - 7); }
  else if (periodo === 'mes') { start = new Date(2026, 7, 1); }
  else start = new Date(2026, 0, 1);
  const rows = DB.vendas.filter(v => new Date(v.data) >= start && new Date(v.data) <= now);
  const concluidas = rows.filter(v => v.status === 'Concluída');
  const receita = concluidas.reduce((s, v) => s + v.total, 0);
  const lucro = Math.round(receita * 0.42);
  document.getElementById('relSummary').innerHTML = `<div class="grid g-4" style="padding:0 18px 18px;">
    ${statCard('Total de vendas', concluidas.length, 'shopping-bag', 'verde')}
    ${statCard('Receita', fmtMoney(receita), 'trending-up', 'dourado')}
    ${statCard('Lucro estimado', fmtMoney(lucro), 'piggy-bank', 'azul')}
    ${statCard('Transações', rows.length, 'receipt', 'vermelho')}
  </div>`;
  document.getElementById('relTbody').innerHTML = rows.length ? rows.map(v => `
    <tr><td class="mono">${v.numero}</td><td>${fmtDateTime(v.data)}</td><td>${v.operador}</td>
    <td>${v.itens.length} item(ns)</td><td class="mono">${fmtMoney(v.total)}</td><td>${badgePagamento(v.pagamento)}</td><td>${badgeStatusVenda(v.status)}</td></tr>`).join('') :
    `<tr><td colspan="7"><div class="empty-state">${ic('bar-chart-3')}<h3>Sem vendas no período</h3><p>Ajuste o filtro de período.</p></div></td></tr>`;
  icons();
}

/* ==========================================================================
   ACOMODAÇÃO / QUARTOS
   ========================================================================== */
function roomCard(q) {
  const cls = { 'Livre': 'room-livre', 'Ocupado': 'room-ocupado', 'Reservado': 'room-reservado', 'Em limpeza': 'room-limpeza', 'Manutenção': 'room-manutencao' }[q.estado];
  return `<div class="room-card ${cls}">
    <div class="flex-between"><span class="room-num">${q.numero}</span>${badgeQuarto(q.estado)}</div>
    <div class="room-type">${q.tipo}</div>
    <div class="room-prices">Preço/hora: <b>${fmtMoney(q.precoHora)}</b><br>Preço/dia: <b>${fmtMoney(q.precoDia)}</b></div>
    <div class="flex gap-8">
      ${q.estado === 'Livre' ? `<button class="btn btn-primary btn-sm w-full" onclick="openCheckin(${q.id})">${ic('log-in', 'w-4')} Check-in</button>` : ''}
      ${q.estado === 'Ocupado' ? `<button class="btn btn-gold btn-sm w-full" onclick="openCheckout(${q.id})">${ic('log-out', 'w-4')} Check-out</button>` : ''}
      ${q.estado === 'Reservado' ? `<button class="btn btn-ghost btn-sm w-full" onclick="navigate('reservas')">Ver reserva</button>` : ''}
      ${(q.estado === 'Em limpeza' || q.estado === 'Manutenção') && session.perfil === 'Gestor' ? `<button class="btn btn-ghost btn-sm w-full" onclick="setRoomStatus(${q.id},'Livre')">Marcar como livre</button>` : ''}
    </div>
  </div>`;
}
function setRoomStatus(id, estado) { DB.quartos.find(q => q.id === id).estado = estado; saveDB(DB); renderAcomodacao(); showToast('Estado do quarto atualizado.'); }

function renderAcomodacao() {
  document.getElementById('content').innerHTML = `
    <div class="grid g-4">
      ${statCard('Clientes atendidos hoje', DB.reservas.filter(r => new Date(r.entrada).toDateString() === new Date(2026, 7, 8).toDateString()).length, 'users', 'verde')}
      ${statCard('Quartos ocupados', DB.quartos.filter(q => q.estado === 'Ocupado').length, 'bed-double', 'vermelho')}
      ${statCard('Quartos disponíveis', DB.quartos.filter(q => q.estado === 'Livre').length, 'door-open', 'dourado')}
      ${statCard('Taxa de ocupação', Math.round(DB.quartos.filter(q => q.estado === 'Ocupado').length / DB.quartos.length * 100) + '%', 'percent', 'azul')}
    </div>
    <div class="section-head"><h2>Quartos</h2>
      <div class="filter-row" id="roomFilterRow"></div>
    </div>
    <div class="grid g-4" id="roomGrid"></div>`;
  const estados = ['Todos', 'Livre', 'Ocupado', 'Reservado', 'Em limpeza', 'Manutenção'];
  document.getElementById('roomFilterRow').innerHTML = estados.map(e => `<div class="cat-chip ${e === currentRoomFilter ? 'active' : ''}" onclick="filterRooms('${e}')">${e}</div>`).join('');
  drawRoomGrid();
  icons();
}
function filterRooms(e) { currentRoomFilter = e; document.querySelectorAll('#roomFilterRow .cat-chip').forEach(c => c.classList.toggle('active', c.textContent === e)); drawRoomGrid(); }
function drawRoomGrid() {
  const list = DB.quartos.filter(q => currentRoomFilter === 'Todos' || q.estado === currentRoomFilter);
  document.getElementById('roomGrid').innerHTML = list.map(roomCard).join('') || emptyState('bed', 'Nenhum quarto neste estado', '');
  icons();
}

function renderQuartos() {
  document.getElementById('content').innerHTML = `
    <div class="section-head"><h2>Gestão de quartos</h2><div class="actions"><button class="btn btn-primary btn-sm" onclick="openRoomModal()">${ic('plus')} Novo quarto</button></div></div>
    <div class="table-wrap"><div class="table-scroll"><table>
      <thead><tr><th>Nº</th><th>Tipo</th><th>Preço/hora</th><th>Preço/dia</th><th>Estado</th><th></th></tr></thead>
      <tbody>${DB.quartos.map(q => `
        <tr><td class="mono">${q.numero}</td><td>${q.tipo}</td><td class="mono">${fmtMoney(q.precoHora)}</td><td class="mono">${fmtMoney(q.precoDia)}</td><td>${badgeQuarto(q.estado)}</td>
        <td><div class="action-icons"><button onclick="openRoomModal(${q.id})">${ic('pencil', 'w-4')}</button></div></td></tr>`).join('')}</tbody>
    </table></div></div>`;
  icons();
}
function openRoomModal(id) {
  const q = id ? DB.quartos.find(x => x.id === id) : null;
  openModal(q ? 'Editar quarto' : 'Novo quarto', `
    <div class="grid g-2">
      <div class="field"><label>Número</label><input type="number" id="rNum" value="${q ? q.numero : Math.max(...DB.quartos.map(x => x.numero)) + 1}"></div>
      <div class="field"><label>Tipo</label><select id="rTipo"><option ${q && q.tipo === 'Standard' ? 'selected' : ''}>Standard</option><option ${q && q.tipo === 'Deluxe' ? 'selected' : ''}>Deluxe</option><option ${q && q.tipo === 'Suite' ? 'selected' : ''}>Suite</option><option ${q && q.tipo === 'Suite Presidencial' ? 'selected' : ''}>Suite Presidencial</option></select></div>
      <div class="field"><label>Preço/hora (MT)</label><input type="number" id="rHora" value="${q ? q.precoHora : 500}"></div>
      <div class="field"><label>Preço/dia (MT)</label><input type="number" id="rDia" value="${q ? q.precoDia : 2500}"></div>
      <div class="field"><label>Estado</label><select id="rEstado">${['Livre', 'Ocupado', 'Reservado', 'Em limpeza', 'Manutenção'].map(e => `<option ${q && q.estado === e ? 'selected' : ''}>${e}</option>`).join('')}</select></div>
    </div>`, `<button class="btn btn-ghost" onclick="closeModal()">Cancelar</button><button class="btn btn-primary" onclick="saveRoom(${id || 'null'})">${ic('check')} Guardar</button>`);
}
function saveRoom(id) {
  const data = { numero: parseInt(document.getElementById('rNum').value), tipo: document.getElementById('rTipo').value, precoHora: parseFloat(document.getElementById('rHora').value), precoDia: parseFloat(document.getElementById('rDia').value), estado: document.getElementById('rEstado').value };
  if (id) Object.assign(DB.quartos.find(q => q.id === id), data);
  else { data.id = Math.max(0, ...DB.quartos.map(q => q.id)) + 1; DB.quartos.push(data); }
  saveDB(DB); closeModal(); renderQuartos(); showToast('Quarto guardado com sucesso.');
}

/* ---- Check-in / Check-out ---- */
function openCheckin(quartoId) {
  const q = DB.quartos.find(x => x.id === quartoId);
  openModal('Registar check-in', `
    <div class="field"><label>Nome do cliente</label><input id="ciCliente" placeholder="Nome completo"></div>
    <div class="grid g-2">
      <div class="field"><label>Telefone</label><input id="ciTel" placeholder="84xxxxxxx"></div>
      <div class="field"><label>Documento</label><input id="ciDoc" placeholder="Nº do documento"></div>
    </div>
    <div class="field"><label>Quarto</label><input value="${q.numero} — ${q.tipo}" disabled></div>
    <div class="grid g-2">
      <div class="field"><label>Tipo de estadia</label><select id="ciTipo" onchange="calcCheckin(${q.id})"><option value="hora">Por hora</option><option value="dia">Por dia</option></select></div>
      <div class="field"><label>Duração</label><input type="number" id="ciDuracao" value="1" min="1" oninput="calcCheckin(${q.id})"></div>
    </div>
    <div class="field"><label>Forma de pagamento</label><select id="ciPag">${['Dinheiro', 'M-Pesa', 'E-Mola', 'POS', 'Transferência'].map(f => `<option>${f}</option>`).join('')}</select></div>
    <div class="card" style="background:var(--cinza-claro); text-align:center; padding:14px;">Valor estimado: <b class="mono" id="ciValor">${fmtMoney(q.precoHora)}</b></div>
  `, `<button class="btn btn-ghost" onclick="closeModal()">Cancelar</button><button class="btn btn-primary" onclick="confirmCheckin(${q.id})">${ic('log-in')} Confirmar check-in</button>`);
}
function calcCheckin(quartoId) {
  const q = DB.quartos.find(x => x.id === quartoId);
  const tipo = document.getElementById('ciTipo').value;
  const dur = parseInt(document.getElementById('ciDuracao').value) || 1;
  document.getElementById('ciValor').textContent = fmtMoney((tipo === 'hora' ? q.precoHora : q.precoDia) * dur);
}
function confirmCheckin(quartoId) {
  const nome = document.getElementById('ciCliente').value.trim();
  if (!nome) { showToast('Indique o nome do cliente.', 'error'); return; }
  const q = DB.quartos.find(x => x.id === quartoId);
  const tipo = document.getElementById('ciTipo').value;
  const dur = parseInt(document.getElementById('ciDuracao').value) || 1;
  const valor = (tipo === 'hora' ? q.precoHora : q.precoDia) * dur;
  q.estado = 'Ocupado';
  q.hospedagem = { cliente: nome, entrada: new Date().toISOString(), tipo, duracao: dur, valor, pagamento: document.getElementById('ciPag').value };
  saveDB(DB); closeModal(); renderAcomodacao(); showToast(`Check-in confirmado — Quarto ${q.numero}.`);
}
function openCheckout(quartoId) {
  const q = DB.quartos.find(x => x.id === quartoId);
  const h = q.hospedagem || { cliente: '—', entrada: new Date().toISOString(), valor: q.precoDia, pagamento: 'Dinheiro' };
  openModal('Registar check-out', `
    <div class="card" style="background:var(--cinza-claro);">
      <div class="rc-row flex-between mt-8"><span class="text-muted">Cliente</span><b>${h.cliente}</b></div>
      <div class="rc-row flex-between mt-8"><span class="text-muted">Quarto</span><b>${q.numero} — ${q.tipo}</b></div>
      <div class="rc-row flex-between mt-8"><span class="text-muted">Entrada</span><b>${fmtDateTime(h.entrada)}</b></div>
      <div class="rc-row flex-between mt-8"><span class="text-muted">Valor da acomodação</span><b class="mono">${fmtMoney(h.valor)}</b></div>
    </div>
    <div class="field mt-16"><label>Consumos adicionais (MT)</label><input type="number" id="coExtra" value="0"></div>
    <div class="card" style="text-align:center; background:var(--verde-mais-escuro); color:#fff; margin-top:10px;">Total a pagar: <b class="mono" id="coTotal">${fmtMoney(h.valor)}</b></div>
  `, `<button class="btn btn-ghost" onclick="closeModal()">Cancelar</button><button class="btn btn-primary" onclick="confirmCheckout(${q.id})">${ic('log-out')} Finalizar estadia</button>`);
  document.getElementById('coExtra').addEventListener('input', () => {
    const extra = parseFloat(document.getElementById('coExtra').value) || 0;
    document.getElementById('coTotal').textContent = fmtMoney(h.valor + extra);
  });
}
function confirmCheckout(quartoId) {
  const q = DB.quartos.find(x => x.id === quartoId);
  const extra = parseFloat(document.getElementById('coExtra').value) || 0;
  const h = q.hospedagem || { valor: q.precoDia };
  const total = h.valor + extra;
  q.estado = 'Livre'; delete q.hospedagem;
  saveDB(DB); closeModal(); renderAcomodacao();
  showToast(`Estadia finalizada — total ${fmtMoney(total)}.`);
}
function prolongarEstadia(quartoId) {
  const q = DB.quartos.find(x => x.id === quartoId);
  openModal('Prolongar estadia', `
    <div class="field"><label>Adicionar</label><select id="pTipo"><option value="hora">Horas</option><option value="dia">Dias</option></select></div>
    <div class="field"><label>Quantidade</label><input type="number" id="pQtd" value="1" min="1"></div>
  `, `<button class="btn btn-ghost" onclick="closeModal()">Cancelar</button><button class="btn btn-primary" onclick="closeModal(); showToast('Estadia prolongada com sucesso.');">${ic('check')} Confirmar</button>`);
}

/* ==========================================================================
   RESERVAS
   ========================================================================== */
function renderReservas() {
  document.getElementById('content').innerHTML = `
    <div class="table-wrap">
      <div class="table-toolbar">
        <div class="search-box">${ic('search')}<input id="resSearch" placeholder="Pesquisar cliente ou código..." oninput="filterReservas()"></div>
        <div class="filter-row">
          <select id="resEstadoFilter" onchange="filterReservas()"><option value="">Todos estados</option>${['Confirmada', 'Em curso', 'Concluída', 'Cancelada'].map(e => `<option>${e}</option>`).join('')}</select>
          <button class="btn btn-primary btn-sm" onclick="openReservaModal()">${ic('plus')} Nova reserva</button>
        </div>
      </div>
      <div class="table-scroll"><table>
        <thead><tr><th>Reserva</th><th>Cliente</th><th>Quarto</th><th>Entrada</th><th>Saída</th><th>Duração</th><th>Valor</th><th>Estado</th></tr></thead>
        <tbody id="resTbody"></tbody>
      </table></div>
    </div>`;
  filterReservas();
}
function filterReservas() {
  const q = (document.getElementById('resSearch').value || '').toLowerCase();
  const estado = document.getElementById('resEstadoFilter').value;
  const rows = DB.reservas.filter(r => (!estado || r.estado === estado) && (r.cliente.toLowerCase().includes(q) || r.codigo.toLowerCase().includes(q)));
  const map = { Confirmada: 'azul', 'Em curso': 'dourado', Concluída: 'verde', Cancelada: 'vermelho' };
  document.getElementById('resTbody').innerHTML = rows.length ? rows.map(r => `
    <tr><td class="mono">${r.codigo}</td><td>${r.cliente}</td><td>${r.quarto}</td><td>${fmtDate(r.entrada)}</td><td>${fmtDate(r.saida)}</td>
    <td>${r.duracao}</td><td class="mono">${fmtMoney(r.valor)}</td><td>${badgeGeral(r.estado, map)}</td></tr>`).join('') :
    `<tr><td colspan="8"><div class="empty-state">${ic('calendar-x')}<h3>Nenhuma reserva encontrada</h3><p>Crie uma nova reserva para começar.</p></div></td></tr>`;
  icons();
}
function openReservaModal() {
  const livres = DB.quartos.filter(q => q.estado === 'Livre');
  openModal('Nova reserva', `
    <div class="field"><label>Nome do cliente</label><input id="rvCliente" placeholder="Nome completo"></div>
    <div class="grid g-2">
      <div class="field"><label>Telefone</label><input id="rvTel" placeholder="84xxxxxxx"></div>
      <div class="field"><label>Documento</label><input id="rvDoc" placeholder="Nº do documento"></div>
    </div>
    <div class="field"><label>Quarto</label><select id="rvQuarto" onchange="calcReserva()">${livres.map(q => `<option value="${q.id}">${q.numero} — ${q.tipo} (${fmtMoney(q.precoDia)}/dia)</option>`).join('') || '<option>Sem quartos livres</option>'}</select></div>
    <div class="grid g-2">
      <div class="field"><label>Data de entrada</label><input type="date" id="rvData" value="2026-08-08"></div>
      <div class="field"><label>Hora de entrada</label><input type="time" id="rvHora" value="14:00"></div>
    </div>
    <div class="grid g-2">
      <div class="field"><label>Tipo de estadia</label><select id="rvTipo" onchange="calcReserva()"><option value="dia">Por dia</option><option value="hora">Por hora</option></select></div>
      <div class="field"><label>Duração</label><input type="number" id="rvDuracao" value="1" min="1" oninput="calcReserva()"></div>
    </div>
    <div class="field"><label>Forma de pagamento</label><select>${['Dinheiro', 'M-Pesa', 'E-Mola', 'POS', 'Transferência'].map(f => `<option>${f}</option>`).join('')}</select></div>
    <div class="card" style="background:var(--cinza-claro); text-align:center; padding:14px;">Valor calculado: <b class="mono" id="rvValor">0 MT</b></div>
  `, `<button class="btn btn-ghost" onclick="closeModal()">Cancelar</button><button class="btn btn-primary" onclick="saveReserva()">${ic('check')} Confirmar reserva</button>`);
  calcReserva();
}
function calcReserva() {
  const q = DB.quartos.find(x => x.id == document.getElementById('rvQuarto').value);
  if (!q) return;
  const tipo = document.getElementById('rvTipo').value;
  const dur = parseInt(document.getElementById('rvDuracao').value) || 1;
  document.getElementById('rvValor').textContent = fmtMoney((tipo === 'hora' ? q.precoHora : q.precoDia) * dur);
}
function saveReserva() {
  const cliente = document.getElementById('rvCliente').value.trim();
  if (!cliente) { showToast('Indique o nome do cliente.', 'error'); return; }
  const q = DB.quartos.find(x => x.id == document.getElementById('rvQuarto').value);
  if (!q) { showToast('Selecione um quarto disponível.', 'error'); return; }
  const tipo = document.getElementById('rvTipo').value;
  const dur = parseInt(document.getElementById('rvDuracao').value) || 1;
  const valor = (tipo === 'hora' ? q.precoHora : q.precoDia) * dur;
  const codigo = 'RES-2026-' + pad(DB.seq.reserva++);
  DB.reservas.unshift({ id: Math.max(0, ...DB.reservas.map(r => r.id)) + 1, codigo, cliente, quarto: q.numero, entrada: new Date().toISOString(), saida: new Date().toISOString(), duracao: dur + (tipo === 'hora' ? ' hora(s)' : ' dia(s)'), valor, estado: 'Confirmada' });
  q.estado = 'Reservado';
  saveDB(DB); closeModal(); renderReservas(); pushNotif('info', `Nova reserva ${codigo} registada.`);
  showToast('Reserva criada com sucesso.');
}

/* ==========================================================================
   COZINHA / REFEIÇÕES
   ========================================================================== */
function renderCozinha() {
  const ingredientes = [
    ['Frango', 45, 20], ['Arroz', 80, 15], ['Batata', 60, 12], ['Salada', 30, 5],
    ['Hambúrguer (pão+carne)', 55, 15], ['Pizza (massa)', 25, 8], ['Peixe', 35, 15], ['Matapa (folha)', 20, 5]
  ];
  document.getElementById('content').innerHTML = `
    <div class="section-head"><h2>Estoque de ingredientes</h2></div>
    <div class="table-wrap"><div class="table-scroll"><table>
      <thead><tr><th>Produto</th><th>Estoque disponível</th><th>Estoque mínimo</th><th>Estado</th></tr></thead>
      <tbody>${ingredientes.map(([n, e, m]) => `<tr><td>${n}</td><td class="mono">${e}</td><td class="mono">${m}</td><td>${badgeEstoque(e === 0 ? 'Esgotado' : e <= m ? 'Estoque baixo' : 'Disponível')}</td></tr>`).join('')}</tbody>
    </table></div></div>
    <div class="section-head"><h2>Relatório de refeições vendidas</h2><div class="actions"><button class="btn btn-ghost btn-sm" onclick="navigate('refeicoes')">Ver todas</button></div></div>
    <div class="grid g-2">
      <div class="card chart-card"><div class="card-title">Refeições mais vendidas</div><canvas id="chRefeicoes"></canvas></div>
      <div class="table-wrap"><div class="table-scroll"><table>
        <thead><tr><th>Refeição</th><th>Qtd.</th></tr></thead>
        <tbody>${Object.entries(DB.refeicoes.reduce((m, r) => { m[r.nome] = (m[r.nome] || 0) + r.quantidade; return m; }, {})).sort((a, b) => b[1] - a[1]).map(([n, q]) => `<tr><td>${n}</td><td class="mono">${q}</td></tr>`).join('')}</tbody>
      </table></div></div>
    </div>`;
  icons();
  renderRefeicoesMaisVendidas('chRefeicoes', DB);
}
function renderRefeicoes() {
  document.getElementById('content').innerHTML = `
    <div class="section-head"><h2>Refeições vendidas</h2><div class="actions"><button class="btn btn-primary btn-sm" onclick="openMealModal()">${ic('plus')} Registar refeição vendida</button></div></div>
    <div class="table-wrap"><div class="table-scroll"><table>
      <thead><tr><th>Refeição</th><th>Quantidade</th><th>Preço</th><th>Total</th><th>Data</th><th>Responsável</th></tr></thead>
      <tbody>${DB.refeicoes.slice().reverse().map(r => `<tr><td>${r.nome}</td><td class="mono">${r.quantidade}</td><td class="mono">${fmtMoney(r.preco)}</td><td class="mono">${fmtMoney(r.total)}</td><td>${fmtDate(r.data)}</td><td>${r.responsavel}</td></tr>`).join('')}</tbody>
    </table></div></div>`;
  icons();
}
function openMealModal() {
  const pratos = ['Frango grelhado', 'Hambúrguer', 'Pizza', 'Peixe grelhado', 'Matapa', 'Arroz de marisco', 'Costeleta de porco', 'Salada tropical'];
  openModal('Registar refeição vendida', `
    <div class="field"><label>Refeição</label><select id="mfNome">${pratos.map(p => `<option>${p}</option>`).join('')}</select></div>
    <div class="grid g-2">
      <div class="field"><label>Quantidade</label><input type="number" id="mfQtd" value="1" min="1"></div>
      <div class="field"><label>Preço unitário (MT)</label><input type="number" id="mfPreco" value="350"></div>
    </div>`, `<button class="btn btn-ghost" onclick="closeModal()">Cancelar</button><button class="btn btn-primary" onclick="saveMeal()">${ic('check')} Registar</button>`);
}
function saveMeal() {
  const nome = document.getElementById('mfNome').value;
  const qtd = parseInt(document.getElementById('mfQtd').value) || 1;
  const preco = parseFloat(document.getElementById('mfPreco').value) || 0;
  DB.refeicoes.push({ id: Math.max(0, ...DB.refeicoes.map(r => r.id)) + 1, nome, quantidade: qtd, preco, total: qtd * preco, data: new Date().toISOString(), responsavel: session.nome });
  saveDB(DB); closeModal(); renderRefeicoes(); showToast('Refeição registada com sucesso.');
}

/* ==========================================================================
   DESPESAS / LUCROS
   ========================================================================== */
function renderDespesas() {
  document.getElementById('content').innerHTML = `
    <div class="section-head"><h2>Despesas</h2><div class="actions"><button class="btn btn-primary btn-sm" onclick="openExpenseModal()">${ic('plus')} Registar despesa</button></div></div>
    <div class="table-wrap"><div class="table-scroll"><table>
      <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Valor</th><th>Responsável</th></tr></thead>
      <tbody>${DB.despesas.map(d => `<tr><td>${fmtDate(d.data)}</td><td>${d.descricao}</td><td><span class="badge badge-cinza">${d.categoria}</span></td><td class="mono">${fmtMoney(d.valor)}</td><td>${d.responsavel}</td></tr>`).join('')}</tbody>
    </table></div></div>`;
  icons();
}
function openExpenseModal() {
  const cats = ['Energia', 'Água', 'Salários', 'Compras', 'Manutenção', 'Limpeza', 'Alimentação', 'Outros'];
  openModal('Registar despesa', `
    <div class="field"><label>Descrição</label><input id="edDesc" placeholder="Ex: Fatura EDM"></div>
    <div class="grid g-2">
      <div class="field"><label>Categoria</label><select id="edCat">${cats.map(c => `<option>${c}</option>`).join('')}</select></div>
      <div class="field"><label>Valor (MT)</label><input type="number" id="edValor" value=""></div>
    </div>`, `<button class="btn btn-ghost" onclick="closeModal()">Cancelar</button><button class="btn btn-primary" onclick="saveExpense()">${ic('check')} Registar despesa</button>`);
}
function saveExpense() {
  const desc = document.getElementById('edDesc').value.trim();
  const valor = parseFloat(document.getElementById('edValor').value) || 0;
  if (!desc || valor <= 0) { showToast('Preencha a descrição e um valor válido.', 'error'); return; }
  DB.despesas.unshift({ id: Math.max(0, ...DB.despesas.map(d => d.id)) + 1, data: new Date().toISOString(), descricao: desc, categoria: document.getElementById('edCat').value, valor, responsavel: session.nome });
  saveDB(DB); closeModal(); renderDespesas(); showToast('Despesa registada com sucesso.');
}

function renderLucros() {
  const receita = DB.vendas.filter(v => v.status === 'Concluída').reduce((s, v) => s + v.total, 0)
    + DB.reservas.filter(r => r.estado !== 'Cancelada').reduce((s, r) => s + r.valor, 0)
    + DB.refeicoes.reduce((s, r) => s + r.total, 0);
  const despesa = DB.despesas.reduce((s, d) => s + d.valor, 0);
  const lucro = receita - despesa;
  const bar = DB.vendas.filter(v => v.status === 'Concluída').reduce((s, v) => s + v.total, 0);
  const cozinha = DB.refeicoes.reduce((s, r) => s + r.total, 0);
  const acomodacao = DB.reservas.filter(r => r.estado !== 'Cancelada').reduce((s, r) => s + r.valor, 0);
  document.getElementById('content').innerHTML = `
    <div class="grid g-3">
      ${statCard('Receitas', fmtMoney(receita), 'trending-up', 'verde')}
      ${statCard('Despesas', fmtMoney(despesa), 'wallet', 'vermelho')}
      ${statCard('Lucro', fmtMoney(lucro), 'piggy-bank', 'dourado', lucro >= 0 ? 'Resultado positivo' : 'Resultado negativo', lucro >= 0)}
    </div>
    <div class="grid g-2 mt-24">
      <div class="card chart-card"><div class="card-title">Receitas x Despesas x Lucro</div><canvas id="chLucro"></canvas></div>
      <div class="card">
        <div class="card-title">Lucro por área</div>
        <div class="mt-16">
          ${lucroBar('Bar', bar * 0.42, Math.max(bar, cozinha, acomodacao) * 0.42)}
          ${lucroBar('Cozinha', cozinha * 0.42, Math.max(bar, cozinha, acomodacao) * 0.42)}
          ${lucroBar('Acomodação', acomodacao * 0.55, Math.max(bar, cozinha, acomodacao) * 0.55)}
        </div>
      </div>
    </div>`;
  icons();
  renderReceitaDespesaLucro('chLucro', DB);
}
function lucroBar(label, val, max) {
  const pct = max > 0 ? Math.round(val / max * 100) : 0;
  return `<div class="mt-16"><div class="flex-between" style="font-size:0.84rem;"><span>${label}</span><b class="mono">${fmtMoney(val)}</b></div>
    <div style="background:var(--cinza-claro); border-radius:20px; height:8px; margin-top:6px; overflow:hidden;"><div style="width:${pct}%; height:100%; background:var(--verde); border-radius:20px;"></div></div></div>`;
}

/* ==========================================================================
   CLIENTES
   ========================================================================== */
function renderClientes() {
  document.getElementById('content').innerHTML = `
    <div class="table-wrap">
      <div class="table-toolbar">
        <div class="search-box">${ic('search')}<input id="cliSearch" placeholder="Pesquisar cliente..." oninput="filterClientes()"></div>
        <button class="btn btn-primary btn-sm" onclick="openClientModal()">${ic('plus')} Novo cliente</button>
      </div>
      <div class="table-scroll"><table>
        <thead><tr><th>Nome</th><th>Telefone</th><th>Documento</th><th>Visitas</th><th>Última visita</th><th>Total gasto</th><th></th></tr></thead>
        <tbody id="cliTbody"></tbody>
      </table></div>
    </div>`;
  filterClientes();
}
function filterClientes() {
  const q = (document.getElementById('cliSearch').value || '').toLowerCase();
  const rows = DB.clientes.filter(c => c.nome.toLowerCase().includes(q));
  document.getElementById('cliTbody').innerHTML = rows.length ? rows.map(c => `
    <tr><td><b>${c.nome}</b></td><td class="mono">${c.telefone}</td><td class="mono">${c.documento}</td><td class="mono">${c.visitas}</td><td>${fmtDate(c.ultimaVisita)}</td><td class="mono">${fmtMoney(c.gasto)}</td>
    <td><div class="action-icons"><button onclick="viewClient(${c.id})" title="Ver perfil">${ic('eye', 'w-4')}</button></div></td></tr>`).join('') :
    `<tr><td colspan="7"><div class="empty-state">${ic('user-search')}<h3>Nenhum cliente encontrado</h3><p></p></div></td></tr>`;
  icons();
}
function viewClient(id) {
  const c = DB.clientes.find(x => x.id === id);
  const hospedagens = DB.reservas.filter(r => r.cliente === c.nome);
  openModal('Perfil do cliente', `
    <div class="flex gap-16" style="align-items:center; margin-bottom:18px;">
      <div class="avatar" style="width:56px;height:56px;font-size:1.2rem; background:var(--verde); color:#fff;">${c.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}</div>
      <div><h3>${c.nome}</h3><p class="text-muted mono">${c.telefone} · ${c.documento}</p></div>
    </div>
    <div class="grid g-3">
      ${statCard('Total gasto', fmtMoney(c.gasto), 'wallet', 'verde')}
      ${statCard('Visitas', c.visitas, 'repeat', 'dourado')}
      ${statCard('Última visita', fmtDate(c.ultimaVisita), 'calendar', 'azul')}
    </div>
    <div class="section-head"><h2 style="font-size:0.95rem;">Histórico de hospedagem</h2></div>
    <div class="table-wrap"><div class="table-scroll"><table><thead><tr><th>Reserva</th><th>Quarto</th><th>Entrada</th><th>Valor</th></tr></thead>
    <tbody>${hospedagens.length ? hospedagens.map(r => `<tr><td class="mono">${r.codigo}</td><td>${r.quarto}</td><td>${fmtDate(r.entrada)}</td><td class="mono">${fmtMoney(r.valor)}</td></tr>`).join('') : `<tr><td colspan="4">Sem histórico registado.</td></tr>`}</tbody></table></div></div>
  `, `<button class="btn btn-ghost" onclick="closeModal()">Fechar</button>`, true);
}
function openClientModal() {
  openModal('Novo cliente', `
    <div class="field"><label>Nome</label><input id="ncNome"></div>
    <div class="grid g-2">
      <div class="field"><label>Telefone</label><input id="ncTel" placeholder="84xxxxxxx"></div>
      <div class="field"><label>Documento</label><input id="ncDoc"></div>
    </div>`, `<button class="btn btn-ghost" onclick="closeModal()">Cancelar</button><button class="btn btn-primary" onclick="saveClient()">${ic('check')} Guardar</button>`);
}
function saveClient() {
  const nome = document.getElementById('ncNome').value.trim();
  if (!nome) { showToast('Indique o nome do cliente.', 'error'); return; }
  DB.clientes.unshift({ id: Math.max(0, ...DB.clientes.map(c => c.id)) + 1, nome, telefone: document.getElementById('ncTel').value, documento: document.getElementById('ncDoc').value, visitas: 0, ultimaVisita: new Date().toISOString(), gasto: 0 });
  saveDB(DB); closeModal(); renderClientes(); pushNotif('info', `Novo cliente registado: ${nome}.`); showToast('Cliente registado com sucesso.');
}

/* ==========================================================================
   USUÁRIOS
   ========================================================================== */
function renderUsuarios() {
  document.getElementById('content').innerHTML = `
    <div class="table-wrap">
      <div class="table-toolbar">
        <div class="search-box">${ic('search')}<input id="usrSearch" placeholder="Pesquisar utilizador..." oninput="filterUsuarios()"></div>
        <button class="btn btn-primary btn-sm" onclick="openUserModal()">${ic('plus')} Novo usuário</button>
      </div>
      <div class="table-scroll"><table>
        <thead><tr><th>Nome</th><th>Email</th><th>Telefone</th><th>Perfil</th><th>Estado</th><th>Último acesso</th><th></th></tr></thead>
        <tbody id="usrTbody"></tbody>
      </table></div>
    </div>`;
  filterUsuarios();
}
function filterUsuarios() {
  const q = (document.getElementById('usrSearch').value || '').toLowerCase();
  const rows = DB.usuarios.filter(u => u.nome.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  const perfilMap = { Gestor: 'dourado', Barman: 'azul', Recepcionista: 'verde' };
  document.getElementById('usrTbody').innerHTML = rows.map(u => `
    <tr><td><b>${u.nome}</b></td><td class="mono">${u.email}</td><td class="mono">${u.telefone}</td><td>${badgeGeral(u.perfil, perfilMap)}</td>
    <td>${badgeGeral(u.estado, { Ativo: 'verde', Inativo: 'vermelho' })}</td><td>${fmtDateTime(u.ultimoAcesso)}</td>
    <td><div class="action-icons">
      <button onclick="openUserModal(${u.id})" title="Editar">${ic('pencil', 'w-4')}</button>
      <button onclick="resetPassword(${u.id})" title="Alterar senha">${ic('key-round', 'w-4')}</button>
      <button class="danger" onclick="deleteUser(${u.id})" title="Eliminar">${ic('trash-2', 'w-4')}</button>
    </div></td></tr>`).join('');
  icons();
}
function openUserModal(id) {
  const u = id ? DB.usuarios.find(x => x.id === id) : null;
  openModal(u ? 'Editar usuário' : 'Novo usuário', `
    <div class="field"><label>Nome</label><input id="uNome" value="${u ? u.nome : ''}"></div>
    <div class="grid g-2">
      <div class="field"><label>Email</label><input id="uEmail" value="${u ? u.email : ''}"></div>
      <div class="field"><label>Telefone</label><input id="uTel" value="${u ? u.telefone : ''}"></div>
    </div>
    <div class="grid g-2">
      <div class="field"><label>Perfil</label><select id="uPerfil"><option ${u && u.perfil === 'Gestor' ? 'selected' : ''}>Gestor</option><option ${u && u.perfil === 'Barman' ? 'selected' : ''}>Barman</option><option ${u && u.perfil === 'Recepcionista' ? 'selected' : ''}>Recepcionista</option></select></div>
      <div class="field"><label>Estado</label><select id="uEstado"><option ${u && u.estado === 'Ativo' ? 'selected' : ''}>Ativo</option><option ${u && u.estado === 'Inativo' ? 'selected' : ''}>Inativo</option></select></div>
    </div>`, `<button class="btn btn-ghost" onclick="closeModal()">Cancelar</button><button class="btn btn-primary" onclick="saveUser(${id || 'null'})">${ic('check')} Guardar</button>`);
}
function saveUser(id) {
  const nome = document.getElementById('uNome').value.trim();
  const email = document.getElementById('uEmail').value.trim();
  if (!nome || !email) { showToast('Preencha nome e email.', 'error'); return; }
  const data = { nome, email, telefone: document.getElementById('uTel').value, perfil: document.getElementById('uPerfil').value, estado: document.getElementById('uEstado').value };
  if (id) Object.assign(DB.usuarios.find(u => u.id === id), data);
  else { data.id = Math.max(0, ...DB.usuarios.map(u => u.id)) + 1; data.ultimoAcesso = new Date().toISOString(); DB.usuarios.push(data); }
  saveDB(DB); closeModal(); renderUsuarios(); showToast('Usuário guardado com sucesso.');
}
function resetPassword(id) {
  confirmAction('Deseja repor a senha deste utilizador para o padrão (123456)?', () => showToast('Senha reposta com sucesso.'));
}
function deleteUser(id) {
  confirmAction('Tem a certeza que deseja eliminar este usuário?', () => { DB.usuarios = DB.usuarios.filter(u => u.id !== id); saveDB(DB); renderUsuarios(); showToast('Usuário eliminado.', 'info'); });
}

/* ==========================================================================
   RELATÓRIO DE ACOMODAÇÃO / CONFIGURAÇÕES / PERFIL
   ========================================================================== */
function renderRelAcomodacao() {
  const receita = DB.reservas.filter(r => r.estado !== 'Cancelada').reduce((s, r) => s + r.valor, 0);
  document.getElementById('content').innerHTML = `
    <div class="grid g-4">
      ${statCard('Check-ins', DB.reservas.length, 'log-in', 'verde')}
      ${statCard('Check-outs', DB.reservas.filter(r => r.estado === 'Concluída').length, 'log-out', 'dourado')}
      ${statCard('Receita de acomodação', fmtMoney(receita), 'trending-up', 'azul')}
      ${statCard('Taxa de ocupação', Math.round(DB.quartos.filter(q => q.estado === 'Ocupado').length / DB.quartos.length * 100) + '%', 'percent', 'vermelho')}
    </div>
    <div class="card chart-card mt-24"><div class="card-title">Utilização dos quartos</div><canvas id="chQuartos"></canvas></div>
    <div class="section-head"><h2>Utilização dos quartos</h2></div>
    <div class="table-wrap"><div class="table-scroll"><table>
      <thead><tr><th>Quarto</th><th>Utilizações</th><th>Receita gerada</th></tr></thead>
      <tbody>${DB.quartos.map(q => {
        const rs = DB.reservas.filter(r => r.quarto === q.numero);
        return `<tr><td class="mono">${q.numero}</td><td class="mono">${rs.length}</td><td class="mono">${fmtMoney(rs.reduce((s, r) => s + r.valor, 0))}</td></tr>`;
      }).join('')}</tbody>
    </table></div></div>`;
  icons();
  renderUtilizacaoQuartos('chQuartos', DB);
}

function renderConfiguracoes() {
  document.getElementById('content').innerHTML = `
    <div class="grid g-2">
      <div class="card">
        <div class="card-title">Dados do complexo</div>
        <div class="field mt-16"><label>Nome do sistema</label><input value="TROPICANA — Sistema de Gestão do Complexo" disabled></div>
        <div class="field"><label>Moeda</label><input value="MT (Metical Moçambicano)" disabled></div>
        <div class="field"><label>Idioma</label><input value="Português (Moçambique)" disabled></div>
        <button class="btn btn-ghost" onclick="notImplemented('Edição de configurações')">${ic('save')} Guardar alterações</button>
      </div>
      <div class="card">
        <div class="card-title">Dados de demonstração</div>
        <p class="card-sub">Este é um protótipo. Pode repor todos os dados fictícios para o estado inicial.</p>
        <button class="btn btn-danger" onclick="confirmResetData()">${ic('refresh-ccw')} Repor dados de demonstração</button>
      </div>
    </div>`;
  icons();
}
function confirmResetData() {
  confirmAction('Isto irá repor todos os dados fictícios do protótipo. Deseja continuar?', () => { DB = resetDatabase(); showToast('Dados repostos com sucesso.'); renderConfiguracoes(); });
}

function renderPerfil() {
  const u = DB.usuarios.find(x => x.id === session.id);
  document.getElementById('content').innerHTML = `
    <div class="card" style="max-width:520px;">
      <div class="flex gap-16" style="align-items:center; margin-bottom:20px;">
        <div class="avatar" style="width:64px;height:64px;font-size:1.4rem;">${session.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}</div>
        <div><h2 style="font-size:1.2rem;">${session.nome}</h2><span class="badge badge-dourado">${session.perfil}</span></div>
      </div>
      <div class="field"><label>Nome</label><input value="${u.nome}" disabled></div>
      <div class="field"><label>Email</label><input value="${u.email}" disabled></div>
      <div class="field"><label>Telefone</label><input value="${u.telefone}" disabled></div>
      <div class="field"><label>Último acesso</label><input value="${fmtDateTime(u.ultimoAcesso)}" disabled></div>
      <button class="btn btn-primary" onclick="notImplemented('Edição de perfil')">${ic('pencil')} Editar perfil</button>
    </div>`;
  icons();
}
