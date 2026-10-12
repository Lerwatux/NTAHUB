/**
 * Calendrier des Vacances Scolaires — Zone C (Académies de Paris, Créteil, Versailles, Montpellier, Toulouse)
 * Années scolaires 2025-2026, 2026-2027 et 2027-2028
 */

export interface SchoolHolidayPeriod {
  name: string;
  startDate: string; // YYYY-MM-DD (premier jour des vacances, souvent samedi après les cours)
  endDate: string;   // YYYY-MM-DD (dernier jour des vacances, dimanche avant reprise)
  description?: string;
}

export const ZONE_C_HOLIDAYS: SchoolHolidayPeriod[] = [
  // Année scolaire 2025-2026
  {
    name: 'Vacances de la Toussaint',
    startDate: '2025-10-18',
    endDate: '2025-11-02',
    description: 'Zone C · Reprise le lundi 3 novembre 2025',
  },
  {
    name: 'Vacances de Noël',
    startDate: '2025-12-20',
    endDate: '2026-01-04',
    description: 'Toutes zones · Reprise le lundi 5 janvier 2026',
  },
  {
    name: "Vacances d'Hiver",
    startDate: '2026-02-21',
    endDate: '2026-03-08',
    description: 'Zone C · Reprise le lundi 9 mars 2026',
  },
  {
    name: 'Vacances de Printemps',
    startDate: '2026-04-18',
    endDate: '2026-05-03',
    description: 'Zone C · Reprise le lundi 4 mai 2026',
  },
  {
    name: "Pont de l'Ascension",
    startDate: '2026-05-13',
    endDate: '2026-05-17',
    description: 'Toutes zones · Ascension',
  },
  {
    name: "Vacances d'Été",
    startDate: '2026-07-04',
    endDate: '2026-08-31',
    description: 'Grandes vacances scolaires',
  },

  // Année scolaire 2026-2027 (Année courante de l’application)
  {
    name: 'Vacances de la Toussaint',
    startDate: '2026-10-17',
    endDate: '2026-11-01',
    description: 'Zone C (Paris/Créteil/Versailles) · Reprise le lundi 2 novembre 2026',
  },
  {
    name: 'Vacances de Noël',
    startDate: '2026-12-19',
    endDate: '2027-01-03',
    description: 'Toutes zones · Reprise le lundi 4 janvier 2027',
  },
  {
    name: "Vacances d'Hiver",
    startDate: '2027-02-13',
    endDate: '2027-02-28',
    description: 'Zone C · Reprise le lundi 1er mars 2027',
  },
  {
    name: 'Vacances de Printemps',
    startDate: '2027-04-10',
    endDate: '2027-04-25',
    description: 'Zone C · Reprise le lundi 26 avril 2027',
  },
  {
    name: "Pont de l'Ascension",
    startDate: '2027-05-05',
    endDate: '2027-05-09',
    description: 'Toutes zones · Pont de l’Ascension',
  },
  {
    name: "Vacances d'Été",
    startDate: '2027-07-03',
    endDate: '2027-08-31',
    description: 'Grandes vacances d’été 2027',
  },

  // Année scolaire 2027-2028
  {
    name: 'Vacances de la Toussaint',
    startDate: '2027-10-16',
    endDate: '2027-10-31',
    description: 'Zone C · Reprise le lundi 1er novembre 2027',
  },
  {
    name: 'Vacances de Noël',
    startDate: '2027-12-18',
    endDate: '2028-01-02',
    description: 'Toutes zones · Reprise le lundi 3 janvier 2028',
  },
];

/**
 * Vérifie si une date donnée (YYYY-MM-DD) est en période de vacances scolaires Zone C
 */
export function getZoneCHoliday(dateStr: string): {
  period: SchoolHolidayPeriod;
  isFirstDay: boolean;
  isLastDay: boolean;
} | null {
  for (const period of ZONE_C_HOLIDAYS) {
    if (dateStr >= period.startDate && dateStr <= period.endDate) {
      return {
        period,
        isFirstDay: dateStr === period.startDate,
        isLastDay: dateStr === period.endDate,
      };
    }
  }
  return null;
}
