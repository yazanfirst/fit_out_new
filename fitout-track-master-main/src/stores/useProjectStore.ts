import { createDataStore } from './useDataStore';
import { type Project } from '@/lib/types';

export const useProjectStore = createDataStore<Project>(); 