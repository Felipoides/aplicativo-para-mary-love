# Testar o Mary Love

Esta versão está na branch `codex/night-sky-motion` e inclui o tema Céu de nós, as animações e o ícone com a foto nova.

## Primeira vez

Instale Node.js LTS, Git e o Expo Go compatível com Expo SDK 54.

```bash
git clone --branch codex/night-sky-motion https://github.com/Felipoides/aplicativo-para-mary-love.git mary-love
cd mary-love
npm ci
npx expo start --go --clear
```

Leia o QR code no Expo Go com o celular e computador na mesma rede. Se a rede impedir a conexão:

```bash
npx expo start --go --tunnel --clear
```

No Android, a versão do Expo Go para o SDK 54 pode ser obtida em https://expo.dev/go?sdkVersion=54&platform=android&device=true . No iPhone físico, a App Store só disponibiliza a versão atual do Expo Go; se ela não suportar SDK 54, será necessário um development build ou uma atualização de SDK separada.

## Já tenho o repositório

Com o diretório de trabalho sem alterações pendentes:

```bash
git fetch origin
git switch codex/night-sky-motion
git pull --ff-only
npm ci
npx expo start --go --clear
```

Se já houver um tema salvo, toque na paleta no topo e escolha **Céu de nós**. Preferências salvas não são apagadas.

## O que conferir

- Estrelas variando de brilho, nuvens lentas e coração girando em torno do contador.
- Cartas, surpresa, Carinho, jogos e mascote.
- Com Reduzir movimento ativo no sistema, as animações ambientais ficam paradas.

O push no GitHub disponibiliza o código; o comando Expo acima inicia o servidor e gera o QR. Um link do GitHub não é um QR do Expo Go.

O ícone do launcher do app instalado muda com um novo APK/build nativo, não com uma sessão do Expo Go. A foto foi configurada em `app.json`: ícone geral/iOS 1024×1024 sem alpha, foreground Android 1024×1024 com margem central e favicon 48×48. O Expo gera as densidades nativas na compilação. A forma final depende do launcher.

Documentação: https://docs.expo.dev/get-started/start-developing/ e https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/ .
