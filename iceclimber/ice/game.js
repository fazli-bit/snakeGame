// Fail ini mencipta dan mengeksport objek Game kosong.
// Modul-modul lain akan mengimport ini dan melampirkan (attach)
// logik mereka kepadanya (cth: Game.Core = { ... }).
// Ini mengekalkan rujukan kod asal (cth: Game.Player.update())
// tanpa memerlukan refactor logik yang besar.

export const Game = {};