const CART_KEY = "kotaking_cart";
const WHATSAPP_NUMBER = "123456789";

let cart = loadCart();

function loadCart() {
    try {
        const savedCart = localStorage.getItem(CART_KEY);
        return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
        console.warn("Could not read saved cart.", error);
        return [];
    }
}

function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
}

function formatCurrency(amount) {
    return `R${Number(amount).toFixed(2)}`;
}

function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll("[data-cart-count]").forEach((counter) => {
        counter.textContent = totalItems;
    });
}

function getToast() {
    let toast = document.getElementById("toast");

    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast";
        document.body.appendChild(toast);
    }

    return toast;
}

function showToast(message) {
    const toast = getToast();
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toast.toastTimer);
    toast.toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2300);
}

function addToCart(id, name, price) {
    const itemPrice = Number(price);
    const existingItem = cart.find((item) => item.id === id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id, name, price: itemPrice, quantity: 1 });
    }

    saveCart();
    showToast(`${name} added to cart.`);
}

function increaseQuantity(id) {
    const item = cart.find((cartItem) => cartItem.id === id);
    if (!item) {
        return;
    }

    item.quantity += 1;
    saveCart();
    renderCart();
}

function decreaseQuantity(id) {
    const itemIndex = cart.findIndex((cartItem) => cartItem.id === id);
    if (itemIndex === -1) {
        return;
    }

    if (cart[itemIndex].quantity > 1) {
        cart[itemIndex].quantity -= 1;
    } else {
        cart.splice(itemIndex, 1);
    }

    saveCart();
    renderCart();
}

function removeItem(id) {
    cart = cart.filter((item) => item.id !== id);
    saveCart();
    renderCart();
    showToast("Item removed from cart.");
}

function clearCart() {
    cart = [];
    localStorage.removeItem(CART_KEY);
    updateCartCount();
}

function renderCart() {
    const container = document.getElementById("cart-items-container");
    const summaryPanel = document.getElementById("cart-summary-block");
    const emptyState = document.getElementById("empty-cart-message");
    const summaryLines = document.getElementById("cart-lines-summary");
    const totalElement = document.getElementById("cart-total");
    const quantityElement = document.getElementById("cart-total-qty");

    if (!container || !summaryPanel || !emptyState || !summaryLines || !totalElement || !quantityElement) {
        return;
    }

    if (cart.length === 0) {
        container.innerHTML = "";
        summaryLines.innerHTML = "";
        summaryPanel.style.display = "none";
        emptyState.style.display = "block";
        totalElement.textContent = formatCurrency(0);
        quantityElement.textContent = "0";
        return;
    }

    let grandTotal = 0;
    let totalQuantity = 0;

    const itemsMarkup = cart.map((item) => {
        const lineTotal = item.price * item.quantity;
        grandTotal += lineTotal;
        totalQuantity += item.quantity;

        return `
            <article class="cart-item">
                <div class="item-info">
                    <strong>${item.name}</strong>
                    <span class="item-meta">${formatCurrency(item.price)} each - Qty ${item.quantity}</span>
                </div>
                <div class="cart-item-controls">
                    <span class="line-total">${formatCurrency(lineTotal)}</span>
                    <button class="qty-btn" type="button" onclick="decreaseQuantity('${item.id}')" aria-label="Decrease ${item.name} quantity">-</button>
                    <button class="qty-btn" type="button" onclick="increaseQuantity('${item.id}')" aria-label="Increase ${item.name} quantity">+</button>
                    <button class="remove-btn" type="button" onclick="removeItem('${item.id}')" aria-label="Remove ${item.name}">X</button>
                </div>
            </article>
        `;
    }).join("");

    const summaryMarkup = cart.map((item) => {
        const lineTotal = item.price * item.quantity;
        return `
            <div class="summary-line">
                <span>${item.name} x ${item.quantity}</span>
                <strong>${formatCurrency(lineTotal)}</strong>
            </div>
        `;
    }).join("");

    container.innerHTML = itemsMarkup;
    summaryLines.innerHTML = summaryMarkup;
    summaryPanel.style.display = "block";
    emptyState.style.display = "none";
    totalElement.textContent = formatCurrency(grandTotal);
    quantityElement.textContent = String(totalQuantity);
}

function openWhatsAppCheckout() {
    if (cart.length === 0) {
        showToast("Your cart is still empty.");
        return;
    }

    const orderType = document.getElementById("order-type")?.value || "Collection";
    const preferredTime = document.getElementById("pickup-time")?.value.trim() || "";
    const note = document.getElementById("checkout-note")?.value.trim() || "";

    let total = 0;
    let message = "Hello Kota King! I would like to place this order:\n\n";

    cart.forEach((item, index) => {
        const subtotal = item.price * item.quantity;
        total += subtotal;
        message += `${index + 1}. ${item.name} x ${item.quantity} = ${formatCurrency(subtotal)}\n`;
    });

    message += `\nOrder type: ${orderType}`;

    if (preferredTime) {
        message += `\nPreferred time: ${preferredTime}`;
    }

    if (note) {
        message += `\nOrder note: ${note}`;
    }

    message += `\n\nTotal: ${formatCurrency(total)}\n\nThank you!`;

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank");
}

function initCartPage() {
    const checkoutButton = document.getElementById("whatsapp-checkout-btn");
    const clearButton = document.getElementById("clear-cart-btn");

    if (!checkoutButton || !clearButton) {
        return;
    }

    checkoutButton.addEventListener("click", openWhatsAppCheckout);
    clearButton.addEventListener("click", () => {
        clearCart();
        renderCart();
        showToast("Cart cleared.");
    });

    renderCart();
}

function initContactForm() {
    const form = document.getElementById("contact-form");
    if (!form) {
        return;
    }

    // Keep the contact flow simple by sending the message through WhatsApp.
    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const name = document.getElementById("name")?.value.trim() || "";
        const phone = document.getElementById("phone")?.value.trim() || "";
        const message = document.getElementById("message")?.value.trim() || "";

        if (!name || !phone || !message) {
            showToast("Please complete all contact fields.");
            return;
        }

        const whatsappMessage = `Hello Kota King!\n\nName: ${name}\nPhone or WhatsApp: ${phone}\n\nMessage:\n${message}`;
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`, "_blank");
        showToast("Opening WhatsApp message.");
        form.reset();
    });
}

function initMobileNav() {
    const toggle = document.querySelector("[data-nav-toggle]");
    const nav = document.getElementById("site-nav");

    if (!toggle || !nav) {
        return;
    }

    toggle.addEventListener("click", () => {
        const isOpen = nav.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(isOpen));
    });

    nav.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
            nav.classList.remove("is-open");
            toggle.setAttribute("aria-expanded", "false");
        });
    });
}

window.addToCart = addToCart;
window.increaseQuantity = increaseQuantity;
window.decreaseQuantity = decreaseQuantity;
window.removeItem = removeItem;
window.clearCart = clearCart;
window.renderCart = renderCart;

document.addEventListener("DOMContentLoaded", () => {
    updateCartCount();
    initMobileNav();
    initCartPage();
    initContactForm();
});
