import { AdminPageIntro } from "@/components/hr/admin-page-shell";
import { HrAssistantChat } from "@/components/hr/hr-assistant-chat";
import { createHrEveProxyToken } from "@/lib/eve-proxy-auth";
import { requireAdminPage } from "@/lib/admin-auth";

export default async function AdminAssistantPage() {
  const session = await requireAdminPage("/admin/assistant");
  const eveAccessToken = await createHrEveProxyToken(session);

  return (
    <div className="space-y-6">
      <AdminPageIntro description="Chat with the HR assistant to triage alerts, review employee performance, and draft coaching or growth plan text." />
      <HrAssistantChat eveAccessToken={eveAccessToken} />
    </div>
  );
}
