// 2026 Steuer- und Abgabensätze für Steuerklasse 1, unter 23 Jahren, keine Kinder
const TAX_RATES = {
    // Einkommensteuer Grundfreibetrag 2026
    GRUNDFREIBETRAG: 11600,
    
    // Progressionszonen für Einkommensteuer (vereinfacht)
    PROGRESSION_ZONE_1: { bis: 15000, rate: 0.14 },
    PROGRESSION_ZONE_2: { bis: 41500, rate: 0.42 },
    PROGRESSION_ZONE_3: { bis: 62500, rate: 0.45 },
    
    // Solidaritätszuschlag (5,5% auf Einkommensteuer, ab 972€ ESt)
    SOLIDARITY_SURCHARGE: 0.055,
    SOLIDARITY_THRESHOLD: 972,
};

const SOCIAL_INSURANCE = {
    // Krankenversicherung (Arbeitnehmeranteil)
    KV_RATE: 0.073, // 7,3%
    KV_ZUSATZBEITRAG: 0.027, // 2,7% Zusatzbeitrag
    
    // Rentenversicherung (Arbeitnehmeranteil)
    RV_RATE: 0.093, // 9,3%
    
    // Pflegeversicherung (Arbeitnehmeranteil)
    PV_RATE: 0.0305, // 3,05%
    
    // Arbeitslosenversicherung (Arbeitnehmeranteil)
    ALV_RATE: 0.026, // 2,6%
};

/**
 * Berechnet die Einkommensteuer nach dem deutschen Steuertarif 2026
 * @param {number} income - Zu versteuerndes Einkommen (nach Grundfreibetrag)
 * @returns {number} Einkommensteuer
 */
function calculateIncomeTax(income) {
    if (income <= 0) return 0;

    let tax = 0;
    
    // Vereinfachte Berechnung mit Progressionszonen
    if (income <= TAX_RATES.PROGRESSION_ZONE_1.bis) {
        tax = income * TAX_RATES.PROGRESSION_ZONE_1.rate;
    } else if (income <= TAX_RATES.PROGRESSION_ZONE_2.bis) {
        tax = TAX_RATES.PROGRESSION_ZONE_1.bis * TAX_RATES.PROGRESSION_ZONE_1.rate;
        tax += (income - TAX_RATES.PROGRESSION_ZONE_1.bis) * TAX_RATES.PROGRESSION_ZONE_2.rate;
    } else if (income <= TAX_RATES.PROGRESSION_ZONE_3.bis) {
        tax = TAX_RATES.PROGRESSION_ZONE_1.bis * TAX_RATES.PROGRESSION_ZONE_1.rate;
        tax += (TAX_RATES.PROGRESSION_ZONE_2.bis - TAX_RATES.PROGRESSION_ZONE_1.bis) * TAX_RATES.PROGRESSION_ZONE_2.rate;
        tax += (income - TAX_RATES.PROGRESSION_ZONE_2.bis) * TAX_RATES.PROGRESSION_ZONE_3.rate;
    } else {
        tax = TAX_RATES.PROGRESSION_ZONE_1.bis * TAX_RATES.PROGRESSION_ZONE_1.rate;
        tax += (TAX_RATES.PROGRESSION_ZONE_2.bis - TAX_RATES.PROGRESSION_ZONE_1.bis) * TAX_RATES.PROGRESSION_ZONE_2.rate;
        tax += (TAX_RATES.PROGRESSION_ZONE_3.bis - TAX_RATES.PROGRESSION_ZONE_2.bis) * TAX_RATES.PROGRESSION_ZONE_3.rate;
        tax += (income - TAX_RATES.PROGRESSION_ZONE_3.bis) * 0.42; // Spitzensatz
    }

    // Solidaritätszuschlag
    if (tax >= TAX_RATES.SOLIDARITY_THRESHOLD) {
        tax += tax * TAX_RATES.SOLIDARITY_SURCHARGE;
    }

    return tax;
}

/**
 * Berechnet die Sozialversicherungsabzüge
 * @param {number} brutto - Bruttogehalt
 * @returns {object} Aufschlüsselung der Sozialabzüge
 */
function calculateSocialInsurance(brutto) {
    const kv = brutto * (SOCIAL_INSURANCE.KV_RATE + SOCIAL_INSURANCE.KV_ZUSATZBEITRAG);
    const rv = brutto * SOCIAL_INSURANCE.RV_RATE;
    const pv = brutto * SOCIAL_INSURANCE.PV_RATE;
    const alv = brutto * SOCIAL_INSURANCE.ALV_RATE;

    return {
        krankenversicherung: kv,
        rentenversicherung: rv,
        pflegeversicherung: pv,
        arbeitslosenversicherung: alv,
        total: kv + rv + pv + alv,
        kvRate: SOCIAL_INSURANCE.KV_RATE + SOCIAL_INSURANCE.KV_ZUSATZBITTRAG,
        rvRate: SOCIAL_INSURANCE.RV_RATE,
        pvRate: SOCIAL_INSURANCE.PV_RATE,
        alvRate: SOCIAL_INSURANCE.ALV_RATE,
    };
}

/**
 * Hauptberechnung: Brutto zu Netto
 * @param {number} brutto - Bruttogehalt
 * @returns {object} Detaillierte Aufschlüsselung
 */
function calculateNetIncome(brutto) {
    // Schritt 1: Sozialversicherung berechnen
    const socialInsurance = calculateSocialInsurance(brutto);
    
    // Schritt 2: Zu versteuerndes Einkommen berechnen
    const steuerlichesEinkommen = Math.max(0, brutto - socialInsurance.total);
    
    // Schritt 3: Einkommensteuer berechnen (nach Grundfreibetrag)
    const steuerbares = Math.max(0, steuerlichesEinkommen - TAX_RATES.GRUNDFREIBETRAG);
    const incomeTax = calculateIncomeTax(steuerbares);

    // Schritt 4: Netto berechnen
    const netto = brutto - socialInsurance.total - incomeTax;

    // Berechnung der Prozentsätze für Anzeige
    const totalDeductions = socialInsurance.total + incomeTax;
    const taxPercentage = brutto > 0 ? (incomeTax / brutto * 100) : 0;
    const kvPercentage = brutto > 0 ? (socialInsurance.krankenversicherung / brutto * 100) : 0;
    const rvPercentage = brutto > 0 ? (socialInsurance.rentenversicherung / brutto * 100) : 0;
    const pvPercentage = brutto > 0 ? (socialInsurance.pflegeversicherung / brutto * 100) : 0;
    const alvPercentage = brutto > 0 ? (socialInsurance.arbeitslosenversicherung / brutto * 100) : 0;

    return {
        brutto,
        incomeTax,
        crankenversicherung: socialInsurance.krankenversicherung,
        rentenversicherung: socialInsurance.rentenversicherung,
        pflegeversicherung: socialInsurance.pflegeversicherung,
        arbeitslosenversicherung: socialInsurance.arbeitslosenversicherung,
        totalDeductions,
        netto,
        taxPercentage,
        kvPercentage,
        rvPercentage,
        pvPercentage,
        alvPercentage,
    };
}

/**
 * Formatiert eine Zahl als Euro-Betrag
 * @param {number} value - Wert
 * @returns {string} Formatierter Euro-Betrag
 */
function formatEuro(value) {
    return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

/**
 * Formatiert einen Prozentsatz
 * @param {number} value - Prozentwert
 * @returns {string} Formatierter Prozentsatz
 */
function formatPercent(value) {
    return value.toFixed(1) + '%';
}

/**
 * Zeigt die Ergebnisse in der UI an
 * @param {object} calculation - Berechnungsergebnis
 */
function displayResults(calculation) {
    // Ergebnis-Container anzeigen
    const resultsDiv = document.getElementById('results');
    const emptyStateDiv = document.getElementById('emptyState');
    
    resultsDiv.style.display = 'flex';
    emptyStateDiv.style.display = 'none';

    // Werte einfügen
    document.getElementById('resultBrutto').textContent = formatEuro(calculation.brutto);
    document.getElementById('resultNetto').textContent = formatEuro(calculation.netto);
    
    // Abzüge anzeigen
    document.getElementById('deductionTax').textContent = formatEuro(calculation.incomeTax);
    document.getElementById('percentageTax').textContent = formatPercent(calculation.taxPercentage);
    
    document.getElementById('deductionKV').textContent = formatEuro(calculation.crankenversicherung);
    document.getElementById('percentageKV').textContent = formatPercent(calculation.kvPercentage);
    
    document.getElementById('deductionRV').textContent = formatEuro(calculation.rentenversicherung);
    document.getElementById('percentageRV').textContent = formatPercent(calculation.rvPercentage);
    
    document.getElementById('deductionPV').textContent = formatEuro(calculation.pflegeversicherung);
    document.getElementById('percentagePV').textContent = formatPercent(calculation.pvPercentage);
    
    document.getElementById('deductionALV').textContent = formatEuro(calculation.arbeitslosenversicherung);
    document.getElementById('percentageALV').textContent = formatPercent(calculation.alvPercentage);
    
    document.getElementById('totalDeductions').textContent = formatEuro(calculation.totalDeductions);

    // Scroll zu Ergebnissen
    setTimeout(() => {
        resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

/**
 * Event Listener für Berechnung
 */
document.getElementById('calculateBtn').addEventListener('click', function() {
    const bruttoInput = document.getElementById('bruttoInput').value;
    const brutto = parseFloat(bruttoInput) || 0;

    if (brutto <= 0) {
        alert('Bitte gib ein gültiges Bruttogehalt ein (größer als 0€)');
        return;
    }

    const calculation = calculateNetIncome(brutto);
    displayResults(calculation);
});

/**
 * Enter-Taste zum Berechnen
 */
document.getElementById('bruttoInput').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        document.getElementById('calculateBtn').click();
    }
});

/**
 * Initialisierung: Leeren Zustand anzeigen
 */
window.addEventListener('load', function() {
    document.getElementById('emptyState').style.display = 'block';
    document.getElementById('results').style.display = 'none';
});
