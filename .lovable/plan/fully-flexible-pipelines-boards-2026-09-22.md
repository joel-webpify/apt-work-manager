# Fully flexible pipelines (boards)

Today there are exactly two boards, Sales and Installation, baked into the app. This makes boards something you set up yourself: add as many as you need, name them, give each an icon and colour, and remove ones you don't use.

## What changes for you

**Settings → Pipelines & stages**
- "Add board" button. Choose a starting template: Sales, Installation, Service & repairs, or Blank (one stage).
- Each board block gets: editable name, icon picker (small set: handshake, spanner, van, calendar, clipboard, wrench, phone, star), colour picker (same presets as stages), and a Delete option.
- Deleting a board asks where its jobs should go (another board's first stage), so no job is orphaned.
- Reorder boards up/down — this sets the order of the tabs on the Pipeline page.
- Reset still restores the two default boards.

**Pipeline page**
- Tabs are generated from your boards (plus "All"), each showing its own icon and colour and a job count. Tabs scroll sideways if you add many.
- No automatic handover any more: nothing jumps from one board to another on its own. The Won → Installation auto-move and its undo banner are removed.
- Moving a job to a different board stays available from the card menu and the job panel: pick any board, then a stage on it.
- Board badges on cards use each board's own icon and colour instead of the hardcoded handshake/spanner pair.

**New job**
- The board selector lists all your boards; picking one auto-selects its first stage, as now.

## Technical notes

- `src/lib/stagesStore.ts`: extend `Pipeline` with `icon` and `color`; add `addPipeline(template)`, `removePipeline(id, moveJobsTo)`, `movePipeline(id, dir)`, `setPipelineIcon/Color`, and templates for Sales / Installation / Service & repairs / Blank. Bump the storage key to `pipelines-v4` with a migration that carries v3 boards over and fills in default icon/colour for `sales`/`install`. Keep `resolveStageName`, `pipelineIdForStage`, `firstStageOf`, `lastStageOf` unchanged in signature.
- Add an icon registry (name → lucide component) so stored boards hold a string, not a component.
- `src/components/settings/PipelinesTab.tsx`: per-board header row with name input, icon/colour poppers, move up/down, delete dialog with a "send existing jobs to" select; "Add board" with template choice.
- `src/pages/Pipeline.tsx`: replace `PipelineTab = "sales" | "install" | "all"` with a dynamic id validated against `getPipelines()`; drop `salesLastStage`/`installFirstStage` handover logic, the `handover` props on card/panel components, and the auto-move + undo path; derive counts, badges and icons from the board record; keep unified move + timeline notes and per-move undo for manual moves.
- `src/components/pipeline/NewJobDialog.tsx`: board list from the store (already close to this).
- Jobs keep `pipelineId?: string`; jobs whose board no longer exists fall back to the first board, as today.
