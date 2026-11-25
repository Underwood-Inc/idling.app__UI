'use client';

import { TOOLS_CARD_GENERATOR_EN, type ToolsCardGeneratorEnCopy } from '$i18n-source/toolsCardGenerator.en';
import { TOOLS_SVG_CONVERTER_EN, type ToolsSvgConverterEnCopy } from '$i18n-source/toolsSvgConverter.en';
import { resolveCatalogFromLl } from '@molecules/i18n/resolveEnCatalog';
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useIdlingLocale } from '../components/locale/IdlingLocaleProvider';

export interface ToolsCopyValue {
  cardGenerator: ToolsCardGeneratorEnCopy;
  svgConverter: ToolsSvgConverterEnCopy;
}

const defaultTools: ToolsCopyValue = {
  cardGenerator: TOOLS_CARD_GENERATOR_EN,
  svgConverter: TOOLS_SVG_CONVERTER_EN,
};

const ToolsCopyContext = createContext<ToolsCopyValue>(defaultTools);

export function ToolsCopyProvider({ children }: { children: ReactNode }) {
  const { ll } = useIdlingLocale();
  const value = useMemo((): ToolsCopyValue => {
    const tools = ll.tools as Record<string, unknown> | undefined;
    return {
      cardGenerator: resolveCatalogFromLl(
        TOOLS_CARD_GENERATOR_EN,
        tools?.cardGenerator as Record<string, unknown>
      ),
      svgConverter: resolveCatalogFromLl(
        TOOLS_SVG_CONVERTER_EN,
        tools?.svgConverter as Record<string, unknown>
      ),
    };
  }, [ll]);
  return <ToolsCopyContext.Provider value={value}>{children}</ToolsCopyContext.Provider>;
}

export function useToolsCopy(): ToolsCopyValue {
  return useContext(ToolsCopyContext);
}