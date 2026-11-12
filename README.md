[README.md](https://github.com/user-attachments/files/34731558/README.md)
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
| **Rapoarte** | Cheltuieli pe 6 luni, pe categorii, hartă termică pe zile, tipărire/PDF și export CSV |
| **Planificare** | Calendar lunar cu salarii și facturi, înregistrare manuală sau automată |
| **Economii** | Obiective cu progres, contribuții și retrageri |
| **Persoane** | Cine îți datorează și cui datorezi, cu istoric și împrumuturi |
| **Datorii** | Creditori, sume totale și cât a rămas de plătit |
| **Carduri tichete** | Carduri de masă sau cadou, cu alimentări și plăți din sold |
| **Setări** | Solduri inițiale, bugete lunare, categorii proprii, backup și import JSON |

Interfața are meniu lateral, mod întunecat și se adaptează atât pe telefon, cât și pe desktop.

<p>
  <img src="docs/dashboard-mobil.png" alt="Dashboard mobil" width="70%">
  <img src="docs/setari-mobil.png" alt="Setări mobil" width="25%">
</p>

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

## 🔒 Date și confidențialitate

- Totul se salvează în `localStorage`, sub cheia `bugetul-meu-v1`.
- Nimic nu este trimis pe internet.
- Datele sunt legate de browserul și dispozitivul pe care le-ai introdus.
- Dacă ștergi datele site-ului din browser, le pierzi. **Fă backup JSON periodic** din *Setări*. Aplicația te avertizează după 30 de zile fără backup.
- ⚠️ Nu urca fișierul de backup pe GitHub, pentru că conține finanțele tale.

## 🗂 Structura proiectului

```
index.html            # structura paginii
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
