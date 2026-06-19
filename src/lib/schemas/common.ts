import { z } from "zod";

export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

export const optionalUrlSchema = z
  .string()
  .url()
  .optional()
  .or(z.literal("").transform(() => undefined))
  .or(z.null().transform(() => undefined));

export function minMaxRefine<T extends Record<string, unknown>>(
  minField: keyof T & string,
  maxField: keyof T & string,
  message: string,
) {
  return {
    check: (value: T) => {
      const min = value[minField] as number | undefined;
      const max = value[maxField] as number | undefined;
      return min === undefined || max === undefined || min <= max;
    },
    opts: { message, path: [minField] as [string] },
  };
}
