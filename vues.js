const mysql = require('mysql8');
const Importer = require('mysql-import');
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

const importer = new Importer({host, user, password});

// New onProgress method, added in version 5.0!
importer.onProgress(progress => {
    let percent = Math.floor(progress.bytes_processed / progress.total_bytes * 10000) / 100;
    console.log(`${percent}% Completed`);
});

importer.import('./sql/vues.sql').then(() => {
    const files_imported = importer.getImported();
    console.log(`${files_imported.length} SQL file(s) imported.`);
}).catch(err => {
    console.error(err);
});


const vues = `drop view if exists top_clubs;

create view top_clubs as
select NOM_CLUB
from (select MIN(MONTANT + var_totale) as Budget_Excedent,
             NOM_CLUB
      from (select sum(VARIATION) as var_totale, NOM_EVENT, EVENT_ID
            from evenements,
                 calendrier_argent
                     join budget b on b.BUDGET_ID = calendrier_argent.BUDGET_ID
            where evenements.BUDGET_ID = b.BUDGET_ID
            group by EVENT_ID) as somme,
           budget,
           evenements,
           organise,
           clubs
      where somme.EVENT_ID = evenements.EVENT_ID
        and evenements.BUDGET_ID = budget.BUDGET_ID
        and organise.EVENT_ID = evenements.EVENT_ID
        and organise.CLUB_ID = clubs.CLUB_ID
      group by clubs.CLUB_ID) as minBudget
where minBudget.Budget_Excedent >= 0
;

drop view if exists top_presidents;

create view top_presidents as
select e.NOM_ETUDIANT as Etudiant, d.DATE_ECRITURE as Date_soummission, DATEDIFF(DATE_ECRITURE, r.DATE_DEBUT) as Delai
from etudiants e,
     clubs c,
     poste p,
     responsabilites r,
     rapports d
where r.CLUB_ID = c.CLUB_ID
  and r.NUM_ETUDIANT = e.NUM_ETUDIANT
  and r.POSTE_ID = p.POSTE_ID
  and d.CLUB_ID = r.CLUB_ID
  and p.TITRE = 'Président'
  and d.DATE_ECRITURE is not null
  and d.DATE_ECRITURE BETWEEN r.DATE_DEBUT and r.DATE_FIN
order by Delai
limit 5;

drop view if exists aujourdhui;

create view aujourdhui as
select NOM_EVENT, DATE_DEBUT, group_concat(NOM_CLUB separator ', ') as Clubs_Responsables
from organise
         join clubs c on c.CLUB_ID = organise.CLUB_ID
         join evenements e on e.EVENT_ID = organise.EVENT_ID
where DATE(DATE_DEBUT) = CURDATE()
group by e.EVENT_ID, DATE_DEBUT
order by e.DATE_DEBUT;

drop view if exists faineant;

create view faineant as
select NOM_ETUDIANT, NOM_CLUB, year(lateSignature.date_tardive) as AnneeRapport
from (select count(*)            as nbSignature,
             nom_club,
             max(DATE_SIGNATURE) as date_tardive,
             signe.RAPPORT_ID    as rapport_tardif
      from signe
               join rapports r on r.RAPPORT_ID = signe.RAPPORT_ID
               join etats_rapports er on er.ETAT_ID = r.ETAT_ID
               join etudiants e on signe.NUM_ETUDIANT = e.NUM_ETUDIANT
               join clubs c on r.CLUB_ID = c.CLUB_ID
      where (ETAT = 'signé' or ETAT = 'soumis')
      group by signe.RAPPORT_ID) as lateSignature,
     signe,
     etudiants
where lateSignature.date_tardive = signe.DATE_SIGNATURE
  and signe.NUM_ETUDIANT = etudiants.NUM_ETUDIANT
  and lateSignature.rapport_tardif = signe.RAPPORT_ID
  and nbSignature > 1 order by AnneeRapport;
  
drop view if exists trouble_fete;

create view trouble_fete as
select NOM_CLUB, max(Nombre_Sanction) as Nb_Sanctions
from (select NOM_CLUB, count(*) Nombre_Sanction
      from (select OBJET, p.INTITULE as Provenance, NOM_CLUB
            from traitement
                     join provenances p on p.PROVENANCE_ID = traitement.PROVENANCE_ID
                     join clubs c on c.CLUB_ID = traitement.CLUB_ID
                     join type_traitement tt on traitement.TYPE_ID = tt.TRAITEMENT_ID
            where tt.INTITULE = 'sanction') compte
      group by NOM_CLUB
      order by count(*) desc) ordre;
      
drop view if exists vaut_mieux_acheter;

create view vaut_mieux_acheter as
select DESCRIPTION, nom_event, ca.VARIATION * -1 as Cout
from taches t
         join calendrier_argent ca on t.CALENDRIER_ID = ca.CALENDRIER_ID
         join evenements e on t.EVENT_ID = e.EVENT_ID
where ca.AFFECTATION = 'location'
order by ca.VARIATION
limit 3;

drop view if exists teachers_pet;

Create view teachers_pet as
select NOM_CLUB, max(Nombre_Recompenses) as Nb_Recompenses
from (select NOM_CLUB, count(*) Nombre_Recompenses
      from (select OBJET, p.INTITULE as Provenance, NOM_CLUB
            from traitement
                     join provenances p on p.PROVENANCE_ID = traitement.PROVENANCE_ID
                     join clubs c on c.CLUB_ID = traitement.CLUB_ID
                     join type_traitement tt on traitement.TYPE_ID = tt.TRAITEMENT_ID
            where tt.INTITULE = 'récompense'
              and p.INTITULE = 'admin') compte
      group by NOM_CLUB
      order by count(*) desc) ordre;

drop view if exists perf;

create view perf as
select NOM_CLUB,
       Nom_prez,
       if(event is null, 'Aucun', event) as Events,
       if(sponso_event is null, 'Aucun', event) as Sponsors,
       Jours_pour_rapport,
       if(Recompenses_Sanctions is null, 'Aucune recompense/santion', Recompenses_Sanctions) as Recompenses_Sanctions
from (select distinct NOM_CLUB,
                      Nom_prez,
                      event,
                      sponso_event,
                      Jours_pour_rapport,
                      group_concat(if(traitements.Date_tr is not null and
                                      traitements.Date_tr between mandats.DATE_DEBUT and mandats.DATE_FIN,
                                      traitements.objet_tr,
                                      null) separator ', ') as Recompenses_Sanctions
      from (select distinct clubs.CLUB_ID,
                            if(clubs.CLUB_ID in (traitements.CLUB_ID), traitements.TRAITEMENT_ID,
                               null) as id_tr,
                            if(clubs.CLUB_ID in (traitements.CLUB_ID), traitements.OBJET,
                               null) as objet_tr,
                            if(clubs.CLUB_ID in (traitements.CLUB_ID), traitements.DATE_TRAITEMENT,
                               null) as Date_tr

            from (select CLUB_ID, NOM_CLUB, null as Date_Traitement
                  from clubs
                  where not exists(select traitement.CLUB_ID, NOM_CLUB
                                   from traitement
                                   where clubs.CLUB_ID = traitement.CLUB_ID)) as no_traitement,
                 (SELECT cl.CLUB_ID, NOM_CLUB, DATE_TRAITEMENT, TRAITEMENT_ID, OBJET
                  from traitement
                           join clubs cl on cl.CLUB_ID = traitement.CLUB_ID
                           join provenances pr on pr.PROVENANCE_ID = traitement.PROVENANCE_ID) as traitements,
                 clubs
            where no_traitement.CLUB_ID = clubs.CLUB_ID
               or traitements.CLUB_ID = clubs.CLUB_ID) as traitements,
           (select distinct clubs.CLUB_ID,
                            NOM_CLUB,
                            NOM_ETUDIANT                                              as Nom_Prez,
                            responsabilites.DATE_DEBUT,
                            responsabilites.DATE_FIN,
                            group_concat(if(
                                                 events.Date_Event between responsabilites.DATE_DEBUT and responsabilites.DATE_FIN,
                                                 NOM_EVENT, null) separator ', ')     as event,
                            group_concat(if(
                                                 events.Date_Event between responsabilites.DATE_DEBUT and responsabilites.DATE_FIN,
                                                 Sponsor_Event, null) separator ', ') as sponso_event,
                            IF(DATEDIFF(rapports.DATE_ECRITURE, responsabilites.DATE_DEBUT) is not null,
                               DATEDIFF(rapports.DATE_ECRITURE, responsabilites.DATE_DEBUT),
                               'Non écrit')                                           as Jours_pour_Rapport
            from responsabilites,
                 clubs,
                 poste,
                 etudiants,
                 rapports,
                 (select distinct clubs.CLUB_ID,
                                  if(clubs.CLUB_ID not in (no_event.CLUB_ID), sponso_event.NOM_EVENT,
                                     null)                                                                   as Nom_Event,
                                  if(clubs.CLUB_ID not in (no_event.CLUB_ID), sponso_event.EVENT_ID,
                                     null)                                                                   as Event_ID,
                                  if(clubs.CLUB_ID not in (no_event.CLUB_ID), sponso_event.DATE_DEBUT,
                                     null)                                                                   as Date_Event,
                                  if(clubs.CLUB_ID not in (no_event.CLUB_ID), sponso_event.Sponsors,
                                     null)                                                                   as Sponsor_Event
                  from (select CLUB_ID
                        from clubs
                        where not exists(select CLUB_ID from organise where organise.CLUB_ID = clubs.CLUB_ID)) as no_event,
                       (select distinct clu.CLUB_ID,
                                        e.EVENT_ID,
                                        e.NOM_EVENT,
                                        e.date_debut,
                                        if(e.EVENT_ID in (sponso.EVENT_ID), sponso.Sponsors, 0) as Sponsors
                        from (select EVENT_ID, NOM_EVENT, sum(VARIATION) as Sponsors
                              from calendrier_argent,
                                   evenements
                                       join budget b on b.BUDGET_ID = evenements.BUDGET_ID
                              where calendrier_argent.BUDGET_ID = b.BUDGET_ID
                                and calendrier_argent.AFFECTATION = 'sponsors'
                                and calendrier_argent.VARIATION > 0
                              group by EVENT_ID) as sponso,
                             (select EVENT_ID, nom_event, 0 as Sponsors
                              from evenements
                              where not exists(select EVENT_ID, NOM_EVENT
                                               from calendrier_argent
                                                        join budget b on b.BUDGET_ID = evenements.BUDGET_ID
                                               where calendrier_argent.BUDGET_ID = b.BUDGET_ID
                                                 and calendrier_argent.AFFECTATION = 'sponsors')) as no_sponso,
                             evenements e,
                             clubs clu,
                             organise org
                        where (sponso.EVENT_ID = e.EVENT_ID
                            or no_sponso.EVENT_ID = e.EVENT_ID)
                          and (org.EVENT_ID = e.EVENT_ID
                            and org.CLUB_ID = clu.CLUB_ID)) as sponso_event,
                       clubs
                  where clubs.CLUB_ID = no_event.CLUB_ID
                     or sponso_event.CLUB_ID = clubs.CLUB_ID
                  order by EVENT_ID desc) as events
            where responsabilites.CLUB_ID = clubs.CLUB_ID
              and responsabilites.POSTE_ID = poste.POSTE_ID
              and responsabilites.NUM_ETUDIANT = etudiants.NUM_ETUDIANT
              and rapports.CLUB_ID = clubs.CLUB_ID
              and events.CLUB_ID = clubs.CLUB_ID
              and (rapports.DATE_ECRITURE BETWEEN responsabilites.DATE_DEBUT AND responsabilites.DATE_FIN or
                   rapports.DATE_ECRITURE is null)
              and TITRE = 'Président'
            group by clubs.CLUB_ID, NOM_ETUDIANT, responsabilites.DATE_DEBUT
            order by responsabilites.DATE_DEBUT desc) as mandats
      where mandats.CLUB_ID = traitements.CLUB_ID
      group by mandats.CLUB_ID, mandats.Nom_Prez, mandats.DATE_DEBUT
      order by mandats.CLUB_ID, mandats.DATE_DEBUT desc) as perf;  
`

connection.connect();

connection.query(vues, function (error, results) {
    if (error) throw error;
    console.log("Vues créées !")
});

connection.query('select * from top_clubs;', function (error, results) {
    if (error) throw error;
    console.log("\n//////////////////////\nVue 1\n top_clubs :\n", results)
});

connection.query('select * from top_presidents;', function (error, results) {
    if (error) throw error;
    console.log("\n//////////////////////\nVue 2\n top_presidents :\n", results)
});

connection.query('select * from aujourdhui;', function (error, results) {
    if (error) throw error;
    console.log("\n//////////////////////\nVue 3\n aujourdhui :\n", results)
});

connection.query('select * from faineant;', function (error, results) {
    if (error) throw error;
    console.log("\n//////////////////////\nVue 4\n faineant :\n", results)
});

connection.query('select * from trouble_fete;', function (error, results) {
    if (error) throw error;
    console.log("\n//////////////////////\nVue 5\n trouble_fete :\n", results)
});

connection.query('select * from vaut_mieux_acheter;', function (error, results) {
    if (error) throw error;
    console.log("\n//////////////////////\nVue 6\n vaut_mieux_acheter :\n", results)
});

connection.query('select * from teachers_pet;', function (error, results) {
    if (error) throw error;
    console.log("\n//////////////////////\nVue 7\n teachers_pet :\n", results)
});

connection.query('select * from perf;', function (error, results) {
    if (error) throw error;
    console.log("\n//////////////////////\nVue 8\n perf :\n", results)
});

connection.end()

