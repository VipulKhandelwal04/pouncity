import type { Passport } from "./passport";

export interface PassportRepository {
  insert(passport: Passport): Promise<Passport>;
  findByOwnerId(ownerId: string): Promise<Passport | null>;
}
