# Member Timesheet Tag State Fix

Paste the code block below into https://mermaid.live to render.

```mermaid
flowchart TD
    A([User on member/271 - Alexander]) --> B[Select Joe Lu via SubordinatePicker]
    B --> C[onUserChange fires]
    C --> D["store.setViewUser + loadWeek<br/>updateTabTitle Joe Lu"]
    D --> E["router.replace to MemberTimesheet<br/>params: userId=272, name=Joe Lu"]
    E --> F[tagsView watch-route fires]
    F --> G[ADD_VISITED_VIEW called]
    G --> H{"MemberTimesheet<br/>tab already exists?"}
    H -- Yes --> I["Update tab in-place:<br/>path + fullPath + query updated<br/>title preserved"]
    H -- No --> J[Create new MemberTimesheet tab]
    I --> K[UPDATE_VISITED_VIEW_TITLE]
    J --> K
    K --> L["Fallback: match by name when<br/>path not found yet"]
    L --> M(["Tag: Joe Lu's Timesheet<br/>stored fullPath points to member/272"])

    M --> N[User switches to another tab]
    N --> O[User clicks MemberTimesheet tag]
    O --> P["Navigate to stored fullPath<br/>member/272 with name=Joe Lu"]
    P --> Q["Component re-mounts<br/>noCache=true key=route.path"]
    Q --> R[onMounted fires]
    R --> S{"store.viewUserId<br/>== route.params.userId?"}
    S -- Yes --> T["memberName = store.viewUserName<br/>Joe Lu - URL name ignored"]
    S -- No --> U["memberName = route.query.name<br/>fallback for fresh navigation"]
    T --> V["setViewUser + loadWeek<br/>updateTabTitle"]
    U --> V
    V --> W(["Tag persists as Joe Lu's Timesheet"])
```

## Key steps

| Step | Description |
|---|---|
| 1 | User picks Joe Lu via SubordinatePicker on Alexander's member page |
| 2 | `onUserChange` updates store + data + title, then calls `router.replace` to Joe Lu's URL |
| 3 | `ADD_VISITED_VIEW` detects existing MemberTimesheet tab and updates it in-place instead of creating a duplicate |
| 4 | `UPDATE_VISITED_VIEW_TITLE` falls back to name-based lookup so the title update lands even before the path is stable |
| 5 | When the user returns to the tab, it navigates to Joe Lu's URL — `onMounted` reads `store.viewUserName` (Joe Lu) instead of `route.query.name` (which would be Alexander) |

## Notes

- `MemberTimesheet` route has `noCache: true` — the component always re-mounts on tab click, which is why `onMounted` was re-reading the URL and reverting the title
- The single-tab behavior mirrors the Production tab pattern already in the tagsView store
- `store.viewUserId === memberUserId` guard in `onMounted` is what prevents the URL name from overwriting the stored name after a `router.replace`
- If the user opens Alexander's tab from scratch (no prior `onUserChange`), the fallback path still reads from `route.query.name` correctly
