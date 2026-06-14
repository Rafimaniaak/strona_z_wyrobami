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
        'firma': [
            { id: '1', name: 'Oscypek Góralski', seller: 'firma', price: '21.00', image: 'images/Oscypek-goralski.jpg', alt: 'Oscypek', category: 'sery', rating: '5.0', stock: 340 },
            { id: '2', name: 'Orzechówka', seller: 'firma', price: '42.00', image: 'images/nalewka.jpg', alt: 'Nalewka', category: 'napoje', rating: '4.8', stock: 129 },
            { id: '3', name: 'Ciupaga Góralska', seller: 'firma', price: '98.00', image: 'images/ciupaga.jpg', alt: 'Ciupaga', category: 'rekodzielo', rating: '4.9', stock: 6 },
            { id: '4', name: 'Redykołka', seller: 'firma', price: '78.00', image: 'images/Redykołka.webp', alt: 'Serek', category: 'sery', rating: '4.7', stock: 25 },
            { id: '5', name: 'Jałowcówka', seller: 'firma', price: '55.00', image: 'images/nalewka.jpg', alt: 'Nalewka', category: 'napoje', rating: '4.9', stock: 95 },
            { id: '6', name: 'Pigwówka', seller: 'firma', price: '56.00', image: 'images/nalewka.jpg', alt: 'Nalewka', category: 'napoje', rating: '4.8', stock: 67 },
            { id: '7', name: 'Dżem z gruszki', seller: 'firma', price: '19.00', image: 'images/dzem.jpg', alt: 'Dżem', category: 'przetwory', rating: '5.0', stock: 48 }
        ],
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

        if (querySeller) {
            return querySeller;
        }

        if (sessionSeller) {
            return sessionSeller;
        }

        return 'Sprzedawca regionalny';
    }

    var session = readSession();
    var sellerName = resolveSellerName(session);
    var sellerProfile = productCatalog && typeof productCatalog.sellerProfile === 'function'
        ? productCatalog.sellerProfile(sellerName)
        : {
            region: 'Polska lokalna',
            shipping: 'wysylka do 48h',
            badge: 'Wybor lokalny',
            lead: 'Lokalny sprzedawca regionalny prezentujacy autentyczne produkty i szczegoly oferty.',
            about: 'Kameralna oferta z naciskiem na opis, pochodzenie i wygodne zakupy dla klientow szukajacych regionalnych wyrobow.',
            reviews: []
        };
    var isSellerSession = Boolean(session && session.role === 'seller' && session.email);
    var sessionSellerName = isSellerSession && session.sellerName ? String(session.sellerName).trim() : '';
    var canManage = isSellerSession && normalize(sessionSellerName) === normalize(sellerName);
    var sellerKey = normalize(sellerName).replace(/\s+/g, '_') || 'seller';
    var storageKey = 'srp_seller_dashboard_v2_' + sellerKey;

    body.classList.toggle('seller-is-owner', canManage);
    body.classList.toggle('seller-is-public', !canManage);

    var headingNode = document.getElementById('sellerNameHeading');
    var statsNode = document.getElementById('sellerStats');
    var profileLeadNode = document.getElementById('sellerProfileLead');
    var gridNode = document.getElementById('sellerProductsGrid');
    var workbenchNode = document.getElementById('sellerWorkbench');
    var paginationNode = document.getElementById('sellerProductsPagination');
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
    var dashboardToolsNode = document.querySelector('.seller-dashboard-tools');

    var activeMode = '';
    var selectedImageDataUrl = '';
    var editingProductId = null;

    function openDialog(product) {
        if (product) {
            editingProductId = product.id;
            addForm.elements.name.value = product.name || '';
            addForm.elements.price.value = product.price || '';
            addForm.elements.stock.value = product.stock || '0';
            addForm.elements.category.value = product.category || 'home';
            addForm.elements.owner.value = product.seller || '';
            addForm.elements.description.value = product.description || '';
            
            if (product.image) {
                selectedImageDataUrl = product.image;
                updateImagePlaceholder();
            }
        } else {
            editingProductId = null;
            addForm.reset();
            resetImageSelection();
        }
        setDialogOpen(true);
    }

    function displayProduct(product) {
        var candidate = product;

        if (productCatalog && typeof productCatalog.enrichProduct === 'function') {
            candidate = productCatalog.enrichProduct(product);
        }

        return candidate;
    }

    function shortText(text, maxLength) {
        var value = String(text || '').replace(/\s+/g, ' ').trim();

        if (value.length <= maxLength) {
            return value;
        }

        return value.slice(0, Math.max(0, maxLength - 3)).replace(/\s+\S*$/, '') + '...';
    }

    if (dashboardToolsNode) {
        dashboardToolsNode.hidden = !canManage;
    }

    if (workbenchNode) {
        workbenchNode.hidden = !canManage;
    }

    function createDefaultProducts() {
        var key = normalize(sellerName);
        var base = sellerProductsByKey[key] || [
            { name: 'Oscypek górski', seller: sellerName, price: '28.00', image: 'images/Oscypek-goralski.jpg', alt: 'Oscypek górski', category: 'sery', rating: '4.8', stock: 24 },
            { name: 'Miód lipowy', seller: sellerName, price: '45.00', image: 'images/miod-lipowy-1100.jpg', alt: 'Miód lipowy', category: 'miody', rating: '4.6', stock: 15 },
            { name: 'Kiełbasa śląska', seller: sellerName, price: '32.00', image: 'images/kielbasa-slaska.jpg', alt: 'Kiełbasa śląska', category: 'wedliny', rating: '4.9', stock: 8 }
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

    function createDefaultOrders() {
        return [
            { id: 'WX9348B', date: '2026-05-28', customer: 'Jan Kowalski', total: '149,99', paymentStatus: 'opłacone', deliveryStatus: 'dostarczone' },
            { id: 'WX2175A', date: '2026-05-29', customer: 'Anna Nowak', total: '89,50', paymentStatus: 'opłacone', deliveryStatus: 'odebrane' },
            { id: 'WX5821C', date: '2026-05-30', customer: 'Piotr Wiśniewski', total: '199,00', paymentStatus: 'nieopłacone', deliveryStatus: 'w realizacji' },
            { id: 'WX7463D', date: '2026-05-31', customer: 'Katarzyna Zielińska', total: '45,90', paymentStatus: 'opłacone', deliveryStatus: 'w drodze' },
            { id: 'WX1937E', date: '2026-06-01', customer: 'Tomasz Lewandowski', total: '127,40', paymentStatus: 'nieopłacone', deliveryStatus: 'w realizacji' },
            { id: 'WX2175A_6', date: '2026-05-29', customer: 'Anna Nowak', total: '89,50', paymentStatus: 'opłacone', deliveryStatus: 'odebrane' },
            { id: 'WX2175A_7', date: '2026-05-29', customer: 'Anna Nowak', total: '89,50', paymentStatus: 'opłacone', deliveryStatus: 'odebrane' },
            { id: 'WX2175A_8', date: '2026-05-29', customer: 'Anna Nowak', total: '89,50', paymentStatus: 'opłacone', deliveryStatus: 'odebrane' },
            { id: 'WX2175A_9', date: '2026-05-29', customer: 'Anna Nowak', total: '89,50', paymentStatus: 'opłacone', deliveryStatus: 'odebrane' },
            { id: 'WX2175A_10', date: '2026-05-29', customer: 'Anna Nowak', total: '89,50', paymentStatus: 'opłacone', deliveryStatus: 'odebrane' },
            { id: 'WX2175A_11', date: '2026-05-29', customer: 'Anna Nowak', total: '89,50', paymentStatus: 'opłacone', deliveryStatus: 'odebrane' },
            { id: 'WX2175A_12', date: '2026-05-29', customer: 'Anna Nowak', total: '89,50', paymentStatus: 'opłacone', deliveryStatus: 'odebrane' },
            { id: 'WX2175A_13', date: '2026-05-29', customer: 'Anna Nowak', total: '89,50', paymentStatus: 'opłacone', deliveryStatus: 'odebrane' },
            { id: 'WX2175A_14', date: '2026-05-29', customer: 'Anna Nowak', total: '89,50', paymentStatus: 'opłacone', deliveryStatus: 'odebrane' },
            { id: 'WX2175A_15', date: '2026-05-29', customer: 'Anna Nowak', total: '89,50', paymentStatus: 'opłacone', deliveryStatus: 'odebrane' },
            { id: 'WX2175A_16', date: '2026-05-29', customer: 'Anna Nowak', total: '89,50', paymentStatus: 'opłacone', deliveryStatus: 'odebrane' }
        ];
    }

    function createDefaultReturns(products) {
        return [
            { id: 'ZW-201', orderId: 'AB2389D', product: 'Oscypek Góralski', reason: 'Złe na wygląd', status: 'pending' },
            { id: 'ZW-202', orderId: 'CK5721M', product: 'Orzechówka', reason: 'Sprzedawca wysłał inne przedmioty.', status: 'rejected' },
            { id: 'ZW-203', orderId: 'DT8146Q', product: 'Ciupaga Góralska', reason: 'Nie odpowiada opisu', status: 'approved' },
            { id: 'ZW-204', orderId: 'GH6287N', product: 'Redykołka', reason: 'Nie odpowiada Wyglądu z oferty.', status: 'pending' },
            { id: 'ZW-205', orderId: 'QR5198V', product: 'Jałowcówka', reason: 'Długi czas dostarczenia.', status: 'pending' },
            { id: 'ZW-206', orderId: 'UV1675Z', product: 'Pigwówka', reason: 'Uszkodzone podczas transportu', status: 'approved' },
            { id: 'ZW-207', orderId: 'WX9348B', product: 'Dżem z gruszki', reason: 'Sprzedawca wysłał inne przedmioty.', status: 'rejected' }
        ];
    }

    function normalizeReturnStatus(status) {
        var normalized = normalize(status);

        if (normalized === 'approved' || normalized === 'zatwierdzony') {
            return 'approved';
        }

        if (normalized === 'rejected' || normalized === 'odrzucony') {
            return 'rejected';
        }

        if (normalized === 'issue' || normalized === 'problem ze zwrotem') {
            return 'problem';
        }

        if (normalized === 'contact' || normalized === 'kontakt z klientem') {
            return 'contact';
        }

        return 'pending';
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

    if (!Array.isArray(state.orders) || !state.orders[0] || !state.orders[0].paymentStatus) {
        state.orders = createDefaultOrders();
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
        var display = displayProduct(product);

        return [
            '<article class="seller-product-card">',
            '<div class="seller-product-image-wrap">',
            '<a href="', display.detailHref || 'produkt.html', '">',
            '<img src="', display.image, '" alt="', display.alt || display.name, '">',
            '</a>',
            '<div class="seller-product-rating"><span class="star">&#9734;</span> <span>', display.averageRating || display.rating || '5.0', '</span></div>',
            '</div>',
            '<div class="seller-product-details">',
            '<h2>', display.name, '</h2>',
            '<div class="seller-product-meta">',
            '<span class="seller-name">Jakis sprzedawca</span>',
            '<span class="seller-price">', formatPrice(display.price), '</span>',
            '</div>',
            '</div>',
            '<div class="seller-product-actions">',
            '<button class="btn-seller-edit" type="button" data-edit-product-id="', display.id || '', '">Edytuj</button>',
            '<button class="btn-seller-delete" type="button" data-delete-product-id="', display.id || '', '">Usunąć Produkt</button>',
            '</div>',
            '</article>'
        ].join('');
    }

    function renderProductGrid() {
        if (headingNode) {
            headingNode.textContent = sellerName;
        }

        if (statsNode) {
            statsNode.textContent = 'Liczba produktów: ' + state.products.length;
        }

        if (profileLeadNode) {
            profileLeadNode.textContent = sellerProfile.lead || 'Autentyczne produkty regionalne prezentowane z prostą, czytelną ofertą.';
        }

        if (!gridNode) {
            return;
        }

        if (state.products.length === 0) {
            gridNode.innerHTML = '<p class="seller-workbench-empty">Brak produktów w ofercie.</p>';
            return;
        }

        var activePage = state.productsPage || 1;
        var paginationHtml = '';
        for (var i = 1; i <= 5; i++) {
            if (i === activePage) {
                paginationHtml += '<strong>' + i + '</strong>';
            } else {
                paginationHtml += '<span data-products-page="' + i + '" style="cursor:pointer">' + i + '</span>';
            }
        }

        gridNode.innerHTML = '<div class="seller-products-wrap">' + state.products.map(cardMarkup).join('') + '</div>';

        if (paginationNode) {
            paginationNode.innerHTML = '<div class="seller-pagination">' + paginationHtml + '</div>';
            Array.prototype.slice.call(paginationNode.querySelectorAll('[data-products-page]')).forEach(function(btn) {
                btn.addEventListener('click', function() {
                    state.productsPage = parseInt(btn.getAttribute('data-products-page'), 10);
                    renderProductGrid();
                });
            });
        }

        Array.prototype.slice.call(gridNode.querySelectorAll('.btn-seller-edit')).forEach(function (button) {
            button.addEventListener('click', function () {
                var id = button.getAttribute('data-edit-product-id');
                var product = state.products.find(function (item) { return item.id === id; });
                if (product) {
                    openDialog(product);
                }
            });
        });

        Array.prototype.slice.call(gridNode.querySelectorAll('.btn-seller-delete')).forEach(function (button) {
            button.addEventListener('click', function () {
                var id = button.getAttribute('data-delete-product-id');
                removeProduct(id);
            });
        });
    }

    function renderFinancesMode() {
        var activeTab = state.financesActiveTab || 'Zapłacone';
        var allCards = [
            { type: 'Niezapłacone', date: '10 maj 2026', profit: '3500.00 zł', fee: '2%', total: '70.00 zł' },
            { type: 'Zapłacone', date: '10 kwiecień 2026', profit: '3500.00 zł', fee: '2%', total: '70.00 zł' },
            { type: 'Niezapłacone', date: '10 maj 2026', profit: '3500.00 zł', fee: '2%', total: '70.00 zł' },
            { type: 'Zapłacone', date: '10 kwiecień 2026', profit: '3500.00 zł', fee: '2%', total: '70.00 zł' }
        ];
        
        var filteredCards = allCards.filter(function(c) { return c.type === activeTab; });
        if (filteredCards.length === 0) filteredCards = allCards;
        
        var cardsHtml = filteredCards.map(function(card) {
            return [
                '<div class="finances-card">',
                '<div class="finances-card-header">',
                '<h3>', card.type, '</h3><span>', card.date, '</span>',
                '</div>',
                '<div class="finances-card-row"><span>Miesięczny zysk</span><strong>', card.profit, '</strong></div>',
                '<div class="finances-card-divider"></div>',
                '<div class="finances-card-row"><span>Pobierane</span><strong>', card.fee, '</strong></div>',
                '<div class="finances-card-row finances-card-total"><span>Do zapłaty</span><strong>', card.total, '</strong></div>',
                '</div>'
            ].join('');
        }).join('');

        var activeFinPage = state.financesPage || 1;
        var finPaginationHtml = '';
        for (var j = 1; j <= 5; j++) {
            if (j === activeFinPage) {
                finPaginationHtml += '<strong>' + j + '</strong>';
            } else {
                finPaginationHtml += '<span data-finances-page="' + j + '" style="cursor:pointer">' + j + '</span>';
            }
        }
        finPaginationHtml += '<span>...</span><span data-finances-page="7" style="cursor:pointer">7</span>';

        return [
            '<div class="seller-finances-layout">',
            '<div class="seller-finances-sidebar">',
            '<div class="finances-menu-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg> Należności</div>',
            '<ul class="finances-menu">',
            '<li class="', activeTab === 'Zapłacone' ? 'is-active' : '', '" data-finances-tab="Zapłacone">Zapłacone</li>',
            '<li class="', activeTab === 'Niezapłacone' ? 'is-active' : '', '" data-finances-tab="Niezapłacone">Niezapłacone</li>',
            '</ul>',
            '</div>',
            '<div class="seller-finances-main">',
            '<div class="finances-grid">',
            cardsHtml,
            '</div>',
            '<div class="seller-pagination">', finPaginationHtml, '</div>',
            '</div>',
            '</div>'
        ].join('');
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

        var activeTab = state.ordersActiveTab || 'Wszystkie';
        var tabs = ['Wszystkie', 'W drodze', 'Nie opłacone', 'Odebrane', 'Otwarte', 'Zwrot', '+'];
        
        var tabsMarkup = tabs.map(function(tab) {
            var isActive = tab === activeTab;
            return '<button class="seller-orders-tab ' + (isActive ? 'is-active' : '') + '" data-order-tab="' + tab + '">' + tab + '</button>';
        }).join('');

        var filteredOrders = state.orders.filter(function(order) {
            if (activeTab === 'Wszystkie' || activeTab === '+') return true;
            if (activeTab === 'W drodze') return order.deliveryStatus === 'w drodze';
            if (activeTab === 'Nie opłacone') return order.paymentStatus === 'nieopłacone';
            if (activeTab === 'Odebrane') return order.deliveryStatus === 'odebrane';
            if (activeTab === 'Otwarte') return order.deliveryStatus === 'w realizacji';
            if (activeTab === 'Zwrot') return order.deliveryStatus === 'zwrot';
            return true;
        });

        var selectedOrderId = state.selectedOrderId || (filteredOrders[0] ? filteredOrders[0].id : null);
        var isEditPopupOpen = state.isOrderEditPopupOpen;
        var selectedOrder = state.orders.find(function(o) { return o.id === selectedOrderId; }) || {};

        var rowsMarkup = filteredOrders.map(function (order, index) {
            var isSelected = order.id === selectedOrderId;
            var num = index + 1;
            return [
                '<tr class="', isSelected ? 'is-selected' : '', '" data-order-row-id="', order.id, '">',
                '<td class="order-num" data-label="Lp."><strong>', num, '</strong></td>',
                '<td data-label="Zamówienie">', order.id.split('_')[0], '</td>',
                '<td data-label="Data">', order.date, '</td>',
                '<td data-label="Imię i nazwisko">', order.customer, '</td>',
                '<td data-label="Kwota">', order.total, '</td>',
                '<td data-label="Płatność">', order.paymentStatus, '</td>',
                '<td data-label="Dostawa">', order.deliveryStatus, '</td>',
                '</tr>'
            ].join('');
        }).join('');

        return [
            '<div class="seller-orders-layout">',
            '<div class="seller-orders-header">',
            '<div class="seller-orders-tabs">', tabsMarkup, '</div>',
            '</div>',
            '<div class="seller-orders-table-and-btn">',
            '<div class="seller-orders-table-wrap">',
            '<table class="seller-orders-table">',
            '<thead><tr><th><input type="checkbox" disabled></th><th>Zamówienie</th><th>Data</th><th>Imię i nazwisko klienta</th><th>Kwota zamówienia w zł</th><th>Status płatności</th><th>Status dostawy</th></tr></thead>',
            '<tbody>', rowsMarkup, '</tbody>',
            '</table>',
            '</div>',
            '<button class="btn-edit-order" data-order-command="openEdit">Edytuj<br>zamówienia</button>',
            '</div>',
            isEditPopupOpen ? [
                '<div class="seller-order-edit-popup">',
                '<div class="seller-order-edit-popup-inner">',
                '<div class="form-group"><label>Id zamówienia</label><input type="text" value="', selectedOrder.id.split('_')[0], '" readonly></div>',
                '<div class="form-group"><label>status dostawy</label>',
                '<select data-order-edit-status>',
                '<option value="w realizacji"', selectedOrder.deliveryStatus === 'w realizacji' ? ' selected' : '', '>w realizacji</option>',
                '<option value="w drodze"', selectedOrder.deliveryStatus === 'w drodze' ? ' selected' : '', '>w drodze</option>',
                '<option value="dostarczone"', selectedOrder.deliveryStatus === 'dostarczone' ? ' selected' : '', '>dostarczone</option>',
                '<option value="odebrane"', selectedOrder.deliveryStatus === 'odebrane' ? ' selected' : '', '>odebrane</option>',
                '</select></div>',
                '</div>',
                '<div style="text-align:right;"><button type="button" class="btn-popup-save" data-order-command="closeEdit">Edytuj</button></div>',
                '</div>'
            ].join('') : '',
            '</div>'
        ].join('');
    }

    function renderInventoryMode() {
        if (state.products.length === 0) {
            return '<p class="seller-workbench-empty">Brak produktow w magazynie.</p>';
        }

        var selectedInventoryId = state.selectedInventoryId || state.products[0].id;

        var rowsMarkup = state.products.map(function (item, index) {
            var isSelected = item.id === selectedInventoryId;
            return [
                '<tr class="', isSelected ? 'is-selected' : '', '" data-inventory-row-id="', item.id, '">',
                '<td>', index + 1, '</td>',
                '<td>', item.name, '</td>',
                '<td>', Number(item.price || 0).toFixed(2), '</td>',
                '<td>', Number(item.stock || 0), '</td>',
                '</tr>'
            ].join('');
        }).join('');

        return [
            '<div class="seller-inventory-layout">',
            '<div class="seller-returns-table-wrap">', // Reusing returns table wrap for consistent scrollbar and styling
            '<table class="seller-returns-table">', // Reusing returns table styling
            '<colgroup><col style="width:10%"><col style="width:50%"><col style="width:20%"><col style="width:20%"></colgroup>',
            '<thead><tr><th>Id</th><th>Nazwa produktu</th><th>Cena w zł</th><th>Ilość produktu</th></tr></thead>',
            '<tbody>', rowsMarkup, '</tbody>',
            '</table>',
            '</div>',
            '<div class="seller-inventory-bottom-actions">',
            '<button class="seller-workbench-button btn-reject" type="button" data-inventory-command="delete">Usuń</button>',
            '<button class="seller-workbench-button" type="button" data-inventory-command="edit">Edytuj</button>',
            '</div>',
            '</div>'
        ].join('');
    }

    function renderReturnsMode() {
        if (state.returns.length === 0) {
            return '<p class="seller-workbench-empty">Brak zgloszen zwrotu.</p>';
        }

        var selectedReturnId = state.selectedReturnId || state.returns[0].id;

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
            '<div class="seller-returns-main">',
            '<div class="seller-returns-table-wrap">',
            '<table class="seller-returns-table">',
            '<thead><tr><th>Order id</th><th>Product name</th><th>Return reason</th><th>Status</th></tr></thead>',
            '<tbody>', rowsMarkup, '</tbody>',
            '</table>',
            '</div>',
            '<div class="seller-returns-bottom-actions">',
            '<button class="seller-workbench-button btn-reject" type="button" data-return-command="reject">Odrzuć</button>',
            '<button class="seller-workbench-button btn-approve" type="button" data-return-command="approve">Potwierdź</button>',
            '</div>',
            '</div>',
            '<div class="seller-returns-side-actions">',
            '<button class="seller-workbench-button btn-issue" type="button" data-return-command="issue">Problemy ze zwrotem</button>',
            '<button class="seller-workbench-button btn-contact" type="button" data-return-command="contact">Skontaktuj się z klientem</button>',
            '</div>',
            '</div>'
        ].join('');
    }

    function renderWorkbench() {
        if (!workbenchNode) {
            return;
        }

        if (!canManage) {
            workbenchNode.innerHTML = '';
            return;
        }

        if (!activeMode) {
            workbenchNode.innerHTML = '';
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
            return;
        }
        
        if (activeMode === 'finances') {
            workbenchNode.innerHTML = renderFinancesMode();
        }
    }

    function setActiveMode(mode) {
        if (!canManage) {
            return;
        }

        activeMode = mode === activeMode ? '' : mode;
        if (activeMode === 'orders') {
            state.isOrderEditPopupOpen = false;
        }
        
        body.classList.toggle('seller-has-workbench', activeMode !== '');
        body.classList.toggle('seller-mode-returns', activeMode === 'returns');
        body.classList.toggle('seller-mode-inventory', activeMode === 'inventory');

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
            openDialog(null);
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

            if (editingProductId) {
                var existing = state.products.find(function (p) { return p.id === editingProductId; });
                if (existing) {
                    existing.name = name;
                    existing.price = price;
                    existing.stock = stock;
                    existing.category = category;
                    existing.seller = owner;
                    existing.description = description;
                    if (selectedImageDataUrl) {
                        existing.image = selectedImageDataUrl;
                    }
                    pageShell.showToast('Zaktualizowano produkt.');
                }
            } else {
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
                pageShell.showToast('Dodano nowy produkt.');
            }

            saveState();
            renderProductGrid();
            renderWorkbench();
            setDialogOpen(false);
            addForm.reset();
            resetImageSelection();
            pageShell.showToast('Produkt dodany.');
        });
    }

    var modePageMap = {
        'orders': 'seller-orders.html',
        'finances': 'seller-finances.html',
        'inventory': 'seller-inventory.html',
        'returns': 'seller-returns.html',
        'stats': 'seller-stats.html',
        'products': 'seller.html'
    };

    modeButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            var mode = button.getAttribute('data-seller-mode') || '';
            var page = modePageMap[mode];
            if (page) {
                window.open(page, '_blank');
            } else {
                setActiveMode(mode);
            }
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

            var inventoryRow = event.target.closest('[data-inventory-row-id]');
            if (inventoryRow) {
                state.selectedInventoryId = inventoryRow.getAttribute('data-inventory-row-id');
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
                    setReturnStatus(activeReturnId, 'approved');
                    return;
                }

                if (command === 'reject') {
                    setReturnStatus(activeReturnId, 'rejected');
                    return;
                }

                if (command === 'issue') {
                    pageShell.showToast('Zgłoszono problem ze zwrotem.');
                    return;
                }

                pageShell.showToast('Skontaktuj się z klientem.');
            }

            var inventoryCommandButton = event.target.closest('[data-inventory-command]');
            if (inventoryCommandButton) {
                var invCommand = inventoryCommandButton.getAttribute('data-inventory-command');
                var activeInvId = state.selectedInventoryId || (state.products[0] ? state.products[0].id : '');
                
                if (!activeInvId) {
                    pageShell.showToast('Wybierz produkt z tabeli.');
                    return;
                }

                if (invCommand === 'delete') {
                    removeProduct(activeInvId);
                    return;
                }

                if (invCommand === 'edit') {
                    var prod = state.products.find(function (p) { return p.id === activeInvId; });
                    if (prod) {
                        openDialog(prod);
                    }
                    return;
                }
            }
        });

        workbenchNode.addEventListener('click', function (event) {
            var finTab = event.target.closest('[data-finances-tab]');
            if (finTab) {
                state.financesActiveTab = finTab.getAttribute('data-finances-tab');
                state.financesPage = 1;
                renderWorkbench();
                return;
            }

            var finPage = event.target.closest('[data-finances-page]');
            if (finPage) {
                state.financesPage = parseInt(finPage.getAttribute('data-finances-page'), 10);
                renderWorkbench();
                return;
            }

            var orderTab = event.target.closest('[data-order-tab]');
            if (orderTab) {
                state.ordersActiveTab = orderTab.getAttribute('data-order-tab');
                state.selectedOrderId = null;
                state.isOrderEditPopupOpen = false;
                renderWorkbench();
                return;
            }

            var orderRow = event.target.closest('[data-order-row-id]');
            if (orderRow) {
                state.selectedOrderId = orderRow.getAttribute('data-order-row-id');
                renderWorkbench();
                return;
            }

            var orderCmdBtn = event.target.closest('[data-order-command]');
            if (orderCmdBtn) {
                var cmd = orderCmdBtn.getAttribute('data-order-command');
                if (cmd === 'openEdit') {
                    if (!state.selectedOrderId) {
                        pageShell.showToast('Wybierz zamówienie z tabeli.');
                        return;
                    }
                    state.isOrderEditPopupOpen = true;
                    renderWorkbench();
                    return;
                }
                if (cmd === 'closeEdit') {
                    state.isOrderEditPopupOpen = false;
                    renderWorkbench();
                    return;
                }
            }
        });

        workbenchNode.addEventListener('change', function (event) {
            var selectNode = event.target.closest('[data-order-edit-status]');
            if (selectNode && state.selectedOrderId) {
                var order = state.orders.find(function(o) { return o.id === state.selectedOrderId; });
                if (order) {
                    order.deliveryStatus = selectNode.value;
                    saveState();
                    renderWorkbench();
                }
            }
        });
    }

    renderProductGrid();
    renderWorkbench();
    updateImagePlaceholder();

    // Automatyczne otwarcie trybu z atrybutu data-auto-mode (np. na podstronach)
    var autoMode = body.getAttribute('data-auto-mode');
    if (autoMode) {
        setActiveMode(autoMode);
    }
})();
