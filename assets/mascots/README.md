# Mascotes Matheus e Mary

`conceito-aprovado.png` é a arte aprovada dos personagens. `Matheus.glb` e
`Maryane.glb` são protótipos **2.5D em relevo**, construídos a partir dessa
arte. Eles trazem a textura no próprio GLB e permitem um giro leve. Ainda não
têm corpo esculpido por todos os lados, ossos ou animações articuladas.

Para reproduzir os modelos, no diretório raiz do projeto instale Python,
`Pillow`, `numpy` e `scipy`, e execute:

```sh
python scripts/build_mascot_models.py
```

O visualizador em `components/MascotViewer.native.js` usa Expo GL e Three.js;
o equivalente web está em `components/MascotViewer.web.js`. Quando existirem
modelos completos e articulados, substitua os dois GLBs mantendo os nomes.
