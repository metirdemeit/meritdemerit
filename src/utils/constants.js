export const CLASS_NAMES = Array.from({ length: 7 }, (_, i) => 6 + i)
  .flatMap((grade) => [`${grade}A`, `${grade}B`]);

