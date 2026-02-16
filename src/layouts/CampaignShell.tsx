import { Outlet, useOutletContext } from "react-router-dom";

export function CampaignShell() {
  const context = useOutletContext();
  return <Outlet context={context} />;
}
