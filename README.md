# Pixel Seed

Generador de avatares pixel art a partir de un nombre o una semilla. La idea es sencilla: la misma semilla siempre produce el mismo personaje, pero al cambiarla aparecen otras formas, expresiones y colores.

## Cómo se construye el avatar

El texto se convierte en una secuencia pseudoaleatoria determinista. Esa secuencia elige una forma de cabeza, un peinado, un estilo de ojos, una expresión y una paleta.

Las formas se guardan como matrices de 16 × 8: solo hace falta dibujar la mitad izquierda. El motor coloca las capas una encima de otra y refleja cada fila para completar el sprite de 16 × 16. Después aplica sombras y contorno. Los colores se calculan en HSL para mantener cada paleta coherente; los tonos de sombra y brillo comparten color para conservar una paleta pequeña.

El componente `<pixel-avatar>` dibuja el resultado en Canvas y también permite exportarlo como PNG o SVG. El sonido corto se sintetiza con Web Audio API, sin archivos externos.

## Tecnologías

- TypeScript para las matrices, las paletas y la composición del sprite.
- JavaScript nativo y módulos ES para la interfaz.
- Custom Elements y Shadow DOM para encapsular `<pixel-avatar>`.
- Canvas 2D y SVG para mostrar y exportar el avatar.
- Web Audio API para el sonido sintetizado.
- Vite para el servidor local y la compilación.

## Ejecutar en local

Necesitas Node.js. Desde la carpeta del proyecto:

```sh
npm install
npm run dev
```

Abre la dirección local que muestra Vite, normalmente `http://localhost:5173`.

Para generar la versión de producción:

```sh
npm run build
```
