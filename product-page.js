(function () {
    var body = document.body;
    var cartStore = window.cartStore;
    var favoriteStore = window.favoriteStore;
    var pageShell = window.pageShell || {
        showToast: function () {},
        syncCartCounters: function () {}
    };
    var productCatalog = window.productCatalog;

    if (!body || !cartStore || !favoriteStore) {
        return;
    }

    var addToCartButton = document.getElementById('productAddToCart');
    var favoriteButton = document.getElementById('productFavoriteButton');
    var titleNode = document.getElementById('productTitle');
    var leadNode = document.getElementById('productLead');
    var descriptionNode = document.getElementById('productDescription');
    var descriptionStack = document.getElementById('productDescriptionStack');
    var imageNode = document.getElementById('productHeroImage');
    var feedbackSellerNode = document.getElementById('feedbackSellerName');
    var priceNode = document.getElementById('productPrice');
    var stockBadgeNode = document.getElementById('productStockBadge');
    var stockInlineNode = document.getElementById('productStockInline');
    var reviewCountNode = document.getElementById('productReviewCount');
    var sellerAverageRatingNode = document.getElementById('sellerAverageRating');
    var productReviewTotalCountNode = document.getElementById('productReviewTotalCount');
    var productReviewPaginationNode = document.getElementById('productReviewPagination');
    var reviewFilterButton = document.getElementById('reviewFilterButton');
    var reviewFilterMenu = document.getElementById('reviewFilterMenu');
    var quantityValueNode = document.getElementById('productQuantityValue');
    var quantityDecreaseButton = document.getElementById('productQuantityDecrease');
    var quantityIncreaseButton = document.getElementById('productQuantityIncrease');
    var sellerFeedbackList = document.getElementById('sellerFeedbackList');
    var sellerFeedbackScrollbar = document.querySelector('.seller-feedback-scrollbar');
    var sellerFeedbackScrollbarThumb = document.querySelector('.seller-feedback-scrollbar-thumb');
    var productReviewTrack = document.getElementById('productReviewCards');
    var reviewLimitButtons = Array.prototype.slice.call(document.querySelectorAll('.review-limit-button'));
    var reviewTotalCount = 240;
    var currentReviewPage = 1;
    var reviewLimit = 6;
    var reviewRatingFilter = '';
    var selectedQuantity = 1;

    function sellerProfileHref(name) {
        return 'seller.html?seller=' + encodeURIComponent((name || '').trim());
    }

    function fallbackProduct() {
        return {
            id: body.dataset.productId || 'produkt-dzem-z-gruszki',
            name: body.dataset.productName || 'Dzem z gruszki',
            seller: body.dataset.productSeller || 'Siostra Anastazja',
            price: body.dataset.productPrice || '19.00',
            image: body.dataset.productImage || 'images/przetwory-z-gruszek-siostry-anastazji-4af3b39.jpg',
            alt: body.dataset.productAlt || 'Dzem z gruszki',
            category: body.dataset.productCategory || 'przetwory',
            rating: body.dataset.productRating || '4.9',
            page: 'produkt.html'
        };
    }

    function productData() {
        var base = fallbackProduct();

        if (productCatalog && window.location.search) {
            return productCatalog.fromQuery(window.location.search);
        }

        if (productCatalog) {
            return productCatalog.enrichProduct(base);
        }

        return base;
    }

    var product = productData();

    function setText(node, value) {
        if (node) {
            node.textContent = value;
        }
    }

    function detailParagraphs() {
        var description = String(product.description || '').split('. ');
        var list = [];

        if (description.length > 0 && description[0]) {
            list.push(description[0].trim().replace(/\.$/, '') + '.');
        }

        if (description.length > 1) {
            list.push(description.slice(1).join('. ').trim());
        }

        list.push('Recznie wytwarzany w malych partiach, aby zachowac pelnie aromatu i najwyzsza jakosc. To doskonaly wybor dla osob ceniacych naturalne, regionalne produkty o wyjatkowym smaku.');

        return list.filter(Boolean).slice(0, 3);
    }

    function compactSellerReviews() {
        return (product.sellerReviews || []).slice(0, 14);
    }

    function reviewSourcePool() {
        var basePool = product.productReviews || [];
        var pool = [];
        var index;
        var targetCount;
        var blockIndex;
        var rotatedIndex;
        var sourcePool;

        if (basePool.length === 0) {
            return pool;
        }

        sourcePool = basePool.slice();

        if (reviewRatingFilter) {
            sourcePool = sourcePool.filter(function (review) {
                var rating = Number(review.rating || 0);
                var lower = Number(reviewRatingFilter);
                var upper = lower + 1;
                return reviewRatingFilter === '5' ? rating >= 5 : rating >= lower && rating < upper;
            });
        }

        if (sourcePool.length === 0) {
            return pool;
        }

        targetCount = reviewRatingFilter ? Math.max(reviewTotalCount, sourcePool.length) : reviewTotalCount;

        for (index = 0; index < targetCount; index += 1) {
            blockIndex = Math.floor(index / sourcePool.length);
            rotatedIndex = (index + blockIndex) % sourcePool.length;
            pool.push(sourcePool[rotatedIndex]);
        }

        return pool;
    }

    function reviewPageCount() {
        var poolLength = reviewSourcePool().length;
        return Math.max(1, Math.ceil(poolLength / reviewLimit));
    }

    function clampReviewPage(value) {
        return Math.min(reviewPageCount(), Math.max(1, Number(value) || 1));
    }

    function currentReviewSlice() {
        var pool = reviewSourcePool();
        var total = pool.length;
        var start = (currentReviewPage - 1) * reviewLimit;
        var count = Math.min(reviewLimit, Math.max(0, total - start));
        return pool.slice(start, start + count);
    }

    function paginationSequence() {
        var pages = [];
        var total = reviewPageCount();
        var current = currentReviewPage;
        var start;
        var end;

        function push(value) {
            if (pages[pages.length - 1] !== value) {
                pages.push(value);
            }
        }

        if (total <= 7) {
            for (var allIndex = 1; allIndex <= total; allIndex += 1) {
                push(allIndex);
            }
            return pages;
        }

        push(1);

        if (current > 4) {
            push('...');
        }

        if (current <= 4) {
            start = 2;
            end = 5;
        } else if (current >= total - 3) {
            start = total - 4;
            end = total - 1;
        } else {
            start = current - 1;
            end = current + 1;
        }

        for (var page = start; page <= end; page += 1) {
            if (page > 1 && page < total) {
                push(page);
            }
        }

        if (end < total - 1) {
            push('...');
        }

        push(total);

        return pages;
    }

    function clampQuantity(value) {
        return Math.min(99, Math.max(1, Number(value) || 1));
    }

    function syncQuantityButtons() {
        var unavailable = product.available === false;

        if (quantityDecreaseButton) {
            quantityDecreaseButton.disabled = unavailable || selectedQuantity <= 1;
        }

        if (quantityIncreaseButton) {
            quantityIncreaseButton.disabled = unavailable || selectedQuantity >= 99;
        }
    }

    function renderQuantity() {
        if (quantityValueNode) {
            quantityValueNode.textContent = String(selectedQuantity);
        }

        syncQuantityButtons();
    }

    function setQuantity(value) {
        selectedQuantity = clampQuantity(value);
        renderQuantity();
    }

    function syncLimitButtons() {
        reviewLimitButtons.forEach(function (button) {
            var isActive = Number(button.dataset.limit) === reviewLimit;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-pressed', String(isActive));
        });
    }

    function reviewFilterLabel() {
        if (!reviewRatingFilter) {
            return 'Wszystkie oceny';
        }

        if (reviewRatingFilter === '1') {
            return '1 gwiazdka';
        }

        if (reviewRatingFilter === '5') {
            return '5 gwiazdek';
        }

        return reviewRatingFilter + ' gwiazdki';
    }

    function syncReviewFilterButton() {
        if (!reviewFilterButton) {
            return;
        }

        var labelNode = reviewFilterButton.querySelector('[data-review-filter-label]') || reviewFilterButton.querySelector('span');

        if (labelNode) {
            labelNode.textContent = reviewFilterLabel();
        }

        reviewFilterButton.setAttribute('aria-expanded', String(reviewFilterMenu && !reviewFilterMenu.hidden));
    }

    function setReviewFilterMenuOpen(isOpen) {
        if (!reviewFilterMenu) {
            return;
        }

        reviewFilterMenu.hidden = !isOpen;
        syncReviewFilterButton();
    }

    function closeReviewFilterMenu() {
        setReviewFilterMenuOpen(false);
    }

    function toggleReviewFilterMenu() {
        if (!reviewFilterMenu) {
            return;
        }

        setReviewFilterMenuOpen(reviewFilterMenu.hidden);
    }

    function renderDetailParagraphs() {
        if (!descriptionStack) {
            return;
        }

        descriptionStack.innerHTML = '';

        detailParagraphs().forEach(function (text, index) {
            var paragraph = document.createElement('p');
            paragraph.textContent = text;

            if (index === 0 && descriptionNode) {
                paragraph.id = descriptionNode.id;
            }

            descriptionStack.appendChild(paragraph);
        });
    }

    function renderSellerReviews() {
        if (!sellerFeedbackList) {
            return;
        }

        sellerFeedbackList.innerHTML = '';

        compactSellerReviews().forEach(function (review) {
            var card = document.createElement('article');
            var bullet = document.createElement('span');
            var text = document.createElement('p');
            var meta = document.createElement('div');
            var author = document.createElement('strong');
            var ratingWrap = document.createElement('div');
            var rating = document.createElement('span');
            var star = document.createElement('span');

            card.className = 'seller-feedback-item seller-feedback-item-compact';
            bullet.className = 'seller-feedback-bullet';
            meta.className = 'seller-feedback-meta';
            ratingWrap.className = 'seller-feedback-rating';
            text.textContent = review.text;
            author.textContent = review.author;
            rating.textContent = review.rating;
            star.className = 'seller-feedback-star';
            star.textContent = '\u2606';

            meta.appendChild(author);
            ratingWrap.appendChild(star);
            ratingWrap.appendChild(rating);
            meta.appendChild(ratingWrap);
            card.appendChild(bullet);
            card.appendChild(text);
            card.appendChild(meta);
            sellerFeedbackList.appendChild(card);
        });

        requestAnimationFrame(syncSellerFeedbackScrollbar);
    }

    function syncSellerFeedbackScrollbar() {
        if (!sellerFeedbackList || !sellerFeedbackScrollbar || !sellerFeedbackScrollbarThumb) {
            return;
        }

        var viewportHeight = sellerFeedbackList.clientHeight;
        var contentHeight = sellerFeedbackList.scrollHeight;
        var trackHeight = sellerFeedbackScrollbar.clientHeight;

        if (!viewportHeight || !contentHeight || contentHeight <= viewportHeight || !trackHeight) {
            sellerFeedbackScrollbar.hidden = true;
            sellerFeedbackScrollbarThumb.style.height = '100%';
            sellerFeedbackScrollbarThumb.style.transform = 'translate(-50%, 0)';
            return;
        }

        var maxScroll = contentHeight - viewportHeight;
        var thumbHeight = Math.max(22, Math.round((viewportHeight / contentHeight) * trackHeight));
        var maxThumbOffset = Math.max(0, trackHeight - thumbHeight);
        var scrollRatio = sellerFeedbackList.scrollTop / maxScroll;
        var thumbOffset = maxThumbOffset * scrollRatio;

        sellerFeedbackScrollbar.hidden = false;
        sellerFeedbackScrollbarThumb.style.height = thumbHeight + 'px';
        sellerFeedbackScrollbarThumb.style.transform = 'translate(-50%, ' + thumbOffset + 'px)';
    }

    function renderProductReviews() {
        if (!productReviewTrack) {
            return;
        }

        currentReviewPage = clampReviewPage(currentReviewPage);
        var pool = currentReviewSlice();

        productReviewTrack.innerHTML = '';

        pool.forEach(function (review) {
            var card = document.createElement('article');
            var text = document.createElement('p');
            var footer = document.createElement('div');
            var author = document.createElement('strong');
            var stars = document.createElement('span');
            var ratingValue = Math.max(0, Math.min(5, Math.floor(Number(review.rating || 0))));

            card.className = 'product-review-card';
            text.className = 'product-review-text';
            text.textContent = review.text;
            author.textContent = review.author;
            stars.className = 'product-review-stars';
            stars.setAttribute('aria-label', review.rating + ' na 5 gwiazdek');

            for (var starIndex = 0; starIndex < 5; starIndex += 1) {
                var star = document.createElement('span');

                star.className = starIndex < ratingValue ? 'product-review-star is-filled' : 'product-review-star';
                star.textContent = '\u2605';
                stars.appendChild(star);
            }

            footer.className = 'product-review-meta';
            footer.appendChild(stars);
            footer.appendChild(author);
            card.appendChild(footer);
            card.appendChild(text);
            productReviewTrack.appendChild(card);
        });

        if (productReviewTotalCountNode) {
            productReviewTotalCountNode.textContent = String(reviewSourcePool().length);
        }

        renderProductPagination();
    }

    function renderProductPagination() {
        if (!productReviewPaginationNode) {
            return;
        }

        var totalPages = reviewPageCount();
        var sequence = paginationSequence();

        productReviewPaginationNode.innerHTML = '';

        sequence.forEach(function (entry) {
            if (entry === '...') {
                var ellipsis = document.createElement('span');
                ellipsis.className = 'product-review-pagination-ellipsis';
                ellipsis.textContent = '...';
                productReviewPaginationNode.appendChild(ellipsis);
                return;
            }

            var button = document.createElement('button');
            button.type = 'button';
            button.className = 'product-review-pagination-button';
            button.textContent = String(entry);
            button.dataset.page = String(entry);
            button.setAttribute('aria-label', 'Strona ' + entry);

            if (entry === currentReviewPage) {
                button.classList.add('is-active');
                button.setAttribute('aria-current', 'page');
            }

            button.addEventListener('click', function () {
                currentReviewPage = clampReviewPage(entry);
                renderProductReviews();
            });

            productReviewPaginationNode.appendChild(button);
        });
    }

    function renderProduct() {
        document.title = product.name + ' - Karta produktu';

        if (imageNode) {
            imageNode.src = product.image;
            imageNode.alt = product.alt || product.name;
        }

        setText(titleNode, product.name);
        setText(leadNode, product.lead);
        if (feedbackSellerNode) {
            feedbackSellerNode.textContent = '';

            var sellerLink = document.createElement('a');
            sellerLink.className = 'seller-profile-link';
            sellerLink.href = sellerProfileHref(product.seller);
            sellerLink.textContent = product.seller;
            feedbackSellerNode.appendChild(sellerLink);
        }
        setText(priceNode, product.price + ' z\u0142');
        setText(reviewCountNode, product.reviewCount);
        reviewTotalCount = Number(product.reviewCount) || reviewTotalCount || (product.productReviews || []).length;
        setText(sellerAverageRatingNode, product.averageRating || product.rating || '4.9');
        if (productReviewTotalCountNode) {
            productReviewTotalCountNode.textContent = String(reviewTotalCount);
        }
        if (stockBadgeNode && stockInlineNode) {
            var available = product.available !== false;
            var statusText = available ? 'Dost\u0119pny' : 'Niedost\u0119pny';

            stockBadgeNode.textContent = statusText;
            stockInlineNode.textContent = statusText;
            stockBadgeNode.classList.toggle('is-available', available);
            stockBadgeNode.classList.toggle('is-unavailable', !available);
            stockInlineNode.classList.toggle('is-available', available);
            stockInlineNode.classList.toggle('is-unavailable', !available);
            body.classList.toggle('product-unavailable', !available);
        }

        if (addToCartButton) {
            var isAvailable = product.available !== false;
            addToCartButton.disabled = !isAvailable;
            addToCartButton.textContent = isAvailable ? 'Dodaj do koszyka' : 'Nie mamy produktu';
            addToCartButton.setAttribute('aria-disabled', String(!isAvailable));
        }

        renderDetailParagraphs();
        renderSellerReviews();
        renderProductReviews();
    }

    function syncFavoriteButton() {
        if (!favoriteButton) {
            return;
        }

        var isActive = favoriteStore.exists(product.id);

        favoriteButton.classList.toggle('is-active', isActive);
        favoriteButton.setAttribute('aria-pressed', String(isActive));
        favoriteButton.setAttribute('aria-label', isActive ? 'Usun z ulubionych' : 'Dodaj do ulubionych');
    }

    reviewLimitButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            reviewLimit = Number(button.dataset.limit || 6);
            currentReviewPage = 1;

            syncLimitButtons();
            renderProductReviews();
        });
    });

    if (reviewFilterButton) {
        reviewFilterButton.addEventListener('click', function (event) {
            event.stopPropagation();
            toggleReviewFilterMenu();
        });
    }

    if (reviewFilterMenu) {
        reviewFilterMenu.addEventListener('click', function (event) {
            var target = event.target.closest('button[data-rating-filter]');

            if (!target) {
                return;
            }

            reviewRatingFilter = target.dataset.ratingFilter || '';
            currentReviewPage = 1;
            closeReviewFilterMenu();
            renderProductReviews();
        });
    }

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            closeReviewFilterMenu();
        }
    });

    document.addEventListener('click', function (event) {
        if (!reviewFilterMenu || reviewFilterMenu.hidden) {
            return;
        }

        if (reviewFilterButton && reviewFilterButton.contains(event.target)) {
            return;
        }

        if (reviewFilterMenu.contains(event.target)) {
            return;
        }

        closeReviewFilterMenu();
    });

    if (favoriteButton) {
        favoriteButton.addEventListener('click', function () {
            if (favoriteStore.exists(product.id)) {
                favoriteStore.remove(product.id);
                pageShell.showToast('Usunieto z ulubionych.');
            } else {
                favoriteStore.add(product);
                pageShell.showToast('Dodano do ulubionych.');
            }

            syncFavoriteButton();
        });
    }

    if (addToCartButton) {
        addToCartButton.addEventListener('click', function () {
            if (product.available === false) {
                pageShell.showToast('Ten produkt jest obecnie niedost\u0119pny.');
                return;
            }

            var originalText = addToCartButton.textContent;
            var quantityLabel = selectedQuantity > 1 ? selectedQuantity + ' szt.' : '1 szt.';

            cartStore.add(Object.assign({}, product, { quantity: selectedQuantity }));
            pageShell.syncCartCounters();
            pageShell.showToast('Dodano ' + quantityLabel + ' do koszyka.');
            addToCartButton.classList.add('is-added');
            addToCartButton.textContent = 'Dodano';

            window.setTimeout(function () {
                addToCartButton.classList.remove('is-added');
                addToCartButton.textContent = originalText;
            }, 1200);
        });
    }

    if (quantityDecreaseButton) {
        quantityDecreaseButton.addEventListener('click', function () {
            setQuantity(selectedQuantity - 1);
        });
    }

    if (quantityIncreaseButton) {
        quantityIncreaseButton.addEventListener('click', function () {
            setQuantity(selectedQuantity + 1);
        });
    }

    if (sellerFeedbackList) {
        sellerFeedbackList.addEventListener('scroll', syncSellerFeedbackScrollbar, { passive: true });
    }

    window.addEventListener('resize', function () {
        syncSellerFeedbackScrollbar();
        renderProductPagination();
    });

    syncLimitButtons();
    renderQuantity();
    renderProduct();
    syncFavoriteButton();
})();



