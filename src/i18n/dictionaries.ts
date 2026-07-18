/**
 * Centralized translations. Two languages: French (default) and English.
 *
 * Keys are flat dot-separated strings, organized by surface. Variables
 * inside strings use {curly} placeholders, replaced at lookup time.
 *
 * If a key is missing in EN, the FR value is used as a fallback.
 */

export type Lang = 'fr' | 'en'

const fr = {
  // === Common ===
  'common.save': 'Enregistrer',
  'common.cancel': 'Annuler',
  'common.edit': 'Modifier',
  'common.delete': 'Supprimer',
  'common.loading': 'Chargement…',
  'common.add': 'Ajouter',
  'common.scanner': 'Scanner',
  'common.logout': 'Sortir',
  'common.back': '← Retour',
  'common.confirm': 'Confirmer',
  'common.optional': 'optionnel',
  'common.required': 'obligatoire',
  'common.all': 'Toutes',
  'common.none': 'Aucun',
  'common.dash': '—',
  'common.from': 'depuis',
  'common.error': 'Erreur',

  // === Language switcher ===
  'lang.toggle.label': 'Changer la langue',

  // === Landing / Hero (sur la page Login) ===
  'landing.tagline': 'Ta collection de sneakers, suivie comme un portefeuille.',
  'landing.subtitle':
    "Scan code-barre, cotes en temps réel, plus-values calculées. Tout ce qu'il faut pour gérer ta sneakerthèque sérieusement.",
  'landing.feature.scan.title': 'Scan code-barre',
  'landing.feature.scan.desc':
    'Ajoute une paire en 2 secondes. Photo, modèle, taille, retail — tout est rempli automatiquement.',
  'landing.feature.price.title': 'Cotes StockX temps réel',
  'landing.feature.price.desc':
    'La valeur de chaque paire mise à jour à la demande, avec historique et conversion en euros.',
  'landing.feature.track.title': 'Plus-values & historique',
  'landing.feature.track.desc':
    "Prix d'achat, tags, photos, état. Vois ce que vaut ta collection et combien tu as gagné.",

  // === Auth / Login ===
  'auth.title': 'Shooserie',
  'auth.signin.title': 'Connexion',
  'auth.signup.title': 'Créer un compte',
  'auth.email': 'Email',
  'auth.emailPlaceholder': 'toi@email.com',
  'auth.password': 'Mot de passe',
  'auth.passwordHint': 'Minimum 6 caractères.',
  'auth.signin.submit': 'Se connecter',
  'auth.signup.submit': 'Créer le compte',
  'auth.signin.submitting': 'Connexion…',
  'auth.signup.submitting': 'Création…',
  'auth.signin.noAccount': 'Pas encore de compte ?',
  'auth.signup.haveAccount': 'Déjà un compte ?',
  'auth.signin.switchToSignup': 'En créer un',
  'auth.signup.switchToSignin': 'Se connecter',
  'auth.errors.generic': 'Une erreur est survenue, réessaie.',
  'auth.errors.invalidCredentials': 'Email ou mot de passe incorrect.',
  'auth.errors.userExists': 'Un compte existe déjà avec cet email.',
  'auth.errors.passwordShort':
    'Mot de passe trop court (minimum 6 caractères).',
  'auth.errors.emailNotConfirmed':
    'Email non confirmé. Désactive la confirmation dans Supabase pour ce compte.',
  'auth.errors.signupsDisabled': "L'inscription est désactivée.",
  'auth.errors.rateLimit': 'Trop de tentatives, réessaie dans une minute.',

  // === Forgot password (Login → demande de reset) ===
  'auth.forgot.link': 'Mot de passe oublié ?',
  'auth.forgot.title': 'Réinitialiser le mot de passe',
  'auth.forgot.desc':
    "Indique ton email — on t'enverra un lien pour définir un nouveau mot de passe.",
  'auth.forgot.submit': 'Envoyer le lien',
  'auth.forgot.submitting': 'Envoi…',
  'auth.forgot.success':
    'Si un compte existe pour {email}, un lien vient d\'être envoyé. Pense à vérifier les spams.',
  'auth.forgot.back': '← Retour à la connexion',

  // === Reset password (page d'arrivée depuis l'email) ===
  'reset.title': 'Nouveau mot de passe',
  'reset.desc': 'Choisis un nouveau mot de passe pour ton compte.',
  'reset.new': 'Nouveau mot de passe',
  'reset.confirm': 'Confirmer le nouveau mot de passe',
  'reset.help': 'Minimum 6 caractères.',
  'reset.submit': 'Définir le mot de passe',
  'reset.submitting': 'Enregistrement…',
  'reset.success': 'Mot de passe mis à jour. Redirection…',
  'reset.invalidLink':
    "Ce lien de réinitialisation est invalide ou a expiré. Recommence la procédure depuis l'écran de connexion.",
  'reset.mismatch': 'Les deux mots de passe ne correspondent pas.',
  'reset.tooShort': 'Le mot de passe doit faire au moins 6 caractères.',
  'reset.goLogin': 'Aller à la connexion',

  // === Portfolio (en-tête handoff) ===
  'dashboard.portfolio.label': 'Ma collection',
  'dashboard.portfolio.pair': '{n} paire',
  'dashboard.portfolio.pairs': '{n} paires',
  'dashboard.portfolio.estValue': 'Valeur estimée',

  // === Landing (page d'accueil publique) ===
  'landing.title1': 'BUILT FOR',
  'landing.title2': 'THE',
  'landing.title3': 'OGs.',
  'landing.manifesto':
    'Gère ta collection, révèle la rareté de chaque paire, et laisse tes sneakers raconter leur histoire.',
  'landing.cta': 'Explorer ma collection',
  'landing.login': "J'ai déjà un compte",

  // === Navigation basse (5 destinations) ===
  'nav.aria': 'Navigation principale',
  'nav.collection': 'Collec',
  'nav.community': 'Commu',
  'nav.marketplace': 'Marché',
  'nav.profile': 'Profil',
  'nav.add': 'Ajouter une paire',

  // === Étoiles / rangs ===
  'stars.badge.aria': 'Rang {rank}, {n} étoiles',
  'stars.progress.remaining': 'encore {n} ⭐ pour {rank}',
  'stars.progress.max': 'Rang maximal atteint — sommet de la hiérarchie',
  // Toasts de gain
  'stars.toast.points': '+{n} ⭐',
  'stars.toast.group': '{n} récompenses débloquées !',
  'stars.toast.rankTitle': 'Nouveau rang',
  'stars.cel.exploit': 'Exploit débloqué',
  'stars.rule.generic': 'Étoiles gagnées !',
  'stars.rule.m_5': '5 paires !',
  'stars.rule.m_10': '10 paires !',
  'stars.rule.m_25': '25 paires !',
  'stars.rule.m_50': '50 paires !',
  'stars.rule.m_100': '100 paires !',
  'stars.rule.m_250': '250 paires !',
  'stars.rule.first_rare': 'Première Rare !',
  'stars.rule.first_ultra': 'Première Ultra rare !',
  'stars.rule.first_grail': 'Premier Grail !',
  'stars.rule.grail_5': '5 Grails !',
  'stars.rule.full_metal': 'Full Metal !',
  'stars.rule.brand_3': '3 marques !',
  'stars.rule.brand_5': '5 marques !',
  'stars.rule.models_10': '10 modèles !',
  'stars.rule.first_pair': 'Première paire !',
  'stars.rule.referral_signup': 'Filleul inscrit !',
  'stars.rule.referral_activated': 'Filleul activé !',
  'stars.rule.ref_3': '3 filleuls actifs !',
  'stars.rule.ref_10': '10 filleuls actifs !',
  // Règles silencieuses — libellés pour l'historique (« Ma progression »)
  'stars.rule.add_pair': "Ajout d'une paire",
  'stars.rule.complete_pair': 'Fiche complétée',
  'stars.rule.price_pair': 'Prix renseigné',
  'stars.rule.daily_login': 'Connexion du jour',
  'stars.rule.wear': 'Paire portée',
  'stars.rule.read_story': 'Story lue',
  'stars.rule.list_pair': 'Mise en vente',
  'stars.rule.set_pseudo': 'Pseudo configuré',
  'stars.rule.set_avatar': 'Avatar ajouté',
  'stars.rule.make_public': 'Collection publique',
  'stars.rule.profile_complete': 'Profil complété',
  'stars.rule.share_app': 'App partagée',
  // Page « Ma progression »
  'progression.title': 'Ma progression',
  'progression.history.title': 'Historique des gains',
  'progression.tiers.title': 'Paliers de rang',
  'progression.empty.title': "Aucune étoile gagnée pour l'instant",
  'progression.empty.desc': 'Ajoute ta première paire pour lancer ta progression !',
  'progression.empty.cta': '+ Ajouter une paire',
  'progression.loading': 'Chargement…',

  // === Dashboard ===
  'dashboard.kpi.pairs': 'Paires',
  'dashboard.kpi.investment': 'Investissement',
  'dashboard.kpi.currentValue': 'Cote actuelle',
  'dashboard.kpi.plusValue': 'Plus-value',
  'dashboard.searchPlaceholder':
    'Chercher dans la collection (nom, marque, SKU, tag…)',
  'dashboard.clearSearch': 'Effacer la recherche',
  'dashboard.refreshAll': '↻ Tout actualiser ({count})',
  'dashboard.refreshing': '↻ Maj… {done}/{total}',
  'dashboard.refreshFailures': '{n} échec — vérifie la taille / le lien',
  'dashboard.refreshFailuresPlural': '{n} échecs — vérifie la taille / le lien',
  'dashboard.forSaleOnly': 'À vendre uniquement',
  'dashboard.forSaleActive': '✓ À vendre uniquement',
  'dashboard.collectionCount': 'Portfolio · {n} paire',
  'dashboard.collectionCountPlural': 'Portfolio · {n} paires',
  'dashboard.filtered': '· filtré',
  'dashboard.noMatch': 'Aucune paire ne correspond à ces filtres.',
  'dashboard.loading': 'Chargement de la collection…',
  'dashboard.empty.title': 'Aucune paire pour le moment',
  'dashboard.empty.desc':
    'Ajoute ta première paire pour démarrer ta collection.',
  'dashboard.empty.action': 'Ajouter une paire',
  'dashboard.sort.aria': 'Trier',
  'dashboard.sort.deltaDesc': '↓ Plus-value',
  'dashboard.sort.deltaAsc': '↑ Moins-value',
  'dashboard.sort.coteDesc': '↓ Cote',
  'dashboard.sort.coteAsc': '↑ Cote',
  'dashboard.sort.recent': '↓ Récents',
  'dashboard.sort.oldest': '↑ Anciens',
  'dashboard.sort.nameAsc': 'A → Z',
  'dashboard.errorLoad': 'Erreur de chargement : {msg}',

  // === Dashboard share — public link sharing ===
  'dashboard.share.button': 'Partager',
  'dashboard.share.tooltip': 'Créer un lien pour partager ta collection',
  'dashboard.share.fileTitle': 'Ma collection',
  'share.title': 'Partager ta collection',
  'share.desc':
    'Crée un lien que tu peux envoyer à qui tu veux (WhatsApp, SMS, mail, Insta). Le destinataire verra ta collection sans avoir besoin d\'un compte.',
  'share.create': 'Créer un lien',
  'share.creating': 'Création…',
  'share.labelPlaceholder': 'Nom (optionnel, ex: "Pour Yanis")',
  'share.privacy':
    'Seuls les champs publics sont partagés (photo, modèle, taille, cote, à vendre). Ton prix d\'achat, tes notes et tes tags restent privés.',
  'share.copy': 'Copier',
  'share.copied': 'Copié !',
  'share.copyManual': 'Copie ce lien :',
  'share.revoke': 'Désactiver',
  'share.revoked': 'Désactivé',
  'share.delete': 'Supprimer',
  'share.confirmDelete':
    'Supprimer définitivement ce lien ? Cette action est irréversible.',
  'share.empty': 'Aucun lien actif pour le moment.',
  'share.loading': 'Chargement…',
  'share.defaultLabel': 'Lien sans nom',
  'share.createdOn': 'Créé le {date}',

  // === Dashboard scan — duplicate detection (native confirm) ===
  'dashboard.scan.duplicate.confirmOne':
    "Cette paire est déjà dans ta collection. L'ajouter quand même ?",
  'dashboard.scan.duplicate.confirmMany':
    "Tu as déjà {count} paires de ce modèle. L'ajouter quand même ?",

  // === Invite — share the app to acquire new users ===
  'invite.title': 'Inviter un ami',
  'invite.desc':
    'Partage Shooserie avec tes potes sneakerheads. Plus on est nombreux, plus les compteurs « X collectionneurs ont ce modèle » deviennent intéressants.',
  'invite.button': 'Partager Shooserie',
  'invite.message':
    "Salut ! Je gère ma collec de sneakers avec Shooserie. Cote StockX en live, plus-value, scan code-barre... t'essaies ?",
  'invite.copied': 'Lien copié',
  'invite.copyManual': 'Copie ce message :',

  // === My listings — dedicated for-sale page ===
  'dashboard.listings.button': 'Paires a vendre',
  'dashboard.listings.tooltip': 'Voir mes paires en vente',
  'listings.breadcrumb': 'Mes ventes',
  'listings.title': 'Tes paires à vendre',
  'listings.subtitle':
    'Toutes tes paires marquées « À vendre » sont regroupées ici. Pour ajouter une paire, ouvre-la et coche « À vendre » dans la fiche.',
  'listings.kpi.count': 'En vente',
  'listings.kpi.askValue': 'Prix demandé total',
  'listings.kpi.cost': 'Investissement',
  'listings.kpi.potentialProfit': 'Plus-value potentielle',
  'listings.hintMissingTarget':
    '💡 {count} paires en vente sans prix cible défini — ouvre-les pour renseigner le champ « Prix de vente cible » et avoir une plus-value précise.',
  'listings.collectionCount': '{n} paire en vente',
  'listings.collectionCountPlural': '{n} paires en vente',
  'listings.empty.title': 'Aucune paire en vente',
  'listings.empty.desc':
    'Pour mettre une paire en vente, ouvre-la depuis ta collection et coche « À vendre » dans la fiche. Tu peux aussi indiquer ton prix demandé.',
  'listings.empty.cta': 'Retour à ma collection',

  // === Card / Table ===
  'card.forSale': 'À VENDRE',

  // === Community — owners count + top models ===
  'community.badge.one': '{count} collectionneur a ce modèle',
  'community.badge.many': '{count} collectionneurs ont ce modèle',
  'community.collector.one': 'collectionneur',
  'community.collector.many': 'collectionneurs',
  'community.top.title': 'Les plus collectionnées',
  'community.top.subtitle': 'Sur Shooserie',
  'card.refresh.aria': 'Actualiser la cote',
  'card.refresh.notLinked': 'Pas lié au catalogue',
  'card.refresh.noSize': 'Taille US manquante',
  'card.refresh.error': 'Échec : {msg}',
  'table.col.model': 'Modèle',
  'table.col.size': 'Taille',
  'table.col.cote': 'Cote',
  'table.col.delta': '+/-',

  // === SneakerForm — sections, fields, placeholders ===
  'form.section.autofill': 'Auto-remplissage',
  'form.section.photo': 'Photo',
  'form.section.identity': 'Identité',
  'form.section.size': 'Pointure',
  'form.section.release': 'Sortie',
  'form.section.purchase': 'Mon achat',
  'form.section.tracking': 'Suivi',
  'form.section.notes': 'Notes',
  'form.searchPlaceholder': 'Chercher un modèle (ex: Jordan 1 Chicago)…',
  'form.search.fetching': 'Récupération du détail…',
  'form.autoFilled':
    "✓ Pré-rempli depuis le catalogue — vérifie les infos avant d'enregistrer.",
  'form.scanFilled.stockx':
    "✓ Pré-rempli depuis le catalogue — vérifie les infos avant d'enregistrer.",
  'form.scanFilled.upcitemdb':
    "✓ Pré-rempli depuis UPCitemdb — vérifie les infos avant d'enregistrer.",
  'form.field.name': 'Nom',
  'form.field.brand': 'Marque',
  'form.field.colorway': 'Colorway',
  'form.field.sku': 'SKU',
  'form.field.scanLabel': 'Scan',
  'form.field.barcode': 'Code-barre',
  'form.field.sizeEu': 'Pointure EU',
  'form.field.sizeUs': 'Pointure US',
  'form.field.releaseDate': 'Date de sortie',
  'form.field.releasePrice': 'Prix retail (€)',
  'form.field.purchaseDate': 'Acheté le',
  'form.field.purchasePrice': "Prix d'achat (€)",
  'form.field.condition': 'État',
  'form.field.notes': 'Notes',
  'form.field.tags': 'Tags',
  'form.field.forSale': 'Mise en vente',
  'form.field.targetSalePrice': 'Prix demandé (€)',
  'form.field.photo': 'Photo',
  'form.tagsPlaceholder': 'grail, og, été…',
  'form.tagRemoveAria': 'Retirer le tag {tag}',
  'form.brand.placeholder': '— Choisir —',
  'form.brand.other': 'Autre',
  'form.condition.placeholder': '— Choisir —',
  'form.condition.DS': 'DS (deadstock)',
  'form.condition.VNDS': 'VNDS (very near deadstock)',
  'form.condition.worn': 'Porté',
  'form.condition.heavyWorn': 'Très porté',
  'form.photo.upload': 'Choisir une photo',
  'form.photo.change': 'Changer',
  'form.photo.remove': 'Retirer',
  'form.photo.uploading': 'Envoi…',
  'form.submit.create': 'Créer la paire',
  'form.submit.update': 'Enregistrer',
  'form.submit.saving': 'Enregistrement…',
  'form.errors.nameRequired': 'Le nom est obligatoire.',

  // === SneakerNew / SneakerEdit ===
  'new.title': 'Nouvelle paire',
  'new.subtitleStockx':
    "Code scanné et matché au catalogue — toutes les infos sont liées, y compris la taille. Vérifie avant d'enregistrer.",
  'new.subtitleUpcitemdb':
    "Code scanné et infos pré-remplies depuis UPCitemdb. Vérifie avant d'enregistrer.",
  'new.subtitleScannedNoMatch':
    'Code scanné. Aucune info auto trouvée — complète manuellement.',
  'new.subtitleDefault':
    'Tape le nom du modèle dans la barre de recherche pour tout pré-remplir, ou scanne un code-barre via le bouton du champ SKU.',
  'edit.title': 'Modifier la paire',

  // === SneakerDetail ===
  'detail.meta.sku': 'SKU',
  'detail.meta.size': 'TAILLE',
  'detail.meta.condition': 'ÉTAT',
  'detail.meta.release': 'RELEASE',
  'detail.price.purchase': 'Achat',
  'detail.price.cote': 'Cote',
  'detail.price.deltaEur': '+/- €',
  'detail.price.deltaPct': '+/- %',
  'detail.price.fromRelease': '= release',
  'detail.market.label': 'Cote du marché',
  'detail.market.lastUpdate': 'Maj {date}',
  'detail.market.source': 'Source : ${value}',
  'detail.market.refresh': '↻ Actualiser la cote',
  'detail.market.refreshing': 'Maj…',
  'detail.market.viewExternal': 'Voir la fiche ↗',
  'detail.market.notLinked':
    'Pas lié au catalogue. Modifie la paire et utilise la barre de recherche pour activer la mise à jour automatique.',
  'detail.market.noSize':
    'Renseigne la taille US pour activer le refresh de cote.',
  'detail.purchase.purchasedOn': 'Acheté le',
  'detail.purchase.price': "Prix d'achat",
  'detail.history.label': 'Historique de la cote',
  'detail.history.count': 'sur {n} maj',
  'detail.delete.title': 'Supprimer cette paire ?',
  'detail.delete.desc': 'Cette action est irréversible.',
  'detail.notFound': 'Paire introuvable.',

  // === Scanner ===
  'scan.starting': 'Démarrage caméra…',
  'scan.scanning': 'Vise le code-barre',
  'scan.lookingUp': 'Code détecté — recherche des infos…',
  'scan.error': 'Erreur caméra',
  'scan.hint': 'Centre le code dans le cadre. La détection est automatique.',
  'scan.detected': 'Détecté : {code}',
  'scan.lookingUpDb': 'Recherche en cours…',
  'scan.manualLink': 'Pas de code-barre ? Saisir manuellement',
  'scan.manualTitle': 'Saisie manuelle',
  'scan.manualHint':
    'Tape le SKU ou le code-barre (UPC/EAN) inscrit sur la boîte.',
  'scan.manualSubmit': 'Valider',
  'scan.permissionDenied':
    "L'accès à la caméra a été refusé. Active-le dans les paramètres de ton navigateur, ou utilise la saisie manuelle.",
  'scan.cameraUnavailable': 'Caméra indisponible. Utilise la saisie manuelle.',
  'scan.fallback': 'Saisir manuellement',
  'scan.closeAria': 'Fermer le scanner',
  'scan.openAria': 'Scanner un code-barre',

  // === ViewToggle ===
  'view.grid': 'Grille',
  'view.table': 'Tableau',

  // === Account ===
  'account.title': 'Mon compte',
  'account.aria': 'Mon compte',
  'account.email.section': 'Adresse email',
  'account.email.current': 'Adresse actuelle',
  'account.email.new': 'Nouvelle adresse',
  'account.email.newPlaceholder': 'nouvelle@email.com',
  'account.email.help':
    "Tu recevras un lien de confirmation à la nouvelle adresse. L'email ne sera changé qu'après que tu auras cliqué sur ce lien.",
  'account.email.submit': "Mettre à jour l'email",
  'account.email.submitting': 'Envoi…',
  'account.email.success':
    "Email de confirmation envoyé à {email}. Clique sur le lien reçu pour valider le changement.",
  'account.email.sameError': 'La nouvelle adresse est identique à l\'actuelle.',
  'account.password.section': 'Mot de passe',
  'account.password.current': 'Mot de passe actuel',
  'account.password.new': 'Nouveau mot de passe',
  'account.password.confirm': 'Confirmer le nouveau',
  'account.password.help': 'Minimum 6 caractères.',
  'account.password.submit': 'Mettre à jour le mot de passe',
  'account.password.submitting': 'Mise à jour…',
  'account.password.success': 'Mot de passe mis à jour.',
  'account.password.mismatch': 'Les deux nouveaux mots de passe ne correspondent pas.',
  'account.password.tooShort': 'Le nouveau mot de passe doit faire au moins 6 caractères.',
  'account.password.sameAsOld': 'Le nouveau mot de passe doit être différent de l\'actuel.',
  'account.password.invalidCurrent': 'Mot de passe actuel incorrect.',
  'account.danger.section': 'Zone sensible',
  'account.signOut.desc': 'Te déconnecter de ce navigateur. Tu pourras revenir avec ton email et mot de passe.',
  
  // === Marketplace ===
  'marketplace.title': 'Marché',
  'marketplace.subtitle': 'Toutes les paires en vente par la communauté',
  'marketplace.searchPlaceholder': 'Chercher un modèle, marque, colorway…',
  'marketplace.allBrands': 'Toutes les marques',
  'marketplace.empty': 'Aucune paire en vente pour le moment',
  'marketplace.notFound': 'Paire introuvable',
  'marketplace.seller': 'Vendeur',
  'marketplace.askingPrice': 'Prix demandé',
  'marketplace.contactSeller': 'Contacter le vendeur',
  'marketplace.contactingSeller': 'Création de la conversation…',
  'marketplace.ownPair': 'C\'est ta paire — tu ne peux pas te contacter toi-même',
  'marketplace.notes': 'Notes du vendeur',
  'marketplace.meta.size': 'Pointure',
  'marketplace.meta.sku': 'SKU',
  'marketplace.meta.condition': 'État',
  'marketplace.meta.marketValue': 'Cote actuelle',
 
  // === Messaging ===
  'messaging.title': 'Messages',
  'messaging.noConversations': 'Aucune conversation pour le moment',
  'messaging.selectConversation': 'Sélectionne une conversation pour voir les messages',
  'messaging.typeMessage': 'Écris ton message…',
  'messaging.send': 'Envoyer',
  'messaging.unknownUser': 'Utilisateur inconnu',
 
  // === Account — Visibility ===
  'account.visibility.section': 'Visibilité de la collection',
  'account.visibility.desc':
    'Rends ta collection visible aux autres utilisateurs. Les paires en vente sont toujours visibles dans le Marché, peu importe ce réglage.',
  'account.visibility.public': 'Collection publique',
  'account.visibility.private': 'Collection privée',
  'account.visibility.publicHint':
    'Les autres utilisateurs peuvent voir toute ta collection.',
  'account.visibility.privateHint':
    'Seules tes paires en vente sont visibles dans le Marché.',
  'account.visibility.toggle': 'Basculer la visibilité',
 
  // === Dashboard — toolbar buttons ===
  'dashboard.marketplace.button': 'Marché',
  'dashboard.marketplace.tooltip': 'Voir toutes les paires en vente',
  'dashboard.messages.button': 'Messages',
  'dashboard.messages.tooltip': 'Voir tes conversations',
  
  // Marketplace — toggle vue
  'marketplace.viewGrid': 'Vue grille',
  'marketplace.viewList': 'Vue liste',
 
  // Messaging — delete
  'messaging.deleteMessage': 'Supprimer ce message',
  'messaging.confirmDelete': 'Confirmer la suppression',

  // Thème clair/sombre
  'theme.toggle.aria': 'Changer de thème',
  'theme.light': 'Clair',
  'theme.dark': 'Sombre',
  'theme.system': 'Système',

  // Mode de page : Portfolio / Collection
  'dashboard.mode.aria': 'Mode d’affichage',
  'dashboard.mode.portfolio': 'Portfolio',
  'dashboard.mode.collection': 'Collection',

  // Page Guide (/guide)
  'guide.title': 'Guide',
  'guide.intro': 'Comment fonctionne ta progression sur Shooserie.',
  'guide.pairs': 'paires',
  'guide.grades.title': 'Grades',
  'guide.grades.sub': 'Ton niveau grimpe avec le nombre de paires de ta collection.',
  'guide.grades.current': 'Ton grade',
  'guide.facets.title': 'Facettes',
  'guide.facets.sub': 'Des distinctions débloquées selon la composition de ta collection.',
  'guide.facets.unlocked': 'Débloquée',
  'guide.facets.note': 'À noter : Active Wearer et Pure Collector sont mutuellement exclusifs — tu ne peux avoir que l’un des deux.',
  'guide.rarity.title': 'Raretés',
  'guide.rarity.sub': 'Cinq paliers, du plus courant au plus mythique.',
  'guide.rarity.commune.label': 'Commune',
  'guide.rarity.commune.desc': 'Modèle courant, largement disponible au prix retail.',
  'guide.rarity.peu_commune.label': 'Peu commune',
  'guide.rarity.peu_commune.desc': 'Diffusion plus limitée, légère prime à la revente.',
  'guide.rarity.rare.label': 'Rare',
  'guide.rarity.rare.desc': 'Recherchée : la cote passe nettement au-dessus du retail.',
  'guide.rarity.ultra_rare.label': 'Ultra rare',
  'guide.rarity.ultra_rare.desc': 'Très difficile à trouver, forte demande sur le marché.',
  'guide.rarity.grail.label': 'Grail',
  'guide.rarity.grail.desc': 'Pièce mythique : collabs introuvables, OG d’époque, éditions spéciales.',
  'guide.rarity.score.title': 'Comment le score est calculé',
  'guide.rarity.score.p1':
    'La rareté combine plusieurs signaux : la cote face au prix retail, le type de sortie (general release, collab, Friends & Family…), le fait d’avoir sold-out, et l’ancienneté du modèle.',
  'guide.rarity.score.p2':
    'Certaines sorties passent directement en Grail : Friends & Family, samples, paires numérotées et Player Exclusives.',
  'guide.rarity.score.p3': 'Le palier est recalculable à tout moment — il n’est jamais figé.',
  'nav.guide': 'Guide',
  'guide.link': 'Comment ça marche ?',
}

const en: typeof fr = {
  // === Common ===
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.edit': 'Edit',
  'common.delete': 'Delete',
  'common.loading': 'Loading…',
  'common.add': 'Add',
  'common.scanner': 'Scan',
  'common.logout': 'Sign out',
  'common.back': '← Back',
  'common.confirm': 'Confirm',
  'common.optional': 'optional',
  'common.required': 'required',
  'common.all': 'All',
  'common.none': 'None',
  'common.dash': '—',
  'common.from': 'from',
  'common.error': 'Error',

  // === Language switcher ===
  'lang.toggle.label': 'Change language',

  // === Landing / Hero (on the Login page) ===
  'landing.tagline': 'Your sneaker collection, tracked like a portfolio.',
  'landing.subtitle':
    "Barcode scan, live values, P&L. Everything you need to manage your sneakerheap like a serious collector.",
  'landing.feature.scan.title': 'Barcode scan',
  'landing.feature.scan.desc':
    'Add a pair in 2 seconds. Photo, model, size, retail — all filled in automatically.',
  'landing.feature.price.title': 'Live StockX values',
  'landing.feature.price.desc':
    "Each pair's value refreshed on demand, with history and EUR conversion.",
  'landing.feature.track.title': 'P&L & history',
  'landing.feature.track.desc':
    'Purchase price, tags, photos, condition. See what your collection is worth and how much you’ve made.',

  // === Auth / Login ===
  'auth.title': 'Shooserie',
  'auth.signin.title': 'Sign in',
  'auth.signup.title': 'Create account',
  'auth.email': 'Email',
  'auth.emailPlaceholder': 'you@email.com',
  'auth.password': 'Password',
  'auth.passwordHint': 'Minimum 6 characters.',
  'auth.signin.submit': 'Sign in',
  'auth.signup.submit': 'Create account',
  'auth.signin.submitting': 'Signing in…',
  'auth.signup.submitting': 'Creating…',
  'auth.signin.noAccount': "No account yet?",
  'auth.signup.haveAccount': 'Already have an account?',
  'auth.signin.switchToSignup': 'Create one',
  'auth.signup.switchToSignin': 'Sign in',
  'auth.errors.generic': 'Something went wrong, please try again.',
  'auth.errors.invalidCredentials': 'Invalid email or password.',
  'auth.errors.userExists': 'An account already exists with this email.',
  'auth.errors.passwordShort': 'Password too short (minimum 6 characters).',
  'auth.errors.emailNotConfirmed':
    'Email not confirmed. Disable confirmation in Supabase for this account.',
  'auth.errors.signupsDisabled': 'Sign-ups are disabled.',
  'auth.errors.rateLimit': 'Too many attempts, please try again in a minute.',

  // === Forgot password (Login → demande de reset) ===
  'auth.forgot.link': 'Forgot password?',
  'auth.forgot.title': 'Reset password',
  'auth.forgot.desc':
    "Enter your email — we'll send a link to set a new password.",
  'auth.forgot.submit': 'Send link',
  'auth.forgot.submitting': 'Sending…',
  'auth.forgot.success':
    "If an account exists for {email}, a link was just sent. Check your spam folder if needed.",
  'auth.forgot.back': '← Back to sign in',

  // === Reset password (page d'arrivée depuis l'email) ===
  'reset.title': 'New password',
  'reset.desc': 'Choose a new password for your account.',
  'reset.new': 'New password',
  'reset.confirm': 'Confirm new password',
  'reset.help': 'Minimum 6 characters.',
  'reset.submit': 'Set password',
  'reset.submitting': 'Saving…',
  'reset.success': 'Password updated. Redirecting…',
  'reset.invalidLink':
    'This reset link is invalid or has expired. Please start the process again from the sign-in screen.',
  'reset.mismatch': 'The two passwords do not match.',
  'reset.tooShort': 'Password must be at least 6 characters.',
  'reset.goLogin': 'Go to sign in',

  // === Portfolio (handoff header) ===
  'dashboard.portfolio.label': 'My collection',
  'dashboard.portfolio.pair': '{n} pair',
  'dashboard.portfolio.pairs': '{n} pairs',
  'dashboard.portfolio.estValue': 'Estimated value',

  // === Landing (public home page) ===
  'landing.title1': 'BUILT FOR',
  'landing.title2': 'THE',
  'landing.title3': 'OGs.',
  'landing.manifesto':
    'Manage your collection, reveal the rarity of every pair, and let your sneakers tell their story.',
  'landing.cta': 'Explore my collection',
  'landing.login': 'I already have an account',

  // === Bottom navigation (5 destinations) ===
  'nav.aria': 'Main navigation',
  'nav.collection': 'Collec',
  'nav.community': 'Commu',
  'nav.marketplace': 'Market',
  'nav.profile': 'Profile',
  'nav.add': 'Add a pair',

  // === Stars / ranks ===
  'stars.badge.aria': '{rank} rank, {n} stars',
  'stars.progress.remaining': '{n} ⭐ to go for {rank}',
  'stars.progress.max': 'Top rank reached — peak of the hierarchy',
  // Gain toasts
  'stars.toast.points': '+{n} ⭐',
  'stars.toast.group': '{n} rewards unlocked!',
  'stars.toast.rankTitle': 'New rank',
  'stars.cel.exploit': 'Achievement unlocked',
  'stars.rule.generic': 'Stars earned!',
  'stars.rule.m_5': '5 pairs!',
  'stars.rule.m_10': '10 pairs!',
  'stars.rule.m_25': '25 pairs!',
  'stars.rule.m_50': '50 pairs!',
  'stars.rule.m_100': '100 pairs!',
  'stars.rule.m_250': '250 pairs!',
  'stars.rule.first_rare': 'First Rare!',
  'stars.rule.first_ultra': 'First Ultra rare!',
  'stars.rule.first_grail': 'First Grail!',
  'stars.rule.grail_5': '5 Grails!',
  'stars.rule.full_metal': 'Full Metal!',
  'stars.rule.brand_3': '3 brands!',
  'stars.rule.brand_5': '5 brands!',
  'stars.rule.models_10': '10 models!',
  'stars.rule.first_pair': 'First pair!',
  'stars.rule.referral_signup': 'Referral signed up!',
  'stars.rule.referral_activated': 'Referral activated!',
  'stars.rule.ref_3': '3 active referrals!',
  'stars.rule.ref_10': '10 active referrals!',
  // Silent rules — labels for the history (« My progress »)
  'stars.rule.add_pair': 'Pair added',
  'stars.rule.complete_pair': 'Pair completed',
  'stars.rule.price_pair': 'Price added',
  'stars.rule.daily_login': 'Daily login',
  'stars.rule.wear': 'Pair worn',
  'stars.rule.read_story': 'Story read',
  'stars.rule.list_pair': 'Listed for sale',
  'stars.rule.set_pseudo': 'Username set',
  'stars.rule.set_avatar': 'Avatar added',
  'stars.rule.make_public': 'Collection public',
  'stars.rule.profile_complete': 'Profile completed',
  'stars.rule.share_app': 'App shared',
  // « My progress » page
  'progression.title': 'My progress',
  'progression.history.title': 'Rewards history',
  'progression.tiers.title': 'Rank tiers',
  'progression.empty.title': 'No stars earned yet',
  'progression.empty.desc': 'Add your first pair to start your progress!',
  'progression.empty.cta': '+ Add a pair',
  'progression.loading': 'Loading…',

  // === Dashboard ===
  'dashboard.kpi.pairs': 'Pairs',
  'dashboard.kpi.investment': 'Investment',
  'dashboard.kpi.currentValue': 'Current value',
  'dashboard.kpi.plusValue': 'Profit',
  'dashboard.searchPlaceholder':
    'Search your collection (name, brand, SKU, tag…)',
  'dashboard.clearSearch': 'Clear search',
  'dashboard.refreshAll': '↻ Refresh all ({count})',
  'dashboard.refreshing': '↻ Updating… {done}/{total}',
  'dashboard.refreshFailures': '{n} failure — check size / catalog link',
  'dashboard.refreshFailuresPlural':
    '{n} failures — check size / catalog link',
  'dashboard.forSaleOnly': 'For sale only',
  'dashboard.forSaleActive': '✓ For sale only',
  'dashboard.collectionCount': 'Portfolio · {n} pair',
  'dashboard.collectionCountPlural': 'Portfolio · {n} pairs',
  'dashboard.filtered': '· filtered',
  'dashboard.noMatch': 'No pair matches these filters.',
  'dashboard.loading': 'Loading your collection…',
  'dashboard.empty.title': 'No pairs yet',
  'dashboard.empty.desc': 'Add your first pair to start your collection.',
  'dashboard.empty.action': 'Add a pair',
  'dashboard.sort.aria': 'Sort',
  'dashboard.sort.deltaDesc': '↓ Profit',
  'dashboard.sort.deltaAsc': '↑ Loss',
  'dashboard.sort.coteDesc': '↓ Value',
  'dashboard.sort.coteAsc': '↑ Value',
  'dashboard.sort.recent': '↓ Newest',
  'dashboard.sort.oldest': '↑ Oldest',
  'dashboard.sort.nameAsc': 'A → Z',
  'dashboard.errorLoad': 'Loading error: {msg}',

  // === Dashboard share — public link sharing ===
  'dashboard.share.button': 'Share',
  'dashboard.share.tooltip': 'Create a link to share your collection',
  'dashboard.share.fileTitle': 'My collection',
  'share.title': 'Share your collection',
  'share.desc':
    'Create a link you can send to anyone (WhatsApp, SMS, email, Insta). They\'ll see your collection without needing an account.',
  'share.create': 'Create link',
  'share.creating': 'Creating…',
  'share.labelPlaceholder': 'Name (optional, e.g. "For Yanis")',
  'share.privacy':
    'Only public fields are shared (photo, model, size, value, for-sale flag). Your purchase price, notes and tags stay private.',
  'share.copy': 'Copy',
  'share.copied': 'Copied!',
  'share.copyManual': 'Copy this link:',
  'share.revoke': 'Disable',
  'share.revoked': 'Disabled',
  'share.delete': 'Delete',
  'share.confirmDelete':
    'Permanently delete this link? This cannot be undone.',
  'share.empty': 'No active link yet.',
  'share.loading': 'Loading…',
  'share.defaultLabel': 'Unnamed link',
  'share.createdOn': 'Created on {date}',

  // === Dashboard scan — duplicate detection (native confirm) ===
  'dashboard.scan.duplicate.confirmOne':
    'This pair is already in your collection. Add it anyway?',
  'dashboard.scan.duplicate.confirmMany':
    'You already have {count} pairs of this model. Add it anyway?',

  // === Invite — share the app to acquire new users ===
  'invite.title': 'Invite a friend',
  'invite.desc':
    'Share Shooserie with your sneakerhead friends. The more we are, the more meaningful the "X collectors have this model" counters become.',
  'invite.button': 'Share Shooserie',
  'invite.message':
    'Hey! I track my sneaker collection with Shooserie. Live StockX values, P&L, barcode scan... wanna try?',
  'invite.copied': 'Link copied',
  'invite.copyManual': 'Copy this message:',

  // === My listings — dedicated for-sale page ===
  'dashboard.listings.button': 'My listings',
  'dashboard.listings.tooltip': 'View my pairs for sale',
  'listings.breadcrumb': 'My listings',
  'listings.title': 'Your pairs for sale',
  'listings.subtitle':
    'Every pair you flagged as "For sale" is grouped here. To add one, open the pair and tick "For sale".',
  'listings.kpi.count': 'For sale',
  'listings.kpi.askValue': 'Total ask',
  'listings.kpi.cost': 'Cost basis',
  'listings.kpi.potentialProfit': 'Potential profit',
  'listings.hintMissingTarget':
    '💡 {count} pairs are for sale without an ask price — open them and fill the "Target sale price" field for an accurate potential profit.',
  'listings.collectionCount': '{n} pair for sale',
  'listings.collectionCountPlural': '{n} pairs for sale',
  'listings.empty.title': 'No pairs for sale',
  'listings.empty.desc':
    'To put a pair up for sale, open it from your collection and tick "For sale". You can also set your asking price.',
  'listings.empty.cta': 'Back to my collection',

  // === Card / Table ===
  'card.forSale': 'FOR SALE',

  // === Community — owners count + top models ===
  'community.badge.one': '{count} collector has this model',
  'community.badge.many': '{count} collectors have this model',
  'community.collector.one': 'collector',
  'community.collector.many': 'collectors',
  'community.top.title': 'Most collected',
  'community.top.subtitle': 'On Shooserie',
  'card.refresh.aria': 'Refresh value',
  'card.refresh.notLinked': 'Not linked to catalog',
  'card.refresh.noSize': 'US size missing',
  'card.refresh.error': 'Failed: {msg}',
  'table.col.model': 'Model',
  'table.col.size': 'Size',
  'table.col.cote': 'Value',
  'table.col.delta': '+/-',

  // === SneakerForm — sections, fields, placeholders ===
  'form.section.autofill': 'Auto-fill',
  'form.section.photo': 'Photo',
  'form.section.identity': 'Identity',
  'form.section.size': 'Size',
  'form.section.release': 'Release',
  'form.section.purchase': 'Purchase',
  'form.section.tracking': 'Tracking',
  'form.section.notes': 'Notes',
  'form.searchPlaceholder': 'Search a model (e.g. Jordan 1 Chicago)…',
  'form.search.fetching': 'Fetching details…',
  'form.autoFilled':
    '✓ Pre-filled from the catalog — review before saving.',
  'form.scanFilled.stockx':
    '✓ Pre-filled from the catalog — review before saving.',
  'form.scanFilled.upcitemdb':
    '✓ Pre-filled from UPCitemdb — review before saving.',
  'form.field.name': 'Name',
  'form.field.brand': 'Brand',
  'form.field.colorway': 'Colorway',
  'form.field.sku': 'SKU',
  'form.field.scanLabel': 'Scan',
  'form.field.barcode': 'Barcode',
  'form.field.sizeEu': 'Size EU',
  'form.field.sizeUs': 'Size US',
  'form.field.releaseDate': 'Release date',
  'form.field.releasePrice': 'Retail price (€)',
  'form.field.purchaseDate': 'Bought on',
  'form.field.purchasePrice': 'Purchase price (€)',
  'form.field.condition': 'Condition',
  'form.field.notes': 'Notes',
  'form.field.tags': 'Tags',
  'form.field.forSale': 'Listed for sale',
  'form.field.targetSalePrice': 'Asking price (€)',
  'form.field.photo': 'Photo',
  'form.tagsPlaceholder': 'grail, og, summer…',
  'form.tagRemoveAria': 'Remove tag {tag}',
  'form.brand.placeholder': '— Choose —',
  'form.brand.other': 'Other',
  'form.condition.placeholder': '— Choose —',
  'form.condition.DS': 'DS (deadstock)',
  'form.condition.VNDS': 'VNDS (very near deadstock)',
  'form.condition.worn': 'Worn',
  'form.condition.heavyWorn': 'Heavily worn',
  'form.photo.upload': 'Choose a photo',
  'form.photo.change': 'Change',
  'form.photo.remove': 'Remove',
  'form.photo.uploading': 'Uploading…',
  'form.submit.create': 'Create pair',
  'form.submit.update': 'Save',
  'form.submit.saving': 'Saving…',
  'form.errors.nameRequired': 'Name is required.',

  // === SneakerNew / SneakerEdit ===
  'new.title': 'New pair',
  'new.subtitleStockx':
    'Code scanned and matched in the catalog — everything is linked, including the size. Review before saving.',
  'new.subtitleUpcitemdb':
    'Code scanned and info pre-filled from UPCitemdb. Review before saving.',
  'new.subtitleScannedNoMatch':
    'Code scanned. No auto info found — fill in manually.',
  'new.subtitleDefault':
    'Type the model name in the search bar to pre-fill everything, or scan a barcode via the button next to the SKU field.',
  'edit.title': 'Edit pair',

  // === SneakerDetail ===
  'detail.meta.sku': 'SKU',
  'detail.meta.size': 'SIZE',
  'detail.meta.condition': 'CONDITION',
  'detail.meta.release': 'RELEASE',
  'detail.price.purchase': 'Cost',
  'detail.price.cote': 'Value',
  'detail.price.deltaEur': '+/- €',
  'detail.price.deltaPct': '+/- %',
  'detail.price.fromRelease': '= retail',
  'detail.market.label': 'Market value',
  'detail.market.lastUpdate': 'Updated {date}',
  'detail.market.source': 'Source: ${value}',
  'detail.market.refresh': '↻ Refresh value',
  'detail.market.refreshing': 'Updating…',
  'detail.market.viewExternal': 'View listing ↗',
  'detail.market.notLinked':
    'Not linked to the catalog. Edit the pair and use the search bar to enable automatic value updates.',
  'detail.market.noSize':
    'Set the US size to enable value refresh.',
  'detail.purchase.purchasedOn': 'Bought on',
  'detail.purchase.price': 'Purchase price',
  'detail.history.label': 'Value history',
  'detail.history.count': 'over {n} updates',
  'detail.delete.title': 'Delete this pair?',
  'detail.delete.desc': 'This action cannot be undone.',
  'detail.notFound': 'Pair not found.',

  // === Scanner ===
  'scan.starting': 'Starting camera…',
  'scan.scanning': 'Aim at the barcode',
  'scan.lookingUp': 'Code detected — looking up info…',
  'scan.error': 'Camera error',
  'scan.hint': 'Center the code in the frame. Detection is automatic.',
  'scan.detected': 'Detected: {code}',
  'scan.lookingUpDb': 'Searching…',
  'scan.manualLink': 'No barcode? Enter manually',
  'scan.manualTitle': 'Manual entry',
  'scan.manualHint':
    'Type the SKU or barcode (UPC/EAN) printed on the box.',
  'scan.manualSubmit': 'Submit',
  'scan.permissionDenied':
    'Camera access was denied. Enable it in your browser settings, or use manual entry.',
  'scan.cameraUnavailable': 'Camera unavailable. Use manual entry.',
  'scan.fallback': 'Enter manually',
  'scan.closeAria': 'Close scanner',
  'scan.openAria': 'Scan a barcode',

  // === ViewToggle ===
  'view.grid': 'Grid',
  'view.table': 'List',

  // === Account ===
  'account.title': 'My account',
  'account.aria': 'My account',
  'account.email.section': 'Email address',
  'account.email.current': 'Current address',
  'account.email.new': 'New address',
  'account.email.newPlaceholder': 'new@email.com',
  'account.email.help':
    "You'll receive a confirmation link at the new address. The email will only change after you click that link.",
  'account.email.submit': 'Update email',
  'account.email.submitting': 'Sending…',
  'account.email.success':
    'Confirmation email sent to {email}. Click the link to validate the change.',
  'account.email.sameError': 'The new address is the same as the current one.',
  'account.password.section': 'Password',
  'account.password.current': 'Current password',
  'account.password.new': 'New password',
  'account.password.confirm': 'Confirm new password',
  'account.password.help': 'Minimum 6 characters.',
  'account.password.submit': 'Update password',
  'account.password.submitting': 'Updating…',
  'account.password.success': 'Password updated.',
  'account.password.mismatch': 'The two new passwords do not match.',
  'account.password.tooShort': 'The new password must be at least 6 characters.',
  'account.password.sameAsOld': 'The new password must be different from the current one.',
  'account.password.invalidCurrent': 'Current password is incorrect.',
  'account.danger.section': 'Sensitive zone',
  'account.signOut.desc':
    'Sign out from this browser. You can come back with your email and password.',
	// === Marketplace ===
  'marketplace.title': 'Marketplace',
  'marketplace.subtitle': 'All pairs listed by the community',
  'marketplace.searchPlaceholder': 'Search a model, brand, colorway…',
  'marketplace.allBrands': 'All brands',
  'marketplace.empty': 'No pairs for sale at the moment',
  'marketplace.notFound': 'Sneaker not found',
  'marketplace.seller': 'Seller',
  'marketplace.askingPrice': 'Asking price',
  'marketplace.contactSeller': 'Contact seller',
  'marketplace.contactingSeller': 'Creating conversation…',
  'marketplace.ownPair': "It's your pair — you can't contact yourself",
  'marketplace.notes': 'Seller notes',
  'marketplace.meta.size': 'Size',
  'marketplace.meta.sku': 'SKU',
  'marketplace.meta.condition': 'Condition',
  'marketplace.meta.marketValue': 'Current value',
 
  // === Messaging ===
  'messaging.title': 'Messages',
  'messaging.noConversations': 'No conversations yet',
  'messaging.selectConversation': 'Select a conversation to see the messages',
  'messaging.typeMessage': 'Type your message…',
  'messaging.send': 'Send',
  'messaging.unknownUser': 'Unknown user',
 
  // === Account — Visibility ===
  'account.visibility.section': 'Collection visibility',
  'account.visibility.desc':
    'Make your collection visible to other users. Pairs for sale are always visible in the Marketplace, regardless of this setting.',
  'account.visibility.public': 'Public collection',
  'account.visibility.private': 'Private collection',
  'account.visibility.publicHint':
    'Other users can see your entire collection.',
  'account.visibility.privateHint':
    'Only your pairs for sale are visible in the Marketplace.',
  'account.visibility.toggle': 'Toggle visibility',
 
  // === Dashboard — toolbar buttons ===
  'dashboard.marketplace.button': 'Marketplace',
  'dashboard.marketplace.tooltip': 'See all pairs for sale',
  'dashboard.messages.button': 'Messages',
  'dashboard.messages.tooltip': 'See your conversations',
  
  // Marketplace — toggle vue
  'marketplace.viewGrid': 'Grid view',
  'marketplace.viewList': 'List view',
 
  'messaging.deleteMessage': 'Delete this message',
  'messaging.confirmDelete': 'Confirm deletion',

  // Thème clair/sombre
  'theme.toggle.aria': 'Toggle theme',
  'theme.light': 'Light',
  'theme.dark': 'Dark',
  'theme.system': 'System',

  // Mode de page : Portfolio / Collection
  'dashboard.mode.aria': 'Display mode',
  'dashboard.mode.portfolio': 'Portfolio',
  'dashboard.mode.collection': 'Collection',

  // Page Guide (/guide)
  'guide.title': 'Guide',
  'guide.intro': 'How your progress works on Shooserie.',
  'guide.pairs': 'pairs',
  'guide.grades.title': 'Grades',
  'guide.grades.sub': 'Your level climbs with the number of pairs in your collection.',
  'guide.grades.current': 'Your grade',
  'guide.facets.title': 'Facets',
  'guide.facets.sub': 'Distinctions unlocked based on how your collection is built.',
  'guide.facets.unlocked': 'Unlocked',
  'guide.facets.note': 'Note: Active Wearer and Pure Collector are mutually exclusive — you can only have one of the two.',
  'guide.rarity.title': 'Rarities',
  'guide.rarity.sub': 'Five tiers, from the most common to the most mythical.',
  'guide.rarity.commune.label': 'Common',
  'guide.rarity.commune.desc': 'Everyday model, widely available at retail.',
  'guide.rarity.peu_commune.label': 'Uncommon',
  'guide.rarity.peu_commune.desc': 'More limited distribution, a small resale premium.',
  'guide.rarity.rare.label': 'Rare',
  'guide.rarity.rare.desc': 'Sought-after: market value climbs well above retail.',
  'guide.rarity.ultra_rare.label': 'Ultra rare',
  'guide.rarity.ultra_rare.desc': 'Very hard to find, strong market demand.',
  'guide.rarity.grail.label': 'Grail',
  'guide.rarity.grail.desc': 'Mythical piece: unobtainable collabs, era OGs, special editions.',
  'guide.rarity.score.title': 'How the score is computed',
  'guide.rarity.score.p1':
    'Rarity combines several signals: market value vs retail price, the release type (general release, collab, Friends & Family…), whether it sold out, and the model’s age.',
  'guide.rarity.score.p2':
    'Some releases go straight to Grail: Friends & Family, samples, numbered pairs and Player Exclusives.',
  'guide.rarity.score.p3': 'The tier can be recomputed at any time — it is never fixed.',
  'nav.guide': 'Guide',
  'guide.link': 'How does it work?',
}

export type DictKey = keyof typeof fr

export const dictionaries: Record<Lang, typeof fr> = { fr, en }
