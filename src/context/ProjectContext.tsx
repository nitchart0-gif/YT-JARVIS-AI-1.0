import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { type User } from 'firebase/auth';
import {
  type ProductionProfile,
  type ProjectAspectRatio,
  createDefaultProductionProfile,
  updateProductionProfile,
  validateProductionProfile,
  migrateLegacyProject,
} from '../services/productionProfileService.ts';
import {
  subscribeEditorProjects,
  saveEditorProject,
  deleteEditorProject,
} from '../services/firestoreService.ts';

export interface CreatorProject {
  id: string;
  name: string;
  productionProfile: ProductionProfile;
  workflowStage: string;
  createdAt: number;
  updatedAt: number;
  scriptData?: any;
  promptsData?: any;
  thumbnailConcepts?: any[];
  editorData?: any;
}

interface ProjectContextType {
  activeProject: CreatorProject;
  activeProfile: ProductionProfile;
  projects: CreatorProject[];
  isLoadingProjects: boolean;
  createProject: (name: string, ratio: ProjectAspectRatio) => CreatorProject;
  selectProject: (projectId: string) => void;
  updateActiveProfile: (changes: Partial<ProductionProfile>) => void;
  switchAspectRatio: (newRatio: ProjectAspectRatio) => void;
  saveCurrentProject: (additionalData?: Partial<CreatorProject>) => Promise<void>;
  deleteProjectById: (projectId: string) => Promise<void>;
  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  isJarvisAssistantOpen: boolean;
  setJarvisAssistantOpen: (open: boolean) => void;
  activeWorkflowStage: string;
  setActiveWorkflowStage: (stage: string) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const LOCAL_STORAGE_ACTIVE_PROJECT_KEY = 'jarvis_active_project_id';
const LOCAL_STORAGE_PROJECTS_KEY = 'jarvis_saved_projects_v2';

export const ProjectProvider: React.FC<{
  user: User | null;
  children: React.ReactNode;
}> = ({ user, children }) => {
  const [projects, setProjects] = useState<CreatorProject[]>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_PROJECTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p) => ({
            ...p,
            productionProfile: validateProductionProfile(p.productionProfile || p),
          }));
        }
      }
    } catch {}
    // Default initial project: 9:16 Vertical Short
    const defaultProfile = createDefaultProductionProfile('default-project-1', '9:16', 'Apex AI Breakthroughs (9:16)');
    return [
      {
        id: defaultProfile.projectId,
        name: defaultProfile.projectName,
        productionProfile: defaultProfile,
        workflowStage: 'overview',
        createdAt: defaultProfile.createdAt,
        updatedAt: defaultProfile.updatedAt,
      },
    ];
  });

  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_ACTIVE_PROJECT_KEY);
      if (saved) return saved;
    } catch {}
    return projects[0]?.id || 'default-project-1';
  });

  const [isLoadingProjects, setIsLoadingProjects] = useState<boolean>(false);
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  const [isJarvisAssistantOpen, setJarvisAssistantOpen] = useState<boolean>(false);
  const [activeWorkflowStage, setActiveWorkflowStage] = useState<string>('overview');

  // Find active project or fallback to first
  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0] || {
    id: 'fallback-project',
    name: 'Untitled Project',
    productionProfile: createDefaultProductionProfile('fallback-project', '9:16'),
    workflowStage: 'overview',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const activeProfile = activeProject.productionProfile;

  // Global keyboard shortcut for Command Palette (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync to local storage whenever projects change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_PROJECTS_KEY, JSON.stringify(projects));
      localStorage.setItem(LOCAL_STORAGE_ACTIVE_PROJECT_KEY, activeProjectId);
    } catch (e) {
      console.warn('Could not save projects to local storage', e);
    }
  }, [projects, activeProjectId]);

  // Sync from Firestore if authenticated
  useEffect(() => {
    if (!user) return;
    setIsLoadingProjects(true);

    const unsubscribe = subscribeEditorProjects(
      user.uid,
      (cloudProjects) => {
        setIsLoadingProjects(false);
        if (!cloudProjects || cloudProjects.length === 0) return;

        setProjects((prevLocal) => {
          const mergedMap = new Map<string, CreatorProject>();
          // local first
          prevLocal.forEach((lp) => mergedMap.set(lp.id, lp));

          // cloud updates
          cloudProjects.forEach((cp: any) => {
            const profile = cp.productionProfile
              ? validateProductionProfile(cp.productionProfile)
              : migrateLegacyProject(cp);

            mergedMap.set(cp.id, {
              id: cp.id,
              name: cp.name || profile.projectName,
              productionProfile: profile,
              workflowStage: cp.workflowStage || 'overview',
              createdAt: cp.createdAt ? new Date(cp.createdAt).getTime() : profile.createdAt,
              updatedAt: cp.updatedAt ? new Date(cp.updatedAt).getTime() : Date.now(),
              editorData: cp,
            });
          });

          return Array.from(mergedMap.values());
        });
      },
      (err) => {
        setIsLoadingProjects(false);
        console.warn('Firestore subscription fallback to local storage:', err);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Create new project
  const createProject = useCallback((name: string, ratio: ProjectAspectRatio) => {
    const newProfile = createDefaultProductionProfile(undefined, ratio, name);
    const newProj: CreatorProject = {
      id: newProfile.projectId,
      name: newProfile.projectName,
      productionProfile: newProfile,
      workflowStage: 'overview',
      createdAt: newProfile.createdAt,
      updatedAt: newProfile.updatedAt,
    };

    setProjects((prev) => [newProj, ...prev]);
    setActiveProjectId(newProj.id);

    // Save to Firestore if signed in
    if (user) {
      saveEditorProject(user.uid, {
        id: newProj.id,
        name: newProj.name,
        productionProfile: newProj.productionProfile,
        settings: {
          id: newProj.id,
          name: newProj.name,
          resolution: {
            id: ratio,
            label: ratio === '9:16' ? '9:16 Vertical (Shorts)' : '16:9 Widescreen (1080p)',
            width: newProfile.frameWidth,
            height: newProfile.frameHeight,
            aspectRatio: ratio === '9:16' ? '9 / 16' : '16 / 9',
            description: ratio === '9:16' ? 'YouTube Shorts / Reels' : 'YouTube Standard',
          },
          frameRate: newProfile.frameRate,
          duration: 60,
          backgroundColor: '#000000',
          createdAt: newProj.createdAt,
          updatedAt: newProj.updatedAt,
        },
      }).catch((e) => console.warn('Could not save new project to cloud:', e));
    }

    return newProj;
  }, [user]);

  // Select project
  const selectProject = useCallback((projectId: string) => {
    const exists = projects.find((p) => p.id === projectId);
    if (exists) {
      setActiveProjectId(projectId);
    }
  }, [projects]);

  // Update profile
  const updateActiveProfile = useCallback((changes: Partial<ProductionProfile>) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== activeProjectId) return p;
        const updated = updateProductionProfile(p.productionProfile, changes);
        return {
          ...p,
          name: updated.projectName,
          productionProfile: updated,
          updatedAt: Date.now(),
        };
      })
    );
  }, [activeProjectId]);

  // Switch aspect ratio with automatic dimension recalculation
  const switchAspectRatio = useCallback((newRatio: ProjectAspectRatio) => {
    updateActiveProfile({ aspectRatio: newRatio });
  }, [updateActiveProfile]);

  // Save current project with additional metadata
  const saveCurrentProject = useCallback(async (additionalData?: Partial<CreatorProject>) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== activeProjectId) return p;
        return {
          ...p,
          ...additionalData,
          updatedAt: Date.now(),
        };
      })
    );

    if (user && activeProject) {
      await saveEditorProject(user.uid, {
        id: activeProject.id,
        name: activeProject.name,
        productionProfile: activeProject.productionProfile,
        workflowStage: activeWorkflowStage,
        ...additionalData,
        settings: {
          id: activeProject.id,
          name: activeProject.name,
          resolution: {
            id: activeProject.productionProfile.aspectRatio,
            label: activeProject.productionProfile.aspectRatio === '9:16' ? '9:16 Vertical (Shorts)' : '16:9 Widescreen (1080p)',
            width: activeProject.productionProfile.frameWidth,
            height: activeProject.productionProfile.frameHeight,
            aspectRatio: activeProject.productionProfile.aspectRatio === '9:16' ? '9 / 16' : '16 / 9',
            description: activeProject.productionProfile.aspectRatio === '9:16' ? 'YouTube Shorts / Reels' : 'YouTube Standard',
          },
          frameRate: activeProject.productionProfile.frameRate,
          duration: 60,
          backgroundColor: '#000000',
          createdAt: activeProject.createdAt,
          updatedAt: Date.now(),
        },
      });
    }
  }, [user, activeProject, activeProjectId, activeWorkflowStage]);

  // Delete project
  const deleteProjectById = useCallback(async (projectId: string) => {
    setProjects((prev) => {
      const remaining = prev.filter((p) => p.id !== projectId);
      if (remaining.length === 0) {
        // Always retain at least one project
        const fresh = createDefaultProductionProfile();
        return [
          {
            id: fresh.projectId,
            name: fresh.projectName,
            productionProfile: fresh,
            workflowStage: 'overview',
            createdAt: fresh.createdAt,
            updatedAt: fresh.updatedAt,
          },
        ];
      }
      return remaining;
    });

    if (activeProjectId === projectId) {
      const next = projects.find((p) => p.id !== projectId);
      if (next) setActiveProjectId(next.id);
    }

    if (user) {
      await deleteEditorProject(user.uid, projectId).catch((e) =>
        console.warn('Could not delete from cloud:', e)
      );
    }
  }, [user, activeProjectId, projects]);

  return (
    <ProjectContext.Provider
      value={{
        activeProject,
        activeProfile,
        projects,
        isLoadingProjects,
        createProject,
        selectProject,
        updateActiveProfile,
        switchAspectRatio,
        saveCurrentProject,
        deleteProjectById,
        isCommandPaletteOpen,
        setCommandPaletteOpen,
        isJarvisAssistantOpen,
        setJarvisAssistantOpen,
        activeWorkflowStage,
        setActiveWorkflowStage,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export function useProject(): ProjectContextType {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
