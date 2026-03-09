import { describe, it, expect } from 'vitest';
import { parseFilename } from '../pages/admin/CsvImportAdmin';

describe('parseFilename', () => {
  it('parses ISO date and city from filename', () => {
    const result = parseFilename('Penthouse-Mainz-2025-03-28.csv');
    expect(result.title).toBe('');
    expect(result.date).toBe('2025-03-28');
    expect(result.city).toBe('Mainz');
    expect(result.location).toBe("Finn's Penthouse Eventlocation");
  });

  it('parses EU date format (DD.MM.YYYY)', () => {
    const result = parseFilename('XXL-Schuelerparty-Berlin-28.03.2025.csv');
    expect(result.date).toBe('2025-03-28');
    expect(result.city).toBe('Berlin');
    expect(result.title).toBe('XXL Schuelerparty');
    expect(result.location).toBe('');
  });

  it('handles filename without date', () => {
    const result = parseFilename('Penthouse-Mainz.csv');
    expect(result.title).toBe('');
    expect(result.date).toBe('');
    expect(result.city).toBe('Mainz');
    expect(result.location).toBe("Finn's Penthouse Eventlocation");
  });

  it('handles filename without city', () => {
    const result = parseFilename('GimmeGimme-2025-03-28.csv');
    expect(result.title).toBe('GimmeGimme');
    expect(result.date).toBe('2025-03-28');
    expect(result.city).toBe('');
    expect(result.location).toBe('');
  });

  it('handles underscores as separators', () => {
    const result = parseFilename('Gimme_Gimme_Hamburg_2025-06-15.csv');
    expect(result.title).toBe('Gimme Gimme');
    expect(result.city).toBe('Hamburg');
    expect(result.date).toBe('2025-06-15');
  });

  it('detects location from filename', () => {
    const result = parseFilename('GimmeGimme-Stadtpark-Mainz-2025-04-10.csv');
    expect(result.title).toBe('GimmeGimme');
    expect(result.city).toBe('Mainz');
    expect(result.location).toBe('Stadtpark');
    expect(result.date).toBe('2025-04-10');
  });

  it('detects Finns as Penthouse location', () => {
    const result = parseFilename('Party-Finns-Berlin-2025-05-01.csv');
    expect(result.title).toBe('Party');
    expect(result.location).toBe("Finn's Penthouse Eventlocation");
    expect(result.city).toBe('Berlin');
  });
});
