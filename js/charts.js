/* ==========================================================================
   TROPICANA — charts.js
   Funções de renderização de gráficos (Chart.js)
   ========================================================================== */

const CHART_COLORS = {
  verde: '#0F8C5A', verdeClaro: 'rgba(15,140,90,0.15)',
  dourado: '#D6A94C', azul: '#2E7FD1', vermelho: '#E14B4B',
  roxo: '#7C5CBF', cinza: '#B7C2BC'
};
const CHART_PALETTE = [CHART_COLORS.verde, CHART_COLORS.dourado, CHART_COLORS.azul, CHART_COLORS.vermelho, CHART_COLORS.roxo, CHART_COLORS.cinza];

let chartInstances = {};

function destroyChart(id) {
  if (chartInstances[id]) { chartInstances[id].destroy(); delete chartInstances[id]; }
}

function baseGridOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#6B7A74', font: { size: 11 } } },
      y: { grid: { color: '#EEF1EF' }, ticks: { color: '#6B7A74', font: { size: 11 } }, beginAtZero: true }
    }
  };
}

function renderVendas7Dias(canvasId, db) {
  destroyChart(canvasId);
  const labels = [];
  const valores = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(2026, 7, 8);
    d.setDate(d.getDate() - i);
    labels.push(d.toLocaleDateString('pt-MZ', { weekday: 'short' }));
    const diaTotal = db.vendas.filter(v => {
      const vd = new Date(v.data);
      return vd.toDateString() === d.toDateString() && v.status === 'Concluída';
    }).reduce((s, v) => s + v.total, 0);
    valores.push(diaTotal);
  }
  const ctx = document.getElementById(canvasId).getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 240);
  grad.addColorStop(0, 'rgba(15,140,90,0.35)');
  grad.addColorStop(1, 'rgba(15,140,90,0.02)');
  chartInstances[canvasId] = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: valores, borderColor: CHART_COLORS.verde, backgroundColor: grad,
        fill: true, tension: 0.4, pointRadius: 3, pointBackgroundColor: CHART_COLORS.verde, borderWidth: 2.5
      }]
    },
    options: baseGridOptions()
  });
}

function renderReceitasPorArea(canvasId, db) {
  destroyChart(canvasId);
  const bar = db.vendas.filter(v => v.status === 'Concluída').reduce((s, v) => s + v.total, 0);
  const acomodacao = db.reservas.filter(r => r.estado !== 'Cancelada').reduce((s, r) => s + r.valor, 0);
  const cozinha = db.refeicoes.reduce((s, r) => s + r.total, 0);
  const ctx = document.getElementById(canvasId).getContext('2d');
  chartInstances[canvasId] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Bar', 'Acomodação', 'Cozinha'],
      datasets: [{ data: [bar, acomodacao, cozinha], backgroundColor: [CHART_COLORS.verde, CHART_COLORS.dourado, CHART_COLORS.azul], borderWidth: 0 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '68%',
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 16, font: { size: 11 } } } }
    }
  });
}

function renderFormasPagamento(canvasId, db) {
  destroyChart(canvasId);
  const formas = ['Dinheiro', 'M-Pesa', 'E-Mola', 'POS', 'Transferência'];
  const valores = formas.map(f => db.vendas.filter(v => v.pagamento === f && v.status === 'Concluída').reduce((s, v) => s + v.total, 0));
  const ctx = document.getElementById(canvasId).getContext('2d');
  chartInstances[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: { labels: formas, datasets: [{ data: valores, backgroundColor: CHART_PALETTE, borderRadius: 6, maxBarThickness: 34 }] },
    options: baseGridOptions()
  });
}

function renderProdutosMaisVendidos(canvasId, db) {
  destroyChart(canvasId);
  const cont = {};
  db.vendas.filter(v => v.status === 'Concluída').forEach(v => v.itens.forEach(it => {
    cont[it.produto] = (cont[it.produto] || 0) + it.qtd;
  }));
  const arr = Object.entries(cont).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const ctx = document.getElementById(canvasId).getContext('2d');
  chartInstances[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: { labels: arr.map(a => a[0]), datasets: [{ data: arr.map(a => a[1]), backgroundColor: CHART_COLORS.dourado, borderRadius: 6 }] },
    options: { ...baseGridOptions(), indexAxis: 'y' }
  });
}

function renderUtilizacaoQuartos(canvasId, db) {
  destroyChart(canvasId);
  const map = {};
  db.reservas.forEach(r => { map[r.quarto] = (map[r.quarto] || 0) + 1; });
  const labels = Object.keys(map).sort((a, b) => a - b).map(n => 'Q' + n);
  const valores = Object.keys(map).sort((a, b) => a - b).map(k => map[k]);
  const ctx = document.getElementById(canvasId).getContext('2d');
  chartInstances[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ data: valores, backgroundColor: CHART_COLORS.azul, borderRadius: 6, maxBarThickness: 26 }] },
    options: baseGridOptions()
  });
}

function renderRefeicoesMaisVendidas(canvasId, db) {
  destroyChart(canvasId);
  const map = {};
  db.refeicoes.forEach(r => { map[r.nome] = (map[r.nome] || 0) + r.quantidade; });
  const arr = Object.entries(map).sort((a, b) => b[1] - a[1]);
  const ctx = document.getElementById(canvasId).getContext('2d');
  chartInstances[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: { labels: arr.map(a => a[0]), datasets: [{ data: arr.map(a => a[1]), backgroundColor: CHART_COLORS.verde, borderRadius: 6 }] },
    options: { ...baseGridOptions(), indexAxis: 'y' }
  });
}

function renderReceitaDespesaLucro(canvasId, db) {
  destroyChart(canvasId);
  const receita = db.vendas.filter(v => v.status === 'Concluída').reduce((s, v) => s + v.total, 0)
    + db.reservas.filter(r => r.estado !== 'Cancelada').reduce((s, r) => s + r.valor, 0)
    + db.refeicoes.reduce((s, r) => s + r.total, 0);
  const despesa = db.despesas.reduce((s, d) => s + d.valor, 0);
  const lucro = receita - despesa;
  const ctx = document.getElementById(canvasId).getContext('2d');
  chartInstances[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Receitas', 'Despesas', 'Lucro'],
      datasets: [{ data: [receita, despesa, lucro], backgroundColor: [CHART_COLORS.verde, CHART_COLORS.vermelho, CHART_COLORS.dourado], borderRadius: 8, maxBarThickness: 70 }]
    },
    options: baseGridOptions()
  });
}
