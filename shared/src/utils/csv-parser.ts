/**
 * Parses a CSV line respecting quoted fields with special handling for inch marks
 * @param line The CSV line to parse
 * @returns Array of cell values
 */
export function parseCSVLine(line: string): string[] {
	const result: string[] = [];
	let currentField = "";
	let inQuotedField = false;
	let i = 0;

	while (i < line.length) {
		const char = line[i];

		if (char === '"' && !inQuotedField && currentField.trim() === "") {
			inQuotedField = true;
			i++;
			continue;
		}

		if (char === '"' && inQuotedField) {
			if (i === line.length - 1) {
				inQuotedField = false;
				i++;
				continue;
			} else if (line[i + 1] === ",") {
				inQuotedField = false;
				i++;
				continue;
			} else if (line[i + 1] === '"') {
				i += 2;
				continue;
			} else {
				currentField += '"';
				i++;
				continue;
			}
		}

		if (char === "," && !inQuotedField) {
			result.push(currentField.trim());
			currentField = "";
			i++;
			continue;
		}

		currentField += char;
		i++;
	}

	result.push(currentField.trim());

	return result;
}
