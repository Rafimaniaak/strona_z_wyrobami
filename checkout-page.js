(function () {
    var cartStore = window.cartStore;
    var pageShell = window.pageShell;
    var body = document.body;

    if (!body || !pageShell) {
        return;
    }

    var subtotalNode = document.getElementById('checkoutSubtotal');
    var discountNode = document.getElementById('checkoutDiscount');
    var shippingNode = document.getElementById('checkoutShipping');
    var totalNode = document.getElementById('checkoutTotal');
    var countNode = document.getElementById('checkoutItemsCount');
    var previewNode = document.getElementById('checkoutPreview');
    var continueButton = document.getElementById('checkoutContinue');
    var methodLinks = Array.prototype.slice.call(document.querySelectorAll('[data-method-link]'));
    var SHIPPING_COST = 7;

    function formatPrice(value) {
        return Number(value || 0).toFixed(2) + ' z\u0142';
    }

    function escapeHtml(text) {
        return String(text || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function items() {
        if (!cartStore) {
            return [];
        }

        return cartStore.read();
    }

    function renderSummary() {
        var currentItems = items();

        if (currentItems.length === 0) {
            return;
        }

        var subtotal = currentItems.reduce(function (sum, item) {
            return sum + (Number(item.price || 0) * Number(item.quantity || 1));
        }, 0);
        var shipping = SHIPPING_COST;
        var total = subtotal + shipping;

        if (subtotalNode) {
            subtotalNode.textContent = formatPrice(subtotal);
        }

        if (discountNode) {
            discountNode.textContent = formatPrice(0);
        }

        if (shippingNode) {
            shippingNode.textContent = formatPrice(shipping);
        }

        if (totalNode) {
            totalNode.textContent = formatPrice(total);
        }

        if (countNode) {
            countNode.textContent = String(currentItems.length);
        }

        if (previewNode) {
            previewNode.innerHTML = currentItems.slice(0, 3).map(function (item) {
                return [
                    '<img src="', escapeHtml(item.image), '" alt="', escapeHtml(item.alt || item.name), '">',
                ].join('');
            }).join('');
        }
    }

    if (continueButton) {
        continueButton.addEventListener('click', function () {
            var nextHref = continueButton.dataset.nextHref;

            if (!nextHref) {
                if (cartStore) {
                    cartStore.clear();
                    pageShell.syncCartCounters();
                }

                window.location.href = 'profil.html#orders';
                return;
            }

            window.location.href = nextHref;
        });
    }

    methodLinks.forEach(function (link) {
        link.addEventListener('click', function () {
            var href = link.getAttribute('href');

            if (!href || href === '#') {
                return;
            }

            window.location.href = href;
        });
    });

    renderSummary();
})();
