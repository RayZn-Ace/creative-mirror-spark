import { describe, it, expect } from 'vitest';
import { parseFilename } from '../pages/admin/CsvImportAdmin';

describe('parseFilename', () => {
  it('parses ISO date and city from filename', () => {
    const result = parseFilename('Penthouse-Mainz-2025-03-28.csv');
    expect(result.title).toBe('Penthouse');
    expect(result.date).toBe('2025-03-28');
    expect(result.city).toBe('Mainz');
  });

  it('parses EU date format (DD.MM.YYYY)', () => {
    const result = parseFilename('XXL-Schuelerparty-Berlin-28.03.2025.csv');
    expect(result.date).toBe('2025-03-28');
    expect(result.city).toBe('Berlin');
    expect(result.title).toBe('XXL Schuelerparty');
  });

  it('handles filename without date', () => {
    const result = parseFilename('Penthouse-Mainz.csv');
    expect(result.title).toBe('Penthouse');
    expect(result.date).toBe('');
    expect(result.city).toBe('Mainz');
  });

  it('handles filename without city', () => {
    const result = parseFilename('Penthouse-2025-03-28.csv');
    expect(result.title).toBe('Penthouse');
    expect(result.date).toBe('2025-03-28');
    expect(result.city).toBe('');
  });

  it('handles underscores as separators', () => {
    const result = parseFilename('Gimme_Gimme_Hamburg_2025-06-15.csv');
    expect(result.title).toBe('Gimme Gimme');
    expect(result.city).toBe('Hamburg');
    expect(result.date).toBe('2025-06-15');
  });
});
