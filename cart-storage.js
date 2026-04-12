(function () {
    var STORAGE_KEY = 'srp-cart';

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

    function count() {
        return read().reduce(function (sum, item) {
            return sum + Number(item.quantity || 0);
        }, 0);
    }

    function add(item) {
        var items = read();
        var existing = items.find(function (entry) {
            return entry.id === item.id;
        });

        if (existing) {
            existing.quantity = Number(existing.quantity || 1) + Number(item.quantity || 1);
        } else {
            items.push(Object.assign({ quantity: 1 }, item));
        }

        write(items);
        return items;
    }

    function updateQuantity(id, quantity) {
        var nextQuantity = Math.max(1, Number(quantity || 1));
        var items = read().map(function (item) {
            if (item.id === id) {
                return Object.assign({}, item, { quantity: nextQuantity });
            }

            return item;
        });

        write(items);
        return items;
    }

    function remove(id) {
        var items = read().filter(function (item) {
            return item.id !== id;
        });

        write(items);
        return items;
    }

    function clear(ids) {
        var list = Array.isArray(ids) ? ids : [];

        if (list.length === 0) {
            write([]);
            return [];
        }

        var items = read().filter(function (item) {
            return list.indexOf(item.id) === -1;
        });

        write(items);
        return items;
    }

    window.cartStore = {
        key: STORAGE_KEY,
        read: read,
        write: write,
        count: count,
        add: add,
        updateQuantity: updateQuantity,
        remove: remove,
        clear: clear
    };
})();
