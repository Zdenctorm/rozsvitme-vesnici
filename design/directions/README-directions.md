# Tři vizuální směry pro Adventní okénka

Ke každému směru jsou v jeho složce čtyři obrazovky na šířku 390 px a karta na razítka A5 barevně i černobíle. Rádlo, Strážnice, Rouchovany a domečky v nich jsou ukázková data, ne skuteční účastníci. Ulice Rádla jsou z OpenStreetMap, hranice krajů z RÚIAN.

## A. Dřevoryt

Noc jako vyřezaný dřevěný štoček, světla jako druhá, žlutá barva tisku.
Mapa je černá deska, ulice a hranice jsou do ní vyryté rydlem a okénko svítí paprsky, jaké nechává dláto. Karta domečku je otisk na papíře a karta na razítka je jeden velký dům s 24 okny. Písmo Grenze a Alegreya Sans.

## B. Papírový betlém

Mapa složená z vystřižených papírů v tmavé krabici, světlo prosvítá jen otvory.
Kalendáře v republice jsou propíchnuté dírky, kolik oken už svítilo, tolik dírek. Dnešní domeček se z mapy zvedne jako vystřihovánka s rozsvíceným oknem a panel dole má okraj ze střech vesnice. Na kartě na razítka má každý z 24 hostitelů vlastní domek. Písmo Young Serif a Albert Sans.

## C. Atlas noci

Česko jako hvězdná mapa, každý kalendář je hvězda a vesnice je souhvězdí, které každý večer přibývá.
Velikost hvězdy říká, kolik oken už v obci svítilo. V okolí čára spojuje domečky po dnech až k dnešnímu a kruhy kolem vás ukazují vzdálenost. Karta na razítka vypadá jako list z atlasu se zeměpisnou polohou obce. Písmo EB Garamond a Jost.

## D. Noční mapa ve 3D

Druhé kolo podle majitele: skutečná mapa jako noční Apple Mapy, ne ilustrace. Majitel ho 13. listopadu 2026 vybral, směry A, B a C odmítl jako příliš ilustrativní. Závazný popis je v `DESIGN.md` v kořeni repa.

Mapa se otevře tam, kde člověk stojí. Když do tří a půl vteřiny přijde poloha a do šesti kilometrů dnes něco svítí, ukáže okolí ve 3D. Když je nejbližší světlo dál, oddálí se k němu a napíše třeba „Nejblíž svítí Rádlo, 162 km“. Bez polohy zůstane celé Česko. Oddalovat jde plynule přes kraj a Česko až na Evropu a celou zeměkouli, kde svítí jen naše okénka.

Přes den je mapa světlá a zimní a dnešní domeček má klidné kulaté světélko s číslem dne v teplém kroužku. Se západem slunce v Praze mapa sama potemní, světélko se rozzáří a okno se rozsvítí. Uplynulé dny jsou malá tlumená světélka. Kolikátý je den, ukazuje řada 24 kroužků v panelu, ne věta. Dvířka majitel 13. listopadu 2026 zamítl. Časy rozsvícení se nikde neukazují. Písmo Bricolage Grotesque na nadpisy a čísla, Instrument Sans na text.

Je to živý prototyp: `npx vite`, pak `/design/directions/d-3d/index.html`. Bez parametru se zeptá na polohu. Pevné scény přes `?scene=` jsou republika, vesnice, karta, navigovat, pred, evropa, zeme, den, den-republika, znacka, let a soumrak. Snímky a obě videa vyrobí `node design/directions/d-3d/render.mjs`. Rádlo je v prototypu posunuté do skutečného středu vesnice a domečky sedí na střeše nejbližšího domu, protože body ve fixtures jsou vymyšlené.
