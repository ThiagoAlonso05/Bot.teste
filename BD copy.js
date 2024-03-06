const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");
const mysql = require("mysql");

// Configuração da conexão com o banco de dados
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "Calendario",
});
connection.connect();

// Auth do WhatsApp
const client = new Client({
  authStrategy: new LocalAuth(),
});

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("ready", async () => {
  console.log("Client is ready!");
});

client.initialize();

const userStages = {};
const userData = {};

// Inicio do bot

const TIMEOUT_DURATION = 30000; // 5 minutos, por exemplo
const userTimeouts = {};

async function resetUserState(user) {
  delete userData[user];
  delete userStages[user];
  await client.sendMessage(user, "Você ficou inativo por um tempo e sua sessão foi reiniciada. Por favor, digite !iniciar para começar novamente.");
}

let atendimento = false;
client.on("message", async (message) => {
  if (userTimeouts[message.from]) {
    clearTimeout(userTimeouts[message.from]);
  }
  if (atendimento == false) {
    if (message.body.toLowerCase() === "!iniciar") {
      await client.sendMessage(message.from, "Bem vindo ao nosso serviço!");
      await client.sendMessage(message.from, "Por favor, diga seu nome.");
      userStages[message.from] = "nome";
      return;
    }

    const currentStage = userStages[message.from];

    if (!userData[message.from]) {
      userData[message.from] = {};
    }

    // Lógica para cada etapa do atendimento
    switch (currentStage) {
      case "nome":
        userData[message.from].nome = message.body;
        userStages[message.from] = "cpf";
        await client.sendMessage(
          message.from,
          "Agora, por favor, informe seu CPF."
        );
        break;

      case "cpf":
        userData[message.from].cpf = message.body;
        userStages[message.from] = "telefone";
        await client.sendMessage(message.from, "Qual é o seu telefone?");
        break;

      case "telefone":
        userData[message.from].telefone = message.body;
        await client.sendMessage(
          message.from,
          "Escolha uma das opções abaixo:\n" +
            "1. Falar com um atendente\n" +
            "2. Realizar uma reserva\n" +
            "3. Horário de atendimento\n" +
            "4. Saber sobre nossos produtos"
        );
        userStages[message.from] = "menuOpcoes";
        break;

      case "menuOpcoes":
        switch (message.body) {
          case "1":
            // Continuar com o fluxo da reserva que já existe
            await client.sendMessage(
              message.from,
              "Você será conectado com um atendente. Por favor, aguarde."
            );
            // Implementar a lógica de conexão com o atendente
            atendimento = true;

            break;

          case "2":
            // Código para falar com um atendente
            const diasDisponiveis = await buscarDias();
            let mensagemDias =
              "Dias disponíveis:\n" +
              diasDisponiveis.map(formatarData).join("\n");
            await client.sendMessage(message.from, mensagemDias);
            userStages[message.from] = "data";
            break;

          case "3":
            // Código para informar o horário de atendimento
            await client.sendMessage(
              message.from,
              "Nosso horário de atendimento é de Segunda a Sexta, das 9h às 18h."
            );
            break;

          case "4":
            // Código para informar sobre os produtos
            await client.sendMessage(
              message.from,
              "Nossos produtos incluem..."
            );
            // Detalhar informações dos produtos
            break;

          default:
            await client.sendMessage(
              message.from,
              "Opção inválida. Por favor, escolha uma das opções disponíveis."
            );
            break;
        }
        break;

      case "data":
        userData[message.from].data = message.body;
        const dataFormatadaParaMySQL = converterDataSQL(
          userData[message.from].data
        );
        const horariosDisponiveis = await buscarHorarios(
          dataFormatadaParaMySQL
        );
        let mensagemHorarios =
          "Horários disponíveis:\n" + horariosDisponiveis.join("\n");
        await client.sendMessage(message.from, mensagemHorarios);
        userStages[message.from] = "confirmarHorario";
        break;

      case "confirmarHorario":
        const horarioEscolhido = message.body;
        userData[message.from].horario = horarioEscolhido;
        await enviarConfirmacao(message.from, horarioEscolhido);
        await client.sendMessage(
          message.from,
          "Se precisar alterar alguma informação, digite !iniciar para recomeçar."
        );

        delete userData[message.from];
        delete userStages[message.from];
        break;

      default:
        await client.sendMessage(
          message.from,
          "Não entendi. Por favor, digite !iniciar para começar."
        );
        break;
    }
    userTimeouts[message.from] = setTimeout(() => {
      console.log(`Timeout expirado para ${message.from}`);
      resetUserState(message.from);
    }, TIMEOUT_DURATION);
  } else {
    if (message.body.toLowerCase() === "!finalizaratendimento") {
      atendimento = false;
      await client.sendMessage(message.from, "Atendimento humano finalizado. Como posso ajudar agora?");
    }
}});

async function buscarHorarios(dataDesejada) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT DATE_FORMAT(h.horario, '%H:%i') as horario
      FROM Disponibilidade d
      JOIN Horarios h ON d.idHorario = h.idHorario
      JOIN Dias di ON d.idDia = di.idDia
      WHERE d.disponivel = 1 AND di.data = ?
    `;
    connection.query(query, [dataDesejada], (error, results) => {
      if (error) {
        reject(error);
      } else {
        const horariosDisponiveis = results.map((row) => row.horario);
        resolve(horariosDisponiveis);
      }
    });
  });
}

async function enviarConfirmacao(from, horarioEscolhido) {
  // Implementação da lógica para enviar a confirmação de reserva
  await client.sendMessage(
    from,
    `Sua reserva para ${horarioEscolhido} foi confirmada!`
  );
  inserirDados(
    converterDataSQL(userData[from].data),
    userData[from].horario,
    userData[from].nome,
    userData[from].cpf,
    userData[from].telefone
  );
}

function inserirDados(dataFormatada, horario, nome, cpf, telefone) {
  const queryReserva =
    "INSERT INTO Reserva (dataReserva, horarioReserva, Nome, CPF, Telefone) VALUES (?, ?, ?, ?, ?)";
  connection.query(
    queryReserva,
    [dataFormatada, horario, nome, cpf, telefone],
    (error, results) => {
      if (error) {
        console.error("Erro ao inserir dados na reserva:", error);
        return;
      }
      console.log(
        "Dados da reserva inseridos com sucesso, ID da reserva:",
        results.insertId
      );
      atualizarHorario(dataFormatada, horario);
    }
  );
}

function atualizarHorario(dataFormatada, horarioSelecionado) {
  const query = `
    UPDATE Disponibilidade d
    JOIN Horarios h ON d.idHorario = h.idHorario
    JOIN Dias di ON d.idDia = di.idDia
    SET d.disponivel = false
    WHERE di.data = ? AND h.horario = ?
  `;
  connection.query(query, [dataFormatada, horarioSelecionado], (error) => {
    if (error) {
      console.error("Erro ao atualizar horário:", error);
      return;
    }
    console.log("Horário atualizado com sucesso.");
  });
}

async function buscarDias() {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT DISTINCT DATE_FORMAT(di.data, '%Y-%m-%d') as data_formatada
      FROM Dias di
      JOIN Disponibilidade d ON di.idDia = d.idDia
      JOIN Horarios h ON d.idHorario = h.idHorario
      WHERE d.disponivel = 1
      GROUP BY di.data
      HAVING COUNT(h.idHorario) > 0
    `;
    connection.query(query, (error, results) => {
      if (error) {
        reject(error);
      } else {
        const diasDisponiveis = results.map((row) => row.data_formatada);
        resolve(diasDisponiveis);
      }
    });
  });
}

function formatarData(data) {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}`;
}

function converterDataSQL(data) {
  const [dia, mes] = data.split("/");
  return `2024-${mes}-${dia}`;
}
