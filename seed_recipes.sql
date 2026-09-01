-- 16 godkendte opskrifter, klar til publicering

INSERT OR IGNORE INTO recipes (slug, title, category, servings, prep_minutes, ingredients_json, instructions, tips, kcal, carbs_g, fat_g, protein_g, status, published_at) VALUES
('aeggemuffins-spinat-feta', 'Æggemuffins med spinat og feta', 'morgen', 2, 25,
 '[{"name":"æg","amount":4,"unit":"stk"},{"name":"feta, smuldret","amount":50,"unit":"g"},{"name":"frisk spinat, hakket","amount":30,"unit":"g"},{"name":"fløde 38%","amount":20,"unit":"ml"},{"name":"salt og peber","amount":0,"unit":""}]',
 'Pisk æg og fløde sammen i en skål, til blandingen er jævn og let skummende, cirka et minuts tid. Vend forsigtigt spinat og feta i med en ske, det skal bare fordeles jævnt, ingen grund til at piske videre. Fordel blandingen i smurte muffinforme, cirka tre fjerdedele fyldt, da de hæver lidt. Bag ved 180 grader i 18-20 minutter, til overfladen er gylden og en kniv stukket i midten kommer ren ud. Lad dem køle af et par minutter i formen, før du forsigtigt løsner dem med en kniv langs kanten.',
 'Brug frisk spinat, ikke frossen. Frossen spinat afgiver meget vand, når det tør op, hvilket gør æggemassen tynd og våd i stedet for fast. Har du kun frossen, så pres den grundigt fri for væske i et viskestykke først.',
 320, 4, 24, 20, 'godkendt', datetime('now')),

('skyr-bowl-noedder-baer', 'Skyr bowl med nødder og bær', 'morgen', 1, 5,
 '[{"name":"skyr","amount":200,"unit":"g"},{"name":"valnødder","amount":20,"unit":"g"},{"name":"blandede bær","amount":30,"unit":"g"},{"name":"chiafrø","amount":10,"unit":"g"}]',
 'Kom skyr i en skål. Top med valnødder, bær og chiafrø, uden at røre det sammen, så det ser indbydende ud, og nødderne holder sig sprøde. Server straks, mens det er koldt.',
 'Rist valnødderne let på en tør pande i et par minutter, inden du topper med dem, det fremhæver smagen markant og giver et sprødere bid.',
 280, 8, 14, 22, 'godkendt', datetime('now')),

('avocado-spejlaeg-bacon', 'Avocado med spejlæg og bacon', 'morgen', 1, 10,
 '[{"name":"avocado","amount":1,"unit":"stk"},{"name":"æg","amount":2,"unit":"stk"},{"name":"bacon","amount":40,"unit":"g"}]',
 'Steg baconskiverne på middelvarme i en tør pande, til de er sprøde og gyldne, cirka 4-5 minutter, vend undervejs. Tag baconen op, og lad det udbrændte fedt blive i panden. Slå æggene ud i fedtet ved middel til lav varme, og steg til hviden er helt stivnet, men blommen stadig er blød, cirka 3 minutter, brug låg de sidste minutter, hvis du vil have blommen mere sat. Halver avocadoen, fjern stenen, og læg spejlæg og bacon ovenpå hver halvdel.',
 'Steg æggene ved lavere varme end du tror, du skal bruge. Høj varme giver hård, gummiagtig hvide, mens blommen stadig er kold.',
 450, 4, 38, 18, 'godkendt', datetime('now')),

('keto-pandekager', 'Keto pandekager', 'morgen', 1, 15,
 '[{"name":"æg","amount":2,"unit":"stk"},{"name":"flødeost","amount":50,"unit":"g"},{"name":"kokosmel","amount":10,"unit":"g"},{"name":"kanel","amount":1,"unit":"knsp"}]',
 'Blend æg, flødeost, kokosmel og kanel sammen med en stavblender eller i en foodprocessor, til dejen er helt jævn og uden klumper, lad den gerne hvile 5 minutter, så kokosmelet når at optage væske. Steg pandekagerne i smør eller kokosolie på middelvarme, cirka 2 minutter på hver side, til de er gyldne og slipper let fra panden.',
 'Kokosmel opsuger meget væske, så dejen tykner, mens den hviler. Virker den for tyk lige inden stegning, kan du røre en teskefuld vand i.',
 320, 5, 26, 14, 'godkendt', datetime('now')),

('caesarsalat-kylling', 'Cæsarsalat med kylling', 'frokost', 1, 20,
 '[{"name":"kyllingebryst","amount":150,"unit":"g"},{"name":"romainesalat","amount":50,"unit":"g"},{"name":"parmesan","amount":20,"unit":"g"},{"name":"cæsardressing","amount":30,"unit":"g"}]',
 'Krydr kyllingebrystet med salt og peber, og steg det på en pande ved middelvarme i 6-7 minutter på hver side, til det er gennemstegt med en kernetemperatur omkring 75 grader. Lad kyllingen hvile 5 minutter under et stykke stanniol, før du skærer det i strimler, det holder kødsaften inde. Vend romainesalat, parmesan og dressing sammen i en skål, og top med de varme kyllingestrimler.',
 'Lad altid kyllingen hvile, før du skærer i den. Skærer du med det samme, løber kødsaften ud på skærebrættet i stedet for at blive i kødet.',
 480, 3, 32, 40, 'godkendt', datetime('now')),

('tunmousse-avocado', 'Tunmousse i avocado', 'frokost', 1, 10,
 '[{"name":"tun i vand, afdryppet","amount":120,"unit":"g"},{"name":"mayo","amount":30,"unit":"g"},{"name":"avocado","amount":1,"unit":"stk"}]',
 'Bland den afdryppede tun grundigt med mayo, til det er en ensartet mousse, brug en gaffel til at mose tunnen lidt undervejs. Halver avocadoen, fjern stenen, og fyld tunmoussen i fordybningen i hver halvdel.',
 'Pres lidt citronsaft på avocadoen, inden du fylder den, det holder den frisk og grøn i længere tid, hvis der er rester.',
 420, 4, 34, 24, 'godkendt', datetime('now')),

('broccolisuppe-floede', 'Broccolisuppe med fløde', 'frokost', 2, 25,
 '[{"name":"broccoli","amount":300,"unit":"g"},{"name":"fløde 38%","amount":200,"unit":"ml"},{"name":"hønsebouillon","amount":500,"unit":"ml"}]',
 'Bring bouillonen i kog, tilsæt broccolibuketterne, og lad dem koge møre ved middel varme i 8-10 minutter, til en kniv nemt går igennem. Tag gryden af varmen, tilsæt fløden, og blend suppen med en stavblender, til den er helt jævn og cremet. Varm eventuelt suppen igennem igen ved svag varme, uden at koge den, og smag til med salt og peber.',
 'Kog ikke suppen efter, fløden er tilsat, det kan skille konsistensen. Varm den i stedet forsigtigt igennem lige inden servering.',
 350, 7, 30, 8, 'godkendt', datetime('now')),

('sandwich-roastbeef', 'Rugbrødsfri sandwich med roastbeef', 'frokost', 1, 10,
 '[{"name":"keto bolle","amount":1,"unit":"stk"},{"name":"roastbeef","amount":80,"unit":"g"},{"name":"remoulade","amount":20,"unit":"g"},{"name":"salat","amount":1,"unit":"håndfuld"}]',
 'Skær den keto bolle over. Smør et jævnt lag remoulade på begge halvdele. Fordel roastbeef og salat på den ene halvdel, og læg toppen på.',
 'Rist bollen let, inden du smører den, det giver bedre bid og forhindrer, at den bliver blød af remouladen.',
 380, 6, 22, 28, 'godkendt', datetime('now')),

('ovnbagt-laks-smoersauce', 'Ovnbagt laks med smørsauce og broccoli', 'aften', 2, 25,
 '[{"name":"laksefilet","amount":300,"unit":"g"},{"name":"broccoli","amount":200,"unit":"g"},{"name":"smør","amount":75,"unit":"g"},{"name":"citronsaft","amount":1,"unit":"spsk"}]',
 'Krydr laksefileten med salt og peber, og læg den på en bageplade sammen med broccolien. Bag ved 200 grader i 12-15 minutter, afhængig af tykkelsen, til laksen er netop gennemstegt og flager let med en gaffel. Smelt smørret i en lille gryde ved svag varme, tag det af varmen, og pisk citronsaften i, til saucen er let og skummende. Hæld saucen over laks og broccoli lige inden servering.',
 'Laksen er færdig, når kødet netop er blevet ugennemsigtigt og flager let. Tag den hellere ud for tidligt end for sent, den bager videre et par minutter efter ovnen.',
 620, 4, 48, 38, 'godkendt', datetime('now')),

('flaeskesteg-skysovs-groenkaal', 'Flæskesteg med skysovs og grønkål', 'aften', 2, 90,
 '[{"name":"flæskesteg","amount":300,"unit":"g"},{"name":"grønkål","amount":200,"unit":"g"},{"name":"skysovs","amount":100,"unit":"ml"}]',
 'Steg flæskestegen efter pakkens anvisning, typisk ved 200 grader, til kernetemperaturen når 65-68 grader, og skær eventuelt sværen i tern og skru op til 225 grader de sidste 15-20 minutter for ekstra sprødhed. Lad stegen hvile under stanniol i 10 minutter, før du skærer den ud. Mens stegen hviler, sauter grønkålen i smør ved middelvarme i 3-4 minutter, til den falder sammen og bliver blødere. Server med den varme skysovs.',
 'Stik et termometer i det tykkeste sted af kødet, ikke sværen, for at ramme den helt rigtige kernetemperatur, det er den sikre vej til saftig steg hver gang.',
 650, 5, 48, 42, 'godkendt', datetime('now')),

('oksemoerbrad-blomkaalsmos', 'Oksemørbrad med blomkålsmos', 'aften', 2, 35,
 '[{"name":"oksemørbrad","amount":250,"unit":"g"},{"name":"blomkål","amount":300,"unit":"g"},{"name":"smør","amount":50,"unit":"g"}]',
 'Krydr mørbraden med salt og peber, og steg den på en brandvarm pande i 2-3 minutter på hver side for medium, eller efter smag, lad den derefter hvile 5 minutter under stanniol. Kog imens blomkålen mør i letsaltet vand i 10-12 minutter, si vandet fra, og mos blomkålen med en stavblender sammen med smør, salt og peber, til en jævn, cremet mos.',
 'Si blomkålen ekstra grundigt, og lad den dampe af et par minutter, før du moser den. Overskydende vand giver en tynd, våd mos i stedet for en cremet en.',
 520, 8, 36, 40, 'godkendt', datetime('now')),

('kyllingelaarfilet-karrysauce', 'Kyllingelårfilet i karrysauce', 'aften', 2, 30,
 '[{"name":"kyllingelårfilet","amount":300,"unit":"g"},{"name":"fløde 38%","amount":200,"unit":"ml"},{"name":"karry","amount":1,"unit":"spsk"},{"name":"spidskål","amount":100,"unit":"g"}]',
 'Brun kyllingelårfileterne godt af på begge sider ved høj varme, 2-3 minutter pr. side, til de har fået farve, det giver smag til hele retten. Skru ned til middel varme, tilsæt karry, og rist det med et minuts tid, det fremhæver karryens aroma markant. Tilsæt fløde og spidskål, bring det i kog, og lad det simre ved svag varme i 15-20 minutter under låg, til kyllingen er gennemstegt og saucen har tyknet let.',
 'Rist altid karryen kort i fedtstoffet, før væsken tilsættes. Det låser aromaerne op på en måde, som bare at røre karryen i saucen ikke gør.',
 480, 6, 34, 36, 'godkendt', datetime('now')),

('keto-chokoladekage', 'Keto chokoladekage', 'laekkerier', 8, 35,
 '[{"name":"smør","amount":100,"unit":"g"},{"name":"mørk chokolade 90%","amount":100,"unit":"g"},{"name":"æg","amount":3,"unit":"stk"},{"name":"sødemiddel","amount":30,"unit":"g"}]',
 'Smelt smør og chokolade sammen over vandbad eller ved lav effekt i mikroovnen, rør jævnligt, til massen er helt glat, og lad den køle lidt af. Pisk imens æg og sødemiddel lyst og luftigt med et elpisk i 2-3 minutter, massen skal cirka fordoble volumen. Vend forsigtigt den lune chokolademasse i æggemassen med en dejskraber, brug brede bevægelser nedefra og op, så luften ikke slår fra. Hæld dejen i en smurt form, og bag ved 175 grader i cirka 20 minutter, til kanterne er sat, men midten stadig er en anelse blød.',
 'Kagen bager videre lidt, efter den er taget ud af ovnen. Tag den ud, mens midten stadig virker en smule fugtig, ellers risikerer du en tør kage.',
 310, 5, 28, 6, 'godkendt', datetime('now')),

('peanutbutter-fedtbomber', 'Peanutbutter fedtbomber', 'laekkerier', 12, 15,
 '[{"name":"peanutbutter","amount":100,"unit":"g"},{"name":"kokosolie","amount":100,"unit":"g"},{"name":"kakao","amount":20,"unit":"g"}]',
 'Smelt kokosolien ved svag varme eller i mikroovnen. Rør peanutbutter og kakao grundigt i, til massen er helt glat og ensartet uden klumper. Hæld massen i små silikoneforme eller en isterningbakke, og sæt i fryseren i mindst 1 time, til de er helt faste.',
 'Opbevar fedtbomberne i fryseren, ikke køleskabet, kokosolie smelter allerede ved stuetemperatur, så de holder bedst formen frosne.',
 150, 2, 15, 4, 'godkendt', datetime('now')),

('cheesecake-i-glas', 'Cheesecake i glas', 'laekkerier', 4, 20,
 '[{"name":"flødeost","amount":200,"unit":"g"},{"name":"fløde 38%","amount":100,"unit":"ml"},{"name":"sødemiddel","amount":30,"unit":"g"},{"name":"citronsaft","amount":1,"unit":"tsk"}]',
 'Pisk flødeosten blød med et elpisk, tilsæt derefter fløde, sødemiddel og citronsaft, og pisk videre til massen er luftig og har fået fasthed, cirka 2-3 minutter ved høj hastighed. Fordel massen i glas eller skåle, og sæt dem i køleskabet i mindst 2 timer, gerne natten over, så konsistensen når at sætte sig helt.',
 'Jo længere tid cheesecaken når at trække i køleskabet, jo bedre sætter konsistensen sig. Lav den gerne dagen før, den smager bedre den næste dag.',
 280, 4, 26, 6, 'godkendt', datetime('now')),

('kokosmakroner', 'Kokosmakroner', 'laekkerier', 12, 25,
 '[{"name":"kokosmel","amount":100,"unit":"g"},{"name":"æggehvider","amount":2,"unit":"stk"},{"name":"sødemiddel","amount":40,"unit":"g"}]',
 'Pisk æggehviderne stive med et elpisk, til de danner faste toppe, der ikke falder sammen, når du vender skålen. Vend forsigtigt kokosmel og sødemiddel i med en dejskraber, i brede bevægelser nedefra og op, så mest muligt luft bevares. Form små toppe med to skeer eller en isskefuld på en bageplade med bagepapir, og bag ved 160 grader i 15 minutter, til de er gyldne i toppen.',
 'Sørg for, at skål og pisker er helt fri for fedtstof, før du pisker æggehviderne, selv en lille smule fedt kan forhindre dem i at stivne ordentligt.',
 90, 3, 7, 2, 'godkendt', datetime('now'));
