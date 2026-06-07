import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { applyToProject } from '@/lib/actions/models_portal';
import { toast } from 'sonner';

export function useApplyForm(projectId: string, modelId: string, initialSelectedSchedules?: string[]) {
  const [selectedSchedules, setSelectedSchedules] = useState<string[]>(initialSelectedSchedules || []);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const handleToggleSchedule = (scheduleId: string) => {
    setSelectedSchedules((prev) =>
      prev.includes(scheduleId)
        ? prev.filter((id) => id !== scheduleId)
        : [...prev, scheduleId]
    );
  };

  const handleSelectAllSchedules = (scheduleIds: string[]) => {
    setSelectedSchedules(scheduleIds);
  };

  const handleClearSchedules = () => {
    setSelectedSchedules([]);
  };

  const submitResponse = async (acceptVal: boolean): Promise<boolean> => {
    if (acceptVal && selectedSchedules.length === 0) {
      toast.error('Debes seleccionar al menos un día disponible para aceptar.');
      return false;
    }

    setIsPending(true);
    try {
      const result = await applyToProject(projectId, modelId, acceptVal, acceptVal ? selectedSchedules : []);
      if (result.success) {
        toast.success(acceptVal ? 'Asistencia confirmada con éxito.' : 'Propuesta declinada.');
        router.push('/model/profile');
        router.refresh();
        return true;
      } else {
        toast.error(result.error || 'Error al enviar respuesta.');
        return false;
      }
    } catch (err) {
      toast.error('Error de conexión.');
      return false;
    } finally {
      setIsPending(false);
    }
  };

  return {
    selectedSchedules,
    handleToggleSchedule,
    handleSelectAllSchedules,
    handleClearSchedules,
    isPending,
    submitResponse,
  };
}
