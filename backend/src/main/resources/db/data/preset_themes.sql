-- Temi predefiniti di sistema
-- Eseguire una sola volta al primo avvio (o gestire via Flyway repeatable migration)
INSERT INTO themes (name, description, icon_emoji, preset) VALUES
  ('Gratitudine',      'Condividi momenti di gratitudine e riconoscenza',   '🙏',  TRUE),
  ('Benessere',        'Salute mentale, fisica e lifestyle positivo',         '🌿',  TRUE),
  ('Successi',         'Traguardi personali e professionali',                 '🏆',  TRUE),
  ('Natura',           'Paesaggi, animali e meraviglie del mondo naturale',   '🌍',  TRUE),
  ('Arte & Creatività','Musica, pittura, scrittura e ogni forma d''arte',     '🎨',  TRUE),
  ('Famiglia',         'Momenti belli con le persone care',                   '👨‍👩‍👧‍👦', TRUE),
  ('Sport',            'Attività fisica, sport e movimento',                  '⚽',  TRUE),
  ('Viaggi',           'Esplorazioni, mete e avventure in giro per il mondo', '✈️',  TRUE),
  ('Cibo',             'Ricette, ristoranti e piaceri culinari',              '🍽️',  TRUE),
  ('Ispirazione',      'Citazioni, storie e idee che ispirano',               '💡',  TRUE)
ON CONFLICT (name) DO NOTHING;
