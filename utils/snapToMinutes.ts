
export function snapToMinutes(date: Date, step = 15): Date {
  const snapped = new Date(date);
  const minutes = snapped.getMinutes();
  const rounded = Math.round(minutes / step) * step;
  
  snapped.setMinutes(rounded);
  snapped.setSeconds(0);
  snapped.setMilliseconds(0);
  
  return snapped;
}
