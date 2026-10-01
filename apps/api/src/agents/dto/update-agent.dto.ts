import { CreateAgentDto } from './create-agent.dto';

// Usiamo Partial<T> nativo di TypeScript se mapped-types dà problemi
export class UpdateAgentDto implements Partial<CreateAgentDto> {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  region?: string;
  commissionRate?: number;
  // Non includiamo password nell'update per sicurezza, 
  // o lo gestiamo in un metodo dedicato
}