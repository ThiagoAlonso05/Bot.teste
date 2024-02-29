const { Client, LocalAuth } = require("whatsapp-web.js");

const client = new Client({
  authStrategy: new LocalAuth(),
});

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("Client is ready!");
});

client.initialize();

const userStages = {};

client.on("message", async (message) => {
  if (message.body === "!Oie") {
    await client.sendMessage(message.from, "Bem vindo ao bot do Thiago!");
    await client.sendMessage(message.from, "Olá, Qual o seu nome?");
    userStages[message.from] = "ask_name";
    return;
  }

  const currentStage = userStages[message.from];

  switch (currentStage) {
    case "ask_name":
      const nome = message.body;
      userStages[message.from] = "main_menu";
      await client.sendMessage(
        message.from,
        "Olá, " + nome + ", como posso te ajudar?"
      );
      await client.sendMessage(
        message.from,
        "1 - Quero saber mais sobre o que a Aparecida vai fazer de almoço hoje\n2 - Reserva de horário da TV da sala\n3 - Reclamação anônima de alguém da casa\n4 - Votar para eliminar"
      );
      return;

    case "main_menu":
      switch (message.body) {
        case "1":
          await client.sendMessage(
            message.from,
            "A Aparecida tem um cardápio especial para cada dia da semana!\nHoje ela está fazendo Brócolis, tenho nojo\nMas todos sabem que quinta é dia de macarrão!"
          );
          break;
        case "2":
          await client.sendMessage(
            message.from,
            "Boa sorte, terá que disputar com a Silvana para conseguir a TV da sala!"
          );
          break;
        case "3":
          await client.sendMessage(
            message.from,
            "Mande uma mensagem para o Thiago, ele resolverá a sua reclamação.\nUse o contato (11) 943608015"
          ); //Envia contato de um número específico
          break;
        case "4":
          await client.sendMessage(
            message.from,
            "Acha que estamos no BBB é?! Vai dormir!"
          );
          break;
        default:
          await client.sendMessage(
            message.from,
            "Opção inválida. Por favor, escolha uma opção válida:"
          );
          return;
      }
      userStages[message.from] = "return_to_menu";
      await client.sendMessage(
        message.from,
        "Deseja voltar ao menu principal? Responda SIM para voltar ou NÃO para sair."
      );
      return;

    case "return_to_menu":
      if (message.body.toLowerCase() === "sim") {
        userStages[message.from] = "main_menu";
        await client.sendMessage(
          message.from,
          "De volta ao menu principal. Escolha uma opção:\n1 - Quero saber mais sobre o que a Aparecida vai fazer de almoço hoje\n2 - Reserva de horário da TV da sala\n3 - Reclamação anônima de alguém da casa\n4 - Votar para eliminar"
        );
      } else if (message.body.toLowerCase() === "não") {
        await client.sendMessage(
          message.from,
          "Ok, se precisar de mais alguma coisa estou por aqui!"
        );
        delete userStages[message.from];
      } else {
        userStages[message.from] = "return_to_menu";
        await client.sendMessage(
          message.from,
          "Opção inválida. Por favor, escolha uma opção válida:"
        );
      }
      return;

    default:
      await client.sendMessage(
        message.from,
        "Não entendi. Por favor, digite !Oie para começar."
      );
      break;
  }
});
