---
title: Shirecraft Platform Core
description: Pure Java library — in-memory search indexes, catalog fuzzy search, datapack product specs
---

# Shirecraft Platform Core

**What this is:** Gradle **`java-library`** artifact `shirecraft-platform-core` (`com.shirecraft`, v**1.0.0** in `gradle.properties`) — platform-agnostic Java **26** (toolchain **25**) shared by Fabric datapack products and future loaders. No Minecraft or Bukkit APIs on the classpath.

## Build entry (`build.gradle.kts`)

- **Outputs:** `shirecraft-platform-core` JAR + sources JAR
- **Test:** JUnit 5 (`MultiFieldSearchIndexTest`, …)
- **Deps:** `compileOnly` JetBrains annotations; no game runtime

## Package map (implementation)

| Package | Types | Role |
| ------- | ----- | ---- |
| `com.shirecraft.platform.search.index` | `MultiFieldSearchIndex`, `InvertedFieldIndex`, `TrigramFieldIndex`, `CachedSearchIndex`, `SearchIndexPort` | In-memory inverted / trigram indexes, token normalization |
| `com.shirecraft.platform.search.catalog` | `FuzzyCatalogSearch`, `CatalogSearchQuery`, `CatalogSearchMode`, `CatalogSearchFields` | Catalog-style fuzzy search over indexed rows |
| `com.shirecraft.platform.datapack` | `DatapackProductSpec`, `AdminMacroField` | Declarative datapack product metadata + admin macro fields |
| `com.shirecraft.platform.text` | `LegacyColors` | Shared legacy color parsing |

## Consumers

- **`shirecraft-fabric-utils`** — `api("com.shirecraft:shirecraft-platform-core")` via `includeBuild`
- Fabric datapack products embed search + spec types without pulling Paper

## Failure modes

| Issue | Check |
| ----- | ----- |
| Search scoring drift | `MultiFieldSearchIndex` unit tests; normalize via `SearchTokenNormalizer` |
| Fabric product missing specs | Consumer must depend on this artifact, not duplicate POJOs |

---

**Sources (audited):** `shirecraft-platform-core/build.gradle.kts`, `shirecraft-platform-core/gradle.properties`, `shirecraft-platform-core/src/main/java/com/shirecraft/platform/search/index/MultiFieldSearchIndex.java`, `shirecraft-platform-core/src/main/java/com/shirecraft/platform/datapack/DatapackProductSpec.java`