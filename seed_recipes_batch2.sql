-- Batch 2, 16 opskrifter, godkendt af Kim 2. september 2026, lagt i publiceringskøen
-- (published_at er NULL, publisher-workeren udgiver dem gradvist, 2 om dagen).

INSERT OR IGNORE INTO recipes (slug, title, category, servings, prep_minutes, ingredients_json, instructions, tips, kcal, carbs_g, fat_g, protein_g, status, published_at) VALUES
('roraeg-roeget-laks-purloeg', 'Røræg med røget laks og purløg', 'morgen', 1, 10,
 '[{"name":"æg","amount":3,"unit":"stk"},{"name":"røget laks","amount":40,"unit":"g"},{"name":"smør","amount":15,"unit":"g"},{"name":"purløg, hakket","amount":5,"unit":"g"}]',
 'Pisk æggene sammen med en knivspids salt. Smelt smørret i en pande ved svag varme. Hæld æggeblandingen i, og rør konstant med en spatel over svag varme i 2-3 minutter, til æggene danner bløde, cremede flager, men stadig er en anelse løse, de sætter sig videre af restvarmen. Tag panden af varmen, vend forsigtigt den røgede laks i, og drys med hakket purløg.',
 'Tag æggene af varmen, mens de stadig ser en smule blanke og løse ud, de stivner videre i varmen fra panden, selvom den er slukket. Det er den sikre vej til bløde røræg i stedet for tørre.',
 380, 2, 30, 24, 'godkendt', NULL),

('chiagroed-kokosmaelk-mandler', 'Chiagrød med kokosmælk og mandler', 'morgen', 1, 10,
 '[{"name":"chiafrø","amount":30,"unit":"g"},{"name":"kokosmælk","amount":200,"unit":"ml"},{"name":"mandler","amount":20,"unit":"g"},{"name":"kanel","amount":1,"unit":"knsp"}]',
 'Rør chiafrøene grundigt ud i kokosmælken i en skål eller et glas med låg, sørg for at ingen frø klumper sammen i bunden. Tilsæt kanel, og rør igen efter 5 minutter, hvor frøene begynder at binde væsken. Sæt i køleskabet i mindst 3 timer, gerne natten over, til blandingen har en tyk, geleret konsistens som en grød. Top med groft hakkede, ristede mandler lige inden servering.',
 'Rør grøden igennem én gang efter de første 5-10 minutter i køleskabet, det forhindrer, at chiafrøene klumper sig i bunden og giver en mere jævn konsistens.',
 340, 6, 28, 8, 'godkendt', NULL),

('bacon-ostemuffins', 'Bacon- og ostemuffins', 'morgen', 2, 30,
 '[{"name":"æg","amount":4,"unit":"stk"},{"name":"bacon i tern","amount":60,"unit":"g"},{"name":"cheddar, revet","amount":50,"unit":"g"}]',
 'Steg baconternene sprøde på en tør pande ved middelvarme, cirka 4-5 minutter, lad dem køle lidt af. Pisk æggene sammen med en knivspids salt og peber, rør bacon og revet cheddar i. Fordel blandingen i smurte muffinforme, cirka tre fjerdedele fyldt. Bag ved 180 grader i 20 minutter, til de er gyldne og faste i midten.',
 'Lad baconen køle lidt af, før du rører den i æggene, ellers begynder ægget at stivne for tidligt, mens du stadig blander.',
 360, 2, 28, 22, 'godkendt', NULL),

('keto-granola-skyr', 'Keto granola med skyr', 'morgen', 1, 10,
 '[{"name":"mandler","amount":20,"unit":"g"},{"name":"valnødder","amount":20,"unit":"g"},{"name":"kokosflager","amount":20,"unit":"g"},{"name":"skyr","amount":200,"unit":"g"}]',
 'Rist mandler, valnødder og kokosflager sammen på en tør pande ved middelvarme, rør jævnligt, i cirka 4 minutter, til de er gyldne og dufter ristet, pas på de ikke branker, kokosflager tager hurtigt farve. Lad blandingen køle helt af, den bliver sprødere, mens den køler. Server den ristede granola oven på den kolde skyr.',
 'Lav gerne en større portion granola ad gangen, den holder sig sprød i en lufttæt beholder i op til to uger.',
 390, 7, 30, 20, 'godkendt', NULL),

('rejesalat-avocado-lime', 'Rejesalat med avocado og lime', 'frokost', 1, 10,
 '[{"name":"rejer","amount":150,"unit":"g"},{"name":"avocado","amount":1,"unit":"stk"},{"name":"limesaft","amount":1,"unit":"spsk"},{"name":"mayo","amount":20,"unit":"g"}]',
 'Bland de afdryppede rejer med mayo og limesaft i en skål, til rejerne er jævnt dækket. Smag til med salt og peber. Halver avocadoen, fjern stenen, og fordel rejesalaten i fordybningen i hver halvdel.',
 'Pres lidt ekstra limesaft på selve avocadoen, inden du fylder den, det holder den frisk og forhindrer den i at blive brun.',
 420, 5, 34, 20, 'godkendt', NULL),

('blomkaalsris-bowl-kylling-peanutsauce', 'Blomkålsris-bowl med kylling og peanutsauce', 'frokost', 1, 20,
 '[{"name":"blomkålsris","amount":200,"unit":"g"},{"name":"kylling","amount":150,"unit":"g"},{"name":"peanutsauce","amount":30,"unit":"g"}]',
 'Steg blomkålsrisene på en tør pande eller wok ved middel til høj varme i 4-5 minutter, til de er møre, men stadig har lidt bid, undgå at de bliver til grød. Steg kyllingen ved siden af, skåret i mundrette stykker, til den er gennemstegt og har fået farve, cirka 6-7 minutter. Fordel blomkålsrisene i en skål, top med kyllingen, og hæld peanutsaucen over.',
 'Steg blomkålsrisene ved høj varme uden låg, damper de i stedet for at stege, ender de bløde og våde i stedet for at have bid.',
 450, 8, 26, 38, 'godkendt', NULL),

('frittata-spinat-feta', 'Frittata med spinat og feta', 'frokost', 1, 15,
 '[{"name":"æg","amount":4,"unit":"stk"},{"name":"spinat","amount":50,"unit":"g"},{"name":"feta","amount":40,"unit":"g"}]',
 'Svits spinaten kort i en ovnfast pande ved middelvarme, til den lige akkurat falder sammen, cirka 1 minut. Pisk æggene sammen med salt og peber, hæld dem over spinaten i panden, og lad stå ved lav varme i 4-5 minutter, til kanterne begynder at sætte sig. Smuldr feta over, og sæt panden under ovnens grill i 3-4 minutter, til toppen er stivnet og let gylden.',
 'Sørg for, at panden er ovnfast, før du sætter den under grillen, et plastikhåndtag tåler ikke varmen.',
 380, 3, 30, 24, 'godkendt', NULL),

('skinke-ostetaerte-uden-bund', 'Skinke- og ostetærte uden bund', 'frokost', 2, 45,
 '[{"name":"æg","amount":5,"unit":"stk"},{"name":"skinke","amount":100,"unit":"g"},{"name":"ost, revet","amount":80,"unit":"g"},{"name":"fløde","amount":50,"unit":"ml"}]',
 'Pisk æg og fløde godt sammen med salt og peber. Rør skinke, skåret i tern, og revet ost i blandingen. Hæld i en smurt tærteform, og bag ved 175 grader i 30-35 minutter, til tærten er gylden og sat i midten, en kniv stukket i midten skal komme næsten ren ud. Lad den hvile 5 minutter, før den skæres for.',
 'Lad tærten hvile, før du skærer i den, den sætter sig yderligere de første minutter uden for ovnen, og skiverne holder bedre formen.',
 410, 3, 32, 26, 'godkendt', NULL),

('moerbrad-bearnaise-cherrytomater-parmesansalat', 'Mørbrad med bearnaisesauce, ovnbagte cherrytomater og parmesansalat', 'aften', 2, 45,
 '[{"name":"oksemørbrad","amount":300,"unit":"g"},{"name":"æggeblommer","amount":2,"unit":"stk"},{"name":"smør","amount":150,"unit":"g"},{"name":"hvidvinseddike","amount":2,"unit":"spsk"},{"name":"estragon","amount":1,"unit":"tsk"},{"name":"cherrytomater","amount":150,"unit":"g"},{"name":"olivenolie","amount":1,"unit":"spsk"},{"name":"romainesalat","amount":60,"unit":"g"},{"name":"parmesan","amount":20,"unit":"g"},{"name":"valnødder","amount":20,"unit":"g"}]',
 'Bag cherrytomaterne i olivenolie ved 180 grader i 15 minutter, til de er bløde og let sammenfaldne. Pisk æggeblommer og hvidvinseddike over vandbad til luftige og cremede, cirka 3-4 minutter, tilsæt derefter det smeltede smør i en tynd stråle under konstant piskning, til saucen er tyk og samlet, rør estragon i til sidst. Steg mørbraden på en brandvarm pande i 2-3 minutter på hver side for medium, lad den hvile 5 minutter under stanniol. Vend romainesalat med parmesan og valnødder. Skær mørbraden i skiver, og server med bearnaisesauce, cherrytomater og salat.',
 'Hold bearnaisesaucen væk fra for høj varme undervejs, den skiller let, hvis æggemassen bliver for varm for hurtigt.',
 650, 6, 52, 40, 'godkendt', NULL),

('fiskefilet-citronsmoer-asparges-cherrytomater', 'Fiskefilet med citronsmør, asparges og cherrytomater', 'aften', 2, 25,
 '[{"name":"hvid fisk","amount":200,"unit":"g"},{"name":"asparges","amount":150,"unit":"g"},{"name":"smør","amount":50,"unit":"g"},{"name":"citron","amount":1,"unit":"stk"},{"name":"hvidløg","amount":1,"unit":"fed"},{"name":"cherrytomater","amount":80,"unit":"g"},{"name":"persille","amount":1,"unit":"spsk"}]',
 'Steg fisken i smør ved middelvarme i 3-4 minutter på hver side, til den flager let med en gaffel. Steg asparges og cherrytomater med i panden de sidste 4-5 minutter, til aspargesen er mør, men stadig har bid. Smelt smør i en lille gryde, pres hvidløg i, og pisk citronsaft i, til en let, skummende sauce. Server fisken med grøntsagerne, hæld saucen over, og drys med hakket persille.',
 'Tag fisken af varmen lidt tidligt, den bager videre selv af restvarmen, og bliver hurtigt tør, hvis den steger for længe.',
 440, 6, 30, 32, 'godkendt', NULL),

('kalkunbryst-floedesauce-champignon-spinat-parmesan', 'Kalkunbryst i flødesauce med champignon, spinat og parmesan', 'aften', 2, 30,
 '[{"name":"kalkunbryst","amount":250,"unit":"g"},{"name":"champignon","amount":150,"unit":"g"},{"name":"fløde","amount":150,"unit":"ml"},{"name":"spinat","amount":50,"unit":"g"},{"name":"hvidløg","amount":1,"unit":"fed"},{"name":"parmesan","amount":20,"unit":"g"},{"name":"timian","amount":1,"unit":"tsk"}]',
 'Skær kalkunbrystet i skiver, og brun dem godt af på begge sider ved høj varme, læg dem til side. Svits champignon og presset hvidløg i samme pande, til champignonerne er brunet og har afgivet deres væske, cirka 5 minutter. Tilsæt fløde og timian, læg kalkunskiverne tilbage i saucen, og lad simre ved svag varme i 10-12 minutter, til kalkunen er gennemstegt og saucen har tyknet let. Vend spinaten i de sidste 2 minutter, til den falder sammen, og drys med parmesan lige inden servering.',
 'Skær kalkunen i skiver, før du bruner den, i stedet for at brune den hel og skære bagefter, det giver en mere jævn og hurtigere stegning.',
 510, 6, 34, 42, 'godkendt', NULL),

('lammekoteletter-hvidloeg-rosmarin-sellerimos', 'Lammekoteletter med hvidløg, rosmarin og ovnbagt selleri-blomkålsmos', 'aften', 2, 45,
 '[{"name":"lammekoteletter","amount":300,"unit":"g"},{"name":"hvidløg","amount":2,"unit":"fed"},{"name":"rosmarin","amount":1,"unit":"kvist"},{"name":"olivenolie","amount":2,"unit":"spsk"},{"name":"blomkål","amount":200,"unit":"g"},{"name":"selleri","amount":100,"unit":"g"},{"name":"smør","amount":40,"unit":"g"},{"name":"timian","amount":1,"unit":"tsk"}]',
 'Bag blomkål og selleri i olivenolie og timian ved 200 grader i 25-30 minutter, til begge dele er møre og har fået let farve. Mos det derefter med en stavblender sammen med smør, salt og peber, til en jævn, cremet mos. Mens grøntsagerne bager, marineres lammekoteletterne i olivenolie, presset hvidløg og rosmarin i mindst 15 minutter. Steg koteletterne på en varm pande i 3-4 minutter på hver side for medium-rare, og lad dem hvile 5 minutter under stanniol. Server koteletterne oven på moset.',
 'Lad lammekøden nå stuetemperatur, før den kommer på panden, koldt kød direkte fra køleskabet giver en mere ujævn stegning.',
 620, 7, 48, 38, 'godkendt', NULL),

('chokolademousse-havsalt', 'Chokolademousse med havsalt', 'laekkerier', 4, 90,
 '[{"name":"mørk chokolade 90%","amount":100,"unit":"g"},{"name":"piskefløde","amount":200,"unit":"ml"},{"name":"havsalt","amount":1,"unit":"knsp"}]',
 'Smelt chokoladen over vandbad eller ved lav effekt i mikroovnen, rør jævnligt, til den er helt glat, og lad den køle af til stuetemperatur. Pisk piskefløden til den er luftig og danner bløde toppe, pas på ikke at piske for længe, den skal ikke blive til smør. Vend forsigtigt den afkølede chokolade i flødeskummet med en dejskraber i brede bevægelser, så mest muligt luft bevares. Fordel moussen i glas, og køl mindst 1 time. Drys med havsalt lige inden servering.',
 'Chokoladen skal være afkølet til stuetemperatur, før den vendes i flødeskummet, er den for varm, smelter skummet sammen, og moussen bliver tung i stedet for luftig.',
 320, 4, 30, 4, 'godkendt', NULL),

('keto-brownies', 'Keto brownies', 'laekkerier', 8, 35,
 '[{"name":"smør","amount":100,"unit":"g"},{"name":"mørk chokolade","amount":100,"unit":"g"},{"name":"æg","amount":3,"unit":"stk"},{"name":"mandelmel","amount":40,"unit":"g"}]',
 'Smelt smør og chokolade sammen over vandbad eller ved lav effekt i mikroovnen, til massen er glat, og lad den køle lidt af. Pisk æggene lyst og luftigt i 2-3 minutter med et elpisk. Vend chokolademassen i æggene, tilsæt derefter mandelmelet, og vend forsigtigt sammen til en jævn dej. Hæld dejen i en smurt form, og bag ved 175 grader i 18-20 minutter, til overfladen er sat, men midten stadig er en anelse fugtig.',
 'Brownies fortsætter med at bage videre, efter de er taget ud af ovnen. Tag dem ud, mens midten stadig virker en smule fugtig, ellers bliver de tørre, når de køler af.',
 290, 4, 26, 6, 'godkendt', NULL),

('citronfromage', 'Citronfromage', 'laekkerier', 4, 15,
 '[{"name":"flødeost","amount":200,"unit":"g"},{"name":"citron, saft og revet skal","amount":1,"unit":"stk"},{"name":"sødemiddel","amount":30,"unit":"g"},{"name":"fløde","amount":100,"unit":"ml"}]',
 'Pisk flødeosten blød med et elpisk. Tilsæt citronsaft, revet citronskal og sødemiddel, og pisk videre, til det er godt blandet og jævnt. Pisk fløden separat i en anden skål, til den er let og luftig og danner bløde toppe. Vend forsigtigt den piskede fløde i flødeostblandingen med en dejskraber. Fordel i glas eller skåle, og køl mindst 2 timer, til konsistensen har sat sig.',
 'Riv citronskallen, før du presser citronen, det er markant nemmere at rive en hel citron end en, der allerede er skåret over.',
 270, 3, 24, 5, 'godkendt', NULL),

('jordbaer-cheesecake-bites', 'Jordbær-cheesecake bites', 'laekkerier', 10, 15,
 '[{"name":"flødeost","amount":150,"unit":"g"},{"name":"jordbær","amount":50,"unit":"g"},{"name":"sødemiddel","amount":20,"unit":"g"}]',
 'Blend jordbærrene til en jævn puré med en stavblender. Rør flødeost, jordbærpuré og sødemiddel sammen, til massen er ensartet og har en jævn lyserød farve. Hæld massen i små silikoneforme eller en isterningbakke, og frys i mindst 2 timer, til de er helt faste.',
 'Brug friske, modne jordbær frem for frosne, frosne jordbær afgiver mere væske og gør massen tyndere.',
 140, 2, 12, 2, 'godkendt', NULL);
