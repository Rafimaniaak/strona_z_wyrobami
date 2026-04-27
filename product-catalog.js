(function () {
    function normalize(text) {
        return (text || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    function slugify(text) {
        return normalize(text)
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    function titleCaseCategory(category) {
        var labels = {
            sery: 'Sery regionalne',
            nalewki: 'Nalewki rzemieslnicze',
            przetwory: 'Przetwory domowe',
            wedliny: 'Wedliny tradycyjne',
            miody: 'Miody naturalne',
            rekodzielo: 'Rekodzielo lokalne',
            home: 'Produkt regionalny'
        };

        return labels[category] || 'Produkt regionalny';
    }

    function parsePrice(value) {
        var match = String(value || '').replace(',', '.').match(/[\d.]+/);
        return match ? Number(match[0]) : 0;
    }

    function formatPrice(value) {
        return parsePrice(value).toFixed(2);
    }

    function capitalize(text) {
        return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
    }

    function cloneList(items) {
        return (items || []).map(function (item) {
            return typeof item === 'object' ? Object.assign({}, item) : item;
        });
    }

    var sellerProfiles = {
        'Siostra Anastazja': {
            region: 'Podhale',
            shipping: 'wysylka do 48h',
            badge: 'Male partie',
            lead: 'Tworzy niewielkie serie przetworow wedlug sprawdzonych, domowych receptur bez zbednych dodatkow.',
            about: 'Rodzinna pracownia znana z tradycyjnych receptur i spokojnego, bardzo starannego procesu przygotowania kazdej partii.',
            reviews: [
                { author: 'Magda', rating: '5.0', text: 'Kontakt ze sprzedawca byl bardzo sprawny, a sloiki dotarly dobrze zabezpieczone i swietnie opisane.' },
                { author: 'Julia', rating: '4.9', text: 'Widac rzemieslnicza jakosc i konsekwencje w smaku. Zamowienie bylo przygotowane z duza dbaloscia.' },
                { author: 'Pawel', rating: '5.0', text: 'Bardzo dobry produkt, szybka realizacja i uczciwy opis. Wroce po kolejne smaki.' }
            ]
        },
        'Babcia Kasia': {
            region: 'Mazowsze',
            shipping: 'wysylka do 48h',
            badge: 'Domowa kuchnia',
            lead: 'Przygotowuje warzywne i owocowe klasyki o prostym skladzie oraz wyraznym, domowym smaku.',
            about: 'Marka oparta na sezonowych recepturach i krotkich seriach, nastawiona na tradycyjne skladniki i naturalny smak.',
            reviews: [
                { author: 'Alicja', rating: '4.9', text: 'Bardzo dobry sklad i smak jak z domowej spizarni. Produkty przyszly swieze i dobrze zapakowane.' },
                { author: 'Michal', rating: '4.8', text: 'Plus za konsekwentna jakosc i szybka wysylke. Dobrze opisane produkty i brak rozczarowan.' },
                { author: 'Karolina', rating: '5.0', text: 'Kupuje regularnie. Smak, kolor i konsystencja sa bardzo rowne miedzy kolejnymi zamowieniami.' }
            ]
        },
        Velvet: {
            region: 'Dolny Slask',
            shipping: 'wysylka do 24h',
            badge: 'Staranna selekcja',
            lead: 'Stawia na czysty sklad, estetyczne przygotowanie i lagodny profil smakowy, ktory latwo laczy sie z codzienna kuchnia.',
            about: 'Nowoczesny, ale mocno lokalny producent, ktory laczy tradycyjne receptury z rowna, przewidywalna jakoscia.',
            reviews: [
                { author: 'Marta', rating: '4.8', text: 'Bardzo estetycznie zapakowane i zgodne z opisem. Smak delikatny, ale nadal bardzo naturalny.' },
                { author: 'Tomasz', rating: '4.9', text: 'Szybka dostawa i porzadna obsluga. Produkt dobrze sprawdzil sie jako prezent.' },
                { author: 'Ola', rating: '4.8', text: 'Dobry balans slodyczy i bardzo przyjemna konsystencja. Zamowienie dotarlo bez problemow.' }
            ]
        },
        Kasia: {
            region: 'Lubelszczyzna',
            shipping: 'wysylka do 48h',
            badge: 'Sezonowe smaki',
            lead: 'Przygotowuje krotkie serie owocowych przetworow z naciskiem na prosty sklad i wyrazny smak.',
            about: 'Niewielka, lokalna marka bazujaca na sezonowych partiach i recznej obrobce surowca.',
            reviews: [
                { author: 'Aneta', rating: '4.8', text: 'Bardzo udane smaki i dobry stosunek ceny do jakosci. Wysylka przebiegla bez opoznien.' },
                { author: 'Roman', rating: '4.7', text: 'Czuc naturalny owoc i brak przesadnej slodyczy. Dobrze dopracowany produkt.' },
                { author: 'Basia', rating: '4.9', text: 'Kupowalam juz kilka razy i jakosc jest rowna. Wszystko dobrze zabezpieczone.' }
            ]
        },
        'Ekologiczny Sklep': {
            region: 'Warmia',
            shipping: 'wysylka do 48h',
            badge: 'Wybor naturalny',
            lead: 'Oferta skupia sie na prostych skladach, czytelnych recepturach i spokojnym, naturalnym profilu smakowym.',
            about: 'Sklep dobierajacy produkty pod katem skladu i powtarzalnej jakosci, z naciskiem na solidne pakowanie.',
            reviews: [
                { author: 'Joanna', rating: '4.8', text: 'Dobra komunikacja i uczciwy opis. Produkt spelnil oczekiwania, a opakowanie bylo bardzo solidne.' },
                { author: 'Piotr', rating: '4.7', text: 'Naturalny smak i dobra swiezosc. Zamowienie dotarlo szybko i bez uszkodzen.' },
                { author: 'Lena', rating: '4.8', text: 'Bardzo sensowna jakosc, wszystko czytelnie oznaczone. Chetnie zamowie ponownie.' }
            ]
        },
        'Jakiś sprzedawca': {
            region: 'Polska lokalna',
            shipping: 'wysylka do 72h',
            badge: 'Maly producent',
            lead: 'Niewielki producent regionalny, ktory stawia na prosty sklad i rzemieslnicze przygotowanie produktu.',
            about: 'Sprzedawca prowadzi kameralna oferte i skupia sie na naturalnym smaku oraz bezpiecznym pakowaniu zamowien.',
            reviews: [
                { author: 'Natalia', rating: '4.7', text: 'Smak bardzo przyjemny, a realizacja zamowienia przebiegla bez komplikacji.' },
                { author: 'Grzegorz', rating: '4.6', text: 'Dobra relacja ceny do jakosci. Wszystko przyszlo odpowiednio zabezpieczone.' },
                { author: 'Ewa', rating: '4.8', text: 'Produkt zgodny z opisem, z wyraznym lokalnym charakterem. Chce sprobowac kolejnych wariantow.' }
            ]
        },
        'Miody Napekowskie': {
            region: 'Beskid Niski',
            shipping: 'wysylka do 24h',
            badge: 'Pasieka rodzinna',
            lead: 'Rodzinna pasieka oferujaca miody o czystym skladzie i bardzo klarownym profilu smakowym.',
            about: 'Pasieka prowadzona w niewielkiej skali, z naciskiem na pochodzenie surowca i dobrze zabezpieczony transport.',
            reviews: [
                { author: 'Malgorzata', rating: '5.0', text: 'Miod ma piekny aromat i bardzo dobry kolor. Sloik dotarl perfekcyjnie zapakowany.' },
                { author: 'Kacper', rating: '4.9', text: 'Naturalny smak i dobra gestosc. Wysylka ekspresowa i bezpieczna.' },
                { author: 'Ilona', rating: '4.9', text: 'Bardzo uczciwy produkt, bez rozczarowan. Widac, ze to pasieka z doswiadczeniem.' }
            ]
        },
        'Wcinaj miod': {
            region: 'Podlasie',
            shipping: 'wysylka do 24h',
            badge: 'Slodki klasyk',
            lead: 'Producent skupiony na miodach codziennych, latwych do laczenia z pieczywem, deserami i herbata.',
            about: 'Lokalna marka oferujaca miody o stabilnej jakosci, z bardzo sprawna obsluga i szybka realizacja.',
            reviews: [
                { author: 'Laura', rating: '4.8', text: 'Miod bardzo dobry w smaku, przyjemnie gesty i bez obcych posmakow.' },
                { author: 'Norbert', rating: '4.8', text: 'Sprawna obsluga i sensowna cena. Zamowienie dotarlo nastepnego dnia.' },
                { author: 'Emilia', rating: '4.9', text: 'Dobry, codzienny miod. Bardzo przyjemny aromat i dobrze zabezpieczony sloik.' }
            ]
        },
        'Swojskie Wędliny': {
            region: 'Slask',
            shipping: 'wysylka chlodnicza 24h',
            badge: 'Tradycyjne wedzenie',
            lead: 'Specjalizuje sie w klasycznych wedlinach o wyraznym aromacie, dopracowanej teksturze i rzetelnym porcjowaniu.',
            about: 'Producent z oferta wedzonek i kielbas przygotowywanych w krotkich seriach, z naciskiem na swiezosc i transport w odpowiednich warunkach.',
            reviews: [
                { author: 'Damian', rating: '4.9', text: 'Bardzo dobry aromat wedzenia i porzadne pakowanie prozniowe. Produkt przyjechal swiezy.' },
                { author: 'Sylwia', rating: '4.8', text: 'Wysoka jakosc i dobra komunikacja. Wszystko zgodne z opisem i terminem.' },
                { author: 'Marek', rating: '4.9', text: 'Wyrazny smak i dobra struktura miesa. Na pewno zamowie ponownie.' }
            ]
        },
        'U dziadka': {
            region: 'Malopolska',
            shipping: 'wysylka do 48h',
            badge: 'Warsztat lokalny',
            lead: 'Tworzy produkty z mocnym regionalnym charakterem i duzym naciskiem na tradycyjny wyglad oraz rzemioslo.',
            about: 'Kameralna marka skupiona na przedmiotach i produktach inspirowanych folklorem, z duza dbaloscia o detal.',
            reviews: [
                { author: 'Helena', rating: '4.8', text: 'Produkt wyglada bardzo dobrze na zywo i jest starannie wykonany.' },
                { author: 'Wojtek', rating: '4.7', text: 'Solidna jakosc i sprawna realizacja. Rzecz zgodna z opisem i zdjeciami.' },
                { author: 'Patrycja', rating: '4.9', text: 'Bardzo ladne wykonanie i lokalny charakter, ktory rzeczywiscie czuc w produkcie.' }
            ]
        },
        'Domowa Spiżarnia': {
            region: 'Podkarpacie',
            shipping: 'wysylka do 48h',
            badge: 'Rzemioslo kuchni',
            lead: 'Stawia na wyraziste receptury i krotkie serie przygotowywane z mysla o tradycyjnej, sycacej kuchni.',
            about: 'Producent laczacy domowy charakter produktow z bardzo dobra organizacja wysylki i powtarzalna jakoscia.',
            reviews: [
                { author: 'Rafal', rating: '4.8', text: 'Wyrazny smak i bardzo dobra jakosc skladnikow. Wszystko dobrze zabezpieczone.' },
                { author: 'Monika', rating: '4.9', text: 'Bardzo solidne wykonanie produktu i uczciwy opis. Zamowienie dotarlo szybko.' },
                { author: 'Kinga', rating: '4.8', text: 'Swietny smak i dobra porcja. Na plus kontakt oraz terminowosc wysylki.' }
            ]
        }
    };

    var categoryProfiles = {
        sery: {
            storage: 'najlepiej podawac schlodzone',
            package: 'porcja pakowana bezpiecznie do transportu',
            highlight: 'dobrze sprawdza sie na desce serow i na cieplo',
            specLabel: 'Charakter',
            specValue: 'regionalny wyrab mleczny o wyraznym aromacie',
            reviewLines: [
                'Smak jest wyrazny, ale dobrze zbalansowany i naturalny.',
                'Bardzo udana tekstura i dobra jakosc surowca.',
                'Produkt sprawdza sie zarowno solo, jak i jako dodatek do deski regionalnej.'
            ]
        },
        nalewki: {
            storage: 'serwowac schlodzone lub w temperaturze pokojowej',
            package: 'butelka zabezpieczona do wysylki kurierskiej',
            highlight: 'dobrze sprawdza sie jako prezent lub degustacja okazjonalna',
            specLabel: 'Profil smaku',
            specValue: 'intensywny aromat i rzemieslniczy charakter',
            reviewLines: [
                'Aromat jest bardzo przyjemny i nieprzesadzony.',
                'Produkt ma dopracowany balans i eleganckie wykonczenie.',
                'Butelka oraz prezentacja sa estetyczne, dobrze nadaja sie na upominek.'
            ]
        },
        przetwory: {
            storage: 'przechowywac w suchym miejscu, po otwarciu w lodowce',
            package: 'szklany sloik zabezpieczony do transportu',
            highlight: 'pasuje do pieczywa, serow, deserow i prostych sniadan',
            specLabel: 'Receptura',
            specValue: 'krotki sklad i smak zblizony do domowych przetworow',
            reviewLines: [
                'Smak jest naturalny i bardzo bliski domowym przetworom.',
                'Konsystencja dobrze trzyma poziom, nic nie jest przesadnie slodkie.',
                'To produkt, po ktory latwo siega sie na co dzien, nie tylko od swieta.'
            ]
        },
        wedliny: {
            storage: 'przechowywac w lodowce i podawac po krotkim ogrzaniu',
            package: 'pakowanie prozniowe do wysylki chlodniczej',
            highlight: 'sprawdza sie na desce wedlin, do kanapek i do kuchni domowej',
            specLabel: 'Obrobka',
            specValue: 'wyrazny aromat wedzenia i tradycyjna struktura',
            reviewLines: [
                'Dobry aromat i bardzo przyjemna tekstura miesa.',
                'Wyrab ma wyrazny charakter, ale nadal pozostaje uniwersalny w podaniu.',
                'To produkt, ktory dobrze wypada zarowno na co dzien, jak i na stol okolicznosciowy.'
            ]
        },
        miody: {
            storage: 'przechowywac w temperaturze pokojowej, z dala od slonca',
            package: 'szklany sloik z dodatkowym zabezpieczeniem',
            highlight: 'dobrze laczy sie z pieczywem, herbata i deserami',
            specLabel: 'Pochodzenie',
            specValue: 'miod naturalny z lokalnej pasieki',
            reviewLines: [
                'Miod ma ladny aromat i dobra, naturalna gestosc.',
                'Smak jest czysty i bardzo przyjemny na co dzien.',
                'To bezpieczny wybor dla osob, ktore szukaja prostego, dobrego produktu z pasieki.'
            ]
        },
        rekodzielo: {
            storage: 'produkt gotowy do ekspozycji lub codziennego uzytku',
            package: 'pakowanie ochronne pod wysylke kurierska',
            highlight: 'dobrze sprawdza sie jako prezent lub element wystroju',
            specLabel: 'Wykonanie',
            specValue: 'lokalne rzemioslo z widocznym detalem recznej pracy',
            reviewLines: [
                'Wykonanie robi bardzo dobre pierwsze wrazenie i dobrze wyglada na zywo.',
                'Produkt ma lokalny charakter i nie sprawia wrazenia masowego.',
                'To rzecz, ktora nadaje sie i do codziennego uzytku, i jako prezent.'
            ]
        },
        home: {
            storage: 'zgodnie z charakterem produktu',
            package: 'bezpieczne pakowanie kurierskie',
            highlight: 'regionalny wybor dobrze dopracowany wizualnie i smakowo',
            specLabel: 'Atut',
            specValue: 'lokalne pochodzenie i mala skala produkcji',
            reviewLines: [
                'Produkt jest zgodny z opisem i dobrze przygotowany do wysylki.',
                'Jakosc wypada bardzo rowno i nic nie jest przypadkowe.',
                'Dobry wybor dla osob, ktore szukaja czegos bardziej lokalnego niz marketowego.'
            ]
        }
    };

    function sellerProfile(name) {
        return sellerProfiles[name] || {
            region: 'Polska lokalna',
            shipping: 'wysylka do 48h',
            badge: 'Wybor lokalny',
            lead: 'Lokalny producent dbajacy o prosty sklad, rzetelny opis i bezpieczna wysylke.',
            about: 'Niewielki sprzedawca regionalny skupiony na jakosci produktu i spokojnej, sprawnej obsludze zamowienia.',
            reviews: [
                { author: 'Anna', rating: '4.8', text: 'Produkt zgodny z opisem, dobrze zapakowany i dostarczony bez opoznien.' },
                { author: 'Piotr', rating: '4.7', text: 'Udany zakup i dobra komunikacja ze sprzedawca. Wszystko przebieglo sprawnie.' },
                { author: 'Kasia', rating: '4.8', text: 'Bardzo sensowna jakosc i staranne wykonanie. Chetnie sprobuje kolejnych produktow.' }
            ]
        };
    }

    function categoryProfile(category) {
        return categoryProfiles[category] || categoryProfiles.home;
    }

    function buildId(product) {
        return product.id || (product.category || 'produkt') + '-' + slugify(product.name || 'produkt');
    }

    function buildQuery(product) {
        var params = new URLSearchParams();

        params.set('id', buildId(product));
        params.set('name', product.name || 'Produkt regionalny');
        params.set('seller', product.seller || '');
        params.set('price', formatPrice(product.price || 0));
        params.set('image', product.image || '');
        params.set('alt', product.alt || product.name || 'Produkt regionalny');
        params.set('category', product.category || 'home');
        params.set('rating', String(product.rating || '4.8'));

        return params.toString();
    }

    function reviewCards(product, seller, category) {
        var profile = sellerProfile(seller);
        var categoryInfo = categoryProfile(category);

        return categoryInfo.reviewLines.map(function (line, index) {
            return {
                author: profile.reviews[index] ? profile.reviews[index].author : 'Klient',
                rating: profile.reviews[index] ? profile.reviews[index].rating : '4.8',
                text: line.replace('Produkt', product.name || 'Produkt')
            };
        });
    }

    function averageRating(reviews, fallback) {
        var list = Array.isArray(reviews) ? reviews : [];

        if (list.length === 0) {
            return Number(fallback || 4.8).toFixed(1);
        }

        return (
            list.reduce(function (sum, review) {
                return sum + Number(review.rating || fallback || 4.8);
            }, 0) / list.length
        ).toFixed(1);
    }

    function sellerReviewPool(product, seller, category) {
        var profile = sellerProfile(seller);
        var categoryInfo = categoryProfile(category);
        var baseReviews = cloneList(profile.reviews);
        var fallbackAuthors = ['Natalia', 'Tomek', 'Marta', 'Hubert', 'Lena', 'Krzysztof', 'Ola', 'Adam'];
        var extras = [
            'Bardzo dobry kontakt ze sprzedawca i spokojna realizacja zamowienia. ' + (product.name || 'Produkt') + ' byl bardzo dobrze zabezpieczony do transportu.',
            'Jakosc po otwarciu dokladnie taka jak w opisie. Na plus wyrazny, lokalny charakter i rowny poziom kolejnych zamowien.',
            'Doceniam szybka wysylke oraz staranne pakowanie. Produkt sprawdzil sie dokladnie tak, jak oczekiwalem.',
            'Smak i wykonanie wypadaja bardzo uczciwie. Dobrze czuc, ze to nie jest przypadkowa, masowa oferta.',
            'Duzy plus za czytelny opis, bezpieczne pakowanie i dobra organizacje sprzedawcy z regionu ' + profile.region + '.',
            'To jeden z tych produktow, do ktorych latwo wrocic. Swietnie wypada zarowno na co dzien, jak i przy okazji prezentu.',
            'Najbardziej przekonuje mnie to, ze ' + (categoryInfo.highlight || 'produkt jest dopracowany') + '. Wszystko przyszlo na czas i bez uszkodzen.',
            'Kontakt po zakupie byl rzeczowy, a zamowienie przygotowano bardzo starannie. Wysylka dotarla w terminie bez zadnych niespodzianek.',
            'W kolejnych zamowieniach jakosc pozostaje rowna, co przy lokalnym producencie jest dla mnie bardzo duzym plusem.',
            'Na plus spokojna, przewidywalna obsluga oraz bardzo dobre zabezpieczenie sloikow do transportu.',
            'Opis produktu okazal sie uczciwy i zgodny z rzeczywistoscia. To jedna z tych ofert, do ktorych wraca sie bez wahania.'
        ];

        extras.forEach(function (text, index) {
            baseReviews.push({
                author: fallbackAuthors[index % fallbackAuthors.length],
                rating: (4.7 + (index % 4) * 0.1).toFixed(1),
                text: text
            });
        });

        return baseReviews;
    }

    function productReviewPool(product, seller, category) {
        var profile = sellerProfile(seller);
        var categoryInfo = categoryProfile(category);
        var microAuthors = ['Alicja', 'Michal', 'Karolina', 'Basia', 'Daniel', 'Iga', 'Piotr', 'Monika'];
        var phrases = [
            'Smak jest naturalny i bardzo rowny.',
            'Dobra konsystencja i przyjemny aromat po otwarciu.',
            'Produkt wyglada bardzo dobrze tez na zywo.',
            'Sprawdza sie na co dzien, nie tylko okazjonalnie.',
            'Bardzo udane polaczenie regionalnego charakteru i wygody zakupu online.',
            'Swietnie, ze ' + (categoryInfo.highlight || 'produkt zostal dobrze dopracowany') + '.',
            'W porownaniu z podobnymi produktami ten wypada bardziej naturalnie.',
            'Na plus takze szybka wysylka od ' + seller + '.'
        ];
        var coreReviews = reviewCards(product, seller, category);
        var list = [];
        var index;

        for (index = 0; index < 24; index += 1) {
            list.push({
                author: index < coreReviews.length ? coreReviews[index].author : microAuthors[index % microAuthors.length],
                rating: (4.7 + (index % 4) * 0.1).toFixed(1),
                text: index < coreReviews.length
                    ? coreReviews[index].text
                    : phrases[index % phrases.length] + ' ' + (index % 2 === 0
                        ? 'Kupilbym ponownie bez wiekszego zastanowienia.'
                        : 'To jedna z bardziej udanych pozycji w tej kategorii.')
            });
        }

        list[5].text = 'Bardzo przyjemny wybor od producenta z ' + profile.region + '. Czulam, ze kupuje cos dopracowanego, a nie przypadkowego.';
        list[9].text = 'Najbardziej podoba mi sie to, ze ' + (product.name || 'produkt') + ' zachowuje naturalny charakter i nie sprawia wrazenia masowego.';
        list[14].text = 'Po kilku zamowieniach dalej widac rowna jakosc, a pakowanie pozostaje bardzo staranne.';
        list[19].text = 'Dobry balans ceny do jakosci oraz szybka realizacja od ' + seller + '.';

        return list;
    }

    function productHighlights(product, seller, category) {
        var categoryInfo = categoryProfile(category);
        var profile = sellerProfile(seller);

        return [
            profile.badge,
            categoryInfo.highlight,
            'Region: ' + profile.region
        ];
    }

    function productSpecs(product, seller, category) {
        var categoryInfo = categoryProfile(category);
        var profile = sellerProfile(seller);

        return [
            { label: 'Kategoria', value: titleCaseCategory(category) },
            { label: categoryInfo.specLabel, value: categoryInfo.specValue },
            { label: 'Przechowywanie', value: categoryInfo.storage },
            { label: 'Pakowanie', value: categoryInfo.package },
            { label: 'Realizacja', value: profile.shipping }
        ];
    }

    function buildLead(product, seller, category) {
        var categoryName = titleCaseCategory(category).toLowerCase();
        return (product.name || 'Produkt regionalny') + ' to ' + categoryName + ' od ' + seller + ', przygotowany z naciskiem na prosty sklad, lokalne pochodzenie i spokojny, dopracowany smak lub wykonanie.';
    }

    function buildDescription(product, seller, category) {
        var profile = sellerProfile(seller);
        var categoryInfo = categoryProfile(category);

        return profile.lead + ' Produkt dobrze sprawdza sie jako codzienny wybor lub prezent, a dzieki temu, ze jest przygotowywany w mniejszych partiach, zachowuje bardziej regionalny charakter. Dodatkowy atut to ' + categoryInfo.highlight + '.';
    }

    function enrichProduct(input) {
        var base = Object.assign({}, input || {});
        var seller = base.seller || 'Lokalny sprzedawca';
        var category = base.category || 'home';
        var profile = sellerProfile(seller);
        var rating = Number(base.rating || 4.8).toFixed(1);

        base.id = buildId(base);
        base.name = base.name || 'Produkt regionalny';
        base.alt = base.alt || base.name;
        base.price = formatPrice(base.price || 0);
        base.seller = seller;
        base.category = category;
        base.rating = rating;
        base.categoryLabel = titleCaseCategory(category);
        base.region = profile.region;
        base.shipping = profile.shipping;
        base.badge = profile.badge;
        base.lead = base.lead || buildLead(base, seller, category);
        base.description = base.description || buildDescription(base, seller, category);
        base.aboutSeller = base.aboutSeller || profile.about;
        base.highlights = cloneList(base.highlights && base.highlights.length ? base.highlights : productHighlights(base, seller, category));
        base.specs = cloneList(base.specs && base.specs.length ? base.specs : productSpecs(base, seller, category));
        base.sellerReviews = cloneList(base.sellerReviews && base.sellerReviews.length ? base.sellerReviews : sellerReviewPool(base, seller, category));
        base.productReviews = cloneList(base.productReviews && base.productReviews.length ? base.productReviews : productReviewPool(base, seller, category));
        base.averageRating = base.averageRating || averageRating(base.sellerReviews.concat(base.productReviews), rating);
        base.reviewCount = base.reviewCount || '240';
        base.detailHref = 'produkt.html?' + buildQuery(base);

        return base;
    }

    function fromQuery(search) {
        var params = new URLSearchParams(search || window.location.search);

        return enrichProduct({
            id: params.get('id') || '',
            name: params.get('name') || '',
            seller: params.get('seller') || '',
            price: params.get('price') || '',
            image: params.get('image') || '',
            alt: params.get('alt') || '',
            category: params.get('category') || '',
            rating: params.get('rating') || ''
        });
    }

    window.productCatalog = {
        normalize: normalize,
        slugify: slugify,
        enrichProduct: enrichProduct,
        fromQuery: fromQuery,
        buildDetailHref: function (product) {
            return enrichProduct(product).detailHref;
        },
        sellerProfile: sellerProfile,
        categoryProfile: categoryProfile,
        capitalize: capitalize
    };
})();
