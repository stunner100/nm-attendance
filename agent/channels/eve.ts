import { eveChannel } from "eve/channels/eve";

import { hrAdminEveAuth } from "@/lib/eve-session-auth";

export default eveChannel({
  auth: hrAdminEveAuth,
});
