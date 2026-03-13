import { ProjectForm } from '@/components/organisms/ProjectForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nuevo Proyecto',
};

export default function NewProjectPage() {
  return (
    <ProjectForm />
  );
}
