import { PlanProvider } from "@/components/PlanProvider";
import { PlannerFrame } from "@/components/PlannerFrame";

export default function ServiceLayout({ children }: { children: React.ReactNode }) {
  return (
    <PlanProvider>
      <PlannerFrame>{children}</PlannerFrame>
    </PlanProvider>
  );
}
