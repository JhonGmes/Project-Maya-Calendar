
export function moveToDay(original: Date, targetDay: Date): Date {
  const newDate = new Date(targetDay);
  newDate.setHours(original.getHours(), original.getMinutes(), 0, 0);
  return newDate;
}
