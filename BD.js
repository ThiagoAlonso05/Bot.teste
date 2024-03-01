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

client.on("message", async (message) => {
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

  switch (currentStage) {
    case "nome":
      userData[message.from].nome = message.body;
      userStages[message.from] = "cpf";
      await client.sendMessage(message.from,"Agora, por favor, informe seu CPF.");
      break;

    case "cpf":
      userData[message.from].cpf = message.body;
      userStages[message.from] = "telefone";
      await client.sendMessage(message.from, "Qual é o seu telefone?");
      break;

    case "telefone":
      userData[message.from].telefone = message.body;
      const horariosDisponiveis = await buscarHorariosDisponiveis();
      let mensagemHorarios = "Horários disponíveis:\n" + horariosDisponiveis.join("\n");
      await client.sendMessage(message.from, mensagemHorarios);
      userStages[message.from] = "confirmarHorario";
      break;

    case "confirmarHorario":
      const horarioEscolhido = message.body;
        userData[message.from].horario = horarioEscolhido;
        await enviarConfirmacaoReserva(message.from, horarioEscolhido);
      atualizarHorarioDisponibilidade(horarioEscolhido.trim());
      await client.sendMessage(message.from, "Se precisar alterar alguma informação, digite !iniciar para recomeçar.");
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
});

async function buscarHorariosDisponiveis() {
  return new Promise((resolve, reject) => {
    connection.query(
      "SELECT horario FROM HorariosDisponiveis WHERE disponivel = 1",
      (error, results, fields) => {
        if (error) {
          reject(error);
        } else {
          const horariosDisponiveis = results.map((row) => row.horario);
          console.log(horariosDisponiveis);
          resolve(horariosDisponiveis);
        }
      }
    );
  });
}

async function enviarConfirmacaoReserva(from, horarioEscolhido) {
  // Implementação da lógica para enviar a confirmação de reserva
  await client.sendMessage(from,`Sua reserva para ${horarioEscolhido} foi confirmada!`);
  inserirDadosReserva(
    userData[from].horario,
    userData[from].nome,
    userData[from].cpf,
    userData[from].telefone
  );
}

function inserirDadosReserva(horario, nome, cpf, telefone) {
  const query = "INSERT INTO Reserva (horarioReserva, Nome, CPF, Telefone) VALUES (?, ?, ?, ?)";
  connection.query(query,[horario, nome, cpf, telefone],(error, results, fields) => {
      if (error) {
        console.error("Erro ao inserir dados na reserva:", error);
        return;
      }
      console.log("Dados da reserva inseridos com sucesso, ID da reserva:", results.insertId);
      atualizarHorarioDisponibilidade(horario);
    }
  );
}

function atualizarHorarioDisponibilidade(horarioSelecionado) {
  const query ="UPDATE HorariosDisponiveis SET disponivel = false WHERE horario = ?";
  connection.query(query, [horarioSelecionado], (error, results, fields) => {
    if (error) {
      console.error("Erro ao atualizar horário:", error);
      return;
    }
    console.log("Horário atualizado com sucesso.");
  });
}
