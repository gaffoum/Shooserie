-- ============================================================
-- Shooserie — Seed des histoires · VAGUE 2 (pop culture & collabs)
-- 25 histoires. Additif au seed v1 (stories_seed.sql, 26 lignes).
-- Patterns anti-collision vérifiés contre les vrais noms de la base.
-- Apostrophes doublées = correct en SQL (ne pas coller tel quel en JS).
-- ============================================================

insert into public.sneaker_stories (match_pattern, title, story, year_context) values

-- ==================== YEEZY ====================

('Yeezy Boost 750',
 'La toute première Yeezy adidas',
 'Le jour de la Saint-Valentin 2015, en plein NBA All-Star Weekend, Kanye West dévoile sa première chaussure adidas après avoir quitté Nike : la 750, high-top en daim premium avec sa sangle sur le cou-de-pied et la semelle Boost pleine longueur. Les 9 000 paires du coloris Light Brown partent en dix minutes. Elle pose le modèle de toutes les Yeezy à venir — quantités limitées, hype planétaire, conversation qui dépasse largement le monde de la sneaker.',
 '2015'),

('Yeezy Boost 350 Pirate Black',
 'Le début de la dynastie',
 'Sortie en août 2015, quelques semaines après la Turtle Dove, la « Pirate Black » est l''un des tout premiers coloris de la 350 — la silhouette Primeknit + Boost qui allait devenir la chaussure de la décennie. Sobre, noire, confortable à l''excès : elle a lancé la vague Boost qui a dominé le marché pendant des années.',
 '2015'),

('Yeezy Boost 700 Wave Runner',
 'La dad shoe qui a tout changé',
 'Co-dessinée avec le vétéran Steven Smith et présentée en 2017, la « Wave Runner » leans à contre-courant : massive, superposée, dans un dégradé gris-teal-orange sorti tout droit d''un outlet des années 90. Sur le papier, ça ne devait pas marcher. En pratique, elle a inventé la mode de la « dad shoe » et inspiré Balenciaga, New Balance et Nike.',
 '2017'),

('Yeezy Boost 350 V2 Beluga',
 'Le SPLY-350',
 'Premier coloris de la 350 V2 en 2016, la « Beluga » introduit la bande latérale orange barrée du mystérieux « SPLY-350 » — l''un des éléments de design les plus reconnaissables de la décennie. Personne ne sait vraiment ce que signifie SPLY (« Supply » ? « Saint Pablo Loves You » ?), et c''est très bien comme ça.',
 '2016'),

('Yeezy Boost 350 V2 Zebra',
 'La V2 définitive',
 'Blanc, noir, rouge « SPLY-350 » : la « Zebra » est devenue le visage de la 350 V2, restockée à plusieurs reprises tant la demande était forte. Le coloris que même les non-initiés reconnaissent — la Yeezy dans sa forme la plus iconique.',
 '2017'),

('Yeezy Boost 350 V2 Cream',
 'La Yeezy pour tous',
 'En 2018, Kanye tient sa promesse : que tout le monde puisse avoir sa Yeezy. La « Cream White » (alias Triple White) sort à un million de paires — le plus gros drop de l''histoire de la silhouette. Pari gagné : la rareté n''a pas souffert, et le coloris crème reste l''un des plus purs de la gamme.',
 '2018'),

-- ==================== COLLABS ====================

('NMD Hu Pharrell',
 'Human Race',
 'Pharrell Williams pose sa philosophie sur la NMD : « Human Race », un message d''unité et de diversité inscrit jusque dans les couleurs vives et les mots brodés sur la tige. La rencontre du confort Boost et d''un propos — porter une idée autant qu''une chaussure.',
 '2016'),

('Para-Noise',
 'La peinture qui s''efface',
 'G-Dragon, icône de la K-pop et fondateur de PEACEMINUSONE, imagine une AF1 recouverte d''une couche de peinture noire… conçue pour s''user avec le temps et révéler un dessin caché en dessous. Plus tu la portes, plus elle change : chaque paire devient une œuvre vivante, unique à son propriétaire.',
 '2019'),

('Air Force 1 Low Travis Scott',
 'Cactus Jack sur l''icône',
 'Travis Scott applique sa patte à la chaussure la plus vendue de Nike : nubuck terreux, Swooshs superposés amovibles, branding Cactus Jack. Une relecture discrète mais recherchée de l''AF1, dans les tons désertiques chers au rappeur de Houston.',
 '2018'),

('Air Force 1 Low Supreme',
 'Le Box Logo aux pieds',
 'Quand Supreme rencontre l''Air Force 1 en 2012, le résultat devient instantanément culte : cuir premium, « Supreme » embossé sur le côté, et toute la puissance du Box Logo new-yorkais condensée dans une silhouette de 1982. L''une des collabs qui ont scellé le mariage streetwear × sneaker.',
 '2012'),

('Wu-Tang',
 'Protégez votre came… et vos Dunk',
 'La Dunk High « Wu-Tang » de 1999, frappée du logo au W et du colorway noir-jaune-rouge du clan, est l''un des graals absolus de l''histoire Nike SB — quelques paires seulement à l''époque. Son retour en 2024 permet enfin au commun des mortels de toucher une légende que seuls les initiés connaissaient. Wu-Tang is forever.',
 '1999 · Retro 2024'),

('Bape Sta',
 'La réponse de Nigo',
 'Au début des années 2000, Nigo (A Bathing Ape) crée la Bape Sta : un hommage-clin d''œil assumé à l''Air Force 1, avec son étoile filante à la place du Swoosh et ses brevets brillants. Devenue un pilier de la culture streetwear japonaise, elle a habillé Pharrell, Kanye et toute une génération hip-hop.',
 'Années 2000'),

('LV Trainer',
 'Virgil chez Louis Vuitton',
 'Nommé directeur artistique de l''homme chez Louis Vuitton, Virgil Abloh dessine la LV Trainer : une sneaker de basket rétro des années 80 traitée en objet de luxe, monogramme et cuir premium. La preuve, s''il en fallait, que la sneaker était devenue haute couture.',
 '2019'),

('Mars Yard',
 'La chaussure de la NASA',
 'Tom Sachs conçoit la Mars Yard avec des ingénieurs de la NASA, en Vectran — le tissu des airbags qui ont amorti les sondes martiennes. Pensée pour un hypothétique voyage sur Mars, ultra-limitée, elle est le rêve de tout amateur de design fonctionnel. La 3.0 en corrige la fragilité originelle.',
 '2017'),

('Dunk Low Off-White Lot',
 'The 50',
 'En 2021, Virgil Abloh et Nike sortent « The 50 » : cinquante Dunk Low, numérotées Lot 01 à 50, variations subtiles autour d''une même silhouette — un même thème décliné cinquante fois, comme une série d''artiste. Chaque numéro a sa nuance, sa rareté, ses chasseurs. L''une des dernières grandes œuvres Nike de Virgil.',
 '2021'),

('Air Rubber Dunk Off-White',
 'La Dunk selon Virgil',
 'Virgil Abloh déconstruit la Dunk en 2020 avec l''Air Rubber Dunk : cage caoutchouc surdimensionnée, texte signature, silhouette gonflée. Le coloris UNC bleu ciel reste le plus recherché — la Dunk passée au vocabulaire Off-White™.',
 '2020'),

('Air Max 1 Parra',
 'Le peintre d''Amsterdam',
 'Piet Parra, artiste néerlandais, habille l''Air Max 1 de ses aplats de couleurs et de son fameux « faux Swoosh » en dégradé. Sortie pour l''Air Max Day 2018 en quantités très limitées, elle est devenue l''une des collabs AM1 les plus recherchées — un tableau qu''on porte aux pieds.',
 '2018'),

('Strawberry Cough',
 'Le velours vert',
 'Todd Bratrud imagine cette SB Dunk High en clin d''œil à une célèbre variété de cannabis : velours vert profond, doublure rouge fraise, détails cachés. Culte chez les collectionneurs SB pour son matériau et son humour — l''une des Dunk les plus désirées de sa génération.',
 '2021'),

('Orange Lobster',
 'Le homard de Boston',
 'Concepts, la boutique de Cambridge, décline sa mythique série « Lobster » sur la Dunk SB : clin d''œil aux fruits de mer de la Nouvelle-Angleterre, élastiques façon pinces de homard et boîte spéciale imprimée. Après le Red et le Blue, l''Orange complète le plateau de fruits de mer le plus convoité du skate.',
 '2018'),

('Rammellzee',
 'Hommage au maître du graffiti',
 'Cette SB Dunk rend hommage à Rammellzee, graffeur, artiste et théoricien new-yorkais dont l''œuvre a marqué le hip-hop des origines. Motifs et couleurs puisés dans son univers Gothic Futurism : porter un morceau d''histoire du street art new-yorkais.',
 NULL),

-- ==================== AIR MAX 1 (héritage) ====================

('Air Max 1 Anniversary',
 '30 ans d''Air visible',
 'En 2017, Nike fête les 30 ans de l''Air Max 1 en ressortant les coloris OG de 1987 avec la grosse bulle d''origine. Rouge, vert, orange : les teintes de la toute première Air Max, celle dont Tinker Hatfield a osé rendre l''amorti visible — inspiré, dit la légende, par la tuyauterie apparente du Centre Pompidou à Paris.',
 '1987 · Retro 2017'),

('Air Max 1 Master',
 'La somme de toutes les Air Max',
 'Sortie en 2013 pour les 25 ans de l''Air Max, la « Master » est un patchwork qui cite plusieurs modèles cultes de la lignée en une seule paire — un hommage matérialisé à l''histoire de l''Air. Ultra-limitée, elle est devenue l''une des AM1 les plus recherchées des connaisseurs.',
 '2013'),

('Air Max 90 Off-White',
 'La 90 déconstruite',
 'Pièce de la collection « The Ten », l''Air Max 90 selon Virgil Abloh reçoit le traitement déconstruit intégral : matières exposées, texte « AIR », zip-tie signature. Le coloris Desert Ore réchauffe la silhouette de 1990 — l''une des dix chaussures qui ont redéfini la collab en 2017.',
 '2017'),

('Jordan 4 Retro Off-White',
 'La 4 selon Virgil',
 'Autre pièce de « The Ten », la Jordan 4 Off-White expose la structure interne de la silhouette de 1989 : tige translucide, matières apparentes, tout le vocabulaire de Virgil Abloh. La version Sail, sortie en édition féminine, est l''une des Jordan 4 les plus convoitées de l''ère Off-White.',
 '2020'),

('Air Force 1 Mid Off-White',
 'L''AF1 mid déconstruite',
 'Déclinaison mid de l''AF1 revue par Virgil Abloh : cage exposée, texte « AIR », sangle au col et zip-tie orange. Un basique de 1982 passé au filtre Off-White™ — la rencontre du patrimoine Nike et du design déconstruit.',
 '2018');
