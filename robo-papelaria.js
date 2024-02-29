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

let nomeUser="";

client.on("message", async (message) => {
  if (message.body.toLowerCase() === "!oie") {
    await client.sendMessage(message.from, "Bem vindo a papelaria do Thiago!");
    await client.sendMessage(message.from, "Olá, Qual o seu nome?");
    userStages[message.from] = "menu";
    return;
  }

  const currentStage = userStages[message.from];

  switch (currentStage) {
    case "menu":
      nomeUser = message.body;
      userStages[message.from] = "Opções";
      await client.sendMessage(
        message.from,
        "Olá, " + nomeUser + ", como posso te ajudar?"
      );
      await client.sendMessage(
        message.from,
        "1- Quero saber mais sobre os produtos\n2- Quero saber mais sobre as promoções\n3- Quero falar com um atendente\n4- Quero saber mais sobre a loja"
      );
      return;

    case "Opções":
      switch (message.body) {
        case "1":
          userStages[message.from] = "produtos";
          await client.sendMessage(
            message.from,
            "Nossos produtos incluem papel, canetas, cadernos e muito mais. Qual produto específico você gostaria de saber mais?\n 1- Papel\n 2- Canetas\n 3- Cadernos\n 4- Outros\n 5- Voltar ao menu principal"
          );
          return;
        case "2":
          await client.sendMessage(
            message.from,
            "Atualmente, temos uma promoção de 20% de desconto em todos os produtos de papelaria. Aproveite! Há algo mais que você gostaria de saber?"
          );
          break;
        case "3":
          await client.sendMessage(
            message.from,
            "Um de nossos atendentes estará disponível para falar com você em breve. Enquanto isso, há algo mais que possa ajudá-lo?"
          );
          break;
        case "4":
          await client.sendMessage(
            message.from,
            "Nossa loja está localizada na Rua Principal, número 123. Venha nos visitar! Existe algo mais que você gostaria de saber?"
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

    case "produtos":
      switch (message.body) {
        case "1":
          // Informações sobre papel
          await client.sendMessage(message.from, "Informações sobre papel...");
          break;
        case "2":
          // Informações sobre canetas
          await client.sendMessage(
            message.from,
            "Informações sobre canetas..."
          );
          break;
        case "3":
          // Informações sobre cadernos
          await client.sendMessage(
            message.from,
            "Informações sobre cadernos..."
          );
          break;
        case "4":
          // Informações sobre outros produtos
          await client.sendMessage(
            message.from,
            "Informações sobre outros produtos..."
          );
          break;
        case "5":
          userStages[message.from] = "Opções";
          await client.sendMessage(
            message.from,
            "Voltando ao menu principal. Escolha uma opção:\n1- Quero saber mais sobre os produtos\n2- Quero saber mais sobre as promoções\n3- Quero falar com um atendente\n4- Quero saber mais sobre a loja"
          );
          break;
        default:
          await client.sendMessage(
            message.from,
            "Opção inválida. Por favor, escolha uma opção válida."
          );
          return;
      }
      return;

    case "return_to_menu":
      if (message.body.toLowerCase() === "sim") {
        userStages[message.from] = "Opções";
        await client.sendMessage(
          message.from,
          "De volta ao menu principal. Escolha uma opção:\n1- Quero saber mais sobre os produtos\n2- Quero saber mais sobre as promoções\n3- Quero falar com um atendente\n4- Quero saber mais sobre a loja"
        );
      } else if (message.body.toLowerCase() === "não" || message.body.toLowerCase() === "nao") {
        await client.sendMessage(
          message.from,
          "Ok " + nomeUser + ", se precisar de mais alguma coisa estou por aqui!"
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
