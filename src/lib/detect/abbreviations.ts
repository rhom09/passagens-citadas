/**
 * Mapeamento canônico de abreviações bíblicas comuns para digitação rápida (busca manual).
 * Mapeia abreviações minúsculas (sem acento) para os IDs dos livros bíblicos (1 a 66).
 *
 * NOTA CRUCIAL SOBRE ACENTUAÇÃO:
 * - "jo" (sem acento) = João (Evangelho, id 43)
 * - "jó" (com acento) = Jó (id 18)
 *
 * Essa distinção de acento é tratada especificamente no parser manual antes do strip de acentos.
 */

export const BOOK_ABBREVIATIONS: Record<string, number> = {
  // Antigo Testamento
  gn: 1, ge: 1, gen: 1,
  ex: 2, exo: 2,
  lv: 3, lev: 3,
  nm: 4, num: 4, nu: 4,
  dt: 5, deu: 5, deut: 5,
  js: 6, jos: 6,
  jz: 7, juiz: 7, jui: 7,
  rt: 8, rut: 8,
  '1sm': 9, '1sam': 9, '1s': 9,
  '2sm': 10, '2sam': 10, '2s': 10,
  '1rs': 11, '1re': 11, '1reis': 11, '1r': 11,
  '2rs': 12, '2re': 12, '2reis': 12, '2r': 12,
  '1cr': 13, '1cron': 13, '1c': 13,
  '2cr': 14, '2cron': 14, '2c': 14,
  ed: 15, esd: 15,
  ne: 16, neem: 16,
  et: 17, est: 17,
  // Jó (id 18) é tratado com prioridade quando digitado com acento ("jó")
  sl: 19, sal: 19, slm: 19,
  pv: 20, prv: 20, prov: 20,
  ec: 21, ecl: 21,
  ct: 22, cant: 22, cnt: 22,
  is: 23, isa: 23,
  jr: 24, jer: 24,
  lm: 25, lam: 25,
  ez: 26, eze: 26, ezeq: 26,
  dn: 27, dan: 27,
  os: 28, ose: 28,
  jl: 29, joe: 29,
  am: 30, amo: 30,
  ob: 31, oba: 31, obad: 31,
  jn: 32, jon: 32,
  mq: 33, miq: 33,
  na: 34, nau: 34,
  hc: 35, hab: 35,
  sf: 36, sof: 36,
  ag: 37, age: 37,
  zc: 38, zac: 38,
  ml: 39, mal: 39,

  // Novo Testamento
  mt: 40, mat: 40,
  mc: 41, mar: 41, marc: 41,
  lc: 42, luc: 42,
  // "jo" -> João (id 43)
  jo: 43, jn_gospel: 43,
  at: 44, ato: 44,
  rm: 45, rom: 45,
  '1co': 46, '1cor': 46,
  '2co': 47, '2cor': 47,
  gl: 48, gal: 48,
  ef: 49, efe: 49,
  fp: 50, fl: 50, fil: 50, flip: 50,
  cl: 51, col: 51,
  '1ts': 52, '1tes': 52, '1tess': 52,
  '2ts': 53, '2tes': 53, '2tess': 53,
  '1tm': 54, '1tim': 54,
  '2tm': 55, '2tim': 55,
  tt: 56, tit: 56,
  fm: 57, flm: 57, film: 57,
  hb: 58, heb: 58, hebr: 58,
  tg: 59, tia: 59, tiag: 59,
  '1pe': 60, '1ped': 60, '1p': 60,
  '2pe': 61, '2ped': 61, '2p': 61,
  '1jo': 62, '1jn': 62, '1j': 62,
  '2jo': 63, '2jn': 63, '2j': 63,
  '3jo': 64, '3jn': 64, '3j': 64,
  jd: 65, jud: 65,
  ap: 66, apoc: 66, apo: 66,
};
