-- Aligner les packs sur 100 FCFA / vote (contrainte amount = vote_count * 100)
UPDATE public.vote_packages
SET amount = votes * 100
WHERE amount IS DISTINCT FROM votes * 100;
