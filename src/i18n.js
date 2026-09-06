const translations = {
    es: {
        placeholder: "Ej: x^2 - 4, sin(x), o 'man' para ayuda...",
        btnHelpTitle: "Manual de usuario",
        btnClearTitle: "Limpiar cinta",
        btnSubmitTitle: "Calcular (Enter)",
        manTitle: "Manual de Usuario (man)",
        tableCategory: "Categoría",
        tableSyntax: "Comando / Sintaxis",
        tableDetails: "Detalles",
        seeMore: "📖 Ver más",
        syntaxLabel: "Sintaxis:",
        exampleLabel: "Ejemplo de uso:",
        clickToTest: "(Clic para probar)",
        errUnresolved: "No se pudo factorizar la expresión",
        errIncomplete: "Expresión incompleta",
        errDivZero: "El módulo m no puede ser 0",
        errNoDiophantine: "No tiene solución entera (gcd no divide a c)",
        errEnterPrime: "Ingresá un entero mayor a 1",
        fourierTitle: "Serie de Fourier"
    },
    en: {
        placeholder: "Ex: x^2 - 4, sin(x), or 'man' for help...",
        btnHelpTitle: "User manual",
        btnClearTitle: "Clear tape",
        btnSubmitTitle: "Calculate (Enter)",
        manTitle: "User Manual (man)",
        tableCategory: "Category",
        tableSyntax: "Command / Syntax",
        tableDetails: "Details",
        seeMore: "📖 Read more",
        syntaxLabel: "Syntax:",
        exampleLabel: "Usage example:",
        clickToTest: "(Click to test)",
        errUnresolved: "Could not factor expression",
        errIncomplete: "Incomplete expression",
        errDivZero: "Module m cannot be 0",
        errNoDiophantine: "No integer solution (gcd does not divide c)",
        errEnterPrime: "Enter an integer greater than 1",
        fourierTitle: "Fourier Series"
    },
    fr: {
        placeholder: "Ex : x^2 - 4, sin(x), ou 'man' pour l'aide...",
        btnHelpTitle: "Manuel de l'utilisateur",
        btnClearTitle: "Effacer el ruban",
        btnSubmitTitle: "Calculer (Entrée)",
        manTitle: "Manuel de l'utilisateur (man)",
        tableCategory: "Catégorie",
        tableSyntax: "Commande / Syntaxe",
        tableDetails: "Détails",
        seeMore: "📖 En savoir plus",
        syntaxLabel: "Syntaxe :",
        exampleLabel: "Exemple d'utilisation :",
        clickToTest: "(Cliquer pour tester)",
        errUnresolved: "Impossible de factoriser l'expression",
        errIncomplete: "Expression incomplète",
        errDivZero: "Le module m ne peut pas être 0",
        errNoDiophantine: "Pas de solution entière (pgcd ne divise pas c)",
        errEnterPrime: "Entrez un entier supérieur à 1",
        fourierTitle: "Série de Fourier"
    },
    it: {
        placeholder: "Es: x^2 - 4, sin(x), o 'man' per aiuto...",
        btnHelpTitle: "Manuale utente",
        btnClearTitle: "Cancella nastro",
        btnSubmitTitle: "Calcola (Invio)",
        manTitle: "Manuale Utente (man)",
        tableCategory: "Categoria",
        tableSyntax: "Comando / Sintassi",
        tableDetails: "Dettagli",
        seeMore: "📖 Leggi di più",
        syntaxLabel: "Sintassi:",
        exampleLabel: "Esempio d'uso:",
        clickToTest: "(Clicca per provare)",
        errUnresolved: "Impossibile fattorizzare l'espressione",
        errIncomplete: "Espressione incompleta",
        errDivZero: "Il modulo m non può essere 0",
        errNoDiophantine: "Nessuna soluzione intera (MCD non divide c)",
        errEnterPrime: "Inserisci un intero maggiore di 1",
        fourierTitle: "Serie di Fourier"
    }
};

// Detección e identificación del idioma según el OS
function getSystemLocale() {
    const localeArg = window.process && window.process.argv 
        ? window.process.argv.find(arg => arg.startsWith('--app-locale=')) 
        : null;

    if (localeArg) {
        const fullLocale = localeArg.split('=')[1].toLowerCase();
        const langCode = fullLocale.split('-')[0]; // Extrae 'es', 'en', 'fr', 'it'
        
        if (translations[langCode]) {
            return langCode;
        }
    }
    return 'es'; // Idioma por defecto en caso de no coincidir
}

const currentLang = getSystemLocale();
const t = (key) => (translations[currentLang] && translations[currentLang][key]) 
    ? translations[currentLang][key] 
    : (translations['en'][key] || key);

module.exports = { t, currentLang };