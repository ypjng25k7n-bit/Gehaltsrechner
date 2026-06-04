// 2026 Steuer- und Abgabensätze für Steuerklasse 1, unter 23 Jahren, keine Kinder
const TAX_RATES = {
    // Einkommensteuer Grundfreibetrag 2026
    GRUNDFREIBETRAG: 12348,
    
    // Solidaritätszuschlag (5,5% auf Einkommensteuer, ab 972€ ESt)
    SOLIDARITY_SURCHARGE: 0.055,
    SOLIDARITY_THRESHOLD: 972,
    
    // Kirchensteuer (Person ist nicht in der Kirche - 0%)
    KIRCHENSTEUER_RATE: 0.0, // 0% da nicht kirchlich
};

const SOCIAL_INSURANCE = {
    // Krankenversicherung (Arbeitnehmeranteil)
    KV_RATE: 0.073, // 7,3%
    KV_ZUSATZBEITRAG_AN: 0.0135, // 50% von 2,7% Zusatzbeitrag = 1,35% (Arbeitnehmeranteil)
    
    // Rentenversicherung (Arbeitnehmeranteil)
    RV_RATE: 0.093, // 9,3%
    
    // Pflegeversicherung (Arbeitnehmeranteil)
    PV_RATE: 0.0305, // 3,05%
    
    // Arbeitslosenversicherung (Arbeitnehmeranteil)
    // 2,6% total - jeweils Hälfte von Arbeitnehmer und Arbeitgeber
    ALV_RATE: 0.013, // 1,3% (Arbeitnehmeranteil, 50% von 2,6%)
};

/**
 * Berechnet die Einkommensteuer nach §32a EStG (2026)
 * Formel für das zu versteuernde Einkommen (Jahreseinkommen NACH Grundfreibetrag abgezogen)
 * 
 * Die ursprüngliche Formel arbeitet mit den Gesamtwerten:
 * a) bis 12.348 Euro → ESt = 0
 * b) von 12.349 bis 17.799 Euro → ESt = (914,51 * y + 1.400) * y,  y = (zvE - 12.348) / 10.000
 * c) von 17.800 bis 69.878 Euro → ESt = (173,1 * z + 2.397) * z + 1.034,87,  z = (zvE - 17.799) / 10.000
 * d) von 69.879 bis 277.825 Euro → ESt = 0,42 * zvE - 11.135,63
 * e) ab 277.826 Euro → ESt = 0,45 * zvE - 19.470,38
 * 
 * @param {number} zvE - Zu versteuerndes Einkommen (GESAMTBETRAG, vor Grundfreibetrag)
 * @returns {number} Einkommensteuer (Jahressteuer)
 */
function calculateIncomeTax(zvE) {
    if (zvE <= TAX_RATES.GRUNDFREIBETRAG) {
        return 0; // a) bis 12.348 Euro
    } else if (zvE <= 17799) {
        // b) von 12.349 bis 17.799 Euro
        // ESt = (914,51 * y + 1.400) * y
        const y = (zvE - TAX_RATES.GRUNDFREIBETRAG) / 10000;
        return (914.51 * y + 1400) * y;
    } else if (zvE <= 69878) {
        // c) von 17.800 bis 69.878 Euro
        // ESt = (173,1 * z + 2.397) * z + 1.034,87
        const z = (zvE - 17799) / 10000;
        return (173.1 * z + 2397) * z + 1034.87;
    } else if (zvE <= 277825) {
        // d) von 69.879 bis 277.825 Euro
        // ESt = 0,42 * zvE - 11.135,63
        return 0.42 * zvE - 11135.63;
    } else {
        // e) ab 277.826 Euro
        // ESt = 0,45 * zvE - 19.470,38
        return 0.45 * zvE - 19470.38;
    }
}

/**
 * Berechnet die Kirchensteuer
 * @param {number} incomeTax - Einkommensteuer (Jahressteuer)
 * @returns {number} Kirchensteuer (Jahressteuer)
 */
function calculateKirchensteuer(incomeTax) {
    return incomeTax * TAX_RATES.KIRCHENSTEUER_RATE;
}

/**
 * Berechnet die Sozialversicherungsabzüge
 * @param {number} brutto - Bruttogehalt (monatlich)
 * @returns {object} Aufschlüsselung der Sozialabzüge (monatlich)
 */
function calculateSocialInsurance(brutto) {
    const kv = brutto * (SOCIAL_INSURANCE.KV_RATE + SOCIAL_INSURANCE.KV_ZUSATZBEITRAG_AN);
    const rv = brutto * SOCIAL_INSURANCE.RV_RATE;
    const pv = brutto * SOCIAL_INSURANCE.PV_RATE;
    const alv = brutto * SOCIAL_INSURANCE.ALV_RATE;

    return {
        krankenversicherung: kv,
        rentenversicherung: rv,
        pflegeversicherung: pv,
        arbeitslosenversicherung: alv,
        total: kv + rv + pv + alv,
        kvRate: SOCIAL_INSURANCE.KV_RATE + SOCIAL_INSURANCE.KV_ZUSATZBEITRAG_AN,
        rvRate: SOCIAL_INSURANCE.RV_RATE,
        pvRate: SOCIAL_INSURANCE.PV_RATE,
        alvRate: SOCIAL_INSURANCE.ALV_RATE,
    };
}

/**
 * Hauptberechnung: Brutto zu Netto
 * @param {number} bruttoMonatlich - Bruttogehalt (monatlich)
 * @returns {object} Detaillierte Aufschlüsselung
 */
function calculateNetIncome(bruttoMonatlich) {
    // Schritt 1: Jahresgehalt berechnen
    const bruttoJaehrlich = bruttoMonatlich * 12;
    
    // Schritt 2: Sozialversicherung berechnen (monatlich)
    const socialInsurance = calculateSocialInsurance(bruttoMonatlich);
    
    // Schritt 3: Zu versteuerndes Einkommen berechnen (jährlich)
    // zvE = Brutto - Sozialversicherungsabzüge (jährlich)
    const steuerlichesEinkommenJaehrlich = Math.max(0, bruttoJaehrlich - (socialInsurance.total * 12));
    
    // Schritt 4: Einkommensteuer berechnen nach §32a EStG (Jahressteuer)
    // Die Funktion erhält das GESAMTE steuerliche Einkommen (mit Grundfreibetrag-Berücksichtigung in der Formel)
    const incomeTaxJaehrlich = calculateIncomeTax(steuerlichesEinkommenJaehrlich);
    
    // Schritt 5: Solidaritätszuschlag berechnen (auf Jahressteuer)
    let solidarityTax = 0;
    if (incomeTaxJaehrlich >= TAX_RATES.SOLIDARITY_THRESHOLD) {
        solidarityTax = incomeTaxJaehrlich * TAX_RATES.SOLIDARITY_SURCHARGE;
    }
    
    // Schritt 6: Gesamte Einkommensteuer + Solidaritätszuschlag (Jahressteuer)
    const totalIncomeTaxJaehrlich = incomeTaxJaehrlich + solidarityTax;

    // Schritt 7: Kirchensteuer berechnen (Jahressteuer)
    const kirchensteuerJaehrlich = calculateKirchensteuer(totalIncomeTaxJaehrlich);

    // Schritt 8: Monatliche Steuern berechnen (für Anzeige)
    const incomeTaxMonatlich = totalIncomeTaxJaehrlich / 12;
    const kirchensteuerMonatlich = kirchensteuerJaehrlich / 12;

    // Schritt 9: Netto berechnen (monatlich)
    const nettoMonatlich = bruttoMonatlich - socialInsurance.total - incomeTaxMonatlich - kirchensteuerMonatlich;

    // Berechnung der Prozentsätze für Anzeige (basierend auf monatlichem Brutto)
    const totalDeductions = socialInsurance.total + incomeTaxMonatlich + kirchensteuerMonatlich;
    const taxPercentage = bruttoMonatlich > 0 ? (incomeTaxMonatlich / bruttoMonatlich * 100) : 0;
    const kirchensteuerPercentage = bruttoMonatlich > 0 ? (kirchensteuerMonatlich / bruttoMonatlich * 100) : 0;
    const kvPercentage = bruttoMonatlich > 0 ? (socialInsurance.krankenversicherung / bruttoMonatlich * 100) : 0;
    const rvPercentage = bruttoMonatlich > 0 ? (socialInsurance.rentenversicherung / bruttoMonatlich * 100) : 0;
    const pvPercentage = bruttoMonatlich > 0 ? (socialInsurance.pflegeversicherung / bruttoMonatlich * 100) : 0;
    const alvPercentage = bruttoMonatlich > 0 ? (socialInsurance.arbeitslosenversicherung / bruttoMonatlich * 100) : 0;

    return {
        brutto: bruttoMonatlich,
        incomeTax: incomeTaxMonatlich,
        kirchensteuer: kirchensteuerMonatlich,
        krankenversicherung: socialInsurance.krankenversicherung,
        rentenversicherung: socialInsurance.rentenversicherung,
        pflegeversicherung: socialInsurance.pflegeversicherung,
        arbeitslosenversicherung: socialInsurance.arbeitslosenversicherung,
        totalDeductions,
        netto: nettoMonatlich,
        taxPercentage,
        kirchensteuerPercentage,
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
    
    document.getElementById('deductionKirchensteuer').textContent = formatEuro(calculation.kirchensteuer);
    document.getElementById('percentageKirchensteuer').textContent = formatPercent(calculation.kirchensteuerPercentage);
    
    document.getElementById('deductionKV').textContent = formatEuro(calculation.krankenversicherung);
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
