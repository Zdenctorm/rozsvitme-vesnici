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

Druhé kolo podle majitele: skutečná mapa jako noční Apple Mapy, ne ilustrace. Domy stojí ve 3D, dnešní domeček svítí teple a kolem sebe rozlévá světlo na zem i na zdi sousedů. Při oddálení mapa plynule přejde na celé Česko, kde zbydou jen světla kalendářů a jemné hranice krajů, sousední státy zhasnou. Ovládání je jako v telefonu: hledání nahoře, spodní panel s rozmazaným pozadím, velké tlačítko Navigovat s výběrem Mapy.com, Google nebo Apple. Písmo Geist.

Je to živý prototyp, ne obrázek: `npx vite`, pak `/design/directions/d-3d/index.html?scene=republika`. Scény jsou republika, vesnice, karta, navigovat, pred a let. Snímky a video vyrobí `node design/directions/d-3d/render.mjs`. Rádlo je v prototypu posunuté do skutečného středu vesnice a dnešní domeček sedí na střeše nejbližšího domu, protože body ve fixtures jsou vymyšlené.
