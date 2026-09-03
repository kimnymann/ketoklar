# Automatisk udgivelsesplan

Publisher-workeren kører hver dag kl. 06:00 UTC. Den følger tre uafhængige
indholdsspor:

- **Opskrifter:** én godkendt opskrift hver dag. Kategorien roterer mellem
  morgen, frokost, aften og lækkerier.
- **Artikler:** én godkendt videnskabs- eller livsstilsartikel hver mandag.
- **Anekdoter:** én godkendt anekdote hver torsdag.

En post er klar til køen, når `status = 'godkendt'` og `published_at` er tom.
Inden for hvert spor udgives den ældste post først. En manuel genkørsel kan
ikke udgive endnu en post fra samme spor på den samme dato.

Når en artikel- eller anekdotekø har to eller færre udgivelser tilbage, skriver
workeren en særskilt advarsel og antallet `queueRemaining` i kørselsloggen.
Dermed kan de to køer overvåges hver for sig.
