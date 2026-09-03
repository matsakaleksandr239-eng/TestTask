export function isDateWithinTolerance(expected: Date, toleranceMs = 60_000) {
  return {
    asymmetricMatch: (actual: string | Date) => {
      const actualMs = new Date(actual).getTime();
      return Math.abs(actualMs - expected.getTime()) <= toleranceMs;
    },
    toString: () => `date close to ${expected.toISOString()} (within ${toleranceMs}ms)`,
  };
}
