export const holidays = [
  { date: '01-01', name: 'Confraternização Universal' },
  { date: '04-21', name: 'Tiradentes' },
  { date: '05-01', name: 'Dia do Trabalho' },
  { date: '09-07', name: 'Independência do Brasil' },
  { date: '10-12', name: 'Nossa Senhora Aparecida' },
  { date: '11-02', name: 'Finados' },
  { date: '11-15', name: 'Proclamação da República' },
  { date: '12-25', name: 'Natal' },
];

export const getHolidayName = (date: Date): string | null => {
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const key = `${month}-${day}`;
  const holiday = holidays.find(h => h.date === key);
  return holiday ? holiday.name : null;
};