# Lanceringstjek 15. september 2026

- 19 tests bestået: opskriftsforsøg/genstart, artikel- og anekdotefallback samt transaktionel anonymisering af bedømmelser.
- Web-build bestået. Webversion `91ee34c4-09e5-4fe4-a2c4-1206476069cd` deployet med privatlivssider, cookieoplysninger, lokale skrifttyper og rettelse af lange hero-overskrifter.
- Publisherversion `1b543313-b709-4c78-932e-ac3b521a9ebc` deployet. Cloudflare bekræftede både `*/5 * * * *` og `30 * * * *`.
- Produktion har `recipe_rating_totals` og 0 udløbne bedømmelser ved kontrol. Morgendagens dagsplan findes uden fejl. Første nye morgenkørsel og faktisk timeoprydning er endnu ikke observeret.
- Live: privatlivsside og cookieoplysninger åbner; cookiepanelet kan genåbnes og lukkes. Opskriftens canonical, index-metadata, billeder og bedømmelseswidget er til stede. Ingen rigtig stemme indsendt.
- Browserens viewport-override blev ikke anvendt (rapportering forblev 1280px). Ny mobilverifikation er derfor ikke gennemført; tidligere mobilrettelse er bevaret.
- Cloudflare Web Analytics var Enable. Sat til Disable og gemt i dashboard. Scriptet var stadig til stede ved første kontrol umiddelbart efter; udbredelse skal verificeres igen.
- Zero Trust-reglen `ketoklar - Cloudflare Workers` beskytter produktion og previews. Ingen ændring af adgang er gemt endnu. Offentlig åbning og efterfølgende anonyme HTTP-kontroller mangler.

Indholdsbatches og deres workflowændringer er ikke medtaget i lanceringscommitten.
