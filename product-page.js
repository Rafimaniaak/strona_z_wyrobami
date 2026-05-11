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
    var sellerFeedbackList = document.getElementById('sellerFeedbackList');
    var sellerFeedbackScrollbar = document.querySelector('.seller-feedback-scrollbar');
    var sellerFeedbackScrollbarThumb = document.querySelector('.seller-feedback-scrollbar-thumb');
    var productReviewTrack = document.getElementById('productReviewCards');
    var reviewLimitButtons = Array.prototype.slice.call(document.querySelectorAll('.review-limit-button'));
    var reviewLimit = 6;
    var reviewAnimationFrame = null;
    var reviewOffset = 0;
    var reviewLoopWidth = 0;
    var reviewLastFrameAt = 0;
    var reviewSpeed = 26;

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

    function reviewPool() {
        return (product.productReviews || []).slice(0, reviewLimit);
    }

    function syncLimitButtons() {
        reviewLimitButtons.forEach(function (button) {
            var isActive = Number(button.dataset.limit) === reviewLimit;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-pressed', String(isActive));
        });
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
            var rating = document.createElement('span');
            var star = document.createElement('span');

            card.className = 'seller-feedback-item seller-feedback-item-compact';
            bullet.className = 'seller-feedback-bullet';
            text.textContent = review.text;
            author.textContent = review.author;
            rating.textContent = review.rating;
            star.className = 'seller-feedback-star';
            star.textContent = '☆';

            meta.appendChild(author);
            meta.appendChild(star);
            meta.appendChild(rating);
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

    function stopReviewLoop() {
        if (reviewAnimationFrame) {
            window.cancelAnimationFrame(reviewAnimationFrame);
            reviewAnimationFrame = null;
        }

        reviewLastFrameAt = 0;
    }

    function setReviewTrackOffset(offset) {
        if (!productReviewTrack) {
            return;
        }

        productReviewTrack.style.transform = 'translateX(-' + offset + 'px)';
    }

    function measureReviewLoop() {
        if (!productReviewTrack) {
            return;
        }

        var cards = Array.prototype.slice.call(productReviewTrack.children);
        var loopMarker = cards[Math.floor(cards.length / 2)];

        if (!loopMarker) {
            reviewLoopWidth = 0;
            reviewOffset = 0;
            setReviewTrackOffset(0);
            return;
        }

        reviewLoopWidth = loopMarker.offsetLeft;

        if (reviewLoopWidth <= 0) {
            reviewOffset = 0;
        } else if (reviewOffset >= reviewLoopWidth) {
            reviewOffset = reviewOffset % reviewLoopWidth;
        }

        setReviewTrackOffset(reviewOffset);
    }

    function animateReviewLoop(timestamp) {
        if (!productReviewTrack || reviewLoopWidth <= 0) {
            reviewAnimationFrame = null;
            return;
        }

        if (!reviewLastFrameAt) {
            reviewLastFrameAt = timestamp;
        }

        reviewOffset += ((timestamp - reviewLastFrameAt) / 1000) * reviewSpeed;
        reviewLastFrameAt = timestamp;

        if (reviewOffset >= reviewLoopWidth) {
            reviewOffset = reviewOffset % reviewLoopWidth;
        }

        setReviewTrackOffset(reviewOffset);
        reviewAnimationFrame = window.requestAnimationFrame(animateReviewLoop);
    }

    function startReviewLoop() {
        stopReviewLoop();
        measureReviewLoop();

        if (reviewLoopWidth <= 0) {
            return;
        }

        reviewAnimationFrame = window.requestAnimationFrame(animateReviewLoop);
    }

    function renderProductReviews() {
        if (!productReviewTrack) {
            return;
        }

        var pool = reviewPool();

        productReviewTrack.innerHTML = '';

        pool.concat(pool).forEach(function (review, index) {
            var card = document.createElement('article');
            var text = document.createElement('p');
            var footer = document.createElement('div');
            var author = document.createElement('strong');
            var stars = document.createElement('span');

            card.className = 'mini-review-card mini-review-card-floating';
            card.style.setProperty('--float-index', String(index % 4));
            text.textContent = review.text;
            author.textContent = review.author;
            stars.textContent = '★★★★★';

            footer.className = 'mini-review-meta mini-review-meta-stars';
            footer.appendChild(author);
            footer.appendChild(stars);
            card.appendChild(text);
            card.appendChild(footer);
            productReviewTrack.appendChild(card);
        });

        reviewOffset = 0;

        requestAnimationFrame(function () {
            startReviewLoop();
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
        setText(feedbackSellerNode, product.seller);
        setText(priceNode, product.price + ' z\u0142');
        setText(reviewCountNode, product.reviewCount);

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
            stopReviewLoop();
            syncLimitButtons();
            renderProductReviews();
        });
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

            cartStore.add(product);
            pageShell.syncCartCounters();
            pageShell.showToast('Produkt dodany do koszyka.');
            addToCartButton.classList.add('is-added');
            addToCartButton.textContent = 'Dodano';

            window.setTimeout(function () {
                addToCartButton.classList.remove('is-added');
                addToCartButton.textContent = originalText;
            }, 1200);
        });
    }

    if (sellerFeedbackList) {
        sellerFeedbackList.addEventListener('scroll', syncSellerFeedbackScrollbar, { passive: true });
    }

    window.addEventListener('resize', function () {
        syncSellerFeedbackScrollbar();
        startReviewLoop();
    });

    syncLimitButtons();
    renderProduct();
    syncFavoriteButton();
})();
