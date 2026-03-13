/**
 * Tests for ActivityTitles helper functions.
 * Ensures all activity title generators produce correct Spanish strings.
 */

import { ActivityTitles } from '@/lib/activity-titles';

describe('ActivityTitles', () => {
  // ── Projects ──
  it('projectCreated', () => {
    expect(ActivityTitles.projectCreated('Mi Proyecto')).toBe('Creaste el proyecto "Mi Proyecto"');
  });

  it('projectUpdated', () => {
    expect(ActivityTitles.projectUpdated('Campaña Nike')).toBe('Editaste el proyecto "Campaña Nike"');
  });

  it('projectDeleted', () => {
    expect(ActivityTitles.projectDeleted('Test')).toBe('Eliminaste el proyecto "Test"');
  });

  it('projectStatusChanged', () => {
    expect(ActivityTitles.projectStatusChanged('Proyecto X', 'sent')).toBe(
      'Cambiaste estado de "Proyecto X" a sent'
    );
  });

  it('projectShared', () => {
    expect(ActivityTitles.projectShared('Rev 2')).toBe('Compartiste el proyecto "Rev 2"');
  });

  // ── Models ──
  it('modelCreated', () => {
    expect(ActivityTitles.modelCreated('Ana López')).toBe('Añadiste talento: Ana López');
  });

  it('modelUpdated', () => {
    expect(ActivityTitles.modelUpdated('Carlos')).toBe('Editaste perfil de Carlos');
  });

  it('modelAddedToProject', () => {
    expect(ActivityTitles.modelAddedToProject('María', 'Fashion Week')).toBe(
      'Añadiste a María en "Fashion Week"'
    );
  });

  it('modelRemovedFromProject', () => {
    expect(ActivityTitles.modelRemovedFromProject('Juan', 'SS26')).toBe(
      'Removiste a Juan de "SS26"'
    );
  });

  // ── Client selections ──
  it('clientApprovedModel', () => {
    expect(ActivityTitles.clientApprovedModel('Ana', 'Proyecto Z')).toBe(
      'Cliente aprobó a Ana en "Proyecto Z"'
    );
  });

  it('clientRejectedModel', () => {
    expect(ActivityTitles.clientRejectedModel('Pedro', 'Campaña')).toBe(
      'Cliente rechazó a Pedro en "Campaña"'
    );
  });

  it('clientReopenedProject', () => {
    expect(ActivityTitles.clientReopenedProject('SS26')).toBe('Cliente reabrió el proyecto "SS26"');
  });

  // ── Clients & brands ──
  it('clientCreated', () => {
    expect(ActivityTitles.clientCreated('Nike')).toBe('Creaste cliente: Nike');
  });

  it('clientUpdated', () => {
    expect(ActivityTitles.clientUpdated('Adidas')).toBe('Editaste cliente: Adidas');
  });

  it('brandCreated', () => {
    expect(ActivityTitles.brandCreated('Jordan')).toBe('Creaste marca: Jordan');
  });

  // ── Edge cases ──
  it('handles empty strings without crashing', () => {
    expect(ActivityTitles.projectCreated('')).toBe('Creaste el proyecto ""');
    expect(ActivityTitles.modelCreated('')).toBe('Añadiste talento: ');
  });

  it('handles special characters', () => {
    expect(ActivityTitles.projectCreated('Zara "Spring"')).toContain('Zara "Spring"');
  });
});
