/**
 * Cached API functions using React.cache() for per-request deduplication.
 * 
 * These wrappers ensure that multiple calls to the same function with the same
 * arguments within a single request will only execute once and share the result.
 * 
 * Usage: Import from here instead of the original API modules when you need
 * to call the same function multiple times in a request tree.
 */

import { cache } from 'react';
import { getModelById as _getModelById, getModelWorkHistory as _getModelWorkHistory } from './models';
import { getProjectById as _getProjectById, getModelsForProject as _getModelsForProject } from './projects';

/**
 * Cached version of getModelById.
 * Deduplicates calls within the same request.
 */
export const getModelByIdCached = cache(_getModelById);

/**
 * Cached version of getModelWorkHistory.
 * Deduplicates calls within the same request.
 */
export const getModelWorkHistoryCached = cache(_getModelWorkHistory);

/**
 * Cached version of getProjectById.
 * Deduplicates calls within the same request.
 */
export const getProjectByIdCached = cache(_getProjectById);

/**
 * Cached version of getModelsForProject.
 * Deduplicates calls within the same request.
 */
export const getModelsForProjectCached = cache(_getModelsForProject);
