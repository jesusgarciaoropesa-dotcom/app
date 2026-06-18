import { describe, test, expect } from 'vitest';
import {
  nights, fmtDate, toLocalDateStr,
  weekStart, weekLabel,
  applyFilters, findFreeRoom,
  emailDetailBox, emailBtn
} from './utils.js';

// ── nights ──────────────────────────────────────────────────────────────────

describe('nights', () => {
  test('1 noche', () => {
    expect(nights('2025-01-01', '2025-01-02')).toBe(1);
  });
  test('7 noches', () => {
    expect(nights('2025-06-01', '2025-06-08')).toBe(7);
  });
  test('misma fecha entrada y salida → 0', () => {
    expect(nights('2025-01-01', '2025-01-01')).toBe(0);
  });
  test('cruce de mes', () => {
    expect(nights('2025-01-28', '2025-02-03')).toBe(6);
  });
  test('cruce de año', () => {
    expect(nights('2024-12-29', '2025-01-02')).toBe(4);
  });
});

// ── fmtDate ──────────────────────────────────────────────────────────────────

describe('fmtDate', () => {
  test('formato correcto DD/MM/YYYY', () => {
    expect(fmtDate('2025-06-18')).toBe('18/06/2025');
  });
  test('null devuelve —', () => {
    expect(fmtDate(null)).toBe('—');
  });
  test('string vacío devuelve —', () => {
    expect(fmtDate('')).toBe('—');
  });
  test('día y mes de un dígito se conservan con cero', () => {
    expect(fmtDate('2025-01-05')).toBe('05/01/2025');
  });
});

// ── toLocalDateStr ───────────────────────────────────────────────────────────

describe('toLocalDateStr', () => {
  test('devuelve YYYY-MM-DD en hora local', () => {
    expect(toLocalDateStr(new Date(2025, 5, 18))).toBe('2025-06-18');
  });
  test('día y mes con cero a la izquierda', () => {
    expect(toLocalDateStr(new Date(2025, 0, 5))).toBe('2025-01-05');
  });
  test('último día del año', () => {
    expect(toLocalDateStr(new Date(2025, 11, 31))).toBe('2025-12-31');
  });
});

// ── weekStart ────────────────────────────────────────────────────────────────

describe('weekStart', () => {
  test('lunes → el mismo lunes', () => {
    expect(weekStart('2025-06-16')).toBe('2025-06-16');
  });
  test('domingo → lunes anterior', () => {
    expect(weekStart('2025-06-22')).toBe('2025-06-16');
  });
  test('miércoles → lunes de esa semana', () => {
    expect(weekStart('2025-06-18')).toBe('2025-06-16');
  });
  test('cruce de mes (martes 1 jul → lunes 30 jun)', () => {
    expect(weekStart('2025-07-01')).toBe('2025-06-30');
  });
  test('cruce de año (miércoles 1 ene 2025 → lunes 30 dic 2024)', () => {
    expect(weekStart('2025-01-01')).toBe('2024-12-30');
  });
});

// ── weekLabel ────────────────────────────────────────────────────────────────

describe('weekLabel', () => {
  test('incluye el año', () => {
    expect(weekLabel('2025-06-16')).toContain('2025');
  });
  test('formato "Semana X – Y"', () => {
    expect(weekLabel('2025-06-16')).toMatch(/^Semana \d+ \w+ – \d+ \w+ \d{4}$/);
  });
  test('lunes 16 jun → domingo 22 jun', () => {
    expect(weekLabel('2025-06-16')).toBe('Semana 16 jun – 22 jun 2025');
  });
});

// ── applyFilters ─────────────────────────────────────────────────────────────

describe('applyFilters', () => {
  const reservas = [
    { guest_name: 'María García',  check_in: '2025-06-01', check_out: '2025-06-05' },
    { guest_name: 'Juan López',    check_in: '2025-07-10', check_out: '2025-07-15' },
    { guest_name: 'Ana Martínez',  check_in: '2025-08-01', check_out: '2025-08-07' },
  ];

  test('sin filtros devuelve todas', () => {
    expect(applyFilters(reservas, '', '', '')).toHaveLength(3);
  });
  test('búsqueda por nombre, insensible a mayúsculas', () => {
    expect(applyFilters(reservas, 'maría', '', '')).toHaveLength(1);
    expect(applyFilters(reservas, 'JUAN', '', '')).toHaveLength(1);
  });
  test('búsqueda parcial de nombre', () => {
    expect(applyFilters(reservas, 'gar', '', '')).toHaveLength(1);
  });
  test('búsqueda sin resultados', () => {
    expect(applyFilters(reservas, 'Pedro', '', '')).toHaveLength(0);
  });
  test('filtro dateFrom: solo las que hacen checkout desde esa fecha', () => {
    const result = applyFilters(reservas, '', '2025-07-01', '');
    expect(result).toHaveLength(2); // Juan y Ana
  });
  test('filtro dateTo: solo las que hacen checkin hasta esa fecha', () => {
    const result = applyFilters(reservas, '', '', '2025-06-30');
    expect(result).toHaveLength(1); // solo María
  });
  test('filtros combinados nombre + rango', () => {
    const result = applyFilters(reservas, 'juan', '2025-07-01', '2025-07-31');
    expect(result).toHaveLength(1);
    expect(result[0].guest_name).toBe('Juan López');
  });
});

// ── findFreeRoom ─────────────────────────────────────────────────────────────

describe('findFreeRoom', () => {
  test('sin reservas → primera habitación del tipo', () => {
    expect(findFreeRoom('doble', '2025-06-01', '2025-06-05', null, [])).toBe('101');
  });

  test('101 ocupada → devuelve la 102', () => {
    const reservas = [
      { id: '1', room_number: '101', room_type: 'doble', check_in: '2025-06-01', check_out: '2025-06-05', status: 'confirmada' }
    ];
    expect(findFreeRoom('doble', '2025-06-01', '2025-06-05', null, reservas)).toBe('102');
  });

  test('reservas consecutivas NO se solapan (checkout = checkin siguiente)', () => {
    const reservas = [
      { id: '1', room_number: '101', room_type: 'doble', check_in: '2025-06-01', check_out: '2025-06-05', status: 'confirmada' }
    ];
    expect(findFreeRoom('doble', '2025-06-05', '2025-06-08', null, reservas)).toBe('101');
  });

  test('solapamiento parcial al inicio bloquea la habitación', () => {
    const reservas = [
      { id: '1', room_number: '101', room_type: 'doble', check_in: '2025-06-03', check_out: '2025-06-07', status: 'confirmada' }
    ];
    // Nueva reserva 01–05 solapa con la existente 03–07
    expect(findFreeRoom('doble', '2025-06-01', '2025-06-05', null, reservas)).toBe('102');
  });

  test('todas las habitaciones ocupadas → null', () => {
    const reservas = [
      { id: '1', room_number: '101', room_type: 'doble', check_in: '2025-06-01', check_out: '2025-06-10', status: 'confirmada' },
      { id: '2', room_number: '102', room_type: 'doble', check_in: '2025-06-01', check_out: '2025-06-10', status: 'confirmada' },
      { id: '3', room_number: '103', room_type: 'doble', check_in: '2025-06-01', check_out: '2025-06-10', status: 'confirmada' },
      { id: '4', room_number: '104', room_type: 'doble', check_in: '2025-06-01', check_out: '2025-06-10', status: 'confirmada' },
      { id: '5', room_number: '105', room_type: 'doble', check_in: '2025-06-01', check_out: '2025-06-10', status: 'confirmada' },
      { id: '6', room_number: '106', room_type: 'doble', check_in: '2025-06-01', check_out: '2025-06-10', status: 'confirmada' },
    ];
    expect(findFreeRoom('doble', '2025-06-01', '2025-06-10', null, reservas)).toBeNull();
  });

  test('reservas canceladas no bloquean habitaciones', () => {
    const reservas = [
      { id: '1', room_number: '101', room_type: 'doble', check_in: '2025-06-01', check_out: '2025-06-05', status: 'cancelada' },
      { id: '2', room_number: '102', room_type: 'doble', check_in: '2025-06-01', check_out: '2025-06-05', status: 'cancelada' },
    ];
    expect(findFreeRoom('doble', '2025-06-01', '2025-06-05', null, reservas)).toBe('101');
  });

  test('excludeId ignora la reserva propia al editar', () => {
    const reservas = [
      { id: '1', room_number: '101', room_type: 'doble', check_in: '2025-06-01', check_out: '2025-06-05', status: 'confirmada' }
    ];
    expect(findFreeRoom('doble', '2025-06-01', '2025-06-05', '1', reservas)).toBe('101');
  });

  test('tipo apartamento usa sus propias habitaciones', () => {
    expect(findFreeRoom('apartamento', '2025-06-01', '2025-06-05', null, [])).toBe('A-1');
  });

  test('tipo familiar usa sus propias habitaciones', () => {
    expect(findFreeRoom('familiar', '2025-06-01', '2025-06-05', null, [])).toBe('107');
  });

  test('tipo desconocido → null', () => {
    expect(findFreeRoom('suite', '2025-06-01', '2025-06-05', null, [])).toBeNull();
  });
});

// ── emailDetailBox ───────────────────────────────────────────────────────────

describe('emailDetailBox', () => {
  test('contiene la etiqueta y el valor', () => {
    const html = emailDetailBox([['Huésped', 'María García']]);
    expect(html).toContain('Huésped');
    expect(html).toContain('María García');
  });

  test('genera el número correcto de filas', () => {
    const html = emailDetailBox([['A', '1'], ['B', '2'], ['C', '3']]);
    expect((html.match(/<tr>/g) || []).length).toBe(3);
  });

  test('primera fila tiene padding-top 14px, el resto 8px', () => {
    const html = emailDetailBox([['Primera', 'x'], ['Segunda', 'y']]);
    expect(html).toContain('padding:14px');
    expect(html).toContain('padding:8px');
  });
});

// ── emailBtn ─────────────────────────────────────────────────────────────────

describe('emailBtn', () => {
  test('contiene el texto del botón', () => {
    const html = emailBtn('Pagar 120€', 'https://ejemplo.com/pago');
    expect(html).toContain('Pagar 120€');
  });

  test('contiene la URL como href', () => {
    const html = emailBtn('Pagar', 'https://ejemplo.com/pago');
    expect(html).toContain('href="https://ejemplo.com/pago"');
  });
});
