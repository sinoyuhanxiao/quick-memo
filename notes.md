# Accounting Timesheet Export Testing Request

Subject: Testing Support for Accounting Timesheet Export

Hi John,

According to Nick's request, I have completed a new Accounting Timesheet Export feature in CMMS.

This feature is used to export timesheet labor hours into an Excel workbook for accounting review. It helps accounting see how many hours were spent by each employee, and how those hours are connected to equipment, work orders, and work order categories.

The feature can be accessed from:

CMMS -> Timesheet -> Team Timesheets -> Accounting Export tab

In the export, users can select a date range, include or exclude draft timesheets, and download an Excel file. The workbook includes summary information, equipment-level hour breakdowns, detailed source rows, exceptions, and a short guide explaining how to read the file.

I have also attached an exported Excel example for reference.

Because this export may be used by accounting to review labor hours, the accuracy of the time data is very important. I would like to request one person to help test this feature and verify that the exported hours match the actual timesheet data.

Thanks,

---

# Task Schedule Editability Gating (Work Order create/edit)

Plain-words explanation of how the task card's schedule controls were gated:

- The "Task Schedule" section on each task card — the start/end date pickers, the
  offset and duration inputs, the Offset/Direct mode toggle, and the "Working days only"
  checkbox — used to always be editable, no matter what state the work order was in.
- Now they are locked (disabled) whenever the work order is NOT editable.
- "Not editable" uses the exact same rule as the work order's Edit button: the work
  order is considered non-editable when its state is Completed (state id 7) or state id 14.
  Any other state is editable.
- How it's plumbed: the card got a new `scheduleDisabled` prop. The two parent forms
  (WorkOrderCreate.vue and WorkOrderEdit.vue) each compute `isWorkOrderEditable` from the
  work order's `state_id` (using the 7/14 rule) and pass `:schedule-disabled="!isWorkOrderEditable"`
  down to the card. The "Working days only" checkbox stays additionally gated by the
  existing `maintenance:workorder:update` permission.
- Practical note: brand-new and copied work orders start in the Ready state, so the
  schedule stays editable in those cases. The lock only becomes visible when editing a
  work order that is Completed or in state 14 — i.e. exactly when the Edit button is also
  disabled.

Files touched:
- src/components/Tables/Cards/MaintenanceSelectedTaskCard.vue (new prop + disabled bindings)
- src/components/WorkOrder/TodoView/WorkOrderEdit.vue (isWorkOrderEditable + prop pass-down)
- src/components/WorkOrder/TodoView/WorkOrderCreate.vue (isWorkOrderEditable + prop pass-down)
