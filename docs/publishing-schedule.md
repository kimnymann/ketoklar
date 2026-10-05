# Automatisk udgivelsesplan

Publisher-workeren kontrollerer udgivelser hvert femte minut. Den følger tre uafhængige
indholdsspor:

- **Opskrifter:** én godkendt opskrift tirsdag, onsdag og fredag–søndag. Kategorien roterer mellem
  morgen, frokost, aften og lækkerier.
- **Artikler:** én godkendt videnskabs- eller livsstilsartikel hver mandag.
- **Anekdoter:** én godkendt anekdote hver torsdag.

En post er klar til køen, når `status = 'godkendt'` og `published_at` er tom.
Artikler og anekdoter vælges fra den ældste billedklare post først. Hvis hovedbilledet
eller et aktuelt billede i teksten mangler en godkendelse, springes posten over.
Udgivelsen genererer ingen billeder. Kørslen stopper efter én udgivelse, eller når køen er afprøvet.
Afviste poster bliver i køen, og årsagerne gemmes i kørselsresultatet.
En manuel genkørsel kan
ikke udgive endnu en post fra samme spor på den samme dato.

Når en artikel- eller anekdotekø har to eller færre udgivelser tilbage, skriver
workeren en særskilt advarsel og antallet `queueRemaining` i kørselsloggen.
Dermed kan de to køer overvåges hver for sig.

Artikel- og anekdotebilleder bruger en selvstændig redaktionel fotostil uden
opskrifternes faste krav om en servering og en tallerken. Kontrollen vurderer
emnets visuelle relevans, troværdighed og billedkvalitet. Opskrifter vurderes
fortsat mod rettens ingredienser og tilberedning. Begge spor kræver mindst
75/100. Artikelbilleder og målrettet manuel billedreparation har højst tre forsøg pr. klargøring; opskriftsreserven følger de vedvarende grænser beskrevet nedenfor.

## Billedreserve og opskriftsudgivelse – opdateret 27. september 2026

Opskrifter udgives fra kl. 08 dansk tid tirsdag, onsdag og fredag–søndag.
Kontrollen kører hvert femte minut resten af dagen, indtil én opskrift er udgivet.
Udgivelsen genererer ingen billeder. Kun upublicerede, godkendte opskrifter med
billedstatus klar, en billed-URL og seneste billedkontrol godkendt kan vælges.
Kategorierne roterer; seneste kategori bruges som sidste mulighed, hvis ingen
anden kategori har en færdig opskrift. En advarsel stopper ikke senere kontrol.

Reserveopbygningen er adskilt fra udgivelsen. Hver dag kl. 06.10–22.10 dansk tid
kan ét billede forsøges pr. kørsel, højst otte forsøg pr. dansk kalenderdag.
Målet er tre godkendte billeder pr. kategori, 12 i alt. Mindst ti klare opskrifter
dækker to uger med fem opskriftsdage om ugen. Kategorier med færrest reserver
prioriteres, og nye kandidater vælges før kandidater med tidligere fejl.
En global lås forhindrer parallelle reservekørsler. Hvert forsøg har 120 sekunders
tidsgrænse og tæller med i budgettet, også hvis kørslen afbrydes.

Indholdsafvisninger giver otte timers ventetid og højst to automatiske forsøg pr.
opskrift. Tekniske fejl giver én times ventetid og højst tre forsøg. Derefter
står opskriften som review i recipe_image_jobs, indtil billedet eller beskrivelsen
håndteres særskilt. Historiske gentagne indholdsafvisninger overføres til denne kø.
Billedkravet på mindst 75/100 er uændret. Intet afvist billede frigives automatisk.

Kl. 18.15 sendes højst én daglig mail, hvis en kategori har færre end tre reserver.
Mailen angiver reserveantal og antal opskrifter til billedgennemgang. Hvis ingen
opskrift kan udgives kl. 08.15, sendes højst én særskilt udgivelsesadvarsel pr. dag.

Autentificerede driftspunkter: GET /recipe-reserve-status viser reserver og
fejlkø; POST /prepare-recipe-reserve forsøger én kandidat med samme lås og budget
som automatikken. Den eksisterende /regenerate-images er til målrettet manuel
reparation, og ændrer ikke automatisk grænserne for den daglige reserveopbygning.

Status viser også totalReady, minimumForTwoWeeks og twoWeeksCovered. Det er en
optælling af godkendte poster, ikke en garanti for tilgængeligheden af eksterne
billedfiler. Før en ny reserve frigives, kontrolleres billedfilernes tilgængelighed.

### Redaktionel billedkontrol

Ti reservebilleder blev 27. september fremstillet med Codex imagegen og visuelt
kontrolleret mod opskrifterne. Alle ti bestod også Scout-kontrollen med 90–95 point.
Agentens særskilte visuelle kontrol registreres som codex-visual-editorial-review;
den må ikke omtales som en personlig godkendelse fra ejeren. De oprindelige
afvisninger bevares i historikken. Kontrolresultater og to ugers fremskrivning
ligger i output/reserve-20260927/udgivelsesoverblik.md.

Korte engelske beskrivelser af de færdige retter er tilføjet til disse opskrifter.
Kontrollen må ikke kræve hele opskriftens antal portioner på ét foto eller gætte
kødtype alene ud fra farven af hakket kød. Ret, hovedingredienser og tilberedning
skal stadig passe. Skål/tallerken bestemmes af retten, ikke af en tilfældig scene.

Den automatiske billedmodel i Cloudflare er fortsat Lucid Origin. Chatværktøjets
imagegen er en redaktionel reservevej, ikke en automatisk Cloudflare-integration.
Nye opskrifter uden en kontrolleret kort beskrivelse bruger fortsat den generelle
prompt. Gentagne afvisninger kræver derfor en konkret gennemgang af ret, prompt
og kandidatbillede; de må ikke blot nulstilles for at starte nye identiske forsøg.

## Artikelreserve – 28. september 2026

Artikler og anekdoter følger nu samme adskillelse mellem billedforberedelse og
udgivelse. Målet er to helt billedklare artikler og to anekdoter. De udgives som
hidtil mandag og torsdag; der vælges højst én i det relevante spor pr. dansk dato.
Udgivelsen kontrolleres hvert femte minut fra kl. 08 til dagens slutning. En
tidligere fejl eller tre mislykkede kontroller stopper ikke senere udgivelse.

Artikelreserven forberedes kl. 06.15–22.15 hver dag, én billedgenerering ad gangen,
højst otte pr. dansk dato. Hovedbilledet klargøres først og derefter ét billede i
teksten ad gangen. Alle aktuelle billedmarkører skal findes med uændret beskrivelse,
en billed-URL, klar-status og en seneste godkendt kontrol. En historisk godkendelse
efterfulgt af en afvisning tæller ikke. Gentagne indholdsfejl giver otte timers pause
og særskilt gennemgang efter to fejl. Tekniske fejl giver en times pause og særskilt
gennemgang efter tre fejl. Lås og 120 sekunders timeout beskytter mod overlap og
afbrudte kørsler. Grænserne gælder den automatiske reserveopbygning.

GET /article-reserve-status og POST /prepare-article-reserve kræver udgivelsesnøglen.
Kl. 18.20 gives højst én daglig advarsel om lav artikelreserve. Udgivelsesadvarsler
er også begrænset til én pr. dansk dato. Opskrifternes reserve har sit eget budget.

Kontrolleret 28. september: Dagens artikel blev allerede udgivet kl. 08.03 dansk
tid. Artiklerne om næringsdeklarationer og enkle måltider har fået nye billeder til
reserven. Etikettebilledet er særskilt visuelt godkendt af Codex: Den automatiske
kontrol påstod læsbar tekst uden at kunne angive konkrete ord; den oprindelige
afvisning er bevaret sammen med agentens begrundelse. Ingen ekstra artikel er
udgivet som del af denne reparation.

