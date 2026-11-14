# 💰 Bugetul Meu

Aplicație web de buget personal, în limba română, care rulează direct în browser și se poate instala pe telefon ca o aplicație (PWA). **Datele rămân doar pe dispozitivul tău**: nu există server, cont sau abonament.

![Dashboard desktop](docs/dashboard-desktop.png)

> Capturile folosesc date de demonstrație.

## ✨ Funcții

| Zonă | Ce poți face |
|---|---|
| **Acasă** | Avere netă, venituri, cheltuieli, rambursări, grafic pe categorii, tendință pe 6 luni, „Pot cheltui azi", bugete și alerte |
| **Adaugă** | Cheltuieli, încasări (și în **EUR/USD**, cu curs manual), rambursări de datorii și transferuri între Card și Numerar |
| **Istoric** | Căutare, filtre pe tip, dată, sumă, cont și categorie; selecție multiplă cu ștergere, recategorisire și mutare de cont în masă (cu anulare); editare, duplicare și ștergere |
| **Rapoarte** | 11 rapoarte. **Rezumat** pe orice perioadă (lună, 3/6/12 luni, an sau interval ales) cu concluzii în text, comparație cu perioada anterioară și export CSV. Apoi: Prezentare (flux Sankey, evoluția soldului, recurente, hartă termică), Bugete, Categorie, Datorii și economii, Conturi și tichete, Prognoză, An, Venituri, Comercianți și Compară luni |
| **Planificare** | Calendar lunar cu salarii și facturi, înregistrare manuală sau automată |
| **Economii** | Obiective cu progres, contribuții și retrageri |
| **Persoane** | Cine îți datorează și cui datorezi, cu istoric și împrumuturi |
| **Datorii** | Creditori, sume totale și cât a rămas de plătit |
| **Carduri tichete** | Carduri de masă sau cadou, cu alimentări și plăți din sold. Cardurile vechi din V22 se convertesc într-un singur clic, cu verificarea soldului |
| **Setări** | Solduri inițiale, bugete lunare, categorii proprii, backup și import JSON |
| **Editare și ștergere** | Orice înregistrare se poate edita sau șterge: operațiuni (cu duplicare), carduri și alimentările lor, datorii, împrumuturi, obiective și mișcările lor, evenimente planificate, categorii. Ștergerile mari cer confirmare, iar cele simple au „Anulează” |

Interfața are meniu lateral, butoane rotunde în stil iOS, albastru închis, mod întunecat, și se adaptează atât pe telefon, cât și pe desktop.

<p>
  <img src="docs/dashboard-mobil.png" alt="Dashboard mobil" width="70%">
  <img src="docs/setari-mobil.png" alt="Setări mobil" width="25%">
</p>

### 📊 Rapoarte

![Rapoarte desktop](docs/rapoarte-desktop.png)

<img src="docs/rapoarte-mobil.png" alt="Rapoarte pe telefon" width="100%">

### ✨ Noutăți V28

![Rezumat desktop](docs/rezumat-desktop.png)

<img src="docs/v28-mobil.png" alt="V28 pe telefon: Rezumat, selecție multiplă, monede" width="100%">

- **Monede:** introduci o cheltuială sau un venit în EUR/USD, cu cursul tău. Suma se salvează în RON (soldurile și rapoartele rămân în RON), iar suma originală și cursul se păstrează și apar în Istoric și rapoarte.
- **Operațiuni în masă:** în *Istoric* apeși *Selectează*, bifezi și alegi ștergere, categorie sau cont.
- **Interfață:** iconițe SVG, antet translucid, butoane și animații fine; respectă setarea „reducere mișcare".

## 📱 Instalare pe telefon

**iPhone (Safari):** deschide linkul aplicației → *Distribuie* → *Adaugă pe ecranul principal*.

**Android (Chrome):** deschide linkul → meniul ⋮ → *Instalează aplicația*.

După prima încărcare, aplicația funcționează și fără internet.

## 🚀 Publicare pe GitHub Pages

**Varianta automată (recomandată):** repository-ul include `.github/workflows/pages.yml`.

1. Urcă toate fișierele în rădăcina repository-ului (ramura `main`).
2. Mergi la **Settings → Pages** și la *Source* alege **GitHub Actions**.
3. La fiecare `push`, aplicația se publică singură la `https://<utilizator>.github.io/<repository>/`. Starea o vezi în tab-ul *Actions*.

**Varianta simplă:** la *Source* alege **Deploy from a branch**, ramura `main`, folderul `/ (root)`. Merge fără workflow, dar atunci publici și folderul `tests/`.

Dacă după o actualizare vezi versiunea veche, închide tabul și redeschide linkul. Service worker-ul își reîmprospătează singur memoria cache.

## 🔒 Securitate și siguranța datelor

- **Stocare dublă:** datele se salvează în **IndexedDB** și în **localStorage** (cheia `bugetul-meu-v1`). La pornire se alege automat copia validă și cea mai recentă.
- **Sumă de control (SHA-256):** o copie coruptă este detectată, ignorată și reparată din cealaltă. Copiile corupte se păstrează pentru analiză.
- **Instantanee automate:** unul pe zi (ultimele 20), plus unul înainte de import, restaurare sau conversie. Se pot restaura din *Setări*.
- **Stocare persistentă:** aplicația cere browserului să nu șteargă datele. Pe iPhone, adaug-o pe ecranul principal.
- **Verifică stocarea:** buton în *Setări* care testează scrierea/citirea, integritatea copiilor, spațiul folosit și persistența.
- **Parolă cu criptare:** datele se criptează cu AES-256-GCM, cheia derivată din parolă (PBKDF2, 250.000 de iterații). **Fără parolă datele nu pot fi citite de nimeni, inclusiv de tine.**
- **Face ID / Touch ID:** blocare prin WebAuthn (iOS 16+, necesită HTTPS), cu parolă de rezervă. Este o **blocare a accesului în aplicație, nu o criptare**.
- **Blocare automată:** imediat, după 30 de secunde, 1 minut, 5 minute sau niciodată.
- **Import validat:** backup-ul este verificat (format, date, sume, id-uri duplicate), iar înregistrările invalide sunt ignorate, cu avertisment.

> ⚠️ Nu există recuperare de parolă. Păstrează un backup JSON recent și nu-l urca pe GitHub: conține finanțele tale.
> Nicio dată nu este trimisă pe internet. Dacă ștergi datele site-ului din browser, le pierzi, de aceea backup-ul rămâne important.

![Securitate](docs/securitate-mobil.png)

<img src="docs/carduri-blocare.png" alt="Conversie carduri și ecran de blocare" width="70%">

## 🗂 Structura proiectului

```
index.html            # structura paginii
store.js              # stocare sigură, criptare, Face ID, instantanee
app.css               # stiluri, temă luminoasă/întunecată, responsive
js/                   # logica aplicației, împărțită în module
  core.js             #   date, solduri, ecranele de bază
  features.js         #   planificare, economii, persoane, carduri, setări
  dashboard.js        #   ecranul Acasă și grafice
  reports.js          #   rapoartele
  crud.js             #   editare și ștergere
  security-ui.js      #   securitate, import, conversie carduri
  v28.js              #   filtre, selecție în masă, monede, Rezumat
  main.js             #   randare și evenimente globale
tests/                # teste automate Playwright
.github/workflows/    # teste și publicare automată pe GitHub Pages
sw.js                 # service worker (funcționare offline)
manifest.webmanifest  # configurare PWA
icon-180/192/512.png  # iconițe
docs/                 # capturi pentru acest README
```

## 🛠 Tehnologii

HTML, CSS și JavaScript simplu, fără framework și fără dependențe externe. Graficele sunt făcute din SVG și CSS.

## 🧪 Rulare locală și teste

```bash
python3 -m http.server 8000
# apoi deschide http://localhost:8000
```

Testele automate (`tests/`, vezi `tests/README.md`) rulează și în GitHub Actions la fiecare `push`. Service worker-ul are nevoie de `http://localhost` sau `https`. Deschis direct din fișier, aplicația merge, dar fără mod offline.

## 🗺 Idei pentru viitor

- Import din extras bancar (BT, ING, Revolut)
- Conturi și solduri în mai multe monede
- Operațiuni recurente cu reguli mai complexe
- Import din extrasul bancar (CSV)
- Sincronizare opțională între dispozitive

## 📄 Licență

Proiect personal. Alege o licență (de exemplu MIT) înainte de a-l face public.
