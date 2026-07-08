import { AdminPageIntro } from "@/components/hr/admin-page-shell";
import { HrAssistantChat } from "@/components/hr/hr-assistant-chat";

export default function AdminAssistantPage() {
  return (
    <div className="space-y-6">
      <AdminPageIntro description="Chat with the HR assistant to triage alerts, review employee performance, and draft coaching or growth plan text." />
      <HrAssistantChat />
    </div>
  );
}
