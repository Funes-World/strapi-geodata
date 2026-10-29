---
title: Geodata integration with Entity coordinate metadata
status: current
owner: FUNES / CMS
last_updated: 2026-10-29
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

OSM tiles use `https://tile.openstreetmap.org/{z}/{x}/{y}.png`, `referrerPolicy="strict-origin"` and `crossOrigin="anonymous"`. These image requests send only the site origin, without editor paths, query parameters or cross-origin credentials; the CMS-wide referrer policy is unchanged.

## Edge cases / failure modes

Native copy/reset operations preserve provenance. Coordinates-only roles can edit their existing field without gaining metadata/map-field rights. A response arriving after navigation cannot fill another Entity or language. Original native persistence, relation and timestamp behavior is retained.

## Testing / verification

The CMS local Admin acceptance on 2026-10-29 used Strapi 5.59.0 and isolated PostgreSQL fixtures. It passed coordinates-only Set Location/Save, restricted map writes, native locale fill, read-only behavior, and native save/publish/discard/unpublish regression. The CMS reports are `docs/runbooks/entity-coordinate-local-acceptance-2026-10-29.md` and its Chinese companion in the parent repository. The original handoff still declared 5.31.2; local develop integration retains its existing 5.59.0 host instead. Geodata admin/server no-emit type checks passed after this merge. Real address-provider execution remains unverified by that acceptance run.

## Code pointers

- `admin/src/components/Input.tsx`: existing controls, native form/RBAC integration, scoped manual actions, marker synchronization and tile request policy.
- `server/src/bootstrap.ts`: presence check before deriving Geodata values on partial writes.
- `package.json`: Content Manager peer dependency.

## Follow-up work

Validate external address-provider behavior separately. Runtime build artifacts are excluded from this source merge; build the plugin through the existing release process when packaging it.
