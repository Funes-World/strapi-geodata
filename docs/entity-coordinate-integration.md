---
title: Geodata integration with Entity coordinate metadata
status: current
owner: FUNES / CMS
last_updated: 2026-10-30
---

# Geodata integration with Entity coordinate metadata

## Overview

Keep the existing Geodata map, coordinate inputs, address search and Set Location / Search controls. Integrate actual Entity point edits with the CMS coordinateMetadata field while retaining native Content Manager saving, publication and localization.

## Scope

Metadata integration applies only to `api::entity.entity` and its `coordinates` field. Other content types retain their existing Geodata behavior. The plugin uses the Content Manager peer dependency for native form state and field permissions. During integration into local CMS develop, its Content Manager peer was aligned to the host's existing Strapi 5.59.0 security release; the host packages and lockfiles are retained.

## User-visible behavior

Set Location, successful address search and map selection update the existing point. For Entity, permitted companion fields receive manual WGS84 metadata with provider `unknown` and a Google coordinate-query URL. Save and Publish remain the native page actions. Initial loading, native form reset and Fill in from another locale do not replace existing raw coordinates, CRS or source.

The map marker follows point values supplied by the form, including adoption and language changes. Existing native button sizes use `L`. OSM attribution links to the provider's copyright page.

## Technical approach

Use the current native document to select create or update field permissions. Each generated companion field passes the native `canUserAction` check independently. The integration does not require metadata permission to edit the existing point. An asynchronous search result must still belong to its originating model, documentId, locale and draft/published form, and must not target a disabled form.

The existing lifecycle derives latitude, longitude and geohash only when the corresponding Geodata field is present in the write payload. An unrelated partial update must not clear those derived values.

The query bridge explicitly calls `useQueryParams<Parameters<typeof buildValidParams>[0]>()`. The plugin's legacy lock resolves Strapi Admin 5.6.0, whose hook has no default query type, while the Content Manager peer uses 5.59.0. Without an explicit generic, a clean plugin install infers `object` and declaration generation rejects `buildValidParams(query)` with TS2345. Deriving the input type from the actual converter preserves its query contract without casts, runtime query changes or permission bypasses.

OSM tiles use `https://tile.openstreetmap.org/{z}/{x}/{y}.png`, `referrerPolicy="strict-origin"` and `crossOrigin="anonymous"`. These image requests send only the site origin, without editor paths, query parameters or cross-origin credentials; the CMS-wide referrer policy is unchanged.

## Edge cases / failure modes

Native copy/reset operations preserve provenance. Coordinates-only roles can edit their existing field without gaining metadata/map-field rights. A response arriving after navigation cannot fill another Entity or language. Original native persistence, relation and timestamp behavior is retained.

Checking only against a prepared CMS installation can conceal dependency-resolution differences: removed plugin-local Strapi packages resolve to the newer host packages. Release verification must also build the plugin after its own clean dependency installation, including TypeScript declaration generation. The Browserslist database-age warning does not cause TS2345.

## Testing / verification

The CMS local Admin acceptance on 2026-10-29 used Strapi 5.59.0 and isolated PostgreSQL fixtures. It passed coordinates-only Set Location/Save, restricted map writes, native locale fill, read-only behavior, and native save/publish/discard/unpublish regression. The CMS reports are `docs/runbooks/entity-coordinate-local-acceptance-2026-10-29.md` and its Chinese companion in the parent repository. The original handoff still declared 5.31.2; local develop integration retains its existing 5.59.0 host instead. Geodata admin/server no-emit type checks passed after this merge. Real address-provider execution remains unverified by that acceptance run.

On 2026-10-30, an isolated Node.js 22.23.4 / Yarn 4.7.0 install imported this plugin's legacy lock and resolved its own Strapi/Admin 5.6.0. The CMS supplied the declared Content Manager 5.59.0 peer, matching deployment's dependency layout. The original source reproduced TS2345 at Input.tsx:61. Replacing only the query type argument made the full production plugin build pass: declaration files and all four admin/server CJS/ESM bundles. Admin and server no-emit checks also pass against the prepared CMS host. Existing development build artifacts are preserved; browser or live provider acceptance is not repeated for this type-only correction.

## Code pointers

- `admin/src/components/Input.tsx`: existing controls, native form/RBAC integration, scoped manual actions, marker synchronization and tile request policy.
- `server/src/bootstrap.ts`: presence check before deriving Geodata values on partial writes.
- `package.json`: Content Manager peer dependency.
- `yarn.lock`, `admin/tsconfig.build.json`: independent plugin dependency resolution and declaration-build configuration.

## Follow-up work

Validate external address-provider behavior separately. Runtime build artifacts are excluded from this source merge; build the plugin through the existing release process when packaging it.
