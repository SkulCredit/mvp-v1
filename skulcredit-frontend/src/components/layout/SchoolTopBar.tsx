import React, { ReactNode } from "react";
import DashboardTopBar from "./DashboardTopBar";
import { TopBarControls } from "./index";
import GlobalSearch from "./GlobalSearch";

interface SchoolTopBarProps {
  left?: ReactNode;
  onMobileMenuOpen?: () => void;
}

const SchoolTopBar: React.FC<SchoolTopBarProps> = ({
  left,
  onMobileMenuOpen,
}) => (
  <DashboardTopBar
    left={left ?? <GlobalSearch />}
    onMobileMenuOpen={onMobileMenuOpen}
    rightExtra={<TopBarControls />}
  />
);

export default SchoolTopBar;
