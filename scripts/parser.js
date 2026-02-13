
const fs = require('fs');
const path = require('path');

const rawData = fs.readFileSync(path.resolve(__dirname, 'glossary_data.txt'), 'utf8');

const lines = rawData.trim().split(/\r?\n/);
const terms = lines.map(line => {
    const parts = line.split('\t');
    if (parts.length < 7) {
        // Fallback for copy-paste messing up tabs - try splitting by multiple spaces if tabs fail, 
        // but simple split matches likely won't work due to spaces in content.
        // Assuming tab separation is preserved.
        return null;
    }
    return {
        term: parts[0].trim(),
        context: parts[1].trim(),
        definitionDe: parts[2].trim(),
        definitionEn: parts[3].trim(),
        einfacheSprache: parts[4].trim(),
        eselsleitern: [parts[5].trim()], // Converted to array as per type
        source: parts[6].trim(),
        status: 'approved',
        createdBy: 'system',
        createdByName: 'System Import',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}).filter(t => t !== null);

const outputPath = path.resolve(__dirname, 'glossary.json');
fs.writeFileSync(outputPath, JSON.stringify(terms, null, 2));

console.log(`Parsed ${terms.length} terms to ${outputPath}`);
