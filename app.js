// TEMA - MODO ESCURO/CLARO
function initTheme() {
  const savedTheme = localStorage.getItem("theme") || "light";
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = savedTheme || (prefersDark ? "dark" : "light");
  
  setTheme(theme);
}

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  updateThemeIcon();
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
  const newTheme = currentTheme === "light" ? "dark" : "light";
  setTheme(newTheme);
}

function updateThemeIcon() {
  const icon = document.getElementById("theme-toggle");
  const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
  if (icon) {
    icon.innerHTML = currentTheme === "light" 
      ? '<span class="theme-icon">🌙</span>' 
      : '<span class="theme-icon">☀️</span>';
  }
}

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

// Função para deletar um gasto
function deletarGasto(index, dados) {
  if (confirm("Tem certeza que deseja deletar este gasto?")) {
    // Deleta da planilha do Google Sheets
    const linha = dados[index];
    const url = 
      "https://script.google.com/macros/s/AKfycbz9JAR1w_7Fm7TyYDIg_4AaOgOMF_mR76E0uBWINLG1orLKbq9y2RW8mhRIowUSXLHXQw/exec" +
      `?acao=deletar&data=${encodeURIComponent(linha[0])}&categoria=${encodeURIComponent(linha[1])}&valor=${encodeURIComponent(linha[2])}`;
    
    fetch(url)
      .then(res => res.text())
      .then(resposta => {
        if (resposta === "DELETADO" || resposta.includes("deletado")) {
          listarGastos();
          alert("Gasto deletado com sucesso!");
        }
      })
      .catch(err => {
        console.error("Erro ao deletar:", err);
        alert("Deletado (será sincronizado)");
        listarGastos();
      });
  }
}

// Função para editar um gasto
function editarGasto(index, dados) {
  const linha = dados[index];
  const categoria = linha[1];
  const valor = linha[2];
  const descricao = linha[3];
  const data = linha[0];

  // Preenche o formulário com os valores do gasto
  document.getElementById("categoria").value = categoria;
  document.getElementById("valor").value = valor;
  document.getElementById("descricao").value = descricao || "";

  // Deleta o gasto anterior
  setTimeout(() => {
    deletarGasto(index, dados);
  }, 100);

  // Scroll para o formulário
  document.querySelector(".form-section").scrollIntoView({ behavior: "smooth" });
}

let chartPizza = null;
let chartBarra = null;
let gastosDados = [];

function listarGastos() {
  fetch("https://script.google.com/macros/s/AKfycbz9JAR1w_7Fm7TyYDIg_4AaOgOMF_mR76E0uBWINLG1orLKbq9y2RW8mhRIowUSXLHXQw/exec")
    .then(res => res.json())
    .then(dados => {
      // Remove a primeira linha (header) e filtra linhas vazias
      let dadosLimpos = dados.slice(1).filter(linha => {
        // Verifica se a linha tem dados válidos (categoria e valor)
        return linha && linha[1] && linha[1].trim() && linha[2] && !isNaN(Number(linha[2]));
      });
      
      gastosDados = dadosLimpos; // Armazena os dados globalmente para usar no chat

      // Atualizar histórico
      const lista = document.getElementById("lista-gastos");
      lista.innerHTML = "";

      if (dadosLimpos.length === 0) {
        lista.innerHTML = "<p class='sem-dados'>Nenhum gasto registrado</p>";
      } else {
        dadosLimpos.reverse().forEach((linha, index) => {
          const div = document.createElement("div");
          div.className = "gasto-item";
          const realIndex = dadosLimpos.length - 1 - index;
          div.innerHTML = `
            <div class="gasto-info">
              <div class="gasto-categoria">${linha[1]}</div>
              <div class="gasto-descricao">${linha[3] || "Sem descrição"}</div>
              <div class="gasto-data">${linha[0]}</div>
            </div>
            <div class="gasto-actions">
              <div class="gasto-valor">R$ ${parseFloat(linha[2]).toFixed(2)}</div>
              <div class="action-buttons">
                <button class="btn-acao btn-editar" onclick="editarGasto(${realIndex}, gastosDados)" title="Editar">✎</button>
                <button class="btn-acao btn-deletar" onclick="deletarGasto(${realIndex}, gastosDados)" title="Deletar">✕</button>
              </div>
            </div>
          `;
          lista.appendChild(div);
        });
      }

      // Atualizar estatísticas
      const total = calcularTotal(dadosLimpos);
      document.getElementById("total-gasto").textContent = "R$ " + total.toFixed(2).replace(".", ",");
      document.getElementById("total-transacoes").textContent = dadosLimpos.length;

      // Encontrar maior categoria
      const porCategoria = totalPorCategoria(dadosLimpos);
      const maiorCat = Object.keys(porCategoria).length > 0 
        ? Object.keys(porCategoria).reduce((a, b) => 
            porCategoria[a] > porCategoria[b] ? a : b
          )
        : "-";
      document.getElementById("maior-categoria").textContent = maiorCat || "-";

      // Atualizar totais por categoria
      atualizarTotaisPorCategoria(porCategoria);

      // Atualizar gráficos
      atualizarGraficos(dadosLimpos);
    })
    .catch(err => {
      console.error("Erro ao carregar gastos:", err);
    });
}

function atualizarTotaisPorCategoria(porCategoria) {
  const container = document.getElementById("categoria-totais");
  container.innerHTML = "";

  const categorias = Object.entries(porCategoria).sort((a, b) => b[1] - a[1]);

  if (categorias.length === 0) {
    container.innerHTML = "<p class='sem-dados'>Nenhum gasto registrado</p>";
    return;
  }

  categorias.forEach(([categoria, valor]) => {
    const div = document.createElement("div");
    div.className = "categoria-total-item";
    div.innerHTML = `
      <span class="categoria-nome">${categoria}</span>
      <span class="categoria-valor">R$ ${valor.toFixed(2).replace(".", ",")}</span>
    `;
    container.appendChild(div);
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
  return dados.reduce((soma, linha) => {
    // Valida se a linha tem o valor e se é um número válido
    const valor = Number(linha[2]);
    return soma + (isNaN(valor) ? 0 : valor);
  }, 0);
}

function totalPorCategoria(dados) {
  const mapa = {};
  dados.forEach(linha => {
    const cat = linha[1];
    const valor = Number(linha[2]);
    
    // Só adiciona se categoria e valor são válidos
    if (cat && cat.trim() && !isNaN(valor) && valor > 0) {
      mapa[cat] = (mapa[cat] || 0) + valor;
    }
  });
  return mapa;
}

// FUNÇÕES DO CHAT BOT
function toggleChat() {
  const panel = document.getElementById("chatbot-panel");
  panel.classList.toggle("open");
}

function enviarPergunta() {
  const input = document.getElementById("chat-input");
  const pergunta = input.value.trim().toLowerCase();

  if (!pergunta) return;

  // Adiciona a pergunta do usuário no chat
  adicionarMensagemChat(pergunta, "user");

  // Processa a pergunta
  const resposta = processarPergunta(pergunta);
  
  // Adiciona a resposta do bot
  setTimeout(() => {
    adicionarMensagemChat(resposta, "bot");
  }, 300);

  input.value = "";
  input.focus();
}

function adicionarMensagemChat(mensagem, tipo) {
  const chatBox = document.getElementById("chat-box");
  const div = document.createElement("div");
  div.className = `chat-message ${tipo}-message`;
  
  const p = document.createElement("p");
  p.textContent = mensagem;
  
  div.appendChild(p);
  chatBox.appendChild(div);
  
  // Auto-scroll para a última mensagem
  chatBox.scrollTop = chatBox.scrollHeight;
}

function processarPergunta(pergunta) {
  if (!gastosDados || gastosDados.length === 0) {
    return "Nenhum gasto registrado ainda. Adicione um gasto para começar!";
  }

  const porCategoria = totalPorCategoria(gastosDados);
  const total = calcularTotal(gastosDados);

  // Questões sobre total
  if (pergunta.includes("qual é o total") || pergunta.includes("total gasto") || pergunta.includes("quanto gastei")) {
    return `O total de gastos é R$ ${total.toFixed(2).replace(".", ",")}`;
  }

  // Quantas transações
  if (pergunta.includes("quantas transações") || pergunta.includes("quantos gastos")) {
    return `Você tem ${gastosDados.length} transação(ões) registrada(s)`;
  }

  // Total por categoria específica
  for (let categoria in porCategoria) {
    if (pergunta.includes(categoria.toLowerCase())) {
      return `Em ${categoria}, você gastou R$ ${porCategoria[categoria].toFixed(2).replace(".", ",")}`;
    }
  }

  // Categoria com mais gastos
  if (pergunta.includes("maior gasto") || pergunta.includes("qual categoria gasto mais") || pergunta.includes("maior categoria")) {
    const maiorCat = Object.keys(porCategoria).reduce((a, b) => 
      porCategoria[a] > porCategoria[b] ? a : b
    );
    return `A categoria com maior gasto é ${maiorCat}, com R$ ${porCategoria[maiorCat].toFixed(2).replace(".", ",")}`;
  }

  // Listar categorias
  if (pergunta.includes("quais são as categorias") || pergunta.includes("categorias") && pergunta.includes("gasto")) {
    const cats = Object.keys(porCategoria).join(", ");
    return `Suas categorias são: ${cats}`;
  }

  // Ajuda
  if (pergunta.includes("ajuda") || pergunta.includes("o que você faz")) {
    return "Posso responder perguntas sobre:\n- Total de gastos\n- Gastos por categoria\n- Quantidade de transações\n- Qual categoria tem maior gasto\n- Quais são suas categorias";
  }

  return "Desculpe, não entendi sua pergunta. Tente perguntar sobre gastos, categorias ou totais!";
}

window.onload = function() {
  initTheme();
  listarGastos();
};

// Recarregar gastos a cada 30 segundos
setInterval(listarGastos, 30000);

// Permitir enviar chat com Enter
document.addEventListener("DOMContentLoaded", function() {
  const chatInput = document.getElementById("chat-input");
  if (chatInput) {
    chatInput.addEventListener("keypress", function(event) {
      if (event.key === "Enter") {
        enviarPergunta();
      }
    });
  }
});


