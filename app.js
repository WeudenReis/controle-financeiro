function salvarGasto(event) {
  event.preventDefault();

  const categoria = document.getElementById("categoria").value;
  const valor = document.getElementById("valor").value;
  const descricao = document.getElementById("descricao").value;

  if (!categoria || !valor) {
    alert("Preencha categoria e valor");
    return;
  }

  const url =
    "https://script.google.com/macros/s/AKfycbz9JAR1w_7Fm7TyYDIg_4AaOgOMF_mR76E0uBWINLG1orLKbq9y2RW8mhRIowUSXLHXQw/exec" +
    `?categoria=${encodeURIComponent(categoria)}` +
    `&valor=${encodeURIComponent(valor)}` +
    `&descricao=${encodeURIComponent(descricao)}`;

  fetch(url)
    .then(res => res.text())
    .then(resposta => {
      if (resposta === "SALVO") {
        document.getElementById("categoria").value = "";
        document.getElementById("valor").value = "";
        document.getElementById("descricao").value = "";
        listarGastos();
        alert("Gasto salvo com sucesso!");
      } else {
        alert("Erro ao salvar");
        console.error(resposta);
      }
    })
    .catch(err => {
      console.error(err);
      alert("Erro ao salvar");
    });
}

let chartPizza = null;
let chartBarra = null;

function listarGastos() {
  fetch("https://script.google.com/macros/s/AKfycbz9JAR1w_7Fm7TyYDIg_4AaOgOMF_mR76E0uBWINLG1orLKbq9y2RW8mhRIowUSXLHXQw/exec")
    .then(res => res.json())
    .then(dados => {
      // Atualizar histórico
      const lista = document.getElementById("lista-gastos");
      lista.innerHTML = "";

      dados.reverse().forEach((linha, index) => {
        const div = document.createElement("div");
        div.className = "gasto-item";
        div.innerHTML = `
          <div class="gasto-info">
            <div class="gasto-categoria">${linha[1]}</div>
            <div class="gasto-descricao">${linha[3] || "Sem descrição"}</div>
            <div class="gasto-data">${linha[0]}</div>
          </div>
          <div class="gasto-valor">R$ ${parseFloat(linha[2]).toFixed(2)}</div>
        `;
        lista.appendChild(div);
      });

      // Atualizar estatísticas
      const total = calcularTotal(dados);
      document.getElementById("total-gasto").textContent = "R$ " + total.toFixed(2);
      document.getElementById("total-transacoes").textContent = dados.length;

      // Encontrar maior categoria
      const porCategoria = totalPorCategoria(dados);
      const maiorCat = Object.keys(porCategoria).reduce((a, b) => 
        porCategoria[a] > porCategoria[b] ? a : b
      , "");
      document.getElementById("maior-categoria").textContent = maiorCat || "-";

      // Atualizar gráficos
      atualizarGraficos(dados);
    })
    .catch(err => {
      console.error("Erro ao carregar gastos:", err);
    });
}

function atualizarGraficos(dados) {
  const porCategoria = totalPorCategoria(dados);
  const categorias = Object.keys(porCategoria);
  const valores = Object.values(porCategoria);

  // Cores para os gráficos
  const cores = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
  ];

  // Gráfico de Pizza
  const ctxPizza = document.getElementById("chartPizza").getContext("2d");
  if (chartPizza) chartPizza.destroy();
  chartPizza = new Chart(ctxPizza, {
    type: "doughnut",
    data: {
      labels: categorias,
      datasets: [{
        data: valores,
        backgroundColor: cores.slice(0, categorias.length),
        borderWidth: 2,
        borderColor: "#fff"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom"
        }
      }
    }
  });

  // Gráfico de Barras
  const ctxBarra = document.getElementById("chartBarra").getContext("2d");
  if (chartBarra) chartBarra.destroy();
  chartBarra = new Chart(ctxBarra, {
    type: "bar",
    data: {
      labels: categorias,
      datasets: [{
        label: "Gastos por Categoria",
        data: valores,
        backgroundColor: cores.slice(0, categorias.length),
        borderRadius: 5
      }]
    },
    options: {
      responsive: true,
      indexAxis: "y",
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          beginAtZero: true
        }
      }
    }
  });
}

function calcularTotal(dados) {
  return dados.reduce((soma, linha) => soma + Number(linha[2]), 0);
}

function totalPorCategoria(dados) {
  const mapa = {};
  dados.forEach(linha => {
    const cat = linha[1];
    const valor = Number(linha[2]);
    mapa[cat] = (mapa[cat] || 0) + valor;
  });
  return mapa;
}

window.onload = listarGastos;

// Recarregar gastos a cada 30 segundos
setInterval(listarGastos, 30000);

window.onload = listarGastos;

function calcularTotal(dados) {
  return dados.reduce((soma, linha) => soma + Number(linha[2]), 0);
}
 
 function totalPorCategoria(dados) {
  const mapa = {};

  dados.forEach(linha => {
    const cat = linha[1];
    const valor = Number(linha[2]);
    mapa[cat] = (mapa[cat] || 0) + valor;
  });

  return mapa;
}

function salvarOffline(dado) {
  const pendentes = JSON.parse(localStorage.getItem("pendentes") || "[]");
  pendentes.push(dado);
  localStorage.setItem("pendentes", JSON.stringify(pendentes));
}

function sincronizar() {
  const pendentes = JSON.parse(localStorage.getItem("pendentes") || "[]");
  pendentes.forEach(d => {
    // envia via fetch (GET)
  });
  localStorage.removeItem("pendentes");
}

function carregarGastos() {
  const url =
    "https://script.google.com/macros/s/AKfycbz9JAR1w_7Fm7TyYDIg_4AaOgOMF_mR76E0uBWINLG1orLKbq9y2RW8mhRIowUSXLHXQw/exec";

  fetch(url)
    .then(res => res.json())
    .then(dados => {
      const lista = document.getElementById("lista-gastos");
      lista.innerHTML = "";

      dados.reverse().forEach(linha => {
        const li = document.createElement("li");
        li.innerHTML = `
          <strong>${linha[1]}</strong> - R$ ${linha[2]}<br>
          <small>${linha[0]}</small>
        `;
        lista.appendChild(li);
      });
    });
}

// Carregar quando abrir o app


