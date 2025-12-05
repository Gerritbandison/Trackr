import { Parser } from 'json2csv';

export interface CsvExportOptions {
    fields?: string[];
    fieldNames?: Record<string, string>;
}

/**
 * Converts array of objects to CSV string
 */
export function convertToCSV(data: any[], options?: CsvExportOptions): string {
    try {
        if (!data || data.length === 0) {
            return '';
        }

        const parser = new Parser({
            fields: options?.fields,
            ...(options?.fieldNames && { transforms: [flattenObject] })
        });

        return parser.parse(data);
    } catch (error) {
        throw new Error(`Failed to convert to CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Flattens nested objects for CSV export
 */
function flattenObject(item: any): any {
    const flattened: any = {};

    function flatten(obj: any, prefix = ''): void {
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const value = obj[key];
                const newKey = prefix ? `${prefix}.${key}` : key;

                if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
                    flatten(value, newKey);
                } else if (Array.isArray(value)) {
                    flattened[newKey] = value.join('; ');
                } else if (value instanceof Date) {
                    flattened[newKey] = value.toISOString();
                } else {
                    flattened[newKey] = value;
                }
            }
        }
    }

    flatten(item);
    return flattened;
}

/**
 * Parses CSV string to array of objects
 */
export function parseCSV(csvString: string): any[] {
    const lines = csvString.trim().split('\n').filter(line => line.trim());
    if (lines.length < 2) {
        throw new Error('CSV must contain at least a header row and one data row');
    }

    const headers = parseCSVLine(lines[0]!);
    const data: any[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]!);
        if (values.length !== headers.length) {
            throw new Error(`Row ${i + 1} has ${values.length} columns, expected ${headers.length}`);
        }

        const row: any = {};
        headers.forEach((header, index) => {
            const value = values[index];
            row[header.trim()] = value ? value.trim() : '';
        });
        data.push(row);
    }

    return data;
}

/**
 * Parses a single CSV line handling quoted fields
 */
function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                // Escaped quote
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current);
    return result;
}

/**
 * Validates required fields in imported data
 */
export function validateImportData(
    data: any[],
    requiredFields: string[]
): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data || data.length === 0) {
        errors.push('No data to import');
        return { valid: false, errors };
    }

    // Check if all required fields are present in headers
    const headers = Object.keys(data[0]);
    const missingFields = requiredFields.filter(field => !headers.includes(field));

    if (missingFields.length > 0) {
        errors.push(`Missing required columns: ${missingFields.join(', ')}`);
    }

    // Validate each row
    data.forEach((row, index) => {
        requiredFields.forEach(field => {
            if (!row[field] || row[field].trim() === '') {
                errors.push(`Row ${index + 2}: Missing required field '${field}'`);
            }
        });
    });

    return {
        valid: errors.length === 0,
        errors
    };
}
