-- 16 godkendte opskrifter, klar til publicering

INSERT INTO recipes (slug, title, category, servings, prep_minutes, ingredients_json, instructions, kcal, carbs_g, fat_g, protein_g, status, published_at) VALUES
('aeggemuffins-spinat-feta', 'Æggemuffins med spinat og feta', 'morgen', 2, 25,
 '[{"name":"æg","amount":4,"unit":"stk"},{"name":"feta, smuldret","amount":50,"unit":"g"},{"name":"frisk spinat, hakket","amount":30,"unit":"g"},{"name":"fløde 38%","amount":20,"unit":"ml"},{"name":"salt og peber","amount":0,"unit":""}]',
 'Pisk æg og fløde sammen. Rør spinat og feta i. Hæld i smurte muffinforme. Bag ved 180 grader i 18-20 minutter. Køl af, eller spis lune.',
 320, 4, 24, 20, 'godkendt', datetime('now')),

('skyr-bowl-noedder-baer', 'Skyr bowl med nødder og bær', 'morgen', 1, 5,
 '[{"name":"skyr","amount":200,"unit":"g"},{"name":"valnødder","amount":20,"unit":"g"},{"name":"blandede bær","amount":30,"unit":"g"},{"name":"chiafrø","amount":10,"unit":"g"}]',
 'Bland alle ingredienser i en skål. Server koldt.',
 280, 8, 14, 22, 'godkendt', datetime('now')),

('avocado-spejlaeg-bacon', 'Avocado med spejlæg og bacon', 'morgen', 1, 10,
 '[{"name":"avocado","amount":1,"unit":"stk"},{"name":"æg","amount":2,"unit":"stk"},{"name":"bacon","amount":40,"unit":"g"}]',
 'Steg bacon sprødt. Spejl æggene i det udbrændte fedt. Halver avocadoen og server æg og bacon ovenpå.',
 450, 4, 38, 18, 'godkendt', datetime('now')),

('keto-pandekager', 'Keto pandekager', 'morgen', 1, 15,
 '[{"name":"æg","amount":2,"unit":"stk"},{"name":"flødeost","amount":50,"unit":"g"},{"name":"kokosmel","amount":10,"unit":"g"},{"name":"kanel","amount":1,"unit":"knsp"}]',
 'Blend alle ingredienser til en jævn dej. Steg som almindelige pandekager på middel varme.',
 320, 5, 26, 14, 'godkendt', datetime('now')),

('caesarsalat-kylling', 'Cæsarsalat med kylling', 'frokost', 1, 20,
 '[{"name":"kyllingebryst","amount":150,"unit":"g"},{"name":"romainesalat","amount":50,"unit":"g"},{"name":"parmesan","amount":20,"unit":"g"},{"name":"cæsardressing","amount":30,"unit":"g"}]',
 'Steg eller grill kyllingen og skær i strimler. Vend salat, parmesan og dressing sammen, top med kylling.',
 480, 3, 32, 40, 'godkendt', datetime('now')),

('tunmousse-avocado', 'Tunmousse i avocado', 'frokost', 1, 10,
 '[{"name":"tun i vand, afdryppet","amount":120,"unit":"g"},{"name":"mayo","amount":30,"unit":"g"},{"name":"avocado","amount":1,"unit":"stk"}]',
 'Bland tun og mayo. Halver avocadoen og fyld tunmoussen i.',
 420, 4, 34, 24, 'godkendt', datetime('now')),

('broccolisuppe-floede', 'Broccolisuppe med fløde', 'frokost', 2, 25,
 '[{"name":"broccoli","amount":300,"unit":"g"},{"name":"fløde 38%","amount":200,"unit":"ml"},{"name":"hønsebouillon","amount":500,"unit":"ml"}]',
 'Kog broccoli mør i bouillonen. Tilsæt fløde og blend til en jævn suppe. Smag til med salt og peber.',
 350, 7, 30, 8, 'godkendt', datetime('now')),

('sandwich-roastbeef', 'Rugbrødsfri sandwich med roastbeef', 'frokost', 1, 10,
 '[{"name":"keto bolle","amount":1,"unit":"stk"},{"name":"roastbeef","amount":80,"unit":"g"},{"name":"remoulade","amount":20,"unit":"g"},{"name":"salat","amount":1,"unit":"håndfuld"}]',
 'Skær bollen over. Smør remoulade på, læg roastbeef og salat på.',
 380, 6, 22, 28, 'godkendt', datetime('now')),

('ovnbagt-laks-smoersauce', 'Ovnbagt laks med smørsauce og broccoli', 'aften', 2, 25,
 '[{"name":"laksefilet","amount":300,"unit":"g"},{"name":"broccoli","amount":200,"unit":"g"},{"name":"smør","amount":75,"unit":"g"},{"name":"citronsaft","amount":1,"unit":"spsk"}]',
 'Krydr laksen med salt og peber. Bag ved 200 grader i 12-15 minutter sammen med broccolien. Smelt smørret, pisk citronsaft i, og hæld over ved servering.',
 620, 4, 48, 38, 'godkendt', datetime('now')),

('flaeskesteg-skysovs-groenkaal', 'Flæskesteg med skysovs og grønkål', 'aften', 2, 90,
 '[{"name":"flæskesteg","amount":300,"unit":"g"},{"name":"grønkål","amount":200,"unit":"g"},{"name":"skysovs","amount":100,"unit":"ml"}]',
 'Steg flæskestegen sprød efter pakkens anvisning. Sauter grønkålen i lidt smør. Server med skysovs.',
 650, 5, 48, 42, 'godkendt', datetime('now')),

('oksemoerbrad-blomkaalsmos', 'Oksemørbrad med blomkålsmos', 'aften', 2, 35,
 '[{"name":"oksemørbrad","amount":250,"unit":"g"},{"name":"blomkål","amount":300,"unit":"g"},{"name":"smør","amount":50,"unit":"g"}]',
 'Steg mørbraden efter smag. Kog blomkålen mør, mos med smør, salt og peber.',
 520, 8, 36, 40, 'godkendt', datetime('now')),

('kyllingelaarfilet-karrysauce', 'Kyllingelårfilet i karrysauce', 'aften', 2, 30,
 '[{"name":"kyllingelårfilet","amount":300,"unit":"g"},{"name":"fløde 38%","amount":200,"unit":"ml"},{"name":"karry","amount":1,"unit":"spsk"},{"name":"spidskål","amount":100,"unit":"g"}]',
 'Brun kyllingen. Tilsæt karry, fløde og spidskål. Lad simre 15-20 minutter til kyllingen er gennemstegt.',
 480, 6, 34, 36, 'godkendt', datetime('now')),

('keto-chokoladekage', 'Keto chokoladekage', 'laekkerier', 8, 35,
 '[{"name":"smør","amount":100,"unit":"g"},{"name":"mørk chokolade 90%","amount":100,"unit":"g"},{"name":"æg","amount":3,"unit":"stk"},{"name":"sødemiddel","amount":30,"unit":"g"}]',
 'Smelt smør og chokolade sammen. Pisk æg og sødemiddel luftigt, vend chokolademassen i. Bag ved 175 grader i ca. 20 minutter.',
 310, 5, 28, 6, 'godkendt', datetime('now')),

('peanutbutter-fedtbomber', 'Peanutbutter fedtbomber', 'laekkerier', 12, 15,
 '[{"name":"peanutbutter","amount":100,"unit":"g"},{"name":"kokosolie","amount":100,"unit":"g"},{"name":"kakao","amount":20,"unit":"g"}]',
 'Smelt kokosolien, rør peanutbutter og kakao i. Hæld i små forme og frys i mindst 1 time.',
 150, 2, 15, 4, 'godkendt', datetime('now')),

('cheesecake-i-glas', 'Cheesecake i glas', 'laekkerier', 4, 20,
 '[{"name":"flødeost","amount":200,"unit":"g"},{"name":"fløde 38%","amount":100,"unit":"ml"},{"name":"sødemiddel","amount":30,"unit":"g"},{"name":"citronsaft","amount":1,"unit":"tsk"}]',
 'Pisk flødeost, fløde, sødemiddel og citronsaft luftigt sammen. Fordel i glas og køl mindst 2 timer.',
 280, 4, 26, 6, 'godkendt', datetime('now')),

('kokosmakroner', 'Kokosmakroner', 'laekkerier', 12, 25,
 '[{"name":"kokosmel","amount":100,"unit":"g"},{"name":"æggehvider","amount":2,"unit":"stk"},{"name":"sødemiddel","amount":40,"unit":"g"}]',
 'Pisk æggehviderne stive. Vend forsigtigt kokosmel og sødemiddel i. Form makroner og bag ved 160 grader i 15 minutter.',
 90, 3, 7, 2, 'godkendt', datetime('now'));
