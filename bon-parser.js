/* Bugetul Meu V29 · cititor bon fiscal (text OCR -> produse, total, magazin, plată) + încadrare. */
/* parser.js — citire bon fiscal românesc din textul OCR + încadrare pe categorii.
   Fără dependențe. În browser: window.BonParser. În Node: module.exports. */
(function (root) {
  'use strict';

  // ---------- Categorii implicite (se pot lega de categoriile din Bugetul Meu) ----------
  var CATEGORII = [
    { id: 'alimente',  nume: 'Alimente',            icon: '🛒' },
    { id: 'bauturi',   nume: 'Băuturi',             icon: '🥤' },
    { id: 'casa',      nume: 'Casă & curățenie',    icon: '🧽' },
    { id: 'igiena',    nume: 'Igienă & cosmetice',  icon: '🧴' },
    { id: 'sanatate',  nume: 'Sănătate',            icon: '💊' },
    { id: 'masina',    nume: 'Mașină & carburant',  icon: '⛽' },
    { id: 'restaurant',nume: 'Restaurant & cafea',  icon: '☕' },
    { id: 'haine',     nume: 'Haine & încălțăminte',icon: '👕' },
    { id: 'animale',   nume: 'Animale',             icon: '🐾' },
    { id: 'electronice',nume:'Electronice',         icon: '🔌' },
    { id: 'tutun',     nume: 'Tutun',               icon: '🚬' },
    { id: 'altele',    nume: 'Altele',              icon: '📦' }
  ];

  // Cuvinte cheie (fără diacritice, cu majuscule). Ordinea contează doar la egalitate.
  var CUVINTE = {
    bauturi: ['APA ', 'APA MINERALA', 'APA PLATA', 'BORSEC', 'DORNA', 'AQUA CARPATICA', 'BUCOVINA', 'IZVORUL',
      'COCA', 'PEPSI', 'FANTA', 'SPRITE', 'SCHWEPPES', 'CICO', 'PRIGAT', 'CAPPY', 'TEDI', 'SUC', 'NECTAR', 'LIMONADA',
      'RED BULL', 'BURN', 'HELL', 'MONSTER', 'BERE', 'URSUS', 'TIMISOREANA', 'BERGENBIER', 'SKOL', 'CIUC', 'HEINEKEN',
      'TUBORG', 'STELLA', 'NEUMARKT', 'SAUVIGNON', 'MERLOT', 'CABERNET', 'CHARDONNAY', 'RIESLING', 'FETEASCA', 'PINOT',
      'TAMAIOASA', 'BLANC', 'DEMISEC', 'DEMIDULCE', 'BUSUIOACA', 'SHIRAZ', 'MUSCAT', 'VIN ROSE', 'CIUCA', 'BUCEGI', 'GOSSER', 'PERONI', 'BECKS', 'KOZEL', 'SILVA', 'CARLSBERG', 'VIN ', 'VIN ALB', 'VIN ROSU', 'SAMPANIE', 'PROSECCO',
      'VODKA', 'WHISKY', 'COGNAC', 'TUICA', 'PALINCA', 'LICHIOR', 'ICE TEA', 'NESTEA', 'FUZETEA', 'KOMBUCHA'],
    alimente: ['LAPTE', 'IAURT', 'BRANZA', 'TELEMEA', 'CASCAVAL', 'SMANTANA', 'UNT ', 'UNT', 'OUA', 'OU ', 'PAINE', 'FRANZELA',
      'CHIFLA', 'BAGHETA', 'LIPIE', 'CROISSANT', 'COZONAC', 'FAINA', 'MALAI', 'OREZ', 'PASTE', 'SPAGHETE', 'MACAROANE',
      'ZAHAR', 'SARE', 'ULEI', 'OTET', 'MUSTAR', 'MAIONEZA', 'KETCHUP', 'BULION', 'PASTA TOMATE', 'CONSERVA', 'TON ',
      'PUI', 'PIEPT', 'PULPE', 'ARIPI', 'CARNE', 'PORC', 'VITA', 'CEAFA', 'COTLET', 'MUSCHI', 'TOCATURA', 'MICI', 'CARNATI',
      'CRENVURSTI', 'SALAM', 'SUNCA', 'PARIZER', 'BACON', 'PASTRAMA', 'SLANINA', 'PATE', 'PESTE', 'SOMON', 'MACROU',
      'HERING', 'CARTOFI', 'CEAPA', 'USTUROI', 'ROSII', 'TOMATE', 'CASTRAVETI', 'ARDEI', 'VARZA', 'MORCOV', 'TELINA',
      'PATRUNJEL', 'MARAR', 'SALATA', 'SPANAC', 'DOVLECEI', 'VINETE', 'CIUPERCI', 'FASOLE', 'MAZARE', 'PORUMB', 'LINTE',
      'BANANE', 'MERE', 'PERE', 'PORTOCALE', 'MANDARINE', 'CLEMENTINE', 'LAMAI', 'GRAPEFRUIT', 'KIWI', 'STRUGURI',
      'CAPSUNI', 'PEPENE', 'PIERSICI', 'CAISE', 'PRUNE', 'CIRESE', 'AVOCADO', 'ANANAS', 'FRUCTE', 'LEGUME', 'NUCI',
      'ALUNE', 'MIGDALE', 'SEMINTE', 'STAFIDE', 'CIOCOLATA', 'BISCUITI', 'NAPOLITANE', 'CHIPS', 'CHIPSURI', 'SNACK',
      'COVRIGI', 'PRAJITURA', 'TORT', 'INGHETATA', 'BOMBOANE', 'GUMA', 'CAFEA', 'NESCAFE', 'JACOBS', 'DOUWE', 'LAVAZZA',
      'CEAI', 'CACAO', 'MIERE', 'GEM', 'DULCEATA', 'CEREALE', 'FULGI', 'OVAZ', 'MUSLI', 'MUESLI', 'DROJDIE', 'CONDIMENT',
      'PIPER', 'BOIA', 'VEGETA', 'MARGARINA', 'HUMMUS', 'PIZZA', 'SARMALE', 'SUPA', 'CIORBA', 'IAHNIE', 'ZACUSCA',
      'MURATURI', 'MASLINE', 'KEFIR', 'SANA', 'ZUZU', 'NAPOCA', 'DANONE', 'OLYMPUS', 'MILKA', 'ROM ', 'POIANA', 'KINDER',
      'OREO', 'LAYS', 'PRINGLES', 'BARILLA', 'TOP NOTCH'],
    casa: ['DETERGENT', 'ARIEL', 'PERSIL', 'TIDE', 'DERO', 'BONUX', 'BALSAM RUFE', 'LENOR', 'COCCOLINO', 'SILAN', 'VANISH',
      'CLOR', 'DOMESTOS', 'BIOCLOR', 'CIF', 'MR PROPER', 'MR. PROPER', 'FAIRY', 'PUR ', 'JAR ', 'BURETI', 'LAVETE',
      'SACOSA', 'SACOSE', 'PROSOP HARTIE', 'PROSOAPE', 'SERVETELE', 'HARTIE IGIENICA', 'SACI MENAJERI', 'SACI', 'PUNGA', 'PUNGI', 'FOLIE',
      'ALUMINIU', 'BECURI', 'BEC ', 'BATERII', 'LUMANARI', 'ODORIZANT', 'AMBI PUR', 'GLADE', 'INSECTICID', 'TABLETE MASINA',
      'FINISH', 'CALGON', 'SARE MASINA', 'MATURA', 'MOP', 'GALEATA', 'SPRAY GEAM', 'WC ', 'FARFURII', 'PAHARE', 'TIGAIE',
      'OALA', 'CUTITE'],
    igiena: ['SAMPON', 'SHAMPOO', 'GEL DUS', 'GEL DE DUS', 'SAPUN', 'PASTA DINTI', 'PASTA DE DINTI', 'COLGATE', 'SENSODYNE',
      'PERIUTA', 'APA DE GURA', 'DEODORANT', 'ANTIPERSPIRANT', 'NIVEA', 'DOVE', 'REXONA', 'GILLETTE', 'LAME', 'APARAT RAS',
      'SPUMA RAS', 'CREMA', 'LOTIUNE', 'BALSAM PAR', 'VOPSEA PAR', 'SCUTECE', 'PAMPERS', 'SERVETELE UMEDE', 'ABSORBANTE',
      'TAMPOANE', 'BETISOARE', 'DISCHETE', 'PARFUM', 'FARMEC', 'GEROVITAL', 'HEAD SHOULDERS', 'PANTENE', 'GARNIER', 'LOREAL'],
    sanatate: ['PARACETAMOL', 'IBUPROFEN', 'NUROFEN', 'ASPIRINA', 'ASPENTER', 'ALGOCALMIN', 'NO-SPA', 'NOSPA', 'VITAMINA',
      'VITAMINE', 'MAGNEZIU', 'CALCIU', 'OMEGA', 'SIROP', 'PICATURI', 'UNGUENT', 'PLASTURE', 'BANDAJ', 'TERMOMETRU',
      'TENSIOMETRU', 'COMPRIMATE', 'CPR', 'CAPSULE', 'CPS', 'TABLETE', 'FARMACIE', 'TRATAMENT', 'TEST ', 'MASCA', 'SPIRT',
      'BETADINE', 'RETETA'],
    masina: ['BENZINA', 'MOTORINA', 'DIESEL', 'EFIX', 'EFIXD', 'EVO', 'EVOD', 'MAXXMOTION', 'MAXX', 'ACTIVE ', 'EKO',
      'MOL ', 'DYNAMIC', 'EFFIX', 'PREMIUM 95', 'PREMIUM 98', 'GPL', 'ADBLUE', 'AD BLUE', 'ANTIGEL', 'LICHID PARBRIZ',
      'ULEI MOTOR', 'SPALATORIE', 'SPALARE AUTO', 'ROVINIETA', 'PARCARE', 'TAXA POD', 'PEAJ', 'ITP', 'ANVELOPE', 'STERGATOARE'],
    restaurant: ['CAFEA ESPRESSO', 'CAFEA LA PAHAR', 'ESPRESSO', 'CAPPUCCINO', 'LATTE', 'AMERICANO', 'FLAT WHITE', 'MENIU', 'SHAORMA', 'BURGER', 'SANDWICH',
      'CIORBA ZILEI', 'DESERT', 'BACSIS', 'SERVICIU MASA', 'TAKE AWAY'],
    haine: ['TRICOU', 'BLUZA', 'CAMASA', 'PANTALONI', 'BLUGI', 'JEANS', 'ROCHIE', 'FUSTA', 'GECA', 'JACHETA', 'PALTON',
      'HANORAC', 'PULOVER', 'SOSETE', 'CIORAPI', 'CHILOTI', 'BOXERI', 'SUTIEN', 'PIJAMA', 'PANTOFI', 'ADIDASI', 'GHETE',
      'CIZME', 'SANDALE', 'PAPUCI', 'CACIULA', 'FULAR', 'MANUSI', 'CUREA'],
    animale: ['HRANA CAINI', 'HRANA PISICI', 'PEDIGREE', 'WHISKAS', 'FRISKIES', 'FELIX', 'PURINA', 'ROYAL CANIN',
      'NISIP PISICI', 'ASTERNUT', 'CAINE', 'PISICA', 'PET '],
    electronice: ['CABLU', 'INCARCATOR', 'CASTI', 'USB', 'MOUSE', 'TASTATURA', 'TELEFON', 'HUSA', 'PRELUNGITOR',
      'ADAPTOR', 'CARD MEMORIE', 'BOXA', 'TELEVIZOR', 'LAPTOP'],
    tutun: ['TIGARI', 'MARLBORO', 'KENT', 'PALL MALL', 'WINSTON', 'CAMEL', 'LUCKY', 'DUNHILL', 'VICEROY', 'IQOS',
      'HEETS', 'TEREA', 'GLO', 'NEO ', 'TUTUN', 'BRICHETA']
  };

  // Magazine cunoscute -> categorie implicită pentru tot bonul
  var MAGAZINE = [
    ['LIDL', 'Lidl', 'alimente'], ['KAUFLAND', 'Kaufland', 'alimente'], ['CARREFOUR', 'Carrefour', 'alimente'],
    ['MEGA IMAGE', 'Mega Image', 'alimente'], ['MEGA', 'Mega Image', 'alimente'], ['PROFI', 'Profi', 'alimente'],
    ['PENNY', 'Penny', 'alimente'], ['AUCHAN', 'Auchan', 'alimente'], ['SELGROS', 'Selgros', 'alimente'],
    ['METRO', 'Metro', 'alimente'], ['CORA', 'Cora', 'alimente'], ['LA DOI PASI', 'La Doi Pași', 'alimente'],
    ['ANNABELLA', 'Annabella', 'alimente'], ['PETROM', 'Petrom', 'masina'], ['OMV', 'OMV', 'masina'],
    ['ROMPETROL', 'Rompetrol', 'masina'], ['LUKOIL', 'Lukoil', 'masina'], ['MOL ', 'MOL', 'masina'],
    ['SOCAR', 'Socar', 'masina'], ['GAZPROM', 'Gazprom', 'masina'], ['CATENA', 'Catena', 'sanatate'],
    ['DONA', 'Dona', 'sanatate'], ['SENSIBLU', 'Sensiblu', 'sanatate'], ['HELP NET', 'HelpNet', 'sanatate'],
    ['DR.MAX', 'Dr.Max', 'sanatate'], ['DR MAX', 'Dr.Max', 'sanatate'], ['FARMACIA', 'Farmacie', 'sanatate'],
    ['FARMACIE', 'Farmacie', 'sanatate'], ['DM DROGERIE', 'dm', 'igiena'], ['DROGERIE', 'dm', 'igiena'],
    ['DEDEMAN', 'Dedeman', 'casa'], ['LEROY', 'Leroy Merlin', 'casa'], ['BRICO', 'Brico Depot', 'casa'],
    ['HORNBACH', 'Hornbach', 'casa'], ['IKEA', 'IKEA', 'casa'], ['JYSK', 'Jysk', 'casa'], ['PEPCO', 'Pepco', 'haine'],
    ['H&M', 'H&M', 'haine'], ['ZARA', 'Zara', 'haine'], ['DEICHMANN', 'Deichmann', 'haine'], ['KIK', 'KiK', 'haine'],
    ['ALTEX', 'Altex', 'electronice'], ['FLANCO', 'Flanco', 'electronice'], ['MEDIA GALAXY', 'Media Galaxy', 'electronice'],
    ['STARBUCKS', 'Starbucks', 'restaurant'], ['MCDONALD', "McDonald's", 'restaurant'], ['KFC', 'KFC', 'restaurant'],
    ['5 TO GO', '5 to go', 'restaurant'], ['TUCANO', 'Tucano', 'restaurant'], ['RESTAURANT', 'Restaurant', 'restaurant'],
    ['PIZZERIA', 'Pizzerie', 'restaurant'], ['CAFENEA', 'Cafenea', 'restaurant']
  ];

  // coduri fiscale văzute pe bonuri reale
  var CIF = [['22891860', 'Lidl', 'alimente'], ['11588780', 'Carrefour', 'alimente'], ['11735628', 'Carrefour Market', 'alimente']];
  var APROX = [['KAUFLAND', 'Kaufland', 'alimente'], ['CARREFOUR', 'Carrefour', 'alimente'], ['DISCOUNT', 'Lidl', 'alimente'],
    ['ARTIMA', 'Carrefour Market', 'alimente'], ['MARKET', 'Carrefour Market', 'alimente'], ['AUCHAN', 'Auchan', 'alimente'], ['PENNY', 'Penny', 'alimente'],
    ['PROFI', 'Profi', 'alimente'], ['SELGROS', 'Selgros', 'alimente'], ['PETROM', 'Petrom', 'masina'],
    ['ROMPETROL', 'Rompetrol', 'masina'], ['LUKOIL', 'Lukoil', 'masina'], ['CATENA', 'Catena', 'sanatate'],
    ['SENSIBLU', 'Sensiblu', 'sanatate'], ['DEDEMAN', 'Dedeman', 'casa']];
  function distanta(a, b) {
    var m = a.length, n = b.length, d = [], i, j;
    for (i = 0; i <= m; i++) { d[i] = [i]; }
    for (j = 1; j <= n; j++) d[0][j] = j;
    for (i = 1; i <= m; i++) for (j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[m][n];
  }

  var BANCI = [['BANCA TRANSILVANIA', 'Banca Transilvania'], ['TRANSILVANIA', 'Banca Transilvania'], ['BCR', 'BCR'],
    ['BRD', 'BRD'], ['ING', 'ING'], ['RAIFFEISEN', 'Raiffeisen'], ['CEC', 'CEC Bank'], ['UNICREDIT', 'UniCredit'],
    ['LIBRA', 'Libra'], ['GARANTI', 'Garanti BBVA'], ['OTP', 'OTP'], ['ALPHA', 'Alpha Bank'], ['REVOLUT', 'Revolut'],
    ['POSTA', 'Poșta Română'], ['EXIMBANK', 'Exim Banca Românească'], ['PATRIA', 'Patria Bank'], ['VISTA', 'Vista Bank']];

  // ---------- Utilitare ----------
  function faraDiacritice(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[şș]/gi, 's').replace(/[ţț]/gi, 't');
  }
  function norm(s) { return faraDiacritice(s).toUpperCase().replace(/\s+/g, ' ').trim(); }

  // „12,98” / „12.98” / „1.234,50” / „1 234.50” -> 12.98
  function numar(s) {
    if (s == null) return NaN;
    s = String(s).replace(/\s/g, '').replace(/[Oo]/g, '0');
    var neg = /^-/.test(s) || /-$/.test(s);
    s = s.replace(/-/g, '');
    if (/^\d{1,3}([.,]\d{3})+[.,]\d{2}$/.test(s)) s = s.replace(/[.,](?=\d{3}[.,])/g, '');
    s = s.replace(',', '.');
    var v = parseFloat(s);
    return neg ? -v : v;
  }
  function rot(v) { return Math.round(v * 100) / 100; }

  // Corectează greșeli tipice OCR în zona numerelor: O->0, l/I->1, S->5 lângă cifre, „12 ,98” -> „12,98”
  function curataLinie(l) {
    l = l.replace(/[|]/g, ' ').replace(/[“”"„«»]/g, ' ').replace(/\s+/g, ' ').trim();
    l = l.replace(/(\d)\s*([.,])\s*(\d{2})(?!\d)/g, '$1$2$3');
    l = l.replace(/(?<=\d)[Oo](?=[\d.,])|(?<=[\d.,])[Oo](?=\d|\b)/g, '0');
    l = l.replace(/(?<=\d[.,]\d)[Oo]/g, '0');
    l = l.replace(/([xX×*]\s*\d+[.,]\d)%/g, '$18');
    l = l.replace(/(\d[.,]\d)%(\s*[A-E€](?:\W{0,3})$)/, '$18$2');
    l = l.replace(/(\d[.,]\d{2})\s*€\s*\W{0,3}$/, '$1 C');
    l = l.replace(/(^|[^\d.,])(\d{1,4})(\d{2})\s+([AB])\W{0,3}$/, function (m, p0, i, d, t) { return p0 + i + ',' + d + ' ' + t; });
    return l;
  }

  // sumă la final de linie, tolerantă la „gunoi” OCR după litera TVA (ex: „24,90:B .”, „8.50A”, „24.994”)
  var RE_SUMA_FINAL = /(-?\s?\d{1,3}(?:[ .]\d{3})*[.,]\d{2}(?!\s*%)-?)\d?\s*[:;.,]?\s*([A-Ea-e])?(?![0-9A-Za-z])(?:[^0-9A-Za-z][^0-9]{0,5})?$/;
  var RE_EGAL = /=\s*(-?\d{1,3}(?:[ .]\d{3})*[.,]\d{2})/;
  var RE_CANT = /(?:^|\s)(\d+(?:[.,]\d{1,3})?)\.?\s*([A-Za-z][A-Za-z0-9]{0,3}\.?)?\s*[xX×*]\s*(\d+[.,]\d{2,3}|\d+[.,]\d(?=\s|$))(?![\d%A-Za-z])/;
  function unitate(u) {
    u = (u || '').replace('.', '').toUpperCase();
    if (!u || u === 'X') return '';
    if (/^K/.test(u)) return 'KG';
    if (/^(B|H)/.test(u) || /UC/.test(u)) return 'BUC';
    if (/^L/.test(u)) return 'L';
    return u;
  }
  var RE_DATA = /(\d{2})[.\/-](\d{2})[.\/-](\d{4}|\d{2})(?!\d)/;

  var STOP_PRODUSE = /^(SUB ?TOTAL|TOTAL|TOTA1|T0TAL|DE PLATA|PLATA|NUMERAR|CARD|REST|TVA|BAZA|COTA|ACHITAT|PUNCTE|ART(ICOLE)?\b|NR\.? ?ART)/;
  var IGNORA = /(\bMUN\.|\bMN\.|\bJUD\b|\bJUD\.|\bSECTOR\b|\bORAS\b|\bCOM\.|\bSOS\.|SOSEAUA|CALEA |COD (DE )?IDENTIFICARE|\bC\.?I\.?F\b|\bCUI\b|\bC\.U\.I|NR\.? ?REG|\bJ\d\d\/|^STR\.? |\bSTR\. |STRADA|\bJUD\.|JUDETUL|^BD\.? |BULEVARD|\bLOC\. |\bTEL\.?[: ]+\d|WWW\.|HTTP|^LEI$|^RON$|CASIER|\bCASA\s*\d|OPERATOR|BON FISCAL|\bBF[: ]|\bZ[: ]\s*\d|ID UNIC|NR\.? ?BON|\bORA[: ]|\bDATA[: ]|MULTUMIM|LA REVEDERE|\bPOS\b|TERMINAL|AUTORIZAT|APROBAT|MASTERCARD|\bVISA\b|CONTACTLESS|\bSERIA?\b|FISCAL)/;
  var REDUCERE = /(REDUCERE|DISCOUNT|DISC\.?|PROMO|LIDL PLUS|CUPON|VOUCHER|ANULARE|STORNO|REDUCERI|ECONOMISIT|BONUS)/;
  var SGR = /(SGR|GARANTIE|GARANTIA|AMBALAJ|RETUR)/;

  // ---------- Magazin, dată ----------
  function detecteazaMagazin(liniiN) {
    function cauta(l) {
      for (var k = 0; k < MAGAZINE.length; k++) {
        var cheie = MAGAZINE[k][0].trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (new RegExp('(^|[^A-Z])' + cheie + '([^A-Z]|$)').test(l)) return { nume: MAGAZINE[k][1], categorie: MAGAZINE[k][2] };
      }
      return null;
    }
    var i, r;
    for (i = 0; i < Math.min(10, liniiN.length); i++) { if ((r = cauta(liniiN[i]))) return r; }
    // după codul fiscal (cifrele citite pot avea o greșeală)
    for (i = 0; i < Math.min(12, liniiN.length); i++) {
      if (!/FISCAL|C\.?I\.?F|CUI|\bRO\s?\d/.test(liniiN[i])) continue;
      var cif = (liniiN[i].replace(/[OZ]/g, function (c) { return c === 'O' ? '0' : '2'; }).match(/\d{6,10}/g) || []).join(' ');
      for (var k = 0; k < CIF.length; k++) {
        var c = CIF[k][0];
        if (cif.indexOf(c) >= 0 || cif.indexOf(c.slice(-6)) >= 0 || cif.indexOf(c.slice(0, 6)) >= 0) return { nume: CIF[k][1], categorie: CIF[k][2] };
      }
    }
    // nume citit cu o literă greșită (ex. KAUFLAMD, DISOUNT)
    var cuvCap = liniiN.slice(0, 8).join(' ').split(/[^A-Z]+/);
    for (i = 0; i < APROX.length; i++) {
      for (var j = 0; j < cuvCap.length; j++) {
        if (cuvCap[j].length >= 5 && distanta(cuvCap[j], APROX[i][0]) <= (APROX[i][0].length >= 7 ? 2 : 1)) return { nume: APROX[i][1], categorie: APROX[i][2] };
      }
    }
    for (i = 10; i < liniiN.length; i++) { if ((r = cauta(liniiN[i])) && r.nume.length > 3) return r; }
    // prima linie „cu litere” din antet
    for (i = 0; i < Math.min(5, liniiN.length); i++) {
      var l = liniiN[i];
      if (/\d[.,]\d/.test(l)) break;   // am ajuns la produse
      if (/[A-Z]{3,}/.test(l) && !IGNORA.test(l) && !RE_CANT.test(l) && !RE_SUMA_FINAL.test(l)) return { nume: l.replace(/\b(S\.?R\.?L\.?|S\.?A\.?)\b.*$/, '').trim(), categorie: null };
    }
    return { nume: '', categorie: null };
  }

  function detecteazaPlata(liniiN) {
    // întâi liniile de după TOTAL (acolo e scris cum s-a plătit)
    var iT = -1;
    for (var i = 0; i < liniiN.length; i++) if (/^(TOTAL|TOTA|T0TAL)/.test(liniiN[i]) && !/TVA|TUA/.test(liniiN[i])) { iT = i; break; }
    if (iT >= 0) {
      for (i = iT + 1; i < Math.min(liniiN.length, iT + 6); i++) {
        var l = liniiN[i];
        if (/^(TICHET|BONURI|EDENRED|PLUXEE|SODEXO|UP )/.test(l)) return 'tichete';
        if (/^(NUMERAR|CASH)/.test(l)) return 'numerar';
        if (/^(CARD|PLATA CARD|VISA|MASTERCARD|MAESTRO)/.test(l)) return 'card';
      }
    }
    var t = liniiN.join(' | ');
    if (/TICHET|EDENRED|PLUXEE|SODEXO|UP ROMANIA|BONURI (DE )?MASA|CARD MASA/.test(t)) return 'tichete';
    if (/NUMERAR|CASH/.test(t) && !/(CARD|VISA|MASTERCARD|CONTACTLESS|POS)\b/.test(t.replace(/CARD MASA/g, ''))) return 'numerar';
    if (/\bCARD\b|VISA|MASTERCARD|CONTACTLESS|\bPOS\b/.test(t)) return 'card';
    return null;
  }

  function detecteazaData(liniiN) {
    for (var i = liniiN.length - 1; i >= 0; i--) {
      var m = liniiN[i].match(RE_DATA);
      if (m) {
        var z = +m[1], l = +m[2], a = +m[3];
        if (a < 100) a += 2000;
        if (z >= 1 && z <= 31 && l >= 1 && l <= 12 && a >= 2015 && a <= 2100) {
          return a + '-' + (l < 10 ? '0' : '') + l + '-' + (z < 10 ? '0' : '') + z;
        }
      }
    }
    return null;
  }

  function detecteazaTotal(liniiN, sumaProduse) {
    var candidati = [], sub = [];
    for (var i = 0; i < liniiN.length; i++) {
      var l = liniiN[i];
      if (/TOTA|T0TAL|TOTAI|DE PLATA/.test(l) && !/TVA|TUA|TAIA|ECONOM|REDUC|TOTAL ART/.test(l)) {
        var m = l.match(RE_SUMA_FINAL) || (liniiN[i + 1] || '').match(/^\s*(\d{1,3}(?:[ .]\d{3})*[.,]\d{2})\s*$/);
        if (m) (/SUB/.test(l) ? sub : candidati).push(numar(m[1]));
      }
    }
    var toti = candidati.concat(sub).filter(function (v) { return v > 0; });
    if (toti.length && sumaProduse > 0) {
      var potrivit = toti.filter(function (v) { return Math.abs(v - sumaProduse) < 0.01; });
      if (potrivit.length) return potrivit[0];
      // TOTAL și SUBTOTAL egale -> sigur; altfel TOTAL
      if (candidati.length && sub.length && sub.indexOf(candidati[0]) < 0 && sub[0] === sub[sub.length - 1]) return sub[0];
    }
    if (candidati.length) return candidati[0];
    if (sub.length) return sub[sub.length - 1];
    for (i = 0; i < liniiN.length; i++) {
      if (/^(CARD|NUMERAR|CASH|PLATA CARD|CARD BANCAR)/.test(liniiN[i])) {
        var m2 = liniiN[i].match(RE_SUMA_FINAL);
        if (m2) return numar(m2[1]);
      }
    }
    return null;
  }

  // ---------- Produse ----------
  function curataNume(n) {
    n = String(n).replace(/^[^A-Za-zĂÂÎȘȚăâîșț]+/, '');
    var t = n.split(/\s+/), k = 0;
    while (k < t.length - 1 && !(/^[A-Za-zĂÂÎȘȚăâîșț]{3,}/.test(t[k]) || /^[A-ZĂÂÎȘȚ]{2}$/.test(t[k]) && /^[A-ZĂÂÎȘȚ]{3,}/.test(t[k + 1] || ''))) k++;
    n = t.slice(k).join(' ');
    return n.replace(RE_CANT, ' ').replace(/[|_~^]/g, ' ').replace(/^\W+|\W+$/g, '').replace(/\s{2,}/g, ' ')
      .replace(/(\s+[A-Za-zĂÂÎȘȚ\W]{1,2})+$/, '').replace(/\W+$/, '').trim();
  }
  function areLitere(s) { return /[A-ZĂÂÎȘȚ]{2,}/i.test(s); }
  // un nume „adevărat”: un cuvânt de minim 4 litere sau două de minim 3
  function numeReal(s) {
    var w = norm(s).split(/[^A-Z]+/).filter(function (x) { return x.length >= 3; });
    return w.some(function (x) { return x.length >= 4; }) || w.length >= 2;
  }

  function extrageProduse(linii, liniiN) {
    // începutul zonei de produse: după antet (linia cu CIF / „LEI”), dacă există
    var start = 0;
    for (var i = 0; i < Math.min(liniiN.length, 14); i++) {
      if (/(COD (DE )?IDENTIFICARE|C\.?I\.?F|CUI|C\.?U\.?I|COD FISCAL|^LEI$|^RON$|^\s*LEI\s*$)/.test(liniiN[i])) start = i + 1;
    }
    var produse = [];
    var numeAsteptat = null, cantAsteptata = null;

    for (i = start; i < liniiN.length; i++) {
      var L = liniiN[i], orig = linii[i];
      if (STOP_PRODUSE.test(L) && produse.length) break;
      if (STOP_PRODUSE.test(L)) continue;
      if (IGNORA.test(L) && !RE_SUMA_FINAL.test(L)) continue;

      var mc = L.match(RE_CANT);
      var ms = L.match(RE_SUMA_FINAL);
      var esteRed = REDUCERE.test(L);
      var esteSgr = SGR.test(L);

      if (esteRed && ms) {
        var v = -Math.abs(numar(ms[1]));
        if (produse.length) {
          var p = produse[produse.length - 1];
          p.reducere = rot((p.reducere || 0) + v);
          p.suma = rot(p.suma + v);
        }
        numeAsteptat = null; cantAsteptata = null;
        continue;
      }

      if (mc) {
        var c = numar(mc[1]), pu = numar(mc[3]);
        var bucataNume = L.slice(0, L.indexOf(mc[0])).trim();
        var me = L.match(RE_EGAL);
        var dupa = L.slice(L.indexOf(mc[0]) + mc[0].length);
        var md = dupa.match(RE_SUMA_FINAL);
        var total = me ? numar(me[1]) : (md ? numar(md[1]) : rot(c * pu));
        // cantitatea citită greșit (ex. 1.990 în loc de 1.000): o recalculăm din total / preț
        if (pu > 0 && Math.abs(rot(c * pu) - total) > 0.02) {
          var c2 = Math.round(total / pu * 1000) / 1000;
          var bucati = /^(BUC|BC|BUCATI|)$/i.test((mc[2] || '').replace('.', ''));
          var cIntreg = Math.abs(c - Math.round(c)) < 0.0005;
          var c2Intreg = Math.abs(c2 - Math.round(c2)) < 0.0005;
          if (bucati && cIntreg && !c2Intreg) total = rot(c * pu);          // totalul citit greșit
          else if (Math.abs(rot(c2 * pu) - total) <= 0.02 && (!bucati || c2Intreg)) c = c2; // cantitatea citită greșit
          else total = rot(c * pu);
        }
        var areSuma = !!(me || md);
        if (!areSuma && !numeReal(bucataNume)) {
          // format Lidl/Carrefour: „1,000 BUC x 15,00” apoi „BERE ... 15,00 A”
          // sau formatul invers: produsul cu suma deasupra, „2 x 6,49” dedesubt
          var pv = produse[produse.length - 1];
          numeAsteptat = null;
          if (pv && !pv.cantitateSetata && pv.cantitate === 1 && c !== 1 && Math.abs(pv.suma - rot(c * pu)) < 0.02) {
            pv.cantitate = c; pv.pretUnitar = pu; pv.um = unitate(mc[2]); pv.cantitateSetata = true;
            cantAsteptata = null;
            continue;
          }
          cantAsteptata = { c: c, pu: pu, total: total, um: unitate(mc[2]) };
          continue;
        }
        var esteGarantie = SGR.test(L) || (numeAsteptat && SGR.test(norm(numeAsteptat)));
        if (esteGarantie && produse.length && pu <= 1) {
          var pg = produse[produse.length - 1];
          var vg = rot(Math.round(total / 0.5) * 0.5) || total;
          pg.sgr = rot((pg.sgr || 0) + vg); pg.suma = rot(pg.suma + vg);
          numeAsteptat = null; cantAsteptata = null;
          continue;
        }
        if (numeReal(bucataNume)) {
          produse.push({ nume: curataNume(orig.slice(0, orig.toUpperCase().indexOf(mc[0].toUpperCase())) || bucataNume),
            cantitate: c, pretUnitar: pu, suma: total, um: unitate(mc[2]) });
          numeAsteptat = null; cantAsteptata = null;
        } else if (numeAsteptat) {
          produse.push({ nume: numeAsteptat, cantitate: c, pretUnitar: pu, suma: total, um: unitate(mc[2]) });
          numeAsteptat = null; cantAsteptata = null;
        } else if (produse.length && !produse[produse.length - 1].cantitateSetata && /^\s*$/.test(bucataNume)) {
          // format Lidl: produsul cu suma pe prima linie, „2 x 6,49” pe a doua
          var u = produse[produse.length - 1];
          if (Math.abs(u.suma - rot(c * pu)) < 0.02) { u.cantitate = c; u.pretUnitar = pu; u.cantitateSetata = true; }
          else cantAsteptata = { c: c, pu: pu, total: total, um: unitate(mc[2]) };
        } else {
          cantAsteptata = { c: c, pu: pu, total: total, um: unitate(mc[2]) };
        }
        continue;
      }

      if (ms) {
        var suma = numar(ms[1]);
        if (suma < 0 && !/-\d/.test(ms[1].replace(/\s/g, '')) ) suma = -suma;
        if (suma < 0 && produse.length && !areLitere(L.slice(0, ms.index))) { // „-5,00” singur: reducere la produsul de deasupra
          var pr0 = produse[produse.length - 1]; pr0.reducere = rot((pr0.reducere || 0) + suma); pr0.suma = rot(pr0.suma + suma);
          continue;
        }
        if (suma < 0) suma = -suma;
        var numeLinie = orig.slice(0, orig.length - (L.length - ms.index)).trim();
        if (!numeLinie) numeLinie = L.slice(0, ms.index).trim();
        if (esteSgr && produse.length && suma > 0 && suma <= 6) {
          var pr = produse[produse.length - 1];
          suma = rot(Math.round(suma / 0.5) * 0.5) || suma;
          pr.sgr = rot((pr.sgr || 0) + suma); pr.suma = rot(pr.suma + suma);
          continue;
        }
        if (areLitere(numeLinie)) {
          var prod = { nume: curataNume(numeLinie), cantitate: 1, pretUnitar: suma, suma: suma, um: '' };
          if (cantAsteptata && Math.abs(cantAsteptata.total - suma) < 0.02) {
            prod.cantitate = cantAsteptata.c; prod.pretUnitar = cantAsteptata.pu; prod.cantitateSetata = true;
          } else if (cantAsteptata && Math.abs(cantAsteptata.total - suma) <= Math.max(1.5, suma * 0.15)) {
            // cantitatea × prețul nu dă suma citită: una din ele e citită greșit (decidem la final, după total)
            prod.calc = rot(cantAsteptata.c * cantAsteptata.pu); prod.cantitate = cantAsteptata.c; prod.pretUnitar = cantAsteptata.pu; prod.cantitateSetata = true;
          }
          produse.push(prod);
          numeAsteptat = null; cantAsteptata = null;
        } else if (numeAsteptat) {
          var pp = { nume: numeAsteptat, cantitate: 1, pretUnitar: suma, suma: suma, um: '' };
          if (cantAsteptata) { pp.cantitate = cantAsteptata.c; pp.pretUnitar = cantAsteptata.pu; }
          produse.push(pp);
          numeAsteptat = null; cantAsteptata = null;
        } else if (cantAsteptata && produse.length === 0) {
          cantAsteptata = null;
        }
        continue;
      }

      // linie doar cu text: dacă avem deja cantitate × preț deasupra, e produsul (suma s-a pierdut la citire)
      if (cantAsteptata && numeReal(L) && !IGNORA.test(L)) {
        produse.push({ nume: curataNume(orig), cantitate: cantAsteptata.c, pretUnitar: cantAsteptata.pu,
          suma: cantAsteptata.total, um: cantAsteptata.um || '', estimat: true });
        cantAsteptata = null; numeAsteptat = null;
        continue;
      }
      // altfel -> probabil numele produsului (urmează cantitatea / suma)
      if (areLitere(L) && L.length >= 3 && !IGNORA.test(L)) {
        numeAsteptat = curataNume(orig);
      }
    }
    produse.forEach(function (p) { delete p.cantitateSetata; });
    return produse.filter(function (p) { return p.nume && Math.abs(p.suma) > 0; });
  }

  // ---------- Încadrare ----------
  function levenshtein1(a, b) { // true dacă distanța <= 1
    if (a === b) return true;
    var la = a.length, lb = b.length;
    if (Math.abs(la - lb) > 1) return false;
    var i = 0, j = 0, dif = 0;
    while (i < la && j < lb) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++dif > 1) return false;
      if (la > lb) i++; else if (lb > la) j++; else { i++; j++; }
    }
    return dif + (la - i) + (lb - j) <= 1;
  }

  function cheieInvatare(nume) {
    return norm(nume).replace(/[^A-Z0-9 ]/g, ' ').replace(/\b\d+([.,]\d+)?\s*(G|GR|KG|L|ML|BUC|%)?\b/g, ' ')
      .replace(/\s+/g, ' ').trim();
  }

  function incadreaza(nume, invatare, categorieMagazin) {
    var k = cheieInvatare(nume);
    invatare = invatare || {};
    if (invatare[k]) return { categorie: invatare[k], sursa: 'invatat' };
    var cuv = k.split(' ');
    var pref2 = cuv.slice(0, 2).join(' ');
    if (pref2 && invatare['~' + pref2]) return { categorie: invatare['~' + pref2], sursa: 'invatat' };
    if (cuv[0] && cuv[0].length >= 3 && invatare['~' + cuv[0]]) return { categorie: invatare['~' + cuv[0]], sursa: 'invatat' };

    var text = ' ' + k + ' ';
    var best = null, bestLen = 0, bestScor = 0;
    Object.keys(CUVINTE).forEach(function (cat) {
      CUVINTE[cat].forEach(function (kw) {
        var kk = kw.trim(), scorK = 0;
        var poz = kw.slice(-1) === ' ' ? text.indexOf(' ' + kk + ' ') : text.indexOf(kk);
        if (poz >= 0) scorK = kk.length + (poz <= 1 ? 10 : 0);
        else if (kk.length >= 5 && kk.indexOf(' ') < 0) {
          cuv.forEach(function (w, iw) { if (w.length >= 5 && levenshtein1(w, kk)) scorK = Math.max(scorK, kk.length - 3 + (iw === 0 ? 10 : 0)); });
        }
        if (scorK > bestScor) { best = cat; bestLen = kk.length; bestScor = scorK; }
      });
    });
    // la benzinărie, orice nu e clar altceva e carburant/mașină
    if (best && categorieMagazin === 'masina' && best === 'alimente' && bestLen < 5) best = 'masina';
    if (best) return { categorie: best, sursa: 'cuvant' };
    if (categorieMagazin) return { categorie: categorieMagazin, sursa: 'magazin' };
    return { categorie: 'altele', sursa: 'necunoscut' };
  }

  function invata(invatare, nume, categorie) {
    var k = cheieInvatare(nume);
    if (!k) return invatare;
    invatare[k] = categorie;
    var cuv = k.split(' ');
    if (cuv.length >= 2) invatare['~' + cuv.slice(0, 2).join(' ')] = categorie;
    return invatare;
  }

  // ---------- API principal ----------
  function citesteBon(text, optiuni) {
    optiuni = optiuni || {};
    var linii = String(text || '').split(/\r?\n/).map(curataLinie).filter(function (l) { return l.length; });
    var liniiN = linii.map(norm);
    var magazin = detecteazaMagazin(liniiN);
    var produse = extrageProduse(linii, liniiN);
    var suma0 = rot(produse.reduce(function (s, p) { return s + p.suma; }, 0));
    var total = detecteazaTotal(liniiN, suma0);
    var data = detecteazaData(liniiN);
    // o sumă citită greșit: dacă un singur produs, corectat, face ca bonul să se potrivească, îl corectăm
    if (total != null && Math.abs(total - suma0) >= 0.01) {
      var dif0 = rot(total - suma0);
      var cand = produse.filter(function (p) {
        var nou = rot(p.suma + dif0);
        return p.calc != null && nou > 0 && Math.abs(nou - p.calc) <= Math.max(0.15, p.calc * 0.03);
      });
      if (cand.length === 1) { cand[0].sumaCitita = cand[0].suma; cand[0].suma = rot(cand[0].suma + dif0); cand[0].corectat = true; if (cand[0].cantitate === 1) cand[0].pretUnitar = cand[0].suma; suma0 = total; }
    }
    produse.forEach(function (p) { delete p.calc; });
    // un singur produs cu sumă estimată: îl potrivim cu totalul bonului
    var est = produse.filter(function (p) { return p.estimat; });
    if (total != null && est.length === 1) {
      var rest = rot(total - (suma0 - est[0].suma));
      if (rest > 0 && Math.abs(rest - est[0].suma) <= Math.max(0.5, est[0].suma * 0.3)) { est[0].suma = rest; est[0].estimat = false; est[0].ajustat = true; }
    }
    produse.forEach(function (p) {
      var r = incadreaza(p.nume, optiuni.invatare, magazin.categorie);
      p.categorie = r.categorie; p.sursa = r.sursa;
    });
    var suma = rot(produse.reduce(function (s, p) { return s + p.suma; }, 0));
    var totalGasit = total != null;
    if (total == null && produse.length) total = suma;
    var plata = detecteazaPlata(liniiN);
    return {
      tip: 'cheltuiala', plata: plata, totalGasit: totalGasit, magazin: magazin.nume, categorieMagazin: magazin.categorie, data: data,
      total: total, sumaProduse: suma, diferenta: total != null ? rot(total - suma) : 0, produse: produse
    };
  }

  // Bon de bancă: depunere numerar / alimentare cont / chitanță -> venit
  function citesteVenit(text) {
    var linii = String(text || '').split(/\r?\n/).map(curataLinie).filter(function (l) { return l.length; });
    var liniiN = linii.map(norm);
    var tot = liniiN.join(' | ');
    var banca = '';
    for (var i = 0; i < BANCI.length; i++) {
      var re = new RegExp('(^|[^A-Z])' + BANCI[i][0] + '([^A-Z]|$)');
      if (re.test(tot)) { banca = BANCI[i][1]; break; }
    }
    var tipOp = /DEPUNERE|DEPOZIT|CASH ?IN|ALIMENTARE/.test(tot) ? 'Depunere numerar'
      : /TRANSFER|VIRAMENT|INCASARE/.test(tot) ? 'Încasare' : /SALAR/.test(tot) ? 'Salariu' : 'Venit';
    var suma = null;
    var cuvSuma = /(SUMA|SUMA DEPUSA|IMPORT|VALOARE|TOTAL|DEPUNERE|DEPUS|CREDITAT|AMOUNT|RON|LEI)/;
    for (i = 0; i < liniiN.length; i++) {
      if (cuvSuma.test(liniiN[i]) && !/SOLD|COMISION|TAXA|DISPONIBIL/.test(liniiN[i])) {
        var m = liniiN[i].match(/(\d{1,3}(?:[ .]\d{3})*[.,]\d{2})/);
        if (!m && liniiN[i + 1]) m = liniiN[i + 1].match(/^\s*(?:RON|LEI)?\s*(\d{1,3}(?:[ .]\d{3})*[.,]\d{2})/);
        if (m) { suma = numar(m[1]); break; }
      }
    }
    if (suma == null) { // cea mai mare sumă de pe bon, fără sold
      var max = 0;
      liniiN.forEach(function (l) {
        if (/SOLD|DISPONIBIL/.test(l)) return;
        (l.match(/\d{1,3}(?:[ .]\d{3})*[.,]\d{2}/g) || []).forEach(function (x) { var v = numar(x); if (v > max) max = v; });
      });
      suma = max || null;
    }
    return { tip: 'venit', banca: banca, descriere: tipOp + (banca ? ' ' + banca : ''), data: detecteazaData(liniiN), total: suma };
  }

  // Grupează produsele pe categorii -> tranzacții pentru buget
  function grupeazaPeCategorii(bon) {
    var g = {};
    bon.produse.forEach(function (p) {
      if (!g[p.categorie]) g[p.categorie] = { categorie: p.categorie, suma: 0, produse: [] };
      g[p.categorie].suma = rot(g[p.categorie].suma + p.suma);
      g[p.categorie].produse.push(p.nume);
    });
    return Object.keys(g).map(function (k) { return g[k]; }).sort(function (a, b) { return b.suma - a.suma; });
  }

  var API = { CATEGORII: CATEGORII, citesteBon: citesteBon, citesteVenit: citesteVenit, incadreaza: incadreaza,
    invata: invata, grupeazaPeCategorii: grupeazaPeCategorii, cheieInvatare: cheieInvatare, numar: numar, norm: norm };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.BonParser = API;
})(typeof window !== 'undefined' ? window : this);
