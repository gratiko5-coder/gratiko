export type Locale = "fr" | "ht" | "en" | "es";

export interface Translations {
  common: {
    appName: string;
    tagline: string;
    demoBadge: string;
    demoNotice: string;
    save: string;
    cancel: string;
    confirm: string;
    loading: string;
    error: string;
    success: string;
    back: string;
    currency: string;
    language: string;
    logout: string;
    login: string;
    register: string;
    dashboard: string;
    adminDashboard: string;
    role: string;
    status: string;
    date: string;
    amount: string;
    reference: string;
  };
  auth: {
    welcomeTitle: string;
    welcomeSubtitle: string;
    emailLabel: string;
    passwordLabel: string;
    fullNameLabel: string;
    phoneLabel: string;
    countryLabel: string;
    loginButton: string;
    registerButton: string;
    noAccount: string;
    alreadyAccount: string;
    invalidCredentials: string;
    registerSuccess: string;
    demoCredentialsHint: string;
  };
  dashboard: {
    walletTitle: string;
    availableBalance: string;
    pendingDeposits: string;
    pendingWithdrawals: string;
    totalWinnings: string;
    buyTicketBtn: string;
    myTicketsBtn: string;
    rechargeBtn: string;
    withdrawBtn: string;
    quickStats: string;
    recentActivity: string;
    noActivity: string;
  };
  tickets: {
    catalogTitle: string;
    catalogSubtitle: string;
    ticketPrice: string;
    maxPrize: string;
    buyNow: string;
    scratchNow: string;
    scratchPrompt: string;
    autoScratch: string;
    congratulations: string;
    sorryLose: string;
    winAmount: string;
    claimWin: string;
    scratchedStatus: string;
    purchasedStatus: string;
    rulesTitle: string;
    probabilitiesTitle: string;
    insufficientFunds: string;
    purchaseSuccess: string;
  };
  wallet: {
    rechargeTitle: string;
    rechargeSubtitle: string;
    withdrawTitle: string;
    withdrawSubtitle: string;
    selectAmount: string;
    paymentMethod: string;
    senderNumber: string;
    transactionReference: string;
    submitRecharge: string;
    submitWithdrawal: string;
    rechargeSuccess: string;
    withdrawSuccess: string;
    payoutDestination: string;
    minimumWithdrawalError: string;
    insufficientBalanceError: string;
    transactionsHistory: string;
  };
  admin: {
    title: string;
    subtitle: string;
    grossSales: string;
    operatorCommission: string;
    gameAllocation: string;
    reserveFund: string;
    obligations: string;
    availableCash: string;
    solvencyStatus: string;
    rechargeQueue: string;
    withdrawalQueue: string;
    approve: string;
    reject: string;
    decisionReason: string;
    batchManagement: string;
    auditLog: string;
    countrySettings: string;
  };
  legal: {
    rulesTitle: string;
    termsTitle: string;
    privacyTitle: string;
    responsibleGaming: string;
    disclaimer: string;
  };
}

export const dictionaries: Record<Locale, Translations> = {
  fr: {
    common: {
      appName: "GRATIKO",
      tagline: "Plateforme Numérique de Tickets à Gratter & Jeux Instantanés",
      demoBadge: "MODE DÉMONSTRATION — CRÉDITS FICTIFS",
      demoNotice: "Plateforme en environnement de test sécurisé. Aucun dépôt réel ni retrait bancaire réel n'est engagé sans autorisations réglementaires.",
      save: "Enregistrer",
      cancel: "Annuler",
      confirm: "Confirmer",
      loading: "Chargement...",
      error: "Une erreur est survenue",
      success: "Opération réussie",
      back: "Retour",
      currency: "HTG",
      language: "Langue",
      logout: "Déconnexion",
      login: "Connexion",
      register: "Inscription",
      dashboard: "Espace Joueur",
      adminDashboard: "Administration",
      role: "Rôle",
      status: "Statut",
      date: "Date",
      amount: "Montant",
      reference: "Référence",
    },
    auth: {
      welcomeTitle: "Bienvenue sur GRATIKO",
      welcomeSubtitle: "Accédez à votre portefeuille et grattez vos tickets en direct.",
      emailLabel: "Adresse email",
      passwordLabel: "Mot de passe",
      fullNameLabel: "Nom complet",
      phoneLabel: "Numéro de téléphone",
      countryLabel: "Pays de résidence",
      loginButton: "Se connecter",
      registerButton: "Créer un compte",
      noAccount: "Pas encore de compte ? S'inscrire",
      alreadyAccount: "Déjà inscrit ? Se connecter",
      invalidCredentials: "Email ou mot de passe incorrect.",
      registerSuccess: "Compte créé avec succès ! Connectez-vous.",
      demoCredentialsHint: "Comptes démo préconfigurés disponibles (Joueur & Administrateur).",
    },
    dashboard: {
      walletTitle: "Mon Portefeuille GRATIKO",
      availableBalance: "Solde disponible",
      pendingDeposits: "Recharges en attente",
      pendingWithdrawals: "Retraits en cours",
      totalWinnings: "Total des gains crédités",
      buyTicketBtn: "Acheter un ticket",
      myTicketsBtn: "Mes tickets",
      rechargeBtn: "Recharger mon solde",
      withdrawBtn: "Demander un retrait",
      quickStats: "Vue d'ensemble",
      recentActivity: "Activité récente",
      noActivity: "Aucune activité pour le moment.",
    },
    tickets: {
      catalogTitle: "Tickets à Gratter Disponibles",
      catalogSubtitle: "Choisissez votre ticket, grattez et découvrez vos gains instantanément.",
      ticketPrice: "Prix du ticket",
      maxPrize: "Gain maximum",
      buyNow: "Acheter ce ticket",
      scratchNow: "Gratter maintenant",
      scratchPrompt: "Grattez avec le doigt ou la souris pour révéler",
      autoScratch: "Révéler automatiquement",
      congratulations: "FÉLICITATIONS ! VOUS AVEZ GAGNÉ !",
      sorryLose: "Désolé, ce ticket n'est pas gagnant cette fois-ci.",
      winAmount: "Gain remporté",
      claimWin: "Créditer sur mon portefeuille",
      scratchedStatus: "Gratté",
      purchasedStatus: "Prêt à gratter",
      rulesTitle: "Règles et probabilités du jeu",
      probabilitiesTitle: "Tableau officiel des gains & chances",
      insufficientFunds: "Solde insuffisant pour acheter ce ticket.",
      purchaseSuccess: "Ticket acheté ! Résultat sécurisé et scellé sur le serveur.",
    },
    wallet: {
      rechargeTitle: "Recharger mon portefeuille",
      rechargeSubtitle: "Système de recharge manuelle avec validation sécurisée.",
      withdrawTitle: "Demander un retrait",
      withdrawSubtitle: "Vos gains validés sont transférés après vérification d'identité.",
      selectAmount: "Montant à créditer",
      paymentMethod: "Moyen de paiement utilisé",
      senderNumber: "Numéro ou compte émetteur",
      transactionReference: "Référence ou code reçu",
      submitRecharge: "Soumettre ma demande de recharge",
      submitWithdrawal: "Envoyer ma demande de retrait",
      rechargeSuccess: "Demande enregistrée avec succès. Un agent va la vérifier.",
      withdrawSuccess: "Demande de retrait transmise pour validation administrative.",
      payoutDestination: "Numéro de destination du retrait",
      minimumWithdrawalError: "Le montant minimum de retrait est de 200 HTG.",
      insufficientBalanceError: "Solde disponible insuffisant pour ce montant de retrait.",
      transactionsHistory: "Historique des transactions et du grand livre",
    },
    admin: {
      title: "Tableau de Bord Super-Administrateur & Finance",
      subtitle: "Surveillance de la solvabilité, du grand livre et des opérations en direct.",
      grossSales: "Recettes brutes de vente",
      operatorCommission: "Commission opérateur (20%)",
      gameAllocation: "Allocation jeu (80%)",
      reserveFund: "Fonds de réserve dédié (40%)",
      obligations: "Obligations envers les joueurs",
      availableCash: "Trésorerie disponible",
      solvencyStatus: "Indicateur de solvabilité financière",
      rechargeQueue: "File des recharges à valider",
      withdrawalQueue: "Demandes de retraits à traiter",
      approve: "Valider & Créditer",
      reject: "Refuser",
      decisionReason: "Motif de la décision",
      batchManagement: "Gestion des lots & probabilités",
      auditLog: "Journal d'audit de sécurité",
      countrySettings: "Paramètres pays & devises",
    },
    legal: {
      rulesTitle: "Règlement Officiel des Jeux GRATIKO",
      termsTitle: "Conditions Générales d'Utilisation",
      privacyTitle: "Politique de Confidentialité & Protection des Données",
      responsibleGaming: "Jeu Responsable & Prévention des Risques",
      disclaimer: "Modèle juridique préparatoire — Soumis aux vérifications réglementaires préalables.",
    },
  },
  ht: {
    common: {
      appName: "GRATIKO",
      tagline: "Platfòm Nimerik Tikè Pou Grate ak Jwèt Enstantane",
      demoBadge: "MÒD DEMONSTRASYON — KREDI FIKTIF",
      demoNotice: "Platfòm sa a se yon espas tès an sekirite. Pa gen okenn lajan reyèl ki angaje san otorizasyon legal.",
      save: "Anrejistre",
      cancel: "Anile",
      confirm: "Konfime",
      loading: "Ap chaje...",
      error: "Gen yon erè ki pase",
      success: "Operasyon an reyisi",
      back: "Retounen",
      currency: "HTG",
      language: "Lang",
      logout: "Dekonekte",
      login: "Konekte",
      register: "Enskri",
      dashboard: "Espas Jwè",
      adminDashboard: "Administrasyon",
      role: "Wòl",
      status: "Eta",
      date: "Dat",
      amount: "Montan",
      reference: "Referans",
    },
    auth: {
      welcomeTitle: "Byenveni sou GRATIKO",
      welcomeSubtitle: "Rantre nan bous ou epi grate tikè ou an dirèk.",
      emailLabel: "Adrès imèl",
      passwordLabel: "Modpas",
      fullNameLabel: "Non konplè",
      phoneLabel: "Nimewo telefòn",
      countryLabel: "Peyi rezidans",
      loginButton: "Konekte",
      registerButton: "Kreye yon kont",
      noAccount: "Ou poko gen kont ? Enskri la a",
      alreadyAccount: "Ou deja gen kont ? Konekte",
      invalidCredentials: "Imèl oswa modpas la pa kòrèk.",
      registerSuccess: "Kont ou kreye avèk siksè ! Ou mèt konekte kounye a.",
      demoCredentialsHint: "Kont demonstrasyon pare pou sèvi (Jwè ak Administratè).",
    },
    dashboard: {
      walletTitle: "Bous GRATIKO Mwen",
      availableBalance: "Lajan ki disponib",
      pendingDeposits: "Rechaj k ap tann validasyon",
      pendingWithdrawals: "Retrè k ap trete",
      totalWinnings: "Total lajan ou genyen",
      buyTicketBtn: "Achte yon tikè",
      myTicketsBtn: "Tikè mwen yo",
      rechargeBtn: "Rechaje bous mwen",
      withdrawBtn: "Mande yon retrè",
      quickStats: "Kout je sou kont ou",
      recentActivity: "Aktivite ki sot pase yo",
      noActivity: "Ou poko gen aktivite pou kounye a.",
    },
    tickets: {
      catalogTitle: "Tikè Pou Grate ki Disponib",
      catalogSubtitle: "Chwazi tikè ou vle a, grate l epi dekouvri kado ou touswit.",
      ticketPrice: "Pri tikè a",
      maxPrize: "Pi gwo kado",
      buyNow: "Achte tikè sa a",
      scratchNow: "Grate kounye a",
      scratchPrompt: "Sèvi ak dwèt ou oswa sourit la pou grate zòn nan",
      autoScratch: "Dekouvri tout otomatikman",
      congratulations: "FELISITASYON ! OU GENYEN !",
      sorryLose: "Dezole, tikè sa a pa genyen fwa sa a.",
      winAmount: "Kado ou ranpòte",
      claimWin: "Mete lajan an nan bous mwen",
      scratchedStatus: "Grate deja",
      purchasedStatus: "Pare pou grate",
      rulesTitle: "Règ ak chans pou genyen",
      probabilitiesTitle: "Tablo ofisyèl kado ak pwobabilite",
      insufficientFunds: "Ou pa gen ase lajan nan bous ou pou achte tikè sa a.",
      purchaseSuccess: "Ou achte tikè a ! Rezilta a anrejistre an sekirite sou sèvè a.",
    },
    wallet: {
      rechargeTitle: "Rechaje bous mwen",
      rechargeSubtitle: "Fè yon demann rechaj manyèl ak validasyon an sekirite.",
      withdrawTitle: "Mande yon retrè",
      withdrawSubtitle: "Lajan ou genyen yo ap transfere apre verifikasyon.",
      selectAmount: "Montan ou vle mete",
      paymentMethod: "Mwayen peman ou itilize",
      senderNumber: "Nimewo oswa kont ki voye l",
      transactionReference: "Kòd oswa referans tranzaksyon an",
      submitRecharge: "Voye demann rechaj la",
      submitWithdrawal: "Voye demann retrè a",
      rechargeSuccess: "Demann ou anrejistre. Yon ajan ap verifye l touswit.",
      withdrawSuccess: "Demann retrè ou a voye bay administrasyon an.",
      payoutDestination: "Nimewo pou resevwa retrè a",
      minimumWithdrawalError: "Pi piti montan ou ka retire se 200 HTG.",
      insufficientBalanceError: "Ou pa gen ase lajan disponib pou fè retrè sa a.",
      transactionsHistory: "Istorik tranzaksyon yo ak gran liv la",
    },
    admin: {
      title: "Tablo Administrasyon GRATIKO & Finans",
      subtitle: "Siveyans lajan, gran liv kontablite ak operasyon an dirèk.",
      grossSales: "Total vant brit",
      operatorCommission: "Komisyon operatè (20%)",
      gameAllocation: "Pati rezève pou jwèt (80%)",
      reserveFund: "Fon rezèv espesyal (40%)",
      obligations: "Dèt anvè jwè yo (Gains non retirés)",
      availableCash: "Lajan reyèl ki disponib",
      solvencyStatus: "Endikatè solvabilite finansye",
      rechargeQueue: "Rechaj k ap tann validasyon",
      withdrawalQueue: "Retrè k ap tann peman",
      approve: "Valide & Kredi Bous la",
      reject: "Refize",
      decisionReason: "Rezon desizyon an",
      batchManagement: "Jesyon lo tikè ak pwobabilite",
      auditLog: "Jounal sekirite ak trasabilite",
      countrySettings: "Paramèt peyi ak lajan",
    },
    legal: {
      rulesTitle: "Règleman Ofisyèl Jwèt GRATIKO yo",
      termsTitle: "Kondisyon Jeneral pou Itilize Platfòm nan",
      privacyTitle: "Règ sou Konfidansyalite ak Pwoteksyon Done",
      responsibleGaming: "Jwèt Responsab ak Pwoteksyon Jwè",
      disclaimer: "Modèl legal preparatwa — Dwe valide pa otorite konpetan yo.",
    },
  },
  en: {
    common: {
      appName: "GRATIKO",
      tagline: "Digital Scratch-Off & Instant Win Gaming Platform",
      demoBadge: "DEMO MODE — PLAY MONEY ONLY",
      demoNotice: "Platform running in sandbox mode. No real fiat money is transacted without full legal authorization.",
      save: "Save",
      cancel: "Cancel",
      confirm: "Confirm",
      loading: "Loading...",
      error: "An error occurred",
      success: "Operation successful",
      back: "Back",
      currency: "HTG",
      language: "Language",
      logout: "Log Out",
      login: "Log In",
      register: "Sign Up",
      dashboard: "Player Dashboard",
      adminDashboard: "Administration",
      role: "Role",
      status: "Status",
      date: "Date",
      amount: "Amount",
      reference: "Reference",
    },
    auth: {
      welcomeTitle: "Welcome to GRATIKO",
      welcomeSubtitle: "Access your digital wallet and scratch tickets in real time.",
      emailLabel: "Email address",
      passwordLabel: "Password",
      fullNameLabel: "Full Name",
      phoneLabel: "Phone number",
      countryLabel: "Country of residence",
      loginButton: "Sign In",
      registerButton: "Create an Account",
      noAccount: "Don't have an account? Sign up",
      alreadyAccount: "Already registered? Sign in",
      invalidCredentials: "Invalid email or password.",
      registerSuccess: "Account created successfully! Please sign in.",
      demoCredentialsHint: "Pre-configured demo accounts available (Player & Administrator).",
    },
    dashboard: {
      walletTitle: "My GRATIKO Wallet",
      availableBalance: "Available Balance",
      pendingDeposits: "Pending Recharges",
      pendingWithdrawals: "Pending Withdrawals",
      totalWinnings: "Total Winnings Credited",
      buyTicketBtn: "Buy a Ticket",
      myTicketsBtn: "My Tickets",
      rechargeBtn: "Recharge Wallet",
      withdrawBtn: "Request Withdrawal",
      quickStats: "Overview",
      recentActivity: "Recent Activity",
      noActivity: "No activity yet.",
    },
    tickets: {
      catalogTitle: "Available Scratch-Off Tickets",
      catalogSubtitle: "Pick your game, scratch the card and reveal instant prizes.",
      ticketPrice: "Ticket Price",
      maxPrize: "Top Prize",
      buyNow: "Buy This Ticket",
      scratchNow: "Scratch Now",
      scratchPrompt: "Rub with finger or mouse to reveal",
      autoScratch: "Reveal All",
      congratulations: "CONGRATULATIONS! YOU WON!",
      sorryLose: "Better luck next time!",
      winAmount: "Prize Won",
      claimWin: "Claim into Wallet",
      scratchedStatus: "Scratched",
      purchasedStatus: "Ready to scratch",
      rulesTitle: "Rules & Probabilities",
      probabilitiesTitle: "Official Prize Tiers & Odds",
      insufficientFunds: "Insufficient funds in wallet to purchase this ticket.",
      purchaseSuccess: "Ticket purchased! Result securely sealed on server.",
    },
    wallet: {
      rechargeTitle: "Recharge My Wallet",
      rechargeSubtitle: "Manual deposit request with strict verification.",
      withdrawTitle: "Request a Withdrawal",
      withdrawSubtitle: "Winnings are disbursed following identity checks.",
      selectAmount: "Amount to Deposit",
      paymentMethod: "Payment Method",
      senderNumber: "Sender Phone / Account",
      transactionReference: "Transaction Reference ID",
      submitRecharge: "Submit Deposit Request",
      submitWithdrawal: "Submit Withdrawal Request",
      rechargeSuccess: "Deposit submitted for administrative verification.",
      withdrawSuccess: "Withdrawal request submitted for review.",
      payoutDestination: "Payout Account / Number",
      minimumWithdrawalError: "Minimum withdrawal amount is 200 HTG.",
      insufficientBalanceError: "Insufficient available balance.",
      transactionsHistory: "Transaction Ledger History",
    },
    admin: {
      title: "Super-Admin & Financial Dashboard",
      subtitle: "Real-time solvency monitoring, double-entry ledger and auditing.",
      grossSales: "Gross Ticket Sales",
      operatorCommission: "Operator Commission (20%)",
      gameAllocation: "Game Allocation (80%)",
      reserveFund: "Dedicated Reserve Fund (40%)",
      obligations: "Outstanding Player Obligations",
      availableCash: "Available Cash Vault",
      solvencyStatus: "Financial Solvency Indicator",
      rechargeQueue: "Recharge Requests Queue",
      withdrawalQueue: "Withdrawal Requests Queue",
      approve: "Approve & Credit",
      reject: "Reject",
      decisionReason: "Decision Reason",
      batchManagement: "Batches & Odds Configuration",
      auditLog: "Security Audit Log",
      countrySettings: "Country & Currency Settings",
    },
    legal: {
      rulesTitle: "Official GRATIKO Game Rules",
      termsTitle: "Terms of Service",
      privacyTitle: "Privacy & Data Protection Policy",
      responsibleGaming: "Responsible Gaming & Player Safety",
      disclaimer: "Preparatory legal template — Requires local legal qualification.",
    },
  },
  es: {
    common: {
      appName: "GRATIKO",
      tagline: "Plataforma Digital de Raspes y Juegos Instantáneos",
      demoBadge: "MODO DEMOSTRACIÓN — CRÉDITOS FICTICIOS",
      demoNotice: "Plataforma en entorno de pruebas seguro. No se procesa dinero real sin autorización regulatoria.",
      save: "Guardar",
      cancel: "Cancelar",
      confirm: "Confirmar",
      loading: "Cargando...",
      error: "Ocurrió un error",
      success: "Operación exitosa",
      back: "Volver",
      currency: "HTG",
      language: "Idioma",
      logout: "Cerrar sesión",
      login: "Iniciar sesión",
      register: "Registrarse",
      dashboard: "Panel del Jugador",
      adminDashboard: "Administración",
      role: "Rol",
      status: "Estado",
      date: "Fecha",
      amount: "Monto",
      reference: "Referencia",
    },
    auth: {
      welcomeTitle: "Bienvenido a GRATIKO",
      welcomeSubtitle: "Acceda a su billetera digital y raspe boletos en tiempo real.",
      emailLabel: "Correo electrónico",
      passwordLabel: "Contraseña",
      fullNameLabel: "Nombre completo",
      phoneLabel: "Número de teléfono",
      countryLabel: "País de residencia",
      loginButton: "Iniciar sesión",
      registerButton: "Crear una cuenta",
      noAccount: "¿No tiene cuenta? Regístrese",
      alreadyAccount: "¿Ya tiene cuenta? Inicie sesión",
      invalidCredentials: "Correo o contraseña no válidos.",
      registerSuccess: "¡Cuenta creada con éxito! Por favor inicie sesión.",
      demoCredentialsHint: "Cuentas de demostración disponibles (Jugador y Administrador).",
    },
    dashboard: {
      walletTitle: "Mi Billetera GRATIKO",
      availableBalance: "Saldo disponible",
      pendingDeposits: "Recargas pendientes",
      pendingWithdrawals: "Retiros pendientes",
      totalWinnings: "Total de premios acreditados",
      buyTicketBtn: "Comprar un boleto",
      myTicketsBtn: "Mis boletos",
      rechargeBtn: "Recargar saldo",
      withdrawBtn: "Solicitar retiro",
      quickStats: "Resumen",
      recentActivity: "Actividad reciente",
      noActivity: "Sin actividad por el momento.",
    },
    tickets: {
      catalogTitle: "Boletos de Raspe Disponibles",
      catalogSubtitle: "Elija su juego, raspe y descubra premios al instante.",
      ticketPrice: "Precio del boleto",
      maxPrize: "Premio mayor",
      buyNow: "Comprar este boleto",
      scratchNow: "Raspar ahora",
      scratchPrompt: "Frote con el dedo o el ratón para revelar",
      autoScratch: "Revelar todo",
      congratulations: "¡FELICITACIONES! ¡HA GANADO!",
      sorryLose: "No tuvo premio esta vez.",
      winAmount: "Premio ganado",
      claimWin: "Reclamar a mi billetera",
      scratchedStatus: "Raspado",
      purchasedStatus: "Listo para raspar",
      rulesTitle: "Reglas y probabilidades del juego",
      probabilitiesTitle: "Tabla oficial de premios y probabilidades",
      insufficientFunds: "Saldo insuficiente para comprar este boleto.",
      purchaseSuccess: "¡Boleto comprado! Resultado sellado en el servidor.",
    },
    wallet: {
      rechargeTitle: "Recargar mi billetera",
      rechargeSubtitle: "Solicitud de depósito manual con verificación estricta.",
      withdrawTitle: "Solicitar retiro",
      withdrawSubtitle: "Los premios se pagan tras la verificación correspondiente.",
      selectAmount: "Monto a depositar",
      paymentMethod: "Método de pago",
      senderNumber: "Número o cuenta emisora",
      transactionReference: "Referencia de la transacción",
      submitRecharge: "Enviar solicitud de recarga",
      submitWithdrawal: "Enviar solicitud de retiro",
      rechargeSuccess: "Solicitud registrada para revisión administrativa.",
      withdrawSuccess: "Solicitud de retiro enviada a revisión.",
      payoutDestination: "Cuenta / Número de destino",
      minimumWithdrawalError: "El monto mínimo de retiro es de 200 HTG.",
      insufficientBalanceError: "Saldo disponible insuficiente.",
      transactionsHistory: "Historial de transacciones y libro mayor",
    },
    admin: {
      title: "Panel de Super-Administración y Finanzas",
      subtitle: "Monitoreo en tiempo real de solvencia, libro mayor y auditoría.",
      grossSales: "Ventas brutas de boletos",
      operatorCommission: "Comisión del operador (20%)",
      gameAllocation: "Asignación para juegos (80%)",
      reserveFund: "Fondo de reserva dedicado (40%)",
      obligations: "Obligaciones pendientes con jugadores",
      availableCash: "Caja disponible",
      solvencyStatus: "Indicador de solvencia financiera",
      rechargeQueue: "Cola de recargas por aprobar",
      withdrawalQueue: "Cola de retiros por procesar",
      approve: "Aprobar y Acreditar",
      reject: "Rechazar",
      decisionReason: "Motivo de la decisión",
      batchManagement: "Gestión de lotes y probabilidades",
      auditLog: "Registro de auditoría de seguridad",
      countrySettings: "Configuración de países y monedas",
    },
    legal: {
      rulesTitle: "Reglamento Oficial de Juegos GRATIKO",
      termsTitle: "Términos y Condiciones de Uso",
      privacyTitle: "Política de Privacidad y Protección de Datos",
      responsibleGaming: "Juego Responsable y Protección del Jugador",
      disclaimer: "Modelo legal preparatorio — Sujeto a calificación regulatoria.",
    },
  },
};

export function getDictionary(locale: string = "fr"): Translations {
  if (locale in dictionaries) {
    return dictionaries[locale as Locale];
  }
  return dictionaries.fr;
}

export function formatCurrency(amountCents: number, currency: string = "HTG", locale: string = "fr"): string {
  const units = (amountCents / 100).toLocaleString(locale === "ht" ? "fr-HT" : locale === "es" ? "es-DO" : "fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${units} ${currency}`;
}
