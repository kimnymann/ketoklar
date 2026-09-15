# Daglig opskriftsudgivelse

Alle klokkeslæt følger Europe/Copenhagen (også vintertid).

- Mandag er artikeldag; torsdag er anekdotedag. Øvrige dage er opskriftsdage.
- Fra kl. 10 planlægges næste kalenderdags første kandidat. Manglende plan oprettes ved morgenkørslen.
- Fra kl. 07 vælges højst tre forskellige opskrifter. Hver får ét billedforsøg med 90 sekunders tidsgrænse. Allerede billedgodkendte opskrifter kan bruges direkte.
- Kategorirotationen prioriteres; den senest udgivne kategori udelades. Alternativer i samme kategori kommer først.
- Forsøg gemmes før kaldet til billedmodellen. Afbrudte forsøg tæller med. Genstart giver ikke tre nye forsøg.
- Afviste opskrifter forbliver i køen og kan få et nyt billede på senere opskriftsdage.
- Første godkendte kandidat publiceres fra kl. 08. En kontrol hvert femte minut indtil kl. 10 genforsøger publicering. Én atomisk databaseopdatering hindrer dobbeltudgivelse gennem denne motor.
- Ingen reserveadvarsler. Der sendes højst én mail om dagen ved udtømte kandidater/forsøg eller ved manglende publicering fra kl. 08.15. Dagens publicering kontrolleres igen før mailen.
- Mailforsøget reserveres før afsendelse for at undgå dubletter ved uklare svar fra mailtjenesten. `alert_claimed_at` uden `alert_sent_at` kræver driftskontrol; levering kan ikke garanteres ved et nedbrud i mailtjenesten.

Databaseændring: `migrations/0010_recipe_publication_days.sql` skal anvendes før worker-deploy. Den påvirker ikke eksisterende opskriftsindhold.
