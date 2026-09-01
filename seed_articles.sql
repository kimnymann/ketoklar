INSERT OR IGNORE INTO articles (slug, title, category, excerpt, body, status, published_at) VALUES
('hvorfor-fedt-er-din-ven', 'Hvorfor fedt ikke er din fjende, det er din nye bedste ven', 'videnskab',
 'I mange år har vi fået at vide, at fedt gør os fede. Sandheden er mere nuanceret.',
 'I mange år har vi fået at vide, at fedt gør os fede. Sandheden er mere nuanceret. Din krop kan sagtens bruge fedt som primær energikilde, når kulhydraterne skrues ned, og resultatet er ofte en mere stabil energi hen over dagen, uden blodsukkerets op og ned.

Herunder tre opskrifter, der er gode eksempler på, hvordan fedt kan smage fantastisk og mætte ordentligt.',
 'godkendt', datetime('now')),

('tante-grethes-julefrokost', 'Tante Grethes julefrokost, anden omgang', 'anekdote',
 'Der sidder man med sin flæskesteg, sin smør dryppende grønkålssalat, og sit rene, uskyldige hjerte.',
 'Der sidder man med sin flæskesteg, sin smør dryppende grønkålssalat, og sit rene, uskyldige hjerte, og så kommer det. "Skal du nu heller ikke have ris a la mande? Du bliver da helt syg af ikke at spise kulhydrater." Man smiler, tager endnu en bid flæskesvær, og tænker: jeg har lige spist mit kropsvægt i fedt og protein, og jeg har det fantastisk, mens du falder i søvn på sofaen klokken 15 med en mandelgave i skødet.

Keto gør ikke bare, at man kan sige nej til desserten. Det gør, at man kan sige det med et smil, mens man nyder synet af onkel Bent, der kæmper mod sin egen blodsukkerkurve i den bekvemme lænestol.',
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
