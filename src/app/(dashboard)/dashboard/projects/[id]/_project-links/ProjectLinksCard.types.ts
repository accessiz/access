import type { Project } from '@/lib/types';

export interface ProjectLinksCardProps {
    project: Project;
    onStatusChange?: (status: Project['status']) => void;
}
