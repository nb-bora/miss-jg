# TODO

- [x] Revoir le mécanisme exact qui met `payment_status` à `paid` (webhook vs poll vs applyPaymentStatus)
- [x] Comprendre le classement: `candidate_stats` (vue) calcule `total_votes` via `SUM(vote_transactions.vote_count)` filtré sur `payment_status='paid'`
- [ ] Corriger le script `scripts/rehabilitate-votes.mjs` : actuellement il ne fait que `paid_at` et ne répare pas le cas « paid mais 0 votes » si la vue attend autre chose / si des transactions ont `payment_status='paid'` mais `vote_count`/montant incohérents
- [ ] Ajouter une option ciblée par candidat (param `--slug` ou `--candidate-slug`) pour traiter "AFANA ALIMA SABINE OLIVIA"
- [ ] Exécuter le script en `--dry-run` puis `--apply --yes` pour valider et réconcilier automatiquement

