(function () {
    var body = document.body;
    var productCatalog = window.productCatalog;
    var cartStore = window.cartStore;
    var SESSION_KEY = 'srp_auth_session_v1';
    var pageShell = window.pageShell || {
        showToast: function () {},
        syncCartCounters: function () {}
    };

    if (!body) {
        return;
    }

    function readSession() {
        try {
            var raw = window.localStorage.getItem(SESSION_KEY);
            var parsed = raw ? JSON.parse(raw) : null;
            if (!parsed || typeof parsed !== 'object') {
                return null;
            }

            return parsed;
        } catch (error) {
            return null;
        }
    }

    function normalize(text) {
        return String(text || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, ' ')
            .trim();
    }

    function sellerHref(name) {
        return 'seller.html?seller=' + encodeURIComponent(name || '');
    }

    function parsePrice(value) {
        var normalized = String(value || '0').replace(',', '.').replace(/[^0-9.]/g, '');
        var parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    function formatPrice(value) {
        return parsePrice(value).toFixed(2);
    }

    var sellerProductsByKey = {
        'bacowka u wojtka': [
            { name: 'Oscypek Goralski', seller: 'Bacowka u Wojtka', price: '78.00', image: 'images/Oscypek-goralski.jpg', alt: 'Oscypek Goralski', category: 'sery', rating: '5.0', stock: 18 },
            { name: 'Bundz', seller: 'Bacowka u Wojtka', price: '52.00', image: 'images/Sery - bundz.webp', alt: 'Bundz', category: 'sery', rating: '4.9', stock: 13 },
            { name: 'Redykolka', seller: 'Bacowka u Wojtka', price: '39.00', image: 'images/Redykołka.webp', alt: 'Redykolka', category: 'sery', rating: '4.8', stock: 11 }
        ],
        'adam nowak': [
            { name: 'Kielbasa Slaska', seller: 'Adam Nowak', price: '78.00', image: 'images/Oscypek-goralski.jpg', alt: 'Kielbasa Slaska', category: 'wedliny', rating: '4.9', stock: 17 },
            { name: 'Poledwica Tradycyjna', seller: 'Adam Nowak', price: '86.00', image: 'images/Oscypek-goralski.jpg', alt: 'Poledwica Tradycyjna', category: 'wedliny', rating: '5.0', stock: 9 },
            { name: 'Baleron', seller: 'Adam Nowak', price: '72.00', image: 'images/Oscypek-goralski.jpg', alt: 'Baleron', category: 'wedliny', rating: '4.8', stock: 10 }
        ]
    };

    function resolveSellerName(session) {
        var params = new URLSearchParams(window.location.search);
        var querySeller = (params.get('seller') || '').trim();
        var sessionSeller = session && session.sellerName ? String(session.sellerName).trim() : '';

        if (sessionSeller) {
            return sessionSeller;
        }

        return querySeller || 'Sprzedawca regionalny';
    }

    var session = readSession();
    if (!session || !session.email) {
        window.location.replace('logowanie.html');
        return;
    }

    if (session.role !== 'seller') {
        window.location.replace('profil.html');
        return;
    }

    var sellerName = resolveSellerName(session);
    var sellerKey = normalize(sellerName).replace(/\s+/g, '_') || 'seller';
    var storageKey = 'srp_seller_dashboard_v2_' + sellerKey;

    var headingNode = document.getElementById('sellerNameHeading');
    var statsNode = document.getElementById('sellerStats');
    var gridNode = document.getElementById('sellerProductsGrid');
    var workbenchNode = document.getElementById('sellerWorkbench');
    var dialog = document.getElementById('sellerAddDialog');
    var openDialogButton = document.getElementById('sellerAddProductButton');
    var closeDialogButton = document.getElementById('sellerCloseDialog');
    var cancelDialogButton = document.getElementById('sellerCancelDialog');
    var logoutButton = document.getElementById('sellerLogoutButton');
    var addForm = document.getElementById('sellerAddProductForm');
    var imageInput = document.getElementById('sellerProductImageInput');
    var imagePlaceholder = document.getElementById('sellerImagePlaceholder');
    var imagePreview = document.getElementById('sellerImagePreview');
    var uploadPreviewButton = document.querySelector('[data-upload-tool="preview"]');
    var uploadGalleryButton = document.querySelector('[data-upload-tool="gallery"]');
    var modeButtons = Array.prototype.slice.call(document.querySelectorAll('[data-seller-mode]'));

    var activeMode = '';
    var selectedImageDataUrl = '';

    function createDefaultProducts() {
        var key = normalize(sellerName);
        var base = sellerProductsByKey[key] || [
            { name: 'Produkt regionalny', seller: sellerName, price: '78.00', image: 'images/Oscypek-goralski.jpg', alt: 'Produkt regionalny', category: 'home', rating: '4.8', stock: 12 }
        ];

        return base.map(function (item, index) {
            var candidate = item;
            if (productCatalog && typeof productCatalog.enrichProduct === 'function') {
                candidate = productCatalog.enrichProduct(item);
            }

            return {
                id: candidate.id || 'seller-' + sellerKey + '-' + index,
                name: candidate.name,
                seller: candidate.seller || sellerName,
                price: formatPrice(candidate.price),
                image: candidate.image,
                alt: candidate.alt || candidate.name,
                category: candidate.category || 'home',
                rating: candidate.rating || '4.8',
                stock: Number.isFinite(Number(candidate.stock)) ? Number(candidate.stock) : Number(item.stock || 0),
                description: candidate.description || ''
            };
        });
    }

    function createDefaultOrders(products) {
        return [
            {
                id: 'ZAM-101',
                customer: 'Jan Kowalski',
                total: '126.00',
                status: 'Nowe',
                items: products.slice(0, 2).map(function (item) { return item.name; })
            },
            {
                id: 'ZAM-102',
                customer: 'Anna Nowak',
                total: '92.00',
                status: 'W realizacji',
                items: products.slice(1, 3).map(function (item) { return item.name; })
            }
        ];
    }

    function createDefaultReturns(products) {
        return [
            {
                id: 'ZW-201',
                orderId: 'AB2389D',
                product: products[0] ? products[0].name : 'Oscypek Góralski',
                reason: 'Złe na wygląd',
                status: 'Oczekuje'
            }
        ];
    }

    function normalizeReturnStatus(status) {
        var normalized = normalize(status);

        if (normalized === 'approved' || normalized === 'zaakceptowany' || normalized === 'zatwierdzony') {
            return 'Zatwierdzony';
        }

        if (normalized === 'issue' || normalized === 'problem' || normalized === 'problem ze zwrotem') {
            return 'Problem ze zwrotem';
        }

        if (normalized === 'contact' || normalized === 'kontakt z klientem') {
            return 'Kontakt z klientem';
        }

        return 'Oczekuje';
    }

    function loadState() {
        try {
            var raw = window.localStorage.getItem(storageKey);
            var parsed = raw ? JSON.parse(raw) : null;
            if (!parsed || !Array.isArray(parsed.products)) {
                return null;
            }

            return parsed;
        } catch (error) {
            return null;
        }
    }

    function saveState() {
        window.localStorage.setItem(storageKey, JSON.stringify(state));
    }

    var loadedState = loadState();
    var state = loadedState || (function () {
        var defaultProducts = createDefaultProducts();
        return {
            products: defaultProducts,
            orders: createDefaultOrders(defaultProducts),
            returns: createDefaultReturns(defaultProducts)
        };
    })();

    if (!Array.isArray(state.orders)) {
        state.orders = createDefaultOrders(state.products);
    }

    if (!Array.isArray(state.returns)) {
        state.returns = createDefaultReturns(state.products);
    }

    state.returns = state.returns.map(function (entry, index) {
        return {
            id: entry.id || ('ZW-' + (201 + index)),
            orderId: entry.orderId || 'AB2389D',
            product: entry.product || (state.products[0] ? state.products[0].name : 'Produkt'),
            reason: entry.reason || 'Brak opisu',
            status: normalizeReturnStatus(entry.status)
        };
    });

    if (state.returns.length > 0) {
        var hasSelected = state.returns.some(function (entry) {
            return entry.id === state.selectedReturnId;
        });
        if (!hasSelected) {
            state.selectedReturnId = state.returns[0].id;
        }
    } else {
        state.selectedReturnId = '';
    }

    function cardMarkup(product) {
        return [
            '<article class="seller-dashboard-card">',
            '<button class="favorite-button" type="button" aria-label="Ulubione" disabled>',
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5L4.9 13.6C3.2 11.9 3.2 9.1 4.9 7.4C6.6 5.7 9.3 5.7 11 7.4L12 8.4L13 7.4C14.7 5.7 17.4 5.7 19.1 7.4C20.8 9.1 20.8 11.9 19.1 13.6L12 20.5Z"></path></svg>',
            '</button>',
            '<a class="seller-product-media" href="', product.detailHref || 'produkt.html', '">',
            '<img src="', product.image, '" alt="', product.alt || product.name, '">',
            '</a>',
            '<div class="seller-dashboard-rating"><span class="rating-star">&#9734;</span><span>', product.rating || '4.8', '</span></div>',
            '<h2>', product.name, '</h2>',
            '<p class="seller-name"><a class="seller-profile-link" href="', sellerHref(product.seller), '">', product.seller, '</a></p>',
            '<div class="seller-dashboard-meta"><strong>', formatPrice(product.price), '</strong><span>zl</span></div>',
            '<p class="seller-stock">Stan: <strong>', Number(product.stock || 0), '</strong> szt.</p>',
            '<div class="seller-dashboard-actions">',
            '<a class="seller-dashboard-edit" href="', product.detailHref || 'produkt.html', '">Edytuj</a>',
            '<button class="seller-dashboard-cart" type="button" data-product-id="', product.id || '', '">Dodaj do koszyka</button>',
            '</div>',
            '</article>'
        ].join('');
    }

    function renderProductGrid() {
        if (headingNode) {
            headingNode.textContent = sellerName;
        }

        if (statsNode) {
            statsNode.textContent = 'Liczba produktow: ' + state.products.length;
        }

        if (!gridNode) {
            return;
        }

        gridNode.innerHTML = state.products.map(cardMarkup).join('');

        Array.prototype.slice.call(gridNode.querySelectorAll('.seller-dashboard-cart')).forEach(function (button) {
            button.addEventListener('click', function () {
                var id = button.getAttribute('data-product-id');
                var product = state.products.find(function (item) { return item.id === id; });
                if (!product || !cartStore) {
                    return;
                }

                cartStore.add(product);
                pageShell.syncCartCounters();
                pageShell.showToast('Produkt dodany do koszyka.');
            });
        });
    }

    function renderDeleteMode() {
        if (state.products.length === 0) {
            return '<p class="seller-workbench-empty">Brak produktow do usuniecia.</p>';
        }

        return [
            '<div class="seller-workbench-head"><h3>Usun produkt</h3><p>Wybierz pozycje, ktora chcesz usunac z oferty.</p></div>',
            '<div class="seller-workbench-list">',
            state.products.map(function (item) {
                return [
                    '<article class="seller-workbench-item">',
                    '<div><strong>', item.name, '</strong><p>', formatPrice(item.price), ' zl</p></div>',
                    '<button class="seller-workbench-button is-danger" type="button" data-delete-id="', item.id, '">Usun</button>',
                    '</article>'
                ].join('');
            }).join(''),
            '</div>'
        ].join('');
    }

    function renderOrdersMode() {
        if (state.orders.length === 0) {
            return '<p class="seller-workbench-empty">Brak zamowien.</p>';
        }

        return [
            '<div class="seller-workbench-head"><h3>Przeglad zamowien</h3><p>Aktualizuj status realizacji.</p></div>',
            '<div class="seller-workbench-list">',
            state.orders.map(function (order) {
                return [
                    '<article class="seller-workbench-item is-block">',
                    '<div class="seller-order-row"><strong>', order.id, '</strong><span>', order.customer, '</span><span>', order.total, ' zl</span></div>',
                    '<p class="seller-order-products">', (order.items || []).join(', '), '</p>',
                    '<div class="seller-order-status">',
                    '<label>Status</label>',
                    '<select data-order-id="', order.id, '">',
                    '<option', order.status === 'Nowe' ? ' selected' : '', '>Nowe</option>',
                    '<option', order.status === 'W realizacji' ? ' selected' : '', '>W realizacji</option>',
                    '<option', order.status === 'Wyslane' ? ' selected' : '', '>Wyslane</option>',
                    '<option', order.status === 'Zakonczone' ? ' selected' : '', '>Zakonczone</option>',
                    '</select>',
                    '</div>',
                    '</article>'
                ].join('');
            }).join(''),
            '</div>'
        ].join('');
    }

    function renderInventoryMode() {
        if (state.products.length === 0) {
            return '<p class="seller-workbench-empty">Brak produktow w magazynie.</p>';
        }

        return [
            '<div class="seller-workbench-head"><h3>Zarzadzanie magazynem</h3><p>Zmien stan i zapisz dla wybranego produktu.</p></div>',
            '<div class="seller-workbench-list">',
            state.products.map(function (item) {
                return [
                    '<article class="seller-workbench-item">',
                    '<div><strong>', item.name, '</strong><p>Obecnie: ', Number(item.stock || 0), ' szt.</p></div>',
                    '<div class="seller-stock-edit">',
                    '<input type="number" min="0" value="', Number(item.stock || 0), '" data-stock-id="', item.id, '">',
                    '<button class="seller-workbench-button" type="button" data-save-stock-id="', item.id, '">Zapisz</button>',
                    '</div>',
                    '</article>'
                ].join('');
            }).join(''),
            '</div>'
        ].join('');
    }

    function renderReturnsMode() {
        if (state.returns.length === 0) {
            return '<p class="seller-workbench-empty">Brak zgloszen zwrotu.</p>';
        }

        var selectedReturnId = state.selectedReturnId || state.returns[0].id;
        var selectedReturn = state.returns.find(function (item) {
            return item.id === selectedReturnId;
        }) || null;

        var rowsMarkup = state.returns.map(function (item) {
            var isSelected = item.id === selectedReturnId;
            return [
                '<tr class="', isSelected ? 'is-selected' : '', '" data-return-row-id="', item.id, '">',
                '<td>', item.orderId, '</td>',
                '<td>', item.product, '</td>',
                '<td>', item.reason, '</td>',
                '<td>', item.status, '</td>',
                '</tr>'
            ].join('');
        }).join('');

        return [
            '<div class="seller-returns-layout">',
            '<div class="seller-returns-table-wrap">',
            '<table class="seller-returns-table">',
            '<thead><tr><th>Order id</th><th>Product name</th><th>Return reason</th><th>Status</th></tr></thead>',
            '<tbody>', rowsMarkup, '</tbody>',
            '</table>',
            '<div class="seller-returns-filler" aria-hidden="true"></div>',
            '</div>',
            '<div class="seller-returns-actions">',
            '<p class="seller-returns-selected">Wybrany zwrot: ', selectedReturn ? selectedReturn.orderId : '-', '</p>',
            '<button class="seller-workbench-button" type="button" data-return-command="approve">Zatwierdz zwrot</button>',
            '<button class="seller-workbench-button" type="button" data-return-command="issue">Problem ze zwrotem</button>',
            '<button class="seller-workbench-button" type="button" data-return-command="contact">Skontaktuj sie z klientem</button>',
            '</div>',
            '</div>'
        ].join('');
    }

    function renderWorkbench() {
        if (!workbenchNode) {
            return;
        }

        if (!activeMode) {
            workbenchNode.innerHTML = '<p class="seller-workbench-empty">Wybierz narzedzie z lewej strony, aby zarzadzac panelem.</p>';
            return;
        }

        if (activeMode === 'delete') {
            workbenchNode.innerHTML = renderDeleteMode();
            return;
        }

        if (activeMode === 'orders') {
            workbenchNode.innerHTML = renderOrdersMode();
            return;
        }

        if (activeMode === 'inventory') {
            workbenchNode.innerHTML = renderInventoryMode();
            return;
        }

        if (activeMode === 'returns') {
            workbenchNode.innerHTML = renderReturnsMode();
        }
    }

    function setActiveMode(mode) {
        activeMode = mode === activeMode ? '' : mode;
        body.classList.toggle('seller-has-workbench', activeMode !== '');
        body.classList.toggle('seller-mode-returns', activeMode === 'returns');

        modeButtons.forEach(function (button) {
            var isActive = button.getAttribute('data-seller-mode') === activeMode;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-pressed', String(isActive));
        });

        renderWorkbench();
    }

    function setDialogOpen(isOpen) {
        if (!dialog) {
            return;
        }

        dialog.hidden = !isOpen;
        body.classList.toggle('dialog-open', isOpen);
    }

    function updateImagePlaceholder() {
        if (!imagePlaceholder || !imagePreview) {
            return;
        }

        var hasImage = Boolean(selectedImageDataUrl);
        imagePlaceholder.classList.toggle('is-filled', hasImage);
        imagePreview.hidden = !hasImage;
        imagePreview.src = hasImage ? selectedImageDataUrl : '';
    }

    function resetImageSelection() {
        selectedImageDataUrl = '';
        if (imageInput) {
            imageInput.value = '';
        }

        updateImagePlaceholder();
    }

    function openImagePicker() {
        if (imageInput) {
            imageInput.click();
        }
    }

    function logout() {
        try {
            window.localStorage.removeItem(SESSION_KEY);
        } catch (error) {
            // ignore
        }

        window.location.replace('logowanie.html');
    }

    function removeProduct(productId) {
        var before = state.products.length;
        state.products = state.products.filter(function (item) {
            return item.id !== productId;
        });

        if (before === state.products.length) {
            return;
        }

        saveState();
        renderProductGrid();
        renderWorkbench();
        pageShell.showToast('Produkt usuniety.');
    }

    function saveStock(productId) {
        var input = workbenchNode ? workbenchNode.querySelector('input[data-stock-id="' + productId + '"]') : null;
        if (!input) {
            return;
        }

        var next = Math.max(0, Number(input.value || 0));
        var product = state.products.find(function (item) { return item.id === productId; });

        if (!product) {
            return;
        }

        product.stock = next;
        saveState();
        renderProductGrid();
        renderWorkbench();
        pageShell.showToast('Stan magazynowy zapisany.');
    }

    function setReturnStatus(returnId, status) {
        var entry = state.returns.find(function (item) { return item.id === returnId; });
        if (!entry) {
            return;
        }

        entry.status = normalizeReturnStatus(status);
        state.selectedReturnId = returnId;
        saveState();
        renderWorkbench();
        pageShell.showToast('Status zwrotu zaktualizowany.');
    }

    if (openDialogButton) {
        openDialogButton.addEventListener('click', function () {
            setDialogOpen(true);
        });
    }

    if (closeDialogButton) {
        closeDialogButton.addEventListener('click', function () {
            setDialogOpen(false);
        });
    }

    if (cancelDialogButton) {
        cancelDialogButton.addEventListener('click', function () {
            setDialogOpen(false);
        });
    }

    if (dialog) {
        dialog.addEventListener('click', function (event) {
            if (event.target === dialog) {
                setDialogOpen(false);
            }
        });
    }

    if (addForm) {
        addForm.addEventListener('submit', function (event) {
            event.preventDefault();

            var name = String(addForm.elements.name.value || '').trim();
            var price = formatPrice(addForm.elements.price.value || '0');
            var stock = Math.max(0, Number(addForm.elements.stock.value || 0));
            var category = String(addForm.elements.category.value || '').trim() || 'home';
            var owner = String(addForm.elements.owner.value || '').trim() || sellerName;
            var description = String(addForm.elements.description.value || '').trim();

            if (!name) {
                pageShell.showToast('Podaj nazwe produktu.');
                return;
            }

            var product = {
                id: 'seller-' + Date.now(),
                name: name,
                seller: owner,
                price: price,
                image: selectedImageDataUrl || 'images/Oscypek-goralski.jpg',
                alt: name,
                category: category,
                rating: '4.8',
                stock: stock,
                description: description
            };

            state.products.unshift(product);
            saveState();
            renderProductGrid();
            renderWorkbench();
            setDialogOpen(false);
            addForm.reset();
            resetImageSelection();
            pageShell.showToast('Produkt dodany.');
        });
    }

    modeButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            setActiveMode(button.getAttribute('data-seller-mode') || '');
        });
    });

    if (logoutButton) {
        logoutButton.addEventListener('click', function () {
            logout();
        });
    }

    if (uploadGalleryButton) {
        uploadGalleryButton.addEventListener('click', function () {
            openImagePicker();
        });
    }

    if (uploadPreviewButton) {
        uploadPreviewButton.addEventListener('click', function () {
            if (selectedImageDataUrl) {
                pageShell.showToast('Podglad zdjecia jest widoczny po lewej.');
                return;
            }

            openImagePicker();
        });
    }

    if (imagePlaceholder) {
        imagePlaceholder.addEventListener('click', function () {
            openImagePicker();
        });
    }

    if (imageInput) {
        imageInput.addEventListener('change', function () {
            var file = imageInput.files && imageInput.files[0];
            if (!file) {
                resetImageSelection();
                return;
            }

            if (file.type && file.type.indexOf('image/') !== 0) {
                resetImageSelection();
                pageShell.showToast('Wybierz poprawny plik obrazu.');
                return;
            }

            var reader = new FileReader();
            reader.onload = function () {
                selectedImageDataUrl = typeof reader.result === 'string' ? reader.result : '';
                updateImagePlaceholder();
            };
            reader.onerror = function () {
                resetImageSelection();
                pageShell.showToast('Nie udalo sie wczytac obrazu.');
            };
            reader.readAsDataURL(file);
        });
    }

    if (workbenchNode) {
        workbenchNode.addEventListener('click', function (event) {
            var returnRow = event.target.closest('[data-return-row-id]');
            if (returnRow) {
                state.selectedReturnId = returnRow.getAttribute('data-return-row-id');
                renderWorkbench();
                return;
            }

            var deleteButton = event.target.closest('[data-delete-id]');
            if (deleteButton) {
                removeProduct(deleteButton.getAttribute('data-delete-id'));
                return;
            }

            var stockButton = event.target.closest('[data-save-stock-id]');
            if (stockButton) {
                saveStock(stockButton.getAttribute('data-save-stock-id'));
                return;
            }

            var returnCommandButton = event.target.closest('[data-return-command]');
            if (returnCommandButton) {
                var command = returnCommandButton.getAttribute('data-return-command');
                var activeReturnId = state.selectedReturnId || (state.returns[0] ? state.returns[0].id : '');
                if (!activeReturnId) {
                    pageShell.showToast('Wybierz zwrot z tabeli.');
                    return;
                }

                if (command === 'approve') {
                    setReturnStatus(activeReturnId, 'Zatwierdzony');
                    return;
                }

                if (command === 'issue') {
                    setReturnStatus(activeReturnId, 'Problem ze zwrotem');
                    return;
                }

                setReturnStatus(activeReturnId, 'Kontakt z klientem');
                pageShell.showToast('Wyslano wiadomosc do klienta.');
            }
        });

        workbenchNode.addEventListener('change', function (event) {
            var select = event.target.closest('select[data-order-id]');
            if (!select) {
                return;
            }

            var order = state.orders.find(function (item) {
                return item.id === select.getAttribute('data-order-id');
            });

            if (!order) {
                return;
            }

            order.status = select.value;
            saveState();
            pageShell.showToast('Status zamowienia zapisany.');
        });
    }

    renderProductGrid();
    renderWorkbench();
    updateImagePlaceholder();
})();
