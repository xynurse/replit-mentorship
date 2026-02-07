import { useProgram } from "@/hooks/use-program";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ChevronsUpDown, Check, Building2 } from "lucide-react";

export function ProgramSwitcher() {
  const { programs, activeProgram, setActiveProgram, isSettingProgram } = useProgram();

  if (programs.length <= 1) {
    return null;
  }

  const currentProgram = activeProgram?.program;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between gap-2"
          data-testid="button-program-switcher"
          disabled={isSettingProgram}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="h-4 w-4 shrink-0" />
            <span className="truncate text-sm">
              {currentProgram?.name || "Select Program"}
            </span>
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width]">
        <DropdownMenuLabel>Switch Program</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {programs.map((membership) => (
          <DropdownMenuItem
            key={membership.id}
            onClick={() => setActiveProgram(membership.programId)}
            className="flex items-center justify-between gap-2 cursor-pointer"
            data-testid={`menu-item-program-${membership.programId}`}
          >
            <span className="truncate">{membership.program.name}</span>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs">
                {membership.role}
              </Badge>
              {activeProgram?.programId === membership.programId && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
