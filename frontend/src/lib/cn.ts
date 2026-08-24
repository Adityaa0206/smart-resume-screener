/**
 * Joins conditional class names into a single string, skipping any
 * falsy values. Small enough to hand-write instead of pulling in `clsx`.
 *
 * Example: cn("btn", isActive && "btn-active", className)
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
