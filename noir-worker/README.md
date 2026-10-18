# Worker de Noir

Backend del chat de Noir: recibe la conversación del panel y responde con
Cloudflare Workers AI (`@cf/meta/llama-3.3-70b-instruct-fp8-fast`).

- `src/index.js`: validación, CORS, límite por IP y llamada al modelo.
- `src/prompt.js`: personalidad y datos de Noir. Si cambias el portafolio, cámbialo aquí.
- `wrangler.toml`: nombre, orígenes permitidos y límite (10 mensajes por minuto por IP).

## Publicar

```sh
cd noir-worker
npm install
npx wrangler login     # abre el navegador para entrar a Cloudflare
npx wrangler deploy
```

`deploy` imprime la URL, por ejemplo `https://noir.TU-SUBDOMINIO.workers.dev`.
Ponla en dos sitios del portafolio:

1. `js/main.js` → `NOIR_API`.
2. La CSP de `index.html` → `connect-src` (ya autoriza `https://*.workers.dev`;
   si quieres, cámbialo por la URL exacta).

## Probar en local

```sh
npx wrangler dev --remote   # Workers AI siempre corre en Cloudflare
```

Y en el portafolio sirve la carpeta con `python -m http.server 8000` (ese origen ya
está en `ALLOWED_ORIGINS`) y pon `NOIR_API` en la URL que imprime `wrangler dev`.

## Costo

Workers AI tiene una cuota gratuita diaria. Si se acaba o el modelo falla, el
Worker responde con error y el panel muestra el menú de siempre con WhatsApp.
