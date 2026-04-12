(function () {
    var cartStore = window.cartStore;
    var favoriteStore = window.favoriteStore;
    var body = document.body;

    if (!body || !cartStore) {
        return;
    }

    var SHIPPING_COST = 7;
    var selectedIds = [];
    var searchTerm = '';
    var currentSort = { mode: 'name', direction: 1 };
    var toastTimer = null;

    var navToggle = document.querySelector('.mobile-nav-toggle');
    var primaryNav = document.querySelector('.primary-nav');
    var searchSlot = document.querySelector('.search-slot');
    var searchTrigger = document.querySelector('.search-trigger');
    var searchInput = document.getElementById('cartSearch');
    var searchClear = document.querySelector('.search-clear');
    var sortButtons = Array.prototype.slice.call(document.querySelectorAll('.sort-button'));
    var cartCounters = Array.prototype.slice.call(document.querySelectorAll('[data-cart-count]'));
    var selectAllInput = document.getElementById('selectAllCart');
    var removeSelectedBtn = document.getElementById('removeSelectedBtn');
    var cartItems = document.getElementById('cartItems');
    var cartEmpty = document.getElementById('cartEmpty');
    var pageToast = document.getElementById('pageToast');
    var summarySubtotal = document.getElementById('summarySubtotal');
    var summaryDiscount = document.getElementById('summaryDiscount');
    var summaryShipping = document.getElementById('summaryShipping');
    var summaryTotal = document.getElementById('summaryTotal');
    var payButton = document.getElementById('payButton');

    function normalize(text) {
        return (text || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    function formatPrice(value) {
        return Number(value || 0).toFixed(2) + ' z\u0142';
    }

    function showToast(message) {
        if (!pageToast) {
            return;
        }

        pageToast.textContent = message;
        pageToast.classList.add('is-visible');

        if (toastTimer) {
            window.clearTimeout(toastTimer);
        }

        toastTimer = window.setTimeout(function () {
            pageToast.classList.remove('is-visible');
        }, 1800);
    }

    function escapeHtml(text) {
        return String(text || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function syncCartCounters() {
        var count = cartStore.count();

        cartCounters.forEach(function (counter) {
            counter.textContent = String(count);
            counter.hidden = count === 0;
        });
    }

    function sortItems(items) {
        return items.slice().sort(function (left, right) {
            if (currentSort.mode === 'price') {
                return (Number(left.price) - Number(right.price)) * currentSort.direction;
            }

            return normalize(left.name).localeCompare(normalize(right.name)) * currentSort.direction;
        });
    }

    function filteredItems() {
        var items = cartStore.read();

        items = items.filter(function (item) {
            var haystack = normalize([item.name, item.seller, item.category].join(' '));
            return searchTerm === '' || haystack.indexOf(searchTerm) !== -1;
        });

        return sortItems(items);
    }

    function updateSelectionState(items) {
        selectedIds = selectedIds.filter(function (id) {
            return cartStore.read().some(function (item) {
                return item.id === id;
            });
        });

        if (selectAllInput) {
            selectAllInput.checked = items.length > 0 && items.every(function (item) {
                return selectedIds.indexOf(item.id) !== -1;
            });
        }
    }

    function renderSummary() {
        var allItems = cartStore.read();
        var subtotal = allItems.reduce(function (sum, item) {
            return sum + (Number(item.price || 0) * Number(item.quantity || 1));
        }, 0);
        var discount = 0;
        var shipping = allItems.length > 0 ? SHIPPING_COST : 0;
        var total = subtotal - discount + shipping;

        summarySubtotal.textContent = formatPrice(subtotal);
        summaryDiscount.textContent = formatPrice(discount);
        summaryShipping.textContent = formatPrice(shipping);
        summaryTotal.textContent = formatPrice(total);
    }

    function cartRow(item) {
        var isSelected = selectedIds.indexOf(item.id) !== -1;
        var isFavorite = favoriteStore ? favoriteStore.exists(item.id) : false;

        return [
            '<article class="cart-item" data-cart-id="', escapeHtml(item.id), '">',
            '<label class="cart-item-select">',
            '<input class="cart-item-checkbox" type="checkbox" ', isSelected ? 'checked' : '', '>',
            '<span class="check-visual"></span>',
            '<span class="sr-only">Wybierz produkt</span>',
            '</label>',
            '<img class="cart-item-image" src="', escapeHtml(item.image), '" alt="', escapeHtml(item.alt || item.name), '">',
            '<div class="cart-item-content">',
            '<h2>', escapeHtml(item.name), '</h2>',
            '<p>', escapeHtml(item.seller), '</p>',
            '<strong>', formatPrice(item.price), '</strong>',
            '</div>',
            '<div class="cart-item-actions">',
            '<button class="favorite-button', isFavorite ? ' is-active' : '', '" type="button" aria-label="', isFavorite ? 'Usun z ulubionych' : 'Dodaj do ulubionych', '" aria-pressed="', isFavorite ? 'true' : 'false', '">',
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5L4.9 13.6C3.2 11.9 3.2 9.1 4.9 7.4C6.6 5.7 9.3 5.7 11 7.4L12 8.4L13 7.4C14.7 5.7 17.4 5.7 19.1 7.4C20.8 9.1 20.8 11.9 19.1 13.6L12 20.5Z"></path></svg>',
            '</button>',
            '<button class="cart-trash" type="button" aria-label="Usu\u0144 produkt">',
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7H20"></path><path d="M9 7V4H15V7"></path><path d="M7 7L8 20H16L17 7"></path><path d="M10 11V17"></path><path d="M14 11V17"></path></svg>',
            '</button>',
            '<div class="cart-qty">',
            '<button class="cart-qty-btn" type="button" data-direction="-1" aria-label="Zmniejsz ilo\u015b\u0107">-</button>',
            '<span>', Number(item.quantity || 1), '</span>',
            '<button class="cart-qty-btn" type="button" data-direction="1" aria-label="Zwi\u0119ksz ilo\u015b\u0107">+</button>',
            '</div>',
            '</div>',
            '</article>'
        ].join('');
    }

    function bindCartRowActions() {
        Array.prototype.slice.call(cartItems.querySelectorAll('.cart-item')).forEach(function (itemNode) {
            var id = itemNode.dataset.cartId;

            var checkbox = itemNode.querySelector('.cart-item-checkbox');
            if (checkbox) {
                checkbox.addEventListener('change', function () {
                    if (checkbox.checked) {
                        if (selectedIds.indexOf(id) === -1) {
                            selectedIds.push(id);
                        }
                    } else {
                        selectedIds = selectedIds.filter(function (entry) {
                            return entry !== id;
                        });
                    }

                    updateSelectionState(filteredItems());
                });
            }

            var trash = itemNode.querySelector('.cart-trash');
            if (trash) {
                trash.addEventListener('click', function () {
                    cartStore.remove(id);
                    selectedIds = selectedIds.filter(function (entry) {
                        return entry !== id;
                    });
                    renderCart();
                    showToast('Produkt usuni\u0119ty z koszyka.');
                });
            }

            Array.prototype.slice.call(itemNode.querySelectorAll('.cart-qty-btn')).forEach(function (button) {
                button.addEventListener('click', function () {
                    var direction = Number(button.dataset.direction || 0);
                    var currentItem = cartStore.read().find(function (entry) {
                        return entry.id === id;
                    });

                    if (!currentItem) {
                        return;
                    }

                    var nextQuantity = Math.max(1, Number(currentItem.quantity || 1) + direction);
                    cartStore.updateQuantity(id, nextQuantity);
                    renderCart();
                });
            });

            var favoriteButton = itemNode.querySelector('.favorite-button');
            if (favoriteButton) {
                favoriteButton.addEventListener('click', function () {
                    var currentItem = cartStore.read().find(function (entry) {
                        return entry.id === id;
                    });

                    if (!favoriteStore || !currentItem) {
                        return;
                    }

                    if (favoriteStore.exists(id)) {
                        favoriteStore.remove(id);
                        favoriteButton.classList.remove('is-active');
                        favoriteButton.setAttribute('aria-pressed', 'false');
                        favoriteButton.setAttribute('aria-label', 'Dodaj do ulubionych');
                        showToast('Usuni\u0119to z ulubionych.');
                    } else {
                        favoriteStore.add(currentItem);
                        favoriteButton.classList.add('is-active');
                        favoriteButton.setAttribute('aria-pressed', 'true');
                        favoriteButton.setAttribute('aria-label', 'Usun z ulubionych');
                        showToast('Dodano do ulubionych.');
                    }
                });
            }
        });
    }

    function renderCart() {
        var items = filteredItems();

        cartItems.innerHTML = items.map(cartRow).join('');
        cartEmpty.hidden = items.length !== 0;
        updateSelectionState(items);
        renderSummary();
        syncCartCounters();
        bindCartRowActions();
    }

    if (navToggle && primaryNav) {
        navToggle.addEventListener('click', function () {
            var isOpen = primaryNav.classList.toggle('is-open');
            navToggle.setAttribute('aria-expanded', String(isOpen));
        });
    }

    if (searchTrigger) {
        searchTrigger.addEventListener('click', function (event) {
            event.preventDefault();
            var isOpen = !searchSlot.classList.contains('is-open');
            searchSlot.classList.toggle('is-open', isOpen);
            searchTrigger.setAttribute('aria-expanded', String(isOpen));

            if (isOpen && searchInput) {
                searchInput.focus();
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', function () {
            searchTerm = normalize(searchInput.value.trim());
            searchSlot.classList.toggle('has-value', searchInput.value.trim() !== '');
            renderCart();
        });
    }

    if (searchClear) {
        searchClear.addEventListener('click', function () {
            if (!searchInput) {
                return;
            }

            searchInput.value = '';
            searchTerm = '';
            searchSlot.classList.remove('has-value');
            renderCart();
            searchInput.focus();
        });
    }

    if (selectAllInput) {
        selectAllInput.addEventListener('change', function () {
            var items = filteredItems();

            if (selectAllInput.checked) {
                selectedIds = items.map(function (item) {
                    return item.id;
                });
            } else {
                selectedIds = [];
            }

            renderCart();
        });
    }

    if (removeSelectedBtn) {
        removeSelectedBtn.addEventListener('click', function () {
            if (selectedIds.length === 0) {
                showToast('Najpierw wybierz produkty do usuni\u0119cia.');
                return;
            }

            cartStore.clear(selectedIds);
            selectedIds = [];
            renderCart();
            showToast('Usuni\u0119to wybrane produkty.');
        });
    }

    sortButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            var selectedMode = button.dataset.sort || 'name';
            var nextDirection = currentSort.mode === selectedMode ? currentSort.direction * -1 : 1;

            currentSort = {
                mode: selectedMode,
                direction: nextDirection
            };

            sortButtons.forEach(function (entry) {
                var active = entry.dataset.sort === currentSort.mode;
                entry.classList.toggle('active', active);
                entry.classList.toggle('desc', active && currentSort.direction === -1);
            });

            renderCart();
        });
    });

    if (payButton) {
        payButton.addEventListener('click', function () {
            if (cartStore.read().length === 0) {
                showToast('Dodaj produkty do koszyka przed p\u0142atno\u015bci\u0105.');
                return;
            }

            showToast('Przej\u015bcie do p\u0142atno\u015bci jest gotowe do podpi\u0119cia.');
        });
    }

    document.addEventListener('click', function (event) {
        if (searchSlot && searchSlot.classList.contains('is-open') && !searchSlot.contains(event.target)) {
            searchSlot.classList.remove('is-open');
            searchTrigger.setAttribute('aria-expanded', 'false');
        }
    });

    renderCart();
})();
