# Language Tutor Web App

Esta aplicación web ofrece un tutor interactivo para el aprendizaje de idiomas utilizando un modelo de lenguaje avanzado.

## Características
- Selección de idioma (inglés, francés, alemán, portugués).
- Conversaciones naturales con el tutor en el idioma elegido.
- Retroalimentación gramatical en tiempo real.
- Objetivos de aprendizaje personalizables.
- Seguimiento de progreso con barras de avance y diario de la sesión.
- Modo de chat casual o lección estructurada.

## Requisitos
- Node.js 18+
- Variable de entorno `OPENAI_API_KEY` con una clave válida (opcional, para obtener respuestas reales del LLM).

## Uso
```bash
npm start
```
Abra su navegador en [http://localhost:3000](http://localhost:3000) para usar la aplicación.

## Tests
No se incluyen pruebas automatizadas. Ejecuta el comando siguiente para confirmar:
```bash
npm test
```
