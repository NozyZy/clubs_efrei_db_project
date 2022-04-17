Comment utiliser le programme pour créer la BDD, insérer les données, et afficher les requetes ?



1. Avoir Node JS d'installé sur son ordinateur (LTS version)
-> https://nodejs.org/en/

2. Installer les packages
-> Se mettre dans le dosser "clubs_efrei_db_project"
-> Ouvrir un terminal
-> Taper la commande "npm install"
-> Les packages devraient être installés

3. Se connecter à la BDD
-> Rentrer les informations de votre BDD dans 'properties.json'
-> De base host = localhost, et user = root, rentrez votre mot de passe

4. (Re)Construire la BDD
-> Ouvrir le terminal de la meme manière qu'en 2.
-> Taper "npm run create"

5. Insérer les données
-> Ouvrir le terminal de la meme manière qu'en 2.
-> Taper "npm run insert"

6. Effectuer les requêtes
-> Ouvrir le terminal de la meme manière qu'en 2.
-> Taper "npm run req"

7. Créer et voir les vues
-> Ouvrir le terminal de la meme manière qu'en 2.
-> Taper "npm run vues"


FYI : Les fichiers SQL sont dans "clubs_efrei_db_project/sql"
