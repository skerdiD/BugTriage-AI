import { z } from "zod";

export const MAX_RESOURCE_ID_LENGTH = 120;
export const MAX_TICKET_CODE_LENGTH = 24;

export const resourceIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(MAX_RESOURCE_ID_LENGTH)
  .regex(/^[A-Za-z0-9_-]+$/, "Invalid resource identifier.");

export const ticketCodeSchema = z
  .string()
  .trim()
  .min(1)
  .max(MAX_TICKET_CODE_LENGTH)
  .regex(/^(?:BUG|DEMO)-\d{4,12}$/, "Invalid ticket code.");
