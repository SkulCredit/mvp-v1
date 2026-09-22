import React, { ReactNode } from "react";
import DashboardTopBar from "./DashboardTopBar";
import { TopBarControls } from "./index";

interface SchoolTopBarProps {
  left?: ReactNode;
  onMobileMenuOpen?: () => void;
}

const SchoolTopBar: React.FC<SchoolTopBarProps> = ({
  left,
  onMobileMenuOpen,
}) => (
  <DashboardTopBar
    left={left}
    onMobileMenuOpen={onMobileMenuOpen}
    rightExtra={<TopBarControls />}
  />
);

export default SchoolTopBar;
