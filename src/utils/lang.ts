export const isObject = (input: any): input is Record<string, any> => {
  return typeof input === 'object' && !Array.isArray(input);
};
