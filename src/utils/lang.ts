export const isObject = (input: any): input is Record<string, any> => {
  return typeof input === 'object' && !Array.isArray(input);
};

export function compactRecord<T>(record: Record<string, T | undefined>): Record<string, T> {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => !!value)) as Record<string, T>;
}
