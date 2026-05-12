// script.js

const SUPABASE_URL =
  "https://asiqjchjamvmpaslnqxd.supabase.co";

const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzaXFqY2hqYW12bXBhc2xucXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMDUwMDUsImV4cCI6MjA5MzY4MTAwNX0.ixfkIS1yQi-cUaJ6SqsgLmWeZOpGLEm8W--SXxIZ1Ys";

const client = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const form =
  document.getElementById("clienteForm");

const vencidosDiv =
  document.getElementById("vencidos");

const proximosDiv =
  document.getElementById("proximos");

const ativosDiv =
  document.getElementById("ativos");

const pesquisa =
  document.getElementById("pesquisa");

const totalVencidos =
  document.getElementById("totalVencidos");

const totalProximos =
  document.getElementById("totalProximos");

const totalAtivos =
  document.getElementById("totalAtivos");

let clientes = [];

buscarClientes();

form.addEventListener("submit", async (e) => {

  e.preventDefault();

  const nome =
    document.getElementById("nome").value;

  const telefone =
    document.getElementById("telefone").value;

  const dataPagamento =
    document.getElementById("dataPagamento").value;

  const meses =
    parseInt(
      document.getElementById("meses").value
    );

  const vencimento =
    new Date(dataPagamento);

  vencimento.setMonth(
    vencimento.getMonth() + meses
  );

  const { error } = await client
    .from("clientes")
    .insert([
      {
        nome,
        telefone,
        data_pagamento: dataPagamento,
        meses,
        vencimento:
          vencimento.toISOString()
      }
    ]);

  if (error) {

    console.error(error);

    alert("Erro ao cadastrar");

    return;
  }

  form.reset();

  buscarClientes();

});

pesquisa.addEventListener("input", () => {

  renderClientes(
    pesquisa.value.toLowerCase()
  );

});

async function buscarClientes() {

  const { data, error } = await client
    .from("clientes")
    .select("*")
    .order("id", {
      ascending: false
    });

  if (error) {

    console.error(error);

    return;
  }

  clientes = data;

  renderClientes();

}

function renderClientes(filtro = "") {

  vencidosDiv.innerHTML = "";
  proximosDiv.innerHTML = "";
  ativosDiv.innerHTML = "";

  let vencidos = 0;
  let proximos = 0;
  let ativos = 0;

  const hoje = new Date();

  clientes.forEach(cliente => {

    if (
      !cliente.nome
        .toLowerCase()
        .includes(filtro)
    ) {
      return;
    }

    const vencimento =
      new Date(cliente.vencimento);

    const diff = Math.ceil(
      (vencimento - hoje)
      / (1000 * 60 * 60 * 24)
    );

    let classe = "ativo";
    let status = "Ativo";

    if (diff < 0) {

      classe = "vencido";
      status = "Vencido";

      vencidos++;

    }
    else if (diff <= 7) {

      classe = "proximo";
      status = "Vence em breve";

      proximos++;

    }
    else {

      ativos++;

    }

    const card = `
      <div class="card ${classe}">

        <h3>${cliente.nome}</h3>

        <p>
          📞 ${cliente.telefone}
        </p>

        <p>
          📅 Pagamento:
          ${new Date(
            cliente.data_pagamento
          ).toLocaleDateString()}
        </p>

        <p>
          ⏳ Vence em:
          ${vencimento.toLocaleDateString()}
        </p>

        <p>
          📦 Plano:
          ${cliente.meses} mês(es)
        </p>

        <p>
          <strong>Status:</strong>
          ${status}
        </p>

        <div class="botoes">

          <button
            onclick="renovarPlano(${cliente.id}, 1)"
          >
            +1 mês
          </button>

          <button
            onclick="renovarPlano(${cliente.id}, 2)"
          >
            +2 meses
          </button>

          <button
            onclick="renovarPlano(${cliente.id}, 3)"
          >
            +3 meses
          </button>

          <button
            class="excluir"
            onclick="excluirCliente(${cliente.id})"
          >
            Excluir
          </button>

        </div>

      </div>
    `;

    if (classe === "vencido") {

      vencidosDiv.innerHTML += card;

    }
    else if (classe === "proximo") {

      proximosDiv.innerHTML += card;

    }
    else {

      ativosDiv.innerHTML += card;

    }

  });

  totalVencidos.innerText = vencidos;
  totalProximos.innerText = proximos;
  totalAtivos.innerText = ativos;

}

async function renovarPlano(
  id,
  mesesAdicionar
) {

  const { data, error } = await client
    .from("clientes")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {

    console.error(error);

    return;
  }

  const vencimentoAtual =
    new Date(data.vencimento);

  vencimentoAtual.setMonth(
    vencimentoAtual.getMonth()
    + mesesAdicionar
  );

  const { error: updateError } =
    await client
      .from("clientes")
      .update({
        vencimento:
          vencimentoAtual.toISOString(),

        meses:
          data.meses + mesesAdicionar
      })
      .eq("id", id);

  if (updateError) {

    console.error(updateError);

    return;
  }

  buscarClientes();

}

async function excluirCliente(id) {

  const confirmar = confirm(
    "Deseja excluir este cliente?"
  );

  if (!confirmar) return;

  const { error } = await client
    .from("clientes")
    .delete()
    .eq("id", id);

  if (error) {

    console.error(error);

    return;
  }

  buscarClientes();

}