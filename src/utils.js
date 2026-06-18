export const PRICES = { doble: 40, apartamento: 60, familiar: 75 };
export const ROOM_LABELS = {
  doble: 'Habitación doble',
  apartamento: 'Apartamento con cocina',
  familiar: 'Familiar / Hidromasaje'
};
export const ROOMS_BY_TYPE = {
  doble: ['101', '102', '103', '104', '105', '106'],
  familiar: ['107', '108'],
  apartamento: ['A-1', 'A-2']
};
export const ALL_ROOMS = ['101', '102', '103', '104', '105', '106', '107', '108', 'A-1', 'A-2'];
export const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export function nights(ci, co) {
  return Math.round((new Date(co) - new Date(ci)) / 86400000);
}

export function fmtDate(d) {
  if (!d) return '—';
  var p = d.split('-');
  return p[2] + '/' + p[1] + '/' + p[0];
}

export function toLocalDateStr(dt) {
  var y = dt.getFullYear();
  var m = String(dt.getMonth() + 1).padStart(2, '0');
  var d = String(dt.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
}

export function weekStart(dateStr) {
  var d = new Date(dateStr + 'T00:00:00');
  var dow = d.getDay();
  var diff = (dow === 0 ? -6 : 1 - dow);
  d.setDate(d.getDate() + diff);
  return toLocalDateStr(d);
}

export function weekLabel(mondayStr) {
  var mon = new Date(mondayStr + 'T00:00:00');
  var sun = new Date(mon);
  sun.setDate(sun.getDate() + 6);
  var fmt = function (dd) { return dd.getDate() + ' ' + MONTHS_ES[dd.getMonth()].toLowerCase().slice(0, 3); };
  return 'Semana ' + fmt(mon) + ' – ' + fmt(sun) + ' ' + sun.getFullYear();
}

// Recibe la lista de reservas y los filtros como parámetros explícitos (sin estado global)
export function applyFilters(list, query, dateFrom, dateTo) {
  var q = (query || '').trim().toLowerCase();
  if (q) list = list.filter(function (r) { return (r.guest_name || '').toLowerCase().indexOf(q) !== -1; });
  if (dateFrom) list = list.filter(function (r) { return r.check_out >= dateFrom; });
  if (dateTo) list = list.filter(function (r) { return r.check_in <= dateTo; });
  return list;
}

// Recibe la lista de reservas como parámetro para poder testearla sin estado global
export function findFreeRoom(roomType, checkIn, checkOut, excludeId, reservationsList) {
  var candidates = ROOMS_BY_TYPE[roomType] || [];
  var overlapping = reservationsList.filter(function (r) {
    if (r.status === 'cancelada') return false;
    if (excludeId && r.id === excludeId) return false;
    return r.check_in < checkOut && r.check_out > checkIn;
  });
  for (var i = 0; i < candidates.length; i++) {
    var room = candidates[i];
    var choca = overlapping.some(function (r) { return r.room_number === room; });
    if (!choca) return room;
  }
  return null;
}

export function emailDetailBox(rows) {
  var html = '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f3ef;border-radius:10px;margin:8px 0 4px">';
  for (var i = 0; i < rows.length; i++) {
    html += '<tr><td style="padding:' + (i === 0 ? '14' : '8') + 'px 16px 8px;color:#8a7070;font-size:13px;width:42%">' + rows[i][0] + '</td>'
      + '<td style="padding:' + (i === 0 ? '14' : '8') + 'px 16px 8px;color:#1a0e0e;font-size:13px;font-weight:600;text-align:right">' + rows[i][1] + '</td></tr>';
  }
  return html + '</table>';
}

export function emailBtn(text, url) {
  return '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto"><tr><td style="border-radius:10px;background:#9d2235">'
    + '<a href="' + url + '" style="display:inline-block;padding:14px 38px;color:#ffffff !important;font-size:16px;font-weight:700;text-decoration:none;border-radius:10px">' + text + '</a>'
    + '</td></tr></table>';
}
