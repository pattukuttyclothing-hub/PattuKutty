export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>This page didn't load — Pattu Kutty</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Jost:wght@400;500;600&display=swap" rel="stylesheet" />
    <style>
      :root { --cream:#faf3ea; --maroon:#951a1f; --deep:#6b0e15; --gold:#c9a24c; --ink:#3a1a1c; }
      * { box-sizing: border-box; }
      body { font: 15px/1.6 "Jost", system-ui, -apple-system, sans-serif; background: var(--cream); color: var(--ink); display: grid; place-items: center; min-height: 100svh; margin: 0; padding: 1.5rem; }
      body::before { content:""; position:fixed; inset:0; pointer-events:none; opacity:.5;
        background-image: repeating-linear-gradient(45deg, rgba(149,26,31,.03) 0 1px, transparent 1px 6px), repeating-linear-gradient(-45deg, rgba(201,162,76,.04) 0 1px, transparent 1px 7px); }
      .card { position: relative; max-width: 30rem; width: 100%; text-align: center; padding: 2.75rem 2rem; background: #fff; border: 1px solid rgba(201,162,76,.35); border-radius: 1.5rem; box-shadow: 0 26px 60px -28px rgba(107,14,21,.35); animation: rise .7s cubic-bezier(.22,1,.36,1) both; }
      .seal { width: 3.5rem; height: 3.5rem; margin: 0 auto 1.25rem; display: grid; place-items: center; border-radius: 999px; background: rgba(201,162,76,.15); border: 1px solid rgba(201,162,76,.5); animation: pulse 3.2s ease-in-out infinite; }
      .seal svg { width: 1.5rem; height: 1.5rem; stroke: var(--maroon); }
      .eyebrow { font-size: .62rem; letter-spacing: .28em; text-transform: uppercase; color: var(--maroon); margin: 0 0 .6rem; }
      h1 { font-family: "Cormorant Garamond", Georgia, serif; font-size: 1.85rem; font-weight: 600; margin: 0 0 .5rem; color: var(--deep); }
      p { color: rgba(58,26,28,.72); margin: 0 auto 1.75rem; max-width: 24rem; }
      .rule { height:1px; width:9rem; margin:0 auto 1.4rem; background: linear-gradient(90deg, transparent, var(--gold), transparent); }
      .actions { display: flex; gap: .6rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: .8rem 1.5rem; border-radius: 999px; font: inherit; font-size: .78rem; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; cursor: pointer; text-decoration: none; border: 1px solid transparent; transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease, background .3s ease, color .3s ease; }
      .primary { background: var(--maroon); color: #fff; box-shadow: 0 12px 26px -14px rgba(107,14,21,.7); }
      .primary:hover { background: var(--deep); transform: translateY(-2px); }
      .secondary { background: #fff; color: var(--deep); border-color: rgba(149,26,31,.25); }
      .secondary:hover { border-color: var(--gold); color: var(--maroon); transform: translateY(-2px); }
      @keyframes rise { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: none; } }
      @keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.07); } }
      @media (prefers-reduced-motion: reduce) { *, *::before { animation: none !important; transition: none !important; } }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="seal">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/></svg>
      </div>
      <p class="eyebrow">Pattu Kutty</p>
      <h1>This page didn't load</h1>
      <div class="rule"></div>
      <p>Something went wrong on our end. You can try refreshing, or head back to the boutique.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Try again</button>
        <a class="secondary" href="/">Go home</a>
      </div>
    </div>
  </body>
</html>`;
}
