(function () {
    var STORAGE_KEY = 'srp-favorites';

    function safeParse(value) {
        try {
            var parsed = JSON.parse(value || '[]');
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            return [];
        }
    }

    function read() {
        try {
            return safeParse(window.localStorage.getItem(STORAGE_KEY));
        } catch (error) {
            return [];
        }
    }

    function write(items) {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch (error) {
            return;
        }
    }

    function exists(id) {
        return read().some(function (item) {
            return item.id === id;
        });
    }

    function add(item) {
        var items = read();
        var nextItems = items.filter(function (entry) {
            return entry.id !== item.id;
        });

        nextItems.push(item);
        write(nextItems);
        return nextItems;
    }

    function remove(id) {
        var nextItems = read().filter(function (item) {
            return item.id !== id;
        });

        write(nextItems);
        return nextItems;
    }

    window.favoriteStore = {
        key: STORAGE_KEY,
        read: read,
        write: write,
        exists: exists,
        add: add,
        remove: remove
    };
})();
