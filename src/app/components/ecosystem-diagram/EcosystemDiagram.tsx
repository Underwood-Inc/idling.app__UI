'use client';

import { useEffect, useRef, useState } from 'react';
import { Card } from '../card/Card';
import styles from './EcosystemDiagram.module.css';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'dataflow' | 'packages'>('overview');

  useEffect(() => {
    // Load mermaid from CDN if not already loaded
    if (!scriptLoadedRef.current && typeof window !== 'undefined') {
      const existingScript = document.querySelector('script[src*="mermaid"]');
      
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
        script.async = true;
        script.onload = () => {
          scriptLoadedRef.current = true;
          initializeMermaid();
        };
        document.head.appendChild(script);
      } else {
        scriptLoadedRef.current = true;
        initializeMermaid();
      }
    }
  }, []);

  useEffect(() => {
    // Re-render diagram when tab changes
    if (scriptLoadedRef.current && diagramRef.current) {
      initializeMermaid();
    }
  }, [activeTab]);

  const initializeMermaid = () => {
    if (typeof window !== 'undefined' && (window as any).mermaid) {
      (window as any).mermaid.initialize({
        startOnLoad: true,
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

      // Re-render diagram
      if (diagramRef.current) {
        (window as any).mermaid.contentLoaded();
      }
    }
  };

  const diagrams = {
    overview: `
graph TB
    subgraph WebApps["🌐 Web Applications"]
        Main[idling.app]
        Card[Card Generator]
        SVG[SVG Converter]
        Social[Social Platform]
        ModsHub[Mods Hub]
        ControlPanel[OBS Control Panel]
    end
    
    subgraph ServerlessAPIs["☁️ Serverless APIs (Cloudflare Workers)"]
        Auth[Auth Service]
        Access[Access Hub]
        ModsAPI[Mods API]
        ChatSig[Chat Signaling]
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
    ChatSig --> KV
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
    
    class Main,Card,SVG,Social,ModsHub,ControlPanel web
    class Auth,Access,ModsAPI,ChatSig,Customer,Game,Streamkit api
    class Compressy,Rituals,Trials mc
    class PG,KV,R2,IDB storage
    `,
    dataflow: `
graph LR
    subgraph Users["👥 Users"]
        WebUser[Web Visitors]
        MCUser[Minecraft Players]
        Streamer[Streamers]
    end
    
    subgraph Apps["🌐 Applications"]
        Web[idling.app<br/>Next.js]
        Mods[Mods Hub<br/>React]
        OBS[OBS Panel<br/>Svelte]
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
    end
    
    WebUser --> Web
    MCUser --> Mods
    Streamer --> OBS
    
    Web --> AuthAPI
    Web --> SQL
    Mods --> ModsAPI
    OBS --> StreamAPI
    
    AuthAPI --> KV
    ModsAPI --> R2
    ModsAPI --> KV
    StreamAPI --> KV
    
    classDef user fill:#458588,stroke:#83a598,stroke-width:2px,color:#ebdbb2
    classDef app fill:#98971a,stroke:#b8bb26,stroke-width:2px,color:#ebdbb2
    classDef api fill:#b16286,stroke:#d3869b,stroke-width:2px,color:#ebdbb2
    classDef data fill:#cc241d,stroke:#fb4934,stroke-width:2px,color:#ebdbb2
    
    class WebUser,MCUser,Streamer user
    class Web,Mods,OBS app
    class AuthAPI,ModsAPI,StreamAPI api
    class SQL,KV,R2 data
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
        Chat[chat]
        OTPLogin[otp-login]
        AudioPlayer[audio-player]
        IdleGame[idle-game-overlay]
        AdCarousel[ad-carousel]
        Tooltip[tooltip]
        StatusFlair[status-flair]
        PortalSelect[portal-select]
    end
    
    subgraph Utils["🛠️ Utility Packages"]
        P2PStorage[p2p-storage]
        SearchParser[search-query-parser]
        VirtTable[virtualized-table]
        ASCIIMoji[asciimoji]
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
    Chat --> P2PStorage
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
    class Chat,OTPLogin,AudioPlayer,IdleGame,AdCarousel,Tooltip,StatusFlair,PortalSelect ui
    class P2PStorage,SearchParser,VirtTable,ASCIIMoji,DOMUtils,ErrorUtils,AnimUtils util
    class Use3D,UseCursor,UseFlip hook
    class E2E,ErrorMap test
    `,
  };

  return (
    <Card width="full" className={styles.diagram}>
      <div className={styles.diagram__header}>
        <h3 className={styles.diagram__title}>🏗️ Ecosystem Architecture</h3>
        <p className={styles.diagram__subtitle}>
          Complete view of how 40+ projects work together across 3 perspectives
        </p>
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'overview' ? styles['tab--active'] : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          🏢 System Overview
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'dataflow' ? styles['tab--active'] : ''}`}
          onClick={() => setActiveTab('dataflow')}
        >
          🔄 Data Flow
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'packages' ? styles['tab--active'] : ''}`}
          onClick={() => setActiveTab('packages')}
        >
          📦 Package Ecosystem
        </button>
      </div>

      {/* Diagram Content */}
      <div 
        ref={diagramRef} 
        className={styles.diagram__content}
        dangerouslySetInnerHTML={{ 
          __html: `<div class="mermaid">${diagrams[activeTab]}</div>` 
        }}
      />

      {/* Description based on active tab */}
      <div className={styles.diagram__footer}>
        {activeTab === 'overview' && (
          <p className={styles.footer__text}>
            <strong>System overview:</strong> 6 web applications (idling.app, Card Generator, SVG Converter, Social Platform, Mods Hub, OBS Control Panel) connect to 7 Cloudflare Workers APIs (Auth, Access, Mods, Chat, Customer, Game, Streamkit). 3 Minecraft mods integrate via Mods API. All data stored in PostgreSQL, Cloudflare KV, R2 Cloud, and IndexedDB.
          </p>
        )}
        {activeTab === 'dataflow' && (
          <p className={styles.footer__text}>
            <strong>Data flow:</strong> Web visitors, Minecraft players, and streamers interact with their respective applications. Apps authenticate via Auth API and store data in PostgreSQL (user data), KV Storage (serverless state), and R2 Cloud (file storage). Minecraft mods sync through Mods API to R2/KV storage.
          </p>
        )}
        {activeTab === 'packages' && (
          <p className={styles.footer__text}>
            <strong>Package ecosystem:</strong> 26 NPM packages organized by purpose: Core (api-framework, auth-store, service-client, schemas, shared-components with React/Svelte variants), UI (chat, otp-login, audio-player, idle-game-overlay, ad-carousel, tooltip, status-flair, portal-select), Utils (p2p-storage, search-parser, virtualized-table, asciimoji, dom-utils, error-utils, animation-utils), Hooks (use-3d-transform, use-cursor-tracking, use-flip-card), Testing (e2e-helpers, error-mapping). All packages work together with clear dependencies.
          </p>
        )}
      </div>
    </Card>
  );
}
