(function () {
    var body = document.body;
    var cartStore = window.cartStore;
    var SESSION_KEY = 'srp_auth_session_v1';

    if (!body) {
        return;
    }

    var navToggle = document.querySelector('.mobile-nav-toggle');
    var primaryNav = document.querySelector('.primary-nav');
    var searchSlot = document.querySelector('.search-slot');
    var searchTrigger = document.querySelector('.search-trigger');
    var searchInput = document.querySelector('.search-inline input');
    var searchClear = document.querySelector('.search-clear');
    var pageToast = document.getElementById('pageToast');
    var cartCounters = Array.prototype.slice.call(document.querySelectorAll('[data-cart-count]'));
    var toastTimer = null;
    var routes = [
        { href: 'index.html', terms: 'strona glowna start regiony polska' },
        { href: 'sery.html', terms: 'sery oscypek bundz bryndza' },
        { href: 'nalewki.html', terms: 'nalewki wisniowka sliwkowka pigwowka' },
        { href: 'przetwory.html', terms: 'przetwory dzem marynowane fasola gruszka' },
        { href: 'wedliny.html', terms: 'wedliny kielbasa baleron poledwica pasztet' },
        { href: 'miody.html', terms: 'miody miod lipowy akacjowy' },
        { href: 'rekodzielo.html', terms: 'rekodzielo ciupaga kapelusz stroj' },
        { href: 'ulubione.html', terms: 'ulubione zapisane produkty' },
        { href: 'koszyk.html', terms: 'koszyk zamowienie platnosc' },
        { href: 'about.html', terms: 'o nas faq informacje kontakt' },
        { href: 'logowanie.html', terms: 'logowanie login haslo konto wejdz' },
        { href: 'rejestracja.html', terms: 'rejestracja konto klient zaloz konto' },
        { href: 'rejestracja-sprzedawcy.html', terms: 'sprzedawca rejestracja firmy nip panel sprzedawcy' },
        { href: 'profil.html', terms: 'profil konto zamowienia klient' },
        { href: 'regulamin.html', terms: 'regulamin zwroty rodo polityka prywatnosci' },
        { href: 'produkt.html', terms: 'produkt karta produktu dzem z gruszki' }
    ];

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

    function setupProfileLinks() {
        var profileLinks = Array.prototype.slice.call(document.querySelectorAll('a[href^="profil.html"]'));
        if (profileLinks.length === 0) {
            return;
        }

        var session = readSession();
        var hasSession = Boolean(session && session.email);
        var isSeller = Boolean(session && session.role === 'seller');
        var sellerName = session && session.sellerName ? String(session.sellerName).trim() : '';
        var targetHref = 'logowanie.html';

        if (hasSession && isSeller) {
            targetHref = 'seller.html?seller=' + encodeURIComponent(sellerName || 'Sprzedawca regionalny');
        } else if (hasSession) {
            targetHref = 'profil.html';
        }

        profileLinks.forEach(function (link) {
            link.setAttribute('href', targetHref);
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

    function setSearchOpen(isOpen) {
        if (!searchSlot || !searchTrigger) {
            return;
        }

        searchSlot.classList.toggle('is-open', isOpen);
        searchTrigger.setAttribute('aria-expanded', String(Boolean(isOpen)));

        if (isOpen && searchInput) {
            searchInput.focus();
        }
    }

    function findRoute(query) {
        var normalizedQuery = normalize(query);

        return routes.find(function (route) {
            return normalize(route.terms).indexOf(normalizedQuery) !== -1;
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
        });

        searchInput.addEventListener('keydown', function (event) {
            if (event.key !== 'Enter') {
                return;
            }

            var query = searchInput.value.trim();
            var route = findRoute(query);

            if (!query) {
                setSearchOpen(false);
                return;
            }

            if (!route) {
                showToast('Brak dopasowanej strony dla tego wyszukiwania.');
                return;
            }

            window.location.href = route.href;
        });
    }

    if (searchClear) {
        searchClear.addEventListener('click', function () {
            if (!searchInput) {
                return;
            }

            searchInput.value = '';
            searchSlot.classList.remove('has-value');
            searchInput.focus();
        });
    }

    Array.prototype.slice.call(document.querySelectorAll('[data-toast]')).forEach(function (element) {
        element.addEventListener('click', function (event) {
            event.preventDefault();
            showToast(element.dataset.toast);
        });
    });

    document.addEventListener('click', function (event) {
        if (searchSlot && searchSlot.classList.contains('is-open') && !searchSlot.contains(event.target)) {
            setSearchOpen(false);
        }
    });

    window.pageShell = {
        showToast: showToast,
        syncCartCounters: syncCartCounters
    };

    setupProfileLinks();
    syncCartCounters();
})();
