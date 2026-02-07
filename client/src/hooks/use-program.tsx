import { createContext, ReactNode, useContext, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useAuth } from "./use-auth";
import type { Program, ProgramMembership } from "@shared/schema";

type ProgramMembershipWithProgram = ProgramMembership & { program: Program };

type ActiveProgramData = {
  programId: string | null;
  program: Program | null;
  membership: ProgramMembership | null;
  role: string | null;
};

type ProgramContextType = {
  programs: ProgramMembershipWithProgram[];
  isLoadingPrograms: boolean;
  activeProgram: ActiveProgramData | null;
  isLoadingActiveProgram: boolean;
  activeProgramRole: string | null;
  setActiveProgram: (programId: string) => void;
  isSettingProgram: boolean;
  needsProgramSelection: boolean;
};

export const ProgramContext = createContext<ProgramContextType | null>(null);

export function ProgramProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const {
    data: programs = [],
    isLoading: isLoadingPrograms,
  } = useQuery<ProgramMembershipWithProgram[]>({
    queryKey: ["/api/programs"],
    enabled: !!user,
  });

  const {
    data: activeProgram,
    isLoading: isLoadingActiveProgram,
  } = useQuery<ActiveProgramData>({
    queryKey: ["/api/programs/active"],
    enabled: !!user,
  });

  const setActiveProgramMutation = useMutation({
    mutationFn: async (programId: string) => {
      const res = await apiRequest("POST", "/api/programs/active", { programId });
      return await res.json();
    },
    onSuccess: (data: ActiveProgramData) => {
      queryClient.setQueryData(["/api/programs/active"], data);
      queryClient.invalidateQueries({ queryKey: ["/api/cohorts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tracks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
    },
  });

  const setActiveProgram = useCallback((programId: string) => {
    setActiveProgramMutation.mutate(programId);
  }, [setActiveProgramMutation]);

  const needsProgramSelection = !!user && !isLoadingPrograms && !isLoadingActiveProgram && programs.length > 0 && !activeProgram?.programId;

  return (
    <ProgramContext.Provider
      value={{
        programs,
        isLoadingPrograms,
        activeProgram: activeProgram ?? null,
        isLoadingActiveProgram,
        activeProgramRole: activeProgram?.role ?? null,
        setActiveProgram,
        isSettingProgram: setActiveProgramMutation.isPending,
        needsProgramSelection,
      }}
    >
      {children}
    </ProgramContext.Provider>
  );
}

export function useProgram() {
  const context = useContext(ProgramContext);
  if (!context) {
    throw new Error("useProgram must be used within a ProgramProvider");
  }
  return context;
}
