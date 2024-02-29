const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");

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

const HORARIOS_GROUP_ID = "120363224633879184@g.us"; // ID do grupo de horários
const userStages = {};
const userData = {};

client.on("message", async (message) => {
  try {
    if (message.body.toLowerCase() === "!oie") {
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
        const horariosDisponiveis = await buscarHorariosDisponiveis();
        let mensagemHorarios =
          "Horários disponíveis:\n" + horariosDisponiveis.join("\n");
        await client.sendMessage(message.from, mensagemHorarios);
        userStages[message.from] = "confirmarHorario";
        break;

      case "confirmarHorario":
        const horarioEscolhido = message.body;
        const reservaFeita = await reservarHorario(
          horarioEscolhido.trim(),
          message.from
        );
        userStages[message.from] = "fim";
        if (reservaFeita) {
          userData[message.from].horario = horarioEscolhido;
          await enviarConfirmacaoReserva(message.from, horarioEscolhido);
        } else {
          await client.sendMessage(
            message.from,
            "Erro ao reservar o horário, tente outro."
          );
        }

      case "fim":
        const dadosColetados = `Dados coletados:\nNome: ${
          userData[message.from].nome
        }\nCPF: ${userData[message.from].cpf}\nTelefone: ${
          userData[message.from].telefone
        }\nHorário de visita: ${userData[message.from].horario}`;
        await client.sendMessage(HORARIOS_GROUP_ID, dadosColetados);

        await client.sendMessage(
          message.from,
          "Se precisar alterar alguma informação, digite !Oie para recomeçar."
        );
        delete userData[message.from];
        delete userStages[message.from];
        break;

      default:
        await client.sendMessage(
          message.from,
          "Não entendi. Por favor, digite !Oie para começar."
        );
        break;
    }
  } catch (error) {
    console.error("Erro no processamento da mensagem: ", error);
    await client.sendMessage(
      message.from,
      "Desculpe, ocorreu um erro. Por favor, tente novamente."
    );
  }
});

async function buscarHorariosDisponiveis() {
  const horariosGroup = await client.getChatById(HORARIOS_GROUP_ID);
  const mensagens = await horariosGroup.fetchMessages({ limit: 100 });

  const horariosDisponiveis = [];

  mensagens.forEach((msg) => {
    // Separa a mensagem em linhas e verifica cada linha individualmente
    const linhas = msg.body.split("\n");
    linhas.forEach((linha) => {
      if (linha.includes("Disponível")) {
        const horario = linha.split(" - ")[0];
        horariosDisponiveis.push(horario);
      }
    });
  });

  console.log(horariosDisponiveis);
  return horariosDisponiveis;
}

async function reservarHorario(horarioEscolhido, from) {
  let horariosDisponiveis = await buscarHorariosDisponiveis();
  let horarioReservado = false;

  const horariosAtualizados = horariosDisponiveis.map((horario) => {
    if (horario === horarioEscolhido) {
      horarioReservado = true;
      return `${horario} - Reservado`;
    }
    return `${horario} - Disponível`;
  });

  if (horarioReservado) {
    // Enviar a nova lista de horários com a reserva atualizada
    await client.sendMessage(
      HORARIOS_GROUP_ID,
      `Horários disponíveis:\n${horariosAtualizados.join("\n")}`
    );
    return true;
  } else {
    await client.sendMessage(from, "Horário não encontrado ou já reservado.");
    return false;
  }
}

async function enviarConfirmacaoReserva(from, horarioEscolhido) {
  // Implementação da lógica para enviar a confirmação de reserva
  await client.sendMessage(
    from,
    `Sua reserva para ${horarioEscolhido} foi confirmada!`
  );
}
