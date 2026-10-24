import { Outlet } from "react-router-dom";

import SitePage from "@/components/SitePage";

const DocsLayout = () => (
  <SitePage>
    <Outlet />
  </SitePage>
);

export default DocsLayout;
