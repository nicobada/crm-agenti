import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function createMockExecutionContext(user: any): ExecutionContext {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  it('should allow access if no roles are required on route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockExecutionContext({ id: 'u1', roles: ['AGENT'] });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if user is ADMIN (wildcard permission)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['MANAGER']);
    const context = createMockExecutionContext({
      id: 'u-admin',
      roles: [{ name: 'ADMIN' }],
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if user has required role matching string array', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['AGENT']);
    const context = createMockExecutionContext({
      id: 'u-agent',
      roles: ['AGENT'],
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if user has required role matching object array', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['MANAGER']);
    const context = createMockExecutionContext({
      id: 'u-mgr',
      roles: [{ name: 'MANAGER' }],
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access if user lacks required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN', 'MANAGER']);
    const context = createMockExecutionContext({
      id: 'u-agent',
      roles: ['AGENT'],
    });

    expect(guard.canActivate(context)).toBe(false);
  });

  it('should deny access if request has no authenticated user', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['AGENT']);
    const context = createMockExecutionContext(null);

    expect(guard.canActivate(context)).toBe(false);
  });
});
