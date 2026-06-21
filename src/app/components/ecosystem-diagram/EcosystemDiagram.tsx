'use client';

import { enhanceMermaidDiagrams } from '@lib/mermaid/mermaidViewer';
import { SiteIcon } from '@molecules/lucide/SiteIcon';
import { ECOSYSTEM_TABS } from '@molecules/lucide/siteIconCatalog';
import { useCallback, useEffect, useRef, useState } from 'react';
import '../../../css/mermaid.css';
import { Card } from '../card/Card';
import styles from './EcosystemDiagram.module.css';

interface MermaidApi {
  initialize: (config: Record<string, unknown>) => void;
  run: (config: { nodes: Element[] }) => Promise<void>;
}

declare global {
  interface Window {
    mermaid?: MermaidApi;
  }
}

type DiagramTab = 'overview' | 'dataflow' | 'packages';

/**
 * Ecosystem Architecture Diagram - COMPREHENSIVE VERSION
 *
 * Shows 3 comprehensive diagrams via tabs:
 * 1. System Overview - All major applications and services
 * 2. Data Flow - How data moves through the ecosystem
 * 3. Package Dependencies - How NPM packages interconnect
 */
export function EcosystemDiagram() {
  const diagramRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);
  const [activeTab, setActiveTab] = useState<DiagramTab>('overview');

  const initializeMermaid = useCallback(async () => {
    if (typeof window === 'undefined' || !window.mermaid || !diagramRef.current) {
      return;
    }

    window.mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      themeVariables: {
        primaryColor: '#edae49',
        primaryTextColor: '#d5c4a1',
        primaryBorderColor: '#edae49',
        lineColor: '#a89984',
        secondaryColor: '#98971a',
        tertiaryColor: '#458588',
        background: '#1d2021',
        mainBkg: '#282828',
        secondBkg: '#3c3836',
        textColor: '#ebdbb2',
        border1: '#665c54',
        border2: '#7c6f64',
      },
    });

    const node = diagramRef.current.querySelector('.mermaid');
    if (!node) return;

    node.removeAttribute('data-enhanced');
    await window.mermaid.run({ nodes: [node] });
    enhanceMermaidDiagrams(diagramRef.current);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onScriptReady = () => {
      scriptLoadedRef.current = true;
      void initializeMermaid();
    };

    if (window.mermaid) {
      onScriptReady();
      return;
    }

    const existingScript = document.querySelector('script[src*="mermaid"]');
    if (existingScript) {
      existingScript.addEventListener('load', onScriptReady, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
    script.async = true;
    script.onload = onScriptReady;
    document.head.appendChild(script);
  }, [initializeMermaid]);

  useEffect(() => {
    if (scriptLoadedRef.current) {
      void initializeMermaid();
    }
  }, [activeTab, initializeMermaid]);

  const diagrams: Record<DiagramTab, string> = {
    overview: `
graph TB
    subgraph WebApps["🌐 Web Applications"]
        Main[idling.app]
        Card[Card Generator]
        SVG[SVG Converter]
        Social[Social Platform]
        ModsHub[Mods Hub]
        ControlPanel[OBS Control Panel]
        Mappy[Mappy Desktop]
    end
    
    subgraph ServerlessAPIs["☁️ Serverless APIs (Cloudflare Workers)"]
        Auth[Auth Service]
        Access[Access Hub]
        ModsAPI[Mods API]
        Customer[Customer API]
        Game[Game API]
        Streamkit[Streamkit API]
    end
    
    subgraph Minecraft["🎮 Minecraft"]
        Compressy[Compressy Mod]
        Rituals[Rituals Datapack]
        Trials[Trials Modpack]
    end
    
    subgraph Storage["💾 Storage"]
        PG[(PostgreSQL)]
        KV[(KV Storage)]
        R2[(R2 Cloud)]
        IDB[(IndexedDB)]
    end
    
    Mappy --> IDB
    
    Main --> Auth
    Main --> PG
    Card --> Main
    SVG --> Main
    Social --> PG
    ModsHub --> ModsAPI
    ControlPanel --> Streamkit
    ControlPanel --> IDB
    
    Auth --> KV
    Access --> KV
    ModsAPI --> R2
    ModsAPI --> KV
    Customer --> KV
    Game --> KV
    Streamkit --> KV
    
    Compressy --> ModsAPI
    Rituals --> ModsAPI
    Trials --> ModsAPI
    
    classDef web fill:#458588,stroke:#83a598,stroke-width:2px,color:#ebdbb2
    classDef api fill:#b16286,stroke:#d3869b,stroke-width:2px,color:#ebdbb2
    classDef mc fill:#d79921,stroke:#fabd2f,stroke-width:2px,color:#ebdbb2
    classDef storage fill:#cc241d,stroke:#fb4934,stroke-width:2px,color:#ebdbb2
    
    class Main,Card,SVG,Social,ModsHub,ControlPanel,Mappy web
    class Auth,Access,ModsAPI,Customer,Game,Streamkit api
    class Compressy,Rituals,Trials mc
    class PG,KV,R2,IDB storage
    `,
    dataflow: `
graph LR
    subgraph Users["👥 Users"]
        WebUser[Web Visitors]
        MCUser[Minecraft Players]
        Streamer[Streamers]
        Explorer[Map Explorers]
    end
    
    subgraph Apps["🌐 Applications"]
        Web[idling.app<br/>Next.js]
        Mods[Mods Hub<br/>React]
        OBS[OBS Panel<br/>Svelte]
        Maps[Mappy<br/>Tauri Desktop]
    end
    
    subgraph APIs["☁️ APIs"]
        AuthAPI[Auth]
        ModsAPI[Mods]
        StreamAPI[Streamkit]
    end
    
    subgraph Data["💾 Data"]
        SQL[(PostgreSQL)]
        KV[(KV Store)]
        R2[(R2 Files)]
        Local[(IndexedDB)]
    end
    
    WebUser --> Web
    MCUser --> Mods
    Streamer --> OBS
    Explorer --> Maps
    
    Web --> AuthAPI
    Web --> SQL
    Mods --> ModsAPI
    OBS --> StreamAPI
    Maps --> Local
    
    AuthAPI --> KV
    ModsAPI --> R2
    ModsAPI --> KV
    StreamAPI --> KV
    
    classDef user fill:#458588,stroke:#83a598,stroke-width:2px,color:#ebdbb2
    classDef app fill:#98971a,stroke:#b8bb26,stroke-width:2px,color:#ebdbb2
    classDef api fill:#b16286,stroke:#d3869b,stroke-width:2px,color:#ebdbb2
    classDef data fill:#cc241d,stroke:#fb4934,stroke-width:2px,color:#ebdbb2
    
    class WebUser,MCUser,Streamer,Explorer user
    class Web,Mods,OBS,Maps app
    class AuthAPI,ModsAPI,StreamAPI api
    class SQL,KV,R2,Local data
    `,
    packages: `
graph TB
    subgraph Core["🔧 Core Packages"]
        APIFw[api-framework]
        AuthStore[auth-store]
        ServiceClient[service-client]
        Schemas[schemas]
        SharedComp[shared-components]
    end
    
    subgraph UI["🎨 UI Packages"]
        OTPLogin[otp-login]
        AudioPlayer[audio-player]
        IdleGame[idle-game-overlay]
        AdCarousel[ad-carousel]
        Tooltip[tooltip]
        StatusFlair[status-flair]
        PortalSelect[portal-select]
    end
    
    subgraph Utils["🛠️ Utility Packages"]
        SearchParser[search-query-parser]
        VirtTable[virtualized-table]
        DOMUtils[dom-utils]
        ErrorUtils[error-utils]
        AnimUtils[animation-utils]
    end
    
    subgraph Hooks["🎣 React Hooks"]
        Use3D[use-3d-transform]
        UseCursor[use-cursor-tracking]
        UseFlip[use-flip-card]
    end
    
    subgraph Testing["🧪 Testing"]
        E2E[e2e-helpers]
        ErrorMap[error-mapping]
    end
    
    APIFw --> AuthStore
    APIFw --> ServiceClient
    SharedComp --> DOMUtils
    OTPLogin --> AuthStore
    AudioPlayer --> DOMUtils
    IdleGame --> AnimUtils
    SearchParser --> DOMUtils
    VirtTable --> DOMUtils
    Tooltip --> SharedComp
    StatusFlair --> SharedComp
    
    classDef core fill:#b16286,stroke:#d3869b,stroke-width:2px,color:#ebdbb2
    classDef ui fill:#458588,stroke:#83a598,stroke-width:2px,color:#ebdbb2
    classDef util fill:#98971a,stroke:#b8bb26,stroke-width:2px,color:#ebdbb2
    classDef hook fill:#d79921,stroke:#fabd2f,stroke-width:2px,color:#ebdbb2
    classDef test fill:#689d6a,stroke:#8ec07c,stroke-width:2px,color:#ebdbb2
    
    class APIFw,AuthStore,ServiceClient,Schemas,SharedComp core
    class OTPLogin,AudioPlayer,IdleGame,AdCarousel,Tooltip,StatusFlair,PortalSelect ui
    class SearchParser,VirtTable,DOMUtils,ErrorUtils,AnimUtils util
    class Use3D,UseCursor,UseFlip hook
    class E2E,ErrorMap test
    `,
  };

  return (
    <Card width="full" className={styles.diagram}>
      <div className={styles.diagram__header}>
        <h3 className={styles.diagram__title}>
          <SiteIcon id="construction" className={styles.diagram__titleIcon} sizeRem={1} />
          Ecosystem Architecture
        </h3>
        <p className={styles.diagram__subtitle}>
          How 38+ projects connect — pick a lens below
        </p>
      </div>

      <div className={styles.tabs}>
        {ECOSYSTEM_TABS.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles['tab--active'] : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <SiteIcon id={tab.iconId} className={styles.tab__icon} sizeRem={1} />
            {tab.label}
          </button>
        ))}
      </div>

      <div
        ref={diagramRef}
        className={styles.diagram__content}
        dangerouslySetInnerHTML={{
          __html: `<div class="mermaid">${diagrams[activeTab]}</div>`,
        }}
      />

      <div className={styles.diagram__footer}>
        {activeTab === 'overview' && (
          <p className={styles.footer__text}>
            <strong>System overview:</strong> 7 web/desktop apps (including Mappy), 6 Cloudflare
            Workers APIs, 3 Minecraft mods via Mods API, and storage across PostgreSQL, KV, R2, and
            IndexedDB.
          </p>
        )}
        {activeTab === 'dataflow' && (
          <p className={styles.footer__text}>
            <strong>Data flow:</strong> Visitors, players, streamers, and map explorers each reach
            their app surface. Web and mods use APIs; Mappy stays offline-first with local
            IndexedDB — no account required.
          </p>
        )}
        {activeTab === 'packages' && (
          <p className={styles.footer__text}>
            <strong>Package ecosystem:</strong> 23 NPM packages — core framework, UI, utilities,
            hooks, and testing helpers — shared across React, Svelte, and Cloudflare surfaces.
          </p>
        )}
      </div>
    </Card>
  );
}
