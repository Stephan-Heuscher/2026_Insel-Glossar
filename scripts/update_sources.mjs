/**
 * Update glossary_data.txt: fix Source names and Source-URLs
 * based on the architectural specification document.
 * 
 * Run: node scripts/update_sources.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const path = join(__dirname, 'glossary_data.txt');

const raw = readFileSync(path, 'utf-8');
const lines = raw.split('\n').filter(l => l.trim().length > 0);

// URLs
const NEURO = 'https://neurologie.insel.ch/fileadmin/Neurologie/Dokumente/Notfall/DE_Neuro_Pocket_2023_web_version.pdf';
const ICU = 'https://intensivmedizin.insel.ch/de/patienten-und-angehoerige/wichtige-fachbegriffe-erklaert';
const CAIRO = 'https://inselgruppe.ch/fileadmin/Insel_Gruppe/Dokumente/Medienmitteilungen/2024/Jahresbericht_2023_Insel_Gruppe_AG-1.pdf';
const PANKREAS = 'https://www.pankreaszentrum-bern.ch/de/patienten/patientenbroschueren.html';
const PATWEG = 'https://palliativzentrum.insel.ch/fileadmin/Palliativzentrum/Dokumente/Flyer/Flyer_Patientenwegleitung_Inselspital.pdf';
const MERKS = 'https://www.praktischarzt.de/medizinstudium/merksaetze-in-der-medizin-eselsbruecken/';
const VADEM = 'https://vademecum.insel.ch/de/glossar';
const DIPR_URL = 'https://radiologie.insel.ch/';
const UDEM_URL = 'https://udem.insel.ch/de/';

// Map: term -> { source, sourceUrl }
// We key by term text (first column). For lines 1-95 (main glossary) and 96-158 (abbreviations)
const corrections = {
    // === NEURO SECTION (lines 1-24) ===
    // These were "Zentiva Glossar" but should be "Neuro Pocket 2023"
    'Absence': { source: 'Neuro Pocket 2023', url: NEURO },
    'Absenceepilepsie': { source: 'Neuro Pocket 2023', url: NEURO },
    'Alpha-Rhythmus': { source: 'Neuro Pocket 2023', url: NEURO },
    'Atonischer Anfall': { source: 'Neuro Pocket 2023', url: NEURO },
    'Aura': { source: 'Neuro Pocket 2023', url: NEURO },
    'Automatismen': { source: 'Neuro Pocket 2023', url: NEURO },
    'BNS-Anfälle': { source: 'Neuro Pocket 2023', url: NEURO },
    'Einfach-fokaler Anfall': { source: 'Neuro Pocket 2023', url: NEURO },
    'Fieberkrämpfe': { source: 'Neuro Pocket 2023', url: NEURO },
    'Frontallappen': { source: 'Neuro Pocket 2023', url: NEURO },
    'Generalisierter Anfall': { source: 'Neuro Pocket 2023', url: NEURO },
    'Grand mal': { source: 'Neuro Pocket 2023', url: NEURO },
    'Lennox-Gastaut-Syndrom': { source: 'Neuro Pocket 2023', url: NEURO },
    'West-Syndrom': { source: 'Neuro Pocket 2023', url: NEURO },
    'Status epilepticus': { source: 'Neuro Pocket 2023', url: NEURO },

    // === ICU / CARDIO SECTION (lines 25-40) ===
    'Arrhythmie': { source: 'Intensivmedizin Glossar', url: ICU },
    'Arteriosklerose': { source: 'Intensivmedizin Glossar', url: ICU },
    'AV-Block': { source: 'Intensivmedizin Glossar', url: ICU },
    'Belastungs-EKG': { source: 'Intensivmedizin Glossar', url: ICU },
    'Bradykardie': { source: 'Intensivmedizin Glossar', url: ICU },
    'Defibrillation': { source: 'Intensivmedizin Glossar', url: ICU },
    'Diastolischer Blutdruck': { source: 'Intensivmedizin Glossar', url: ICU },
    'Embolie': { source: 'Intensivmedizin Glossar', url: ICU },
    'Extrasystole': { source: 'Intensivmedizin Glossar', url: ICU },
    'Herzschrittmacher': { source: 'Intensivmedizin Glossar', url: ICU },
    'Hypertonie': { source: 'Intensivmedizin Glossar', url: ICU },
    'Systolischer Blutdruck': { source: 'Intensivmedizin Glossar', url: ICU },
    'Tachykardie': { source: 'Intensivmedizin Glossar', url: ICU },
    'Vorhofflimmern': { source: 'Intensivmedizin Glossar', url: ICU },

    // === ONCOLOGY SECTION ===
    'Adenokarzinom': { source: 'CAIRO Jahresbericht 2023', url: CAIRO },
    'Chemotherapie': { source: 'CAIRO Jahresbericht 2023', url: CAIRO },
    'Computertomographie (CT)': { source: 'CAIRO Jahresbericht 2023', url: CAIRO },
    'Grading': { source: 'CAIRO Jahresbericht 2023', url: CAIRO },
    'Magnetresonanztomographie (MRT)': { source: 'CAIRO Jahresbericht 2023', url: CAIRO },
    'Maligne': { source: 'CAIRO Jahresbericht 2023', url: CAIRO },
    'Metastase': { source: 'CAIRO Jahresbericht 2023', url: CAIRO },
    'PET': { source: 'CAIRO Jahresbericht 2023', url: CAIRO },
    'Primärtumor': { source: 'CAIRO Jahresbericht 2023', url: CAIRO },
    'Prostatakrebs': { source: 'CAIRO Jahresbericht 2023', url: CAIRO },
    'Zytostatika': { source: 'CAIRO Jahresbericht 2023', url: CAIRO },

    // Pankreaszentrum sources
    'Adenom': { source: 'Pankreaszentrum Broschüren', url: PANKREAS },
    'Biopsie': { source: 'Pankreaszentrum Broschüren', url: PANKREAS },
    'Endoskopie': { source: 'Pankreaszentrum Broschüren', url: PANKREAS },
    'Koloskopie': { source: 'Pankreaszentrum Broschüren', url: PANKREAS },
    'Polyp': { source: 'Pankreaszentrum Broschüren', url: PANKREAS },
    'Prostatahyperplasie': { source: 'Pankreaszentrum Broschüren', url: PANKREAS },

    // === PHARMA SECTION ===
    'Antibiotika': { source: 'Neuro Pocket 2023', url: NEURO },
    'Antiepileptika': { source: 'Neuro Pocket 2023', url: NEURO },
    'Antihypertensivum': { source: 'Neuro Pocket 2023', url: NEURO },
    'AT1-Blocker': { source: 'Neuro Pocket 2023', url: NEURO },
    'Bisphosphonate': { source: 'Neuro Pocket 2023', url: NEURO },
    'Glukokortikoide': { source: 'Neuro Pocket 2023', url: NEURO },
    'Phytotherapeutika': { source: 'Neuro Pocket 2023', url: NEURO },
    'Plazebo': { source: 'Neuro Pocket 2023', url: NEURO },

    // === ADMIN / CAMPUS SECTION ===
    'Allgemeine Abteilung': { source: 'Patientenwegleitung Inselspital', url: PATWEG },
    'Anna-Seiler-Haus': { source: 'Patientenwegleitung Inselspital', url: PATWEG },
    'Bettenhochhaus (BHH)': { source: 'Patientenwegleitung Inselspital', url: PATWEG },
    'Frauenklinik': { source: 'Patientenwegleitung Inselspital', url: PATWEG },
    'IIC': { source: 'Patientenwegleitung Inselspital', url: PATWEG },
    'INO': { source: 'Patientenwegleitung Inselspital', url: PATWEG },
    'Kinderkliniken': { source: 'Patientenwegleitung Inselspital', url: PATWEG },
    'Kostendeckung': { source: 'Patientenwegleitung Inselspital', url: PATWEG },
    'Kostengutsprache': { source: 'Patientenwegleitung Inselspital', url: PATWEG },
    'Patienten-Ombudsstelle': { source: 'Patientenwegleitung Inselspital', url: PATWEG },
    'Patienten-Onlineaufnahme': { source: 'Patientenwegleitung Inselspital', url: PATWEG },
    'Vorauskasse': { source: 'Patientenwegleitung Inselspital', url: PATWEG },

    // === LEGAL SECTION ===
    'Anfechtbare Verfügung': { source: 'Patientenwegleitung Inselspital', url: PATWEG },
    'Berufsgeheimnis': { source: 'Patientenwegleitung Inselspital', url: PATWEG },
    'Patientenverfügung': { source: 'Patientenwegleitung Inselspital', url: PATWEG },
    'Urteilsunfähigkeit': { source: 'Patientenwegleitung Inselspital', url: PATWEG },

    // === MNEMONICS SECTION ===
    'ABCDE-Schema': { source: 'Medizinische Merkbrücken', url: MERKS },
    'FAST-HUGS': { source: 'Medizinische Merkbrücken', url: MERKS },
    'Intercostalraum-Leitungen': { source: 'Praktischarzt Eselsbrücken', url: MERKS },
    'Milzgröße': { source: 'Praktischarzt Eselsbrücken', url: MERKS },
    'MUDPILES': { source: 'Medizinische Merkbrücken', url: MERKS },
    'NAVeL': { source: 'Medizinische Merkbrücken', url: MERKS },
    'OPQRST': { source: 'Medizinische Merkbrücken', url: MERKS },
    'SAD PERSONS': { source: 'Medizinische Merkbrücken', url: MERKS },
    'SIG E CAPS': { source: 'Medizinische Merkbrücken', url: MERKS },
    'SOAP': { source: 'Medizinische Merkbrücken', url: MERKS },
};

// Abbreviation corrections (lines 96-158): keyed by "term|context" to handle duplicates
const abbrCorrections = {
    'ASH|Campus Navigation': { source: 'Patientenwegleitung', url: PATWEG },
    'BHH|Campus Navigation': { source: 'Patientenwegleitung', url: PATWEG },
    'CTU|Administration': { source: 'Vademecum', url: VADEM },
    'DIPR|Radiology': { source: 'DIPR Webportal', url: DIPR_URL },
    'FTN|Emergency': { source: 'Neuro Pocket', url: NEURO },
    'GG|Administration / Insurance': { source: 'Patientenwegleitung', url: PATWEG },
    'HNO|Clinic Navigation': { source: 'Patientenwegleitung', url: PATWEG },
    'IIC|Administration': { source: 'Patientenwegleitung', url: PATWEG },
    'INO|Campus Navigation': { source: 'Patientenwegleitung', url: PATWEG },
    'IV|Administration / Insurance': { source: 'Patientenwegleitung', url: PATWEG },
    'OPO|Campus Navigation': { source: 'Patientenwegleitung', url: PATWEG },
    'SU|Neurology': { source: 'Neuro Pocket', url: NEURO },
    'SWEZ|Clinic Navigation': { source: 'Neuro Pocket', url: NEURO },
    'UDEM|Clinic Navigation': { source: 'UDEM Webportal', url: UDEM_URL },
    'UKN|Neurology': { source: 'Neuro Pocket', url: NEURO },
    'WG|Campus Navigation': { source: 'Patientenwegleitung', url: PATWEG },
    'ACN|Nursing / Personnel': { source: 'Neuro Pocket', url: NEURO },
    'ARDS|Intensive Care': { source: 'Neuro Pocket', url: NEURO },
    'BE|Diagnostics': { source: 'Neuro Pocket', url: NEURO },
    'DBS|Neurology': { source: 'Neuro Pocket', url: NEURO },
    'DIC|Intensive Care': { source: 'Neuro Pocket', url: NEURO },
    'IVT|Emergency / Neurology': { source: 'Neuro Pocket', url: NEURO },
    'LP|Diagnostics': { source: 'Neuro Pocket', url: NEURO },
    'MH|Anesthesia': { source: 'Neuro Pocket', url: NEURO },
    'MNS|Psychiatry': { source: 'Neuro Pocket', url: NEURO },
    'MRI|Diagnostics': { source: 'Neuro Pocket', url: NEURO },
    'MS|Neurology': { source: 'Neuro Pocket', url: NEURO },
    'OA|Personnel': { source: 'Neuro Pocket', url: NEURO },
    'PRES|Neurology': { source: 'Neuro Pocket', url: NEURO },
    'TTM|Intensive Care': { source: 'Neuro Pocket', url: NEURO },
    'BRV|Pharmacology': { source: 'Neuro Pocket', url: NEURO },
    'CBD|Pharmacology': { source: 'Neuro Pocket', url: NEURO },
    'CK|Lab Values': { source: 'Neuro Pocket', url: NEURO },
    'CLB|Pharmacology': { source: 'Neuro Pocket', url: NEURO },
    'CLZ|Pharmacology': { source: 'Neuro Pocket', url: NEURO },
    'CNB|Pharmacology': { source: 'Neuro Pocket', url: NEURO },
    'CYP|Lab / Metabolism': { source: 'Neuro Pocket', url: NEURO },
    'ESM|Pharmacology': { source: 'Neuro Pocket', url: NEURO },
    'FBM|Pharmacology': { source: 'Neuro Pocket', url: NEURO },
    'GBT|Pharmacology': { source: 'Neuro Pocket', url: NEURO },
    'LCM|Pharmacology': { source: 'Neuro Pocket', url: NEURO },
    'LTG|Pharmacology': { source: 'Neuro Pocket', url: NEURO },
    'MAOI|Pharmacology': { source: 'Neuro Pocket', url: NEURO },
    'OXC|Pharmacology': { source: 'Neuro Pocket', url: NEURO },
    'PER|Pharmacology': { source: 'Neuro Pocket', url: NEURO },
    'PGB|Pharmacology': { source: 'Neuro Pocket', url: NEURO },
    'PHT|Pharmacology': { source: 'Neuro Pocket', url: NEURO },
    'RUF|Pharmacology': { source: 'Neuro Pocket', url: NEURO },
    'SNRI|Pharmacology': { source: 'Neuro Pocket', url: NEURO },
    'SSRI|Pharmacology': { source: 'Neuro Pocket', url: NEURO },
    'TPM|Pharmacology': { source: 'Neuro Pocket', url: NEURO },
    'UGT|Lab / Metabolism': { source: 'Neuro Pocket', url: NEURO },
    'VGB|Pharmacology': { source: 'Neuro Pocket', url: NEURO },
    'VPA|Pharmacology': { source: 'Neuro Pocket', url: NEURO },
    'ZNS|Pharmacology': { source: 'Neuro Pocket', url: NEURO },
    'ADE|Clinical Trials': { source: 'Vademecum / Spitalpharmazie', url: VADEM },
    'AE|Clinical Trials': { source: 'Vademecum / Spitalpharmazie', url: VADEM },
    'GCP|Clinical Trials': { source: 'Vademecum / Spitalpharmazie', url: VADEM },
    'PI|Clinical Trials': { source: 'Vademecum / Spitalpharmazie', url: VADEM },
    'SADE|Clinical Trials': { source: 'Vademecum / Spitalpharmazie', url: VADEM },
    'SAE|Clinical Trials': { source: 'Vademecum / Spitalpharmazie', url: VADEM },
    'SUSAR|Clinical Trials': { source: 'Vademecum / Spitalpharmazie', url: VADEM },
};

let changed = 0;
const updatedLines = lines.map((line, idx) => {
    const parts = line.split('\t');
    if (parts.length < 6) return line;

    const term = parts[0].trim();
    const context = parts[1]?.trim() || '';
    const oldSource = parts[6]?.trim() || '';
    const oldUrl = parts[7]?.trim() || '';

    // Check abbreviation corrections first (term|context key)
    const abbrKey = `${term}|${context}`;
    if (abbrCorrections[abbrKey]) {
        const c = abbrCorrections[abbrKey];
        if (oldSource !== c.source || oldUrl !== c.url) {
            parts[6] = c.source;
            parts[7] = c.url;
            console.log(`✏️  Line ${idx + 1}: "${term}" source: "${oldSource}" → "${c.source}", url updated`);
            changed++;
        }
        return parts.join('\t');
    }

    // Check main corrections (term key)
    if (corrections[term]) {
        const c = corrections[term];
        if (oldSource !== c.source || oldUrl !== c.url) {
            parts[6] = c.source;
            parts[7] = c.url;
            console.log(`✏️  Line ${idx + 1}: "${term}" source: "${oldSource}" → "${c.source}", url updated`);
            changed++;
        }
        return parts.join('\t');
    }

    return line;
});

writeFileSync(path, updatedLines.join('\n'), 'utf-8');
console.log(`\n✅ Done! Updated ${changed} entries in glossary_data.txt`);
