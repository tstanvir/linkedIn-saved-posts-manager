# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
docker run -it --rm --entrypoint sh node:24-alpine # Create a Node.js container and start a Shell session:
npm install                      # install deps
npm run icons                    # generate icons/icon{16,32,48,128}.png from icons/icon.svg (run once)
npm run dev                      # Vite dev build with watch
npm run build                    # production build → dist/
npm run lint                     # ESLint
```

Load the extension: `chrome://extensions` → Developer Mode → Load unpacked → select `dist/`.