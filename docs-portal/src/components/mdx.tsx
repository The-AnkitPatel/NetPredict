import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';
import { Callout } from 'fumadocs-ui/components/callout';
import { Files } from 'fumadocs-ui/components/files';
import {
  StatusBadge,
  MetricCard,
  ArchitectureBlock,
  WorkflowTimeline,
  WorkflowStep,
  ApiReference,
  ApiParam,
  CommandReference,
  ComparisonTable,
} from './custom-components';
import {
  DiagramFrame,
  DNode,
  Connector,
  LayerBox,
} from './diagram';

export {
  StatusBadge,
  MetricCard,
  ArchitectureBlock,
  WorkflowTimeline,
  WorkflowStep,
  ApiReference,
  ApiParam,
  CommandReference,
  ComparisonTable,
  DiagramFrame,
  DNode,
  Connector,
  LayerBox,
  Callout,
};

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Accordion,
    Accordions,
    Callout,
    Files,
    DiagramFrame,
    DNode,
    Connector,
    LayerBox,
    StatusBadge,
    MetricCard,
    ArchitectureBlock,
    WorkflowTimeline,
    WorkflowStep,
    ApiReference,
    ApiParam,
    CommandReference,
    ComparisonTable,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
