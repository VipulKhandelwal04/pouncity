import { z } from "zod";

export const shareTokenSchema = z.string().trim().min(1, "A share link is required");
