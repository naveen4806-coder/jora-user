(function () {
  "use strict";

  const state = { shown: [], pending: [] };

  const recipes = {
    biryani: ["rice", "chicken", "onion", "tomato", "curd", "biryani masala"],
    "fried rice": ["rice", "carrot", "beans", "onion", "soy sauce"],
    sambar: ["toor dal", "tamarind", "sambar powder", "onion", "tomato"],
    pasta: ["pasta", "tomato", "cheese", "onion"],
    tea: ["milk", "tea", "sugar"],
    coffee: ["milk", "coffee", "sugar"]
  };

  function clean(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9\u0B80-\u0BFF]+/g, " ")
      .trim();
  }

  function escapeHTML(value) {
    return String(value || "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));
  }

  function catalogue() {
    return (window._products || []).filter(product =>
      product &&
      product.id &&
      Number(product.stock) > 0 &&
      !String(product.id).startsWith("sample-")
    );
  }

  function getShop(shopId) {
    return (window._shops || []).find(shop => shop.id === shopId);
  }

  function toItem(product, qty = 1) {
    const shop = getShop(product.shopId);

    return {
      id: product.id,
      shopId: product.shopId,
      name: product.name || "Product",
      brand: product.brand || "",
      image: product.image || "",
      pack: product.packSize || product.unit || "",
      price: Number(product.price) || 0,
      qty,
      vendor: shop ? shop.name : "Jora seller"
    };
  }

  function searchProducts(query) {
    const words = clean(query)
      .split(" ")
      .filter(word =>
        word.length > 1 &&
        ![
          "what", "are", "the", "in", "jora", "products",
          "product", "show", "find", "please", "need", "want",
          "items", "available", "list", "all"
        ].includes(word)
      );

    return catalogue()
      .map(product => {
        const searchable = clean([
          product.name,
          product.brand,
          product.category,
          product.subcategory,
          product.description,
          product.tags,
          product.packSize
        ].join(" "));

        const score = words.reduce((total, word) => {
          if (!searchable.includes(word)) return total;

          return total + (
            clean(product.brand).includes(word) ? 4 : 1
          );
        }, 0);

        return { product, score };
      })
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score || Number(a.product.price) - Number(b.product.price))
      .map(result => toItem(result.product));
  }

  function addMessage(role, text, html = "") {
    const body = document.getElementById("jora-ai-body");
    const message = document.createElement("div");

    message.className = `jai-msg ${role}`;
    message.innerHTML = `<div class="jai-bubble">${html || escapeHTML(text)}</div>`;

    body.appendChild(message);
    body.scrollTop = body.scrollHeight;
  }

  function productCards(items) {
    state.shown = items;

    return `
      <div class="jai-results">
        ${items.map((item, index) => `
          <label class="jai-card">
            ${
              item.image
                ? `<img src="${escapeHTML(item.image)}" alt="">`
                : `<span class="jai-placeholder">🛍️</span>`
            }

            <span class="jai-info">
              <b>${escapeHTML(item.name)}</b>
              <small>${escapeHTML([item.brand, item.pack, item.vendor].filter(Boolean).join(" · "))}</small>
              <strong>₹${item.price.toLocaleString("en-IN")}</strong>
            </span>

            <input
              type="checkbox"
              checked
              data-jai-item="${index}"
              aria-label="Select ${escapeHTML(item.name)}"
            >
          </label>
        `).join("")}
      </div>

      <button class="jai-review" data-jai-action="review">
        Review selected items
      </button>
    `;
  }

  function answer(text, items = [], extra = "") {
    addMessage(
      "assistant",
      text,
      `${escapeHTML(text)}${items.length ? productCards(items) : ""}${extra}`
    );
  }

  function showCatalogue() {
    const items = catalogue()
      .sort((a, b) => Number(a.price) - Number(b.price))
      .slice(0, 8)
      .map(product => toItem(product));

    answer(
      items.length
        ? `Jora currently has ${catalogue().length} available products. Here are some products you can shop.`
        : "The Jora catalogue has not loaded yet. Please refresh and try again.",
      items
    );
  }

  function showRecipe(query) {
    const recipeName = Object.keys(recipes).find(name =>
      clean(query).includes(name)
    );

    if (!recipeName) return false;

    const used = new Set();
    const items = [];

    recipes[recipeName].forEach(ingredient => {
      const item = searchProducts(ingredient).find(product => !used.has(product.id));

      if (item) {
        used.add(item.id);
        items.push(item);
      }
    });

    answer(
      items.length
        ? `I found ${items.length} Jora ingredients for ${recipeName}. Select the items you want, then I will ask before adding them to your cart.`
        : `I could not match ingredients for ${recipeName} in the current Jora catalogue.`,
      items
    );

    return true;
  }

  function respond(query) {
    const text = clean(query);

    if (/(what.*products|products.*jora|catalog|catalogue|what.*available|show.*all)/.test(text)) {
      showCatalogue();
      return;
    }

    if (showRecipe(query)) return;

    const matches = searchProducts(query).slice(0, 8);

    if (matches.length) {
      answer(
        `I found ${matches.length} matching Jora product${matches.length === 1 ? "" : "s"}. Review your selection before adding anything to the cart.`,
        matches
      );
      return;
    }

    answer(
      "I could not find that in the loaded Jora catalogue. Try a product or brand name, such as “Amul milk”, or upload a shopping-list image."
    );
  }

  function reviewItems() {
    const selectedBoxes = [...document.querySelectorAll("#jora-ai-body [data-jai-item]")];

    const selected = state.shown.filter((item, index) =>
      selectedBoxes[index]?.checked
    );

    if (!selected.length) {
      answer("Select at least one item to continue.");
      return;
    }

    // A Jora cart supports one vendor at a time.
    const groupedByShop = selected.reduce((groups, item) => {
      (groups[item.shopId] ||= []).push(item);
      return groups;
    }, {});

    const selectedShop = Object.keys(groupedByShop)
      .sort((a, b) => groupedByShop[b].length - groupedByShop[a].length)[0];

    state.pending = groupedByShop[selectedShop];

    const total = state.pending.reduce(
      (sum, item) => sum + item.price * item.qty,
      0
    );

    answer(
      `I found ${state.pending.length} item${state.pending.length === 1 ? "" : "s"} from ${state.pending[0].vendor}. Total: ₹${total.toLocaleString("en-IN")}. Add them to your cart?`,
      [],
      `
        <div class="jai-permission">
          <button data-jai-action="confirm">Yes, add to cart</button>
          <button data-jai-action="cancel">No, keep browsing</button>
        </div>
      `
    );
  }

  function confirmCart() {
    let added = 0;

    state.pending.forEach(item => {
      if (typeof window.addToCart !== "function") return;

      const input = document.createElement("input");
      input.type = "number";
      input.hidden = true;
      input.id = `qty-${typeof window.safeId === "function" ? window.safeId(item.id) : item.id}`;
      input.value = item.qty;

      document.body.appendChild(input);

      try {
        window.addToCart(item.id, item.shopId);
        added++;
      } catch (error) {
        console.warn("Jora AI cart error:", error);
      }

      input.remove();
    });

    state.pending = [];

    answer(
      added
        ? `${added} item${added === 1 ? " was" : "s were"} added to your Jora cart.`
        : "I could not update the cart. Please try again from the product page."
    );
  }

  async function readShoppingListImage(file) {
    if (!file || !file.type.startsWith("image/")) {
      answer("Please choose an image of a shopping list.");
      return;
    }

    addMessage("user", `Shopping-list image: ${file.name}`);

    if (!("TextDetector" in window)) {
      answer("Image-list reading is not available in this browser. Please type the list instead.");
      return;
    }

    try {
      const bitmap = await createImageBitmap(file);
      const detector = new TextDetector();
      const blocks = await detector.detect(bitmap);
      const text = blocks.map(block => block.rawValue).join(" ");

      const found = [];
      const used = new Set();

      clean(text).split(" ").forEach(word => {
        searchProducts(word).slice(0, 1).forEach(item => {
          if (!used.has(item.id)) {
            used.add(item.id);
            found.push(item);
          }
        });
      });

      answer(
        found.length
          ? `I read the list and found ${found.length} matching Jora items. Review them before adding to the cart.`
          : "I read the image, but could not match its words with Jora products.",
        found
      );
    } catch {
      answer("I could not read this image. Please upload a clearer shopping-list image or type the items.");
    }
  }

  function mountJoraAI() {
    const wrapper = document.createElement("div");

    wrapper.innerHTML = `
      <button class="jai-open" id="jora-ai-open">Ask Jora AI</button>

      <section class="jai-panel" id="jora-ai-panel" role="dialog" aria-label="Jora AI">
        <header class="jai-head">
          <span class="jai-avatar">J</span>

          <div>
            <b>Jora AI</b>
            <small>Catalogue & recipe assistant</small>
          </div>

          <button class="jai-close" id="jora-ai-close" aria-label="Close">×</button>
        </header>

        <main class="jai-body" id="jora-ai-body" aria-live="polite"></main>

        <footer class="jai-compose">
          <label class="jai-upload">
            ▣ Scan shopping-list image
            <input id="jora-ai-image" type="file" accept="image/*">
          </label>

          <div class="jai-row">
            <textarea
              id="jora-ai-input"
              rows="1"
              placeholder="Ask for products, brands or a recipe…"
            ></textarea>

            <button id="jora-ai-send" aria-label="Send">➜</button>
          </div>

          <div class="jai-note">
            Nothing is added without your approval.
          </div>
        </footer>
      </section>
    `;

    document.body.appendChild(wrapper);

    const panel = document.getElementById("jora-ai-panel");
    const input = document.getElementById("jora-ai-input");

    document.getElementById("jora-ai-open").onclick = () => {
      panel.classList.add("open");
      input.focus();

      if (!document.getElementById("jora-ai-body").children.length) {
        answer("Hi! Ask me for a brand, a product, a recipe, or “what products are in Jora?”.");
      }
    };

    document.getElementById("jora-ai-close").onclick = () => {
      panel.classList.remove("open");
    };

    document.getElementById("jora-ai-send").onclick = () => {
      const query = input.value.trim();

      if (!query) return;

      addMessage("user", query);
      input.value = "";
      respond(query);
    };

    input.onkeydown = event => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        document.getElementById("jora-ai-send").click();
      }
    };

    document.getElementById("jora-ai-image").onchange = event => {
      readShoppingListImage(event.target.files[0]);
      event.target.value = "";
    };

    document.getElementById("jora-ai-body").onclick = event => {
      const action = event.target.closest("[data-jai-action]")?.dataset.jaiAction;

      if (action === "review") reviewItems();
      if (action === "confirm") confirmCart();
      if (action === "cancel") answer("No items were added. You can keep browsing.");
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountJoraAI);
  } else {
    mountJoraAI();
  }
}());
