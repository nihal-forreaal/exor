/* EXOR Medical Systems — Dedicated Product Detail Page Logic */
(function () {
  "use strict";

  const PRODUCTS = window.EXOR_PRODUCTS || [];
  const CATEGORIES = window.EXOR_CATEGORIES || [];
  const FREE_SHIPPING_THRESHOLD = 5000;
  const SHIPPING_FLAT_RATE = 180;
  const WHATSAPP_NUMBER = "918129008181";
  const STORAGE_CART_KEY = "exor_simple_cart_v1";

  const state = {
    currentProduct: null,
    qty: 1,
    cart: loadJson(STORAGE_CART_KEY, [])
  };

  const els = {
    pageTitle: document.getElementById("page-title"),
    pageMetaDesc: document.getElementById("page-meta-desc"),
    bcCategoryLink: document.getElementById("bc-category-link"),
    bcProductName: document.getElementById("bc-product-name"),
    pdpContentArea: document.getElementById("pdp-content-area"),
    relatedSection: document.getElementById("related-section"),
    relatedProductGrid: document.getElementById("related-product-grid"),
    headerCartCount: document.getElementById("header-cart-count"),
    mobileCartCount: document.getElementById("mobile-cart-count"),
    mobileCartBtn: document.getElementById("mobile-cart-btn"),
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
    checkoutModal: document.getElementById("checkout-modal"),
    checkoutFormView: document.getElementById("checkout-form-view"),
    checkoutSuccessView: document.getElementById("checkout-success-view"),
    checkoutForm: document.getElementById("checkout-form"),
    checkoutTotalsMini: document.getElementById("checkout-totals-mini"),
    searchInput: document.getElementById("catalog-search"),
    searchClearBtn: document.getElementById("search-clear-btn"),
    searchSuggestions: document.getElementById("search-suggestions"),
    searchWrap: document.querySelector(".header-search"),
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
    const msg = [
      "Hello EXOR Medical Systems, order inquiry:",
      ...lines,
      `Total: ${formatINR(summary.total)}`
    ].join("\n");
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  }

  function showToast(message) {
    if (!els.toastRegion) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    els.toastRegion.appendChild(toast);
    window.setTimeout(() => toast.remove(), 2600);
  }

  function renderCart() {
    const summary = computeCartTotals();
    if (els.headerCartCount) els.headerCartCount.textContent = String(summary.totalLines);
    if (els.mobileCartCount) els.mobileCartCount.textContent = String(summary.totalLines);
    if (els.cartDrawerCountText) els.cartDrawerCountText.textContent = String(summary.totalLines);

    if (summary.totalLines === 0) {
      els.cartItemsContainer.innerHTML = `<div class="cart-empty"><p>Your cart is empty.</p></div>`;
      if (els.cartDrawerFooter) els.cartDrawerFooter.hidden = true;
      return;
    }

    if (els.cartDrawerFooter) els.cartDrawerFooter.hidden = false;
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
        </div>
      `
      )
      .join("");

    if (els.cartSubtotal) els.cartSubtotal.textContent = formatINR(summary.subtotal);
    if (els.cartShipping) {
      els.cartShipping.textContent =
        summary.shipping === 0 ? "FREE (Orders over ₹5,000)" : formatINR(summary.shipping);
    }
    if (els.cartTotal) els.cartTotal.textContent = formatINR(summary.total);
    if (els.whatsappCartBtn) els.whatsappCartBtn.href = buildWhatsAppCartHref(summary);
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

    if (els.headerCartCount) {
      els.headerCartCount.classList.remove("is-springing", "is-popping");
      void els.headerCartCount.offsetWidth;
      els.headerCartCount.classList.add("is-springing");
    }
    if (els.openCartBtn) {
      els.openCartBtn.classList.remove("is-springing");
      void els.openCartBtn.offsetWidth;
      els.openCartBtn.classList.add("is-springing");
    }
    if (els.mobileCartBtn) {
      els.mobileCartBtn.classList.remove("is-springing");
      void els.mobileCartBtn.offsetWidth;
      els.mobileCartBtn.classList.add("is-springing");
    }

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

  function openCartDrawer() {
    renderCart();
    if (els.cartBackdrop) els.cartBackdrop.hidden = false;
    if (els.cartDrawer) els.cartDrawer.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeCartDrawer() {
    if (els.cartBackdrop) els.cartBackdrop.hidden = true;
    if (els.cartDrawer) els.cartDrawer.hidden = true;
    document.body.style.overflow = "";
  }

  function openModal(modalEl) {
    if (!modalEl) return;
    modalEl.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeModal(modalEl) {
    if (!modalEl) return;
    modalEl.hidden = true;
    if (els.cartDrawer.hidden) document.body.style.overflow = "";
  }

  function openCheckoutModal() {
    const summary = computeCartTotals();
    if (summary.totalLines === 0) return;
    closeCartDrawer();
    els.checkoutFormView.hidden = false;
    els.checkoutSuccessView.hidden = true;
    els.checkoutTotalsMini.innerHTML = `
      <div style="display:flex;justify-content:space-between;"><span>Items (${summary.totalCount}):</span><strong>${formatINR(summary.subtotal)}</strong></div>
      <div style="display:flex;justify-content:space-between;"><span>Pan-India Shipping:</span><span>${summary.shipping === 0 ? "FREE" : formatINR(summary.shipping)}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:1rem;margin-top:4px;"><span>Total:</span><strong>${formatINR(summary.total)}</strong></div>
    `;
    openModal(els.checkoutModal);
  }

  function getQueryParam(key) {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has(key)) return urlParams.get(key);
    // Hash fallback: #id=... or #...
    const hash = window.location.hash.replace(/^#/, "");
    if (hash.startsWith(`${key}=`)) {
      return new URLSearchParams(hash).get(key);
    }
    if (hash && PRODUCTS.some((p) => p.id === hash)) {
      return hash;
    }
    return null;
  }

  function renderProductPage() {
    const productId = getQueryParam("id") || (PRODUCTS[0] && PRODUCTS[0].id);
    const p = getProductById(productId);

    if (!p) {
      renderNotFound();
      return;
    }

    state.currentProduct = p;
    state.qty = p.moqQty || 1;

    // Update document title and meta description
    if (els.pageTitle) {
      document.title = `${p.name} — EXOR Medical Systems Kozhikode`;
    }
    if (els.pageMetaDesc) {
      els.pageMetaDesc.content = `${p.name} (${p.sku}). Clinical equipment supplied by EXOR Medical Systems, Kozhikode. ${p.tagline || ""}`;
    }

    // Breadcrumbs
    if (els.bcCategoryLink) {
      els.bcCategoryLink.textContent = p.categoryLabel || "Catalog";
      els.bcCategoryLink.href = `index.html#catalog`;
    }
    if (els.bcProductName) {
      els.bcProductName.textContent = p.name;
    }

    const minQty = p.moqQty || 1;
    const step = minQty >= 10 ? 10 : 1;
    const waQuoteText = encodeURIComponent(
      `Hello EXOR Medical Systems, please share formal quotation for:\n- Product: ${p.name}\n- SKU: ${p.sku}\n- Quantity: ${state.qty} ${p.unit}\n- Catalog Price: ${formatINR(p.price * state.qty)}`
    );

    const specsHtml =
      p.specs && p.specs.length > 0
        ? `
        <div class="pdp-specs-card">
          <h3 class="pdp-section-heading">Technical Specifications</h3>
          <table class="specs-table">
            <tbody>
              ${p.specs
                .map(
                  ([label, val]) =>
                    `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(val)}</td></tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `
        : "";

    const tagBadge = p.isOriginalLaunch
      ? '<span class="pdp-badge badge-orig">Original Launch</span>'
      : p.badge
      ? `<span class="pdp-badge badge-brand">${escapeHtml(p.badge)}</span>`
      : "";

    els.pdpContentArea.innerHTML = `
      <div class="pdp-grid">
        <!-- Media Column -->
        <div class="pdp-media-col">
          <div class="pdp-image-card">
            ${tagBadge}
            <img id="pdp-main-image" src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" />
          </div>
          <div class="pdp-media-meta">
            <div class="meta-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span>100% Genuine Certified Stock</span>
            </div>
            <div class="meta-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
              <span>Dispatched from Kozhikode Hub</span>
            </div>
          </div>
        </div>

        <!-- Info Column -->
        <div class="pdp-info-col">
          <div class="pdp-category-line">
            <span class="pdp-cat-pill">${escapeHtml(p.categoryLabel || "Medical Equipment")}</span>
            <span class="pdp-sku">SKU: <strong>${escapeHtml(p.sku)}</strong></span>
            <span class="pdp-stock-status">✓ Ready Stock</span>
          </div>

          <h1 class="pdp-title">${escapeHtml(p.name)}</h1>

          <div class="pdp-price-box">
            <div class="pdp-live-price" id="pdp-live-price">${formatINR(p.price * state.qty)}</div>
            <div class="pdp-unit-line">
              <span>${formatINR(p.price)} per ${escapeHtml(p.unit)}</span>
              ${p.moqQty > 1 ? `<span class="pdp-moq">• Minimum Order: ${escapeHtml(p.moqLabel)}</span>` : ""}
            </div>
            <div class="pdp-tax-note">Includes GST • HSN 9018 • B2B Tax Invoice with Input Credit Provided</div>
          </div>

          <p class="pdp-tagline">${escapeHtml(p.tagline || p.description)}</p>

          <!-- Purchase Controls -->
          <div class="pdp-action-box">
            <div class="pdp-qty-row">
              <label for="pdp-qty-input">Quantity (${escapeHtml(p.unit)}s):</label>
              <div class="qty-stepper pdp-stepper">
                <button type="button" id="pdp-dec-btn" aria-label="Decrease quantity">&minus;</button>
                <input type="number" id="pdp-qty-input" value="${state.qty}" min="${minQty}" step="${step}" aria-label="Quantity" />
                <button type="button" id="pdp-inc-btn" aria-label="Increase quantity">+</button>
              </div>
            </div>

            <div class="pdp-btn-group">
              <button type="button" class="btn btn-primary btn-md pdp-add-cart-btn" id="pdp-add-cart-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.4 12.2a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 1.9-1.5L22 7H6.2"/></svg>
                Add to Cart
              </button>
              <a href="https://wa.me/${WHATSAPP_NUMBER}?text=${waQuoteText}" target="_blank" rel="noopener noreferrer" class="btn btn-sage btn-md" id="pdp-wa-btn">
                Inquire on WhatsApp
              </a>
              <a href="tel:+918129008181" class="btn btn-secondary btn-md hide-sm">
                Call Sales Desk
              </a>
            </div>
          </div>

          <!-- Trust Badges Strip -->
          <div class="pdp-trust-strip">
            <div class="trust-point">
              <strong>Pan-India Logistics</strong>
              <span>Fast courier &amp; hospital cargo dispatch</span>
            </div>
            <div class="trust-point">
              <strong>Institutional POs</strong>
              <span>Bulk supply for hospitals &amp; clinics</span>
            </div>
            <div class="trust-point">
              <strong>Direct Support</strong>
              <span>Kozhikode showroom &amp; warehouse pickup</span>
            </div>
          </div>

          ${specsHtml}

          <!-- Full Description -->
          <div class="pdp-desc-card">
            <h3 class="pdp-section-heading">Product Overview</h3>
            <p>${escapeHtml(p.description)}</p>
          </div>
        </div>
      </div>
    `;

    // Hook up PDP quantity stepper & actions
    const qtyInput = document.getElementById("pdp-qty-input");
    const decBtn = document.getElementById("pdp-dec-btn");
    const incBtn = document.getElementById("pdp-inc-btn");
    const livePriceEl = document.getElementById("pdp-live-price");
    const waBtn = document.getElementById("pdp-wa-btn");
    const addCartBtn = document.getElementById("pdp-add-cart-btn");

    function updatePdpQty(newQty) {
      state.qty = Math.max(minQty, newQty);
      if (qtyInput) qtyInput.value = state.qty;
      if (livePriceEl) livePriceEl.textContent = formatINR(p.price * state.qty);
      if (waBtn) {
        const text = encodeURIComponent(
          `Hello EXOR Medical Systems, please share formal quotation for:\n- Product: ${p.name}\n- SKU: ${p.sku}\n- Quantity: ${state.qty} ${p.unit}\n- Estimated Price: ${formatINR(p.price * state.qty)}`
        );
        waBtn.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
      }
    }

    if (decBtn) {
      decBtn.addEventListener("click", () => updatePdpQty(state.qty - step));
    }
    if (incBtn) {
      incBtn.addEventListener("click", () => updatePdpQty(state.qty + step));
    }
    if (qtyInput) {
      qtyInput.addEventListener("change", (e) => {
        updatePdpQty(parseInt(e.target.value, 10) || minQty);
      });
    }

    if (addCartBtn) {
      addCartBtn.addEventListener("click", () => {
        addToCart(p.id, state.qty, addCartBtn);
        openCartDrawer();
      });
    }

    renderRelatedProducts(p);
  }

  function renderNotFound() {
    if (els.pdpContentArea) {
      els.pdpContentArea.innerHTML = `
        <div class="pdp-not-found">
          <h2>Product Not Found</h2>
          <p>We couldn't locate this specific medical equipment SKU in our active catalog.</p>
          <a href="index.html#catalog" class="btn btn-primary btn-md">Browse Full 124 Medical Products</a>
        </div>
      `;
    }
    if (els.relatedSection) els.relatedSection.hidden = true;
  }

  function renderRelatedProducts(currentProduct) {
    if (!els.relatedSection || !els.relatedProductGrid) return;
    const sameCat = PRODUCTS.filter(
      (p) => p.category === currentProduct.category && p.id !== currentProduct.id
    );
    const related = sameCat.slice(0, 4);

    if (related.length === 0) {
      els.relatedSection.hidden = true;
      return;
    }

    els.relatedSection.hidden = false;
    els.relatedProductGrid.innerHTML = related
      .map((p) => {
        const tag = p.isOriginalLaunch ? '<span class="product-tag">Original</span>' : "";
        const subLine = [p.brand || p.imCategory, p.moqQty > 1 ? `MOQ ${p.moqLabel}` : ""]
          .filter(Boolean)
          .join(" • ");
        return `
          <article class="product-card">
            <a href="product.html?id=${encodeURIComponent(p.id)}" class="product-media">
              <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" />
              ${tag}
            </a>
            <div class="product-body">
              <h3 class="product-title"><a href="product.html?id=${encodeURIComponent(p.id)}">${escapeHtml(p.name)}</a></h3>
              <p class="product-sub">${escapeHtml(subLine)}</p>
              <div class="product-footer">
                <div>
                  <span class="price-current">${formatINR(p.price)}</span>
                  <span class="price-unit">per ${escapeHtml(p.unit)}</span>
                </div>
                <div class="product-actions">
                  <a href="product.html?id=${encodeURIComponent(p.id)}" class="btn btn-secondary btn-sm">Details</a>
                  <button type="button" class="btn btn-primary btn-sm" data-add-cart="${escapeHtml(p.id)}">Add</button>
                </div>
              </div>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function setupCartListeners() {
    if (els.openCartBtn) els.openCartBtn.addEventListener("click", openCartDrawer);
    if (els.mobileCartBtn) els.mobileCartBtn.addEventListener("click", openCartDrawer);
    if (els.closeCartBtn) els.closeCartBtn.addEventListener("click", closeCartDrawer);
    if (els.cartBackdrop) els.cartBackdrop.addEventListener("click", closeCartDrawer);

    if (els.cartItemsContainer) {
      els.cartItemsContainer.addEventListener("click", (e) => {
        const remBtn = e.target.closest("[data-cart-remove]");
        if (remBtn) {
          const pid = remBtn.getAttribute("data-cart-remove");
          state.cart = state.cart.filter((item) => item.id !== pid);
          saveJson(STORAGE_CART_KEY, state.cart);
          renderCart();
          return;
        }

        const incBtn = e.target.closest("[data-cart-inc]");
        if (incBtn) {
          const pid = incBtn.getAttribute("data-cart-inc");
          const item = state.cart.find((i) => i.id === pid);
          if (item) {
            item.qty += 1;
            saveJson(STORAGE_CART_KEY, state.cart);
            renderCart();
          }
          return;
        }

        const decBtn = e.target.closest("[data-cart-dec]");
        if (decBtn) {
          const pid = decBtn.getAttribute("data-cart-dec");
          const item = state.cart.find((i) => i.id === pid);
          if (item) {
            const product = getProductById(pid);
            const minQty = product ? product.moqQty || 1 : 1;
            if (item.qty - 1 < minQty) {
              state.cart = state.cart.filter((i) => i.id !== pid);
            } else {
              item.qty -= 1;
            }
            saveJson(STORAGE_CART_KEY, state.cart);
            renderCart();
          }
          return;
        }
      });
    }

    if (els.relatedProductGrid) {
      els.relatedProductGrid.addEventListener("click", (e) => {
        const addBtn = e.target.closest("[data-add-cart]");
        if (addBtn) {
          const pid = addBtn.getAttribute("data-add-cart");
          addToCart(pid, 1, addBtn);
        }
      });
    }

    if (els.proceedCheckoutBtn) {
      els.proceedCheckoutBtn.addEventListener("click", openCheckoutModal);
    }

    document.querySelectorAll("[data-close-modal]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const modalId = btn.getAttribute("data-close-modal");
        const modal = document.getElementById(modalId);
        if (modal) closeModal(modal);
      });
    });

    if (els.checkoutModal) {
      els.checkoutModal.addEventListener("click", (e) => {
        if (e.target === els.checkoutModal) closeModal(els.checkoutModal);
      });
    }

    if (els.checkoutForm) {
      els.checkoutForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const summary = computeCartTotals();
        const orderId = "EXOR-" + Math.floor(100000 + Math.random() * 900000);
        state.cart = [];
        saveJson(STORAGE_CART_KEY, state.cart);
        renderCart();

        els.checkoutFormView.hidden = true;
        els.checkoutSuccessView.hidden = false;
        els.checkoutSuccessView.innerHTML = `
          <h2 style="color:var(--sage-700);">Order Confirmed!</h2>
          <p>Order Reference: <strong>${orderId}</strong></p>
          <p>Thank you for choosing EXOR Medical Systems. Our Kozhikode distribution team will prepare your invoice and reach out via phone/WhatsApp.</p>
          <button type="button" class="btn btn-primary btn-md" data-close-modal="checkout-modal">Close</button>
        `;
        const closeBtn = els.checkoutSuccessView.querySelector("[data-close-modal]");
        if (closeBtn) {
          closeBtn.addEventListener("click", () => closeModal(els.checkoutModal));
        }
      });
    }

    // Keyboard ESC
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (els.checkoutModal && !els.checkoutModal.hidden) closeModal(els.checkoutModal);
        else if (els.cartDrawer && !els.cartDrawer.hidden) closeCartDrawer();
      }
    });
  }

  function setupHeaderSearch() {
    if (!els.searchInput || !els.searchSuggestions) return;

    function doSearch() {
      const q = els.searchInput.value.trim().toLowerCase();
      if (!q) {
        els.searchSuggestions.hidden = true;
        if (els.searchClearBtn) els.searchClearBtn.hidden = true;
        return;
      }
      if (els.searchClearBtn) els.searchClearBtn.hidden = false;

      const matches = PRODUCTS.filter((p) => {
        const name = (p.name || "").toLowerCase();
        const brand = (p.brand || "").toLowerCase();
        const sku = (p.sku || "").toLowerCase();
        return name.includes(q) || brand.includes(q) || sku.includes(q);
      }).slice(0, 6);

      if (matches.length === 0) {
        els.searchSuggestions.innerHTML = `<div class="search-suggest-empty">No exact matches found. Press Enter to view catalog.</div>`;
      } else {
        els.searchSuggestions.innerHTML = matches
          .map(
            (p) => `
            <a href="product.html?id=${encodeURIComponent(p.id)}" class="search-suggest-item">
              <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" />
              <div>
                <strong>${escapeHtml(p.name)}</strong>
                <span>${formatINR(p.price)} • ${escapeHtml(p.sku)}</span>
              </div>
            </a>
          `
          )
          .join("");
      }
      els.searchSuggestions.hidden = false;
    }

    els.searchInput.addEventListener("input", doSearch);
    els.searchInput.addEventListener("focus", doSearch);

    if (els.searchClearBtn) {
      els.searchClearBtn.addEventListener("click", () => {
        els.searchInput.value = "";
        els.searchSuggestions.hidden = true;
        els.searchClearBtn.hidden = true;
      });
    }

    document.addEventListener("click", (e) => {
      if (els.searchWrap && !els.searchWrap.contains(e.target)) {
        els.searchSuggestions.hidden = true;
      }
    });

    els.searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const q = els.searchInput.value.trim();
        if (q) {
          window.location.href = `index.html?search=${encodeURIComponent(q)}#catalog`;
        }
      }
    });
  }

  function init() {
    renderProductPage();
    renderCart();
    setupCartListeners();
    setupHeaderSearch();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
