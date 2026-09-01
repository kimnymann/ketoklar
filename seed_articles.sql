INSERT OR IGNORE INTO articles (slug, title, category, excerpt, body, status, published_at) VALUES
('hvorfor-fedt-er-din-ven', 'Hvorfor fedt ikke er din fjende, det er din nye bedste ven', 'videnskab',
 'I mange år har vi fået at vide, at fedt gør os fede. Sandheden er mere nuanceret.',
 '## Fra sukker til fedt: hvad sker der i kroppen

I mange år har vi fået at vide, at fedt gør os fede, og at kulhydrater er den sikre kilde til energi. Sandheden er mere nuanceret. Når du skærer kraftigt ned på kulhydrater, får kroppen ikke længere sin vante strøm af glukose, og den begynder i stedet at omdanne fedt til såkaldte ketonlegemer i leveren. Det er denne proces, der har givet navn til hele kostformen.

## Ketose, ikke bare et modeord

Ketose er den tilstand, hvor kroppen for alvor er skiftet over til at bruge fedt og ketoner som primær energikilde i stedet for glukose. Mange oplever en mere stabil energi hen over dagen, fordi blodsukkeret ikke længere svinger på samme måde som ved et kulhydratrigt måltid. Det er ikke det samme som at sulte kroppen, det er at give den et andet brændstof at arbejde med.

## Myten om det farlige fedt

En af de mest sejlivede misforståelser er, at mættet fedt automatisk er farligt for hjertet. Det billede har ændret sig markant i forskningsverdenen de seneste år. Flere store gennemgange af den videnskabelige litteratur har ikke kunnet påvise en entydig sammenhæng mellem indtag af mættet fedt og risiko for hjertekarsygdom, mens andre studier stadig peger på en sammenhæng, særligt når det mættede fedt erstatter fibre og grøntsager frem for raffinerede kulhydrater. Kort sagt, det er ikke et lukket kapitel, og enhver der påstår at kende det endegyldige svar, forenkler sagen.

## Hvad forskningen faktisk siger

Det, der er bedre belæg for, er, at en lavkulhydratkost kan hjælpe nogle mennesker med at stabilisere blodsukkeret og reducere trangen til konstant snacking. Det gælder ikke alle, og det er ikke en universalløsning. Har du en eksisterende sygdom, tager du medicin, eller er du gravid, bør du tale med din læge, før du lægger din kost markant om, uanset hvilken retning du vælger.

## Det praktiske: sådan mærker du forskellen

De fleste, der starter på keto, oplever de første dage som de sværeste, ofte kaldet "keto-flu", med træthed og hovedpine, mens kroppen omstiller sig. Det går som regel over efter tre til fem dage. Sørg for at få nok salt og væske i denne periode, det gør ofte hele forskellen.

## Kom i gang

Vil du prøve det på egen krop, er en god start en af vores fede favoritter: æggemuffinerne med spinat og feta til morgenmaden, den ovnbagte laks med smørsauce til aftensmaden, eller en bid keto chokoladekage, hvis du trænger til noget sødt undervejs.',
 'godkendt', datetime('now')),

('tante-grethes-julefrokost', 'Tante Grethes julefrokost, anden omgang', 'anekdote',
 'Der sidder man med sin flæskesteg, sin smør dryppende grønkålssalat, og sit rene, uskyldige hjerte.',
 '## Tante Grethes julefrokost, anden omgang

Der sidder man med sin flæskesteg, sin smør dryppende grønkålssalat, og sit rene, uskyldige hjerte, og så kommer det. "Skal du nu heller ikke have ris a la mande? Du bliver da helt syg af ikke at spise kulhydrater." Man smiler, tager endnu en bid flæskesvær, og tænker: jeg har lige spist mit kropsvægt i fedt og protein, og jeg har det fantastisk, mens du falder i søvn på sofaen klokken 15 med en mandelgave i skødet.

## Frokoststuen, tirsdag klokken 12

Kollegaen med rugbrødsmadpakken kigger på din bøf med bearnaisesovs, som om du har smuglet den ind fra en anden tidsalder. "Er det ikke tungt at spise sådan hver dag?" spørger hun, mens hun selv er i gang med sin fjerde kop kaffe for at holde sig vågen efter formiddagens blodsukkerfald. Du siger bare, at du har det godt, og lader hende undre sig videre. Man behøver ikke forsvare sin mad ved hvert måltid, man skal bare spise den.

## Familiemiddagen med fætter Michael

Fætter Michael, som har læst noget på internettet, vil gerne vide, om du ikke er bange for dit kolesteroltal. Du nævner roligt, at du faktisk får taget blodprøver jævnligt, og at de ser fine ud, hvorefter samtalen hurtigt bevæger sig videre til, hvem der vandt fodboldkampen i søndags. Det er som regel sådan, det ender. Nysgerrigheden fylder mest, lige indtil man svarer roligt og uden at blive defensiv.

## Sommerfesten, hvor der ikke er noget til dig

Der er kartoffelsalat, franskbrød og lagkage, og præcis nul ting, du kan spise uden at tænke dig om. Du tager din egen kølertaske med, fyldt med noget, du selv har lavet, og sætter dig ned med den, som om det er den mest normale ting i verden. For dig er det det. Keto handler ikke om at forklare sig hele tiden. Det handler om at vide, hvad der virker for én selv, og lade resten af selskabet nyde deres kartoffelsalat i fred.',
 'godkendt', datetime('now'));

-- Kobl artiklen om fedt til tre opskrifter
INSERT OR IGNORE INTO article_recipes (article_id, recipe_id)
SELECT a.id, r.id FROM articles a, recipes r
WHERE a.slug = 'hvorfor-fedt-er-din-ven' AND r.slug = 'aeggemuffins-spinat-feta';

INSERT OR IGNORE INTO article_recipes (article_id, recipe_id)
SELECT a.id, r.id FROM articles a, recipes r
WHERE a.slug = 'hvorfor-fedt-er-din-ven' AND r.slug = 'ovnbagt-laks-smoersauce';

INSERT OR IGNORE INTO article_recipes (article_id, recipe_id)
SELECT a.id, r.id FROM articles a, recipes r
WHERE a.slug = 'hvorfor-fedt-er-din-ven' AND r.slug = 'keto-chokoladekage';

-- Kobl julefrokost anekdoten til flæskestegen
INSERT OR IGNORE INTO article_recipes (article_id, recipe_id)
SELECT a.id, r.id FROM articles a, recipes r
WHERE a.slug = 'tante-grethes-julefrokost' AND r.slug = 'flaeskesteg-skysovs-groenkaal';
