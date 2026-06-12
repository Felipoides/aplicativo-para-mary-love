# Para Mary

Aplicativo romantico multiplataforma feito com Expo e React Native. A primeira versao agenda uma notificacao diaria com uma mensagem carinhosa no horario escolhido.

## Rodar o projeto

Instale Node.js primeiro. Depois, nesta pasta:

```sh
npm install
npm start
```

Nesta maquina, o Node foi instalado localmente em `~/.local/node/current`. Se o terminal nao encontrar `node` ou `npm`, use:

```sh
export PATH="$HOME/.local/node/current/bin:$PATH"
```

Para testar no celular, instale o Expo Go e escaneie o QR Code que aparecer no terminal.

## Android e iOS

- Android: funciona pelo Expo Go e tambem pode virar APK/AAB com EAS Build.
- iOS: funciona pelo Expo Go em modo de desenvolvimento; para publicar ou distribuir build nativa, use uma conta Apple Developer.

## Proximas ideias

- Biblioteca de frases por humor: saudade, incentivo, bom dia, boa noite.
- Notificacoes surpresa em dias especiais.
- Tela de contador de tempo juntos.
- Galeria de memorias com fotos.
- Botao para enviar um carinho manualmente.
