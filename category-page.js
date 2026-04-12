(function () {
    var body = document.body;

    if (!body) {
        return;
    }

    var pageCategory = body.dataset.category || 'produkty';
    var favoriteStore = window.favoriteStore;
    var navToggle = document.querySelector('.mobile-nav-toggle');
    var primaryNav = document.querySelector('.primary-nav');
    var searchSlot = document.querySelector('.search-slot');
    var searchTrigger = document.querySelector('.search-trigger');
    var searchInline = document.querySelector('.search-inline');
    var searchInput = document.getElementById('productSearch');
    var searchClear = document.querySelector('.search-clear');
    var filterButton = document.querySelector('.filter-button');
    var filterPanel = document.getElementById('filterPanel');
    var filterApply = document.querySelector('.filter-apply');
    var filterChips = Array.prototype.slice.call(document.querySelectorAll('.filter-chip'));
    var productsGrid = document.getElementById('productsGrid');
    var emptyState = document.getElementById('emptyState');
    var sortButtons = Array.prototype.slice.call(document.querySelectorAll('.sort-button'));
    var favoriteButtons = Array.prototype.slice.call(document.querySelectorAll('.favorite-button'));
    var cartButtons = Array.prototype.slice.call(document.querySelectorAll('.cart-button'));
    var shortcutPills = Array.prototype.slice.call(document.querySelectorAll('.shortcut-pill[data-toast]'));
    var pageToast = document.getElementById('pageToast');
    var toastTimer = null;
    var currentSort = { mode: 'name', direction: 1 };

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

    function slugify(text) {
        return normalize(text)
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    function productId(card) {
        return card.dataset.productId || pageCategory + '-' + slugify(card.dataset.name || '');
    }

    function productPayload(card) {
        var image = card.querySelector('.product-media img');
        var seller = card.querySelector('.seller-name');
        var title = card.querySelector('.product-content h2');
        var price = card.querySelector('.product-price');

        return {
            id: productId(card),
            name: title ? title.textContent.trim() : (card.dataset.name || ''),
            seller: seller ? seller.textContent.trim() : '',
            price: price ? price.textContent.trim() : (card.dataset.price || ''),
            image: image ? image.getAttribute('src') : '',
            alt: image ? image.getAttribute('alt') : '',
            category: pageCategory,
            page: window.location.pathname.split('/').pop() || ''
        };
    }

    function syncFavoriteButtonsFromStore() {
        if (!favoriteStore) {
            return;
        }

        favoriteButtons.forEach(function (button) {
            var card = button.closest('.product-card');
            var isActive = card ? favoriteStore.exists(productId(card)) : false;

            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-pressed', String(isActive));
            button.setAttribute('aria-label', isActive ? 'Usun z ulubionych' : 'Dodaj do ulubionych');
        });
    }

    function visibleCards() {
        return Array.prototype.slice.call(productsGrid.querySelectorAll('.product-card')).filter(function (card) {
            return !card.hidden;
        });
    }

    function syncEmptyState() {
        if (!emptyState) {
            return;
        }

        emptyState.hidden = visibleCards().length !== 0;
    }

    function activeFilters() {
        return filterChips.reduce(function (groups, chip) {
            if (!chip.classList.contains('is-selected')) {
                return groups;
            }

            var group = chip.dataset.group;
            var value = chip.dataset.value;

            if (!groups[group]) {
                groups[group] = [];
            }

            groups[group].push(value);
            return groups;
        }, {});
    }

    function hasSelectedFilters() {
        return filterChips.some(function (chip) {
            return chip.classList.contains('is-selected');
        });
    }

    function updateFilterButtonState(isOpen) {
        if (!filterButton) {
            return;
        }

        var active = Boolean(isOpen) || hasSelectedFilters();
        filterButton.classList.toggle('active', active);
        filterButton.classList.toggle('has-selection', hasSelectedFilters());
        filterButton.setAttribute('aria-expanded', String(Boolean(isOpen)));
    }

    function setSearchOpen(isOpen) {
        if (!searchSlot || !searchTrigger) {
            return;
        }

        searchSlot.classList.toggle('is-open', isOpen);
        searchTrigger.setAttribute('aria-expanded', String(isOpen));

        if (isOpen && searchInput) {
            searchInput.focus();
        }
    }

    function setFilterOpen(isOpen) {
        if (!filterPanel) {
            return;
        }

        if (isOpen) {
            filterPanel.hidden = false;
            requestAnimationFrame(function () {
                filterPanel.classList.add('is-open');
            });
        } else {
            filterPanel.classList.remove('is-open');
            window.setTimeout(function () {
                if (!filterPanel.classList.contains('is-open')) {
                    filterPanel.hidden = true;
                }
            }, 160);
        }

        updateFilterButtonState(isOpen);
    }

    function filterProducts() {
        if (!productsGrid) {
            return;
        }

        var filters = activeFilters();
        var query = normalize(searchInput ? searchInput.value : '');
        var cards = Array.prototype.slice.call(productsGrid.querySelectorAll('.product-card'));

        cards.forEach(function (card) {
            var searchable = normalize(card.dataset.search || card.dataset.name || card.textContent);
            var matchesSearch = query === '' || searchable.indexOf(query) !== -1;
            var matchesFilters = Object.keys(filters).every(function (group) {
                return filters[group].indexOf(card.dataset[group] || '') !== -1;
            });

            card.hidden = !(matchesSearch && matchesFilters);
        });

        syncEmptyState();
    }

    function sortProducts(mode, direction) {
        if (!productsGrid) {
            return;
        }

        var cards = Array.prototype.slice.call(productsGrid.querySelectorAll('.product-card'));

        cards.sort(function (left, right) {
            if (mode === 'price') {
                return (Number(left.dataset.price) - Number(right.dataset.price)) * direction;
            }

            return normalize(left.dataset.name).localeCompare(normalize(right.dataset.name)) * direction;
        });

        cards.forEach(function (card) {
            productsGrid.appendChild(card);
        });

        sortButtons.forEach(function (button) {
            var isActive = button.dataset.sort === mode;
            button.classList.toggle('active', isActive);
            button.classList.toggle('desc', isActive && direction === -1);
        });
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
            setSearchOpen(!searchSlot.classList.contains('is-open'));
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', function () {
            searchSlot.classList.toggle('has-value', searchInput.value.trim() !== '');
            filterProducts();
        });
    }

    if (searchClear) {
        searchClear.addEventListener('click', function () {
            if (!searchInput) {
                return;
            }

            searchInput.value = '';
            searchSlot.classList.remove('has-value');
            filterProducts();
            searchInput.focus();
        });
    }

    if (filterButton && filterPanel) {
        filterButton.addEventListener('click', function () {
            setFilterOpen(filterPanel.hidden);
        });
    }

    filterChips.forEach(function (chip) {
        chip.addEventListener('click', function () {
            chip.classList.toggle('is-selected');
            filterProducts();
            updateFilterButtonState(false);
        });
    });

    if (filterApply) {
        filterApply.addEventListener('click', function () {
            filterProducts();
            setFilterOpen(false);
            showToast('Znaleziono ' + visibleCards().length + ' produkt' + (visibleCards().length === 1 ? '' : visibleCards().length < 5 ? 'y' : 'ow') + '.');
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

            sortProducts(currentSort.mode, currentSort.direction);
            filterProducts();
        });
    });

    favoriteButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            var card = button.closest('.product-card');
            var isActive;

            if (favoriteStore && card) {
                if (favoriteStore.exists(productId(card))) {
                    favoriteStore.remove(productId(card));
                    isActive = false;
                } else {
                    favoriteStore.add(productPayload(card));
                    isActive = true;
                }
            } else {
                isActive = button.classList.toggle('is-active');
            }

            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-pressed', String(isActive));
            button.setAttribute('aria-label', isActive ? 'Usun z ulubionych' : 'Dodaj do ulubionych');
            showToast(isActive ? 'Dodano do ulubionych.' : 'Usunieto z ulubionych.');
        });
    });

    cartButtons.forEach(function (button) {
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

    shortcutPills.forEach(function (pill) {
        pill.addEventListener('click', function (event) {
            event.preventDefault();
            showToast(pill.dataset.toast);
        });
    });

    document.addEventListener('click', function (event) {
        var target = event.target;

        if (filterPanel && !filterPanel.hidden && !filterPanel.contains(target) && !filterButton.contains(target)) {
            setFilterOpen(false);
        }

        if (searchSlot && searchSlot.classList.contains('is-open') && !searchSlot.contains(target)) {
            setSearchOpen(false);
        }
    });

    sortProducts(currentSort.mode, currentSort.direction);
    filterProducts();
    updateFilterButtonState(false);
    syncFavoriteButtonsFromStore();
})();
