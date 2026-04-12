(function () {
    var favoriteStore = window.favoriteStore;
    var body = document.body;

    if (!body || !favoriteStore) {
        return;
    }

    var navToggle = document.querySelector('.mobile-nav-toggle');
    var primaryNav = document.querySelector('.primary-nav');
    var searchSlot = document.querySelector('.search-slot');
    var searchTrigger = document.querySelector('.search-trigger');
    var searchInput = document.getElementById('favoriteSearch');
    var searchClear = document.querySelector('.search-clear');
    var sortButtons = Array.prototype.slice.call(document.querySelectorAll('.sort-button'));
    var shortcutPills = Array.prototype.slice.call(document.querySelectorAll('.shortcut-pill[data-toast]'));
    var favoritesGrid = document.getElementById('favoritesGrid');
    var favoritesEmpty = document.getElementById('favoritesEmpty');
    var pageToast = document.getElementById('pageToast');
    var toastTimer = null;
    var currentSort = { mode: 'name', direction: 1 };
    var searchTerm = '';

    function normalize(text) {
        return (text || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
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

    function filteredItems() {
        var items = favoriteStore.read();

        items = items.filter(function (item) {
            var haystack = normalize([item.name, item.seller, item.category].join(' '));
            return searchTerm === '' || haystack.indexOf(searchTerm) !== -1;
        });

        items.sort(function (left, right) {
            if (currentSort.mode === 'price') {
                return (Number(left.price) - Number(right.price)) * currentSort.direction;
            }

            return normalize(left.name).localeCompare(normalize(right.name)) * currentSort.direction;
        });

        return items;
    }

    function favoriteCard(item) {
        return [
            '<article class="product-card" data-product-id="', escapeHtml(item.id), '">',
            '<button class="favorite-button is-active" type="button" aria-label="Usun z ulubionych" aria-pressed="true">',
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5L4.9 13.6C3.2 11.9 3.2 9.1 4.9 7.4C6.6 5.7 9.3 5.7 11 7.4L12 8.4L13 7.4C14.7 5.7 17.4 5.7 19.1 7.4C20.8 9.1 20.8 11.9 19.1 13.6L12 20.5Z"></path></svg>',
            '</button>',
            '<div class="product-media">',
            '<img src="', escapeHtml(item.image), '" alt="', escapeHtml(item.alt || item.name), '">',
            '<div class="rating-badge"><span class="rating-star">&#9734;</span><span>5.0</span></div>',
            '</div>',
            '<div class="product-content">',
            '<h2>', escapeHtml(item.name), '</h2>',
            '<p class="seller-name">', escapeHtml(item.seller), '</p>',
            '<p class="product-price">', escapeHtml(item.price), '</p>',
            '<button class="cart-button" type="button">Dodaj do koszyka</button>',
            '</div>',
            '</article>'
        ].join('');
    }

    function bindGridActions() {
        Array.prototype.slice.call(favoritesGrid.querySelectorAll('.favorite-button')).forEach(function (button) {
            button.addEventListener('click', function () {
                var card = button.closest('.product-card');
                var id = card ? card.dataset.productId : '';

                if (!id) {
                    return;
                }

                favoriteStore.remove(id);
                renderFavorites();
                showToast('Usunieto z ulubionych.');
            });
        });

        Array.prototype.slice.call(favoritesGrid.querySelectorAll('.cart-button')).forEach(function (button) {
            button.addEventListener('click', function () {
                var originalText = button.textContent;
                button.classList.add('is-added');
                button.textContent = 'Dodano';

                window.setTimeout(function () {
                    button.classList.remove('is-added');
                    button.textContent = originalText;
                }, 1200);

                showToast('Produkt dodany do koszyka.');
            });
        });
    }

    function renderFavorites() {
        var items = filteredItems();

        favoritesGrid.innerHTML = items.map(favoriteCard).join('');
        favoritesEmpty.hidden = items.length !== 0;
        bindGridActions();
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

            renderFavorites();
        });
    });

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
            renderFavorites();
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
            renderFavorites();
            searchInput.focus();
        });
    }

    if (navToggle && primaryNav) {
        navToggle.addEventListener('click', function () {
            var isOpen = primaryNav.classList.toggle('is-open');
            navToggle.setAttribute('aria-expanded', String(isOpen));
        });
    }

    shortcutPills.forEach(function (pill) {
        pill.addEventListener('click', function (event) {
            event.preventDefault();
            showToast(pill.dataset.toast);
        });
    });

    document.addEventListener('click', function (event) {
        if (searchSlot && searchSlot.classList.contains('is-open') && !searchSlot.contains(event.target)) {
            searchSlot.classList.remove('is-open');
            searchTrigger.setAttribute('aria-expanded', 'false');
        }
    });

    renderFavorites();
})();
