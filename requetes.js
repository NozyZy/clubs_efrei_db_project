const mysql = require('mysql8');
const properties = require('./properties.json')

const host = properties.host
const user = properties.user
const password = properties.password

const connection = mysql.createConnection({
    host: host,
    user: user,
    password: password,
    database: 'clubs_efrei',
    multipleStatements: true
});

const req_1 = `select c.NOM_CLUB     as Club,
       TYPE_CLUB      as Type,
       DESCRIPTION,
       e.NOM_ETUDIANT as Prez,
       e.CLASSE       as Classe,
       e.NIVEAU       as Niveau,
       e.NUM_ETUDIANT as Num_Etudiant
from etudiants e,
     clubs c,
     poste p,
     responsabilites r,
     types_club t
where r.CLUB_ID = c.CLUB_ID
  and r.NUM_ETUDIANT = e.NUM_ETUDIANT
  and r.POSTE_ID = p.POSTE_ID
  and t.TYPE_ID = c.TYPE_ID
  and p.TITRE = 'Président'
  and CURDATE() BETWEEN r.DATE_DEBUT and r.DATE_FIN
order by c.CLUB_ID;`

const req_2 = "select evenements.NOM_EVENT                        as Nom_event,\n" +
    "       evenements.DATE_DEBUT,\n" +
    "       b.MONTANT                                   as Budget_Alloue,\n" +
    "       group_concat(e.NOM_ETUDIANT separator ', ') as Membres_comite,\n" +
    "       cal.VARIATION * -1                          as Depenses,\n" +
    "       cal.AFFECTATION                             as Objet_depense\n" +
    "from evenements\n" +
    "         join commite comite on comite.COMITE_ID = evenements.COMITE_ID\n" +
    "         join budget b on evenements.BUDGET_ID = b.BUDGET_ID\n" +
    "         join compose comp on comite.COMITE_ID = comp.COMITE_ID\n" +
    "         join etudiants e on comp.NUM_ETUDIANT = e.NUM_ETUDIANT\n" +
    "         join calendrier_argent cal on b.BUDGET_ID = cal.BUDGET_ID\n" +
    "where year(DATE_DEBUT) = year(CURDATE()) - 1\n" +
    "  and cal.VARIATION < 0\n" +
    "group by EVENT_ID;"

const req_3 = `select NOM_CLUB as Nom_Club, ETAT as Etat_Rapport, year(DATE_ECRITURE) as Annee
from rapports
         join etats_rapports er on er.ETAT_ID = rapports.ETAT_ID
         join clubs c on c.CLUB_ID = rapports.CLUB_ID
order by Annee desc, ETAT;`

const req_4 = `select * from clubs;`

const req_5 = "select etudiants.NUM_ETUDIANT,\n" +
    "       etudiants.NOM_ETUDIANT,\n" +
    "       nbClubs.nb_clubs,\n" +
    "       concat_ws(', ', po.nom, me.nom)     as clubs,\n" +
    "       concat_ws(', ', po.poste, me.poste) as postes\n" +
    "from (select etudiants.NUM_ETUDIANT, count(distinct m.CLUB_ID) + count(distinct r.CLUB_ID) as nb_clubs\n" +
    "      from etudiants\n" +
    "               join membres m on etudiants.NUM_ETUDIANT = m.NUM_ETUDIANT\n" +
    "               join responsabilites r on etudiants.NUM_ETUDIANT = r.NUM_ETUDIANT\n" +
    "      where CURDATE() BETWEEN r.DATE_DEBUT and r.DATE_FIN\n" +
    "      group by m.NUM_ETUDIANT) as nbClubs,\n" +
    "     (select NUM_ETUDIANT,\n" +
    "             group_concat(NOM_CLUB separator ', ') as nom,\n" +
    "             group_concat(TITRE SEPARATOR ', ')    as poste\n" +
    "      from responsabilites r,\n" +
    "           poste,\n" +
    "           clubs\n" +
    "      where r.POSTE_ID = poste.POSTE_ID\n" +
    "        and r.CLUB_ID = clubs.CLUB_ID\n" +
    "        and CURDATE() BETWEEN r.DATE_DEBUT and r.DATE_FIN\n" +
    "      group by NUM_ETUDIANT) as po,\n" +
    "     (select NUM_ETUDIANT,\n" +
    "             group_concat(NOM_CLUB separator ', ') as nom,\n" +
    "             group_concat('Membre' SEPARATOR ', ') as poste\n" +
    "      from membres,\n" +
    "           clubs\n" +
    "      where membres.CLUB_ID = clubs.CLUB_ID\n" +
    "      group by NUM_ETUDIANT) as me,\n" +
    "     etudiants\n" +
    "where nbClubs.NUM_ETUDIANT = po.NUM_ETUDIANT\n" +
    "  and nbClubs.NUM_ETUDIANT = me.NUM_ETUDIANT\n" +
    "  and etudiants.NUM_ETUDIANT = nbClubs.NUM_ETUDIANT\n" +
    "group by etudiants.NUM_ETUDIANT;"

const req_6 = `select AFFECTATION, VARIATION * -1 as Cout, r.NOM_ETUDIANT as Responsable, DESCRIPTION
from taches
         join calendrier_argent ca on taches.CALENDRIER_ID = ca.CALENDRIER_ID
         join etudiants r on taches.RESPONSABLE_ID = r.NUM_ETUDIANT
order by VARIATION
limit 10;`

const req_7 = "select NOM_EVENT,\n" +
    "       events.nomClubs,\n" +
    "       group_concat(NOM_ETUDIANT separator ', ') as Responsables,\n" +
    "       group_concat(TITRE separator ', ')        as Postes\n" +
    "from (select e.EVENT_ID                            as EVENTS_ID,\n" +
    "             e.COMITE_ID                           as COMITES_ID,\n" +
    "             NOM_EVENT,\n" +
    "             count(NOM_CLUB)                       as nbClubs,\n" +
    "             group_concat(NOM_CLUB separator ', ') as nomClubs\n" +
    "      from organise\n" +
    "               join evenements e on e.EVENT_ID = organise.EVENT_ID\n" +
    "               join clubs c on c.CLUB_ID = organise.CLUB_ID\n" +
    "      group by e.EVENT_ID) as events,\n" +
    "     commite,\n" +
    "     compose,\n" +
    "     poste,\n" +
    "     etudiants\n" +
    "where events.nbClubs > 1\n" +
    "  and events.COMITES_ID = commite.COMITE_ID\n" +
    "  and compose.COMITE_ID = commite.COMITE_ID\n" +
    "  and compose.POSTE_ID = poste.POSTE_ID\n" +
    "  and compose.NUM_ETUDIANT = etudiants.NUM_ETUDIANT\n" +
    "group by EVENTS_ID\n" +
    ";"

const req_8 = `select OBJET, p.INTITULE as Provenance, NOM_CLUB
from traitement
         join provenances p on p.PROVENANCE_ID = traitement.PROVENANCE_ID
         join clubs c on c.CLUB_ID = traitement.CLUB_ID
         join type_traitement tt on traitement.TYPE_ID = tt.TRAITEMENT_ID
where tt.INTITULE = 'récompense'
order by c.CLUB_ID;`



connection.connect();

connection.query(req_1, function (error, results) {
    if (error) throw error;
    console.log("\n//////////////////////\nReq 1 :\n", results)
});

connection.query(req_2, function (error, results) {
    if (error) throw error;
    console.log("\n//////////////////////\nReq 2 :\n", results)
});

connection.query(req_3, function (error, results) {
    if (error) throw error;
    console.log("\n//////////////////////\nReq 3 :\n", results)
});

connection.query(req_4, function (error, results) {
    if (error) throw error;
    console.log("\n//////////////////////\nReq 4 :\n", results)
});

connection.query(req_5, function (error, results) {
    if (error) throw error;
    console.log("\n//////////////////////\nReq 5 :\n", results)
});

connection.query(req_6, function (error, results) {
    if (error) throw error;
    console.log("\n//////////////////////\nReq 6 :\n", results)
});

connection.query(req_7, function (error, results) {
    if (error) throw error;
    console.log("\n//////////////////////\nReq 7 :\n", results)
});

connection.query(req_8, function (error, results) {
    if (error) throw error;
    console.log("\n//////////////////////\nReq 8 :\n", results)
});

connection.end()
