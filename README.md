# 💖 Mary GATA — Para Mary

> Um aplicativo romântico feito com carinho, do início ao fim, para uma pessoa especial.

**Mary GATA** é um app mobile multiplataforma (Android, iOS e Web) que transforma o celular em um cantinho de afeto: ele envia mensagens carinhosas ao longo do dia, guarda cartas de amor, abre surpresas em datas especiais e ainda traz minijogos para distrair e divertir. A ideia é simples e sincera — manter alguém querido por perto, mesmo à distância, com pequenos gestos que aparecem na tela ao longo do dia.

---

## ✨ Funcionalidades

- **🤖 Bot do Amor** — gerador automático de mensagens carinhosas e românticas que cria uma frase nova a cada 24 horas, sem repetir. Usa um sistema combinatório com 7.500+ combinações únicas (20 aberturas × 25 meios × 15 fechamentos), garantindo mais de 20 anos de mensagens diárias inéditas. A mensagem do dia aparece automaticamente no painel admin e na "Frase do Dia" do app.
- **💌 Notificações de amor** — agenda mensagens carinhosas para chegarem no horário escolhido, todos os dias.
- **📖 Cartas de amor** — uma coleção de cartas para ler nos momentos de saudade.
- **🎁 Surpresas** — conteúdos especiais que podem ser liberados remotamente em datas comemorativas.
- **🎮 Central de jogos** — minijogos para passar o tempo:
  - Pega Corações
  - Jogo da Memória
  - Flappy Bird (versão romântica)
- **🎨 Temas personalizáveis** — escolha a aparência do app com o seletor de temas.
- **💕 Corações flutuantes** — animações que deixam a experiência ainda mais fofa.
- **🛠️ Painel administrativo** — uma área (em `admin/`) para gerenciar surpresas, bot do amor e configurações remotas via Firebase.

---

## 🧰 Tecnologias utilizadas

| Categoria | Tecnologia |
|-----------|------------|
| Framework | [React Native](https://reactnative.dev/) `0.81` + [React](https://react.dev/) `19` |
| Plataforma | [Expo](https://expo.dev/) SDK `54` |
| Notificações | `expo-notifications` |
| UI / Visual | `expo-linear-gradient`, `expo-blur`, `expo-font`, `@expo/vector-icons` |
| Armazenamento local | `@react-native-async-storage/async-storage` |
| Backend / Configuração remota | [Firebase](https://firebase.google.com/) (Firestore) |
| Build & distribuição | [EAS Build](https://docs.expo.dev/build/introduction/) |

---

## 📁 Estrutura do projeto

```
.
├── App.js              # Componente raiz e navegação
├── screens/            # Telas (Home, Jogos, Cartas, Surpresa, etc.)
├── components/         # Componentes reutilizáveis (FloatingHearts, ThemePicker)
├── constants/          # Cores, temas e frases
├── utils/              # Firebase, notificações, storage e tema
├── admin/              # Painel administrativo (web)
├── assets/             # Ícones e splash screen
└── app.json            # Configuração do Expo
```

---

## 🚀 Como rodar o projeto

### Pré-requisitos

- [Node.js](https://nodejs.org/) instalado
- App **Expo Go** no celular ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779))

### Passos

```sh
# 1. Instale as dependências
npm install

# 2. Inicie o servidor de desenvolvimento
npm start
```

> 💡 **Dica:** se o terminal não encontrar `node` ou `npm` nesta máquina, o Node foi instalado localmente. Ative-o com:
> ```sh
> export PATH="$HOME/.local/node/current/bin:$PATH"
> ```

---

## 📱 Demonstração com Expo Go

A forma mais rápida de ver o app rodando, sem precisar gerar nenhum build:

1. Instale o aplicativo **Expo Go** no seu celular.
2. Rode `npm start` no terminal — um **QR Code** aparecerá.
3. **Escaneie o QR Code:**
   - **Android:** abra o Expo Go e use a opção *Scan QR Code*.
   - **iOS:** abra a câmera do iPhone e aponte para o QR Code.
4. O app abrirá direto no Expo Go, com **hot reload** — qualquer alteração no código aparece na hora. 🎉

Outras formas de abrir:

```sh
npm run android   # abre no emulador/dispositivo Android
npm run ios       # abre no simulador iOS (macOS)
npm run web       # abre no navegador
```

---

## 🏁 Resultado final

O resultado é um aplicativo completo, instalável e funcional nas três plataformas:

- **📲 Android** — roda no Expo Go e pode ser empacotado como **APK/AAB** via EAS Build para instalação direta no celular.
- **🍎 iOS** — roda no Expo Go em modo de desenvolvimento; para distribuição nativa, é necessária uma conta Apple Developer.
- **🌐 Web** — a build de produção já está disponível na pasta `dist/` (gerada com `expo export`).

Tudo amarrado por um visual escuro e romântico (tons de rosa e vinho), notificações que chegam mesmo com o app fechado, e configuração remota via Firebase — permitindo enviar novas surpresas sem precisar atualizar o app.

---

## 🤖 Bot do Amor — Como funciona

O Bot do Amor é um gerador combinatório que cria mensagens românticas automaticamente, sem depender de APIs externas ou serviços pagos.

### Arquitetura

```
┌─────────────────────────────────────────────┐
│             PAINEL ADMIN (web)              │
│                                             │
│  Data atual ──► Hash ──► Seleciona índices  │
│                          dos 3 arrays:      │
│                                             │
│  ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │ Aberturas│ │  Meios   │ │Fechamentos │  │
│  │  (20)    │+│  (25)    │+│   (15)     │  │
│  └──────────┘ └──────────┘ └────────────┘  │
│         = 7.500 combinações únicas          │
│                     │                       │
│          Salva no Firestore                 │
│        (config/botHistory)                  │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│              APP (React Native)             │
│                                             │
│  syncFromFirebase() ──► Lê botHistory       │
│                         ──► AsyncStorage    │
│                                             │
│  getTodayPhrase() ──► Usa mensagem do bot   │
│                       como "Frase do Dia"   │
└─────────────────────────────────────────────┘
```

### Detalhes técnicos

| Aspecto | Detalhe |
|---------|---------|
| Geração | Combinação de 3 arrays (abertura + meio + fechamento) via hash da data |
| Anti-repetição | Histórico das últimas 30 mensagens salvo no Firestore |
| Rotação | Muda automaticamente à meia-noite (baseado na data ISO) |
| Capacidade | 7.500 combinações — mais de 20 anos sem repetir |
| Custo | Zero — sem dependência de APIs de IA externas |
| Ações do admin | Usar como Mensagem Especial, enviar como Notificação Push, ou gerar outra |

> Feito com 💖 para a Mary.
