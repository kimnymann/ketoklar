# Artikelopdateringer

## Produktionsbatch, klargjort 5. september 2026

Brug `seed_articles_batch2.sql` som den aktuelle, samlede version af de tre
artikler. Den er indlæst i produktionsdatabasen, hvor `updated_at` også er
tilføjet. Batchen opdaterer kun uudgivne rækker og ændrer ikke udgivne artikler.
GitHub-workflowen er udvidet til at indlæse denne batch sammen med de øvrige seeds.

Køen følger rækkefølgen ketose, opstart, faste. Forventede datoer er 7., 14. og
21. september klokken 08 dansk tid, forudsat normal drift og godkendte billeder.
Opstart har slug `start-paa-keto-kold-tyrker-eller-gradvis`; den eksisterende
`keto-for-begyndere-guide` skal bevares uændret. Batchens interne links bruger
den nye adresse. Links til senere artikler bliver tilgængelige ved deres udgivelse.

Kør ikke de historiske 0007/0008-filer mod produktion: de brugte begynderguidens
adresse. Indholdet fra dem er samlet og korrigeret i den nye batch. Afsnittet
nedenfor dokumenterer kun det oprindelige lokale revisionsforløb.

## Historisk lokalt revisionsforløb

`0008_improve_article_content.sql` reviderer de tre artikler fra 0007 og
tilføjer `articles.updated_at`. Udgivelsesdato og status bevares.

Kør 0007, hvis artiklerne endnu ikke findes, og derefter 0008 mod en eksisterende
database, før den nye artikeltemplate og sitemap udgives. 0008 skal kun køres én
gang; den indeholder en kolonneændring. Den nuværende GitHub-workflow kører kun
skema og seed-filer og anvender ikke automatisk filer i `migrations/`.

Ved en helt ny database indeholder `schema.sql` allerede kolonnen. Her skal
kolonneændringen i 0008 springes over, mens indholdsændringerne stadig anvendes
efter 0007. Følg samme praksis som for projektets øvrige skemamigrationer.

Ved senere substantielle artikelrettelser opdateres `updated_at` sammen med
indholdet. Datoen bruges både synligt på artiklen, som `dateModified` og som
`lastmod` i sitemap. Den må ikke sættes til dagens dato ved hver sidevisning.
