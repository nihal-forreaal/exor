/* EXOR Medical Systems — Simple Storefront Logic */
(function () {
  "use strict";

  const PRODUCTS = window.EXOR_PRODUCTS || [];
  const CATEGORIES = window.EXOR_CATEGORIES || [];
  const FREE_SHIPPING_THRESHOLD = 5000;
  const SHIPPING_FLAT_RATE = 180;
  const PAGE_SIZE = 24;
  const WHATSAPP_NUMBER = "918129008181";
  const STORAGE_CART_KEY = "exor_simple_cart_v1";

  const state = {
    category: "all",
    search: "",
    sort: "featured",
    visibleLimit: PAGE_SIZE,
    cart: loadJson(STORAGE_CART_KEY, [])
  };

  const els = {
    categoryFilterPills: document.getElementById("category-filter-pills"),
    productGrid: document.getElementById("product-grid"),
    emptyCatalog: document.getElementById("empty-catalog"),
    catalogResultsCount: document.getElementById("catalog-results-count"),
    catalogPagination: document.getElementById("catalog-pagination"),
    paginationStatus: document.getElementById("pagination-status"),
    showMoreBtn: document.getElementById("show-more-btn"),
    showAllBtn: document.getElementById("show-all-btn"),
    searchInput: document.getElementById("catalog-search"),
    searchClearBtn: document.getElementById("search-clear-btn"),
    sortSelect: document.getElementById("catalog-sort"),
    resetFiltersBtn: document.getElementById("reset-filters-btn"),
    headerCartCount: document.getElementById("header-cart-count"),
    openCartBtn: document.getElementById("open-cart-btn"),
    closeCartBtn: document.getElementById("close-cart-btn"),
    cartBackdrop: document.getElementById("cart-backdrop"),
    cartDrawer: document.getElementById("cart-drawer"),
    cartDrawerCountText: document.getElementById("cart-drawer-count-text"),
    cartItemsContainer: document.getElementById("cart-items-container"),
    cartDrawerFooter: document.getElementById("cart-drawer-footer"),
    cartSubtotal: document.getElementById("cart-subtotal"),
    cartShipping: document.getElementById("cart-shipping"),
    cartTotal: document.getElementById("cart-total"),
    proceedCheckoutBtn: document.getElementById("proceed-checkout-btn"),
    whatsappCartBtn: document.getElementById("whatsapp-cart-btn"),
    productModal: document.getElementById("product-modal"),
    productModalContent: document.getElementById("product-modal-content"),
    checkoutModal: document.getElementById("checkout-modal"),
    checkoutFormView: document.getElementById("checkout-form-view"),
    checkoutSuccessView: document.getElementById("checkout-success-view"),
    checkoutForm: document.getElementById("checkout-form"),
    checkoutTotalsMini: document.getElementById("checkout-totals-mini"),
    contactForm: document.getElementById("contact-form"),
    toastRegion: document.getElementById("toast-region")
  };

  function loadJson(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_err) {
      return fallback;
    }
  }

  function saveJson(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (_err) {
      /* ignore */
    }
  }

  function formatINR(val) {
    const num = Number(val || 0);
    const hasFraction = Math.abs(num - Math.round(num)) > 0.001;
    return (
      "₹" +
      num.toLocaleString("en-IN", {
        minimumFractionDigits: hasFraction ? 2 : 0,
        maximumFractionDigits: hasFraction ? 2 : 0
      })
    );
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getProductById(id) {
    return PRODUCTS.find((p) => p.id === id);
  }

  function computeCartTotals() {
    let totalLines = 0;
    let totalCount = 0;
    let subtotal = 0;
    const lineDetails = [];

    for (const item of state.cart) {
      const product = getProductById(item.id);
      if (!product || item.qty <= 0) continue;
      const lineTotal = Number((product.price * item.qty).toFixed(2));
      totalLines += 1;
      totalCount += item.qty;
      subtotal += lineTotal;
      lineDetails.push({ product, qty: item.qty, lineTotal });
    }

    const shipping =
      totalLines === 0 ? 0 : subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_RATE;
    const total = Number((subtotal + shipping).toFixed(2));
    return { lineDetails, totalLines, totalCount, subtotal, shipping, total };
  }

  function buildWhatsAppCartHref(summary) {
    if (!summary || summary.totalLines === 0) {
      return `https://wa.me/${WHATSAPP_NUMBER}`;
    }
    const lines = summary.lineDetails.map(
      ({ product, qty, lineTotal }) =>
        `- ${qty} ${product.unit} x ${product.name}: ${formatINR(lineTotal)}`
    );
    const msg = ["Hello EXOR Medical Systems, order inquiry:", ...lines, `Total: ${formatINR(summary.total)}`].join("\n");
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  }

  function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    els.toastRegion.appendChild(toast);
    window.setTimeout(() => toast.remove(), 2600);
  }

  function renderPills() {
    els.categoryFilterPills.innerHTML = CATEGORIES.map((cat) => {
      const active = state.category === cat.id ? " active" : "";
      return `<button type="button" class="filter-pill${active}" role="tab" aria-selected="${
        state.category === cat.id ? "true" : "false"
      }" data-filter-cat="${escapeHtml(cat.id)}">${escapeHtml(cat.shortName || cat.name)}</button>`;
    }).join("");
  }

  function getFilteredProducts() {
    const q = state.search.trim().toLowerCase();
    let list = PRODUCTS.filter((p) => {
      if (state.category !== "all" && p.category !== state.category) return false;
      if (q) {
        const hay = [p.name, p.brand, p.categoryLabel, p.imCategory, p.sku].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (state.sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    else if (state.sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    else if (state.sort === "name-asc") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }

  function renderCatalog() {
    const filtered = getFilteredProducts();
    const visible = filtered.slice(0, state.visibleLimit);
    els.catalogResultsCount.textContent = `${filtered.length} products`;

    if (filtered.length === 0) {
      els.productGrid.innerHTML = "";
      els.emptyCatalog.hidden = false;
      els.catalogPagination.hidden = true;
      return;
    }

    els.emptyCatalog.hidden = true;
    els.productGrid.innerHTML = visible
      .map((p, idx) => {
        const tag = p.isOriginalLaunch ? '<span class="product-tag">Original</span>' : "";
        const subLine = [p.brand || p.imCategory, p.moqQty > 1 ? `MOQ ${p.moqLabel}` : ""]
          .filter(Boolean)
          .join(" • ");
        const delayMs = Math.min(idx % 6, 5) * 55;
        return `
          <article class="product-card reveal" style="transition-delay:${delayMs}ms">
            <div class="product-media" data-open-product="${escapeHtml(p.id)}">
              <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" />
              ${tag}
            </div>
            <div class="product-body">
              <h3 class="product-title"><button type="button" data-open-product="${escapeHtml(p.id)}">${escapeHtml(p.name)}</button></h3>
              <p class="product-sub">${escapeHtml(subLine)}</p>
              <div class="product-footer">
                <div>
                  <span class="price-current">${formatINR(p.price)}</span>
                  <span class="price-unit">per ${escapeHtml(p.unit)}</span>
                </div>
                <div class="product-actions">
                  <button type="button" class="btn btn-secondary btn-sm" data-open-product="${escapeHtml(p.id)}">Specs</button>
                  <button type="button" class="btn btn-primary btn-sm" data-add-cart="${escapeHtml(p.id)}">Add</button>
                </div>
              </div>
            </div>
          </article>
        `;
      })
      .join("");

    if (visible.length < filtered.length) {
      els.catalogPagination.hidden = false;
      els.paginationStatus.textContent = `Showing ${visible.length} of ${filtered.length}`;
      els.showMoreBtn.textContent = `Load ${Math.min(PAGE_SIZE, filtered.length - visible.length)} More`;
      els.showAllBtn.textContent = `Show All (${filtered.length})`;
    } else {
      els.catalogPagination.hidden = true;
    }
    observeReveals();
  }

  function addToCart(productId, qty, triggerBtn) {
    const product = getProductById(productId);
    if (!product) return;
    const addQty = Math.max(product.moqQty || 1, Number(qty) || 1);
    const existing = state.cart.find((item) => item.id === productId);
    if (existing) existing.qty += addQty;
    else state.cart.push({ id: productId, qty: addQty });
    saveJson(STORAGE_CART_KEY, state.cart);
    renderCart();
    els.headerCartCount.classList.remove("is-popping");
    void els.headerCartCount.offsetWidth;
    els.headerCartCount.classList.add("is-popping");
    if (triggerBtn) {
      const origText = triggerBtn.textContent;
      triggerBtn.textContent = "Added ✓";
      triggerBtn.classList.add("is-added");
      window.setTimeout(() => {
        triggerBtn.textContent = origText;
        triggerBtn.classList.remove("is-added");
      }, 950);
    }
    showToast(`Added ${addQty} × ${product.name}`);
  }

  function updateCartQty(productId, delta) {
    const existing = state.cart.find((item) => item.id === productId);
    if (!existing) return;
    const product = getProductById(productId);
    const minQty = product ? product.moqQty || 1 : 1;
    if (existing.qty + delta < minQty) {
      state.cart = state.cart.filter((item) => item.id !== productId);
    } else {
      existing.qty += delta;
    }
    saveJson(STORAGE_CART_KEY, state.cart);
    renderCart();
  }

  function removeFromCart(productId) {
    state.cart = state.cart.filter((item) => item.id !== productId);
    saveJson(STORAGE_CART_KEY, state.cart);
    renderCart();
  }

  function renderCart() {
    const summary = computeCartTotals();
    els.headerCartCount.textContent = String(summary.totalLines);
    els.cartDrawerCountText.textContent = String(summary.totalLines);

    if (summary.totalLines === 0) {
      els.cartItemsContainer.innerHTML = `<div class="cart-empty"><p>Your cart is empty.</p></div>`;
      els.cartDrawerFooter.hidden = true;
      return;
    }

    els.cartDrawerFooter.hidden = false;
    els.cartItemsContainer.innerHTML = summary.lineDetails
      .map(
        ({ product, qty, lineTotal }) => `
        <div class="cart-item">
          <img class="cart-item-img" src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" />
          <div>
            <div class="cart-item-top">
              <span>${escapeHtml(product.name)}</span>
              <button type="button" class="cart-remove-btn" data-cart-remove="${escapeHtml(product.id)}">Remove</button>
            </div>
            <div class="cart-item-meta">${formatINR(product.price)} / ${escapeHtml(product.unit)}</div>
            <div class="cart-item-bottom">
              <div class="qty-stepper">
                <button type="button" data-cart-dec="${escapeHtml(product.id)}" aria-label="Decrease">&minus;</button>
                <span>${qty}</span>
                <button type="button" data-cart-inc="${escapeHtml(product.id)}" aria-label="Increase">+</button>
              </div>
              <strong>${formatINR(lineTotal)}</strong>
            </div>
          </div>
        </div>`
      )
      .join("");

    els.cartSubtotal.textContent = formatINR(summary.subtotal);
    els.cartShipping.textContent = summary.shipping === 0 ? "FREE" : formatINR(summary.shipping);
    els.cartTotal.textContent = formatINR(summary.total);
    els.whatsappCartBtn.href = buildWhatsAppCartHref(summary);
  }

  function openCartDrawer() {
    els.cartBackdrop.hidden = false;
    els.cartDrawer.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeCartDrawer() {
    els.cartBackdrop.hidden = true;
    els.cartDrawer.hidden = true;
    document.body.style.overflow = "";
  }

  function openModal(modalEl) {
    modalEl.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeModal(modalEl) {
    modalEl.hidden = true;
    if (els.cartDrawer.hidden) document.body.style.overflow = "";
  }

  function openProductModal(productId) {
    const p = getProductById(productId);
    if (!p) return;
    let modalQty = p.moqQty || 1;
    const minQty = p.moqQty || 1;
    const step = minQty >= 10 ? 10 : 1;

    const specsHtml = (p.specs || [])
      .map(([k, v]) => `<tr><th>${escapeHtml(k)}</th><td>${escapeHtml(v)}</td></tr>`)
      .join("");
    const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      `Hello EXOR Medical Systems, please share quote for ${p.name} (${p.sku}).`
    )}`;

    els.productModalContent.innerHTML = `
      <div class="pm-image-wrap"><img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" /></div>
      <div class="pm-info">
        <h2 id="pm-title">${escapeHtml(p.name)}</h2>
        <div class="pm-price" id="pm-live-price">${formatINR(p.price * modalQty)}</div>
        <span class="price-unit">${formatINR(p.price)} / ${escapeHtml(p.unit)} • MOQ: ${escapeHtml(p.moqLabel)}</span>
        <p class="pm-desc">${escapeHtml(p.description)}</p>
        <div class="pm-purchase-bar">
          <div class="qty-stepper">
            <button type="button" id="pm-qty-dec" aria-label="Decrease">&minus;</button>
            <span id="pm-qty-val">${modalQty}</span>
            <button type="button" id="pm-qty-inc" aria-label="Increase">+</button>
          </div>
          <button type="button" class="btn btn-primary btn-md" id="pm-add-btn" style="flex:1;">Add to Cart</button>
          <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="btn btn-sage btn-md">WhatsApp</a>
        </div>
        <table class="specs-table"><tbody>${specsHtml}</tbody></table>
      </div>
    `;

    const qtyEl = document.getElementById("pm-qty-val");
    const priceEl = document.getElementById("pm-live-price");
    const addBtn = document.getElementById("pm-add-btn");

    function syncQty() {
      qtyEl.textContent = String(modalQty);
      const totalAmt = p.price * modalQty;
      priceEl.textContent = formatINR(totalAmt);
      addBtn.textContent = `Add ${modalQty} • ${formatINR(totalAmt)}`;
    }

    document.getElementById("pm-qty-dec").addEventListener("click", () => {
      if (modalQty - step >= minQty) {
        modalQty -= step;
        syncQty();
      }
    });
    document.getElementById("pm-qty-inc").addEventListener("click", () => {
      modalQty += step;
      syncQty();
    });
    addBtn.addEventListener("click", () => {
      addToCart(p.id, modalQty);
      closeModal(els.productModal);
      openCartDrawer();
    });

    syncQty();
    openModal(els.productModal);
  }

  function openCheckoutModal() {
    const summary = computeCartTotals();
    if (summary.totalLines === 0) return;
    els.checkoutFormView.hidden = false;
    els.checkoutSuccessView.hidden = true;
    els.checkoutTotalsMini.innerHTML = `
      <div class="total-row"><span>Items (${summary.totalCount})</span><span>${formatINR(summary.subtotal)}</span></div>
      <div class="total-row"><span>Shipping</span><span>${summary.shipping === 0 ? "FREE" : formatINR(summary.shipping)}</span></div>
      <div class="total-row grand"><span>Total</span><span>${formatINR(summary.total)}</span></div>
    `;
    closeCartDrawer();
    openModal(els.checkoutModal);
  }

  function bindEvents() {
    document.addEventListener("click", (event) => {
      const pill = event.target.closest("[data-filter-cat]");
      if (pill) {
        state.category = pill.getAttribute("data-filter-cat");
        state.visibleLimit = PAGE_SIZE;
        renderPills();
        renderCatalog();
        return;
      }
      const openProd = event.target.closest("[data-open-product]");
      if (openProd) {
        openProductModal(openProd.getAttribute("data-open-product"));
        return;
      }
      const addBtn = event.target.closest("[data-add-cart]");
      if (addBtn) {
        const pid = addBtn.getAttribute("data-add-cart");
        const prod = getProductById(pid);
        addToCart(pid, prod ? prod.moqQty : 1, addBtn);
        return;
      }
      const incBtn = event.target.closest("[data-cart-inc]");
      if (incBtn) {
        updateCartQty(incBtn.getAttribute("data-cart-inc"), 1);
        return;
      }
      const decBtn = event.target.closest("[data-cart-dec]");
      if (decBtn) {
        updateCartQty(decBtn.getAttribute("data-cart-dec"), -1);
        return;
      }
      const remBtn = event.target.closest("[data-cart-remove]");
      if (remBtn) {
        removeFromCart(remBtn.getAttribute("data-cart-remove"));
        return;
      }
      const closeModalBtn = event.target.closest("[data-close-modal]");
      if (closeModalBtn) {
        const modal = document.getElementById(closeModalBtn.getAttribute("data-close-modal"));
        if (modal) closeModal(modal);
        return;
      }
      if (event.target.classList.contains("modal-backdrop")) {
        closeModal(event.target);
      }
    });

    els.searchInput.addEventListener("input", () => {
      state.search = els.searchInput.value;
      state.visibleLimit = PAGE_SIZE;
      els.searchClearBtn.hidden = state.search.length === 0;
      renderCatalog();
    });

    els.searchClearBtn.addEventListener("click", () => {
      state.search = "";
      state.visibleLimit = PAGE_SIZE;
      els.searchInput.value = "";
      els.searchClearBtn.hidden = true;
      renderCatalog();
    });

    els.sortSelect.addEventListener("change", () => {
      state.sort = els.sortSelect.value;
      renderCatalog();
    });

    els.showMoreBtn.addEventListener("click", () => {
      state.visibleLimit += PAGE_SIZE;
      renderCatalog();
    });

    els.showAllBtn.addEventListener("click", () => {
      state.visibleLimit = PRODUCTS.length;
      renderCatalog();
    });

    els.resetFiltersBtn.addEventListener("click", () => {
      state.category = "all";
      state.search = "";
      state.sort = "featured";
      state.visibleLimit = PAGE_SIZE;
      els.searchInput.value = "";
      els.searchClearBtn.hidden = true;
      els.sortSelect.value = "featured";
      renderPills();
      renderCatalog();
    });

    els.openCartBtn.addEventListener("click", openCartDrawer);
    els.closeCartBtn.addEventListener("click", closeCartDrawer);
    els.cartBackdrop.addEventListener("click", closeCartDrawer);
    els.proceedCheckoutBtn.addEventListener("click", openCheckoutModal);

    els.checkoutForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const summary = computeCartTotals();
      const recipient = document.getElementById("chk-name").value.trim();
      const orderId = "EXOR-" + String(Math.floor(1000 + Math.random() * 9000));
      els.checkoutSuccessView.innerHTML = `
        <h2>Order Confirmed (${orderId})</h2>
        <p>Thank you, ${escapeHtml(recipient)}. Total: <strong>${formatINR(summary.total)}</strong>.</p>
        <button type="button" class="btn btn-primary btn-md" data-close-modal="checkout-modal">Done</button>
      `;
      els.checkoutFormView.hidden = true;
      els.checkoutSuccessView.hidden = false;
      state.cart = [];
      saveJson(STORAGE_CART_KEY, state.cart);
      renderCart();
      els.checkoutForm.reset();
    });

    els.contactForm.addEventListener("submit", (event) => {
      event.preventDefault();
      els.contactForm.reset();
      showToast("Inquiry sent to info@exormedicalsystems.com");
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        if (!els.productModal.hidden) closeModal(els.productModal);
        else if (!els.checkoutModal.hidden) closeModal(els.checkoutModal);
        else if (!els.cartDrawer.hidden) closeCartDrawer();
      }
    });
  }

  /* Scroll Reveal & Header Elevation */
  let revealObserver = null;
  function observeReveals() {
    document.querySelectorAll(".assurance-card, .contact-info, .contact-form").forEach((el) => {
      el.classList.add("reveal");
    });
    const targets = document.querySelectorAll(".reveal:not(.is-visible)");
    if (!("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.08, rootMargin: "0px 0px -24px 0px" }
      );
    }
    targets.forEach((el) => revealObserver.observe(el));
  }

  const headerEl = document.getElementById("top");
  window.addEventListener(
    "scroll",
    () => {
      if (headerEl) headerEl.classList.toggle("is-scrolled", window.scrollY > 18);
    },
    { passive: true }
  );

  renderPills();
  renderCatalog();
  renderCart();
  bindEvents();
  observeReveals();
})();
