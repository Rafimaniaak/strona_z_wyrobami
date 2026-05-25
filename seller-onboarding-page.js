(function () {
    var body = document.body;
    var DEFAULT_EMAIL = 'gag_2020@mail.com';

    if (!body) {
        return;
    }

    function resolveEmail() {
        var params = new URLSearchParams(window.location.search);
        var queryEmail = (params.get('email') || '').trim();

        if (queryEmail) {
            return queryEmail;
        }

        return DEFAULT_EMAIL;
    }

    function hydrateEmail(email) {
        Array.prototype.slice.call(document.querySelectorAll('[data-seller-email]')).forEach(function (node) {
            node.textContent = email;
        });
    }

    function setupContractForm(email) {
        var form = document.getElementById('sellerContractForm');
        var signatureInput = document.getElementById('sellerSignature');
        var acceptInput = document.getElementById('sellerRegulations');
        var submitButton = document.getElementById('sellerSubmitButton');

        if (!form || !signatureInput || !acceptInput || !submitButton) {
            return;
        }

        function syncSubmitState() {
            var hasSignature = signatureInput.value.trim() !== '';
            submitButton.disabled = !(hasSignature && acceptInput.checked);
        }

        signatureInput.addEventListener('input', syncSubmitState);
        acceptInput.addEventListener('change', syncSubmitState);

        form.addEventListener('submit', function (event) {
            event.preventDefault();
            window.location.href = 'seller-awaiting.html?email=' + encodeURIComponent(email);
        });

        syncSubmitState();
    }

    var email = resolveEmail();
    hydrateEmail(email);
    setupContractForm(email);
})();
