export function calculate(v) {
  const {mode, lo, to, tx, bt, targetYears, hoursDay, daysYear, heat, ratedHeat, ripple, ratedRipple} = v;
  const required = targetYears * hoursDay * daysYear;
  const ambient = Math.max(tx, 40);
  let delta = 0;
  let adjustment = 0;
  if (mode === 'measured') {
    delta = heat;
    adjustment = -delta / 5;
  } else if (mode === 'rated') {
    delta = ratedHeat * (ripple / ratedRipple) ** 2;
    adjustment = (ratedHeat - delta) / 5;
  }
  const life = lo * bt ** ((to - ambient) / 10) * 2 ** adjustment;
  const maxTemp = to - 10 * Math.log(required / (lo * 2 ** adjustment)) / Math.log(bt);
  return {required, life, maxTemp, delta, ambient, years:life/(hoursDay*daysYear), ratio:life/required, capped:Math.min(life, 15*365*24)};
}
