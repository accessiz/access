import { sendProjectCompletionEmail } from '../services/resend';
import { env } from '../env';

const mockSend = jest.fn();

jest.mock('resend', () => {
  return {
    Resend: jest.fn().mockImplementation(() => {
      return {
        emails: {
          send: mockSend,
        },
      };
    }),
  };
});

describe('sendProjectCompletionEmail', () => {
  beforeEach(() => {
    mockSend.mockReset();
    mockSend.mockResolvedValue({ data: { id: 'test-id' }, error: null });
  });

  it('sends correct email format when there are approved models', async () => {
    const approvedModels = [
      { alias: 'John Doe', fullName: 'John Doe', gender: 'male', country: 'Guatemala' },
      { alias: 'Jane Doe', fullName: 'Jane Doe', gender: 'female', country: 'Mexico' },
    ];

    const result = await sendProjectCompletionEmail({
      projectName: 'Test Project',
      clientName: 'Client Co',
      publicId: 'proj123',
      approvedModels,
    });

    expect(result).toBe(true);
    expect(mockSend).toHaveBeenCalledTimes(1);

    const callArgs = mockSend.mock.calls[0][0];
    expect(callArgs.subject).toContain('✅ 2 Modelos Aprobados');
    expect(callArgs.subject).toContain('Test Project');
    expect(callArgs.subject).toContain('Client Co');

    expect(callArgs.html).toContain('El cliente ha finalizado la sesión de selección');
    expect(callArgs.html).not.toContain('VER DETALLE COMPLETO');
    expect(callArgs.html).toContain('Hombres (1)');
    expect(callArgs.html).toContain('Mujeres (1)');
    expect(callArgs.html).toContain('John Doe');
    expect(callArgs.html).toContain('Jane Doe');
  });

  it('sends correct email format when there are 0 approved models', async () => {
    const result = await sendProjectCompletionEmail({
      projectName: 'Empty Project',
      clientName: 'Lonely Client',
      publicId: 'empty456',
      approvedModels: [],
    });

    expect(result).toBe(true);
    expect(mockSend).toHaveBeenCalledTimes(1);

    const callArgs = mockSend.mock.calls[0][0];
    expect(callArgs.subject).toContain('⚠️ Selección Finalizada (0 Aprobados)');
    expect(callArgs.subject).toContain('Empty Project');
    expect(callArgs.subject).toContain('Lonely Client');

    expect(callArgs.html).toContain('El proyecto ha finalizado pero no hubieron modelos aprobados. Por favor, contacta al cliente para dar seguimiento.');
    expect(callArgs.html).not.toContain('VER DETALLE COMPLETO');
    expect(callArgs.html).not.toContain('VER SELECCIÓN COMPLETA');
    expect(callArgs.html).not.toContain('Hombres');
    expect(callArgs.html).not.toContain('Mujeres');
  });
});
