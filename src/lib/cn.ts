type ClassValue = string | false | null | undefined;

// Junta classes condicionais. Não resolve conflitos de utilitários Tailwind:
// clsx + tailwind-merge ainda não estão nas dependências do projeto.
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(' ');
}
