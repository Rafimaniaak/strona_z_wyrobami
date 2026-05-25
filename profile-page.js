(function () {
    var SESSION_KEY = 'srp_auth_session_v1';
    var desktopFilters = Array.prototype.slice.call(document.querySelectorAll('.profile-orders-v2-filter[data-view]'));
    var mobileOptions = Array.prototype.slice.call(document.querySelectorAll('.profile-orders-v2-mobile-option[data-view]'));
    var views = Array.prototype.slice.call(document.querySelectorAll('.profile-orders-v2-view[data-view]'));
    var switchButtons = Array.prototype.slice.call(document.querySelectorAll('[data-switch-view]'));
    var mobileToggle = document.getElementById('mobileOrdersToggle');
    var mobilePanel = document.getElementById('mobileOrdersPanel');
    var mobileLabel = document.getElementById('mobileOrdersLabel');
    var stars = Array.prototype.slice.call(document.querySelectorAll('.order-star'));
    var scoreNode = document.querySelector('.order-review-score');
    var reviewForm = document.querySelector('.order-review-panel');
    var logoutButton = document.getElementById('logoutButton');
    var activeView = '';

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

    function setMobilePanelOpen(isOpen) {
        if (!mobilePanel || !mobileToggle) {
            return;
        }

        mobilePanel.hidden = !isOpen;
        mobileToggle.setAttribute('aria-expanded', String(Boolean(isOpen)));
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

        views.forEach(function (view) {
            view.classList.toggle('is-active', view.getAttribute('data-view') === viewName);
        });

        if (mobileLabel) {
            mobileLabel.textContent = findLabelByView(viewName);
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
        }
    });

    stars.forEach(function (star) {
        star.addEventListener('click', function () {
            var rating = Number(star.dataset.rating || 0);

            stars.forEach(function (item) {
                item.classList.toggle('is-active', Number(item.dataset.rating || 0) <= rating);
            });

            if (scoreNode) {
                scoreNode.textContent = rating.toFixed(1) + ' ' + formatRatingLabel(rating);
            }
        });
    });

    if (reviewForm) {
        reviewForm.addEventListener('submit', function (event) {
            event.preventDefault();
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
})();
