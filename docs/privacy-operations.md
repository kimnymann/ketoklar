# Persondata: beslutninger og drift

## Bekræftet af Kim Sax den 8. september 2026

- Dataansvarlig: Sax Gruppen, CVR 38239031, Idylvænget 19, 6000 Kolding. Kontakt: hej@ketoklar.dk.
- Cloudflare: brugeren har bekræftet, at aftalen dækker Ketoklar og Sax Gruppen. Hosting, D1-database og Turnstile.
- Nordicway: e-mailleverandør med eksisterende DPA under Sax Gruppen, bekræftet af brugeren.
- Godkendt: almindelige e-mailhenvendelser slettes 6 måneder efter afslutning; identifikatorer i bedømmelser fjernes efter 12 måneder; logs begrænses til kortest nødvendige periode; backupudløb dokumenteres og sletninger respekteres ved gendannelse.

Aftalerne er bekræftet af ejeren, ikke selvstændigt gennemgået i leverandørkontiene. Gem daterede aftalekopier og dokumentation for aftalepart/konto internt. Kontroller underdatabehandlere, faktiske behandlingslande og overførselsgrundlag for de anvendte tjenester.

## Tekniske ændringer og aktivering

Informationsbanner, politikker, lokale skrifttyper og Turnstile ved aktivt valg af stjerner er implementeret. Ingen statistik- eller annoncesporing i kildekoden. Personlige API-svar må ikke caches.

Bedømmelsesoprydning er klar i koden, men bliver først aktiv efter udrulning:

1. Anvend `migrations/0009_rating_retention.sql` på D1 før webside og publisher opdateres. Samme idempotente struktur findes i `schema.sql`, som den eksisterende workflow anvender.
2. Udrul websiden og publisheren inklusive dens nye timeplan `30 * * * *` (UTC).
3. Kontroller næste kørsel: loggen `ratingRetention` viser kun antal behandlede rækker. Kontroller at der ikke er rækker med `created_at <= datetime('now', '-12 months')` efter oprydning. En fejl skal undersøges og oprydningen genkøres; tavshed er ikke bevis for succes.
4. Kontroller, at bedømmelsesantal og gennemsnit er uændrede, og at nye bedømmelser stadig kan ændres.

Oprydningen flytter udløbne stemmer til summer pr. opskrift og sletter hele de individuelle rækker i én D1-transaktion. Arkivet indeholder kun opskrift-ID, samlet antal stjerner og antal stemmer. Ingen browserhash, individuel stemme, ID eller tidsstempel gemmes i arkivet. Fristen regnes fra oprettelse og forlænges ikke ved ændring. Kørsel hver time indebærer normalt højst en times forsinkelse efter udløb. Genkørsel tæller ikke stemmer dobbelt. Anonyme summer slettes sammen med opskriften.

## E-mail: procedure hos Sax Gruppen

Hjemmesiden kan ikke slette post i Nordicway. Proceduren skal aktiveres af den, der håndterer postkassen:

- Registrer afslutningsdato for almindelige henvendelser og en sletedato 6 måneder senere, eksempelvis via mapper pr. afslutningsmåned og en opgaveliste.
- Gennemgå sletninger mindst ugentligt og slet før fristen overskrides, også kopier i Sendt post, arkiver, papirkurv og eventuelle videresendte postkasser eller lokale mailarkiver.
- Gem kun særskilt nødvendigt materiale ved dokumenteret retlig pligt eller konkret retskrav; noter årsag og næste vurderingsdato.
- Noter kontroltidspunkt og antal slettede henvendelser uden at kopiere beskedindhold eller persondata til en slettejournal.
- Afklar Nordicways muligheder for automatisk sletning og backupudløb. En regel baseret på modtagelsesdato svarer ikke nødvendigvis til 6 måneder efter afslutning.

## Logs og backups: åbne driftskontroller

Der er ikke verificeret konkrete frister i leverandørkontiene. Registrer tjeneste, oplysningstyper, faktisk log-/backupperiode, indstillinger og begrundelse. De offentlige politikker lover derfor ikke et bestemt antal dage for disse data.

Ved gendannelse: begræns adgang, kør bedømmelsesoprydning før siden åbnes igen, og genanvend tidligere individuelle sletteanmodninger. Hos Nordicway skal slettede henvendelser slettes igen efter gendannelse. Afklar, hvordan udløb og sletteanmodninger håndteres i leverandørstyrede backups.

## Rettigheder og sikkerhed

Sax Gruppen håndterer henvendelser på hej@ketoklar.dk og svarer som udgangspunkt inden én måned. Identificer kun brugeren i nødvendigt omfang. Bedømmelser kan findes via SHA-256 af browserens `kk_rating_id`; værdien er HttpOnly og må ikke kopieres til almindelige logs. Verificer sikkert kontrollen over browseridentifikatoren før udlevering/sletning. Slet kun matchende individuelle rækker. Efter anonymisering findes ingen individuel forbindelse, og der må ikke indsamles ekstra data for at genidentificere en person.

Dokumenter navngivne administratorer, adgangsbehov, MFA og en procedure for sikkerhedsbrud. Vurder og dokumenter interesseafvejningen for drift, sikkerhed og troværdige bedømmelser samt nødvendigheden af funktionernes lokale lagring.

Før offentliggørelse kontrolleres det offentlige domæne for leverandørindsatte scripts, cookies og netværkskald, også under en Turnstile-udfordring. Fremtidig statistik eller markedsføring kræver forudgående samtykke, let afvisning og tilbagetrækning. Bannerets “Forstået” er aldrig et samtykke.

Kilder: https://www.datatilsynet.dk/regler-og-vejledning/behandlingssikkerhed/sletning og https://www.cloudflare.com/cloudflare-customer-dpa/.

## Offentliggjort og kontrolleret 8. september 2026

- Migration 0009 anvendt på den eksisterende produktionsdatabase. Der var 0 bedømmelser før ændringen; ingen eksisterende brugerbedømmelser blev ændret.
- Websideversion: 554db2c6-9868-4f7f-9322-4528461299d6.
- Publisherversion: 3580a831-64ac-4543-b0fc-cd3de9a62f84. Cloudflare bekræftede den nye timeplan sammen med de tre eksisterende publiceringstidspunkter. Første faktiske timekørsel er endnu ikke observeret.
- Cookie- og privatlivspolitik kontrolleret på ketoklar.dk i browseren. Bannerets lukning, genindlæsning og genåbning verificeret; udseende kontrolleret.
- Lokale tests verificerer grænsen ved 12 måneder, bevarelse af antal/gennemsnit, genkørsel uden dobbeltoptælling og tilbagerulning ved databasefejl. Webside og publisher bygger korrekt.
- D1-oplysninger viser region ENAM og ingen fast jurisdiction. Databasen er altså ikke dokumenteret EU-lokaliseret. Kontroller overførselsgrundlag og vurder, om fremtidig EU-lokalisering er ønskelig; ingen flytning er foretaget.

Leverandørkilder kontrolleret samme dag:

- Cloudflare Workers Logs: 3 dage på Free og 7 dage på Paid. Dette vedrører produktet Workers Logs, ikke alle sikkerhedslogs, og kontoplan/aktivering er endnu ikke verificeret. https://developers.cloudflare.com/workers/observability/logs/workers-logs/
- D1 Time Travel: 7 dage på Free og op til 30 dage på Paid, automatisk aktiv. Den konkrete kontoplan er endnu ikke verificeret. https://developers.cloudflare.com/d1/reference/time-travel/
- Nordicways handelsbetingelser siger 14 dages backup på fjernlokation i et EU-land: https://nordicway.dk/handelsbetingelser/
- Nordicways mailproduktside nævner gendannelse op til 30 dage: https://nordicway.dk/billigt-mailhotel/
- Forskellen mellem 14 og 30 dage skal afklares for netop mailaftalen. Bed om oplysning om mailbackup, logfrister og sletning efter gendannelse. Ingen henvendelse er sendt til leverandøren.

Åbent: adgang til Nordicway/mailklient og aktivering af den godkendte mail-sletterutine; konkret plan og log-/backupfrister; gennemgang af overførselsgrundlag; fuld netværkskontrol under Turnstile-udfordring. Ovenstående er ikke en erklæring om fuld GDPR-overholdelse.

Mailstatus: Kim Sax har bekræftet, at Apple Mail er sat op til den aftalte sletterutine. Nordicways konkrete mailbackupfrist er fortsat ubekræftet (14 dage i handelsbetingelserne, 30 dage på mailproduktsiden).

Rettelse efter fuld gennemgang af backupafsnittet: Nordicways handelsbetingelser og mailproduktside beskriver også en tredje lokation med 3 måneders backup. Tidligere opsummering med kun 14/30 dage var ufuldstændig. Standardbeskrivelsen er 3 dage lokalt, 14 dage på fjernlokation og 3 måneder på en yderligere EU-lokation. Support bør bekræfte, at dette gælder ketoklar.dk-mail, hvornår slettede mails udgår af alle kopier, og hvordan sletninger respekteres ved gendannelse. Kilde: https://nordicway.dk/handelsbetingelser/ og https://nordicway.dk/billigt-mailhotel/.
