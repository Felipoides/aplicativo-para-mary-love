# Setup do Firebase — Painel Mary

## 1. Criar projeto no Firebase

1. Acesse https://console.firebase.google.com
2. Clique em **Criar projeto**
3. Nome: `mary-love` (ou qualquer nome)
4. Desative o Google Analytics (não precisa)
5. Clique em **Criar projeto**

---

## 2. Ativar Firestore

1. No menu lateral, clique em **Firestore Database**
2. Clique em **Criar banco de dados**
3. Escolha **Modo de produção**
4. Selecione região `southamerica-east1` (São Paulo) → Ativar

### Regras do Firestore (importante!)

No Firestore, vá em **Regras** e cole:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /config/{document} {
      allow read: if true;    // app lê sem login
      allow write: if false;  // só o painel web escreve (via SDK admin)
    }
  }
}
```

> ⚠️ Se quiser que o painel web também escreva (sem auth), mude `write: if false` para `write: if true` temporariamente. Depois você pode adicionar autenticação real.

---

## 3. Registrar o app Web

1. Na tela do projeto, clique em **</>** (Web)
2. Nome do app: `painel-mary`
3. Marque **Também configurar o Firebase Hosting**
4. Clique em **Registrar app**
5. Copie o objeto `firebaseConfig` que aparece — vai ser assim:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "mary-love-xxxxx.firebaseapp.com",
  projectId: "mary-love-xxxxx",
  storageBucket: "mary-love-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

---

## 4. Colar as credenciais nos arquivos

### No app (utils/firebase.js)
Abra o arquivo e substitua os `'COLE_AQUI'` com os valores do `firebaseConfig`.

### No painel web (admin/index.html)
Abra o arquivo e faça o mesmo na seção `FIREBASE_CONFIG`.

### Senha do painel
No `admin/index.html`, na linha:
```js
const ADMIN_PASSWORD = 'mary2024';
```
Troque `mary2024` pela senha que quiser.

---

## 5. Hospedar o painel web no Firebase Hosting

```bash
# Instalar o Firebase CLI (se não tiver)
npm install -g firebase-tools

# Fazer login
firebase login

# Iniciar dentro da pasta do projeto
cd "aplicativo para mary#love"
firebase init hosting

# Quando perguntar qual pasta pública, responda: admin
# Quando perguntar "single-page app?", responda: N
# Quando perguntar "sobrescrever index.html?", responda: N

# Deploy
firebase deploy --only hosting
```

Após o deploy, o painel estará disponível em:
`https://SEU-PROJETO.web.app`

---

## 6. Como funciona depois de pronto

1. Você acessa `https://SEU-PROJETO.web.app` no celular ou PC
2. Digita a senha
3. Muda o intervalo de notificações ou as frases
4. Na próxima vez que Mary abrir o app, ele busca as configs novas e reagenda tudo automaticamente

> O app funciona offline também — se não conseguir conectar ao Firebase, usa as configurações salvas localmente.
