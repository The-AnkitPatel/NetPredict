import React from 'react';
import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import { CustomThemeSwitch } from '@/components/theme-toggle';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DocsLayout
      tree={source.getPageTree()}
      {...baseOptions()}
      themeSwitch={{
        component: <CustomThemeSwitch key="sidebar-theme-switch" />,
      }}
    >
      {children}
    </DocsLayout>
  );
}
