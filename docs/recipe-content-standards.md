# Indholdsstandard for opskrifter

Denne fil beskriver det niveau, alle opskrifter på Ketoklar skal leve op til.
Gælder både eksisterende og alle fremtidige batches, uanset hvem eller hvad
der skriver dem.

De redaktionelle SEO-krav findes i `docs/content-seo-standard.md` og skal
kontrolleres sammen med kravene her, før en batch godkendes.

## Fremgangsmåde

Skriv ALDRIG korte, generiske trin som "Steg kyllingen" eller "Bag i ovnen".
Hvert trin skal inkludere, hvor det er relevant:

- **Konkret tid**: "steg i 6-7 minutter", ikke bare "steg kyllingen"
- **Konkret temperatur eller varmetrin**: "ved middelvarme", "ved 180 grader"
- **Konsistens eller visuelt tegn på at trinnet er færdigt**: "til massen er
  jævn og let skummende", "til en kniv kommer ren ud", "til hviden er stivnet,
  men blommen stadig er blød"
- **Teknik, ikke bare handling**: skal det piskes, vendes forsigtigt, eller
  blot røres sammen? Det er ikke det samme, og det betyder noget for resultatet.

Tommelfingerregel: en, der aldrig har lavet retten før, skal kunne følge
trinnene uden at gætte på tid, varme eller konsistens.

## Tips

Hver opskrift skal have præcis ét tip i `recipes.tips`, der giver reel værdi,
ikke en gentagelse af noget der allerede står i fremgangsmåden. Gode tips er typisk:

- En fejl, folk ofte laver ("brug ikke frossen spinat, det gør...")
- Et tegn på at retten er færdig, som er let at overse
- En holdbarheds- eller opbevaringsdetalje
- En erstatning eller variation, der stadig holder sig inden for keto

Undgå generiske tips som "server og nyd" eller "tilpas efter smag", de
tilføjer ikke noget.

## Ingredienser

Ingrediens-kategorisering (mejeri, kød/fisk, frugt/grønt, kolonial, frost)
sker automatisk ud fra navnet, se `src/lib/ingredientCategory.ts`. Ingen
handling nødvendig ved nye opskrifter, men brug gerne almindelige, danske
ingrediensnavne, så den automatiske genkendelse rammer korrekt (fx "kylling"
frem for et mærkenavn).

## Billeder

Håndteres automatisk af publisher-workeren, se
`workers/publisher/src/generateImage.ts`, `imagePrompt.ts` og `imageReview.ts`.

- Billedprompten bygges af titel, hele ingredienslisten og fremgangsmåden.
- Køens billeder klargøres dagligt kl. 05:00 UTC, før udgivelsen kl. 06:00 UTC.
- En separat visionmodel kontrollerer rettens type, hovedingredienser og eventuelle
  opdigtede madvarer. Der kræves mindst 75/100.
- Et afvist billede genereres automatisk op til to gange mere med kontrollens rettelse.
- Hvis alle tre forsøg afvises, sættes billedet til `fejlet`, og opskriften udgives
  ikke automatisk. Kandidater og begrundelser gemmes til kontrol.
- Efter en ny batch kan den beskyttede `POST /prepare-images` kaldes for at
  klargøre billederne med det samme; ellers samler den daglige kørsel dem op.
- Den beskyttede `POST /regenerate-images` kan bruges til målrettet at erstatte
  billeder for op til fem angivne opskriftsslugs.
