-- Script pour mettre à jour les dates des demandes pour qu'elles soient réparties sur les derniers mois
-- Cela permettra aux graphiques d'afficher des données variées

UPDATE salary_advance_requests 
SET date_creation = '2025-01-15 10:30:00'
WHERE id = '9ddf3be0-f722-46e0-949f-3babb0d03695';

UPDATE salary_advance_requests 
SET date_creation = '2025-01-20 14:15:00'
WHERE id = '4f8535d3-a0c2-40c5-be16-0c60b0ba197e';

UPDATE salary_advance_requests 
SET date_creation = '2025-01-25 09:45:00'
WHERE id = '0947b6e0-ed38-4688-8834-4dd5fe700371';

UPDATE salary_advance_requests 
SET date_creation = '2024-12-10 16:20:00'
WHERE id = '813f8e17-de4c-4f89-a3c7-65b0e794be11';

UPDATE salary_advance_requests 
SET date_creation = '2024-12-15 11:30:00'
WHERE id = '4f21705b-f580-47bb-9b27-4a279360e648';

UPDATE salary_advance_requests 
SET date_creation = '2024-12-20 13:45:00'
WHERE id = '9a375ed9-37c6-47a2-9840-288d1ec6c6b5';

UPDATE salary_advance_requests 
SET date_creation = '2024-11-05 08:15:00'
WHERE id = 'd5dc06ee-0ef7-4edc-ae76-1469f7e339ef';

UPDATE salary_advance_requests 
SET date_creation = '2024-11-12 15:30:00'
WHERE id = '89f139ce-b6af-4df5-96f7-d1827aa6cbc7';

UPDATE salary_advance_requests 
SET date_creation = '2024-10-18 12:00:00'
WHERE id = 'b7023175-a793-4053-91e0-4eb095d04dcb';

UPDATE salary_advance_requests 
SET date_creation = '2024-10-25 14:20:00'
WHERE id = 'd34f7c2a-83b9-4110-917b-41280f82f58b';

UPDATE salary_advance_requests 
SET date_creation = '2024-09-15 10:45:00'
WHERE id = '2cbbf9ac-382b-468f-bea2-ac575e1255a0';

UPDATE salary_advance_requests 
SET date_creation = '2024-09-22 16:10:00'
WHERE id = 'bbcc7f29-e580-4279-838b-f4da3bc3ec6f';

-- Vérifier les dates mises à jour
SELECT 
  id,
  employees.prenom || ' ' || employees.nom as employe,
  montant_demande,
  type_motif,
  statut,
  date_creation,
  TO_CHAR(date_creation, 'DD/MM/YYYY') as date_formatee
FROM salary_advance_requests
JOIN employees ON salary_advance_requests.employee_id = employees.id
WHERE partenaire_id = 'e58fc4f9-83c9-45a2-a7b3-275d382664f9'
ORDER BY date_creation DESC; 