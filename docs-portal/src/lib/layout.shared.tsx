import React from 'react';
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { ExternalLink } from 'lucide-react';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <div className="flex items-baseline gap-2 text-left">
          <span className="font-bold text-base">NetPredict</span>
          <span className="text-fd-muted-foreground font-light text-base">|</span>
          <span className="text-sm text-fd-muted-foreground font-medium">Docs Platform</span>
        </div>
      ),
    },
    links: [
      {
        text: 'NetPredict App',
        url: 'http://localhost:5173',
        external: true,
        icon: <ExternalLink className="size-4" />,
      },
    ],
  };
}
