function salvarGasto() {
  const categoria = document.getElementById("categoria").value;
  const valor = document.getElementById("valor").value;
  const descricao = document.getElementById("descricao").value;

  fetch("https://script.google.com/macros/s/AKfycbz9JAR1w_7Fm7TyYDIg_4AaOgOMF_mR76E0uBWINLG1orLKbq9y2RW8mhRIowUSXLHXQw/exec", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      categoria,
      valor,
      descricao
    })
  })
  .then(() => {
    alert("Gasto salvo com sucesso!");
  })
  .catch(() => {
    alert("Erro ao salvar gasto");
  });
}



function listarGastos() {
  fetch("https://script.google.com/macros/s/AKfycbz9JAR1w_7Fm7TyYDIg_4AaOgOMF_mR76E0uBWINLG1orLKbq9y2RW8mhRIowUSXLHXQw/exec")
    .then(res => res.json())
    .then(dados => {
      const lista = document.getElementById("lista-gastos");
      lista.innerHTML = "";

      dados.forEach(linha => {
        const li = document.createElement("li");
        li.textContent = `${linha[0]} | ${linha[1]} - R$ ${linha[2]} (${linha[3]})`;
        lista.appendChild(li);
      });
    });
} 

window.onload = listarGastos;

function calcularTotal(dados) {
  return dados.reduce((soma, linha) => soma + Number(linha[2]), 0);
}
 const total = calcularTotal(dados);
document.getElementById("total").textContent =
  "Total: R$ " + total.toFixed(2);
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
carregarGastos();

