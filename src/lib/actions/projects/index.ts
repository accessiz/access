/**
 * Barrel re-export for project actions.
 *
 * All consumers that import from `@/lib/actions/projects` will continue
 * to work unchanged — the path now resolves to this directory index.
 */

// Types & helpers
export type {
  ActionState,
  FormDataScheduleEntry,
  ScheduleChangeType,
  ScheduleChange,
  ScheduleAnalysis,
  MigrationMapping,
  MigrationOption,
} from './helpers';

// CRUD
export { createProject, updateProject, deleteProject } from './crud';

// Status transitions
export { completeProjectReview, updateProjectStatus, autoCloseExpiredProject } from './status';

// Password verification
export { verifyProjectPassword } from './password';

// Schedule management
export {
  analyzeScheduleChanges,
  syncProjectSchedule,
  handleOrphanedAssignments,
  getOrphanedAssignments,
  applyMigrationMapping,
} from './schedule';
