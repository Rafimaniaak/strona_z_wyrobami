(function () {
    var filterButtons = Array.prototype.slice.call(document.querySelectorAll('.orders-filter-button'));
    var views = Array.prototype.slice.call(document.querySelectorAll('.order-view'));
    var switchButtons = Array.prototype.slice.call(document.querySelectorAll('[data-switch-view]'));
    var stars = Array.prototype.slice.call(document.querySelectorAll('.order-star'));
    var scoreNode = document.querySelector('.order-review-score');
    var reviewForm = document.querySelector('.order-review-panel');

    function formatRatingLabel(rating) {
        if (rating === 1) {
            return 'gwiazda';
        }

        if (rating < 5) {
            return 'gwiazdy';
        }

        return 'gwiazdek';
    }

    function activateView(viewName) {
        filterButtons.forEach(function (button) {
            var isActive = button.dataset.view === viewName;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-pressed', String(isActive));
        });

        views.forEach(function (view) {
            view.classList.toggle('is-active', view.dataset.view === viewName);
        });
    }

    filterButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            activateView(button.dataset.view);
        });
    });

    switchButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            activateView(button.dataset.switchView);
        });
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
})();
