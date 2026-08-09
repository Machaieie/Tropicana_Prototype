/* ==========================================================================
   TROPICANA — data.js
   Camada de dados: seed fictício + persistência em localStorage
   ========================================================================== */

const DB_KEY = 'tropicana_db_v1';

const CATEGORIAS_PRODUTO = ['Bebidas', 'Comidas', 'Produtos de cozinha', 'Produtos de limpeza', 'Outros'];
const CATEGORIAS_BAR = ['Cervejas', 'Refrigerantes', 'Água', 'Sumos', 'Bebidas alcoólicas', 'Snacks'];

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[rand(0, arr.length - 1)]; }
function pad(n, len = 5) { return String(n).padStart(len, '0'); }
function dateOffset(daysBack, hour = rand(8, 22)) {
  const d = new Date(2026, 7, 8);
  d.setDate(d.getDate() - daysBack);
  d.setHours(hour, rand(0, 59), 0, 0);
  return d.toISOString();
}
function fmtMoney(v) {
  return new Intl.NumberFormat('pt-MZ', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(v)) + ' MT';
}
function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-MZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function fmtDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-MZ', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' +
    d.toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' });
}

const NOMES = ['João Manuel', 'Carlos Machaieie', 'Ana Paulo', 'Maria José', 'Pedro António',
  'Fátima Nhaca', 'Armando Cossa', 'Lúcia Bila', 'Sérgio Matsinhe', 'Isabel Chissano',
  'Domingos Sitoe', 'Beatriz Langa', 'Ernesto Muianga', 'Cristina Tembe', 'Alberto Guambe',
  'Rosa Zunguza', 'Vasco Massingue', 'Helena Mondlane', 'Custódio Nhantumbo', 'Sara Macamo'];

function gerarProdutos() {
  const base = [
    ['2M Cerveja 300ml', 'Cervejas', 45, 80], ['Laurentina Preta 300ml', 'Cervejas', 50, 90],
    ['Manica Cerveja 300ml', 'Cervejas', 45, 80], ['Heineken 330ml', 'Cervejas', 70, 130],
    ['Coca-Cola 300ml', 'Refrigerantes', 25, 50], ['Fanta Laranja 300ml', 'Refrigerantes', 25, 50],
    ['Sprite 300ml', 'Refrigerantes', 25, 50], ['Água Namaacha 500ml', 'Água', 15, 30],
    ['Água Vumba 1.5L', 'Água', 25, 45], ['Sumo Compal 1L', 'Sumos', 60, 110],
    ['Sumo Tropical 300ml', 'Sumos', 30, 55], ['Whisky J&B 750ml', 'Bebidas alcoólicas', 650, 1100],
    ['Vodka Absolut 750ml', 'Bebidas alcoólicas', 700, 1200], ['Gin Gordon\'s 750ml', 'Bebidas alcoólicas', 600, 1000],
    ['Vinho Tinto Português', 'Bebidas alcoólicas', 350, 600], ['Amendoim Torrado', 'Snacks', 20, 40],
    ['Batata Frita Pacote', 'Snacks', 30, 60], ['Bolachas Maria', 'Snacks', 25, 45],
    ['Frango Inteiro (kg)', 'Comidas', 180, 0], ['Arroz (kg)', 'Comidas', 60, 0],
    ['Batata (kg)', 'Comidas', 40, 0], ['Peixe Fresco (kg)', 'Comidas', 220, 0],
    ['Detergente Multiuso', 'Produtos de limpeza', 80, 0], ['Lixívia 1L', 'Produtos de limpeza', 60, 0],
    ['Sabão em Pó', 'Produtos de limpeza', 90, 0], ['Papel Higiénico (pack)', 'Produtos de limpeza', 120, 0],
    ['Óleo Alimentar 1L', 'Produtos de cozinha', 150, 0], ['Sal Fino (kg)', 'Produtos de cozinha', 25, 0],
    ['Açúcar (kg)', 'Produtos de cozinha', 55, 0], ['Farinha de Milho (kg)', 'Produtos de cozinha', 45, 0]
  ];
  return base.map((p, i) => {
    const estoque = rand(2, 120);
    const min = rand(10, 20);
    return {
      id: i + 1,
      codigo: 'PRD-' + pad(i + 1, 4),
      nome: p[0],
      categoria: p[1],
      descricao: `${p[0]} — produto de qualidade para o Complexo Tropicana.`,
      precoCompra: p[2],
      precoVenda: p[3] || Math.round(p[2] * 1.6),
      estoque,
      estoqueMinimo: min,
      estado: estoque === 0 ? 'Esgotado' : estoque <= min ? 'Estoque baixo' : 'Disponível'
    };
  });
}

function gerarUsuarios() {
  const perfis = [
    ['Administrador Tropicana', 'admin@tropicana.co.mz', 'Gestor'],
    ['João Manuel', 'barman@tropicana.co.mz', 'Barman'],
    ['Ana Paulo', 'recepcao@tropicana.co.mz', 'Recepcionista']
  ];
  const extras = ['Carlos Machaieie', 'Maria José', 'Pedro António', 'Fátima Nhaca',
    'Armando Cossa', 'Lúcia Bila', 'Sérgio Matsinhe'];
  const list = perfis.map((p, i) => ({
    id: i + 1, nome: p[0], email: p[1], telefone: '84' + rand(1000000, 9999999),
    perfil: p[2], estado: 'Ativo', ultimoAcesso: dateOffset(rand(0, 2))
  }));
  extras.forEach((n, i) => {
    list.push({
      id: list.length + 1, nome: n, email: n.toLowerCase().replace(/\s+/g, '.') + '@tropicana.co.mz',
      telefone: '82' + rand(1000000, 9999999), perfil: pick(['Barman', 'Recepcionista']),
      estado: pick(['Ativo', 'Ativo', 'Ativo', 'Inativo']), ultimoAcesso: dateOffset(rand(0, 15))
    });
  });
  return list;
}

function gerarClientes() {
  return NOMES.map((n, i) => ({
    id: i + 1, nome: n, telefone: '8' + rand(2, 7) + rand(1000000, 9999999),
    documento: '11' + rand(1000000, 9999999) + 'A',
    visitas: rand(1, 25), ultimaVisita: dateOffset(rand(0, 30)),
    gasto: rand(500, 45000)
  }));
}

function gerarQuartos() {
  const tipos = [
    ['Standard', 500, 2500], ['Standard', 500, 2500], ['Standard', 500, 2500], ['Standard', 500, 2500],
    ['Deluxe', 800, 3800], ['Deluxe', 800, 3800], ['Deluxe', 800, 3800], ['Deluxe', 800, 3800],
    ['Suite', 1500, 6500], ['Suite', 1500, 6500], ['Suite Presidencial', 2500, 9800], ['Suite Presidencial', 2500, 9800]
  ];
  const estados = ['Livre', 'Livre', 'Livre', 'Ocupado', 'Reservado', 'Em limpeza', 'Manutenção'];
  return tipos.map((t, i) => ({
    id: i + 1, numero: 101 + i, tipo: t[0], precoHora: t[1], precoDia: t[2],
    estado: pick(estados)
  }));
}

function gerarVendas(produtos) {
  const vendas = [];
  const formas = ['Dinheiro', 'M-Pesa', 'E-Mola', 'POS', 'Transferência'];
  const operadores = ['João Manuel', 'Carlos Machaieie', 'Sérgio Matsinhe'];
  for (let i = 0; i < 30; i++) {
    const diasAtras = rand(0, 6);
    const nItens = rand(1, 4);
    let total = 0;
    const itens = [];
    for (let j = 0; j < nItens; j++) {
      const p = pick(produtos.filter(pr => pr.categoria === 'Bebidas' || CATEGORIAS_BAR.includes(pr.categoria) || ['Cervejas', 'Refrigerantes', 'Água', 'Sumos', 'Bebidas alcoólicas', 'Snacks'].includes(pr.categoria)));
      const qtd = rand(1, 3);
      const sub = qtd * p.precoVenda;
      total += sub;
      itens.push({ produto: p.nome, qtd, preco: p.precoVenda, subtotal: sub });
    }
    vendas.push({
      id: i + 1, numero: 'VND-2026-' + pad(96 + i),
      data: dateOffset(diasAtras), operador: pick(operadores),
      itens, total, pagamento: pick(formas), status: pick(['Concluída', 'Concluída', 'Concluída', 'Cancelada'])
    });
  }
  return vendas.sort((a, b) => new Date(b.data) - new Date(a.data));
}

function gerarReservas(quartos) {
  const reservas = [];
  const estados = ['Confirmada', 'Em curso', 'Concluída', 'Cancelada'];
  for (let i = 0; i < 20; i++) {
    const q = pick(quartos);
    const diasAtras = rand(-3, 10);
    const dias = rand(1, 4);
    const valor = dias * q.precoDia;
    reservas.push({
      id: i + 1, codigo: 'RES-2026-' + pad(40 + i),
      cliente: pick(NOMES), quarto: q.numero,
      entrada: dateOffset(diasAtras > 0 ? diasAtras : 0),
      saida: dateOffset(diasAtras > 0 ? diasAtras - dias : -dias),
      duracao: dias + ' dia(s)', valor,
      estado: pick(estados)
    });
  }
  return reservas;
}

function gerarRefeicoes() {
  const pratos = [
    ['Frango grelhado', 350], ['Hambúrguer', 280], ['Pizza', 420], ['Peixe grelhado', 480], ['Matapa', 250],
    ['Arroz de marisco', 550], ['Costeleta de porco', 380], ['Salada tropical', 200]
  ];
  const refs = [];
  for (let i = 0; i < 15; i++) {
    const p = pick(pratos);
    const qtd = rand(3, 35);
    refs.push({
      id: i + 1, nome: p[0], quantidade: qtd, preco: p[1], total: qtd * p[1],
      data: dateOffset(rand(0, 5)), responsavel: pick(NOMES)
    });
  }
  return refs;
}

function gerarDespesas() {
  const categorias = ['Energia', 'Água', 'Salários', 'Compras', 'Manutenção', 'Limpeza', 'Alimentação', 'Outros'];
  const desc = {
    Energia: 'Fatura EDM', Água: 'Fatura FIPAG', Salários: 'Pagamento de salários',
    Compras: 'Compra de mercadoria', Manutenção: 'Reparação de equipamento',
    Limpeza: 'Material de limpeza', Alimentação: 'Compra de géneros alimentícios', Outros: 'Despesa diversa'
  };
  const despesas = [];
  for (let i = 0; i < 20; i++) {
    const cat = pick(categorias);
    despesas.push({
      id: i + 1, data: dateOffset(rand(0, 28)), descricao: desc[cat], categoria: cat,
      valor: cat === 'Salários' ? rand(8000, 25000) : rand(500, 12000),
      responsavel: pick(NOMES)
    });
  }
  return despesas.sort((a, b) => new Date(b.data) - new Date(a.data));
}

function seedDatabase() {
  const produtos = gerarProdutos();
  const quartos = gerarQuartos();
  const db = {
    usuarios: gerarUsuarios(),
    produtos,
    clientes: gerarClientes(),
    quartos,
    vendas: gerarVendas(produtos),
    reservas: gerarReservas(quartos),
    movimentos: [],
    refeicoes: gerarRefeicoes(),
    despesas: gerarDespesas(),
    notificacoes: [
      { tipo: 'danger', texto: 'Água mineral está com estoque baixo.', data: dateOffset(0) },
      { tipo: 'warning', texto: '3 quartos estão em manutenção.', data: dateOffset(0) },
      { tipo: 'success', texto: 'Venda VND-2026-00125 realizada com sucesso.', data: dateOffset(0) },
      { tipo: 'info', texto: 'Novo cliente registado.', data: dateOffset(0) }
    ],
    seq: { venda: 126, reserva: 60, recibo: 126 }
  };
  localStorage.setItem(DB_KEY, JSON.stringify(db));
  return db;
}

function getDB() {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) return seedDatabase();
  try { return JSON.parse(raw); } catch (e) { return seedDatabase(); }
}

function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function resetDatabase() {
  localStorage.removeItem(DB_KEY);
  return seedDatabase();
}
