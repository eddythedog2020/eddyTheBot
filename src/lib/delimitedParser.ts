/**
 * Detects and converts delimited data (pipe, comma, tab, semicolon) 
 * embedded in text into markdown table format for ReactMarkdown rendering.
 */

type Delimiter = '|' | ',' | '\t' | ';';

interface DetectedTable {
    startIndex: number;
    endIndex: number;
    rows: string[][];
    delimiter: Delimiter;
    headers: string[];
}

/**
 * Detect the most likely delimiter for a set of lines.
 * Returns the delimiter and a consistency score.
 */
function detectDelimiter(lines: string[]): { delimiter: Delimiter; score: number } | null {
    const delimiters: Delimiter[] = ['|', ',', '\t', ';'];
    let best: { delimiter: Delimiter; score: number } | null = null;

    for (const delim of delimiters) {
        const counts = lines.map(line => {
            // For pipe, handle both `| col | col |` and `col|col|col`
            if (delim === '|') {
                const trimmed = line.trim();
                if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
                    return trimmed.split('|').filter(Boolean).length;
                }
            }
            return line.split(delim).length;
        });

        // All lines must have at least 2 columns
        if (counts.some(c => c < 2)) continue;

        // Check consistency — all lines should have the same number of columns
        const firstCount = counts[0];
        const consistent = counts.every(c => c === firstCount);
        if (!consistent) continue;

        // Score = columns × lines (prefer more structured data)
        const score = firstCount * lines.length;
        if (!best || score > best.score) {
            best = { delimiter: delim, score };
        }
    }

    return best;
}

/**
 * Check if a line looks like a markdown table separator (|---|---|)
 */
function isMdSeparator(line: string): boolean {
    return /^\|[\s\-:|]+\|$/.test(line.trim());
}

/**
 * Split a line by the detected delimiter, handling pipe-style tables.
 */
function splitLine(line: string, delimiter: Delimiter): string[] {
    const trimmed = line.trim();
    if (delimiter === '|') {
        // Handle `| col | col |` format
        if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
            return trimmed.slice(1, -1).split('|').map(c => c.trim());
        }
        // Handle `col|col|col` format
        return trimmed.split('|').map(c => c.trim());
    }

    // For CSV, handle basic quoted fields
    if (delimiter === ',') {
        const cells: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < trimmed.length; i++) {
            const ch = trimmed[i];
            if (ch === '"') {
                inQuotes = !inQuotes;
            } else if (ch === ',' && !inQuotes) {
                cells.push(current.trim());
                current = '';
            } else {
                current += ch;
            }
        }
        cells.push(current.trim());
        return cells;
    }

    return trimmed.split(delimiter).map(c => c.trim());
}

/**
 * Parse delimited data from raw text and return structured table data.
 */
export function parseDelimitedData(text: string): { rows: string[][]; delimiter: Delimiter } | null {
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    if (lines.length < 2) return null;

    // Skip markdown separator lines for detection
    const dataLines = lines.filter(l => !isMdSeparator(l));
    if (dataLines.length < 2) return null;

    const result = detectDelimiter(dataLines);
    if (!result) return null;

    const rows = dataLines.map(line => splitLine(line, result.delimiter));
    return { rows, delimiter: result.delimiter };
}

/**
 * Normalize inline pipe tables that are squished into a single line.
 * E.g.: "| Header1 | Header2 | | --- | --- | | val1 | val2 |"
 * becomes separate lines for each row.
 *
 * Strategy: Find the `| --- | --- |` separator pattern to determine
 * column count, then split ALL cells and group into rows.
 */
function normalizePipeTables(text: string): string {
    const lines = text.split('\n');
    const result: string[] = [];

    for (const line of lines) {
        const trimmed = line.trim();

        // Only process lines that start with | and contain a separator pattern (---)
        if (!trimmed.startsWith('|') || !trimmed.includes('---')) {
            result.push(line);
            continue;
        }

        // Find the separator pattern to detect column count
        // Match sequences like: | --- | --- | --- |
        const sepMatch = trimmed.match(/\|\s*[-:]+\s*(?:\|\s*[-:]+\s*)+\|/);
        if (!sepMatch) {
            result.push(line);
            continue;
        }

        // Count columns from the separator
        const sepCells = sepMatch[0].split('|').filter(c => c.trim().length > 0);
        const colCount = sepCells.length;

        if (colCount < 2) {
            result.push(line);
            continue;
        }

        // Split the ENTIRE line by | and filter out empty cells (from row boundaries)
        let inner = trimmed;
        if (inner.startsWith('|')) inner = inner.slice(1);
        if (inner.endsWith('|')) inner = inner.slice(0, -1);

        const allCells = inner.split('|').map(c => c.trim()).filter(c => c.length > 0);

        // Group cells into rows of colCount
        const rows: string[] = [];
        let lastWasSeparator = false;
        for (let i = 0; i <= allCells.length - colCount; i += colCount) {
            const rowCells = allCells.slice(i, i + colCount);
            if (rowCells.length === colCount) {
                const rowStr = '| ' + rowCells.join(' | ') + ' |';
                // Deduplicate consecutive separator rows
                const isSep = isMdSeparator(rowStr);
                if (isSep && lastWasSeparator) continue;
                lastWasSeparator = isSep;
                rows.push(rowStr);
            }
        }

        if (rows.length >= 3) { // header + separator + at least 1 data row
            result.push(...rows);
            continue;
        }

        result.push(line);
    }

    return result.join('\n');
}

/**
 * Convert delimited text blocks within a message into markdown table format.
 * This preprocesses the text before passing to ReactMarkdown.
 */
export function convertDelimitedToMarkdown(text: string): string {
    // === FIRST PASS: Normalize inline pipe tables ===
    // LLMs often output entire tables on one line like:
    // "| Header1 | Header2 | | --- | --- | | val1 | val2 | | val3 | val4 |"
    // We need to split these into separate lines.
    text = normalizePipeTables(text);

    const lines = text.split('\n');
    const result: string[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i].trim();

        // Check if this line could be delimited data
        // It should have at least one delimiter and not be a normal sentence
        if (isLikelyDelimitedLine(line)) {
            // Collect consecutive delimited lines
            const block: string[] = [];
            let j = i;
            while (j < lines.length) {
                const candidate = lines[j].trim();
                if (candidate.length === 0) break;
                if (isMdSeparator(candidate)) { j++; continue; } // skip existing separators
                if (!isLikelyDelimitedLine(candidate) && block.length > 0) break;
                if (isLikelyDelimitedLine(candidate)) {
                    block.push(candidate);
                }
                j++;
            }

            if (block.length >= 2) {
                // Detect the delimiter for this block
                const detected = detectDelimiter(block);
                if (detected) {
                    const rows = block.map(l => splitLine(l, detected.delimiter));
                    // Check all rows have same column count
                    const colCount = rows[0].length;
                    if (rows.every(r => r.length === colCount) && colCount >= 2) {
                        // Convert to markdown table
                        result.push('| ' + rows[0].join(' | ') + ' |');
                        result.push('| ' + rows[0].map(() => '---').join(' | ') + ' |');
                        for (let k = 1; k < rows.length; k++) {
                            result.push('| ' + rows[k].join(' | ') + ' |');
                        }
                        i = j;
                        continue;
                    }
                }
            }
        }

        // Also handle standard markdown pipe tables missing separator
        if (line.startsWith('|') && line.endsWith('|') && line.split('|').filter(Boolean).length >= 2) {
            const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
            result.push(lines[i]);
            if (!isMdSeparator(nextLine) && nextLine.startsWith('|') && nextLine.endsWith('|')) {
                const prevLine = result.length >= 2 ? result[result.length - 2]?.trim() : '';
                if (!isMdSeparator(prevLine)) {
                    const colCount = line.split('|').filter(Boolean).length;
                    result.push('| ' + Array(colCount).fill('---').join(' | ') + ' |');
                }
            }
            i++;
            continue;
        }

        result.push(lines[i]);
        i++;
    }

    return result.join('\n');
}

/**
 * Check if a line looks like delimited data rather than natural language.
 */
function isLikelyDelimitedLine(line: string): boolean {
    if (line.length === 0) return false;

    // Pipe-delimited: `col|col|col` or `| col | col |`
    if (line.includes('|') && line.split('|').filter(Boolean).length >= 2) {
        // Make sure it's not just a single pipe in prose
        const pipeCount = (line.match(/\|/g) || []).length;
        if (pipeCount >= 2) return true;
        // Single pipe but formatted like a table row
        if (line.trim().startsWith('|') || line.trim().endsWith('|')) return true;
    }

    // Tab-delimited
    if (line.includes('\t') && line.split('\t').length >= 2) return true;

    // Comma/semicolon — these are trickier since commas appear in prose
    // Require a consistent structure: short fields, no long sentences
    for (const delim of [',', ';'] as Delimiter[]) {
        const parts = line.split(delim);
        if (parts.length >= 3) {
            // Each field should be relatively short (not a sentence)
            const avgFieldLen = parts.reduce((sum, p) => sum + p.trim().length, 0) / parts.length;
            const maxFieldLen = Math.max(...parts.map(p => p.trim().length));
            // Short fields + multiple columns = likely data
            if (avgFieldLen < 30 && maxFieldLen < 60) return true;
        }
    }

    return false;
}
