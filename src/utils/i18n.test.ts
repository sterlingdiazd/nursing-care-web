import { describe, it, expect } from 'vitest';
import i18n from '../i18n';

describe('i18n Configuration', () => {
  it('should have spanish as the default language', () => {
    expect(i18n.language).toBe('es');
  });

  it('should translate known keys to spanish', () => {
    // Tests that i18n initialization loaded the translations
    expect(i18n.t('roles.ADMIN')).toBe('Administración');
    expect(i18n.t('roles.NURSE')).toBe('Enfermería');
    expect(i18n.t('roles.UNKNOWN')).toBe('Rol no reconocido');
  });
});
