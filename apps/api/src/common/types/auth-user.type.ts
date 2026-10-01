export interface AuthenticatedRole {
  id?: string;
  name: string;
  description?: string | null;
  permissions?: Array<{ resource: string; action: string }>;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles: Array<string | AuthenticatedRole>;
  agentId?: string | null;
  agent?: {
    id: string;
    code: string;
    commissionRate: any;
    region?: string | null;
  } | null;
  permissions?: Array<{ resource: string; action: string }>;
}

/**
 * Normalizza l'elenco dei ruoli dell'utente in un array di stringhe
 */
export function getUserRoleNames(user?: AuthenticatedUser | null): string[] {
  if (!user || !user.roles) return [];
  return user.roles.map((role) => (typeof role === 'string' ? role : role.name));
}

/**
 * Controlla se l'utente ha ruolo ADMIN o MANAGER
 */
export function isAdminOrManager(user?: AuthenticatedUser | null): boolean {
  const roleNames = getUserRoleNames(user);
  return roleNames.includes('ADMIN') || roleNames.includes('MANAGER');
}
