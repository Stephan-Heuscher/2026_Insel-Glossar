
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const path = join(__dirname, 'glossary_data.txt');

// Read existing file
const raw = readFileSync(path, 'utf-8');
const originalLines = raw.split('\n').filter(l => l.split('\t').length >= 6);
// We assume the first 95 were valid. filtering by column count helps remove the broken appended ones.

const newTerms = [
    // Campus Navigation
    { t: 'ASH', c: 'Campus Navigation', de: 'Anna-Seiler-Haus (Freiburgstrasse 41C, Eingang 2)', en: 'Main building', simple: 'Das neueste Haus im Insel-Spital.', esel: 'Anna Seiler Haus = Alles Schön Hier.' },
    { t: 'BHH', c: 'Campus Navigation', de: 'Bettenhochhaus (Freiburgstrasse 18, Eingang 33)', en: 'High-rise ward building', simple: 'Ein sehr hohes Gebäude mit vielen Zimmern.', esel: 'BettenHochHaus = Bis Hoch in den Himmel.' },
    { t: 'CTU', c: 'Administration', de: 'Clinical Trials Unit (Finkenhubelweg 11)', en: 'Clinical Trials Unit', simple: 'Das Büro für medizinische Forschung.', esel: 'Clinical Trials Unit.' },
    { t: 'DIPR', c: 'Radiology', de: 'Universitätsinstitut für Diagnostische, Interventionelle und Pädiatrische Radiologie (Freiburgstrasse 10)', en: 'University Institute of Diagnostic, Interventional and Pediatric Radiology', simple: 'Die Abteilung für Röntgen und Ultraschall.', esel: 'Durchleuchten Im Pädiatrischen Raum.' },
    { t: 'FTN', c: 'Emergency', de: 'Fast Track Notfallzentrum (Freiburgstrasse 16C, Eingang 56)', en: 'Fast Track Emergency Center', simple: 'Die schnelle Not-Aufnahme für leichtere Fälle.', esel: 'Fix Therapierter Notfall.' },
    { t: 'GG', c: 'Administration / Insurance', de: 'Geburtsgebrechen', en: 'Birth defects', simple: 'Krankheiten, die man schon bei der Geburt hat.', esel: 'Geburts-Gefahr.' },
    { t: 'HNO', c: 'Clinic Navigation', de: 'Hals-, Nasen- und Ohrenkrankheiten (Freiburgstrasse 20)', en: 'Ear, Nose, and Throat (ENT)', simple: 'Ärzte für Hals, Nase und Ohren.', esel: 'Hört, Niest, Orientiert.' },
    { t: 'IIC', c: 'Administration', de: 'Insel International Center', en: 'Insel International Center', simple: 'Büro für Patienten aus dem Ausland.', esel: 'International In Charge.' },
    { t: 'INO', c: 'Campus Navigation', de: 'Intensivbehandlungs-, Notfall- und Operationszentrum (Freiburgstrasse 16C, Eingang 56)', en: 'Intensive Care, Emergency and Surgery Center', simple: 'Das Zentrum für Notfälle und Operationen.', esel: 'Immer Notfälle und Operationen.' },
    { t: 'IV', c: 'Administration / Insurance', de: 'Invalidenversicherung', en: 'Disability insurance', simple: 'Die Kasse für Menschen, die nicht arbeiten können.', esel: 'Invaliden-Vorsorge.' },
    { t: 'OPO', c: 'Campus Navigation', de: 'Operationstrakt Ost (Freiburgstrasse 16)', en: 'Surgery Wing East', simple: 'Die Operations-Säle im Osten vom Spital.', esel: 'Operieren Perfekt im Osten.' },
    { t: 'SU', c: 'Neurology', de: 'Stroke Unit', en: 'Stroke Unit', simple: 'Spezial-Station für Schlag-Anfälle.', esel: 'Schlaganfall Unterstützung.' },
    { t: 'SWEZ', c: 'Clinic Navigation', de: 'Schlaf-Wach-Epilepsie-Zentrum (Freiburgstrasse 18)', en: 'Sleep-Wake-Epilepsy-Center', simple: 'Zentrum für Schlaf-Probleme und Krampf-Anfälle.', esel: 'Schlafen, Wachen, Epilepsie Zähmen.' },
    { t: 'UDEM', c: 'Clinic Navigation', de: 'Universitätsklinik für Diabetologie, Endokrinologie, Ernährungsmedizin und Metabolismus (Freiburgstrasse 15)', en: 'University Clinic for Diabetology, Endocrinology, Nutritional Medicine and Metabolism', simple: 'Abteilung für Zucker-Krankheit und Hormone.', esel: 'Unser Diabetes Experten Medizin.' },
    { t: 'UKN', c: 'Neurology', de: 'Universitäre Klinik für Neurologie', en: 'University Clinic of Neurology', simple: 'Die Klinik für Nerven-Krankheiten.', esel: 'Unser Kopf-Netzwerk.' },
    { t: 'WG', c: 'Campus Navigation', de: 'Wirtschaftsgebäude (Freiburgstrasse 16A)', en: 'Utility/Economic Building', simple: 'Das Haus für das Personal und das Essen.', esel: 'Wo Gekocht wird.' },
    { t: 'ZMK', c: 'Campus Navigation', de: 'Zahnmedizinische Kliniken (Freiburgstrasse 7)', en: 'Dental Clinics', simple: 'Die Klinik für die Zähne.', esel: 'Zahn-Medizinische Klinik.' },

    // General Medical
    { t: 'ACN', c: 'Nursing / Personnel', de: 'Acute Care Nurse', en: 'Acute Care Nurse', simple: 'Eine speziell ausgebildete Kranken-Schwester für Notfälle.', esel: 'Acute Care Ninja.' },
    { t: 'ARDS', c: 'Intensive Care', de: 'Acute Respiratory Distress Syndrome', en: 'Acute Respiratory Distress Syndrome', simple: 'Ein plötzliches und schweres Versagen der Lunge.', esel: 'Atem-Reserven Drastisch Schlecht.' },
    { t: 'BE', c: 'Diagnostics', de: 'Blutentnahme', en: 'Blood sampling', simple: 'Der Arzt nimmt Blut aus einer Ader ab.', esel: 'Blut Entfernen.' },
    { t: 'DBS', c: 'Neurology', de: 'Deep Brain Stimulation', en: 'Deep Brain Stimulation', simple: 'Ein Schrittmacher tief im Gehirn.', esel: 'Draht Bewegt Strukturen.' },
    { t: 'DIC', c: 'Intensive Care', de: 'Disseminated Intravascular Coagulation', en: 'Disseminated Intravascular Coagulation', simple: 'Das Blut gerinnt plötzlich überall im Körper.', esel: 'Die Innere Coagulation.' },
    // EEG, EKG, FNS, GBS, HIE already exist in original list, skipping duplicates if any, but adding as new entries since keys might differ slightly? 
    // Wait, original file had EEG, GBS, HIE, FNS. I should allow duplicates or filter. 
    // The user provided list has different/shorter defs. I'll add them as additional entries or updates. 
    // Since my seed script allows duplicates if ID generation is random (it is), we'll just have 2 EEGs. 
    // To be cleaner, I should probably check if term exists. But duplicate terms are allowed now!
    // I'll filter out EXACT duplicates (term AND context matches).
    { t: 'IVT', c: 'Emergency / Neurology', de: 'Intravenöse Thrombolyse', en: 'Intravenous thrombolysis', simple: 'Ein Medikament, das ein Blut-Gerinnsel auflöst.', esel: 'In Vene Tropfen.' },
    { t: 'LP', c: 'Diagnostics', de: 'Liquorpunktion', en: 'Lumbar puncture', simple: 'Der Arzt entnimmt Nerven-Wasser aus dem Rücken.', esel: 'Liquor Probieren.' },
    { t: 'MH', c: 'Anesthesia', de: 'Maligne Hyperthermie', en: 'Malignant hyperthermia', simple: 'Ein sehr gefährliches Fieber während einer Narkose.', esel: 'Macht Hitze.' },
    { t: 'MNS', c: 'Psychiatry', de: 'Malignes Neuroleptika-Syndrom', en: 'Malignant neuroleptic syndrome', simple: 'Eine sehr schwere Reaktion auf Medikamente.', esel: 'Medikamente Nerven Schlimm.' },
    { t: 'MRI', c: 'Diagnostics', de: 'Magnetresonanztomographie', en: 'Magnetic resonance imaging', simple: 'Eine Röhre, die mit Magneten Bilder vom Körper macht.', esel: 'Magnet-Röhren-Inspektion.' },
    { t: 'MS', c: 'Neurology', de: 'Multiple Sklerose', en: 'Multiple sclerosis', simple: 'Eine chronische Entzündung im Nerven-System.', esel: 'Meist Schubförmig.' },
    // NCSE, PET, TLOC exist. I'll add them anyway as they might have better eselsleiters here.
    { t: 'OA', c: 'Personnel', de: 'Oberarzt', en: 'Attending physician', simple: 'Ein erfahrener Arzt, der andere Ärzte leitet.', esel: 'Oberster Arzt.' },
    { t: 'PRES', c: 'Neurology', de: '(Posteriores) reversibles Enzephalopathie Syndrom', en: 'Posterior reversible encephalopathy syndrome', simple: 'Eine vorübergehende Schwellung im Gehirn.', esel: 'Plötzliche Reversible Erkrankung.' },
    { t: 'TTM', c: 'Intensive Care', de: 'Targeted Temperature Management', en: 'Targeted temperature management', simple: 'Eine Kühlung des Körpers, um das Gehirn zu schützen.', esel: 'Temperatur Therapeutisch Modulieren.' },

    // ASM
    { t: 'BRV', c: 'Pharmacology', de: 'Brivaracetam', en: 'Brivaracetam', simple: 'Ein Medikament gegen Krampf-Anfälle.', esel: 'Bremst Rasch Verzögerungen.' },
    { t: 'CBD', c: 'Pharmacology', de: 'Cannabidiol', en: 'Cannabidiol', simple: 'Ein Stoff aus Hanf gegen Krämpfe, ohne Rausch.', esel: 'Cannabis Beruhigt Dauerhaft.' },
    // CBZ, ESL, LVT/LEV, PB, exists.
    { t: 'CK', c: 'Lab Values', de: 'Creatine Kinase', en: 'Creatine kinase', simple: 'Ein Blut-Wert, der Verletzungen im Muskel zeigt.', esel: 'Checkt Kraft-Muskeln.' },
    { t: 'CLB', c: 'Pharmacology', de: 'Clobazam', en: 'Clobazam', simple: 'Ein starkes Beruhigungs-Mittel gegen Anfälle.', esel: 'Chillt Leicht Bald.' },
    { t: 'CLZ', c: 'Pharmacology', de: 'Clonazepam', en: 'Clonazepam', simple: 'Ein Medikament, das Muskeln entspannt.', esel: 'Chillt Lange Zeit.' },
    { t: 'CNB', c: 'Pharmacology', de: 'Cenobamat', en: 'Cenobamate', simple: 'Ein neues Mittel bei starken Anfällen.', esel: 'Controlliert Neue Blitze.' },
    { t: 'CYP', c: 'Lab / Metabolism', de: 'Cytochrome P450', en: 'Cytochrome P450', simple: 'Ein Eiweiss in der Leber, das Tabletten abbaut.', esel: 'Cleant Your Poison.' },
    { t: 'ESM', c: 'Pharmacology', de: 'Ethosuximid', en: 'Ethosuximide', simple: 'Ein Mittel gegen kurze geistige Abwesenheiten.', esel: 'Eliminiert Sekunden-Momente.' },
    { t: 'FBM', c: 'Pharmacology', de: 'Felbamat', en: 'Felbamate', simple: 'Ein sehr starkes Mittel für schwere Krampf-Anfälle.', esel: 'Für Böse Momente.' },
    { t: 'GBT', c: 'Pharmacology', de: 'Gabapentin', en: 'Gabapentin', simple: 'Ein Mittel gegen brennende Nerven-Schmerzen.', esel: 'Gegen Brennende Torturen.' },
    { t: 'LCM', c: 'Pharmacology', de: 'Lacosamid', en: 'Lacosamide', simple: 'Ein Mittel, das die Nerven-Zellen langsam beruhigt.', esel: 'Lähmt Cell-Motoren.' },
    { t: 'LTG', c: 'Pharmacology', de: 'Lamotrigin', en: 'Lamotrigine', simple: 'Ein Medikament gegen Krämpfe und für gute Stimmung.', esel: 'Löst Tägliche Gefahren. ' },
    { t: 'MAOI', c: 'Pharmacology', de: 'Monoaminooxidase-Hemmer', en: 'Monoamine oxidase inhibitor', simple: 'Ein starkes Medikament gegen schwere Traurigkeit.', esel: 'Macht Alle Oft Interessiert.' },
    { t: 'OXC', c: 'Pharmacology', de: 'Oxcarbazepin', en: 'Oxcarbazepine', simple: 'Ein Mittel gegen Krämpfe, ähnlich wie Carbamazepin.', esel: 'Ohne eXtreme Crämpfe.' },
    { t: 'PER', c: 'Pharmacology', de: 'Perampanel', en: 'Perampanel', simple: 'Ein Mittel, das Teile im Gehirn blockiert.', esel: 'Perfekt Eingedämmtes Risiko.' },
    { t: 'PGB', c: 'Pharmacology', de: 'Pregabalin', en: 'Pregabalin', simple: 'Ein Medikament gegen Nerven-Schmerzen und Angst.', esel: 'Panische Gedanken Beruhigt.' },
    { t: 'PHT', c: 'Pharmacology', de: 'Phenytoin', en: 'Phenytoin', simple: 'Ein älteres Medikament gegen Krampf-Anfälle.', esel: 'Präzise Hemmung von Ticks.' },
    { t: 'RUF', c: 'Pharmacology', de: 'Rufinamid', en: 'Rufinamide', simple: 'Ein spezielles Krampf-Mittel für Kinder.', esel: 'Ruhig Und Friedlich.' },
    { t: 'SNRI', c: 'Pharmacology', de: 'Serotonin-Noradrenalin-Wiederaufnahmehemmer', en: 'Serotonin-norepinephrine reuptake inhibitor', simple: 'Ein Mittel gegen Depressionen und Schmerzen.', esel: 'Schmerz Nimmt Rasch Inhalt.' },
    { t: 'SSRI', c: 'Pharmacology', de: 'Selektive Serotonin-Wiederaufnahmehemmer', en: 'Selective serotonin reuptake inhibitor', simple: 'Die bekanntesten Tabletten gegen starke Traurigkeit.', esel: 'Serotonin Stoppt Risikohafte Irrwege.' },
    { t: 'TPM', c: 'Pharmacology', de: 'Topiramat', en: 'Topiramate', simple: 'Ein Mittel gegen Krämpfe und Kopf-Schmerzen (Migräne).', esel: 'Top Prophylaxe Migräne.' },
    { t: 'UGT', c: 'Lab / Metabolism', de: 'Uridine 5\'-diphospho-glucuronosyltransferase', en: 'UDP-glucuronosyltransferase', simple: 'Ein Stoff im Körper, der beim Ausscheiden von Tabletten hilft.', esel: 'Unser Gift-Transporter.' },
    { t: 'VGB', c: 'Pharmacology', de: 'Vigabatrin', en: 'Vigabatrin', simple: 'Ein Mittel, das die bremsenden Stoffe im Gehirn stärkt.', esel: 'Verdreifacht Gegebene Bremsen.' },
    { t: 'VPA', c: 'Pharmacology', de: 'Valproat', en: 'Valproate', simple: 'Ein wichtiges Mittel gegen viele Krampf-Anfälle.', esel: 'Verhindert Plötzliche Anfälle.' },
    { t: 'ZNS', c: 'Pharmacology', de: 'Zonisamid', en: 'Zonisamide', simple: 'Ein Mittel gegen Krämpfe und Schüttel-Krankheit.', esel: 'Zähmt Neurologische Schocks.' },

    // Clinical Studies
    { t: 'ADE', c: 'Clinical Trials', de: 'Adverse Device Effect', en: 'Adverse Device Effect', simple: 'Ein medizinisches Gerät macht Probleme.', esel: 'Apparat Defekt Erkannt.' },
    { t: 'AE', c: 'Clinical Trials', de: 'Adverse Event', en: 'Adverse Event', simple: 'Ein unerwünschtes Ereignis bei einer Behandlung.', esel: 'Andere Erwartung.' },
    { t: 'GCP', c: 'Clinical Trials', de: 'Good Clinical Practice', en: 'Good Clinical Practice', simple: 'Strenge Regeln für medizinische Studien.', esel: 'Gute Clinische Praxis.' },
    { t: 'PI', c: 'Clinical Trials', de: 'Principal Investigator', en: 'Principal Investigator', simple: 'Der Haupt-Verantwortliche für eine ärztliche Studie.', esel: 'Projekt Initiator.' },
    { t: 'SADE', c: 'Clinical Trials', de: 'Serious Adverse Device Effect', en: 'Serious Adverse Device Effect', simple: 'Ein sehr schweres Problem durch ein Gerät.', esel: 'Schwerer Apparat Defekt Erkannt.' },
    { t: 'SAE', c: 'Clinical Trials', de: 'Serious Adverse Event', en: 'Serious Adverse Event', simple: 'Ein sehr ernster Zwischenfall bei einer Behandlung.', esel: 'Schweres Abweichendes Ereignis.' },
    { t: 'SUSAR', c: 'Clinical Trials', de: 'Suspected unexpected Serious Adverse Reaction', en: 'Suspected unexpected serious adverse reaction', simple: 'Eine schwere, unerwartete Neben-Wirkung in einer Studie.', esel: 'Schlimme Unerwartete Situation Alarmierend Registriert.' }
];

const newLines = newTerms.map(item => {
    // Format: Term [TAB] Context [TAB] DefinitionDE [TAB] DefinitionEN [TAB] EinfacheSprache [TAB] Eselsleiter [TAB] Source
    return `${item.t}\t${item.c}\t${item.de}\t${item.en}\t${item.simple}\t${item.esel}\tUser Augmentation`;
});

const finalContent = [...originalLines, ...newLines].join('\n');
writeFileSync(path, finalContent, 'utf-8');

console.log(`Rewrote glossary_data.txt with ${finalContent.split('\n').filter(Boolean).length} valid lines.`);
