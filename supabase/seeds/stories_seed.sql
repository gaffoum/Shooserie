-- ============================================================
-- Shooserie — Seed des histoires (Grails + Ultra rares)
-- 26 modèles uniques. Rédigées et vérifiées (juillet 2026).
-- Ton : éditorial sobre ; les légendes romancées sont signalées.
-- À appliquer APRÈS la migration sneaker_stories (validation requise).
-- ============================================================

insert into public.sneaker_stories (match_pattern, title, story, year_context) values

-- ============ GRAILS ============

('Jordan 1 Retro Banned',
 'La paire « interdite »',
 'La légende : la NBA aurait banni la Air Jordan 1 noire et rouge, et Nike aurait payé 5 000 $ d''amende à chaque match pour que MJ la porte. La réalité est plus nuancée — la lettre de la ligue de février 1985 visait vraisemblablement la Air Ship, portée avant la AJ1. Peu importe : Nike a transformé l''interdiction en campagne publicitaire (« Banned »), et le mythe est devenu l''acte fondateur de la culture sneaker. Le coloris Bred reste le plus chargé d''histoire de tout le catalogue Jordan.',
 '1985 · Retro 2011'),

('Travis Scott Mocha',
 'Le Swoosh inversé',
 'Le rappeur de Houston retourne le logo le plus célèbre du monde : Swoosh inversé, poche cachée au col, teintes terreuses inspirées de son Texas natal. À sa sortie en mai 2019, la High « Mocha » déclenche l''une des plus grosses vagues de resell de la décennie et installe Cactus Jack comme la collab la plus puissante du game. La version Low, sortie en juillet 2019 en quantités confidentielles, est devenue la plus recherchée de toutes.',
 '2019'),

('adidas ZX 8000 OG Aqua',
 'La machine Torsion',
 'En 1989, la ZX 8000 inaugure la technologie Torsion — une barre qui laisse l''avant et l''arrière du pied travailler indépendamment — signée Jacques Chassaing et Markus Thaler. Son coloris Aqua/citron/violet devient l''emblème involontaire des warehouse raves anglaises du Second Summer of Love : confortable toute la nuit, et parfaitement raccord avec l''esthétique acid house. Une pièce d''archive autant qu''une sneaker.',
 '1989 · Retro 2013'),

-- ============ ULTRA RARES ============

('Jordan 5 Retro Off-White',
 'La déconstruction selon Virgil',
 'Virgil Abloh applique sa grammaire « The Ten » à la Jordan 5 : upper translucide, trous d''aération agrandis comme des hublots, mousse apparente. Sortie en février 2020 pour le All-Star Game de Chicago, quelques mois avant la disparition du designer, elle fait partie des dernières Jordan qu''il a menées de bout en bout. Le noir « Muslin » réinterprète la silhouette de 1990 de Tinker Hatfield sans la trahir.',
 '2020'),

('Off-White University Blue',
 'La toile bleue de Virgil',
 'Après la « Chicago » de The Ten, Virgil Abloh remet la Jordan 1 sur l''établi en 2018 avec ce coloris University Blue exclusif à la High. Construction déconstruite, Swoosh cousu en surpiqûre apparente, zip-tie orange et texte Helvetica : tout le vocabulaire Off-White™ y est. C''est l''une des trois Jordan 1 Off-White seulement — un club très fermé.',
 '2018'),

('Travis Scott Reverse Mocha',
 'Le miroir de la Mocha',
 'Trois ans après la Low Mocha originelle, Travis Scott inverse la formule : base Sail claire, Swoosh retourné en daim brun, accents University Red. Sortie en juillet 2022 dans un contexte tendu pour l''artiste, elle s''est arrachée malgré tout — preuve que la formule Cactus Jack transcende l''actualité. Le surnom « Reverse Mocha » s''est imposé de lui-même.',
 '2022'),

('Travis Scott Black Phantom',
 'La Mocha passée au noir',
 'Fin 2022, la famille Mocha se décline en négatif : noir sur noir, empeigne mate, Swoosh inversé à peine visible et détails réfléchissants. La « Black Phantom » assume un côté furtif inhabituel pour une collab aussi médiatisée. Elle clôt (provisoirement) la trilogie des Jordan 1 Low Cactus Jack.',
 '2022'),

('SB Dunk Low Travis Scott',
 'Le paisley à gratter',
 'Pour son incursion chez Nike SB en février 2020, Travis Scott recouvre la Dunk Low de bandana paisley et de canvas… qui se déchire à l''usure pour révéler un motif à carreaux dessous. L''idée du « wear-away » transforme chaque paire portée en pièce unique. Sortie en plein boom de la Dunk, elle a contribué à ramener la silhouette skate au centre du jeu.',
 '2020'),

('Jordan 1 Low Year of the Dragon',
 'L''année du Dragon',
 'Pour le Nouvel An lunaire 2024, Jordan Brand habille la 1 Low de soie brodée de dragons, d''accents or métallique et de rouge profond — les codes de la chance et de la prospérité. Édition femme, tirage limité, sortie calée sur le calendrier lunaire : le genre de paire qui ne revient jamais, puisque le prochain cycle du Dragon est dans douze ans.',
 '2024'),

('Jordan 1 Retro Red Suede',
 'Le daim rouge intégral',
 'Un bloc de daim Gym Red de la pointe au col, sans contraste ni compromis. Sortie en avril 2017, cette Jordan 1 monochrome assume le maximalisme minimal : une seule matière, une seule couleur, et la silhouette de Peter Moore fait le reste. Discrète à sa sortie, elle s''est raréfiée depuis — le daim intégral vieillit bien.',
 '2017'),

('Jordan 4 Retro Toro Bravo',
 'Le taureau de combat',
 'Daim rouge feu intégral, accents Cement Grey : la « Toro Bravo » de juillet 2013 doit son nom au taureau de corrida espagnol. Elle fait partie de la vague de Jordan 4 monochromes qui ont redéfini le retro au début des années 2010, aux côtés de la Green Glow et de la Fear. Le daim rouge sur cette silhouette de 1989 reste l''un des looks les plus reconnaissables du game.',
 '2013'),

('Jordan 7 Retro Citrus',
 'L''agrume de 2006',
 'Base noire, éclats Citrus : cette Jordan 7 de juin 2006 est l''un des coloris non-OG les plus appréciés de la silhouette de Tinker Hatfield. Sortie à une époque où les retros Jordan se faisaient plus rares qu''aujourd''hui, elle a construit sa cote sur deux décennies sans jamais être rééditée en High — le genre de sleeper que seuls les connaisseurs traquent.',
 '2006'),

('Jordan 7 Retro Miro',
 'L''œuvre d''art aux 1 000 paires',
 'En 2008, Jordan Brand rend hommage à Joan Miró, dont la sculpture barcelonaise « Dona i Ocell » inspire les éclats rouge, bleu, jaune et vert de la tige. Le lien va plus loin : MJ a décroché son or olympique à Barcelone en 1992, en Jordan 7, avec le n°9 rappelé au talon. Environ 1 000 paires produites, jamais sorties aux États-Unis — un vrai graal, dont le premier retro n''arrive qu''en juillet 2026, dix-huit ans plus tard.',
 '2008'),

('Sean Wotherspoon',
 'Le velours côtelé de la victoire',
 'Vainqueur du concours Nike Vote Forward 2017, Sean Wotherspoon (Round Two) marie la tige de l''Air Max 97 à la semelle de l''Air Max 1, le tout en velours côtelé multicolore inspiré des casquettes vintage. Sortie pour l''Air Max Day 2018 après un raz-de-marée de hype, elle est devenue LA sneaker de l''année et a lancé la mode des matières rétro. Ta version « Extra Lace Set Only » est la plus courante — mais l''histoire reste la même.',
 '2018'),

('Air Max 97 Off-White Menta',
 'La 97 selon Abloh, en vert d''eau',
 'Deuxième passage de Virgil Abloh sur l''Air Max 97, après la version blanche de The Ten. La « Menta » d''octobre 2018 garde la construction à ondulations réfléchissantes mais l''habille d''un vert d''eau inattendu, avec le texte « AIR » sur la semelle et le zip-tie signature. Moins médiatisée que les Jordan Off-White, elle est devenue l''une des favorites des puristes Air Max.',
 '2018'),

('Air Presto Off-White Black',
 'Le t-shirt pour les pieds, déconstruit',
 'Nike surnommait la Presto « le t-shirt pour les pieds ». Virgil Abloh la découpe et la réassemble pour The Ten, puis en sort deux rééditions en 2018 — dont cette version noire de juillet, produite plus largement mais toujours prise d''assaut. Cage apparente, texte « AIR » sur le côté : un manifeste du design déconstruit devenu mainstream.',
 '2018'),

('Air Max 1 atmos Elephant',
 'Le pachyderme de Tokyo',
 'En 2007, le shop tokyoïte atmos greffe l''imprimé éléphant de la Jordan 3 sur l''Air Max 1 — sacrilège pour certains, coup de génie pour les autres. Le retro de mars 2017, sorti pour l''Air Max Day, s''est arraché en quelques minutes et a rappelé pourquoi cette collab est considérée comme l''une des plus grandes Air Max 1 de l''histoire.',
 '2007 · Retro 2017'),

('atmos Safari',
 'Le safari remis en piste',
 'Deuxième volet des grandes heures atmos × Nike : l''imprimé Safari — emprunté à l''Air Safari de 1987 — appliqué à l''Air Max 1 en 2016 pour les 20 ans du shop japonais. Vert forêt, pony hair et motif granuleux : la recette qui a fait d''atmos le traducteur officiel du streetwear tokyoïte chez Nike.',
 '2016'),

('atmos Animal Pack',
 'La ménagerie 2.0',
 'En 2018, atmos ressuscite son mythique « Animal Pack » de 2006 : pony hair, imprimés léopard, zèbre et tigre assemblés en patchwork sur l''Air Max 1. La version « All Black Box » — reconnaissable à sa boîte noire spéciale — était réservée aux drops les plus limités. Le maximalisme japonais dans ce qu''il a de plus assumé.',
 '2018'),

('Air Max 1 BHM',
 'Black History Month',
 'Édition Black History Month de l''Air Max 1 : cuir noir premium, motifs inspirés des tissus africains sur le mudguard et détails or. La collection BHM de Nike honore chaque année l''héritage de la communauté noire dans le sport et la culture — et cette AM1 reste l''une des plus abouties de la série, produite en volume restreint.',
 '2012'),

('Tinker Sketch to Shelf',
 'Le brouillon devenu chaussure',
 'La série « Sketch to Shelf » de 2019 imprime sur la sneaker les croquis originaux de Tinker Hatfield — schémas techniques, annotations et traits de construction de l''Air Max 1 de 1987. Porter le processus créatif plutôt que le produit fini : un hommage direct à l''architecte devenu le plus grand designer de sneakers de l''histoire.',
 '2019'),

('Air Max Day 3.26',
 'Le jour de l''Air Max',
 'Le 26 mars 2014, Nike institue l''Air Max Day — 3.26, en référence au 26 mars 1987, date de sortie de l''Air Max 1. Cette paire commémorative de la toute première édition reprend le rouge et blanc OG avec le logo « 3.26 ». Tirage limité, valeur symbolique maximale : c''est la paire qui a inventé une fête mondiale.',
 '2014'),

('SB Dunk Low Black Pigeon',
 'Le pigeon revient la nuit',
 'En 2005, la « Pigeon » de Jeff Staple provoquait des émeutes à New York — 150 paires, la police en couverture du New York Post, l''acte de naissance du resell moderne. Douze ans plus tard, Staple fait revenir l''oiseau en version noire : le « Black Pigeon » de novembre 2017, hommage nocturne au moment où la sneaker culture a basculé dans une autre dimension.',
 '2017'),

('SB Dunk High Diamond',
 'Le diamant Tiffany, version High',
 'La « Tiffany » Dunk Low de Diamond Supply Co. (2005) est l''une des SB les plus mythiques de l''histoire. En 2014, Nicky Diamonds décline enfin la formule en High : croco noir, aqua Tiffany, semelle réfléchissante. Moins connue que la Low originelle, elle porte le même ADN — celui de l''âge d''or du skate shop californien.',
 '2014'),

('Zoom Spiridon Ultra Metallic Silver',
 'L''argenté de 1997, vingt ans après',
 'Dessinée par Christian Tresser en 1997, la Spiridon est l''une des premières Nike à exhiber le coussin Zoom Air visible, avec son mesh métallique et son Swoosh holographique. Pour ses 20 ans, en 2017, Nike ressort le coloris originel Metallic Silver / Desert Red en version Ultra allégée. La préférée des connaisseurs de running rétro — Ronnie Fieg en tête.',
 '1997 · Retro 2017'),

('Air Max 1/97 Sean Wotherspoon Extra Lace',
 'Le velours côtelé de la victoire',
 'Vainqueur du concours Nike Vote Forward 2017, Sean Wotherspoon (Round Two) marie la tige de l''Air Max 97 à la semelle de l''Air Max 1, le tout en velours côtelé multicolore inspiré des casquettes vintage. Sortie pour l''Air Max Day 2018 après un raz-de-marée de hype, elle est devenue LA sneaker de l''année et a lancé la mode des matières rétro.',
 '2018');
