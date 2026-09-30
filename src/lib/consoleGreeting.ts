import { SITE } from '../data/content'

/** A friendly hello for developers who open the console (printed once per page load). */
export function printConsoleGreeting() {
  const w = window as Window & { __egGreeted?: boolean }
  if (w.__egGreeted) return
  w.__egGreeted = true

  const art = [
    '        .  *        .       *    ',
    '   *        _____        .       ',
    '       .  /     \\  ~~~~~~~~~~~~ ',
    '  ~~~~~~~| (   ) |~~~~~~~   *   ',
    '     *    \\_____/        .      ',
    '   .          *     .        *  ',
  ].join('\n')

  console.log(`%c${art}`, 'color:#ffb347;font-family:monospace;line-height:1.2')
  console.log(
    `%cHey, fellow explorer 👋%c\nYou're looking at ${SITE.name}'s portfolio: React Three Fiber, custom GLSL, and a lot of space.\nSource: https://github.com/emanuel8006/personal_website\nPsst: not everything in the asteroid belt is just a rock. (Old-school gamers might know another way in.)`,
    'color:#5ee7ff;font-size:14px;font-weight:bold;font-family:system-ui',
    'color:#a78bfa;font-family:system-ui;line-height:1.6',
  )
}
