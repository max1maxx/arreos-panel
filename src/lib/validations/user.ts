import { z } from "zod";
import { UserRole } from "@prisma/client";

function validateEcuadorianCI(ci: string): boolean {
  if (ci.length !== 10) return false;
  if (!/^\d+$/.test(ci)) return false;

  const province = parseInt(ci.substring(0, 2), 10);
  if (province < 1 || (province > 24 && province !== 30)) return false;

  const thirdDigit = parseInt(ci.charAt(2), 10);
  if (thirdDigit > 5) return false;

  const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let sum = 0;

  for (let i = 0; i < 9; i++) {
    let value = parseInt(ci.charAt(i), 10) * coefficients[i];
    if (value >= 10) value -= 9;
    sum += value;
  }

  const checkDigit = sum % 10 === 0 ? 0 : 10 - (sum % 10);
  return checkDigit === parseInt(ci.charAt(9), 10);
}

function validateEcuadorianRUC(ruc: string): boolean {
  if (ruc.length !== 13) return false;
  if (!/^\d+$/.test(ruc)) return false;
  if (!ruc.endsWith('001')) return false;

  const province = parseInt(ruc.substring(0, 2), 10);
  if (province < 1 || (province > 24 && province !== 30)) return false;

  const thirdDigit = parseInt(ruc.charAt(2), 10);

  if (thirdDigit < 6) {
    return validateEcuadorianCI(ruc.substring(0, 10));
  } else if (thirdDigit === 6) {
    const coefficients = [3, 2, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 8; i++) {
      sum += parseInt(ruc.charAt(i), 10) * coefficients[i];
    }
    const rem = sum % 11;
    const checkDigit = rem === 0 ? 0 : 11 - rem;
    return checkDigit === parseInt(ruc.charAt(8), 10);
  } else if (thirdDigit === 9) {
    const coefficients = [4, 3, 2, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(ruc.charAt(i), 10) * coefficients[i];
    }
    const rem = sum % 11;
    const checkDigit = rem === 0 ? 0 : 11 - rem;
    return checkDigit === parseInt(ruc.charAt(9), 10);
  }

  return false;
}

const baseUserSchema = z.object({
  first_name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100, "El nombre no puede exceder 100 caracteres"),
  last_name: z.string().min(2, "El apellido debe tener al menos 2 caracteres").max(100, "El apellido no puede exceder 100 caracteres"),
  document_type: z.enum(["CEDULA", "RUC", "PASAPORTE"]),
  document_number: z.string().min(1, "Este campo es requerido"),
  email: z.string().email("Debe ser un correo electrónico válido").max(100, "El correo no puede exceder 100 caracteres"),
  password: z.string().optional().or(z.literal('')),
  role: z.nativeEnum(UserRole),
  phone: z.string()
    .regex(/^\+?[0-9\s\-\(\)]{7,20}$/, "Debe ser un teléfono válido (7 a 20 dígitos)")
    .optional()
    .or(z.literal('')),
  is_verified: z.union([z.boolean(), z.string()]).optional(),
  finca_name: z.string().max(100, "No puede exceder 100 caracteres").optional().or(z.literal('')),
  license_type: z.string().max(50, "No puede exceder 50 caracteres").optional().or(z.literal('')),
  vehicle_capacity: z.string().optional().or(z.literal('')),
});

export const userSchema = baseUserSchema.superRefine((data, ctx) => {
  if (data.document_type === "CEDULA") {
    if (!/^\d{10}$/.test(data.document_number)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["document_number"],
        message: "La cédula debe contener exactamente 10 dígitos numéricos",
      });
    } else if (!validateEcuadorianCI(data.document_number)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["document_number"],
        message: "La cédula ingresada no es válida",
      });
    }
  } else if (data.document_type === "RUC") {
    if (!/^\d{13}$/.test(data.document_number)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["document_number"],
        message: "El RUC debe contener exactamente 13 dígitos numéricos",
      });
    } else if (!validateEcuadorianRUC(data.document_number)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["document_number"],
        message: "El RUC ingresado no es válido o no termina en 001",
      });
    }
  } else if (data.document_type === "PASAPORTE") {
    if (data.document_number.length < 5 || data.document_number.length > 20) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["document_number"],
        message: "El pasaporte debe tener entre 5 y 20 caracteres",
      });
    } else if (!/^[a-zA-Z0-9]+$/.test(data.document_number)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["document_number"],
        message: "El pasaporte solo puede contener letras y números",
      });
    }
  }
});

// Extraemos el tipo de los valores base que interactuarán con el DOM (todo es string en inputs de react-hook-form)
export type UserFormValues = z.infer<typeof baseUserSchema>;
