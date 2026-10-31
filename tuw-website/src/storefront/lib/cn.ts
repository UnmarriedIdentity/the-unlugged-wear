// className merger — install clsx + tailwind-merge, then:
// import { clsx, type ClassValue } from "clsx"; import { twMerge } from "tailwind-merge";
// export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export function cn(...inputs: string[]) {
  return inputs.filter(Boolean).join(" ");
}
