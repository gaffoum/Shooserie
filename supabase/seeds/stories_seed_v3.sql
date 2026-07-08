-- ============================================================
-- Shooserie — Seed des histoires · VAGUE 3 (couverture collabs)
-- 35 histoires (le doublon exact « Sean Wotherspoon », déjà en v1, est exclu).
-- Additif à v1 (stories_seed.sql) et v2 (stories_seed_v2.sql).
--
-- ⚠️ Motifs LARGES (Travis Scott, Supreme, Parra, atmos…) : le rattachement
-- côté client (matchStory) prend déjà le match_pattern LE PLUS LONG, donc les
-- motifs précis (v1/v2) l'emportent sur ces motifs généraux. Aucune régression.
-- Apostrophes doublées = correct en SQL (ne pas coller tel quel en JS).
-- ============================================================

insert into public.sneaker_stories (match_pattern, title, story, year_context) values

-- ==================== COLLABORATEURS (pattern large = tous les coloris) ====================

('Patta',
 'L''institution d''Amsterdam',
 'Fondée à Amsterdam au milieu des années 2000, Patta est passée du petit magasin de sneakers au statut d''institution du streetwear européen. Sa série « Waves » sur l''Air Max 1 — motif ondulé sérigraphié, souvent accompagné d''un bracelet — est devenue un rendez-vous incontournable. Chaque drop Patta mêle héritage néerlandais, culture hip-hop et savoir-faire, et s''arrache en quelques minutes.',
 NULL),

('sacai',
 'L''art de l''hybride',
 'Chitose Abe, fondatrice de sacai, applique à la sneaker sa signature : le « hybride ». Deux modèles fusionnés en un — doubles Swooshs, doubles languettes, doubles semelles — comme sur la LD Waffle ou la Vaporwaffle. Le résultat déstabilise l''œil et est devenu l''une des collaborations Nike les plus influentes de la fin des années 2010.',
 NULL),

('Levi',
 'Le denim dans l''ADN',
 'Levi''s, inventeur du jean en 1873, applique son denim brut et ses étiquettes cuir iconiques aux silhouettes Jordan et Nike. La toile se patine avec le temps, exactement comme un bon jean — chaque paire vieillit différemment selon son porteur. Un mariage de deux patrimoines américains, où la basket devient un vêtement à part entière.',
 NULL),

('Union',
 'Le boutique-store de Los Angeles',
 'Union LA, la boutique culte de Los Angeles dirigée par Chris Gibbs, réinterprète les classiques Jordan avec une patine vintage et des détails déconstruits — doublures apparentes, matériaux vieillis, double laçage. Ses collaborations, souvent en tirage réduit, sont parmi les plus respectées des connaisseurs pour leur souci du détail.',
 NULL),

('CLOT',
 'Le Kiss of Death d''Edison Chen',
 'CLOT, la marque d''Edison Chen basée à Hong Kong, jette un pont entre l''Orient et l''Occident. Sa série « Kiss of Death » — empeigne translucide veinée de rouge, évoquant la soie et la médecine traditionnelle chinoise — est devenue un classique. Chaque projet CLOT infuse la sneaker occidentale d''un symbolisme asiatique fort.',
 NULL),

('Fragment',
 'L''éclair d''Hiroshi Fujiwara',
 'Hiroshi Fujiwara, parrain du streetwear japonais, signe ses collaborations du double éclair Fragment Design. Sa philosophie : retirer plutôt qu''ajouter, viser l''épure et le détail juste. Un logo Fragment sur une paire suffit à en faire un objet de désir mondial — l''influence discrète mais absolue d''un pionnier.',
 NULL),

('Nigel Sylvester',
 'Le BMX sur le bitume',
 'Nigel Sylvester, rideur BMX professionnel de Queens, traduit son univers de la rue dans ses Jordan : détails inspirés du vélo, matériaux résistants, storytelling « brick by brick » sur l''effort et la construction de soi. Une des rares voix du BMX à avoir décroché sa propre ligne signature chez Jordan Brand.',
 NULL),

('Undefeated',
 'La stratégie militaire',
 'UNDEFEATED, la boutique californienne au « 5 Strikes », puise dans l''imagerie militaire et sportive US. Ses collaborations adidas et Nike — camouflages, bandes « stars and stripes », finitions premium — sont bâties comme des pièces de collection. Une des enseignes les plus influentes du sneaker game des années 2000.',
 NULL),

('Supreme',
 'Le Box Logo qui fait la loi',
 'Née du skate new-yorkais en 1994, Supreme transforme tout ce qu''elle touche en objet de convoitise. Ses collaborations Nike — de l''Air Force à la Dunk en passant par l''Air Max — provoquent files d''attente et reventes stratosphériques. Le pouvoir du Box Logo rouge : transformer une silhouette classique en événement culturel.',
 '1994'),

('Kith',
 'L''empire de Ronnie Fieg',
 'Parti de la boutique new-yorkaise, Ronnie Fieg a bâti avec Kith l''une des marques les plus prolifiques du game. Ses collaborations — adidas, ASICS, New Balance, Salomon — se distinguent par des palettes sobres et raffinées et un sens aigu du storytelling (« Kithmas », séries capsules). La griffe Kith est un gage de goût.',
 NULL),

('Stussy',
 'Le pionnier du streetwear',
 'Née du surf californien dans les années 80, Stüssy est l''une des marques fondatrices du streetwear mondial. Ses collaborations Nike — Huarache, Spiridon — misent sur des matières premium et des teintes terreuses, fidèles à son héritage laid-back. Une signature manuscrite devenue légende.',
 NULL),

('Corteiz',
 'La guérilla londonienne',
 'Corteiz, la marque londonienne de Clint419, a bâti sa légende sur des drops sauvages et anti-système — adresses secrètes, échanges surprises, communication guérilla. Ses collaborations Nike (Air Max 95, Air Trainer Huarache) se méritent autant qu''elles s''achètent. L''esprit rebelle du streetwear UK contemporain.',
 NULL),

('NOCTA',
 'La marque de Drake',
 'NOCTA, la sous-marque de Drake avec Nike, tire son nom des nuits de studio de l''artiste. Ses silhouettes — Air Force 1 « Certified Lover Boy », Hot Step — jouent la carte du luxe discret et du branding épuré. La rencontre du rap le plus écouté de la planète et du Swoosh.',
 NULL),

('J Balvin',
 'Les couleurs de Medellín',
 'J Balvin, superstar mondiale du reggaeton, injecte dans ses Jordan l''énergie colorée de la Colombie : smileys, arcs-en-ciel, matières vibrantes, message « vibra positiva ». Ses paires, joyeuses et immédiatement reconnaissables, prolongent l''univers pop et solaire de l''artiste.',
 NULL),

('Fear of God',
 'Le luxe selon Jerry Lorenzo',
 'Jerry Lorenzo, fondateur de Fear of God, a redéfini le sportswear haut de gamme. Sa ligne adidas Athletics traduit sa vision du basketball premium — lignes épurées, palettes neutres, matériaux nobles. Une esthétique feutrée qui a influencé toute une génération de designers.',
 NULL),

('Comme des Garcons',
 'L''avant-garde de Rei Kawakubo',
 'Comme des Garçons, la maison de Rei Kawakubo, aborde la sneaker comme un objet de mode conceptuel. Ses collaborations Nike et ASICS déstructurent, exagèrent ou épurent les silhouettes à l''extrême. L''avant-garde japonaise appliquée au bitume.',
 NULL),

('atmos',
 'Le laboratoire de Tokyo',
 'atmos, la boutique tokyoïte, est le traducteur officiel du streetwear japonais auprès des grandes marques. Au-delà de ses Air Max 1 légendaires, atmos décline son goût du print (camo, animalier) sur la Dunk, l''ASICS et bien d''autres. Un flair repéré par le monde entier.',
 NULL),

('Parra',
 'L''artiste néerlandais',
 'Piet Parra, artiste d''Amsterdam, appose son univers graphique — aplats de couleurs, silhouettes stylisées, « faux Swoosh » en dégradé — sur ses collaborations Nike, de l''Air Max à la Dunk SB. Chaque paire est littéralement un tableau qu''on porte aux pieds.',
 NULL),

('Travis Scott',
 'La griffe Cactus Jack',
 'Au-delà de la famille Mocha, Travis Scott décline sa marque Cactus Jack sur une multitude de silhouettes — Air Max 1, Jordan 6, Air Trainer, Jumpman Jack. Sa signature : tons terreux du Texas, détails cachés, Swooshs superposés, et une hype qui ne retombe jamais. Le rappeur qui a fait de chaque drop un événement.',
 NULL),

-- ==================== OFF-WHITE (manquants / majeurs) ====================

('Jordan 1 off White',
 'The Ten : la genèse',
 'C''est LA pièce qui a tout déclenché : en 2017, Virgil Abloh déconstruit la Jordan 1 « Chicago » pour ouvrir sa collection « The Ten » — Swoosh cousu en apparent, texte « AIR », zip-tie, semelle exposée. Elle a redéfini ce qu''une collaboration pouvait être et lancé l''ère Off-White™. L''un des objets les plus importants de l''histoire moderne de la sneaker.',
 '2017'),

('Jordan 5 off white',
 'La déconstruction selon Virgil',
 'La Jordan 5 revisitée par Virgil Abloh : upper translucide, aérations agrandies, mousse apparente. Sortie autour du All-Star Game 2020 de Chicago, elle compte parmi les dernières Jordan menées par le designer. La silhouette de 1990 de Tinker Hatfield, réinterprétée sans être trahie.',
 '2020'),

('Jordan 2 Off White',
 'La 2 selon Virgil',
 'Virgil Abloh applique sa grammaire Off-White™ à la Jordan 2, silhouette rare et mal-aimée qu''il remet en lumière : matières nobles, détails déconstruits, texte signature. Une relecture qui a redonné ses lettres de noblesse à un modèle longtemps oublié du catalogue Jordan.',
 NULL),

('Jordan 2 Retro Low SP Off-White',
 'La 2 selon Virgil',
 'Virgil Abloh applique sa grammaire Off-White™ à la Jordan 2, silhouette rare et mal-aimée qu''il remet en lumière : matières nobles, détails déconstruits, texte signature. Une relecture qui a redonné ses lettres de noblesse à un modèle longtemps oublié du catalogue Jordan.',
 NULL),

('Air Max 97 Off-White',
 'La 97 argentée de The Ten',
 'Pièce de la collection « The Ten » de 2017, l''Air Max 97 selon Virgil Abloh conserve les ondulations réfléchissantes de la silhouette de 1997 tout en exposant sa structure. Le coloris argent d''origine, traité en déconstruit, est l''un des dix modèles qui ont redéfini la collaboration.',
 '2017'),

('Dunk Low Off-White University Gold',
 'The 50',
 'Membre de la série « The 50 » (2021) de Virgil Abloh et Nike : cinquante Dunk Low numérotées, variations subtiles autour d''une même silhouette. Le coloris University Gold apporte sa nuance à cette œuvre-collection — l''une des dernières grandes contributions Nike du designer.',
 '2021'),

('Air Force 1 Mid SP Off-White',
 'L''AF1 mid déconstruite',
 'Déclinaison mid de l''AF1 revue par Virgil Abloh : cage exposée, texte « AIR », sangle au col et zip-tie signature. Un basique de 1982 passé au filtre Off-White™ — patrimoine Nike et design déconstruit réunis.',
 NULL),

-- ==================== PARIS (complément) ====================

('PSG',
 'Le premier club de foot chez Jordan',
 'En 2018, le PSG devient le premier club de football de l''histoire à rejoindre Jordan Brand : Jumpman sur le maillot de Ligue des Champions et un pont inédit entre basket US et foot européen. Les déclinaisons aux couleurs du club scellent l''alliance Paris-Chicago.',
 '2018'),

-- ==================== ONE-OFFS ====================

('Eric Emanuel',
 'Le short devenu sneaker',
 'Eric Emanuel, roi du short de basket premium à New York, étend son univers « McDonald''s All American » à la Forum adidas : palette rétro-collège, matières douillettes, esprit gymnase des années 90. La nostalgie du basket amateur américain, chez un créateur monté très vite.',
 NULL),

('Crocs',
 'L''alliance improbable',
 'Le sabot le plus clivant du monde s''associe aux plus grandes marques — ici McDonald''s — pour des drops aussi absurdes que convoités. Preuve que dans la sneaker culture contemporaine, l''ironie et le confort peuvent valoir de l''or.',
 NULL),

('Social Status',
 'Le magazine devenu marque',
 'Social Status, né comme média puis boutique à Atlanta, cultive un storytelling personnel et introspectif dans ses collaborations Nike et Jordan. Matières feutrées, thèmes intimes (l''enfance, la mémoire) : des paires qui racontent quelque chose plutôt que de crier fort.',
 NULL),

('Powerpuff',
 'Les Super Nanas',
 'Nike SB rend hommage au dessin animé culte : chaque Dunk incarne une des trois Super Nanas — ici Bubbles, tout en bleu pastel et pêche, avec des détails duveteux. La rencontre de la pop culture cartoon et de la Dunk skate.',
 NULL),

('Gundam',
 'Le mecha japonais',
 'Nike SB puise dans l''univers Gundam, saga de robots géants emblématique de l''animation japonaise : la RX-0 Unicorn se traduit en blanc, rouge et détails mécaniques. Un hommage assumé à la pop culture nippone.',
 NULL),

('Olivia Kim',
 'Le regard de la styliste',
 'Olivia Kim, figure influente du retail et de la mode, revisite la Jordan 4 avec son concept « No Cover » — construction dénudée qui expose ce qu''on cache d''habitude. Un regard de styliste qui déstructure le classique avec élégance.',
 NULL),

('Awake',
 'Le renouveau new-yorkais',
 'Awake NY, la marque d''Angelo Baque, porte la fierté d''un New York multiculturel et engagé. Ses collaborations Jordan, sobres et symboliques, prolongent son propos sur l''identité et la communauté. Le streetwear new-yorkais dans sa version consciente.',
 NULL),

('Maison Mihara',
 'La déconstruction japonaise',
 'Maison Mihara Yasuhiro, créateur japonais culte, est célèbre pour ses semelles « écrasées » et son esthétique de l''usure organique. La Hank, avec son allure de toile vintage patinée, incarne cette poésie de l''imparfait chère au designer.',
 NULL);
