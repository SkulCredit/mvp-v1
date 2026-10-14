import React from 'react';
import { icons, LucideProps } from 'lucide-react';

interface IconProps extends LucideProps {
  name: string;
}

const Icon: React.FC<IconProps> = ({ name, className, ...props }) => {
  if (!name) return null;

  const componentName = name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  const LucideIcon = icons[componentName as keyof typeof icons];

  if (!LucideIcon) {
    console.warn(`Icon "${name}" not found in lucide-react`);
    return null;
  }

  return <LucideIcon className={className} {...props} />;
};

export default Icon;
