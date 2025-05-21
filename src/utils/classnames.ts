/**
 * A utility function to conditionally join class names together
 * @param classes - Array of class names or objects with class names as keys and boolean values
 * @returns A string of concatenated class names
 */
export function classNames(...classes: (string | Record<string, boolean> | undefined)[]): string {
  return classes
    .filter(Boolean)
    .map((item) => {
      if (typeof item === 'string') return item;
      if (typeof item === 'object' && item !== null) {
        return Object.entries(item)
          .filter(([_, value]) => Boolean(value))
          .map(([key]) => key)
          .join(' ');
      }
      return '';
    })
    .filter(Boolean)
    .join(' ')
    .trim();
}

/**
 * A simpler version of classNames that only handles string inputs
 * @param classes - Array of class names
 * @returns A string of concatenated class names
 */
export function cx(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ').trim();
}
