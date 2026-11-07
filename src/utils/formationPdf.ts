import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import { shiftTime } from './timezone';

export const FORMATION_START = '09:30';
export const FORMATION_FULL_DAY_END = '17:30'; // 7 h de cours + 1 h de pause
export const FORMATION_COMMUTE_MINUTES = 60;

export interface FormationTextItem {
  str: string;
  x: number;
  y: number; // depuis le haut de la page
  page: number;
}

export interface FormationDay {
  date: string; // YYYY-MM-DD
  module: string;
  hours: number; // 0 : non précisé dans le PDF (stage)
  startTime: string;
  endTime: string;
}

export interface FormationMonth {
  label: string;
  year: number;
  hoursRead: number;
  hoursExpected: number;
}

export interface FormationPlanning {
  days: FormationDay[];
  months: FormationMonth[];
  totalHours: number;
  problems: string[]; // vide quand le contrôle est bon
}

const MONTHS: Record<string, number> = {
  janvier: 1,
  février: 2,
  mars: 3,
  avril: 4,
  mai: 5,
  juin: 6,
  juillet: 7,
  août: 8,
  septembre: 9,
  octobre: 10,
  novembre: 11,
  décembre: 12,
};

const WEEKDAYS = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];

const isNumber = (s: string) => /^\d+$/.test(s.trim());
const sameRow = (a: FormationTextItem, b: FormationTextItem) => Math.abs(a.y - b.y) <= 3;

function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * L'année n'est pas écrite dans le calendrier : on prend celle, proche d'aujourd'hui,
 * où tous les jours de la semaine du mois tombent sur les bonnes dates.
 */
function findYear(month: number, rows: { day: number; weekday: string }[], today: Date): number | null {
  const thisYear = today.getFullYear();
  const matches = [thisYear - 1, thisYear, thisYear + 1, thisYear + 2].filter((year) =>
    rows.every(({ day, weekday }) => {
      const date = new Date(Date.UTC(year, month - 1, day));
      return date.getUTCMonth() === month - 1 && WEEKDAYS[date.getUTCDay()] === weekday;
    })
  );
  return matches.length === 1 ? matches[0] : null;
}

/**
 * Lit le « Calendrier de formation » : un tableau par mois, placés côte à côte,
 * avec pour chaque jour le jour de semaine, le numéro, le module et le nombre d'heures.
 */
export function parseFormationItems(items: FormationTextItem[], today = new Date()): FormationPlanning {
  const days: FormationDay[] = [];
  const months: FormationMonth[] = [];
  const problems: string[] = [];

  for (const page of [...new Set(items.map((t) => t.page))]) {
    const pageItems = items.filter((t) => t.page === page);
    const headers = pageItems
      .filter((t) => MONTHS[t.str.trim().toLowerCase()])
      .sort((a, b) => a.x - b.x);

    // Bord gauche de chaque tableau, repéré par sa colonne de jours de la semaine
    const columnStarts: number[] = [];
    pageItems
      .filter((t) => WEEKDAYS.includes(t.str.trim()))
      .map((t) => t.x)
      .sort((a, b) => a - b)
      .forEach((x) => {
        if (!columnStarts.length || x - columnStarts[columnStarts.length - 1] > 30) columnStarts.push(x);
      });

    const columnOf = (x: number) => columnStarts.filter((start) => x >= start - 6).length - 1;

    headers.forEach((header, column) => {
      const monthItems = pageItems.filter((t) => columnOf(t.x) === column);
      const month = MONTHS[header.str.trim().toLowerCase()];

      const rows = monthItems
        .filter((t) => WEEKDAYS.includes(t.str.trim()))
        .map((weekdayItem) => {
          const others = monthItems.filter((t) => t !== weekdayItem && sameRow(t, weekdayItem));
          const numbers = others.filter((t) => isNumber(t.str)).sort((a, b) => a.x - b.x);
          return {
            weekday: weekdayItem.str.trim(),
            day: Number(numbers[0]?.str),
            hours: numbers[1] ? Number(numbers[1].str) : 0,
            module: others
              .filter((t) => !isNumber(t.str))
              .sort((a, b) => a.x - b.x)
              .map((t) => t.str.trim())
              .join(' '),
          };
        });

      const year = findYear(month, rows, today);
      if (year === null) {
        problems.push(`${header.str.trim()} : impossible de déterminer l'année.`);
        return;
      }

      const totalLabel = monthItems.find((t) => t.str.includes('Total mensuel'));
      const totalItem = totalLabel && monthItems.find((t) => sameRow(t, totalLabel) && isNumber(t.str));
      const hoursExpected = totalItem ? Number(totalItem.str) : NaN;
      const hoursRead = rows.reduce((sum, row) => sum + row.hours, 0);

      if (hoursRead !== hoursExpected) {
        problems.push(
          `${header.str.trim()} : ${hoursRead} h lues pour ${hoursExpected} h annoncées dans le PDF.`
        );
      }
      months.push({ label: header.str.trim(), year, hoursRead, hoursExpected });

      for (const row of rows) {
        if (!row.module) continue;
        const isShortDay = row.hours > 0 && row.hours < 7;
        days.push({
          date: toIsoDate(year, month, row.day),
          module: row.module,
          hours: row.hours,
          startTime: FORMATION_START,
          endTime: isShortDay ? shiftTime(FORMATION_START, row.hours * 60) : FORMATION_FULL_DAY_END,
        });
      }
    });
  }

  if (!days.length) {
    problems.push("Aucun jour de formation trouvé : ce PDF n'a pas le format attendu.");
  }

  return {
    days: days.sort((a, b) => a.date.localeCompare(b.date)),
    months,
    totalHours: months.reduce((sum, m) => sum + m.hoursRead, 0),
    problems,
  };
}

/** Lit le fichier sur l'appareil, sans l'envoyer. pdf.js n'est chargé qu'à ce moment-là. */
export async function readFormationPdf(file: File): Promise<FormationPlanning> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

  const document = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const items: FormationTextItem[] = [];

  for (let page = 1; page <= document.numPages; page++) {
    const pdfPage = await document.getPage(page);
    const { height } = pdfPage.getViewport({ scale: 1 });
    const content = await pdfPage.getTextContent();
    for (const item of content.items) {
      if ('str' in item && item.str.trim()) {
        items.push({ str: item.str, x: item.transform[4], y: height - item.transform[5], page });
      }
    }
  }

  return parseFormationItems(items);
}
