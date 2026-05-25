(function () {
    var body = document.body;
    var USERS_KEY = 'srp_auth_users_v1';
    var SESSION_KEY = 'srp_auth_session_v1';

    if (!body) {
        return;
    }

    function showMessage(message) {
        if (window.pageShell && typeof window.pageShell.showToast === 'function') {
            window.pageShell.showToast(message);
            return;
        }

        window.alert(message);
    }

    function normalizeEmail(value) {
        return String(value || '').trim().toLowerCase();
    }

    function readUsers() {
        try {
            var raw = window.localStorage.getItem(USERS_KEY);
            var parsed = raw ? JSON.parse(raw) : null;
            if (!parsed || typeof parsed !== 'object') {
                return { customers: [], sellers: [] };
            }

            return {
                customers: Array.isArray(parsed.customers) ? parsed.customers : [],
                sellers: Array.isArray(parsed.sellers) ? parsed.sellers : []
            };
        } catch (error) {
            return { customers: [], sellers: [] };
        }
    }

    function writeUsers(users) {
        window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    function upsertByEmail(collection, payload) {
        var email = normalizeEmail(payload.email);
        var existingIndex = collection.findIndex(function (item) {
            return normalizeEmail(item.email) === email;
        });

        if (existingIndex === -1) {
            collection.push(payload);
            return;
        }

        collection[existingIndex] = payload;
    }

    function setSession(session) {
        window.localStorage.setItem(SESSION_KEY, JSON.stringify({
            role: session.role,
            email: normalizeEmail(session.email),
            remember: Boolean(session.remember),
            sellerName: session.sellerName || '',
            loginAt: new Date().toISOString()
        }));
    }

    function resolveSellerDisplayName(sellerRecord) {
        if (!sellerRecord) {
            return 'Sprzedawca regionalny';
        }

        if (sellerRecord.companyName && sellerRecord.companyName.trim()) {
            return sellerRecord.companyName.trim();
        }

        if (sellerRecord.ownerName && sellerRecord.ownerName.trim()) {
            return sellerRecord.ownerName.trim();
        }

        return 'Sprzedawca regionalny';
    }

    function validEmail(value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    function validNip(value) {
        return /^\d{10}$/.test(String(value || '').replace(/\s+/g, ''));
    }

    function getCollection(users, role) {
        return role === 'seller' ? users.sellers : users.customers;
    }

    function findByEmail(collection, email) {
        var normalizedEmail = normalizeEmail(email);
        return collection.find(function (item) {
            return normalizeEmail(item.email) === normalizedEmail;
        }) || null;
    }

    function authenticate(role, email, password, users) {
        var preferredRole = role === 'seller' ? 'seller' : 'customer';
        var fallbackRole = preferredRole === 'seller' ? 'customer' : 'seller';
        var roles = [preferredRole, fallbackRole];
        var sawAccount = false;

        for (var index = 0; index < roles.length; index += 1) {
            var currentRole = roles[index];
            var account = findByEmail(getCollection(users, currentRole), email);
            if (!account) {
                continue;
            }

            sawAccount = true;
            if (String(account.password || '') === password) {
                return { ok: true, role: currentRole, account: account };
            }
        }

        if (sawAccount) {
            return { ok: false, reason: 'wrong-password' };
        }

        return { ok: false, reason: 'not-found' };
    }

    function setupLogin() {
        var form = document.getElementById('loginForm');
        if (!form) {
            return;
        }

        form.addEventListener('submit', function (event) {
            event.preventDefault();

            var role = (form.elements.accountType && form.elements.accountType.value) || 'customer';
            var email = (form.elements.email && form.elements.email.value) || '';
            var password = (form.elements.password && form.elements.password.value) || '';
            var rememberMe = Boolean(form.elements.remember && form.elements.remember.checked);

            email = email.trim();

            if (!email || !password) {
                showMessage('Uzupelnij e-mail i haslo.');
                return;
            }

            if (!validEmail(email)) {
                showMessage('Podaj poprawny adres e-mail.');
                return;
            }

            var users = readUsers();
            var auth = authenticate(role, email, password, users);

            if (!auth.ok) {
                if (auth.reason === 'wrong-password') {
                    showMessage('Nieprawidlowe haslo.');
                    return;
                }

                showMessage('Nie znaleziono konta. Zarejestruj sie.');
                return;
            }

            var sellerName = auth.role === 'seller' ? resolveSellerDisplayName(auth.account) : '';
            setSession({
                role: auth.role,
                email: email,
                remember: rememberMe,
                sellerName: sellerName
            });

            if (auth.role === 'seller') {
                window.location.href = 'seller.html?seller=' + encodeURIComponent(sellerName);
                return;
            }

            window.location.href = 'profil.html';
        });
    }

    function setupLoginPasswordToggle() {
        var passwordInput = document.getElementById('loginPassword');
        var toggleButton = document.getElementById('loginPasswordToggle');
        var bambooImage = document.getElementById('loginBambooImage');

        if (!passwordInput || !toggleButton || !bambooImage) {
            return;
        }

        var closedImage = toggleButton.getAttribute('data-bamboo-closed') || bambooImage.getAttribute('src') || '';
        var openImage = toggleButton.getAttribute('data-bamboo-open') || closedImage;

        function setVisible(isVisible) {
            passwordInput.type = isVisible ? 'text' : 'password';
            bambooImage.setAttribute('src', isVisible ? openImage : closedImage);
            toggleButton.setAttribute('aria-pressed', String(isVisible));
            toggleButton.setAttribute('aria-label', isVisible ? 'Ukryj haslo' : 'Pokaz haslo');
        }

        toggleButton.addEventListener('click', function () {
            var nextVisible = passwordInput.type === 'password';
            setVisible(nextVisible);
        });

        setVisible(false);
    }

    function setupCustomerRegister() {
        var form = document.getElementById('customerRegisterForm');
        if (!form) {
            return;
        }

        var roleButtons = Array.prototype.slice.call(document.querySelectorAll('[data-register-role]'));
        var registerRoleInput = form.elements.registerRole;

        roleButtons.forEach(function (button) {
            button.addEventListener('click', function () {
                var nextRole = (button.getAttribute('data-register-role') || 'customer').trim();
                if (registerRoleInput) {
                    registerRoleInput.value = nextRole;
                }

                roleButtons.forEach(function (item) {
                    var isActive = item === button;
                    item.classList.toggle('is-active', isActive);
                    item.setAttribute('aria-pressed', String(isActive));
                });
            });
        });

        form.addEventListener('submit', function (event) {
            event.preventDefault();

            var selectedRole = (registerRoleInput && registerRoleInput.value ? registerRoleInput.value : 'customer').trim();
            var firstName = (form.elements.firstName.value || '').trim();
            var lastName = (form.elements.lastName.value || '').trim();
            var email = (form.elements.email.value || '').trim();
            var phone = (form.elements.phone.value || '').trim();
            var password = form.elements.password.value || '';
            var passwordConfirm = form.elements.passwordConfirm.value || '';
            var acceptedTerms = Boolean(!form.elements.acceptTerms || form.elements.acceptTerms.checked);

            if (selectedRole === 'seller') {
                window.location.href = 'rejestracja-sprzedawcy.html?email=' + encodeURIComponent(email);
                return;
            }

            if (!firstName || !lastName || !email || !phone || !password || !passwordConfirm) {
                showMessage('Wypelnij wszystkie wymagane pola.');
                return;
            }

            if (!validEmail(email)) {
                showMessage('Podaj poprawny adres e-mail.');
                return;
            }

            if (password.length < 6) {
                showMessage('Haslo musi miec co najmniej 6 znakow.');
                return;
            }

            if (password !== passwordConfirm) {
                showMessage('Hasla nie sa identyczne.');
                return;
            }

            if (!acceptedTerms) {
                showMessage('Zaakceptuj regulamin, aby kontynuowac.');
                return;
            }

            var users = readUsers();
            if (findByEmail(users.sellers, email)) {
                showMessage('Ten e-mail jest juz przypisany do konta sprzedawcy.');
                return;
            }

            upsertByEmail(users.customers, {
                firstName: firstName,
                lastName: lastName,
                email: email,
                phone: phone,
                password: password
            });
            writeUsers(users);

            setSession({
                role: 'customer',
                email: email,
                remember: true,
                sellerName: ''
            });

            window.location.href = 'profil.html';
        });
    }

    function setupSellerRegister() {
        var form = document.getElementById('sellerRegisterForm');
        if (!form) {
            return;
        }

        form.addEventListener('submit', function (event) {
            event.preventDefault();

            var companyName = (form.elements.companyName.value || '').trim();
            var ownerName = (form.elements.ownerName.value || '').trim();
            var ownerFirstName = (form.elements.ownerFirstName ? form.elements.ownerFirstName.value : '').trim();
            var ownerLastName = (form.elements.ownerLastName ? form.elements.ownerLastName.value : '').trim();
            var email = (form.elements.email.value || '').trim();
            var phone = (form.elements.phone.value || '').trim();
            var nip = (form.elements.nip ? form.elements.nip.value : '0000000000').trim();
            var category = (form.elements.category ? form.elements.category.value : 'przetwory').trim();
            var password = form.elements.password.value || '';
            var passwordConfirm = form.elements.passwordConfirm.value || '';
            var acceptedTerms = Boolean(!form.elements.acceptTerms || form.elements.acceptTerms.checked);

            if (!ownerName) {
                ownerName = (ownerFirstName + ' ' + ownerLastName).trim();
            }

            if (!companyName || !ownerName || !email || !phone || !nip || !category || !password || !passwordConfirm) {
                showMessage('Wypelnij wszystkie wymagane pola.');
                return;
            }

            if (!validEmail(email)) {
                showMessage('Podaj poprawny adres e-mail.');
                return;
            }

            if (!validNip(nip)) {
                showMessage('NIP powinien zawierac 10 cyfr.');
                return;
            }

            if (password.length < 8) {
                showMessage('Haslo sprzedawcy musi miec co najmniej 8 znakow.');
                return;
            }

            if (password !== passwordConfirm) {
                showMessage('Hasla nie sa identyczne.');
                return;
            }

            if (!acceptedTerms) {
                showMessage('Zaakceptuj regulamin, aby kontynuowac.');
                return;
            }

            var users = readUsers();
            if (findByEmail(users.customers, email)) {
                showMessage('Ten e-mail jest juz przypisany do konta klienta.');
                return;
            }

            upsertByEmail(users.sellers, {
                companyName: companyName,
                ownerName: ownerName,
                email: email,
                phone: phone,
                nip: nip.replace(/\s+/g, ''),
                category: category,
                password: password
            });
            writeUsers(users);

            setSession({
                role: 'seller',
                email: email,
                remember: true,
                sellerName: companyName
            });

            window.location.href = 'seller-contract.html?email=' + encodeURIComponent(email);
        });
    }

    setupLoginPasswordToggle();
    setupLogin();
    setupCustomerRegister();
    setupSellerRegister();
})();
