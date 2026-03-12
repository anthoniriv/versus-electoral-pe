/** Strip diacritics and lowercase for accent-insensitive search */
export function normalize(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
