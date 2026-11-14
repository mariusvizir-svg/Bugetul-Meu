# 💰 Bugetul Meu

Aplicație web de buget personal, în limba română, care rulează direct în browser și se poate instala pe telefon ca o aplicație (PWA). **Datele rămân doar pe dispozitivul tău**: nu există server, cont sau abonament.

![Dashboard desktop](docs/dashboard-desktop.png)

> Capturile folosesc date de demonstrație.

## ✨ Funcții

| Zonă | Ce poți face |
|---|---|
| **Acasă** | Avere netă, venituri, cheltuieli, rambursări, grafic pe categorii, tendință pe 6 luni, „Pot cheltui azi", bugete și alerte |
| **Adaugă** | Cheltuieli, încasări, rambursări de datorii și transferuri între Card și Numerar |
| **Istoric** | Căutare, filtre pe tip, editare și ștergere cu opțiunea de anulare |
| **Rapoarte** | 10 rapoarte: Prezentare (flux Sankey, venituri vs cheltuieli, evoluția soldului, recurente, hartă termică), Bugete, Categorie, Datorii și economii, Conturi și tichete, Prognoză, An, Venituri, Comercianți și Compară luni. Perioade de 1, 3, 6 și 12 luni, tipărire/PDF și export CSV |
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

## 📱 Instalare pe telefon

**iPhone (Safari):** deschide linkul aplicației → *Distribuie* → *Adaugă pe ecranul principal*.

**Android (Chrome):** deschide linkul → meniul ⋮ → *Instalează aplicația*.

După prima încărcare, aplicația funcționează și fără internet.

## 🚀 Publicare pe GitHub Pages

1. Urcă toate fișierele din acest repository în rădăcina lui.
2. Mergi la **Settings → Pages**.
3. La *Source* alege **Deploy from a branch**, ramura `main` și folderul `/ (root)`.
4. După un minut, aplicația apare la `https://<utilizator>.github.io/<repository>/`.

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
app.js                # toată logica aplicației
sw.js                 # service worker (funcționare offline)
manifest.webmanifest  # configurare PWA
icon-180/192/512.png  # iconițe
docs/                 # capturi pentru acest README
```

## 🛠 Tehnologii

HTML, CSS și JavaScript simplu, fără framework și fără dependențe externe. Graficele sunt făcute din SVG și CSS.

## 🧪 Rulare locală

```bash
python3 -m http.server 8000
# apoi deschide http://localhost:8000
```

Service worker-ul are nevoie de `http://localhost` sau `https`. Deschis direct din fișier, aplicația merge, dar fără mod offline.

## 🗺 Idei pentru viitor

- Mai multe monede și cursuri de schimb
- Operațiuni recurente cu reguli mai complexe
- Import din extrasul bancar (CSV)
- Sincronizare opțională între dispozitive

## 📄 Licență

Proiect personal. Alege o licență (de exemplu MIT) înainte de a-l face public.
