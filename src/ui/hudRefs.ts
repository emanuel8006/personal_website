/**
 * DOM elements the scene positions directly every frame (bypassing React
 * state so the render loop never triggers re-renders).
 */
export const hud = {
  tooltip: null as HTMLDivElement | null,
}
