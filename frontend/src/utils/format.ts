// Formats a string to title case (e.g. "HELLO WORLD" -> "Hello World").
export const formatToTitleCase = (value: string): string => {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.toLowerCase().slice(1);
};
