/* ============================================================
   Imibavu Collection — SPA (routing, shop, cart, checkout,
   custom blends, scent finder, account, back office)
   ============================================================ */

/* ---------------- storage & state ---------------- */
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

const S = {
  cart: load("imibavu_cart", []),
  wish: load("imibavu_wish", []),
  orders: load("imibavu_orders", []),
  blends: load("imibavu_blends", []),
  user: load("imibavu_user", null),
  userReviews: load("imibavu_reviews", {}),
  alerts: load("imibavu_alerts", []),
  hidden: load("imibavu_hidden", []),
  stock: load("imibavu_stock", {}),
  promos: load("imibavu_promos", [{ code: "IMIBAVU5", type: "shipping", label: "Free downtown delivery", active: true }]),
  filter: { cat: "", brand: "", gender: "", family: "", longevity: "", col: "", q: "", min: "", max: "", sort: "trending" },
  quiz: { step: 0, a: { mood: "", season: "", notes: [] } },
  pd: { size: 0, img: 0, tab: "reviews" },
  acc: { tab: "orders", signed: false, phone: "", authMode: "login", devCode: "", pendingPhone: "", pendingUser: null },
  adm: { tab: "products" }
};

const WA_NUM = "250784804739";
const WA_SVG = '<svg viewBox="0 0 32 32" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M16 3C9.4 3 4 8.4 4 15c0 2.1.6 4.1 1.6 5.9L4 29l8.3-1.5c1.7.9 3.6 1.4 5.7 1.4 6.6 0 12-5.4 12-12S22.6 3 16 3zm0 22c-1.8 0-3.5-.5-5-1.3l-.4-.2-4.9.9.9-4.7-.2-.4C5.4 17.6 5 16.3 5 15 5 9 10 4 16 4s11 5 11 11-5 10-11 10zm6.1-7.7c-.3-.2-2-1-2.3-1.1-.3-.1-.5-.2-.7.2-.2.3-.8 1.1-1 1.3-.2.2-.4.2-.7.1-.3-.2-1.4-.5-2.6-1.6-1-.9-1.6-1.9-1.8-2.3-.2-.3 0-.5.1-.7.1-.1.3-.4.5-.6.1-.2.2-.3.3-.6.1-.2 0-.4 0-.6-.1-.2-.7-1.8-1-2.4-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.8s1.2 3.2 1.4 3.4c.2.2 2.5 3.8 6 5.3.8.4 1.5.6 2 .7.8.3 1.6.2 2.2.1.7-.1 2-.8 2.3-1.6.3-.8.3-1.5.2-1.6-.1-.2-.3-.3-.6-.4z"/></svg>';

/* ---------------- utils ---------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = n => new Intl.NumberFormat("en-US").format(Math.round(n)) + " RWF";
const prod = id => PRODUCTS.find(p => p.id === id);
const brandName = id => (BRANDS.find(b => b.id === id) || {}).name || id;
const sizeLabel = s => typeof s[0] === "number" ? s[0] + " ml" : String(s[0]);
const vis = p => !S.hidden.includes(p.id);
const stockOf = p => S.stock[p.id] || p.stock;
const waLink = m => `https://wa.me/${WA_NUM}?text=${encodeURIComponent(m)}`;
const prodUrl = p => location.origin + location.pathname + "#/product/" + p.id;
const stars = r => "★★★★★".slice(0, Math.round(r)) + "☆☆☆☆☆".slice(0, 5 - Math.round(r));

function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), 3200);
}

/* color helpers for generated product art */
const hex2rgb = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const mix = (h, amt) => {
  const [r, g, b] = hex2rgb(h);
  const f = c => Math.max(0, Math.min(255, Math.round(amt > 0 ? c + (255 - c) * amt : c * (1 + amt))));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
};

function productImg(p, v = 0) {
  const c = p.color;
  const bgA = mix(c, v === 1 ? -0.55 : -0.35);
  const bgB = mix(c, v === 2 ? 0.28 : 0.1);
  const glass = mix(c, 0.18);
  const cap = v === 3 ? "#2a2620" : "#d9c08a";
  let art = "";
  if (p.category === "jewelry") {
    art = `
      <circle cx="300" cy="330" r="128" fill="none" stroke="${glass}" stroke-width="14"/>
      <circle cx="300" cy="330" r="104" fill="none" stroke="rgba(255,255,255,.28)" stroke-width="3"/>
      <path d="M300 202 q-64 96 0 190 q64 -94 0 -190" fill="none" stroke="${cap}" stroke-width="6"/>
      <circle cx="300" cy="452" r="34" fill="${cap}"/>
      <circle cx="290" cy="442" r="10" fill="rgba(255,255,255,.5)"/>`;
  } else if (p.category === "oils") {
    art = `
      <rect x="238" y="330" width="124" height="250" rx="46" fill="${glass}"/>
      <rect x="238" y="330" width="124" height="250" rx="46" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="3"/>
      <rect x="262" y="248" width="76" height="92" rx="16" fill="${cap}"/>
      <rect x="278" y="322" width="44" height="22" rx="6" fill="rgba(0,0,0,.35)"/>
      <rect x="256" y="420" width="88" height="96" rx="8" fill="rgba(255,255,255,.82)"/>
      <text x="300" y="462" text-anchor="middle" font-family="Georgia,serif" font-size="21" fill="#1d1712">${esc(p.name.split(" ")[0])}</text>
      <text x="300" y="490" text-anchor="middle" font-family="Arial" font-size="11" letter-spacing="3" fill="#8b7350">OIL</text>`;
  } else {
    art = `
      <rect x="176" y="262" width="248" height="326" rx="34" fill="${glass}"/>
      <rect x="176" y="262" width="248" height="326" rx="34" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="3"/>
      <rect x="252" y="166" width="96" height="104" rx="14" fill="${cap}"/>
      <rect x="276" y="244" width="48" height="30" rx="6" fill="rgba(0,0,0,.32)"/>
      <rect x="204" y="360" width="192" height="150" rx="10" fill="rgba(255,255,255,.86)"/>
      <text x="300" y="416" text-anchor="middle" font-family="Arial" font-size="12" letter-spacing="5" fill="#a08149">${esc(brandName(p.brand).toUpperCase())}</text>
      <text x="300" y="456" text-anchor="middle" font-family="Georgia,serif" font-size="30" fill="#171310">${esc(p.name.split(" ").slice(0, 2).join(" "))}</text>
      <line x1="248" y1="474" x2="352" y2="474" stroke="#c9a86a" stroke-width="2"/>
      <text x="300" y="496" text-anchor="middle" font-family="Arial" font-size="11" letter-spacing="3" fill="#6b6156">EAU DE PARFUM</text>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750" width="600" height="750">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${bgA}"/><stop offset="1" stop-color="${bgB}"/></linearGradient>
      <radialGradient id="r" cx="75%" cy="18%" r="70%">
      <stop offset="0" stop-color="rgba(255,255,255,.35)"/><stop offset="1" stop-color="rgba(255,255,255,0)"/></radialGradient></defs>
    <rect width="600" height="750" fill="url(#g)"/><rect width="600" height="750" fill="url(#r)"/>
    <ellipse cx="300" cy="640" rx="180" ry="26" fill="rgba(0,0,0,.28)"/>
    ${art}
    <text x="46" y="76" font-family="Arial" font-size="14" letter-spacing="6" fill="rgba(255,255,255,.7)">IMIBAVU</text>
    <text x="554" y="700" text-anchor="end" font-family="Arial" font-size="13" letter-spacing="3" fill="rgba(255,255,255,.6)">${esc(p.name.toUpperCase())}</text>
  </svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

function galleryOf(p) {
  return [productImg(p, 0), productImg(p, 1), productImg(p, 2), productImg(p, 3)];
}

/* ---------------- i18n ---------------- */
function applyI18n(root = document) {
  $$("[data-i18n]", root).forEach(el => { el.textContent = t(el.dataset.i18n); });
  $$("[data-i18n-ph]", root).forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
  const si = $("#searchInput"); if (si) si.placeholder = t("search_ph");
  $("#langSelect").value = LANG;
  document.documentElement.lang = LANG;
}

/* ---------------- cart ---------------- */
function cartCount() { return S.cart.reduce((n, i) => n + i.qty, 0); }
function cartSubtotal() { return S.cart.reduce((n, i) => { const p = prod(i.pid); return n + (p ? p.sizes[i.size][1] * i.qty : 0); }, 0); }

function addToCart(pid, size = 0, qty = 1) {
  const p = prod(pid); if (!p) return;
  if (stockOf(p) === "out") { toast(t("out_stock")); return; }
  const found = S.cart.find(i => i.pid === pid && i.size === size);
  if (found) found.qty += qty; else S.cart.push({ pid, size, qty });
  save("imibavu_cart", S.cart);
  renderCart();
  toast(`${p.name} — ${t("add_cart")} ✓`);
}

function setQty(idx, d) {
  S.cart[idx].qty += d;
  if (S.cart[idx].qty <= 0) S.cart.splice(idx, 1);
  save("imibavu_cart", S.cart);
  renderCart();
  if (parseHash().path === "/checkout") route();
}

function renderCart() {
  $("#cartCount").textContent = cartCount();
  const body = $("#cartBody"), foot = $("#cartFoot");
  if (!S.cart.length) {
    body.innerHTML = `<div class="cart-empty">${t("cart_empty")}<br><br><a class="btn ghost sm" href="#/shop">${t("back_shop")}</a></div>`;
    foot.innerHTML = "";
    return;
  }
  body.innerHTML = S.cart.map((i, idx) => {
    const p = prod(i.pid); if (!p) return "";
    return `<div class="cart-item">
      <img src="${productImg(p)}" alt="${esc(p.name)}">
      <div class="ci-info">
        <b>${esc(p.name)}</b>
        <span class="ci-meta">${esc(brandName(p.brand))} · ${sizeLabel(p.sizes[i.size])}</span>
        <span class="ci-price">${money(p.sizes[i.size][1] * i.qty)}</span>
        <span class="qty"><button data-act="qty" data-idx="${idx}" data-d="-1">−</button><span>${i.qty}</span><button data-act="qty" data-idx="${idx}" data-d="1">+</button></span>
      </div>
      <button class="ci-remove" data-act="cart-remove" data-idx="${idx}" aria-label="Remove">×</button>
    </div>`;
  }).join("");
  const sub = cartSubtotal();
  foot.innerHTML = `
    <div class="cart-line"><span>${t("subtotal")}</span><b>${money(sub)}</b></div>
    <div class="cart-line muted"><span>${t("delivery")}</span><span>${sub >= 60000 ? "Free downtown" : "from 1,500 RWF"}</span></div>
    <a class="btn full" href="#/checkout" data-act="close-cart">${t("checkout")}</a>
    <a class="btn wa-btn full" style="margin-top:8px" target="_blank" rel="noopener" href="${waLink("Hello Imibavu Collection, I would like to order:\n" + S.cart.map(i => { const p = prod(i.pid); return `• ${p.name} (${sizeLabel(p.sizes[i.size])}) × ${i.qty} — ${money(p.sizes[i.size][1] * i.qty)}`; }).join("\n") + `\n\nTotal: ${money(sub)}`)}">${WA_SVG} ${t("buy_whatsapp")}</a>`;
}

/* ---------------- shared components ---------------- */
function productCard(p) {
  const st = stockOf(p);
  const wished = S.wish.includes(p.id);
  return `<article class="p-card">
    <div class="p-thumb" data-act="open-prod" data-id="${p.id}">
      <img src="${productImg(p)}" alt="${esc(p.name)} — ${esc(brandName(p.brand))}" loading="lazy">
      <div class="badges">
        ${p.isNew ? '<span class="badge green">New</span>' : ""}
        ${p.trending ? '<span class="badge gold">Trending</span>' : ""}
        ${p.inspired ? `<span class="badge">${esc(p.inspired)}</span>` : ""}
        ${st === "low" ? '<span class="badge red">Low stock</span>' : ""}
        ${st === "out" ? '<span class="badge out">' + t("out_stock") + "</span>" : ""}
      </div>
      <button class="wish-btn ${wished ? "on" : ""}" data-act="wish" data-id="${p.id}" aria-label="Save">♥</button>
    </div>
    <div class="p-body">
      <span class="p-brand">${esc(brandName(p.brand))}</span>
      <h3 class="p-name" data-act="open-prod" data-id="${p.id}">${esc(p.name)}</h3>
      <span class="p-meta">${p.category === "jewelry" ? sizeLabel(p.sizes[0]) : p.sizes.map(sizeLabel).join(" · ")} · ${esc(p.family)}</span>
      <span class="p-rating"><span class="stars">${stars(p.rating)}</span> ${p.rating} (${p.reviews})</span>
      <div class="p-price"><b>${money(p.price)}</b></div>
      <div class="p-actions">
        <button class="btn sm" data-act="add" data-id="${p.id}" ${st === "out" ? "disabled" : ""}>${st === "out" ? t("out_stock") : t("add_cart")}</button>
        <a class="btn ghost sm" target="_blank" rel="noopener" href="${waLink(waProductMsg(p))}" aria-label="${t("buy_whatsapp")}">${WA_SVG}</a>
      </div>
    </div>
  </article>`;
}

function waProductMsg(p) {
  return `Hello Imibavu Collection, I would like to order:\n• ${p.name} — ${brandName(p.brand)}\n• Size: ${sizeLabel(p.sizes[0])} — ${money(p.price)}\n• ${prodUrl(p)}\n\nIs it available?`;
}

function sectionHead(title, sub, href, moreKey) {
  return `<div class="section-head">
    <div><h2>${esc(title)}</h2>${sub ? `<p>${esc(sub)}</p>` : ""}</div>
    ${href ? `<a class="link-more" href="${href}">${moreKey ? t(moreKey) : "See all"}</a>` : ""}
  </div>`;
}

function ratingMeter(val) {
  const on = { light: 2, moderate: 3, long: 5 }[val] || 3;
  return `<span class="meter">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= on ? "on" : ""}"></i>`).join("")}</span>`;
}

function reviewList(p) {
  const base = TESTIMONIALS.filter((_, i) => (p.id.length + i) % 2 === 0).slice(0, 2);
  const mine = (S.userReviews[p.id] || []).filter(r => r.approved !== false);
  const html = base.map(r => `<div class="review">
      <div class="review-head"><div class="avatar">${esc(r.img)}</div><div><b>${esc(r.name)}</b><span class="stars">${stars(r.stars)}</span></div></div>
      <p>“${esc(r.text)}”</p>
      <div class="review-photo"><div></div><div></div></div>
    </div>`).join("");
  const mineHtml = mine.map(r => `<div class="review">
      <div class="review-head"><div class="avatar">${esc((r.name || "You").slice(0, 2).toUpperCase())}</div><div><b>${esc(r.name || "You")}</b><span class="stars">${stars(r.stars)}</span></div></div>
      <p>“${esc(r.text)}”</p>${r.pending ? '<span class="pill warn">Awaiting moderation</span>' : ""}
    </div>`).join("");
  return html + mineHtml;
}

/* ---------------- views ---------------- */
function viewHome() {
  const trending = PRODUCTS.filter(p => vis(p) && p.trending).slice(0, 4);
  const fresh = PRODUCTS.filter(p => vis(p) && p.isNew).slice(0, 4);
  return `
  <section class="hero">
    <div class="hero-art"></div>
    <img class="hero-bottle" src="${productImg(PRODUCTS[0])}" alt="">
    <div class="container hero-inner">
      <span class="kicker">${t("hero_kicker")}</span>
      <h1>${t("hero_title")}</h1>
      <p>${t("hero_sub")}</p>
      <div class="hero-cta">
        <a class="btn" href="#/shop">${t("hero_cta")}</a>
        <a class="btn wa-btn" target="_blank" rel="noopener" href="${waLink("Hello Imibavu Collection, I would like help choosing a perfume.")}">${WA_SVG} ${t("hero_cta2")}</a>
      </div>
    </div>
  </section>

  <div class="trust-strip"><div class="container">
    <span>✓ ${t("trust1")}</span><span>✓ ${t("trust2")}</span><span>✓ ${t("trust3")}</span><span>✓ ${t("trust4")}</span>
  </div></div>

  <section class="section"><div class="container">
    <div class="cat-grid">
      ${CATEGORIES.map(c => `<a class="cat-card" href="#/shop?cat=${c.id}" style="--cat-bg:linear-gradient(140deg,${c.id === "perfumes" ? "#4a3b2c,#17120e" : c.id === "oils" ? "#5a4a2c,#1b160f" : "#413a4f,#161320"})">
        <span class="arrow">↗</span><h3>${t("cat_" + c.id)}</h3><p>${t("cat_" + c.id + "_sub")}</p>
      </a>`).join("")}
    </div>
  </div></section>

  <section class="section" style="padding-top:0"><div class="container">
    ${sectionHead(t("featured"), "Lattafa, Mousuf & more — the scents everyone is asking for.", "#/shop?col=trending", "see_all")}
    <div class="product-grid">${trending.map(productCard).join("")}</div>
  </div></section>

  <section class="section" style="background:var(--bg-2);border-block:1px solid var(--line)"><div class="container">
    ${sectionHead(t("collections"), null, "#/shop", "see_all")}
    <div class="coll-grid">
      ${COLLECTIONS.map(c => {
        const n = PRODUCTS.filter(p => vis(p) && c.match(p)).length;
        return `<a class="coll-card" href="#/shop?col=${c.id}"><span>${n} ${t("nav_shop").toLowerCase()}</span><b>${esc(c.label)}</b></a>`;
      }).join("")}
    </div>
  </div></section>

  <section class="section"><div class="container">
    ${sectionHead(t("new_arrivals"), null, "#/shop?col=new", "see_all")}
    <div class="product-grid">${fresh.map(productCard).join("")}</div>
  </div></section>

  <section class="section" style="padding-top:0"><div class="container">
    <div class="grid" style="grid-template-columns:1fr">
      <div class="promo-card">
        <span class="kicker" style="color:#221a0c">${t("promo_title")}</span>
        <b>${esc(DELIVERY_PROMO.text)}</b>
        <span>Use at checkout when ordering online, or mention it in store.</span>
        <span class="promo-code">${esc(DELIVERY_PROMO.code)}</span>
      </div>
      <div class="card-box" style="display:grid;gap:18px;align-items:center;grid-template-columns:1fr">
        <div>
          <span class="kicker">${t("nav_blends")}</span>
          <h3 style="margin:.3em 0 .3em">${t("blends_title")}</h3>
          <p class="muted">${t("blends_sub")}</p>
          <a class="btn gold" href="#/blends">${t("blend_builder")}</a>
        </div>
        <div class="gallery-grid">${PAST_BLENDS.slice(0, 2).map(b => `<div class="gallery-item"><div><b>${esc(b.name)}</b><span>${esc(b.notes)}</span></div></div>`).join("")}</div>
      </div>
    </div>
  </div></section>

  <section class="section" style="background:var(--ink);color:#efe6d6"><div class="container">
    <div class="section-head"><div><h2 style="color:#fff">${t("trust_title")}</h2><p style="color:#a99e8e">Why customers across Kigali keep coming back.</p></div></div>
    <div class="trust-grid">
      ${[[`${WA_SVG}`.replace("15", "18"), t("trust1")], ["◷", t("trust2")], ["⚗", t("trust3")], ["◈", t("trust4")]]
      .map(([i, x]) => `<div class="trust-item" style="background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.12)"><div class="t-ico" style="background:rgba(255,255,255,.08)">${i}</div><b style="color:#f0e7d7">${esc(x)}</b></div>`).join("")}
    </div>
    <div style="text-align:center;margin-top:34px">
      <a class="btn gold" href="#/quiz">${t("quiz_title")} — ${t("quiz_sub").split(" ").slice(0, 3).join(" ")}…</a>
    </div>
  </div></section>

  <section class="section"><div class="container">
    ${sectionHead(t("reviews_title"), "Real customers, real Kigali.", null, null)}
    <div class="testi-scroll">
      ${TESTIMONIALS.slice(0, 3).map(r => `<div class="testi">
        <div class="review-head"><div class="avatar">${esc(r.img)}</div><div><b>${esc(r.name)}</b><span class="stars">${stars(r.stars)}</span></div></div>
        <p>“${esc(r.text)}”</p></div>`).join("")}
    </div>
  </div></section>

  <section class="section" style="padding-top:0"><div class="container">
    ${sectionHead(t("care_tips"), null, "#/page/care", "see_all")}
    <div class="article-grid">${ARTICLES.map(a => `<article class="article"><h4>${esc(a.title)}</h4><p>${esc(a.text)}</p></article>`).join("")}</div>
  </div></section>

  <section class="section" style="padding-top:0"><div class="container">
    <div class="news-band">
      <span class="kicker">${t("nav_shop")} · Kigali</span>
      <h3>${t("newsletter")}</h3>
      <p>${t("newsletter_sub")}</p>
      <form class="news-form" data-form="news"><input type="text" placeholder="${t("phone_num")}" required><button class="btn gold" type="submit">${t("subscribe")}</button></form>
    </div>
  </div></section>`;
}

/* -------- shop -------- */
function filterProducts() {
  const f = S.filter;
  let list = PRODUCTS.filter(vis);
  if (f.cat) list = list.filter(p => p.category === f.cat);
  if (f.brand) list = list.filter(p => p.brand === f.brand);
  if (f.gender) list = list.filter(p => p.gender === f.gender);
  if (f.family) list = list.filter(p => p.family === f.family);
  if (f.longevity) list = list.filter(p => p.longevity === f.longevity);
  if (f.col) { const c = COLLECTIONS.find(x => x.id === f.col); if (c) list = list.filter(c.match); }
  if (f.min !== "" && !isNaN(+f.min)) list = list.filter(p => p.price >= +f.min);
  if (f.max !== "" && !isNaN(+f.max)) list = list.filter(p => p.price <= +f.max);
  if (f.q) {
    const q = f.q.toLowerCase();
    list = list.filter(p => (p.name + " " + brandName(p.brand) + " " + p.family + " " + p.gender + " " + p.desc + " " + p.notes.top.join(" ") + " " + p.notes.heart.join(" ") + " " + p.notes.base.join(" ")).toLowerCase().includes(q));
  }
  const s = f.sort;
  if (s === "asc") list.sort((a, b) => a.price - b.price);
  else if (s === "desc") list.sort((a, b) => b.price - a.price);
  else if (s === "newest") list.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
  else list.sort((a, b) => (b.trending ? 1 : 0) - (a.trending ? 1 : 0) || b.rating - a.rating);
  return list;
}

function filterPanel() {
  const f = S.filter;
  const group = (label, key, opts) => `<div class="f-group"><span class="f-label">${label}</span><div class="f-opts">
    ${opts.map(o => `<button class="chip ${f[key] === o[0] ? "on" : ""}" data-act="filter" data-key="${key}" data-val="${o[0]}">${esc(o[1])}</button>`).join("")}
  </div></div>`;
  return `<aside class="filters-panel" id="filtersPanel">
    ${group(t("category"), "cat", [["", "All"], ...CATEGORIES.map(c => [c.id, c.label])])}
    ${group(t("brand"), "brand", [["", "All"], ...BRANDS.map(b => [b.id, b.name])])}
    ${group(t("gender"), "gender", [["", "All"], ...GENDERS.map(g => [g, g])])}
    ${group(t("family"), "family", [["", "All"], ...SCENT_FAMILIES.map(x => [x, x])])}
    ${group(t("longevity"), "longevity", [["", "All"], ...LONGEVITY.map(x => [x.id, x.label])])}
    <div class="f-group"><span class="f-label">${t("price")}</span>
      <div class="price-range">
        <input type="number" placeholder="Min" value="${f.min}" data-act="price" data-key="min" min="0">
        <span>—</span>
        <input type="number" placeholder="Max" value="${f.max}" data-act="price" data-key="max" min="0">
      </div>
    </div>
    <button class="btn ghost sm full" data-act="clear-filters">${t("clear")}</button>
  </aside>`;
}

function viewShop(params) {
  ["cat", "brand", "col", "q"].forEach(k => { if (params.get(k)) S.filter[k] = params.get(k); });
  if (params.get("cat") || params.get("brand") || params.get("col")) S.filter.q = params.get("q") || "";
  const list = filterProducts();
  const title = S.filter.col ? (COLLECTIONS.find(c => c.id === S.filter.col) || {}).label
    : S.filter.cat ? (CATEGORIES.find(c => c.id === S.filter.cat) || {}).label
      : S.filter.brand ? brandName(S.filter.brand) : t("shop_title");
  return `
  <div class="page-head"><div class="container">
    <span class="kicker">${t("brand_tagline")}</span>
    <h1>${esc(title)}</h1>
    <p>${S.filter.q ? `Results for “${esc(S.filter.q)}”` : "Perfumes, oil blends and minimalist jewelry — all in RWF, ready for pickup or same-day delivery in Kigali."}</p>
  </div></div>
  <div class="page-body"><div class="container shop-layout">
    ${filterPanel()}
    <div>
      <div class="shop-toolbar">
        <span class="result-count" id="resultCount">${list.length} ${list.length === 1 ? "product" : "products"}</span>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="chip filter-toggle" data-act="toggle-filters">${t("filter_open")}</button>
          <select class="sort-select" data-act="sort">
            <option value="trending" ${S.filter.sort === "trending" ? "selected" : ""}>${t("sort_trending")}</option>
            <option value="newest" ${S.filter.sort === "newest" ? "selected" : ""}>${t("sort_newest")}</option>
            <option value="asc" ${S.filter.sort === "asc" ? "selected" : ""}>${t("sort_asc")}</option>
            <option value="desc" ${S.filter.sort === "desc" ? "selected" : ""}>${t("sort_desc")}</option>
          </select>
        </div>
      </div>
      <div class="product-grid" id="shopGrid">${list.length ? list.map(productCard).join("") : `<div class="empty-state" style="grid-column:1/-1"><h3>${t("no_results")}</h3><button class="btn ghost sm" data-act="clear-filters">${t("clear")}</button></div>`}</div>
    </div>
  </div></div>`;
}

function refreshShop() {
  const list = filterProducts();
  const g = $("#shopGrid"), c = $("#resultCount");
  if (g) g.innerHTML = list.length ? list.map(productCard).join("") : `<div class="empty-state" style="grid-column:1/-1"><h3>${t("no_results")}</h3><button class="btn ghost sm" data-act="clear-filters">${t("clear")}</button></div>`;
  if (c) c.textContent = `${list.length} ${list.length === 1 ? "product" : "products"}`;
  $$(".filters-panel .chip").forEach(ch => {
    if (ch.dataset.key) ch.classList.toggle("on", S.filter[ch.dataset.key] === ch.dataset.val);
  });
}

/* -------- product detail -------- */
function viewProduct(id) {
  const p = prod(id);
  if (!p) return `<div class="page-body"><div class="container empty-state"><h3>Product not found</h3><a class="btn ghost" href="#/shop">${t("back_shop")}</a></div></div>`;
  const st = stockOf(p);
  const imgs = galleryOf(p);
  const size = S.pd.size;
  const related = PRODUCTS.filter(x => vis(x) && x.id !== p.id && (x.brand === p.brand || x.category === p.category)).slice(0, 4);
  const look = p.category === "jewelry"
    ? PRODUCTS.filter(x => vis(x) && x.category === "perfumes").slice(0, 4)
    : PRODUCTS.filter(x => vis(x) && x.category === "jewelry").slice(0, 4);
  const sIdx = Math.min(size, p.sizes.length - 1);
  return `
  <div class="page-body"><div class="container">
    <div class="crumbs"><a href="#/">${t("home")}</a><span>/</span><a href="#/shop?cat=${p.category}">${t("cat_" + p.category)}</a><span>/</span>${esc(p.name)}</div>
    <div class="pd">
      <div class="pd-gallery">
        <div class="pd-main-img" data-act="zoom"><img src="${imgs[S.pd.img]}" alt="${esc(p.name)}"></div>
        <div class="pd-thumbs">${imgs.map((im, i) => `<button class="${i === S.pd.img ? "on" : ""}" data-act="img" data-i="${i}"><img src="${im}" alt="View ${i + 1}"></button>`).join("")}</div>
      </div>
      <div class="pd-info">
        <span class="p-brand">${esc(brandName(p.brand))}</span>
        <h1>${esc(p.name)}</h1>
        <div class="pd-rating"><span class="stars">${stars(p.rating)}</span> ${p.rating} · ${p.reviews} ${t("reviews")} ${p.inspired ? `<span class="badge" style="position:static">${esc(p.inspired)}</span>` : ""}</div>
        <div class="pd-price">${money(p.sizes[sIdx][1])} <small>VAT inc.</small></div>
        <p class="pd-desc">${esc(p.desc)}</p>

        <div class="stock-line"><span class="dot ${st}"></span>
          ${st === "in" ? t("in_stock") : st === "low" ? `${t("low_stock")} — 3 ${t("stock_left")}` : t("out_stock")}
        </div>

        <div class="opt-block">
          <span class="f-label">${t("size")}</span>
          <div class="size-opts">${p.sizes.map((s, i) => `<button class="size-opt ${i === sIdx ? "on" : ""}" data-act="size" data-i="${i}" ${st === "out" ? "disabled" : ""}>${sizeLabel(s)}<small>${money(s[1])}</small></button>`).join("")}</div>
        </div>

        <div class="pd-buy">
          <button class="btn" data-act="add" data-id="${p.id}" data-size="${sIdx}" ${st === "out" ? "disabled" : ""}>${st === "out" ? t("out_stock") : t("add_cart")}</button>
          <a class="btn wa-btn" target="_blank" rel="noopener" href="${waLink(`Hello Imibavu Collection, I would like to order:\n• ${p.name} — ${brandName(p.brand)}\n• Size: ${sizeLabel(p.sizes[sIdx])} — ${money(p.sizes[sIdx][1])}\n• ${prodUrl(p)}\n\nIs it available?`)}">${WA_SVG} ${t("buy_whatsapp")}</a>
        </div>
        ${st === "out" ? `<button class="btn ghost sm" data-act="alert" data-id="${p.id}">${t("back_in_stock")}</button>` : ""}
        <div style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap">
          <button class="chip ${S.wish.includes(p.id) ? "on" : ""}" data-act="wish" data-id="${p.id}">♥ ${S.wish.includes(p.id) ? "Saved" : t("wishlist")}</button>
          <button class="chip" data-act="share" data-id="${p.id}">${t("share")}</button>
        </div>

        <div class="spec-grid">
          <div class="spec"><span class="f-label">${t("gender")}</span><p>${esc(p.gender)} · ${esc(p.family)}</p></div>
          <div class="spec"><span class="f-label">${t("longevity_rating")}</span><p>${ratingMeter(p.longevity)}</p></div>
          <div class="spec"><span class="f-label">${t("projection")}</span><p>${ratingMeter(p.longevity === "long" ? "moderate" : "light")}</p></div>
          <div class="spec"><span class="f-label">${t("best_for")}</span><p>${esc(p.season)}</p></div>
        </div>

        ${p.notes.top.length ? `<div class="notes-block">
          <h4>Scent pyramid</h4>
          <div class="note-row"><b>${t("top_notes")}</b><span>${p.notes.top.join(" · ")}</span></div>
          <div class="note-row"><b>${t("heart_notes")}</b><span>${p.notes.heart.join(" · ")}</span></div>
          <div class="note-row"><b>${t("base_notes")}</b><span>${p.notes.base.join(" · ")}</span></div>
          <div class="note-row"><b>${t("longevity_rating")}</b><span>${ratingMeter(p.longevity)} — ${LONGEVITY.find(l => l.id === p.longevity).label}</span></div>
        </div>` : ""}
      </div>
    </div>

    <section class="reviews-block">
      <div class="section-head"><div><h2>${t("reviews_title")}</h2><p>${p.rating} average from ${p.reviews} customers</p></div></div>
      <div class="grid" style="grid-template-columns:1fr;gap:20px">
        <div>${reviewList(p)}</div>
        <form class="card-box" data-form="review" data-id="${p.id}">
          <h3 style="font-size:1.3rem">Write a review</h3>
          <div class="form-grid two" style="margin-top:12px">
            <div class="field"><label>${t("full_name")}</label><input name="name" required></div>
            <div class="field"><label>Rating</label><select name="stars"><option>5</option><option>4</option><option>3</option><option>2</option><option>1</option></select></div>
          </div>
          <div class="field" style="margin-top:12px"><label>Your review</label><textarea name="text" required></textarea></div>
          <button class="btn sm" type="submit" style="margin-top:12px">${t("subscribe").replace("Sign up", "Submit")}</button>
        </form>
      </div>
    </section>

    <section class="section" style="padding-bottom:0">
      ${sectionHead(t("related"), null, "#/shop?cat=" + p.category, "see_all")}
      <div class="product-grid">${related.map(productCard).join("")}</div>
    </section>
    <section class="section" style="padding-top:34px">
      ${sectionHead(t("complete_look"), null, "#/shop?cat=" + look[0].category, "see_all")}
      <div class="product-grid">${look.map(productCard).join("")}</div>
    </section>
  </div></div>`;
}

/* -------- brands -------- */
function viewBrands() {
  return `
  <div class="page-head"><div class="container">
    <span class="kicker">Browse</span><h1>${t("nav_brands")}</h1>
    <p>Trending Arabic houses and designer-inspired names, plus the Imibavu line of oils and jewelry.</p>
  </div></div>
  <div class="page-body"><div class="container">
    <div class="brand-grid">
      ${BRANDS.map(b => {
        const n = PRODUCTS.filter(p => vis(p) && p.brand === b.id).length;
        return `<a class="brand-card" href="#/shop?brand=${b.id}">
          <div class="b-mark">${esc(b.name)}</div><div class="b-tag">${esc(b.tag)}</div>
          <div class="b-count">${n} products</div></a>`;
      }).join("")}
    </div>
    <section class="section">
      ${sectionHead(t("featured"), "Most requested brands right now.", "#/shop?col=trending", "see_all")}
      <div class="product-grid">${PRODUCTS.filter(p => vis(p) && p.trending).slice(0, 4).map(productCard).join("")}</div>
    </section>
  </div></div>`;
}

/* -------- custom blends -------- */
function blendCalc() {
  const base = BLEND_BASES.find(b => b.id === (S.blendBase || POPULAR_BLENDS[0].base)) || BLEND_BASES[0];
  const size = BLEND_SIZES[S.blendSize ?? 1] || BLEND_SIZES[1];
  const notes = S.blendNotes || [];
  return { base, size, notes, total: base.price + size.price };
}

function viewBlends(params) {
  const { base, size, notes, total } = blendCalc();
  const saved = S.blends;
  return `
  <div class="page-head"><div class="container">
    <span class="kicker">Signature service</span><h1>${t("blends_title")}</h1>
    <p>${t("blends_sub")}</p>
    <div style="margin-top:16px"><a class="btn" href="#book">${t("book_session")}</a></div>
  </div></div>

  <div class="page-body"><div class="container">
    <section style="margin-bottom:34px">
      ${sectionHead(t("how_works"), null, null, null)}
      <div class="steps">
        ${[1, 2, 3, 4].map(i => `<div class="step"><span class="n">0${i}</span><h4>${t("step" + i)}</h4><p>${[
          "Jojoba, almond, coconut or grapeseed — each changes the feel on skin.",
          "Oud, rose, vanilla, musk, citrus… build the pyramid you love.",
          "Roll-on for travel, bottle for the dresser.",
          "Labelled with your name and saved to your account for easy reorders."
        ][i - 1]}</p></div>`).join("")}
      </div>
    </section>

    <section id="builder">
      ${sectionHead(t("blend_builder"), null, null, null)}
      <div class="builder">
        <div class="builder-card">
          <div class="f-group" style="margin-bottom:20px">
            <span class="f-label">${t("base_oil")}</span>
            <div class="stack">
              ${BLEND_BASES.map(b => `<label class="radio-card ${base.id === b.id ? "on" : ""}">
                <input type="radio" name="base" value="${b.id}" data-act="blend-base" ${base.id === b.id ? "checked" : ""}>
                <span><b>${esc(b.label)} — ${money(b.price)}</b><span>${esc(b.note)}</span></span></label>`).join("")}
            </div>
          </div>

          <div class="f-group" style="margin-bottom:20px">
            <span class="f-label">${t("choose_notes")} <em style="color:var(--gold);font-style:normal">(${notes.length}/3)</em></span>
            <div class="note-pool">
              ${BLEND_NOTES.map(n => `<button class="chip ${notes.includes(n) ? "on" : ""}" data-act="blend-note" data-val="${n}">${n}</button>`).join("")}
            </div>
          </div>

          <div class="f-group" style="margin-bottom:20px">
            <span class="f-label">${t("size")}</span>
            <div class="size-opts">
              ${BLEND_SIZES.map((s, i) => `<button class="size-opt ${(S.blendSize ?? 1) === i ? "on" : ""}" data-act="blend-size" data-i="${i}">${s.label}<small>${money(s.price)}</small></button>`).join("")}
            </div>
          </div>

          <div class="field"><label>${t("blend_name")}</label>
            <input id="blendName" value="${esc(S.blendName || "")}" placeholder="e.g. Kigali Nights"></div>

          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px">
            <button class="btn" data-act="blend-save">${t("save_blend")}</button>
            <a class="btn wa-btn" target="_blank" rel="noopener" href="${waLink(`Hello Imibavu Collection, I would like this custom blend:\n• Base: ${base.label}\n• Notes: ${notes.join(", ") || "(to discuss)"}\n• Size: ${size.label}\n• Name: ${S.blendName || "—"}\nTotal: ${money(total)}`)}">${WA_SVG} ${t("buy_whatsapp")}</a>
          </div>
        </div>

        <div class="blend-preview">
          <h4>${t("chosen")}</h4>
          <div class="bottle" style="--blend-c:${["#b08d4f", "#8e6b3f", "#c9a86a", "#7a6449"][BLEND_BASES.indexOf(base)]}"><span>${esc(S.blendName || "Your blend")}</span></div>
          <div class="blend-line"><span>${t("base_oil")}</span><b>${esc(base.label)}</b></div>
          <div class="blend-line"><span>${t("notes")}</span><b>${notes.length ? notes.join(" · ") : "—"}</b></div>
          <div class="blend-line"><span>${t("size")}</span><b>${size.label}</b></div>
          <div class="blend-total"><span>${t("total")}</span><span>${money(total)}</span></div>
        </div>
      </div>
    </section>

    <section class="section">
      ${sectionHead(t("popular_combos"), null, null, null)}
      <div class="combo-grid">
        ${POPULAR_BLENDS.map((b, i) => `<div class="combo">
          <b>${esc(b.name)}</b><p>${b.notes.join(" · ")}</p>
          <button class="btn ghost sm" data-act="use-combo" data-i="${i}">${t("reorder").replace("Reorder", "Use this")}</button>
        </div>`).join("")}
      </div>
    </section>

    <section class="section" id="book" style="background:var(--bg-2);border-block:1px solid var(--line)">
      <div class="container">
        ${sectionHead(t("book_session"), "Free, about 30 minutes, no obligation to buy.", null, null)}
        <form class="form-grid two" data-form="booking" style="max-width:820px">
          <div class="field"><label>${t("full_name")}</label><input name="name" required></div>
          <div class="field"><label>${t("phone")}</label><input name="phone" type="tel" placeholder="+250…" required></div>
          <div class="field"><label>${t("book_date")}</label><input name="date" type="date" required></div>
          <div class="field"><label>${t("book_time")}</label><input name="time" type="time" required></div>
          <div class="field" style="grid-column:1/-1"><label>${t("book_msg")}</label><textarea name="msg" placeholder="Notes you love, occasion, budget…"></textarea></div>
          <div style="grid-column:1/-1"><button class="btn" type="submit">${t("send_request")}</button></div>
        </form>
      </div>
    </section>

    <section class="section">
      ${sectionHead(t("past_work"), null, null, null)}
      <div class="gallery-grid">
        ${PAST_BLENDS.map(b => `<div class="gallery-item"><div><b>${esc(b.name)}</b><span>${esc(b.notes)}</span><span>${esc(b.by)}</span></div></div>`).join("")}
      </div>
    </section>

    ${saved.length ? `<section class="section" style="padding-top:0">
      ${sectionHead(t("saved_blends"), null, null, null)}
      ${saved.map((b, i) => `<div class="list-card">
        <div class="avatar" style="border-radius:12px">BL</div>
        <div class="lc-info"><b>${esc(b.name)}</b><span>${esc(b.baseLabel)} · ${b.notes.join(" · ")} · ${esc(b.sizeLabel)}</span></div>
        <div class="row-actions">
          <button class="mini-btn" data-act="blend-load" data-i="${i}">${t("reorder")}</button>
          <a class="mini-btn" target="_blank" rel="noopener" href="${waLink(`Hello Imibavu Collection, I would like to reorder my blend:\n• ${b.name}\n• Base: ${b.baseLabel}\n• Notes: ${b.notes.join(", ")}\n• ${b.sizeLabel}`)}">WhatsApp</a>
          <button class="mini-btn" data-act="blend-del" data-i="${i}">×</button>
        </div></div>`).join("")}
    </section>` : ""}
  </div></div>`;
}

/* -------- scent finder -------- */
const QUIZ = {
  moods: [["fresh", "Fresh & clean"], ["sweet", "Sweet & inviting"], ["oud", "Deep & mysterious"], ["musky", "Soft & skin-like"]],
  seasons: [["summer", "Hot days & summer"], ["day", "Office & everyday"], ["evening", "Evenings & going out"], ["winter", "Cool evenings & events"]],
  notes: ["Oud", "Vanilla", "Rose", "Musk", "Citrus", "Amber"]
};

function quizResults() {
  const a = S.quiz.a;
  const score = p => {
    let s = 0;
    if (a.mood === "fresh" && ["Fresh", "Citrus"].includes(p.family)) s += 3;
    if (a.mood === "sweet" && ["Sweet", "Floral"].includes(p.family)) s += 3;
    if (a.mood === "oud" && ["Oud", "Woody", "Amber"].includes(p.family)) s += 3;
    if (a.mood === "musky" && ["Musky", "Floral"].includes(p.family)) s += 3;
    const allNotes = [...p.notes.top, ...p.notes.heart, ...p.notes.base];
    a.notes.forEach(n => { if (allNotes.some(x => x.toLowerCase().includes(n.toLowerCase()))) s += 2; });
    if (a.season === "summer" && (p.season.includes("Summer") || p.family === "Fresh" || p.family === "Citrus")) s += 2;
    if (a.season === "evening" && p.season.includes("Evening")) s += 2;
    if (a.season === "day" && (p.season.includes("Office") || p.season.includes("Day"))) s += 2;
    if (a.season === "winter" && (p.season.includes("Winter") || p.longevity === "long")) s += 2;
    s += p.rating / 2;
    return s;
  };
  return PRODUCTS.filter(vis).map(p => ({ p, s: score(p) })).sort((x, y) => y.s - x.s).slice(0, 3).map(x => x.p);
}

function viewQuiz() {
  const q = S.quiz;
  if (q.step >= 3) {
    const res = quizResults();
    return `<div class="page-body"><div class="container quiz-wrap">
      <div class="crumbs center"><a href="#/">${t("home")}</a><span>/</span>${t("quiz_title")}</div>
      <div class="center" style="margin-bottom:26px">
        <span class="kicker">${t("quiz_result")}</span>
        <h1 style="font-size:clamp(2rem,6vw,3rem);margin-top:.2em">Your matches</h1>
        <p class="muted">Based on mood, season and the notes you love.</p>
      </div>
      <div class="product-grid" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr))">${res.map(productCard).join("")}</div>
      <div class="quiz-nav" style="justify-content:center;margin-top:26px">
        <button class="btn ghost" data-act="quiz-restart">${t("retake")}</button>
        <a class="btn wa-btn" target="_blank" rel="noopener" href="${waLink("Hello Imibavu Collection, the Scent Finder recommended:\n" + res.map(p => "• " + p.name + " (" + brandName(p.brand) + ")").join("\n") + "\nCan you tell me more?")}">${WA_SVG} ${t("buy_whatsapp")}</a>
      </div>
    </div></div>`;
  }
  const step = q.step;
  const opt = (key, val, label) => `<button class="quiz-opt ${(key === "notes" ? q.a.notes.includes(val) : q.a[key] === val) ? "on" : ""}" data-act="quiz-pick" data-key="${key}" data-val="${val}">${label}</button>`;
  const body = step === 0
    ? `<div class="quiz-q">${t("quiz_mood")}</div><div class="quiz-opts">${QUIZ.moods.map(m => opt("mood", m[0], m[1])).join("")}</div>`
    : step === 1
      ? `<div class="quiz-q">${t("quiz_season")}</div><div class="quiz-opts">${QUIZ.seasons.map(m => opt("season", m[0], m[1])).join("")}</div>`
      : `<div class="quiz-q">${t("quiz_notes")}</div><div class="quiz-opts">${QUIZ.notes.map(n => opt("notes", n, n)).join("")}</div>
         <p class="form-note center" style="margin-top:12px">Pick up to 3.</p>`;
  return `<div class="page-body"><div class="container quiz-wrap">
    <div class="crumbs center"><a href="#/">${t("home")}</a><span>/</span>${t("quiz_title")}</div>
    <div class="center" style="margin-bottom:22px"><span class="kicker">${t("quiz_title")}</span><p class="muted">${t("quiz_sub")}</p></div>
    <div class="quiz-progress"><i style-width></i><i style="width:${((step + 1) / 3) * 100}%"></i></div>
    ${body}
    <div class="quiz-nav">
      <button class="btn ghost" data-act="quiz-back" ${step === 0 ? "disabled" : ""}>${t("back")}</button>
      <button class="btn" data-act="quiz-next">${step === 2 ? t("see_results") : t("next")}</button>
    </div>
  </div></div>`;
}

/* -------- about -------- */
function viewAbout() {
  return `
  <div class="page-head"><div class="container">
    <span class="kicker">Our story</span><h1>${t("about_title")}</h1>
    <p>Minimalist perfumes, honest advice and a blending bar in the middle of downtown Kigali.</p>
  </div></div>
  <div class="page-body"><div class="container">
    <div class="prose">
      <p>Imibavu Collection started with a simple idea: fragrance should not be complicated or overpriced. We open a box, we let you smell, we tell you the truth about how long it lasts — and if nothing fits, we blend one for you.</p>
      <h3>What we carry</h3>
      <p>Trending Arabic houses such as <b>Lattafa</b> and <b>Mousuf</b>, designer-inspired alternatives, long-lasting summer perfumes built for Kigali heat, concentrated roll-on oils, and a small line of minimalist jewelry chosen to complete a look.</p>
      <h3>Custom blending</h3>
      <p>Our blending bar lets you build your own fragrance: pick a base oil, choose two or three notes, select a size. We mix it on the spot, label it with your name and save the formula so you can reorder it any time. It is the service people talk about most.</p>
      <h3>Why minimal</h3>
      <p>No walls of 300 bottles, no pressure. A tight selection we actually believe in, honest guidance on longevity and projection, and prices in RWF with Mobile Money, cash or card.</p>
    </div>

    <div class="trust-grid" style="margin-top:34px">
      ${[[t("trust1"), "Factory-sealed, sourced from authorised distributors"], [t("trust2"), "Order before 3pm for same-day delivery"],
      [t("trust3"), "30-minute sessions, free of charge"], [t("trust4"), "MTN MoMo, Airtel Money, cash, card"]]
      .map(([a, b]) => `<div class="trust-item"><div class="t-ico">✓</div><b>${esc(a)}</b><span>${esc(b)}</span></div>`).join("")}
    </div>

    <section class="section">
      ${sectionHead(t("reviews_title"), null, null, null)}
      <div class="testi-scroll">${TESTIMONIALS.map(r => `<div class="testi">
        <div class="review-head"><div class="avatar">${esc(r.img)}</div><div><b>${esc(r.name)}</b><span class="stars">${stars(r.stars)}</span></div></div>
        <p>“${esc(r.text)}”</p></div>`).join("")}</div>
    </section>

    <section class="section" style="padding-top:0">
      ${sectionHead("Find us", t("hero_kicker"), "#/visit", "see_all")}
      <div class="store-photos">
        ${["The storefront", "Blending bar", "Shelf of Lattafa & Mousuf", "Jewelry corner", "Gift wrapping", "Fitting the look"].map(x => `<div class="store-photo">${x}</div>`).join("")}
      </div>
    </section>
  </div></div>`;
}

/* -------- visit -------- */
function viewVisit() {
  return `
  <div class="page-head"><div class="container">
    <span class="kicker">Kigali · Rwanda</span><h1>${t("visit_title")}</h1>
    <p>${esc(STORE.address)}</p>
  </div></div>
  <div class="page-body"><div class="container visit-grid">
    <div>
      <div class="map-box">
        <iframe title="Map to Imibavu Collection" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
          src="https://www.google.com/maps?q=${STORE.mapQuery}&output=embed"></iframe>
      </div>
      <div class="contact-actions">
        <a class="btn" href="tel:+${STORE.phone}">☎ ${t("call")} ${STORE.phonePretty}</a>
        <a class="btn wa-btn" target="_blank" rel="noopener" href="${waLink("Hello Imibavu Collection, are you open right now?")}">${WA_SVG} ${t("whatsapp")}</a>
        <a class="btn ghost" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${STORE.mapQuery}">${t("directions_btn")}</a>
      </div>

      <div class="card-box" style="margin-top:20px">
        <h3>${t("directions")}</h3>
        ${STORE.landmarks.map((l, i) => `<div class="landmark"><b>0${i + 1}</b><span>${esc(l)}</span></div>`).join("")}
      </div>

      <div class="store-photos">
        ${["Entrance — T2000 ground floor", "Inside the store", "Blending station"].map(x => `<div class="store-photo">${x}</div>`).join("")}
      </div>
    </div>

    <div>
      <div class="card-box">
        <h3>${t("hours")}</h3>
        <table class="hours-list">
          ${STORE.hours.map(([d, h]) => `<tr><td>${d}</td><td>${h}</td></tr>`).join("")}
        </table>
        <p class="form-note" style="margin-top:12px">Holiday hours are announced on our WhatsApp broadcast and social pages.</p>
      </div>

      <div class="card-box" style="margin-top:16px">
        <h3>${t("contact_details")}</h3>
        <p style="margin-top:10px">${esc(STORE.address)}</p>
        <p><a href="tel:+${STORE.phone}">${STORE.phonePretty}</a><br>
        <a href="${waLink("Hello Imibavu Collection!")}" target="_blank" rel="noopener">WhatsApp chat</a></p>
        <div class="f-social" style="margin-top:6px">
          <a href="${STORE.socials.instagram}" target="_blank" rel="noopener" style="color:var(--gold)">Instagram</a>
          <a href="${STORE.socials.tiktok}" target="_blank" rel="noopener" style="color:var(--gold)">TikTok</a>
          <a href="${STORE.socials.facebook}" target="_blank" rel="noopener" style="color:var(--gold)">Facebook</a>
        </div>
      </div>

      <div class="card-box" style="margin-top:16px">
        <h3>${t("delivery_method")}</h3>
        ${ZONES.map(z => `<div class="landmark"><b>•</b><span>${esc(z.label)} — ${z.fee ? money(z.fee) : "Free"}</span></div>`).join("")}
        <p class="form-note" style="margin-top:10px">Free downtown delivery on orders over ${money(60000)}.</p>
      </div>
    </div>
  </div></div>`;
}

/* -------- FAQ -------- */
function viewFaq() {
  return `
  <div class="page-head"><div class="container">
    <span class="kicker">Help</span><h1>${t("faq_title")}</h1>
    <p>Delivery, returns, longevity, authenticity and custom blends — everything customers ask us.</p>
  </div></div>
  <div class="page-body"><div class="container" style="max-width:840px">
    ${FAQS.map((f, i) => `<div class="faq-item">
      <button class="faq-q" data-act="faq" data-i="${i}">${esc(f.q)}<i>+</i></button>
      <div class="faq-a" id="faqA${i}"><p>${esc(f.a)}</p></div>
    </div>`).join("")}
    <div class="card-box center" style="margin-top:26px">
      <h3>Still have a question?</h3>
      <p class="muted">We answer on WhatsApp within minutes during opening hours.</p>
      <a class="btn wa-btn" target="_blank" rel="noopener" href="${waLink("Hello Imibavu Collection, I have a question:")}">${WA_SVG} ${t("whatsapp")} ${STORE.phonePretty}</a>
    </div>
  </div></div>`;
}

/* -------- checkout -------- */
function viewCheckout() {
  if (!S.cart.length) {
    return `<div class="page-body"><div class="container empty-state"><h3>${t("cart_empty")}</h3><a class="btn" href="#/shop">${t("back_shop")}</a></div></div>`;
  }
  const sub = cartSubtotal();
  return `
  <div class="page-head"><div class="container">
    <span class="kicker">Secure · HTTPS</span><h1>${t("checkout_title")}</h1>
    <p>${t("guest_note")}</p>
  </div></div>
  <div class="page-body"><div class="container checkout-grid">
    <form data-form="order" class="stack">
      <div class="card-box">
        <h3>${t("contact_details")}</h3>
        <div class="form-grid two" style="margin-top:14px">
          <div class="field"><label>${t("full_name")}</label><input name="name" value="${esc((S.user && S.user.name) || "")}" required></div>
          <div class="field"><label>${t("phone")}</label><input name="phone" type="tel" placeholder="+250 7.." value="${esc((S.user && S.user.phone) || "")}" required></div>
          <div class="field" style="grid-column:1/-1"><label>${t("email")}</label><input name="email" type="email"></div>
        </div>
      </div>

      <div class="card-box">
        <h3>${t("delivery_method")}</h3>
        <div class="stack" style="margin-top:14px">
          ${ZONES.map((z, i) => `<label class="radio-card ${i === 0 ? "on" : ""}">
            <input type="radio" name="zone" value="${z.id}" data-act="zone" ${i === 0 ? "checked" : ""}>
            <span><b>${esc(z.label)}</b><span>${z.fee ? money(z.fee) + " delivery" : "Free — collect at the store"}</span></span></label>`).join("")}
        </div>
        <div class="field" style="margin-top:14px"><label>Delivery note (zone, landmark)</label><input name="note" placeholder="e.g. Kimironko, near the pharmacy"></div>
      </div>

      <div class="card-box">
        <h3>${t("payment")}</h3>
        <div class="stack" style="margin-top:14px">
          <label class="radio-card on"><input type="radio" name="pay" value="momo" checked><span><b>${t("pay_momo")}</b><span>You receive a payment request by SMS after confirming.</span></span></label>
          <label class="radio-card"><input type="radio" name="pay" value="cash"><span><b>${t("pay_cash")}</b><span>Pay the rider on arrival in Kigali.</span></span></label>
          <label class="radio-card"><input type="radio" name="pay" value="pickup"><span><b>${t("pay_pickup")}</b><span>T2000 Building, ground floor.</span></span></label>
        </div>
        <div class="field" style="margin-top:14px"><label>Promo code</label><input name="promo" placeholder="${DELIVERY_PROMO.code}"></div>
      </div>

      <button class="btn full" type="submit">${t("place_order")}</button>
      <p class="form-note center">🔒 Secure checkout · ${t("tax_note")}</p>
    </form>

    <aside class="summary-box">
      <h3 style="font-size:1.3rem;margin-bottom:12px">${t("cart_title")}</h3>
      ${S.cart.map(i => { const p = prod(i.pid); return `<div class="summary-item"><span>${esc(p.name)} × ${i.qty}<br><small class="muted">${sizeLabel(p.sizes[i.size])}</small></span><b>${money(p.sizes[i.size][1] * i.qty)}</b></div>`; }).join("")}
      <div class="summary-item"><span>${t("subtotal")}</span><b>${money(sub)}</b></div>
      <div class="summary-item"><span>${t("delivery")}</span><b id="shipLine">${sub >= 60000 ? "Free downtown" : money(1500)}</b></div>
      <div class="summary-item" style="font-family:var(--serif);font-size:1.2rem;border-top:1px solid var(--line);margin-top:8px;padding-top:12px">
        <span>${t("total")}</span><b id="totalLine">${money(sub + (sub >= 60000 ? 0 : 1500))}</b></div>
      <a class="btn wa-btn full" style="margin-top:14px" target="_blank" rel="noopener" href="${waLink("Hello Imibavu Collection, I am checking out online and have a question about my order.")}">${WA_SVG} ${t("buy_whatsapp")}</a>
    </aside>
  </div></div>`;
}

function viewOrder(code) {
  const o = S.orders.find(x => x.code === code);
  if (!o) return `<div class="page-body"><div class="container empty-state"><h3>Order not found</h3><a class="btn ghost" href="#/">${t("home")}</a></div></div>`;
  return `<div class="page-body"><div class="container">
    <div class="order-success">
      <div class="tick">✓</div>
      <h1 style="font-size:clamp(2rem,6vw,3rem)">${t("order_done")}</h1>
      <p class="muted">${t("order_done_text")}</p>
      <div class="order-code">${o.code}</div>
      <p class="muted">${o.date} · ${o.status} · ${esc(o.payment)}</p>
      <div class="contact-actions" style="justify-content:center">
        <a class="btn wa-btn" target="_blank" rel="noopener" href="${waLink(`Hello Imibavu Collection, this is about order ${o.code} (${o.name}, ${money(o.total)}).`)}">${WA_SVG} ${t("whatsapp")}</a>
        <a class="btn ghost" href="#/account">${t("orders")}</a>
        <a class="btn ghost" href="#/shop">${t("back_shop")}</a>
      </div>
    </div>
    <div class="summary-box" style="max-width:560px;margin:0 auto">
      ${o.items.map(i => `<div class="summary-item"><span>${esc(i.name)} × ${i.qty}<br><small class="muted">${esc(i.size)}</small></span><b>${money(i.price * i.qty)}</b></div>`).join("")}
      <div class="summary-item"><span>${t("delivery")}</span><b>${esc(o.zoneLabel)}</b></div>
      <div class="summary-item" style="font-family:var(--serif);font-size:1.15rem"><span>${t("total")}</span><b>${money(o.total)}</b></div>
    </div>
  </div></div>`;
}

/* -------- account -------- */
function viewAccount() {
  if (!S.user) {
    const m = S.acc.authMode;
    const title = m === "register" ? "Create account"
      : m === "reset" ? "Reset password"
      : m === "verify" ? "Verify your phone"
      : t("login_title");
    const sub = (m === "verify" || m === "reset") && S.acc.devCode
      ? `Console OTP: <b>${esc(S.acc.devCode)}</b> (SMS goes live when Africa's Talking keys are set)`
      : t("login_sub");

    let form = "";
    if (m === "login") {
      form = `<form class="card-box" data-form="auth" data-mode="login">
        <div class="field"><label>${t("phone_num")}</label><input name="id" placeholder="+250 784 804 739" required></div>
        <div class="field" style="margin-top:12px"><label>Password</label><input name="password" type="password" autocomplete="current-password" required></div>
        <button class="btn full" style="margin-top:16px" type="submit">${t("continue")}</button>
        <p class="form-note" style="margin-top:12px">
          <a href="#" data-act="auth-mode" data-mode="reset">Forgot password?</a>
          · <a href="#" data-act="auth-mode" data-mode="register">Create an account</a>
        </p>
      </form>`;
    } else if (m === "register") {
      form = `<form class="card-box" data-form="auth" data-mode="register">
        <div class="field"><label>${t("full_name")}</label><input name="name" placeholder="Your name" required></div>
        <div class="field" style="margin-top:12px"><label>${t("phone_num")}</label><input name="phone" placeholder="+250 784 804 739" required></div>
        <div class="field" style="margin-top:12px"><label>Email (optional)</label><input name="email" type="email" placeholder="you@example.com"></div>
        <div class="field" style="margin-top:12px"><label>Password</label><input name="password" type="password" autocomplete="new-password" required minlength="8">
          <small class="muted">At least 8 characters, with a letter and a number.</small></div>
        <button class="btn full" style="margin-top:16px" type="submit">${t("continue")}</button>
        <p class="form-note" style="margin-top:12px"><a href="#" data-act="auth-mode" data-mode="login">I already have an account</a></p>
      </form>`;
    } else if (m === "verify") {
      form = `<form class="card-box" data-form="auth" data-mode="verify">
        <div class="field"><label>6-digit code</label><input name="code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" placeholder="123456" required></div>
        <button class="btn full" style="margin-top:16px" type="submit">Verify</button>
        <p class="form-note" style="margin-top:12px"><a href="#" data-act="otp-resend">Resend code</a> · <a href="#" data-act="auth-mode" data-mode="login">Back to sign in</a></p>
      </form>`;
    } else {
      form = `<form class="card-box" data-form="auth" data-mode="reset">
        <div class="field"><label>${t("phone_num")}</label><input name="phone" placeholder="+250 784 804 739" required></div>
        <div class="field" style="margin-top:12px"><label>New password</label><input name="password" type="password" autocomplete="new-password" required minlength="8"></div>
        <div class="field" style="margin-top:12px"><label>Code sent by SMS</label><input name="code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" placeholder="123456" required></div>
        <button class="btn full" style="margin-top:16px" type="submit">Reset password</button>
        <p class="form-note" style="margin-top:12px"><a href="#" data-act="auth-mode" data-mode="login">Back to sign in</a></p>
      </form>`;
    }

    return `<div class="page-head"><div class="container"><span class="kicker">${t("account")}</span><h1>${esc(title)}</h1><p>${sub}</p></div></div>
    <div class="page-body"><div class="container" style="max-width:460px">${form}</div></div>`;
  }
  const tabs = [["orders", t("orders")], ["wish", t("wishlist_title")], ["blends", t("saved_blends")], ["addr", t("addresses")]];
  let body = "";
  if (S.acc.tab === "orders") {
    body = S.orders.length ? S.orders.map(o => `<div class="list-card">
        <div class="avatar" style="border-radius:10px">${o.code.slice(-2)}</div>
        <div class="lc-info"><b>${o.code}</b><span>${o.date} · ${o.items.length} items · ${money(o.total)}</span></div>
        <span class="pill info">${esc(o.status)}</span>
        <a class="mini-btn" href="#/order/${o.code}">View</a>
      </div>`).join("") : `<div class="empty-state"><h3>No orders yet</h3><a class="btn ghost sm" href="#/shop">${t("back_shop")}</a></div>`;
  } else if (S.acc.tab === "wish") {
    const items = S.wish.map(prod).filter(Boolean);
    body = items.length ? items.map(p => `<div class="list-card">
        <img src="${productImg(p)}" alt=""><div class="lc-info"><b>${esc(p.name)}</b><span>${esc(brandName(p.brand))} · ${money(p.price)}</span></div>
        <button class="mini-btn" data-act="add" data-id="${p.id}">${t("add_cart")}</button>
        <button class="mini-btn" data-act="wish" data-id="${p.id}">×</button></div>`).join("")
      : `<div class="empty-state"><h3>${t("wishlist_title")} is empty</h3></div>`;
  } else if (S.acc.tab === "blends") {
    body = S.blends.length ? S.blends.map((b, i) => `<div class="list-card">
        <div class="avatar" style="border-radius:12px">BL</div>
        <div class="lc-info"><b>${esc(b.name)}</b><span>${esc(b.baseLabel)} · ${b.notes.join(" · ")} · ${esc(b.sizeLabel)}</span></div>
        <button class="mini-btn" data-act="blend-load" data-i="${i}">${t("reorder")}</button>
        <button class="mini-btn" data-act="blend-del" data-i="${i}">×</button></div>`).join("")
      : `<div class="empty-state"><h3>No saved blends</h3><a class="btn ghost sm" href="#/blends">${t("blend_builder")}</a></div>`;
  } else {
    body = `<div class="list-card"><div class="avatar" style="border-radius:10px">📍</div>
      <div class="lc-info"><b>Home — Downtown Kigali</b><span>KK Center area · default</span></div></div>
      <div class="list-card"><div class="avatar" style="border-radius:10px">🏢</div>
      <div class="lc-info"><b>Office — T2000 Building</b><span>Ground floor · pickup</span></div></div>
      <button class="btn ghost sm" data-act="soon">${t("save")}</button>`;
  }
  return `<div class="page-head"><div class="container"><span class="kicker">${t("account_dash")}</span><h1>${esc(S.user.name || S.user.phone)}</h1><p>${esc(S.user.phone)}</p></div></div>
  <div class="page-body"><div class="container">
    <div class="tabs">${tabs.map(([k, l]) => `<button class="tab ${S.acc.tab === k ? "on" : ""}" data-act="acc-tab" data-k="${k}">${l}</button>`).join("")}
      <button class="tab" style="margin-left:auto;color:var(--red)" data-act="logout">${t("logout")}</button></div>
    ${body}
  </div></div>`;
}

/* -------- back office -------- */
function viewAdmin() {
  if (!S.user || !["admin", "staff"].includes(S.user.role)) {
    return `<div class="page-head"><div class="container"><span class="kicker">${t("admin")}</span><h1>Back office</h1></div></div>
    <div class="page-body"><div class="container" style="max-width:520px">
      <div class="empty-state">
        <h3>${S.user ? "Staff access required" : "Sign in required"}</h3>
        <p class="muted">${S.user ? "This account does not have back-office permissions." : "Sign in with a staff or admin account to continue."}</p>
        <a class="btn" href="#/account">${S.user ? "Back to account" : t("continue")}</a>
      </div>
    </div></div>`;
  }
  const tabs = [["products", t("admin_products")], ["orders", t("admin_orders")], ["promos", "Promos"], ["reviews", "Reviews"], ["reports", t("admin_reports")]];
  const revenue = S.orders.reduce((n, o) => n + o.total, 0);
  let body = "";

  if (S.adm.tab === "products") {
    body = `<div class="table-wrap"><table class="data">
      <thead><tr><th>Product</th><th>Brand</th><th>${t("category")}</th><th>${t("price_rwf")}</th><th>${t("status")}</th><th>${t("actions")}</th></tr></thead>
      <tbody>${PRODUCTS.map(p => {
        const st = stockOf(p), hidden = S.hidden.includes(p.id);
        return `<tr>
          <td><b style="font-weight:400">${esc(p.name)}</b></td><td>${esc(brandName(p.brand))}</td><td>${esc(p.category)}</td>
          <td>${money(p.price)}</td>
          <td><span class="pill ${hidden ? "bad" : st === "out" ? "bad" : st === "low" ? "warn" : "ok"}">${hidden ? "Hidden" : st === "in" ? "Active" : st === "low" ? "Low stock" : "Out of stock"}</span></td>
          <td class="row-actions">
            <button class="mini-btn" data-act="adm-price" data-id="${p.id}">Price</button>
            <button class="mini-btn" data-act="adm-stock" data-id="${p.id}">${st === "out" ? "Restock" : st === "low" ? "Full" : "Sell out"}</button>
            <button class="mini-btn" data-act="adm-hide" data-id="${p.id}">${hidden ? "Show" : "Hide"}</button>
          </td></tr>`;
      }).join("")}</tbody></table></div>
      <div class="card-box" style="margin-top:18px">
        <h3>Bulk upload (CSV)</h3>
        <p class="form-note">One product per line: <code>name,brandId,category,price,colorHex</code></p>
        <div class="field" style="margin-top:10px"><textarea id="bulkCsv" placeholder="Oud Velvet,lattafa,perfumes,41000,#5b3a24"></textarea></div>
        <button class="btn sm" style="margin-top:10px" data-act="adm-bulk">Import</button>
      </div>`;
  } else if (S.adm.tab === "orders") {
    body = S.orders.length ? `<div class="table-wrap"><table class="data">
      <thead><tr><th>Code</th><th>Customer</th><th>Items</th><th>${t("total")}</th><th>Payment</th><th>${t("status")}</th></tr></thead>
      <tbody>${S.orders.map((o, i) => `<tr>
        <td><b style="font-weight:400">${o.code}</b><br><small class="muted">${o.date}</small></td>
        <td>${esc(o.name)}<br><small class="muted">${esc(o.phone)}</small></td>
        <td>${o.items.reduce((n, x) => n + x.qty, 0)}</td><td>${money(o.total)}</td>
        <td>${esc(o.payment)}</td>
        <td><select class="mini-btn" data-act="adm-status" data-i="${i}">
          ${["Received", "Confirmed", "Out for delivery", "Delivered"].map(s => `<option ${o.status === s ? "selected" : ""}>${s}</option>`).join("")}
        </select></td></tr>`).join("")}</tbody></table></div>`
      : `<div class="empty-state"><h3>No orders yet</h3></div>`;
  } else if (S.adm.tab === "promos") {
    body = `<div class="table-wrap"><table class="data">
      <thead><tr><th>Code</th><th>Offer</th><th>${t("status")}</th><th>${t("actions")}</th></tr></thead>
      <tbody>${S.promos.map((pr, i) => `<tr><td><b style="font-weight:400">${esc(pr.code)}</b></td><td>${esc(pr.label)}</td>
        <td><span class="pill ${pr.active ? "ok" : "bad"}">${pr.active ? "Active" : "Paused"}</span></td>
        <td class="row-actions"><button class="mini-btn" data-act="adm-promo" data-i="${i}">${pr.active ? "Pause" : "Activate"}</button></td></tr>`).join("")}
      </tbody></table></div>
      <div class="card-box" style="margin-top:18px"><h3>New promo</h3>
        <div class="form-grid two" style="margin-top:12px">
          <div class="field"><label>Code</label><input id="promoCode" placeholder="KIGALI10"></div>
          <div class="field"><label>Offer</label><input id="promoLabel" placeholder="10% off oils"></div>
        </div>
        <button class="btn sm" style="margin-top:12px" data-act="adm-promo-add">Create</button>
      </div>`;
  } else if (S.adm.tab === "reviews") {
    const all = Object.entries(S.userReviews).flatMap(([pid, arr]) => arr.map((r, i) => ({ pid, r, i })));
    body = all.length ? all.map(({ pid, r, i }) => `<div class="list-card">
        <div class="avatar">${esc((r.name || "?").slice(0, 2).toUpperCase())}</div>
        <div class="lc-info"><b>${esc(prod(pid) ? prod(pid).name : pid)} — ${esc(r.name)}</b><span class="stars">${stars(r.stars)}</span><br><span>${esc(r.text)}</span></div>
        <span class="pill ${r.approved === false ? "bad" : r.pending ? "warn" : "ok"}">${r.approved === false ? "Hidden" : r.pending ? "Pending" : "Live"}</span>
        <button class="mini-btn" data-act="adm-rev" data-pid="${pid}" data-i="${i}">${r.approved === false ? "Approve" : "Hide"}</button>
      </div>`).join("") : `<div class="empty-state"><h3>No customer reviews submitted yet</h3></div>`;
  } else {
    const best = [...PRODUCTS].sort((a, b) => b.reviews - a.reviews).slice(0, 6);
    const max = best[0].reviews;
    body = `<div class="stat-grid">
        <div class="stat"><span>Revenue</span><b>${money(revenue)}</b></div>
        <div class="stat"><span>Orders</span><b>${S.orders.length}</b></div>
        <div class="stat"><span>Products</span><b>${PRODUCTS.length}</b></div>
        <div class="stat"><span>Avg. rating</span><b>4.7 ★</b></div>
      </div>
      <div class="card-box"><h3>Best sellers (by reviews)</h3>
        ${best.map(p => `<div style="margin-top:12px"><div style="display:flex;justify-content:space-between;font-size:.87rem"><span>${esc(p.name)} — ${esc(brandName(p.brand))}</span><b>${p.reviews}</b></div>
        <div class="bar"><i style="width:${(p.reviews / max) * 100}%"></i></div></div>`).join("")}
      </div>
      <div class="card-box" style="margin-top:16px"><h3>Low stock alerts</h3>
        ${PRODUCTS.filter(p => stockOf(p) !== "in").map(p => `<div class="landmark"><b>!</b><span>${esc(p.name)} — ${stockOf(p) === "out" ? "Out of stock" : "Low stock"}</span></div>`).join("") || '<p class="muted">All products in stock.</p>'}
      </div>`;
  }

  return `<div class="page-head"><div class="container"><span class="kicker">Internal</span><h1>${t("admin")}</h1><p>Manage products, orders, promotions and reports.</p></div></div>
  <div class="page-body"><div class="container">
    <div class="tabs">${tabs.map(([k, l]) => `<button class="tab ${S.adm.tab === k ? "on" : ""}" data-act="adm-tab" data-k="${k}">${l}</button>`).join("")}</div>
    ${body}
  </div></div>`;
}

/* -------- static pages -------- */
const PAGES = {
  returns: {
    title: "Returns & Exchanges",
    body: `<p>Unopened and factory-sealed items can be exchanged or returned within <b>7 days</b> of purchase with the original receipt.</p>
      <p>Opened fragrances: because of hygiene, we cannot resell them — but we still want you happy. We offer an <b>exchange of equal value</b> or store credit within 7 days, provided at least 70% of the product remains.</p>
      <p>Custom blends and engraved jewelry are made for you and cannot be returned, unless there is a mixing error on our side — in that case we remake it free.</p>
      <p>Delivery issues: if an item arrives damaged or wrong, message us on WhatsApp with a photo within 24 hours and we replace it the same day.</p>`
  },
  privacy: {
    title: "Privacy Policy",
    body: `<p>We only collect what we need to deliver your order: name, phone number, delivery address and optional email. We never sell your data.</p>
      <p>Payments via MTN MoMo and Airtel Money are processed by the mobile operators — we never see or store your PIN.</p>
      <p>WhatsApp and email broadcasts are opt-out at any time by replying STOP. Order records are kept for accounting and warranty purposes.</p>
      <p>This site stores only local preferences (language, cart, wishlist) in your browser. Secure checkout runs over HTTPS.</p>`
  },
  authenticity: {
    title: "Authenticity & Sourcing",
    body: `<p>Every fragrance at Imibavu Collection is sourced from authorised distributors and arrives <b>factory-sealed</b> with an intact batch code you can verify.</p>
      <p>We do not sell refills, decants from unknown sources, or "inspired" oils labelled as originals. Designer-inspired fragrances are clearly tagged as <b>Inspired by</b> on their product page — they are legal alternative compositions, never counterfeit branding.</p>
      <p>If you ever believe a product you bought from us is not genuine, bring it back with the box and we refund in full.</p>`
  },
  care: {
    title: "Fragrance Care Tips",
    body: ARTICLES.map(a => `<h3>${a.title}</h3><p>${a.text}</p>`).join("")
  }
};

function viewPage(slug) {
  const pg = PAGES[slug];
  if (!pg) return `<div class="page-body"><div class="container empty-state"><h3>Page not found</h3><a class="btn ghost" href="#/">${t("home")}</a></div></div>`;
  return `<div class="page-head"><div class="container"><span class="kicker">Imibavu Collection</span><h1>${esc(pg.title)}</h1></div></div>
  <div class="page-body"><div class="container"><div class="prose">${pg.body}</div></div></div>`;
}

/* ---------------- router ---------------- */
function parseHash() {
  const raw = location.hash.slice(1) || "/";
  const [path, qs] = raw.split("?");
  return { path, params: new URLSearchParams(qs || "") };
}

function route() {
  const { path, params } = parseHash();
  const seg = path.split("/").filter(Boolean);
  let html = "", navKey = seg[0] || "home";
  const app = $("#app");

  switch (seg[0]) {
    case undefined: html = viewHome(); navKey = "home"; break;
    case "shop": html = viewShop(params); navKey = "shop"; break;
    case "product": S.pd = { size: 0, img: 0 }; html = viewProduct(seg[1]); navKey = "shop"; break;
    case "brands": html = viewBrands(); navKey = "brands"; break;
    case "blends": html = viewBlends(params); navKey = "blends"; break;
    case "quiz": html = viewQuiz(); navKey = "quiz"; break;
    case "about": html = viewAbout(); navKey = "about"; break;
    case "visit": html = viewVisit(); navKey = "visit"; break;
    case "faq": html = viewFaq(); navKey = "faq"; break;
    case "checkout": html = viewCheckout(); navKey = "shop"; break;
    case "order": html = viewOrder(seg[1]); navKey = "shop"; break;
    case "account": html = viewAccount(); navKey = "account"; break;
    case "admin": html = viewAdmin(); navKey = "admin"; break;
    case "page": html = viewPage(seg[1]); navKey = ""; break;
    default: html = viewHome(); navKey = "home";
  }

  app.innerHTML = html;
  applyI18n(app);
  $$(".main-nav a").forEach(a => a.classList.toggle("active", a.dataset.nav === navKey));
  if (seg[0] === "blends" && params.get("book")) {
    setTimeout(() => { const b = $("#book"); if (b) b.scrollIntoView({ behavior: "smooth" }); }, 60);
  } else {
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }
  document.title = titleFor(seg);
}

function titleFor(seg) {
  const base = "Imibavu Collection";
  if (!seg.length) return `${base} — Perfume Shop Kigali | Oils, Custom Blends & Jewelry`;
  const map = { shop: "Shop", product: (prod(seg[1]) || {}).name || "Product", brands: "Brands", blends: "Custom Blends", quiz: "Scent Finder", about: "About", visit: "Visit Us", faq: "FAQ", checkout: "Checkout", account: "Account", admin: "Back Office", order: "Order" };
  return `${map[seg[0]] || base} — ${base}`;
}

/* ---------------- interactions ---------------- */
function toggleWish(id) {
  const i = S.wish.indexOf(id);
  if (i >= 0) { S.wish.splice(i, 1); toast("Removed from wishlist"); }
  else { S.wish.push(id); toast("Saved to wishlist ♥"); }
  save("imibavu_wish", S.wish);
  route();
}

function openPanel(el) {
  el.classList.add("open");
  el.setAttribute("aria-hidden", "false");
  $("#overlay").hidden = false;
  requestAnimationFrame(() => $("#overlay").classList.add("show"));
  document.body.classList.add("no-scroll");
}
function closePanels() {
  $$(".mobile-nav,.cart-drawer").forEach(p => { p.classList.remove("open"); p.setAttribute("aria-hidden", "true"); });
  const ov = $("#overlay");
  ov.classList.remove("show");
  setTimeout(() => { ov.hidden = true; }, 300);
  document.body.classList.remove("no-scroll");
}

document.addEventListener("click", e => {
  const el = e.target.closest("[data-act]");
  if (!el) return;
  const act = el.dataset.act;

  switch (act) {
    case "open-prod": location.hash = "#/product/" + el.dataset.id; break;
    case "add": {
      const id = el.dataset.id;
      const size = el.dataset.size !== undefined ? +el.dataset.size : (parseHash().path.startsWith("/product") ? S.pd.size : 0);
      addToCart(id, size); break;
    }
    case "wish": toggleWish(el.dataset.id); break;
    case "qty": setQty(+el.dataset.idx, +el.dataset.d); break;
    case "cart-remove": S.cart.splice(+el.dataset.idx, 1); save("imibavu_cart", S.cart); renderCart(); if (parseHash().path === "/checkout") route(); break;
    case "close-cart": closePanels(); break;
    case "size": S.pd.size = +el.dataset.i; route(); break;
    case "img": S.pd.img = +el.dataset.i; route(); break;
    case "zoom": {
      const src = $(".pd-main-img img").src;
      const w = window.open("", "_blank");
      if (w) { w.document.write(`<img src="${src}" style="max-width:100%;margin:auto;display:block">`); w.document.title = "Imibavu"; }
      break;
    }
    case "share": {
      const p = prod(el.dataset.id);
      const data = { title: `${p.name} — Imibavu Collection`, text: p.desc, url: prodUrl(p) };
      if (navigator.share) navigator.share(data).catch(() => { });
      else { navigator.clipboard && navigator.clipboard.writeText(prodUrl(p)); toast("Link copied to clipboard"); }
      break;
    }
    case "alert": {
      S.alerts.push({ id: el.dataset.id, at: Date.now() }); save("imibavu_alerts", S.alerts);
      toast("We will message you on WhatsApp when it is back ✓"); break;
    }
    case "filter": {
      const k = el.dataset.key, v = el.dataset.val;
      S.filter[k] = S.filter[k] === v && v !== "" ? "" : v;
      refreshShop(); break;
    }
    case "clear-filters":
      S.filter = { cat: "", brand: "", gender: "", family: "", longevity: "", col: "", q: "", min: "", max: "", sort: "trending" };
      if (parseHash().path === "/shop") history.replaceState(null, "", "#/shop");
      route(); break;
    case "toggle-filters": $("#filtersPanel").classList.toggle("hidden"); break;
    case "faq": {
      const item = el.closest(".faq-item"), a = item.querySelector(".faq-a");
      const open = item.classList.toggle("open");
      a.style.maxHeight = open ? a.scrollHeight + "px" : 0;
      break;
    }
    /* quiz */
    case "quiz-pick": {
      const k = el.dataset.key, v = el.dataset.val;
      if (k === "notes") {
        const arr = S.quiz.a.notes;
        if (arr.includes(v)) arr.splice(arr.indexOf(v), 1);
        else if (arr.length < 3) arr.push(v);
        else toast("Pick up to 3 notes");
      } else S.quiz.a[k] = v;
      const scroll = window.scrollY; route(); window.scrollTo(0, scroll); break;
    }
    case "quiz-next": {
      const q = S.quiz;
      if (q.step === 0 && !q.a.mood) { toast("Pick a mood to continue"); break; }
      if (q.step === 1 && !q.a.season) { toast("Pick when you will wear it"); break; }
      if (q.step === 2 && !q.a.notes.length) { toast("Pick at least one note"); break; }
      q.step++; route(); break;
    }
    case "quiz-back": S.quiz.step = Math.max(0, S.quiz.step - 1); route(); break;
    case "quiz-restart": S.quiz = { step: 0, a: { mood: "", season: "", notes: [] } }; route(); break;
    /* blends */
    case "blend-note": {
      S.blendNotes = S.blendNotes || [];
      const v = el.dataset.val, arr = S.blendNotes;
      if (arr.includes(v)) arr.splice(arr.indexOf(v), 1);
      else if (arr.length < 3) arr.push(v);
      else toast("Maximum 3 notes — remove one first");
      const sc = window.scrollY; route(); window.scrollTo(0, sc); break;
    }
    case "blend-size": S.blendSize = +el.dataset.i; { const sc = window.scrollY; route(); window.scrollTo(0, sc); } break;
    case "blend-save": {
      const name = ($("#blendName") && $("#blendName").value.trim()) || "My blend";
      S.blendName = name;
      const { base, size, notes } = blendCalc();
      if (notes.length < 2) { toast("Choose at least 2 notes"); break; }
      S.blends.push({ name, baseLabel: base.label, notes: [...notes], sizeLabel: size.label });
      save("imibavu_blends", S.blends);
      toast(`“${name}” saved ✓`); route(); break;
    }
    case "use-combo": {
      const b = POPULAR_BLENDS[+el.dataset.i];
      S.blendBase = b.base; S.blendNotes = [...b.notes]; S.blendSize = b.size; S.blendName = b.name;
      route();
      setTimeout(() => { const el2 = $("#builder"); if (el2) el2.scrollIntoView({ behavior: "smooth" }); }, 50);
      break;
    }
    case "blend-load": {
      const b = S.blends[+el.dataset.i];
      location.hash = "#/blends";
      setTimeout(() => {
        S.blendNotes = [...b.notes]; S.blendName = b.name;
        const bi = BLEND_BASES.findIndex(x => x.label === b.baseLabel); if (bi >= 0) S.blendBase = BLEND_BASES[bi].id;
        const si = BLEND_SIZES.findIndex(x => x.label === b.sizeLabel); if (si >= 0) S.blendSize = si;
        route();
      }, 60);
      break;
    }
    case "blend-del": S.blends.splice(+el.dataset.i, 1); save("imibavu_blends", S.blends); route(); break;
    /* account / admin */
    case "acc-tab": S.acc.tab = el.dataset.k; route(); break;
    case "logout":
      api.logout();
      S.user = null; save("imibavu_user", null);
      S.acc.authMode = "login"; S.acc.devCode = "";
      route(); break;
    case "auth-mode":
      e.preventDefault();
      S.acc.authMode = el.dataset.mode; S.acc.devCode = "";
      route(); break;
    case "otp-resend": {
      e.preventDefault();
      api.post("/auth/otp/send", { phone: S.acc.pendingPhone, purpose: "verify_phone" })
        .then(r => { S.acc.devCode = r.devCode || ""; toast("Code sent"); route(); })
        .catch(err => toast(err.message || "Could not send code"));
      break;
    }
    case "otp-reset-send": {
      e.preventDefault();
      const form = el.closest("form");
      const phone = form ? form.querySelector('[name="phone"]').value.trim() : "";
      if (!phone) { toast("Enter your phone number first"); break; }
      api.post("/auth/forgot-password", { phone })
        .then(r => { S.acc.devCode = r.devCode || ""; toast(r.devCode ? "Code sent (console)" : "If that number has an account, a code is on its way"); route(); })
        .catch(err => toast(err.message || "Could not send code"));
      break;
    }
    case "adm-tab": S.adm.tab = el.dataset.k; route(); break;
    case "adm-hide": {
      const id = el.dataset.id, i = S.hidden.indexOf(id);
      if (i >= 0) S.hidden.splice(i, 1); else S.hidden.push(id);
      save("imibavu_hidden", S.hidden); route(); break;
    }
    case "adm-stock": {
      const p = prod(el.dataset.id), cur = stockOf(p);
      S.stock[p.id] = cur === "in" ? "out" : cur === "out" ? "in" : "in";
      save("imibavu_stock", S.stock); route(); break;
    }
    case "adm-price": {
      const p = prod(el.dataset.id);
      const v = prompt(`New price for ${p.name} (RWF):`, p.price);
      if (v && !isNaN(+v)) { p.price = +v; p.sizes = p.sizes.map(s => [s[0], +v]); toast("Price updated"); route(); }
      break;
    }
    case "adm-bulk": {
      const raw = ($("#bulkCsv") && $("#bulkCsv").value || "").trim();
      if (!raw) { toast("Paste some CSV rows first"); break; }
      let n = 0;
      raw.split("\n").forEach(line => {
        const [name, brand, category, price, color] = line.split(",").map(s => (s || "").trim());
        if (!name || !price) return;
        PRODUCTS.push({
          id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now().toString(36),
          name, brand: BRANDS.some(b => b.id === brand) ? brand : "imibavu",
          category: ["perfumes", "oils", "jewelry"].includes(category) ? category : "perfumes",
          gender: "Unisex", family: "Woody", longevity: "moderate",
          price: +price, sizes: [["50", +price]], stock: "in", trending: false, isNew: true, inspired: null,
          color: /^#[0-9a-f]{6}$/i.test(color || "") ? color : "#6b4f2f",
          notes: { top: [], heart: [], base: [] }, rating: 4.5, reviews: 0,
          season: "All year", desc: "Newly added to the Imibavu catalog."
        });
        n++;
      });
      toast(`${n} product(s) imported`); route(); break;
    }
    case "adm-status": break;
    case "adm-promo": {
      S.promos[+el.dataset.i].active = !S.promos[+el.dataset.i].active;
      save("imibavu_promos", S.promos); route(); break;
    }
    case "adm-promo-add": {
      const c = ($("#promoCode") && $("#promoCode").value || "").trim().toUpperCase();
      const l = ($("#promoLabel") && $("#promoLabel").value || "").trim();
      if (!c) { toast("Enter a code"); break; }
      S.promos.push({ code: c, label: l || "Custom offer", active: true });
      save("imibavu_promos", S.promos); toast("Promo created"); route(); break;
    }
    case "adm-rev": {
      const pid = el.dataset.pid, i = +el.dataset.i;
      const r = S.userReviews[pid][i];
      r.approved = r.approved === false ? true : false;
      r.pending = false;
      save("imibavu_reviews", S.userReviews); route(); break;
    }
    case "soon": toast("Saved ✓"); break;
  }
});

document.addEventListener("change", e => {
  const el = e.target.closest("[data-act]");
  if (!el) return;
  if (el.dataset.act === "sort") { S.filter.sort = el.value; refreshShop(); }
  if (el.dataset.act === "blend-base") { S.blendBase = el.value; const sc = window.scrollY; route(); window.scrollTo(0, sc); }
  if (el.dataset.act === "zone") {
    $$(".radio-card", el.closest(".stack")).forEach(r => r.classList.remove("on"));
    el.closest(".radio-card").classList.add("on");
    updateTotals();
  }
  if (el.dataset.act === "adm-status") {
    S.orders[+el.dataset.i].status = el.value; save("imibavu_orders", S.orders);
    toast("Order status: " + el.value);
  }
  if (el.name === "pay") {
    $$("input[name=pay]", el.form).forEach(r => r.closest(".radio-card").classList.remove("on"));
    el.closest(".radio-card").classList.add("on");
  }
});

document.addEventListener("input", e => {
  const el = e.target.closest("[data-act='price']");
  if (el) { S.filter[el.dataset.key] = el.value; refreshShop(); }
  if (e.target.id === "blendName") S.blendName = e.target.value;
});

function updateTotals() {
  const sub = cartSubtotal();
  const z = ZONES.find(x => x.id === ($("input[name=zone]:checked") || {}).value) || ZONES[0];
  const free = sub >= 60000 && z.id !== "pickup" ? 0 : z.id === "pickup" ? 0 : z.fee;
  const sl = $("#shipLine"), tl = $("#totalLine");
  if (sl) sl.textContent = free === 0 ? "Free" : money(free);
  if (tl) tl.textContent = money(sub + free);
}

/* forms */
document.addEventListener("submit", e => {
  const f = e.target;
  const kind = f.dataset.form;

  if (f.id === "newsForm" || kind === "news") {
    e.preventDefault(); f.reset();
    const ok = $("#newsOk"); if (ok) ok.hidden = false;
    toast(t("subscribed")); return;
  }

  if (kind === "review") {
    e.preventDefault();
    const id = f.dataset.id;
    const d = new FormData(f);
    S.userReviews[id] = S.userReviews[id] || [];
    S.userReviews[id].unshift({ name: d.get("name"), stars: +d.get("stars"), text: d.get("text"), pending: true, approved: null });
    save("imibavu_reviews", S.userReviews);
    toast("Review submitted — thank you!");
    route(); return;
  }

  if (kind === "booking") {
    e.preventDefault();
    const d = new FormData(f);
    const msg = `Hello Imibavu Collection, I would like to book a blending session:\n• Name: ${d.get("name")}\n• Phone: ${d.get("phone")}\n• Date: ${d.get("date")} at ${d.get("time")}\n• Notes: ${d.get("msg") || "—"}`;
    f.reset();
    toast(t("book_sent"));
    window.open(waLink(msg), "_blank");
    return;
  }

  if (kind === "auth") {
    e.preventDefault();
    const d = new FormData(f);
    const mode = f.dataset.mode;
    const btn = f.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    const fail = err => {
      if (btn) btn.disabled = false;
      toast((err && err.message) || "Something went wrong — please try again");
    };
    const normPhone = raw => {
      let p = String(raw || "").replace(/[\s\-().]/g, "");
      if (/^0\d{9}$/.test(p)) p = "+250" + p.slice(1);
      if (/^250\d{9}$/.test(p)) p = "+" + p;
      return p;
    };
    const toState = u => ({ id: u.id, name: u.name, phone: u.phone, email: u.email, role: u.role, isVerified: u.isVerified });

    if (mode === "login") {
      api.post("/auth/login", {
        identifier: String(d.get("id") || "").trim(),
        password: d.get("password"),
      }).then(r => {
        S.user = toState(r.user); save("imibavu_user", S.user);
        S.acc.authMode = "login"; S.acc.devCode = "";
        toast("Signed in ✓"); route();
      }).catch(fail);
      return;
    }

    if (mode === "register") {
      const payload = {
        name: String(d.get("name") || "").trim(),
        phone: normPhone(d.get("phone")),
        password: d.get("password"),
      };
      const email = String(d.get("email") || "").trim();
      if (email) payload.email = email;
      api.post("/auth/register", payload).then(r => {
        if (btn) btn.disabled = false;
        api.setAccessToken(r.accessToken);
        S.acc.pendingPhone = r.user.phone || "";
        S.acc.pendingUser = toState(r.user);
        S.acc.devCode = (r.otp && r.otp.devCode) || "";
        if (!r.user.phone) {
          S.user = S.acc.pendingUser; save("imibavu_user", S.user);
          toast("Account created ✓"); route(); return;
        }
        S.acc.authMode = "verify";
        toast("Account created — verify your phone");
        route();
      }).catch(fail);
      return;
    }

    if (mode === "verify") {
      api.post("/auth/otp/verify", { phone: S.acc.pendingPhone, code: String(d.get("code") || "").trim() })
        .then(() => {
          if (S.acc.pendingUser) { S.user = S.acc.pendingUser; save("imibavu_user", S.user); }
          S.acc.pendingUser = null; S.acc.devCode = ""; S.acc.authMode = "login";
          toast("Phone verified ✓"); route();
        }).catch(fail);
      return;
    }

    if (mode === "reset") {
      api.post("/auth/reset-password", {
        phone: normPhone(d.get("phone")),
        code: String(d.get("code") || "").trim(),
        newPassword: d.get("password"),
      }).then(() => {
        S.acc.authMode = "login"; S.acc.devCode = "";
        toast("Password changed — sign in");
        route();
      }).catch(fail);
      return;
    }
    return;
  }

  if (kind === "order") {
    e.preventDefault();
    const d = new FormData(f);
    const zone = ZONES.find(z => z.id === d.get("zone")) || ZONES[0];
    const sub = cartSubtotal();
    const fee = zone.id === "pickup" || sub >= 60000 ? 0 : zone.fee;
    const payMap = { momo: t("pay_momo"), cash: t("pay_cash"), pickup: t("pay_pickup") };
    const code = "IMB-" + Math.random().toString(36).slice(2, 7).toUpperCase();
    const order = {
      code, name: d.get("name"), phone: d.get("phone"), email: d.get("email") || "",
      zone: zone.id, zoneLabel: zone.label + (fee ? ` (+${money(fee)})` : " — free"),
      payment: payMap[d.get("pay")] || "Mobile Money",
      note: d.get("note") || "", promo: (d.get("promo") || "").toUpperCase(),
      items: S.cart.map(i => { const p = prod(i.pid); return { id: p.id, name: p.name, size: sizeLabel(p.sizes[i.size]), price: p.sizes[i.size][1], qty: i.qty }; }),
      total: sub + fee, status: "Received", date: new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
    };
    S.orders.unshift(order); save("imibavu_orders", S.orders);
    if (!S.user) { S.user = { phone: order.phone, name: order.name }; save("imibavu_user", S.user); }
    S.cart = []; save("imibavu_cart", S.cart); renderCart();
    toast("Order received ✓");
    location.hash = "#/order/" + code;
    return;
  }
});

/* ---------------- header wiring ---------------- */
function initHeader() {
  $("#year").textContent = new Date().getFullYear();
  $("#promoText").innerHTML = `${esc(DELIVERY_PROMO.text)} · Code <b>${esc(DELIVERY_PROMO.code)}</b>`;
  $("#navWa").href = waLink("Hello Imibavu Collection, I would like help choosing a perfume.");

  $("#menuBtn").addEventListener("click", () => openPanel($("#mobileNav")));
  $("#closeNav").addEventListener("click", closePanels);
  $("#cartBtn").addEventListener("click", () => { renderCart(); openPanel($("#cartDrawer")); });
  $("#closeCart").addEventListener("click", closePanels);
  $("#overlay").addEventListener("click", closePanels);
  $("#promoClose").addEventListener("click", () => $("#promoBanner").classList.add("gone"));
  document.addEventListener("keydown", e => { if (e.key === "Escape") closePanels(); });

  $$("#mobileNav a").forEach(a => a.addEventListener("click", closePanels));

  $("#langSelect").addEventListener("change", e => setLang(e.target.value));
  document.addEventListener("langchange", () => { applyI18n(); route(); renderCart(); });

  /* search */
  const panel = $("#searchPanel"), input = $("#searchInput"), sug = $("#searchSuggest");
  $("#searchBtn").addEventListener("click", () => {
    panel.hidden = !panel.hidden;
    if (!panel.hidden) { input.focus(); input.value = ""; sug.innerHTML = ""; }
  });
  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    if (q.length < 2) { sug.innerHTML = ""; return; }
    const hits = PRODUCTS.filter(vis).filter(p => (p.name + " " + brandName(p.brand) + " " + p.family).toLowerCase().includes(q)).slice(0, 6);
    sug.innerHTML = hits.length ? hits.map(p => `<div class="sug-item" data-act="open-prod" data-id="${p.id}">
        <img src="${productImg(p)}" alt=""><div><b>${esc(p.name)}</b><span>${esc(brandName(p.brand))} · ${money(p.price)}</span></div></div>`).join("")
      : `<div class="sug-item"><span>${t("no_results")}</span></div>`;
  });
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      S.filter.q = input.value.trim();
      panel.hidden = true; sug.innerHTML = "";
      location.hash = "#/shop?q=" + encodeURIComponent(S.filter.q);
      if (parseHash().path === "/shop") route();
    }
  });
}

/* ---------------- init ---------------- */
function withTimeout(p, ms) {
  return Promise.race([
    p,
    new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms)),
  ]);
}

async function restoreSession() {
  if (!S.user) return false; /* no previous session — skip the refresh call (avoids a 401 on every fresh visit) */
  const r = await api.refresh();
  if (r && r.user) {
    S.user = { id: r.user.id, name: r.user.name, phone: r.user.phone, email: r.user.email, role: r.user.role, isVerified: r.user.isVerified };
    save("imibavu_user", S.user);
    return true;
  }
  return false;
}

async function loadCatalog() {
  const first = await api.get("/products?limit=100&sort=featured");
  let items = first.items || [];
  for (let page = 2; page <= (first.pages || 1); page++) {
    const next = await api.get(`/products?limit=100&page=${page}&sort=featured`);
    items = items.concat(next.items || []);
  }
  if (items.length) PRODUCTS = items;
  const brands = await api.get("/brands");
  if (brands.items && brands.items.length) BRANDS = brands.items;
}

initHeader();
applyI18n();
renderCart();
window.addEventListener("hashchange", route);
route(); /* instant paint — static data.js fallback */

/* bring in the API catalog + restore any existing session */
Promise.all([
  withTimeout(restoreSession(), 2500).catch(() => {}),
  withTimeout(loadCatalog(), 3000).catch(() => {}),
]).then(() => route());
