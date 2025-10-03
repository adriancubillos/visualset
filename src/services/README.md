Color Pattern Usage Service

This module centralizes fetching used color/pattern combinations by entity type. It follows the Open/Closed principle: new entity types can be supported without editing `route.ts`.

How to register a new entity type

1. Import `registerEntityFetcher` from `@/services/colorPatternUsageService`.
2. Provide a fetcher function matching the signature `(prisma, opts) => Promise<UsedCombination[]>`.
3. Call `registerEntityFetcher('yourEntityType', fetcher)` during app startup.

Example fetcher (pseudo-code):

```
registerEntityFetcher('device', async (prisma, { excludeEntityId }) => {
  const rows = await prisma.device.findMany({ /* ... */ });
  return rows.map(r => ({ color: r.color!, pattern: r.pattern!, entityName: r.name, entityId: r.id, entityType: 'device' }));
});
```

Notes

- The service throws on unknown `entityType`; `route.ts` maps that to a 400 response.
- Keep fetchers small and focused so they remain easy to test.
