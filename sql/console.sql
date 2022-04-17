-- membres de club
drop view if exists membres_clubs;
create view membres_clubs as
select e.NOM_ETUDIANT, c.NOM_CLUB, e.NUM_ETUDIANT, c.CLUB_ID
from etudiants e,
     clubs c,
     membres m
where m.CLUB_ID = c.CLUB_ID
  and m.NUM_ETUDIANT = e.NUM_ETUDIANT
order by c.CLUB_ID;

-- responsables de club
drop view if exists respo_clubs;
create view respo_clubs as
select e.NUM_ETUDIANT, e.NOM_ETUDIANT, p.TITRE, c.NOM_CLUB, r.DATE_DEBUT, r.DATE_FIN, c.CLUB_ID
from etudiants e,
     clubs c,
     poste p,
     responsabilites r
where r.CLUB_ID = c.CLUB_ID
  and r.NUM_ETUDIANT = e.NUM_ETUDIANT
  and r.POSTE_ID = p.POSTE_ID
order by c.CLUB_ID;

-- comités
drop view if exists comites;
create view comites as
select e.NOM_ETUDIANT, e.NUM_ETUDIANT, p.titre, ev.NOM_EVENT, c.COMITE_ID
from poste p,
     etudiants e,
     evenements ev,
     compose,
     commite c
where ev.COMITE_ID = c.COMITE_ID
  and c.COMITE_ID = compose.COMITE_ID
  and compose.NUM_ETUDIANT = e.NUM_ETUDIANT
  and compose.POSTE_ID = p.POSTE_ID
order by COMITE_ID;

-- events et clubs asscoiés
drop view if exists events_clubs;
create view events_clubs as
select e.NOM_EVENT, montant, c.NOM_CLUB, e.DATE_DEBUT, e.DATE_FIN, e.EVENT_ID
from budget b,
     organise
         join clubs c on c.CLUB_ID = organise.CLUB_ID
         join evenements e on e.EVENT_ID = organise.EVENT_ID
where e.BUDGET_ID = b.BUDGET_ID
order by e.EVENT_ID;


-- rapports
drop view if exists reports;
create view reports as
select c.NOM_CLUB, er.ETAT, date_ecriture, DATE_SOUMISSION, RAPPORT_ID
from rapports
         join clubs c on c.CLUB_ID = rapports.CLUB_ID
         join etats_rapports er on er.ETAT_ID = rapports.ETAT_ID;

-- signatures
drop view if exists signatures;
create view signatures as
select c.NOM_CLUB, er.ETAT, e.NOM_ETUDIANT, signe.DATE_SIGNATURE
from signe
         join rapports r on r.RAPPORT_ID = signe.RAPPORT_ID
         join clubs c on c.CLUB_ID = r.CLUB_ID
         join etats_rapports er on er.ETAT_ID = r.ETAT_ID
         join etudiants e on e.NUM_ETUDIANT = signe.NUM_ETUDIANT;


-- traitements
drop view if exists traitements;
create view traitements as
SELECT OBJET, p.intitule as Provenance, t.intitule as Traitement, NOM_CLUB, DATE_TRAITEMENT
from traitement
         join clubs c on c.CLUB_ID = traitement.CLUB_ID
         join provenances p on p.PROVENANCE_ID = traitement.PROVENANCE_ID
        join type_traitement t on t.TRAITEMENT_ID = traitement.TYPE_ID