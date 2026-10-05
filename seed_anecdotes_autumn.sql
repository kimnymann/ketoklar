-- Fem efterårsanekdoter godkendt af Kim Sax den 5. september 2026.

-- Udgives af torsdagskoeen. Genkoersel bevarer eksisterende indhold og udgivelsesdatoer.

INSERT INTO articles (slug,title,excerpt,body,category,status,published_at) VALUES ('skovtur-keto-termokanden-med-suppe','Skovtur på keto og termokanden med suppe','En efterårstur i skoven med våde sokker, en ambitiøs rute og broccolisuppe i termokanden. En lun anekdote om mad på tur med keto.','Det er din ven, der har foreslået en lille efterårstur i skoven. Lille betyder åbenbart otte kilometer og en bakke, han ikke nævnte i beskeden.

Du har pakket en termokande med [broccolisuppe med fløde](/opskrifter/broccolisuppe-floede). Den slags frokost passer dig godt, når du spiser keto, og i morges virkede varm suppe som et stærkere argument for frisk luft end frisk luft alene.

Efter en time finder I en bænk. Din ven pakker en sandwich ud med den forsigtighed, man normalt reserverer til gamle dokumenter. Regnen har været inde gennem papiret.

Du skruer låget af termokanden. En lille sky af damp stiger op mellem jer.

»Har du kaffe med?«

»Broccoli.«

Han ser på dig, som om du lige har sagt, at du har en printer i rygsækken.

Men suppen dufter af frokost, og vinden har efterhånden fået adgang til begge hans ører. Du hælder lidt op i det ekstra krus. Han tager imod og holder hænderne omkring det.

I sidder et øjeblik uden at sige noget. Bladene drypper. Et barn i gummistøvler passerer jer med en pind, der kræver mere plads end stien tilbyder.

»Næste gang,« siger din ven, »kan vi så gå den korte rute?«

Det kan I godt. Han vil bare gerne sikre sig, at suppen stadig kommer med.','anekdote','godkendt',NULL) ON CONFLICT(slug) DO NOTHING;

INSERT OR IGNORE INTO article_recipes (article_id,recipe_id) SELECT a.id,r.id FROM articles a,recipes r WHERE a.slug='skovtur-keto-termokanden-med-suppe' AND r.slug='broccolisuppe-floede';

INSERT INTO articles (slug,title,excerpt,body,category,status,published_at) VALUES ('aebleplukning-keto-posen-til-naboen','Æbleplukning på keto og posen til naboen','Du tager med på æbleplukning, selv om æblekage ikke står på din keto-menu. En efterårsanekdote om fællesskab og en lidt for stor pose.','Du tager med på æbleplukning en søndag i september. Solen er fremme, græsset er vådt, og nogen har sagt, at I bare skal have en lille pose hver.

Det holder i cirka fire minutter.

Ved det tredje træ har din familie udviklet en fælles overbevisning om, at æbler ellers vil forsvinde fra Danmark. Poserne er fulde. Der bliver hentet en kasse.

»Hvad vil du egentlig lave med dine?« spørger din søster. »Du spiser jo keto.«

Du havde mest tænkt dig at gå en tur og nå de øverste grene. Nu står du med råvarer til et mindre mosteri og skal åbenbart fremlægge en plan.

Naboen bliver løsningen. Han laver æblemos og har flere gange sagt, at du bare skal komme forbi. Du beslutter at tage ham mere bogstaveligt, end han nok havde forestillet sig.

Senere samles I om kaffen. Der er æblekage på bordet og de [kokosmakroner](/opskrifter/kokosmakroner), du bagte hjemmefra. Du tager en makron, mens din søster fortæller, hvor mange glas æblegelé hun nu er nødt til at lave.

Da du ringer på hos naboen, lyser han op ved synet af posen.

»Hvor dejligt. Er det dem alle sammen?«

Du kigger tilbage mod bilen.

»Hvor bogstaveligt mente du egentlig det med bare at komme forbi?«','anekdote','godkendt',NULL) ON CONFLICT(slug) DO NOTHING;

INSERT OR IGNORE INTO article_recipes (article_id,recipe_id) SELECT a.id,r.id FROM articles a,recipes r WHERE a.slug='aebleplukning-keto-posen-til-naboen' AND r.slug='kokosmakroner';

INSERT INTO articles (slug,title,excerpt,body,category,status,published_at) VALUES ('halloween-keto-det-skaeve-graeskar','Halloween på keto og det skæve græskar','Græskarret bliver skævt, slikskålen er klar, og din keto-chokoladekage får øjne. En anekdote om halloween og efterårshygge i køkkenet.','Græskarret på køkkenbordet skulle ligne billedet, du fandt. Det havde skarpe tænder, smalle øjne og et udtryk af kontrolleret ondskab.

Dit ser ud, som om det har glemt, hvorfor det gik ind i et rum.

»Det er sødt,« siger en af børnene.

Det var ikke den stemning, du gik efter.

På bordet står også en slikskål til dem, der ringer på, og en [keto-chokoladekage](/opskrifter/keto-chokoladekage) til aftenens kaffe. Du har bagt den, fordi du gerne vil have noget, der passer til din egen madplan, mens I klipper flagermus og diskuterer, hvor meget spindelvæv en lampe kan bære.

En lille hånd sætter to kageøjne på et stykke af kagen.

»Nu er din også uhyggelig.«

Du fjerner øjnene fra dit stykke igen og lægger dem på servietten. Det udløser en længere samtale om, hvorvidt en kage uden øjne er mere eller mindre skræmmende. Ingen spørger til kulhydrater. Der er vigtigere ting på dagsordenen.

Da det ringer på, står tre hekse og en meget lille dinosaur udenfor. De får slik og vurderer græskarret.

»Den ser træt ud,« siger dinosauren.

Du kigger på køkkenet. Græskarkerner under stolen, papir på gulvet og spindelvæv i kaffen.

For første gang hele aftenen synes du faktisk, at græskarret er lykkedes meget godt.','anekdote','godkendt',NULL) ON CONFLICT(slug) DO NOTHING;

INSERT OR IGNORE INTO article_recipes (article_id,recipe_id) SELECT a.id,r.id FROM articles a,recipes r WHERE a.slug='halloween-keto-det-skaeve-graeskar' AND r.slug='keto-chokoladekage';

INSERT INTO articles (slug,title,excerpt,body,category,status,published_at) VALUES ('efteraar-haven-suppen-der-blev-kold','Efterår i haven og suppen, der blev kold','Du vil rive blade sammen før frokost, men efterårshaven har andre planer. En anekdote om havearbejde, keto og suppe med en lang pause.','Du vil bare lige rive bladene sammen, før du spiser frokost.

Suppen står klar i køkkenet. Jakken hænger ved døren. Det ligner en opgave på tyve minutter, hvilket er noget, du ofte siger om ting, du endnu ikke er begyndt på.

Den første bunke bliver flot. Rund, høj og placeret med en omhu, ingen nogensinde har set dig bruge på vasketøj.

Så kommer vinden.

Du står med riven og ser dit arbejde flytte hen til naboens hæk. Et enkelt blad sætter sig på din skulder. Det føles unødvendigt.

Naboen læner sig over hegnet.

»Der kommer altså flere ned i morgen.«

Du ser op. Træet har stadig rigeligt på lager.

Efter endnu en runde går du ind til din [broccolisuppe med fløde](/opskrifter/broccolisuppe-floede). Den var tænkt som en varm keto-frokost. Nu er den mest stuetempereret, så du hælder den tilbage i gryden og stiller støvlerne på avisen ved døren.

Mens suppen bliver varm, begynder det at regne. Du sætter dig ved vinduet med skålen mellem hænderne og betragter den del af græsplænen, du faktisk nåede.

Der lander tre nye blade.

Du tager en skefuld mere. Så fire blade. Så en hel lille flok.

Riven står stadig op ad skuret. Den må gerne stå der lidt endnu.','anekdote','godkendt',NULL) ON CONFLICT(slug) DO NOTHING;

INSERT OR IGNORE INTO article_recipes (article_id,recipe_id) SELECT a.id,r.id FROM articles a,recipes r WHERE a.slug='efteraar-haven-suppen-der-blev-kold' AND r.slug='broccolisuppe-floede';

INSERT INTO articles (slug,title,excerpt,body,category,status,published_at) VALUES ('efteraarsferie-keto-kampen-om-sofaen','Efterårsferie på keto og kampen om sofaen','Regnen flytter efterårsferien ind i sommerhuset, hvor brætspil, tæpper og keto-aftensmad skal deles. Især pladsen i sofaen giver problemer.','Sommerhuset er booket til efterårsferien. På billederne stod terrassedøren åben, og solen lå hen over gulvet. Ved ankomsten ligger der mest en våd måtte.

I bærer taskerne ind og bliver enige om, at regnen sikkert snart stopper. Tre timer senere har nogen taget nattøj på.

Du har planlagt [kyllingelårfilet i karrysauce](/opskrifter/kyllingelaarfilet-karrysauce) til aftensmad. Til din keto-tallerken laver du blomkålsris, og der kommer almindelige ris på bordet til dem, der har lyst. Indkøbsposen rummer det hele. Sommerhusets køkken rummer én gryde med låg og tre uden.

Det lykkes alligevel. Saucen bobler, ruderne dugger, og inde fra stuen kommer en diskussion om en brætspilsregel, som ingen havde stærke holdninger til hjemmefra.

Efter maden vil du sidde i sofaen. Det viser sig, at din plads er blevet tildelt et tæppe, to puder og en person, der hævder kun at ligge der midlertidigt.

Du flytter en pude. Personen sukker, som om du har opsagt et mangeårigt lejemål.

Til sidst sidder I der alle sammen. Din kaffekop står på spilæsken, og du kan ikke nå fjernbetjeningen. Udenfor slår regnen mod ruden.

»Skal vi planlægge noget til i morgen?« spørger nogen.

»Ja,« siger du. »Jeg reserverer den her ende af sofaen.«','anekdote','godkendt',NULL) ON CONFLICT(slug) DO NOTHING;

INSERT OR IGNORE INTO article_recipes (article_id,recipe_id) SELECT a.id,r.id FROM articles a,recipes r WHERE a.slug='efteraarsferie-keto-kampen-om-sofaen' AND r.slug='kyllingelaarfilet-karrysauce';
