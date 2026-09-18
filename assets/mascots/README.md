# Mascotes Matheus e Mary

`conceito-aprovado.png` é a referência visual aprovada. `Matheus.glb` e
`Maryane.glb` são personagens **3D completos**, com cabeça, tronco, braços,
pernas, cabelo, roupas e acessórios volumétricos. Frente, laterais e costas
podem ser vistas com um giro de 360°. Cada parte tem nome no GLB para facilitar
os próximos passos de animação.

Para reconstruir os modelos, no diretório raiz do projeto execute:

```sh
node scripts/build_full_mascots.mjs
```

O visualizador em `components/MascotViewer.native.js` usa Expo GL e Three.js;
o equivalente web está em `components/MascotViewer.web.js`. A arte original e as
texturas PNG ficam como referência, mas os modelos novos usam materiais sólidos
e não dependem de carregar PNGs no Android.

As partes são objetos separados e nomeados, mas **ainda não possuem esqueleto,
pesos ou animações articuladas**. O movimento atual é um balanço suave do corpo;
animações de braços, expressão facial e acessórios ficam para a próxima etapa.
