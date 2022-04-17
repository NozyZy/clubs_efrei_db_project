-- 1.
select c.NOM_CLUB     as Club,
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
order by c.CLUB_ID;

-- 2
-- depenses seulement si comite => event avec comite seulement
select evenements.NOM_EVENT                        as Nom_event,
       evenements.DATE_DEBUT,
       b.MONTANT                                   as Budget_Alloue,
       group_concat(e.NOM_ETUDIANT separator ', ') as Membres_comite,
       cal.VARIATION * -1                          as Depenses,
       cal.AFFECTATION                             as Objet_depense
from evenements
         join commite comite on comite.COMITE_ID = evenements.COMITE_ID
         join budget b on evenements.BUDGET_ID = b.BUDGET_ID
         join compose comp on comite.COMITE_ID = comp.COMITE_ID
         join etudiants e on comp.NUM_ETUDIANT = e.NUM_ETUDIANT
         join calendrier_argent cal on b.BUDGET_ID = cal.BUDGET_ID
where year(DATE_DEBUT) = year(CURDATE()) - 1
  and cal.VARIATION < 0
group by EVENT_ID;

-- 3
select NOM_CLUB as Nom_Club, ETAT as Etat_Rapport, year(DATE_ECRITURE) as Annee
from rapports
         join etats_rapports er on er.ETAT_ID = rapports.ETAT_ID
         join clubs c on c.CLUB_ID = rapports.CLUB_ID
order by Annee desc, ETAT;

-- 4
-- membres clubs 'en attente de signature'
select distinct e.NUM_ETUDIANT
from signe
         join rapports r on r.RAPPORT_ID = signe.RAPPORT_ID
         join etats_rapports er on er.ETAT_ID = r.ETAT_ID
         join clubs c on c.CLUB_ID = r.CLUB_ID
         join responsabilites r2 on c.CLUB_ID = r2.CLUB_ID
         join etudiants e on r2.NUM_ETUDIANT = e.NUM_ETUDIANT
where ETAT = 'en attente de signature';

-- membres de ces clubs ayant signés
select NUM_ETUDIANT
from signe
         join rapports r on r.RAPPORT_ID = signe.RAPPORT_ID
         join etats_rapports er on er.ETAT_ID = r.ETAT_ID
where ETAT = 'en attente de signature';

-- chaque poste est associé au club du meme index
-- 5
select etudiants.NUM_ETUDIANT,
       etudiants.NOM_ETUDIANT,
       nbClubs.nb_clubs,
       concat_ws(', ', po.nom, me.nom)     as clubs,
       concat_ws(', ', po.poste, me.poste) as postes
from (select etudiants.NUM_ETUDIANT, count(distinct m.CLUB_ID) + count(distinct r.CLUB_ID) as nb_clubs
      from etudiants
               join membres m on etudiants.NUM_ETUDIANT = m.NUM_ETUDIANT
               join responsabilites r on etudiants.NUM_ETUDIANT = r.NUM_ETUDIANT
      where CURDATE() BETWEEN r.DATE_DEBUT and r.DATE_FIN
      group by m.NUM_ETUDIANT) as nbClubs,
     (select NUM_ETUDIANT,
             group_concat(NOM_CLUB separator ', ') as nom,
             group_concat(TITRE SEPARATOR ', ')    as poste
      from responsabilites r,
           poste,
           clubs
      where r.POSTE_ID = poste.POSTE_ID
        and r.CLUB_ID = clubs.CLUB_ID
        and CURDATE() BETWEEN r.DATE_DEBUT and r.DATE_FIN
      group by NUM_ETUDIANT) as po,
     (select NUM_ETUDIANT,
             group_concat(NOM_CLUB separator ', ') as nom,
             group_concat('Membre' SEPARATOR ', ') as poste
      from membres,
           clubs
      where membres.CLUB_ID = clubs.CLUB_ID
      group by NUM_ETUDIANT) as me,
     etudiants
where nbClubs.NUM_ETUDIANT = po.NUM_ETUDIANT
  and nbClubs.NUM_ETUDIANT = me.NUM_ETUDIANT
  and etudiants.NUM_ETUDIANT = nbClubs.NUM_ETUDIANT
group by etudiants.NUM_ETUDIANT;


-- 6
select AFFECTATION, VARIATION * -1 as Cout, r.NOM_ETUDIANT as Responsable, DESCRIPTION
from taches
         join calendrier_argent ca on taches.CALENDRIER_ID = ca.CALENDRIER_ID
         join etudiants r on taches.RESPONSABLE_ID = r.NUM_ETUDIANT
order by VARIATION
limit 10;

-- 7
select NOM_EVENT,
       events.nomClubs,
       group_concat(NOM_ETUDIANT separator ', ') as Responsables,
       group_concat(TITRE separator ', ')        as Postes
from (select e.EVENT_ID                            as EVENTS_ID,
             e.COMITE_ID                           as COMITES_ID,
             NOM_EVENT,
             count(NOM_CLUB)                       as nbClubs,
             group_concat(NOM_CLUB separator ', ') as nomClubs
      from organise
               join evenements e on e.EVENT_ID = organise.EVENT_ID
               join clubs c on c.CLUB_ID = organise.CLUB_ID
      group by e.EVENT_ID) as events,
     commite,
     compose,
     poste,
     etudiants
where events.nbClubs > 1
  and events.COMITES_ID = commite.COMITE_ID
  and compose.COMITE_ID = commite.COMITE_ID
  and compose.POSTE_ID = poste.POSTE_ID
  and compose.NUM_ETUDIANT = etudiants.NUM_ETUDIANT
group by EVENTS_ID
;

-- 8
select OBJET, p.INTITULE as Provenance, NOM_CLUB
from traitement
         join provenances p on p.PROVENANCE_ID = traitement.PROVENANCE_ID
         join clubs c on c.CLUB_ID = traitement.CLUB_ID
         join type_traitement tt on traitement.TYPE_ID = tt.TRAITEMENT_ID
where tt.INTITULE = 'récompense'
order by c.CLUB_ID;