(function () {
    var SESSION_KEY = 'srp_auth_session_v1';
    var desktopFilters = Array.prototype.slice.call(document.querySelectorAll('.profile-orders-v2-filter[data-view]'));
    var mobileOptions = Array.prototype.slice.call(document.querySelectorAll('.profile-orders-v2-mobile-option[data-view]'));
    var views = Array.prototype.slice.call(document.querySelectorAll('.profile-orders-v2-view[data-view]'));
    var switchButtons = Array.prototype.slice.call(document.querySelectorAll('[data-switch-view]'));
    var mobileToggle = document.getElementById('mobileOrdersToggle');
    var mobilePanel = document.getElementById('mobileOrdersPanel');
    var mobileLabel = document.getElementById('mobileOrdersLabel');
    var deliveredGrid = document.querySelector('.profile-orders-v2-view[data-view="delivered"] .profile-orders-v2-grid');
    var deliveredPagination = document.querySelector('.profile-orders-v2-view[data-view="delivered"] .profile-orders-v2-pagination');
    var deliveredCards = deliveredGrid ? Array.prototype.slice.call(deliveredGrid.querySelectorAll('.profile-orders-v2-card')) : [];
    var reviewPanel = document.querySelector('.order-review-panel');
    var reviewStepElements = Array.prototype.slice.call(document.querySelectorAll('.order-review-step[data-review-step]'));
    var receivedReviewProduct = document.querySelector('[data-received-review-product]');
    var receivedReviewSeller = document.querySelector('[data-received-review-seller]');
    var receivedCards = Array.prototype.slice.call(document.querySelectorAll('[data-received-order-id]'));
    var receivedOpenButtons = Array.prototype.slice.call(document.querySelectorAll('[data-open-received-review]'));
    var receivedLayout = document.querySelector('.profile-orders-v2-received-layout');
    var returnForm = document.getElementById('returnForm');
    var returnOrderInputs = Array.prototype.slice.call(document.querySelectorAll('[data-return-order]'));
    var returnReasonPicker = document.getElementById('returnReasonPicker');
    var returnReasonButton = document.getElementById('returnReasonButton');
    var returnReasonMenu = document.getElementById('returnReasonMenu');
    var returnReasonLabel = document.querySelector('[data-return-reason-label]');
    var returnReasonOptions = Array.prototype.slice.call(document.querySelectorAll('[data-return-reason]'));
    var returnReasonMenuConfirm = document.querySelector('.profile-return-reason-menu-confirm');
    var returnSubmitButton = document.querySelector('.profile-return-submit');
    var returnSuccessModal = document.getElementById('returnSuccessModal');
    var returnSuccessClose = document.getElementById('returnSuccessClose');
    var returnScrollArea = document.getElementById('returnOrders');
    var returnDivider = document.getElementById('returnDivider');
    var returnDividerThumb = returnDivider ? returnDivider.querySelector('span') : null;
    var logoutButton = document.getElementById('logoutButton');
    var activeView = '';
    var activeReceivedOrderId = '';
    var deliveredPageSize = 5;
    var deliveredCurrentPage = 1;
    var reviewStepState = 'product';
    var reviewSteps = {};
    var returnDividerDrag = null;

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

    var session = readSession();
    if (!session || !session.email) {
        window.location.replace('logowanie.html');
        return;
    }

    if (session.role === 'seller') {
        var sellerName = session.sellerName ? String(session.sellerName).trim() : '';
        window.location.replace('seller.html?seller=' + encodeURIComponent(sellerName || 'Sprzedawca regionalny'));
        return;
    }

    function logout() {
        try {
            window.localStorage.removeItem(SESSION_KEY);
        } catch (error) {
            // ignore
        }

        window.location.replace('logowanie.html');
    }

    function formatRatingLabel(rating) {
        if (rating === 1) {
            return 'gwiazda';
        }

        if (rating < 5) {
            return 'gwiazdy';
        }

        return 'gwiazdek';
    }

    function getViewLabel(viewName) {
        var fromDesktop = desktopFilters.find(function (button) {
            return button.getAttribute('data-view') === viewName;
        });
        if (fromDesktop) {
            return fromDesktop.textContent.trim();
        }

        var fromMobile = mobileOptions.find(function (button) {
            return button.getAttribute('data-view') === viewName;
        });
        if (fromMobile) {
            return fromMobile.textContent.trim();
        }

        if (viewName === 'review') {
            return 'Ocena';
        }

        return 'Moje zamówienia';
    }

    function findLabelByView(viewName) {
        var fromDesktop = desktopFilters.find(function (button) {
            return button.getAttribute('data-view') === viewName;
        });
        if (fromDesktop) {
            return fromDesktop.textContent.trim();
        }

        var fromMobile = mobileOptions.find(function (button) {
            return button.getAttribute('data-view') === viewName;
        });
        if (fromMobile) {
            return fromMobile.textContent.trim();
        }

        if (viewName === 'review') {
            return 'Ocena';
        }

        return 'Moje zamówienia';
    }

    function getActiveViewLabel(viewName) {
        var fromDesktop = desktopFilters.find(function (button) {
            return button.getAttribute('data-view') === viewName;
        });
        if (fromDesktop) {
            return fromDesktop.textContent.trim();
        }

        var fromMobile = mobileOptions.find(function (button) {
            return button.getAttribute('data-view') === viewName;
        });
        if (fromMobile) {
            return fromMobile.textContent.trim();
        }

        if (viewName === 'review') {
            return 'Ocena';
        }

        return 'Moje zam\u00f3wienia';
    }

    function setMobilePanelOpen(isOpen) {
        if (!mobilePanel || !mobileToggle) {
            return;
        }

        mobilePanel.hidden = !isOpen;
        mobileToggle.setAttribute('aria-expanded', String(Boolean(isOpen)));
    }

    function setReturnReasonMenuOpen(isOpen) {
        if (!returnReasonMenu || !returnReasonButton) {
            return;
        }

        returnReasonMenu.hidden = !isOpen;
        returnReasonButton.setAttribute('aria-expanded', String(Boolean(isOpen)));
        document.body.classList.toggle('profile-return-reason-open', Boolean(isOpen));
    }

    function setReturnSuccessOpen(isOpen) {
        if (!returnSuccessModal) {
            return;
        }

        returnSuccessModal.hidden = !isOpen;
        document.body.classList.toggle('profile-return-success-open', Boolean(isOpen));

        if (isOpen && returnSuccessClose) {
            returnSuccessClose.focus();
        }
    }

    function syncReturnOrderState(input) {
        var row = input.closest('.profile-return-order-row');
        if (!row) {
            return;
        }

        row.classList.toggle('is-selected', input.checked);
    }

    function getDeliveredProductCount(card) {
        return Number(card.getAttribute('data-delivered-product-count') || 0);
    }

    function getDeliveredPageCount() {
        return Math.max(1, Math.ceil(deliveredCards.length / deliveredPageSize));
    }

    function clampDeliveredPage(page) {
        return Math.min(Math.max(1, Number(page) || 1), getDeliveredPageCount());
    }

    function buildDeliveredPaginationItems(totalPages, currentPage) {
        var items = [];
        var page;

        if (totalPages <= 7) {
            for (page = 1; page <= totalPages; page += 1) {
                items.push({ type: 'page', value: page });
            }

            return items;
        }

        items.push({ type: 'page', value: 1 });

        var left = Math.max(2, currentPage - 1);
        var right = Math.min(totalPages - 1, currentPage + 1);

        if (left > 2) {
            items.push({ type: 'ellipsis' });
        }

        for (page = left; page <= right; page += 1) {
            items.push({ type: 'page', value: page });
        }

        if (right < totalPages - 1) {
            items.push({ type: 'ellipsis' });
        }

        items.push({ type: 'page', value: totalPages });
        return items;
    }

    function renderDeliveredPagination() {
        if (!deliveredPagination) {
            return;
        }

        var totalPages = getDeliveredPageCount();
        var items = buildDeliveredPaginationItems(totalPages, deliveredCurrentPage);

        deliveredPagination.innerHTML = '';

        items.forEach(function (item) {
            if (item.type === 'ellipsis') {
                var ellipsis = document.createElement('span');
                ellipsis.setAttribute('aria-hidden', 'true');
                ellipsis.textContent = '...';
                deliveredPagination.appendChild(ellipsis);
                return;
            }

            var button = document.createElement('button');
            var isActive = item.value === deliveredCurrentPage;

            button.type = 'button';
            button.textContent = String(item.value);
            button.setAttribute('data-delivered-page', String(item.value));
            button.setAttribute('aria-label', 'Strona ' + item.value);
            button.setAttribute('aria-pressed', String(isActive));
            button.classList.toggle('is-active', isActive);

            deliveredPagination.appendChild(button);
        });
    }

    function renderDeliveredCards() {
        if (!deliveredGrid || deliveredCards.length === 0) {
            return;
        }

        deliveredCurrentPage = clampDeliveredPage(deliveredCurrentPage);

        var sortedCards = deliveredCards.slice().sort(function (left, right) {
            var rightCount = getDeliveredProductCount(right);
            var leftCount = getDeliveredProductCount(left);
            if (rightCount !== leftCount) {
                return rightCount - leftCount;
            }

            return right.textContent.localeCompare(left.textContent);
        });

        var startIndex = (deliveredCurrentPage - 1) * deliveredPageSize;
        var endIndex = startIndex + deliveredPageSize;

        sortedCards.forEach(function (card, index) {
            deliveredGrid.appendChild(card);
            var isHidden = index < startIndex || index >= endIndex;
            card.hidden = isHidden;
            card.classList.toggle('is-delivered-hidden', isHidden);
        });

        renderDeliveredPagination();
    }

    function setDeliveredPage(page) {
        deliveredCurrentPage = clampDeliveredPage(page);
        renderDeliveredCards();
    }

    function bindReviewStep(stepElement) {
        if (!stepElement) {
            return null;
        }

        var stepName = stepElement.getAttribute('data-review-step') || 'product';
        var stars = Array.prototype.slice.call(stepElement.querySelectorAll('.order-star'));
        var scoreNode = stepElement.querySelector('.order-review-score');
        var submitButton = stepElement.querySelector('.order-review-submit');
        var state = {
            name: stepName,
            element: stepElement,
            stars: stars,
            scoreNode: scoreNode,
            submitButton: submitButton,
            rating: 4
        };

        function render() {
            stars.forEach(function (item) {
                item.classList.toggle('is-active', Number(item.dataset.rating || 0) <= state.rating);
            });

            if (scoreNode) {
                scoreNode.textContent = state.rating.toFixed(1) + ' ' + formatRatingLabel(state.rating);
            }
        }

        stars.forEach(function (item) {
            item.addEventListener('click', function () {
                state.rating = Number(item.dataset.rating || 0);
                render();
            });
        });

        state.render = render;
        state.setRating = function (rating) {
            state.rating = rating;
            render();
        };
        render();
        return state;
    }

    function setReceivedReviewStep(stepName) {
        reviewStepState = stepName;

        reviewStepElements.forEach(function (stepElement) {
            var isActive = stepElement.getAttribute('data-review-step') === stepName;
            stepElement.hidden = !isActive;
        });

        if (reviewPanel) {
            reviewPanel.setAttribute('data-review-step', stepName);
            reviewPanel.classList.toggle('is-seller-step', stepName === 'seller');
        }
    }

    function setReceivedReviewOpen(isOpen) {
        if (!reviewPanel) {
            return;
        }

        reviewPanel.hidden = !isOpen;
        receivedOpenButtons.forEach(function (button) {
            button.setAttribute('aria-expanded', String(Boolean(isOpen)));
        });
        if (receivedLayout) {
            receivedLayout.classList.toggle('is-review-open', Boolean(isOpen));
        }
    }

    function setReceivedReviewActive(orderId) {
        activeReceivedOrderId = orderId || '';

        receivedCards.forEach(function (card) {
            var isSelected = card.getAttribute('data-received-order-id') === activeReceivedOrderId;
            card.classList.toggle('is-selected', isSelected);
        });

        if (receivedReviewProduct && activeReceivedOrderId) {
            var activeCard = receivedCards.find(function (card) {
                return card.getAttribute('data-received-order-id') === activeReceivedOrderId;
            });
            var productName = 'Produkt';

            if (activeCard) {
                productName = activeCard.getAttribute('data-received-product-name') || productName;
                if (productName === 'Produkt') {
                    var labelNode = activeCard.querySelector('.profile-orders-v2-card-head span');
                    if (labelNode) {
                        productName = labelNode.textContent.trim() || productName;
                    }
                }
            }

            receivedReviewProduct.textContent = productName;
        }

        if (receivedReviewSeller) {
            receivedReviewSeller.textContent = 'Sprzedawca regionalny';
        }
    }

    function openReceivedReview(orderId) {
        setReceivedReviewActive(orderId);
        setReceivedReviewOpen(true);
        setReceivedReviewStep('product');

        if (reviewSteps.product) {
            reviewSteps.product.setRating(4);
        }

        if (reviewSteps.seller) {
            reviewSteps.seller.setRating(4);
        }

        if (reviewPanel && window.matchMedia && window.matchMedia('(max-width: 760px)').matches) {
            window.setTimeout(function () {
                reviewPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 0);
        }
    }

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function getReturnScrollMetrics() {
        if (!returnScrollArea || !returnDivider || !returnDividerThumb) {
            return null;
        }

        var maxScroll = Math.max(0, returnScrollArea.scrollHeight - returnScrollArea.clientHeight);
        var trackHeight = returnDivider.clientHeight;
        var thumbHeight = maxScroll > 0 ? Math.max(68, trackHeight * (returnScrollArea.clientHeight / returnScrollArea.scrollHeight)) : trackHeight;
        var maxThumbTop = Math.max(0, trackHeight - thumbHeight);

        return {
            maxScroll: maxScroll,
            maxThumbTop: maxThumbTop,
            thumbHeight: thumbHeight
        };
    }

    function syncReturnScrollbar() {
        var metrics = getReturnScrollMetrics();
        if (!metrics) {
            return;
        }

        var hasOverflow = metrics.maxScroll > 0;
        var thumbTop = hasOverflow ? (returnScrollArea.scrollTop / metrics.maxScroll) * metrics.maxThumbTop : 0;

        returnDivider.classList.toggle('is-disabled', !hasOverflow);
        returnDivider.setAttribute('aria-valuemax', String(Math.round(metrics.maxScroll)));
        returnDivider.setAttribute('aria-valuenow', String(Math.round(returnScrollArea.scrollTop)));
        returnDividerThumb.style.height = metrics.thumbHeight + 'px';
        returnDividerThumb.style.transform = 'translateY(' + thumbTop + 'px)';
    }

    function setReturnScrollByPointer(clientY) {
        var metrics = getReturnScrollMetrics();
        if (!metrics || metrics.maxScroll <= 0) {
            return;
        }

        var rect = returnDivider.getBoundingClientRect();
        var thumbTop = clamp(clientY - rect.top - (metrics.thumbHeight / 2), 0, metrics.maxThumbTop);
        returnScrollArea.scrollTop = metrics.maxThumbTop ? (thumbTop / metrics.maxThumbTop) * metrics.maxScroll : 0;
        syncReturnScrollbar();
    }

    function stopReturnScrollbarDrag() {
        if (!returnDividerDrag) {
            return;
        }

        returnDividerDrag = null;
        document.body.classList.remove('profile-return-scrollbar-dragging');
    }

    function activateView(viewName) {
        activeView = viewName;

        desktopFilters.forEach(function (button) {
            var isActive = button.getAttribute('data-view') === viewName;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-pressed', String(isActive));
        });

        mobileOptions.forEach(function (button) {
            button.classList.toggle('is-active', button.getAttribute('data-view') === viewName);
        });

        if (mobileLabel) {
            mobileLabel.textContent = getActiveViewLabel(viewName);
        }

        views.forEach(function (view) {
            view.classList.toggle('is-active', view.getAttribute('data-view') === viewName);
        });

        if (reviewPanel) {
            setReceivedReviewOpen(viewName === 'received' && Boolean(activeReceivedOrderId));
        }

        if (viewName === 'delivered') {
            renderDeliveredCards();
        }
    }

    desktopFilters.forEach(function (button) {
        button.addEventListener('click', function () {
            activateView(button.getAttribute('data-view'));
        });
    });

    mobileOptions.forEach(function (button) {
        button.addEventListener('click', function () {
            activateView(button.getAttribute('data-view'));
            setMobilePanelOpen(false);
        });
    });

    switchButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            activateView(button.getAttribute('data-switch-view'));
        });
    });

    if (deliveredPagination) {
        deliveredPagination.addEventListener('click', function (event) {
            var button = event.target.closest('[data-delivered-page]');
            if (!button) {
                return;
            }

            setDeliveredPage(button.getAttribute('data-delivered-page'));
        });
    }

    if (mobileToggle) {
        mobileToggle.addEventListener('click', function () {
            var isOpen = !mobilePanel || mobilePanel.hidden;
            setMobilePanelOpen(isOpen);
        });
    }

    document.addEventListener('click', function (event) {
        if (!mobilePanel || !mobileToggle || mobilePanel.hidden) {
            return;
        }

        if (!mobilePanel.contains(event.target) && !mobileToggle.contains(event.target)) {
            setMobilePanelOpen(false);
        }
    });

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            setMobilePanelOpen(false);
            setReturnReasonMenuOpen(false);
        }
    });

    reviewStepElements.forEach(function (stepElement) {
        var stepName = stepElement.getAttribute('data-review-step') || 'product';
        reviewSteps[stepName] = bindReviewStep(stepElement);
    });

    if (reviewPanel) {
        reviewPanel.addEventListener('submit', function (event) {
            event.preventDefault();

            if (reviewStepState === 'product') {
                setReceivedReviewStep('seller');
                if (window.pageShell && window.pageShell.showToast) {
                    window.pageShell.showToast('Teraz oceń sprzedawcę.');
                }
                return;
            }

            if (window.pageShell && window.pageShell.showToast) {
                window.pageShell.showToast('Ocena została zapisana.');
            }

            setReceivedReviewOpen(false);
            setReceivedReviewStep('product');
        });
    }

    receivedOpenButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            var card = button.closest('[data-received-order-id]');
            if (!card) {
                return;
            }

            openReceivedReview(card.getAttribute('data-received-order-id'));
        });
    });

    if (reviewSteps.product) {
        reviewSteps.product.setRating(4);
    }

    if (reviewSteps.seller) {
        reviewSteps.seller.setRating(4);
    }

    if (receivedCards.length > 0) {
        if (receivedReviewProduct && !receivedReviewProduct.textContent.trim()) {
            receivedReviewProduct.textContent = receivedCards[0].getAttribute('data-received-product-name') || 'Produkt';
        }
    }

    if (deliveredCards.length > 0) {
        setDeliveredPage(deliveredCurrentPage);
    }

    returnOrderInputs.forEach(function (input) {
        syncReturnOrderState(input);

        input.addEventListener('change', function () {
            syncReturnOrderState(input);
        });
    });

    if (returnScrollArea) {
        returnScrollArea.addEventListener('scroll', syncReturnScrollbar);
    }

    if (returnDivider) {
        returnDivider.addEventListener('click', function (event) {
            if (event.target === returnDivider) {
                setReturnScrollByPointer(event.clientY);
            }
        });

        returnDivider.addEventListener('keydown', function (event) {
            if (!returnScrollArea) {
                return;
            }

            var step = 72;
            if (event.key === 'ArrowDown') {
                returnScrollArea.scrollTop += step;
            } else if (event.key === 'ArrowUp') {
                returnScrollArea.scrollTop -= step;
            } else if (event.key === 'PageDown') {
                returnScrollArea.scrollTop += returnScrollArea.clientHeight;
            } else if (event.key === 'PageUp') {
                returnScrollArea.scrollTop -= returnScrollArea.clientHeight;
            } else if (event.key === 'Home') {
                returnScrollArea.scrollTop = 0;
            } else if (event.key === 'End') {
                returnScrollArea.scrollTop = returnScrollArea.scrollHeight;
            } else {
                return;
            }

            event.preventDefault();
            syncReturnScrollbar();
        });
    }

    if (returnDividerThumb) {
        returnDividerThumb.addEventListener('pointerdown', function (event) {
            var metrics = getReturnScrollMetrics();
            if (!metrics || metrics.maxScroll <= 0) {
                return;
            }

            event.preventDefault();
            returnDividerDrag = {
                pointerId: event.pointerId,
                startY: event.clientY,
                startScroll: returnScrollArea.scrollTop,
                metrics: metrics
            };
            returnDividerThumb.setPointerCapture(event.pointerId);
            document.body.classList.add('profile-return-scrollbar-dragging');
        });

        returnDividerThumb.addEventListener('pointermove', function (event) {
            if (!returnDividerDrag || event.pointerId !== returnDividerDrag.pointerId) {
                return;
            }

            var metrics = returnDividerDrag.metrics;
            var scrollPerPixel = metrics.maxThumbTop ? metrics.maxScroll / metrics.maxThumbTop : 0;
            returnScrollArea.scrollTop = returnDividerDrag.startScroll + ((event.clientY - returnDividerDrag.startY) * scrollPerPixel);
            syncReturnScrollbar();
        });

        returnDividerThumb.addEventListener('pointerup', function (event) {
            if (returnDividerDrag && event.pointerId === returnDividerDrag.pointerId) {
                stopReturnScrollbarDrag();
            }
        });

        returnDividerThumb.addEventListener('pointercancel', stopReturnScrollbarDrag);
        returnDividerThumb.addEventListener('lostpointercapture', stopReturnScrollbarDrag);
    }

    if (returnReasonButton) {
        returnReasonButton.addEventListener('click', function () {
            var isOpen = !returnReasonMenu || returnReasonMenu.hidden;
            setReturnReasonMenuOpen(isOpen);
        });
    }

    returnReasonOptions.forEach(function (option) {
        option.addEventListener('click', function () {
            var reason = option.getAttribute('data-return-reason') || option.textContent.trim();

            if (returnReasonLabel) {
                returnReasonLabel.textContent = reason;
            }

            returnReasonOptions.forEach(function (item) {
                item.setAttribute('aria-selected', String(item === option));
            });

            setReturnReasonMenuOpen(false);
        });
    });

    if (returnReasonMenuConfirm) {
        returnReasonMenuConfirm.addEventListener('click', function () {
            setReturnReasonMenuOpen(false);
        });
    }

    document.addEventListener('click', function (event) {
        if (!returnReasonPicker || !returnReasonMenu || returnReasonMenu.hidden) {
            return;
        }

        if (!returnReasonPicker.contains(event.target)) {
            setReturnReasonMenuOpen(false);
        }
    });

    if (returnSuccessClose) {
        returnSuccessClose.addEventListener('click', function () {
            setReturnSuccessOpen(false);
        });
    }

    if (returnSuccessModal) {
        returnSuccessModal.addEventListener('click', function (event) {
            if (event.target === returnSuccessModal || event.target === returnSuccessModal.querySelector('.profile-return-success-backdrop')) {
                setReturnSuccessOpen(false);
            }
        });
    }

    if (returnForm) {
        returnForm.addEventListener('submit', function (event) {
            event.preventDefault();

            var selectedCount = returnOrderInputs.filter(function (input) {
                return input.checked;
            }).length;

            if (selectedCount === 0) {
                if (window.pageShell && window.pageShell.showToast) {
                    window.pageShell.showToast('Wybierz co najmniej jedno zam\u00f3wienie do zwrotu.');
                }
                return;
            }

            var isMobile = window.matchMedia && window.matchMedia('(max-width: 760px)').matches;

            if (isMobile) {
                setReturnSuccessOpen(true);
            } else {
                if (window.pageShell && window.pageShell.showToast) {
                    window.pageShell.showToast('Zg\u0142oszenie zwrotu zosta\u0142o zapisane.');
                }

                if (returnSubmitButton) {
                    returnSubmitButton.textContent = 'Wys\u0142ano';
                    window.setTimeout(function () {
                        returnSubmitButton.textContent = 'Zwr\u00f3\u0107';
                    }, 1600);
                }
            }
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', function () {
            logout();
        });
    }

    var defaultDesktop = desktopFilters.find(function (button) {
        return button.classList.contains('is-active');
    });
    var defaultView = defaultDesktop ? defaultDesktop.getAttribute('data-view') : 'delivered';
    activateView(defaultView);
    syncReturnScrollbar();
    window.addEventListener('resize', syncReturnScrollbar);
})();

