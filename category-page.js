(function () {
    var body = document.body;

    if (!body) {
        return;
    }

    var pageCategory = body.dataset.category || 'produkty';
    var favoriteStore = window.favoriteStore;
    var cartStore = window.cartStore;
    var productCatalog = window.productCatalog;
    var navToggle = document.querySelector('.mobile-nav-toggle');
    var primaryNav = document.querySelector('.primary-nav');
    var searchSlot = document.querySelector('.search-slot');
    var searchTrigger = document.querySelector('.search-trigger');
    var searchInput = document.getElementById('productSearch') || document.querySelector('.search-inline input[type="search"]');
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
    var cartCounters = Array.prototype.slice.call(document.querySelectorAll('[data-cart-count]'));
    var shortcutPills = Array.prototype.slice.call(document.querySelectorAll('.shortcut-pill[data-toast], .shortcut-pill[href]'));
    var productsSection = document.querySelector('.products-section');
    var pageToast = document.getElementById('pageToast');
    var resultsStatus = null;
    var limitControls = [];
    var toastTimer = null;
    var currentSort = { mode: 'name', direction: 1 };
    var currentLimit = 30;
    var limitOptions = [10, 30, 50];

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

    function parsePrice(value) {
        var match = String(value || '').replace(',', '.').match(/[\d.]+/);
        return match ? Number(match[0]) : 0;
    }

    function extractRating(card) {
        var value = card.querySelector('.rating-badge span:last-child');
        return value ? value.textContent.trim() : (card.dataset.rating || '4.8');
    }

    function productId(card) {
        return card.dataset.productId || pageCategory + '-' + slugify(card.dataset.name || '');
    }

    function productPayload(card) {
        var image = card.querySelector('.product-media img');
        var seller = card.querySelector('.seller-name');
        var title = card.querySelector('.product-content h2');
        var price = card.querySelector('.product-price');
        var product = {
            id: productId(card),
            name: title ? title.textContent.trim() : (card.dataset.name || ''),
            seller: seller ? seller.textContent.trim() : '',
            price: price ? price.textContent.trim() : (card.dataset.price || ''),
            image: image ? image.getAttribute('src') : '',
            alt: image ? image.getAttribute('alt') : '',
            category: pageCategory,
            page: window.location.pathname.split('/').pop() || '',
            rating: extractRating(card),
            available: card.dataset.available !== 'false'
        };

        if (productCatalog) {
            return productCatalog.enrichProduct(product);
        }

        product.detailHref = card.dataset.detailHref || 'produkt.html';
        return product;
    }

    function applyAvailabilityState(card, available) {
        var cartButton = card.querySelector('.cart-button');

        card.classList.toggle('is-unavailable', !available);
        card.dataset.available = String(available);

        if (!cartButton) {
            return;
        }

        cartButton.disabled = !available;
        cartButton.textContent = available ? 'Dodaj do koszyka' : 'Nie mamy produktu';
        cartButton.setAttribute('aria-disabled', String(!available));
    }

    function syncCardAvailability() {
        allCards().forEach(function (card) {
            var product = productPayload(card);
            applyAvailabilityState(card, Boolean(product.available));
        });
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

    function syncCartCounters() {
        if (!cartStore || cartCounters.length === 0) {
            return;
        }

        var count = cartStore.count();

        cartCounters.forEach(function (counter) {
            counter.textContent = String(count);
            counter.hidden = count === 0;
        });
    }

    function allCards() {
        return Array.prototype.slice.call(productsGrid.querySelectorAll('.product-card'));
    }

    function matchingCards() {
        return allCards().filter(function (card) {
            return card.dataset.matchesFilters !== 'false';
        });
    }

    function visibleCards() {
        return allCards().filter(function (card) {
            return !card.hidden;
        });
    }

    function syncEmptyState() {
        if (!emptyState) {
            return;
        }

        emptyState.hidden = matchingCards().length !== 0;
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

    function syncResultsStatus() {
        if (!resultsStatus) {
            return;
        }

        var matching = matchingCards().length;
        var visible = visibleCards().length;

        if (matching === 0) {
            resultsStatus.textContent = 'Brak produktow pasujacych do wybranych filtrow.';
            return;
        }

        if (matching <= currentLimit) {
            resultsStatus.textContent = 'Pokazujemy wszystkie ' + matching + ' produktow.';
            return;
        }

        resultsStatus.textContent = 'Pokazujemy ' + visible + ' z ' + matching + ' produktow.';
    }

    function syncLimitButtons() {
        limitControls.forEach(function (button) {
            var value = button.dataset.limit;
            var isActive = String(currentLimit) === value;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-pressed', String(isActive));
        });
    }

    function applyVisibilityLimit() {
        var visibleCount = 0;

        allCards().forEach(function (card) {
            var matches = card.dataset.matchesFilters !== 'false';
            var withinLimit = visibleCount < Number(currentLimit);

            card.hidden = !(matches && withinLimit);

            if (matches && withinLimit) {
                visibleCount += 1;
            }
        });

        syncEmptyState();
        syncLimitButtons();
        syncResultsStatus();
    }

    function filterProducts() {
        if (!productsGrid) {
            return;
        }

        var filters = activeFilters();
        var query = normalize(searchInput ? searchInput.value : '');

        allCards().forEach(function (card) {
            var searchable = normalize(card.dataset.search || card.dataset.name || card.textContent);
            var matchesSearch = query === '' || searchable.indexOf(query) !== -1;
            var matchesFilters = Object.keys(filters).every(function (group) {
                return filters[group].indexOf(card.dataset[group] || '') !== -1;
            });

            card.dataset.matchesFilters = String(matchesSearch && matchesFilters);
        });

        applyVisibilityLimit();
    }

    function sortProducts(mode, direction) {
        if (!productsGrid) {
            return;
        }

        var cards = allCards();

        cards.sort(function (left, right) {
            if (mode === 'price') {
                return (parsePrice(left.dataset.price) - parsePrice(right.dataset.price)) * direction;
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

    function markCurrentShortcut() {
        shortcutPills.forEach(function (pill) {
            if (!pill.hasAttribute('href')) {
                return;
            }

            var href = pill.getAttribute('href') || '';
            var isCurrent = href.indexOf(pageCategory + '.html') !== -1;

            pill.classList.toggle('is-current', isCurrent);

            if (isCurrent) {
                pill.setAttribute('aria-current', 'page');
            }
        });
    }

    function createLimitControls() {
        if (!productsSection || !productsGrid) {
            return;
        }

        var wrapper = document.createElement('div');
        wrapper.className = 'results-tools bottom-page-limit';

        var limits = document.createElement('div');
        limits.className = 'display-limit';
        limits.setAttribute('aria-label', 'Limit wyswietlanych produktow');

        var label = document.createElement('span');
        label.className = 'display-limit-label';
        label.textContent = 'Ilość produktów na stronie:';
        limits.appendChild(label);

        limitOptions.forEach(function (option) {
            var button = document.createElement('button');
            button.type = 'button';
            button.className = 'limit-button';
            button.dataset.limit = String(option);
            button.textContent = String(option);
            button.setAttribute('aria-pressed', 'false');

            button.addEventListener('click', function () {
                currentLimit = option;
                applyVisibilityLimit();
            });

            limitControls.push(button);
            limits.appendChild(button);
        });

        wrapper.appendChild(limits);
        productsSection.appendChild(wrapper);
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
            showToast('Znaleziono ' + matchingCards().length + ' produkt' + (matchingCards().length === 1 ? '' : matchingCards().length < 5 ? 'y' : 'ow') + '.');
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
            applyVisibilityLimit();
        });
    });

    favoriteButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            var card = button.closest('.product-card');
            var product = card ? productPayload(card) : null;
            var isActive;

            if (favoriteStore && product) {
                if (favoriteStore.exists(product.id)) {
                    favoriteStore.remove(product.id);
                    isActive = false;
                } else {
                    favoriteStore.add(product);
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

    allCards().forEach(function (card) {
        card.addEventListener('click', function (event) {
            if (event.target.closest('button')) {
                return;
            }

            var product = productPayload(card);
            window.location.href = product.detailHref || card.dataset.detailHref || 'produkt.html';
        });
    });

    cartButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            var originalText = button.textContent;
            var card = button.closest('.product-card');
            var product = card ? productPayload(card) : null;

            if (product && product.available === false) {
                showToast('Ten produkt jest obecnie niedostepny.');
                return;
            }

            button.classList.add('is-added');
            button.textContent = 'Dodano';

            if (cartStore && product) {
                cartStore.add(product);
                syncCartCounters();
            }

            window.setTimeout(function () {
                button.classList.remove('is-added');
                button.textContent = originalText;
            }, 1200);

            showToast('Produkt dodany do koszyka.');
        });
    });

    shortcutPills.forEach(function (pill) {
        if (!pill.dataset.toast) {
            return;
        }

        pill.addEventListener('click', function (event) {
            event.preventDefault();
            showToast(pill.dataset.toast);
        });
    });

    document.addEventListener('click', function (event) {
        var target = event.target;

        if (filterPanel && filterButton && !filterPanel.hidden && !filterPanel.contains(target) && !filterButton.contains(target)) {
            setFilterOpen(false);
        }

        if (searchSlot && searchSlot.classList.contains('is-open') && !searchSlot.contains(target)) {
            setSearchOpen(false);
        }
    });

    createLimitControls();
    syncCardAvailability();
    markCurrentShortcut();
    sortProducts(currentSort.mode, currentSort.direction);
    filterProducts();
    updateFilterButtonState(false);
    syncFavoriteButtonsFromStore();
    syncCartCounters();
})();
