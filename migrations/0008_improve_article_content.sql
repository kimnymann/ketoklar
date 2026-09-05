-- Redaktionelle rettelser; kør efter 0007. Bevarer publiceringsstatus og dato.
ALTER TABLE articles ADD COLUMN updated_at TEXT;

UPDATE articles SET body = replace(body, 'Ketose bliver ofte beskrevet', '**Kort svar:** Ketose er en tilstand, hvor leveren producerer flere ketonstoffer fra fedt, typisk fordi du spiser meget få kulhydrater. Du kan måle den med en blodketonmåler, men et højt ketontal er ikke i sig selv et mål for sundhed eller fedttab.

Jeg har samlet forklaringen på ketose, målingerne og de vigtigste forbehold her. Ketose bliver ofte beskrevet') WHERE slug = 'ketose-saadan-virker-det';

UPDATE articles SET body = replace(body, 'De kan bruges som energi af blandt andet muskler og hjerne.', 'BHB og acetoacetat kan bruges som energi af blandt andet muskler og hjerne; acetone udskilles blandt andet gennem udåndingen.') WHERE slug = 'ketose-saadan-virker-det';

UPDATE articles SET body = replace(body, 'Tallet er ikke et kvalitetsstempel på kosten, og højere er ikke automatisk bedre.', 'Tallet er ikke et kvalitetsstempel på kosten, og højere er ikke automatisk bedre. [Læs gennemgangen af ketonmåling](https://pmc.ncbi.nlm.nih.gov/articles/PMC12434970/).') WHERE slug = 'ketose-saadan-virker-det';

UPDATE articles SET body = replace(body, 'Et praktisk udgangspunkt er:', '**Sådan tæller du kulhydrater:** Forskningsstudier og kostbøger bruger ikke altid samme definition. På danske og øvrige EU-næringsdeklarationer angives kostfibre separat fra kulhydrat. Du skal derfor ikke trække kostfibre fra tallet for kulhydrat igen. Amerikanske etiketter angiver normalt fibre som en del af »total carbohydrate«; derfor møder du også begrebet »net carbs«. Brug samme opgørelsesmetode gennem hele din plan, og kontrollér, hvad en opskrift eller app faktisk tæller. Sukkerarter er en del af kulhydrattallet, ikke hele tallet. [Om næringsdeklarationer](https://foedevarestyrelsen.dk/kost-og-foedevarer/maerkning-og-markedsfoering-af-foedevarer/generelle-maerkningskrav/naeringsdeklaration).

Et praktisk udgangspunkt er:') WHERE slug = 'ketose-saadan-virker-det';

UPDATE articles SET body = replace(body, 'kan du følge vores', 'kan du følge min') WHERE slug = 'ketose-saadan-virker-det';

UPDATE articles SET body = replace(body, 'Et kulhydratrigt måltid kan få BHB til at falde i timer eller et døgn, men responsen afhænger af portionen, din aktivitet og din metaboliske situation.', 'Et kulhydratrigt måltid kan sænke BHB og afbryde den målbare ketose. Hvor længe det varer, afhænger blandt andet af portionen, din aktivitet og din metaboliske situation; der findes ikke en sikker tidsgrænse, som gælder for alle.') WHERE slug = 'ketose-saadan-virker-det';

UPDATE articles SET body = replace(body, 'Et studie fandt, at urinstrimler ofte overså mild ketose.', '[Et studie under stærk energirestriktion](https://pmc.ncbi.nlm.nih.gov/articles/PMC7556427/) fandt, at urinstrimler ofte overså mild ketose. Resultatet beskriver denne konkrete undersøgelse og er ikke et præcist mål for alle urinstrimlers følsomhed i enhver situation.') WHERE slug = 'ketose-saadan-virker-det';

UPDATE articles SET body = replace(body, 'SGLT2-hæmmere kan i sjældne tilfælde give ketoacidose uden meget højt blodsukker.', 'SGLT2-hæmmere kan i sjældne tilfælde give ketoacidose uden meget højt blodsukker. Medicinændringer skal aftales med din behandler. [Om medicin og lavkulhydratkost](https://pmc.ncbi.nlm.nih.gov/articles/PMC6592353/).') WHERE slug = 'ketose-saadan-virker-det';

UPDATE articles SET body = replace(body, '## Hvad er næste skridt?', '## Hold også øje med kolesterol og kostens kvalitet

At du føler dig godt tilpas, fortæller ikke alt om blodlipiderne. LDL-kolesterol kan stige hos nogle på keto. I [Keto-Med-studiet](https://pubmed.ncbi.nlm.nih.gov/35641199/) med deltagere med prædiabetes eller type 2-diabetes var LDL højere efter den ketogene kost end efter den sammenlignede middelhavskost, mens triglycerider faldt mere. Resultaterne understreger, at forskellige sundhedsmål kan udvikle sig forskelligt.

Hvis du fortsætter med keto, kan du drøfte behovet for opfølgning på blodlipider, blodtryk og eventuelt blodsukker med din læge. Prioritér umættede fedtkilder, grøntsager og tilstrækkelige fibre og protein. En ketonmåler kan ikke erstatte den vurdering. [Anbefalinger om klinisk opfølgning ved ketogen behandling](https://pmc.ncbi.nlm.nih.gov/articles/PMC8610544/).

## Hvad er næste skridt?') WHERE slug = 'ketose-saadan-virker-det';

UPDATE articles SET body = replace(body, 'Du kan gå direkte fra din nuværende kost', '**Kort svar:** Du kan begynde direkte på keto eller trappe kulhydraterne ned over nogle uger. Der er ikke solid dokumentation for, at én af metoderne er bedst for raske voksne. Valget handler også om din hverdag, dit helbred og eventuel medicin.

Jeg har her samlet to praktiske forslag til opstart. Ugeplanerne er eksempler, som kan tilpasses; de er ikke klinisk afprøvede behandlingsprogrammer.

Du kan gå direkte fra din nuværende kost') WHERE slug = 'keto-for-begyndere-guide';

UPDATE articles SET body = replace(body, 'Et randomiseret studie hos børn i medicinsk ketogen behandling fandt samme effekt, men færre bivirkninger ved gradvis opstart end ved opstart med faste. Det kan ikke overføres direkte til voksne, men det støtter, at en hård start ikke er nødvendig for at opnå ketose.', '[Et randomiseret studie hos børn med epilepsi](https://pubmed.ncbi.nlm.nih.gov/16302862/) fandt lignende effekt på anfald og færre af visse bivirkninger ved gradvis medicinsk opstart sammenlignet med opstart med faste. Det sammenlignede ikke en direkte kostomlægning med tre ugers kulhydratnedtrapning hos raske voksne og kan derfor ikke afgøre, hvilken af mine to forslag der er bedst.') WHERE slug = 'keto-for-begyndere-guide';

UPDATE articles SET body = replace(body, 'Yngre raske voksne tåler ofte hurtige kostskift, men de kan stadig få gener.', 'Man kan ikke ud fra alder alene forudsige, hvor let en kostomlægning bliver. Også yngre voksne kan få gener.') WHERE slug = 'keto-for-begyndere-guide';

UPDATE articles SET body = replace(body, 'En praktisk syvdages start:', 'En praktisk syvdages start — et forslag, ikke en fast tidsplan for kroppens tilvænning:') WHERE slug = 'keto-for-begyndere-guide';

UPDATE articles SET body = replace(body, '## Hvad sker der i kroppen de første uger?', '## Tre måltider, du kan begynde med

Jeg vil gøre planen konkret med tre eksempler fra Ketoklar. Vælg portionsstørrelser efter dit behov, og se på dagens samlede kost frem for én enkelt ret.

- **Morgen:** [Æggemuffins med spinat og feta](/opskrifter/aeggemuffins-spinat-feta). En portion kan forberedes, så morgenmaden ikke kræver et større køkkenmøde.
- **Frokost:** [Cæsarsalat med kylling](/opskrifter/caesarsalat-kylling). Et eksempel på protein og grønt i samme måltid.
- **Aften:** [Ovnbagt laks med smørsauce og broccoli](/opskrifter/ovnbagt-laks-smoersauce). Laksen bidrager med umættet fedt; tilpas sauce og tilbehør til resten af dagens mad.

## Hvad sker der i kroppen de første uger?') WHERE slug = 'keto-for-begyndere-guide';

UPDATE articles SET body = replace(body, 'ikke alle symptomer skyldes nødvendigvis ketose.', 'ikke alle symptomer skyldes nødvendigvis ketose. [Forskningsoversigten om symptomer ved opstart](https://www.frontiersin.org/journals/nutrition/articles/10.3389/fnut.2025.1538266/full) beskriver både generne og manglerne i dokumentationen for lindrende tiltag.') WHERE slug = 'keto-for-begyndere-guide';

UPDATE articles SET body = replace(body, 'doser kan skulle ændres hurtigt.', 'doser kan skulle ændres hurtigt. Ændr ikke selv din medicin. [Om medicintilpasning ved lavkulhydratkost](https://pmc.ncbi.nlm.nih.gov/articles/PMC8380766/).') WHERE slug = 'keto-for-begyndere-guide';

UPDATE articles SET body = replace(body, 'Faste spænder fra', '**Kort svar:** Periodisk faste begrænser, hvornår du spiser. Du behøver hverken springe et bestemt måltid over eller nøjes med ét måltid dagligt. Flydende kost med næring er ikke en energifaste, og en til to uger uden mad kræver lægelig vurdering og overvågning.

Jeg gennemgår her forskellene, så du kan vurdere både muligheder og begrænsninger. Faste spænder fra') WHERE slug = 'faste-typer-maaltider-og-laengere-faste';

UPDATE articles SET body = replace(body, '## Skal man springe et måltid over — og hvilket?', '## Hvad kan periodisk faste realistisk gøre?

Faste kan gøre det lettere for nogle at spise mindre og tabe sig, men det er ikke en garanti og er ikke nødvendigvis bedre end at fordele et mindre energiindtag over dagen. En [systematisk gennemgang af 99 randomiserede studier fra 2025](https://pubmed.ncbi.nlm.nih.gov/40533200/) fandt overordnet lignende effekter af periodisk faste og løbende energirestriktion. Faste hver anden dag gav en mindre ekstra vægtreduktion i den samlede sammenligning. Det betyder ikke, at netop den metode er bedst for alle.

Madens kvalitet, tilstrækkelig næring og en rytme, du kan holde, betyder stadig noget. Resultater fra almindelig periodisk faste dokumenterer heller ikke fordelene ved en uge eller to uden mad.

## Sådan kan 14:10 og 16:8 se ud

- **14:10:** Spis dagens måltider mellem klokken 08 og 18. Derefter følger 14 timer uden energi frem til klokken 08 næste dag.
- **16:8:** Spis mellem klokken 10 og 18. Det giver otte timers spisevindue og 16 timer uden energi.
- **Plads til familien:** Et vindue fra klokken 09 til 19 er også 14:10. Du behøver ikke fjerne familiemiddagen for at afprøve en tydelig måltidsrytme.

Klokkeslættene er eksempler, ikke en sundhedsregel. Jeg foreslår at begynde med den rytme, der passer til dit arbejde, din søvn og dine måltider, og justere efter hvordan du trives.

## Skal man springe et måltid over — og hvilket?') WHERE slug = 'faste-typer-maaltider-og-laengere-faste';

UPDATE articles SET body = replace(body, 'Små kontrollerede studier tyder på, at et tidligt spisevindue kan give bedre blodsukker- og appetitrespons end at lægge al maden sent. Det taler for at afslutte spisningen tidligere og eventuelt springe aftensmad over. Studierne er dog små, og for mange mennesker er aftensmaden dagens vigtigste sociale måltid.', '[Et lille kontrolleret studie med otte mænd med prædiabetes](https://pubmed.ncbi.nlm.nih.gov/29754952/) fandt forbedringer i blandt andet insulinfølsomhed og appetit ved et seks timers spisevindue med aftensmad før klokken 15 sammenlignet med et tolv timers vindue. Studiet undersøgte ikke direkte, om det var bedst at springe morgenmad eller aftensmad over. Det peger på mulige fordele ved tidligere spisning, men giver ikke en universel regel om at fjerne aftensmaden.') WHERE slug = 'faste-typer-maaltider-og-laengere-faste';

UPDATE articles SET body = replace(body, 'I et otteugers studie', 'I [et otteugers studie](https://pmc.ncbi.nlm.nih.gov/articles/PMC2121099/)') WHERE slug = 'faste-typer-maaltider-og-laengere-faste';

UPDATE articles SET body = replace(body, 'Et andet, kort studie med 11 raske deltagere', '[Et andet, kort studie med 11 raske deltagere](https://pmc.ncbi.nlm.nih.gov/articles/PMC8787212/)') WHERE slug = 'faste-typer-maaltider-og-laengere-faste';

UPDATE articles SET body = replace(body, 'Et syvdages studie viste betydelige systemiske ændringer og tab af fedtfri masse under vandfaste; deltagerne var nøje udvalgt og undersøgt.', '[Et syvdages studie](https://pmc.ncbi.nlm.nih.gov/articles/PMC7617311/) viste betydelige systemiske ændringer og et fald i målt fedtfri masse under vandfaste; deltagerne var nøje udvalgt og undersøgt. Fedtfri masse omfatter også vand, glykogen og organer, så faldet kan ikke oversættes direkte til samme mængde mistet muskelvæv. En stor del af den målte ændring vendte tilbage efter genoptaget spisning.') WHERE slug = 'faste-typer-maaltider-og-laengere-faste';

UPDATE articles SET body = replace(body, 'Nyere data fra overvåget langvarig vandfaste har også vist øget systemisk inflammation og blodpladeaktivering, så fortællingen om en entydig helbredskur er ikke dækkende.', '[Et mindre studie af overvåget langvarig vandfaste](https://pmc.ncbi.nlm.nih.gov/articles/PMC12088818/) fandt ændringer forbundet med systemisk inflammation og blodpladeaktivering. Det dokumenterer ikke i sig selv flere blodpropper eller sygdom på lang sigt, men viser, hvorfor biologiske ændringer under faste ikke uden videre kan kaldes gavnlige.') WHERE slug = 'faste-typer-maaltider-og-laengere-faste';

UPDATE articles SET body = replace(body, 'Retningslinjer anbefaler langsom genoptrapning og klinisk overvågning hos personer i risiko.', '[NICE-retningslinjerne](https://www.nice.org.uk/guidance/cg32/chapter/Recommendations) anbefaler forsigtig genoptrapning og relevant klinisk overvågning hos personer i risiko. Risikoen afhænger også af ernæringstilstand, vægttab og øvrigt helbred.') WHERE slug = 'faste-typer-maaltider-og-laengere-faste';

UPDATE articles SET updated_at = datetime('now') WHERE slug IN ('ketose-saadan-virker-det', 'keto-for-begyndere-guide', 'faste-typer-maaltider-og-laengere-faste');

