# Per-Instance Pinia Store Fix for Timesheet Tab Isolation

Paste the code block below into https://mermaid.live to render.

```mermaid
flowchart TD
    A([Problem: All tabs share<br/>one Pinia store instance]) --> B["All tabs use<br/>useTimesheetStore"]
    B --> C["Single shared state:<br/>viewUserId, rows, week,<br/>pagination, dirty flag"]
    C --> D["Filter change in tab A<br/>updates store"]
    D --> E["Tab B sees<br/>the same change<br/>Cross-tab interference"]

    F([Solution: Factory with<br/>per-instance stores]) --> G["Convert useTimesheetStore<br/>to factory function:<br/>useTimesheetStore instanceKey"]
    G --> H["Each route gets unique key:<br/>member-271 vs member-272<br/>vs my"]
    H --> I["Pinia memoizes by storeId<br/>Same key returns same store"]
    I --> J["Tab A: member-271<br/>has store A state"]
    I --> K["Tab B: member-272<br/>has store B state"]
    J --> L["Filter change in A<br/>only affects store A"]
    K --> M["Tab B unaffected<br/>uses independent store B"]

    N([How state survives<br/>component re-mounts]) --> O["Component setup computes:<br/>instanceKey = userId<br/>  ? member-userId<br/>  : my"]
    O --> P["Component destroyed and<br/>re-mounted on tab switch<br/>noCache=true"]
    P --> Q["onMounted fires again"]
    Q --> R{"Is store empty?"}
    R -- Yes --> S["First mount: load from URL<br/>route.params.userId"]
    R -- No --> T["Store alive in Pinia<br/>State persists from<br/>previous mount"]
    S --> U["store.setViewUser + loadWeek"]
    T --> U
    U --> V([Component shows correct<br/>member and data])

    W([Why no interference)) --> X["Each unique instanceKey<br/>creates separate Pinia<br/>store definition"]
    X --> Y["Pinia.defineStore generates<br/>unique store ID per key"]
    Y --> Z["Each store ID has<br/>independent state object"]
    Z --> AA["member-271 state<br/>is isolated from<br/>member-272 state"]
    AA --> AB([Zero state leakage<br/>between tabs])

    AC([Key difference from<br/>prior broken attempts]) --> AD["Previous: tried savedState<br/>and router.replace<br/>Still shared core store"]
    AD --> AE["This fix: completely separate<br/>Pinia instances<br/>No shared state at all"]
```

## Key steps

| Step | Description |
|---|---|
| 1 | Extract store state/getters/actions into functions: `timesheetState()`, `timesheetGetters()`, `timesheetActions()` |
| 2 | Factory function: `useTimesheetStore(instanceKey='default')` calls `defineStore('timesheet-' + instanceKey, {...})()` |
| 3 | In MyTimesheetView.vue setup: compute `instanceKey = route.params.userId ? 'member-${userId}' : 'my'` once |
| 4 | Call `const store = useTimesheetStore(instanceKey)` — each unique instanceKey gets its own Pinia store |
| 5 | Pinia memoizes stores by ID — same key always returns same instance, state persists across re-mounts |
| 6 | Different tabs (member-271, member-272) have completely isolated state — no interference |

## Why This Works

- **Pinia's Memoization**: Calling `defineStore('timesheet-member-271', {...})()` twice returns the exact same store instance both times. State survives component re-mounts because the Pinia store is kept alive separately from the Vue component.
- **No Shared Root**: Unlike the previous attempts (savedState, router.replace), there's no single root store that all tabs tap into. Each tab has its own complete, independent store.
- **Simple onMounted**: No need for savedState lookup or guards. Just: if store is empty, load from URL; if store has state, use it. Clean.

## Why Earlier Attempts Failed

| Approach | Problem |
|---|---|
| savedState on tagsView | Tabs A and B could both restore the same savedState, causing interference |
| router.replace | Triggered unnecessary re-mounts and double-confirmation dialogs; fundamentally still one shared store |
| Single shared store with conditionals | The store itself was shared; filters on one tab updated all tabs immediately |

**This approach bypasses the problem entirely**: no shared store = no possible interference.
