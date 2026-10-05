# Genforsøg for artikler og anekdoter

Fra 21. september 2026 forsøges mandagsartikler og torsdagsanekdoter
udgivet fra kl. 08 til før kl. 10 dansk tid. Den eksisterende femminutterskørsel
kan starte højst tre forsøg pr. dag. Succes stopper yderligere forsøg.

Forsøg, afslutning og seneste fejl gemmes i `editorial_publication_days`.
En aktiv kørsel reserverer dagen i 15 minutter. Afbrydes den, kan et senere
forsøg overtage efter udløbet. En atomisk databasekontrol forhindrer, at
overlappende eller manuelle kørsler udgiver to indlæg fra samme spor samme dag.
Billedgodkendelse og køens eksisterende rækkefølge bevares.

Migration `0011_editorial_publication_days.sql` køres før publisheren opdateres.
Der ændres ikke i opskrifternes udgivelse eller eksisterende publiceringsdatoer.
