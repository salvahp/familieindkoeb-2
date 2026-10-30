# Familieindkøb – jeres egen indkøbsapp

En dansksproget og mobilvenlig hjemmeside med aktive indkøbslister, afkrydsning, antal, kategorier, arkiv, søgning, genbrug af hele lister, deling i familien **og prisjagt med danske dagligvarepriser og tilbud.**

## 1. Prøv hjemmesiden med det samme (uden opsætning)

Åbn `index.html` i browseren. Den fungerer som **lokal prøveudgave**, også uden at du opretter en konto. Der er eksempellister, du kan prøve funktionerne på.

- Opret eller omdøb en indkøbsliste.
- Tilføj varer med valgfrit antal, og vælg eventuelt kategori. Appen kan foreslå kategori ud fra varenavnet.
- Tryk på firkanten ved hver vare for at krydse den af, når du handler.
- Vælg **Gem i arkiv** for at bevare den gamle liste og dens afkrydsninger.
- Vælg **Arkiv** og søg efter et listenavn eller en vare. Tryk **Genbrug** for at lave en komplet ny kopi, hvor alle varer er ukrydsede.

**Vigtigt:** Indkøbslisterne i lokal prøveudgave ligger kun i *den aktuelle browsers* lokale lager. Det deles ikke mellem familiemedlemmer. Hvis du sletter browserdata eller bruger en anden enhed, følger de lokale lister ikke med. For rigtig familiedeling skal du følge opsætningen nedenfor.

## NYT: Prisjagt & tilbud – sådan virker det

Du kan bruge prisjagten fra **en almindelig browser**, også uden at oprette en konto eller betale for en ekstra prisnøgle. Det kræver **internet**, selv når selve listen bruges lokalt.

1. Gå til **Prisjagt & tilbud** i venstremenuen, eller åbn en indkøbsliste og tryk **Find tilbud**.
2. Vælg indkøbslisten, og tryk **Scan varer**. Som standard scannes kun varer, I endnu ikke har krydset af.
3. Appen søger hos [Madpris](https://madpris.gratis.dk/) via deres [offentligt dokumenterede API](https://madpris.gratis.dk/api-dokumentation). Varenavnene sendes til Madpris til prisopslag; der sendes ikke familiens navn eller login til Madpris.
4. Hver vare får et **foreslået produktmatch**. Gennemgå *mærke, produkttype og størrelse*. Brug feltet **Matchet produkt** til at vælge en anden variant, eller søg igen. Du kan også slå en præcis EAN/stregkode op ved at indtaste dens 8–14 cifre. Appen afkoder ikke stregkoder direkte med telefonkameraet.
5. Kontrollér feltet **Antal pakker**. Fx beregnes 2 L som to 1-liters pakker, hvis den valgte vare er 1 L; nogle mængder kan ikke omregnes automatisk, og så vises en advarsel.
6. Se **billigste registrerede pris på varen**, butikker med tilbud og **billigste butik for en komplet kurv**. En butik tæller kun med i den samlede rangering, hvis den har en registreret nyere pris for **alle** de valgte varer. Desuden vises den teoretisk billigste pris ved at handle på tværs af butikker – uden transporttid eller kørselsudgifter.
7. Brug butikschipsene til at fravælge kæder, hvor I ikke ønsker at handle.

**Korrekt læsning af resultaterne**

- Der vises kun priser med en observeret dato inden for de seneste **7 dage**. Historiske og tilbageførte normalpriser uden ny observation tæller ikke med. Det er registrerede priser, **ikke priser i realtid eller garanti for lagerstatus**. Priser kan variere mellem fysiske butikker, og sortimenterne kan være ufuldstændige.
- Produktsøgning kan finde en forkert variant; **kontrollér altid forslaget**. Butikker kan kun sammenlignes retvisende, når det faktisk er samme vare/pakningsstørrelse.
- Markeringen **Tilbud** stammer fra kildens `on_sale`-felt, ikke fra en beregning, som vi har opfundet. Den kan derfor mangle for faktiske tilbud eller være forsinket.
- Kildens offentlige API har ifølge dokumentationen en grænse på **500 kald pr. IP-adresse pr. dag** uden nøgle. Et scan kræver typisk ét opslag pr. vare (maks. 30 varer ad gangen). Gentagne identiske opslag gemmes kortvarigt i browserens hukommelse. Hvis API'et er utilgængeligt, vises en fejl – **ingen fiktive priser**.
- API'et oplyser, at det tillader direkte browseradgang (CORS). Hvis din browser, dit netværk eller datatjenesten blokerer kald, kan prisjagten være utilgængelig, mens indkøbslisterne stadig virker.
- Adgang fra **telefonen** er nemmest, hvis appen hostes online via HTTPS. Prissammenligningen kan også bruges uden at aktivere Supabase-familiedeling.

**Datakilde:** [Madpris](https://madpris.gratis.dk/) / [API-dokumentation](https://madpris.gratis.dk/api-dokumentation). Resultaterne er forbeholdt datakildens tilgængelighed og dækning.

---

## 2. Aktiver rigtig familiedeling (Supabase)

Dette gør hjemmesiden til en fælles løsning, hvor I har separate brugerkonti, samme familielister, løbende synkronisering og gemte lister online.

### Trin A – opret databasen

1. Gå til https://supabase.com og opret en konto.
2. Opret et nyt projekt (vælg et navn, fx `familieindkoeb`, og gem databaseadgangskoden et sikkert sted).
3. Åbn **SQL Editor** i projektet, vælg **New query**.
4. Åbn filen `database.sql` fra denne mappe, kopiér **hele** indholdet ind, og tryk **Run**. Dette opretter databasen, adgangsreglerne, familiekoderne og synkroniseringen.
5. Under **Authentication → Providers → Email** skal e-mail-login være aktiveret (det er normalt standard). Du må gerne beholde e-mail-bekræftelse slået til.

### Trin B – forbind hjemmesiden til databasen

1. Under projektets **Settings → API** / **Connect** finder du **Project URL** og en **publishable key** (eller legacy **anon/public key**). Menupunkterne kan hedde lidt forskelligt.
2. Åbn `config.js` i en teksteditor og indsæt begge værdier, fx:

   ```js
   window.APP_CONFIG = {
     supabaseUrl: 'https://DIT-PROJEKT.supabase.co',
     supabaseAnonKey: 'DIN-PUBLISHABLE-ELLER-ANON-KEY'
   };
   ```

3. Gem filen. **Brug aldrig `service_role` eller en secret API key her.** De er private og må ikke ligge i en hjemmeside. Publishable/anon-nøglen er beregnet til browserbrug sammen med database-reglerne i `database.sql`.

### Trin C – gør hjemmesiden tilgængelig på familiens telefoner

1. Gå til https://app.netlify.com/drop og log ind eller opret en gratis Netlify-konto.
2. Træk den **udpakkede mappe** `familieindkoeb` ind i drop-feltet. Filen `index.html` skal ligge i roden af mappen.
3. Du får en `https://...netlify.app`-adresse, som I kan åbne på alle telefoner og computere.
4. Gå tilbage til Supabase → **Authentication → URL Configuration**. Sæt **Site URL** til den nye Netlify-adresse. Tilføj også denne adresse til **Redirect URLs** (eventuelt med `/**` til sidst), så e-mail-bekræftelse kan vende tilbage til appen.
5. Opdater Netlify-deployet ved at trække mappen ind igen, hvis du ændrer `config.js` efter første upload.

### Trin D – invitér familien

1. Åbn hjemmesiden. Tryk **Opret konto** og registrér dig med e-mail og adgangskode. Bekræft e-mailen, hvis Supabase har sendt en mail.
2. Vælg **Opret en familie**, fx `Familien Hansen`.
3. Opret den første indkøbsliste.
4. Tryk **Del med familien**, kopier familiekoden og send den til de andre.
5. De andre åbner **samme hjemmesideadresse**, opretter deres egne konti og vælger **Deltag i en familie**. Så skriver de koden.
6. Herefter ser alle familiemedlemmer de samme lister. Ændringer synkroniseres løbende, også når I handler fra hver jeres telefon.

**Bemærk:** Supabase kræver internet til familiedeling. Den lokale prøveudgave fungerer uden internet, når filerne er hentet. Appen kan installeres på hjemmeskærmen fra en browser, når den er hostet med HTTPS, men synkroniserede indkøb kræver stadig internetforbindelse.

## 3. Funktioner

| Funktion | Lokal prøveudgave | Fælles online-version |
|---|---|---|
| Opret, omdøb, slet lister | Ja | Ja |
| Tilføj, rediger og fjern varer | Ja | Ja |
| Antal og varekategorier | Ja | Ja |
| Kryds varer af | Ja | Ja |
| Gem færdig liste i arkiv | Ja | Ja |
| Søg på navn eller varer i arkiv | Ja | Ja |
| Genbrug hel liste med ukrydsede varer | Ja | Ja |
| Gem lister efter genstart | Ja, i samme browser | Ja, i databasen |
| Familie-login og familiekode | Nej | Ja |
| Scan indkøbsliste for registrerede priser og tilbud | Ja, med internet | Ja, med internet |
| Sammenlign komplette indkøbskurve på tværs af butikker | Ja, når priskilden har dækning | Ja, når priskilden har dækning |
| EAN-opslag ved at indtaste en stregkode | Ja, med internet | Ja, med internet |
| Synkronisering mellem telefoner | Nej | Ja |

## 4. Sikkerhed og data

- Alle konti er personlige. Kun medlemmer af en familie kan læse og ændre dens lister (Supabase Row Level Security).
- Familiekoden giver adgang til familiens lister. Send den derfor kun til personer, du stoler på. Alle familiemedlemmer har samme redigeringsadgang, også til sletning af lister.
- `database.sql` giver bevidst ikke webbrowseren adgang til at oprette familiemedlemmer direkte uden en familiekode.
- Hjemmesiden indeholder ikke sporing eller reklamer. Font-filer hentes fra Google Fonts; systemskrifter bruges som reserve.
- En liste slettes **kun**, når du eksplicit vælger Slet. Arkivering bevarer listen, og kopiering efterlader originalen uændret.
- Hvis du skal bruge løsningen i længere tid, bør du tage database-backups i Supabase efter behov.

## 5. Hurtig fejlfinding

**"Kan ikke forbinde til databasen"**: Kontrollér at både Project URL og publishable/anon key i `config.js` er korrekte og at du har internet.

**"permission denied" eller lister kan ikke gemmes**: Kontrollér at `database.sql` er kørt helt færdigt i det rigtige Supabase-projekt.

**Bekræftelsesmail sender dig til en forkert adresse**: Kontroller Site URL og Redirect URLs i Supabase Authentication.

**Et familiemedlem kan ikke se listerne**: Personen skal bruge sin egen konto og tilslutte sig med familiekoden. Alle skal åbne den samme hostede hjemmeside med samme `config.js`.

**Ændringer vises ikke med det samme på en anden telefon**: Kontrollér forbindelsen og opdater siden. Appen forsøger at synkronisere via Supabase Realtime og kontrollerer desuden for nye data cirka hvert 30. sekund.

**Jeg har mistet lister i lokal prøveudgave**: Browserlager kan være blevet slettet. Derfor anbefales den fælles online-version til reel brug.

---

**Filer:** `index.html` (hjemmesiden), `styles.css` (design), `app.js` (indkøbslister), `prisjagt.js` (pris-API og prisjagt), `config.js` (tilslutning), `database.sql` (database og adgangsregler), `manifest.webmanifest`, `sw.js`, `assets/icon.svg`.
