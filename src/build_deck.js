const pptx = require("pptxgenjs");
const fs = require("fs");
const D = JSON.parse(fs.readFileSync("route-opt/docs/data.json", "utf8"));
const k = D.kpi, E = D.eval, S = E.stats;
const fmt = n => n.toLocaleString("id-ID");

const BRI = "0857C3", BRI2 = "307FE2", SKY = "71C5E8", INKBL = "0B2447";
const RUST = "C0392B", TEAL = "1F8A78", AMBER = "E8A13A";
const PAPER = "FFFFFF", SOFT = "EAF1FB", MUTE = "5A6B82", LINE = "D4E0F0";
const FT = "Inter", FTB = "Inter Semi-Bold";

const W = 20, H = 11.25;
let p = new pptx();
p.defineLayout({ name: "BRI", width: W, height: H });
p.layout = "BRI";
p.author = "BRI Micro Risk Management Group";
p.title = "Evaluasi & Optimalisasi Rute Mantri";

const BRI_LOGO = "route-opt/docs/bri_logo.png";
const DAN_LOGO = "route-opt/docs/danantara_logo.png";
const PHONE = "route-opt/docs/phone_hand.png";
const BRI_LOGO_W = "route-opt/docs/bri_logo_white.png";

function brandHeader(s, dark) {
  s.addImage({ path: DAN_LOGO, x: 0.55, y: 0.5, w: 2.0, h: 2.0 * 396 / 704 });
  s.addImage({ path: dark ? BRI_LOGO_W : BRI_LOGO, x: W - 2.9, y: 0.45, w: 2.3, h: 2.3 * 559 / 993 });
}
function pageNum(s, n) {
  s.addText(String(n), { x: W - 1.1, y: H - 0.75, w: 0.7, h: 0.4, fontFace: FTB, fontSize: 16, bold: true, color: BRI, align: "right" });
}
function eyebrow(s, txt) {
  s.addText(txt.toUpperCase(), { x: 1.05, y: 2.55, w: 15, h: 0.4, fontFace: FT, fontSize: 14, color: BRI2, charSpacing: 4, bold: true });
}
function title(s, t, sub) {
  s.addText(t, { x: 1.0, y: 2.95, w: 18, h: 0.95, fontFace: FTB, fontSize: 36, bold: true, color: BRI });
  if (sub) s.addText(sub, { x: 1.05, y: 3.95, w: 18, h: 0.7, fontFace: FT, fontSize: 17, color: MUTE, lineSpacingMultiple: 1.15 });
}
function contentSlide(eyebrowTxt, t, sub, n) {
  const s = p.addSlide();
  s.background = { color: PAPER };
  brandHeader(s); eyebrow(s, eyebrowTxt); title(s, t, sub); pageNum(s, n);
  return s;
}
function dot(s, x, y, c = AMBER, d = 0.17) { s.addShape(p.shapes.OVAL, { x, y, w: d, h: d, fill: { color: c } }); }

// SLIDE 1 — TITLE
let s = p.addSlide();
s.background = { color: PAPER };
s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: 0.3, y: 0.3, w: W - 0.6, h: H - 0.6, rectRadius: 0.35, fill: { type: "none" }, line: { color: SKY, width: 3 } });
brandHeader(s);
s.addImage({ path: PHONE, x: 13.0, y: 1.5, w: 6.1, h: 6.1 * 1350 / 752 });
s.addText("EVALUASI & OPTIMALISASI RUTE MANTRI", { x: 1.55, y: 3.5, w: 12, h: 0.5, fontFace: FT, fontSize: 18, color: BRI2, charSpacing: 2, bold: true });
s.addText([{ text: "Route\n" }, { text: "Optimization" }], { x: 1.5, y: 4.0, w: 12, h: 3.0, fontFace: FTB, fontSize: 88, bold: true, color: BRI, lineSpacingMultiple: 0.98 });
s.addText("Evaluasi rute pemasaran, pembinaan & penagihan mantri dan model optimalisasi berbasis data GPS kunjungan harian",
  { x: 1.55, y: 7.15, w: 10.8, h: 0.9, fontFace: FT, fontSize: 19, color: BRI, lineSpacingMultiple: 1.15 });
s.addText("Juni 2026", { x: 1.55, y: 8.4, w: 6, h: 0.5, fontFace: FT, fontSize: 22, color: BRI });
s.addText("Micro Risk Management Group", { x: 1.55, y: 8.95, w: 9, h: 0.5, fontFace: FT, fontSize: 22, color: BRI });
pageNum(s, 1);

// SLIDE 2 — DATA SUMMARY
s = contentSlide("Ringkasan Data", "Summary data: cakupan & komposisi kunjungan",
  "Basis seluruh analisis \u2014 data GPS kunjungan mantri (BRISPOT) periode Januari\u2013Juni 2026, setelah pembersihan koordinat error & baris tidak lengkap.", 2);
// scope cards (left)
const scope = [
  [fmt(k.total_visits), "Total kunjungan dianalisis", BRI],
  [k.n_mantri + "", "Mantri", BRI2],
  [k.n_uker + "", "Unit kerja (BRI Unit)", BRI2],
  [k.n_region + "", "Kantor Wilayah", BRI2],
  [fmt(k.mantri_days), "Mantri-hari (observasi rute)", TEAL],
  ["6 bln", "Periode (Jan\u2013Jun 2026)", AMBER],
];
let sw2 = 5.75, sh2 = 1.5, sgx = 0.4, sgy = 0.38, sx0 = 1.0, sy0 = 5.0;
scope.forEach((c, i) => {
  const x = sx0 + (i % 2) * (sw2 + sgx);
  const y = sy0 + Math.floor(i / 2) * (sh2 + sgy);
  s.addShape(p.shapes.ROUNDED_RECTANGLE, { x, y, w: sw2, h: sh2, rectRadius: 0.12, fill: { color: PAPER }, line: { color: LINE, width: 1.25 } });
  s.addShape(p.shapes.ROUNDED_RECTANGLE, { x, y, w: 0.14, h: sh2, rectRadius: 0.04, fill: { color: c[2] } });
  s.addText(c[0], { x: x + 0.4, y: y + 0.18, w: sw2 - 0.6, h: 0.75, fontFace: FTB, fontSize: 34, bold: true, color: c[2] });
  s.addText(c[1], { x: x + 0.42, y: y + 0.95, w: sw2 - 0.6, h: 0.4, fontFace: FT, fontSize: 14.5, color: MUTE });
});
// composition (right): visit type donut
const vt = k.visit_types;
const vtotal = vt.penagihan + vt.pemasaran + vt.pembinaan + vt.ots;
s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: 13.0, y: 5.0, w: 6.0, h: 5.32, rectRadius: 0.12, fill: { color: SOFT }, line: { color: LINE, width: 1 } });
s.addText("Komposisi aktivitas kunjungan", { x: 13.35, y: 5.28, w: 5.4, h: 0.4, fontFace: FTB, fontSize: 17, bold: true, color: BRI });
s.addChart(p.charts.DOUGHNUT, [{
  name: "Komposisi", labels: ["Penagihan", "Pemasaran", "Pembinaan", "OTS / lainnya"],
  values: [vt.penagihan, vt.pemasaran, vt.pembinaan, vt.ots],
}], { x: 13.05, y: 5.7, w: 5.9, h: 2.85, holeSize: 62, chartColors: [BRI, BRI2, SKY, "CCAD95"],
  showLegend: false, showValue: false, dataLabelColor: "FFFFFF", dataLabelFontFace: FT, dataLabelFontSize: 11 });
// legend rows
const vleg = [
  ["Penagihan", vt.penagihan, BRI],
  ["Pemasaran", vt.pemasaran, BRI2],
  ["Pembinaan", vt.pembinaan, SKY],
  ["OTS / lainnya", vt.ots, "CCAD95"],
];
let vy = 8.7;
vleg.forEach(v => {
  s.addShape(p.shapes.OVAL, { x: 13.35, y: vy + 0.04, w: 0.2, h: 0.2, fill: { color: v[2] } });
  s.addText(v[0], { x: 13.65, y: vy - 0.04, w: 3.0, h: 0.35, fontFace: FT, fontSize: 13.5, color: INKBL });
  s.addText(Math.round(v[1] / vtotal * 100) + "%", { x: 16.7, y: vy - 0.04, w: 2.0, h: 0.35, fontFace: FTB, fontSize: 13.5, bold: true, color: v[2], align: "right" });
  vy += 0.42;
});

// SLIDE 2 — FINDINGS
s = contentSlide("Evaluasi · Sekilas", "Empat temuan utama dari rute saat ini", null, 2);
const startH = Math.floor(S.start_mean), startM = Math.round((S.start_mean % 1) * 60);
const cards = [
  [S.km_mean + " km", "rata-rata rute / mantri / hari", "vs median hanya " + S.km_median + " km — distribusi sangat timpang", RUST],
  [S.over20 + "%", "hari dengan rute > 20 km", "sebagian kecil hari menyerap mayoritas jarak tempuh", BRI2],
  [S.legshare + "%", "porsi 1 perjalanan terpanjang", "rata-rata sepertiga rute habis di satu lompatan jauh", BRI],
  [k.avg_visits_day + "", "rata-rata kunjungan / hari", "beban kunjungan tinggi memperbesar ruang optimalisasi", TEAL],
];
let cw = 4.35, gap = 0.45, cx0 = 1.0;
cards.forEach((c, i) => {
  const x = cx0 + i * (cw + gap);
  s.addShape(p.shapes.ROUNDED_RECTANGLE, { x, y: 5.0, w: cw, h: 3.3, rectRadius: 0.14, fill: { color: PAPER }, line: { color: LINE, width: 1.25 }, shadow: { type: "outer", color: "0857C3", blur: 10, offset: 4, angle: 90, opacity: 0.12 } });
  dot(s, x + 0.4, 5.35, c[3], 0.2);
  s.addText(c[0], { x: x + 0.38, y: 5.65, w: cw - 0.7, h: 0.95, fontFace: FTB, fontSize: 40, bold: true, color: c[3] });
  s.addText(c[1].toUpperCase(), { x: x + 0.4, y: 6.65, w: cw - 0.7, h: 0.65, fontFace: FT, fontSize: 14, bold: true, color: INKBL, charSpacing: 0.5 });
  s.addText(c[2], { x: x + 0.4, y: 7.3, w: cw - 0.7, h: 0.95, fontFace: FT, fontSize: 14, color: MUTE, lineSpacingMultiple: 1.12 });
});
s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: 1.0, y: 8.65, w: 18.0, h: 1.7, rectRadius: 0.14, fill: { color: BRI } });
s.addText([
  { text: "Inti masalah:  ", options: { bold: true, color: SKY } },
  { text: "rute tidak ditentukan oleh kedekatan geografis, melainkan urutan kemunculan / janji bayar. Mantri sering bolak-balik melewati area yang sama dan menempuh jarak jauh lebih panjang dari yang diperlukan untuk titik kunjungan yang sama.", options: { color: "FFFFFF" } },
], { x: 1.4, y: 8.9, w: 17.2, h: 1.2, fontFace: FT, fontSize: 17, lineSpacingMultiple: 1.25, valign: "middle" });

// SLIDE 3 — DISTRIBUTION
s = contentSlide("Evaluasi · Sebaran jarak", "Beban rute terkonsentrasi pada sebagian kecil hari",
  "Sebaran jarak tempuh per mantri-hari. 25% hari terpanjang menyumbang " + S.top25share + "% dari seluruh jarak — target perbaikan paling berdampak.", 4);
s.addChart(p.charts.BAR, [{ name: "Jumlah mantri-hari", labels: E.km_dist.map(d => d.b + " km"), values: E.km_dist.map(d => d.v) }],
  { x: 1.0, y: 5.0, w: 11.4, h: 5.4, barDir: "col", chartColors: [BRI], barGapWidthPct: 30, showLegend: false, showValue: true, dataLabelFontFace: FT, dataLabelFontSize: 13, dataLabelColor: INKBL, dataLabelPosition: "outEnd", catAxisLabelFontFace: FT, catAxisLabelFontSize: 14, valAxisLabelFontFace: FT, valAxisLabelFontSize: 12, catAxisTitle: "jarak rute per hari", showCatAxisTitle: true, catAxisTitleFontFace: FT, catAxisTitleFontSize: 14, catAxisTitleColor: MUTE, valGridLine: { color: "EDF2F9", size: 1 } });
s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: 12.8, y: 5.0, w: 6.2, h: 5.4, rectRadius: 0.12, fill: { color: SOFT }, line: { color: LINE, width: 1 } });
s.addText("Yang terlihat di data", { x: 13.2, y: 5.3, w: 5.5, h: 0.45, fontFace: FTB, fontSize: 20, bold: true, color: BRI });
const facts = [
  ["Median " + S.km_median + " km", "Mayoritas hari rutenya pendek dan padat — pola yang sehat."],
  ["P90 " + S.km_p90 + " km", "Tapi 1 dari 10 hari menembus 58 km — lonjakan ekstrem."],
  ["Maks ~" + Math.round(S.km_max) + " km", "Ada hari menempuh ratusan km untuk titik berdekatan."],
];
let fy = 6.0;
facts.forEach(f => {
  dot(s, 13.2, fy + 0.1, AMBER, 0.18);
  s.addText(f[0], { x: 13.5, y: fy - 0.05, w: 5.2, h: 0.45, fontFace: FTB, fontSize: 19, bold: true, color: RUST });
  s.addText(f[1], { x: 13.5, y: fy + 0.5, w: 5.2, h: 0.9, fontFace: FT, fontSize: 14.5, color: MUTE, lineSpacingMultiple: 1.15 });
  fy += 1.55;
});

// SLIDE 4 — WORK PATTERN
s = contentSlide("Evaluasi · Pola kerja", "Beban kunjungan tinggi & tersebar sepanjang hari", null, 5);
s.addText("Distribusi jumlah kunjungan / hari", { x: 1.0, y: 4.85, w: 9, h: 0.45, fontFace: FTB, fontSize: 18, bold: true, color: BRI });
s.addChart(p.charts.BAR, [{ name: "Mantri-hari", labels: E.visit_dist.map(d => d.b), values: E.visit_dist.map(d => d.v) }],
  { x: 0.9, y: 5.35, w: 9.0, h: 4.85, barDir: "col", chartColors: [BRI], barGapWidthPct: 35, showLegend: false, catAxisLabelFontFace: FT, catAxisLabelFontSize: 14, valAxisLabelFontFace: FT, valAxisLabelFontSize: 12, catAxisTitle: "kunjungan per hari", showCatAxisTitle: true, catAxisTitleFontFace: FT, catAxisTitleFontSize: 14, catAxisTitleColor: MUTE, valGridLine: { color: "EDF2F9", size: 1 } });
s.addText("Kunjungan menurut jam (waktu lapangan)", { x: 10.3, y: 4.85, w: 9, h: 0.45, fontFace: FTB, fontSize: 18, bold: true, color: BRI });
s.addChart(p.charts.LINE, [{ name: "Kunjungan", labels: E.hour_hist.map(d => d.h + ":00"), values: E.hour_hist.map(d => d.v) }],
  { x: 10.2, y: 5.35, w: 9.0, h: 4.85, chartColors: [BRI2], lineSize: 3.5, lineSmooth: true, showLegend: false, catAxisLabelFontFace: FT, catAxisLabelFontSize: 11, valAxisLabelFontFace: FT, valAxisLabelFontSize: 12, catAxisTitle: "jam", showCatAxisTitle: true, catAxisTitleFontFace: FT, catAxisTitleFontSize: 14, catAxisTitleColor: MUTE, valGridLine: { color: "EDF2F9", size: 1 } });
s.addText("Rata-rata " + k.avg_visits_day + " kunjungan/hari, aktif sejak pagi (mulai rata-rata " + startH + ":" + String(startM).padStart(2, "0") + ") dengan dua puncak: menjelang siang dan sore. Volume sebesar ini menuntut urutan rute yang efisien — justru di sinilah jarak tempuh paling banyak terbuang.",
  { x: 1.0, y: 10.35, w: 18, h: 0.6, fontFace: FT, fontSize: 14.5, italic: true, color: MUTE, lineSpacingMultiple: 1.1 });

// SLIDE 5 — REGIONAL
s = contentSlide("Evaluasi · Per wilayah", "Inefisiensi tidak merata: Denpasar & Makassar paling berat",
  "Rata-rata jarak rute aktual per mantri-hari di tiap Kanwil, dibanding rute optimal pada titik yang sama.", 6);
const reg = [...D.region].sort((a, b) => b.act - a.act);
s.addChart(p.charts.BAR, [
  { name: "Rute aktual/hari", labels: reg.map(r => r.name), values: reg.map(r => r.act) },
  { name: "Rute optimal/hari", labels: reg.map(r => r.name), values: reg.map(r => r.opt) },
], { x: 1.0, y: 5.0, w: 11.5, h: 5.3, barDir: "col", chartColors: [RUST, TEAL], barGapWidthPct: 45, showLegend: true, legendPos: "b", legendFontFace: FT, legendFontSize: 14, catAxisLabelFontFace: FT, catAxisLabelFontSize: 13, valAxisLabelFontFace: FT, valAxisLabelFontSize: 12, valAxisTitle: "km / mantri-hari", showValAxisTitle: true, valAxisTitleFontFace: FT, valAxisTitleColor: MUTE, valGridLine: { color: "EDF2F9", size: 1 } });
s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: 12.9, y: 5.0, w: 6.1, h: 5.3, rectRadius: 0.12, fill: { color: SOFT }, line: { color: LINE, width: 1 } });
s.addText("Selisih aktual vs optimal", { x: 13.25, y: 5.3, w: 5.5, h: 0.45, fontFace: FTB, fontSize: 19, bold: true, color: BRI });
let ry = 5.95;
reg.forEach(rr => {
  const gapkm = (rr.act - rr.opt).toFixed(1);
  s.addText(rr.name, { x: 13.25, y: ry, w: 3.6, h: 0.4, fontFace: FT, fontSize: 15, bold: true, color: INKBL });
  s.addText("+" + gapkm + " km", { x: 16.9, y: ry, w: 1.9, h: 0.4, fontFace: FTB, fontSize: 16, bold: true, color: RUST, align: "right" });
  s.addText(rr.avgn + " kunj/hari · selisih " + rr.saving + "%", { x: 13.25, y: ry + 0.4, w: 5.5, h: 0.35, fontFace: FT, fontSize: 13, color: MUTE });
  ry += 0.86;
});

// SLIDE 6 — WORST UNITS
s = contentSlide("Evaluasi · Unit kerja", "Unit kerja dengan rute paling tidak efisien", null, 7);
const uk = [...D.uker].filter(u => u.days >= 15).sort((a, b) => b.act - a.act).slice(0, 9);
const head = ["UNIT KERJA", "KANWIL", "KUNJ/HARI", "RUTE AKTUAL", "RUTE OPTIMAL", "SELISIH"];
const aligns = ["left", "left", "right", "right", "right", "right"];
const rows = [head.map((h, j) => ({ text: h, options: { bold: true, color: "FFFFFF", fill: { color: BRI }, align: aligns[j], fontSize: 15 } }))];
uk.forEach((u, i) => {
  const bg = i % 2 ? "FFFFFF" : SOFT;
  rows.push([
    { text: u.name.replace("UNIT ", ""), options: { color: INKBL, fill: { color: bg }, bold: true, align: "left" } },
    { text: u.region, options: { color: MUTE, fill: { color: bg } } },
    { text: String(u.avgn), options: { color: INKBL, fill: { color: bg }, align: "right" } },
    { text: u.act + " km", options: { color: RUST, fill: { color: bg }, bold: true, align: "right" } },
    { text: u.opt + " km", options: { color: TEAL, fill: { color: bg }, align: "right" } },
    { text: "+" + (u.act - u.opt).toFixed(1) + " km", options: { color: RUST, fill: { color: bg }, align: "right" } },
  ]);
});
s.addTable(rows, { x: 1.0, y: 4.9, w: 18.0, colW: [5.0, 3.5, 2.3, 2.5, 2.5, 2.2], rowH: 0.62, fontFace: FT, fontSize: 15, valign: "middle", border: { pt: 0.5, color: LINE }, margin: [4, 8, 4, 8] });
s.addText("UNIT SALUPUTTI RANTEPAO & GEGERKALONG menempuh rute jauh di atas kebutuhan optimal untuk titik kunjungan yang sama. Unit-unit ini adalah kandidat pilot perbaikan rute.",
  { x: 1.0, y: 10.4, w: 18, h: 0.5, fontFace: FT, fontSize: 14, italic: true, color: MUTE, lineSpacingMultiple: 1.1 });

// SLIDE 7 — DIAGNOSIS
s = p.addSlide(); s.background = { color: BRI };
brandHeader(s, true);
s.addText("KESIMPULAN EVALUASI", { x: 1.05, y: 2.55, w: 15, h: 0.4, fontFace: FT, fontSize: 14, color: SKY, charSpacing: 4, bold: true });
s.addText("Diagnosis: rute reaktif, bukan terencana", { x: 1.0, y: 2.95, w: 18, h: 0.9, fontFace: FTB, fontSize: 36, bold: true, color: "FFFFFF" });
s.addText("Ringkasan akar inefisiensi yang terbaca dari data kunjungan saat ini.", { x: 1.05, y: 3.95, w: 18, h: 0.5, fontFace: FT, fontSize: 17, color: SKY });
const diag = [
  ["Backtracking", S.severe_backtrack + "% hari memuat 1 perjalanan yang menyita >50% rute — bolak-balik melewati area yang sama."],
  ["Beban timpang", S.over20 + "% hari menempuh >20 km sementara median hanya " + S.km_median + " km; 25% hari terpanjang menyerap " + S.top25share + "% jarak."],
  ["Volume tinggi", "Rata-rata " + k.avg_visits_day + " kunjungan/hari tersebar pemasaran, pembinaan & penagihan — tanpa urutan optimal, jarak membengkak."],
  ["Tak ada urutan optimal", "Urutan kunjungan mengikuti janji bayar / kemunculan, bukan kedekatan geografis."],
];
let dw = 8.75, dgx = 0.5, dx = 1.0, dy0 = 4.95;
diag.forEach((d, i) => {
  const x = dx + (i % 2) * (dw + dgx);
  const y = dy0 + Math.floor(i / 2) * 1.95;
  s.addShape(p.shapes.ROUNDED_RECTANGLE, { x, y, w: dw, h: 1.7, rectRadius: 0.12, fill: { color: BRI2 } });
  dot(s, x + 0.42, y + 0.42, AMBER, 0.2);
  s.addText(d[0], { x: x + 0.8, y: y + 0.25, w: dw - 1.1, h: 0.45, fontFace: FTB, fontSize: 20, bold: true, color: "FFFFFF" });
  s.addText(d[1], { x: x + 0.8, y: y + 0.78, w: dw - 1.2, h: 0.85, fontFace: FT, fontSize: 14.5, color: "EAF1FB", lineSpacingMultiple: 1.15 });
});
s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: 1.0, y: 8.95, w: 18.0, h: 1.4, rectRadius: 0.12, fill: { color: AMBER } });
s.addText([
  { text: "Implikasi:  ", options: { bold: true, color: INKBL } },
  { text: "rute yang sama dapat dipangkas rata-rata ~" + k.saving_pct + "% (\u2248" + fmt(k.km_saved_total) + " km dalam periode data) hanya dengan mengurutkan ulang kunjungan secara optimal. Bagaimana caranya — berikut metodenya.", options: { color: INKBL } },
], { x: 1.4, y: 9.1, w: 17.2, h: 1.1, fontFace: FT, fontSize: 17, lineSpacingMultiple: 1.2, valign: "middle", bold: true });
pageNum(s, 8);

// SLIDE 8 — TSP
s = contentSlide("Metode · Formulasi", "Formulasi: Travelling Salesman Problem (TSP)", null, 9);
s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: 1.0, y: 4.9, w: 8.75, h: 5.45, rectRadius: 0.14, fill: { color: PAPER }, line: { color: LINE, width: 1.25 } });
s.addText("Definisi persoalan", { x: 1.45, y: 5.2, w: 8, h: 0.45, fontFace: FTB, fontSize: 20, bold: true, color: BRI });
s.addText([
  { text: "Untuk setiap mantri-hari, terdapat himpunan titik kunjungan ", options: { color: INKBL } },
  { text: "V = {1, 2, \u2026, n}", options: { color: RUST, bold: true } },
  { text: ". Cari urutan kunjungan \u03c0 yang meminimalkan total jarak tempuh:", options: { color: INKBL } },
], { x: 1.45, y: 5.7, w: 7.9, h: 1.1, fontFace: FT, fontSize: 16, lineSpacingMultiple: 1.25 });
s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: 1.45, y: 6.95, w: 7.85, h: 0.95, rectRadius: 0.08, fill: { color: SOFT } });
s.addText([
  { text: "min  ", options: { color: BRI, bold: true } },
  { text: "\u03a3", options: { color: RUST, bold: true, fontSize: 24 } },
  { text: " d(\u03c0i, \u03c0i+1)   untuk i = 1 \u2026 n\u22121", options: { color: INKBL } },
], { x: 1.6, y: 7.05, w: 7.6, h: 0.75, fontFace: "Consolas", fontSize: 17, valign: "middle" });
s.addText([
  { text: "Open-path TSP", options: { bold: true, color: AMBER } },
  { text: ": rute tidak harus kembali ke titik awal. Ruang solusi = n!/2 — tak praktis dienumerasi penuh, sehingga dipakai heuristik.", options: { color: MUTE } },
], { x: 1.45, y: 8.15, w: 7.9, h: 1.0, fontFace: FT, fontSize: 15.5, lineSpacingMultiple: 1.25 });
s.addText([
  { text: "Mengapa heuristik?  ", options: { bold: true, color: BRI } },
  { text: "n=10 \u21d2 1,8 juta rute; n=15 \u21d2 650 miliar. Nearest-Neighbor + 2-opt mencapai solusi dekat-optimal dalam milidetik.", options: { color: MUTE } },
], { x: 1.45, y: 9.35, w: 7.9, h: 1.0, fontFace: FT, fontSize: 15.5, lineSpacingMultiple: 1.25 });
s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: 10.25, y: 4.9, w: 8.75, h: 5.45, rectRadius: 0.14, fill: { color: BRI } });
s.addText("Metrik jarak: Haversine", { x: 10.7, y: 5.2, w: 8, h: 0.45, fontFace: FTB, fontSize: 20, bold: true, color: SKY });
s.addText("Jarak great-circle antar dua titik GPS, memperhitungkan kelengkungan bumi — bukan jarak garis lurus Euclidean yang keliru untuk koordinat geografis.",
  { x: 10.7, y: 5.7, w: 7.9, h: 1.1, fontFace: FT, fontSize: 16, color: "EAF1FB", lineSpacingMultiple: 1.25 });
s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: 10.7, y: 6.95, w: 7.85, h: 1.5, rectRadius: 0.08, fill: { color: INKBL } });
s.addText([
  { text: "a = sin\u00b2(\u0394\u03c6/2) + cos \u03c6\u2081\u00b7cos \u03c6\u2082\u00b7sin\u00b2(\u0394\u03bb/2)\n", options: { color: SKY } },
  { text: "d = 2R \u00b7 arcsin(\u221aa)", options: { color: "9FD9F2" } },
], { x: 10.95, y: 7.15, w: 7.4, h: 1.1, fontFace: "Consolas", fontSize: 16, lineSpacingMultiple: 1.4, valign: "middle" });
s.addText([
  { text: "R = 6.371 km", options: { bold: true, color: "FFFFFF" } },
  { text: " (radius bumi) · \u03c6 = lintang · \u03bb = bujur. Diterapkan tervektorisasi (numpy) ke seluruh pasangan titik. ", options: { color: "D6E6FA" } },
  { text: "Upgrade: ", options: { bold: true, color: AMBER } },
  { text: "ganti dengan OSRM / Google Distance Matrix untuk jarak jalan nyata.", options: { color: "D6E6FA" } },
], { x: 10.7, y: 8.75, w: 7.9, h: 1.5, fontFace: FT, fontSize: 15, lineSpacingMultiple: 1.25 });

// SLIDE 9 — ALGORITHM
s = contentSlide("Metode · Algoritma", "Dua tahap: konstruksi cepat, lalu perbaikan lokal", null, 10);
s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: 1.0, y: 4.9, w: 8.75, h: 2.55, rectRadius: 0.14, fill: { color: PAPER }, line: { color: LINE, width: 1.25 } });
s.addText([{ text: "TAHAP 1   ", options: { bold: true, color: AMBER, fontSize: 14 } }, { text: "Nearest-Neighbor (konstruksi)", options: { bold: true, color: BRI, fontSize: 19 } }], { x: 1.4, y: 5.2, w: 8, h: 0.45 });
s.addText("Mulai dari titik awal; tiap langkah pindah ke kunjungan terdekat yang belum dikunjungi sampai semua titik tercakup. Menghasilkan rute awal masuk akal secara instan.",
  { x: 1.4, y: 5.7, w: 8, h: 1.0, fontFace: FT, fontSize: 15.5, color: MUTE, lineSpacingMultiple: 1.22 });
s.addText([{ text: "Kompleksitas O(n\u00b2)", options: { bold: true, color: TEAL } }, { text: "  ·  cepat, tapi bisa terjebak rute melingkar", options: { color: MUTE } }], { x: 1.4, y: 6.85, w: 8, h: 0.4, fontFace: FT, fontSize: 15 });
s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: 1.0, y: 7.65, w: 8.75, h: 2.7, rectRadius: 0.14, fill: { color: PAPER }, line: { color: LINE, width: 1.25 } });
s.addText([{ text: "TAHAP 2   ", options: { bold: true, color: AMBER, fontSize: 14 } }, { text: "2-opt (perbaikan lokal)", options: { bold: true, color: BRI, fontSize: 19 } }], { x: 1.4, y: 7.95, w: 8, h: 0.45 });
s.addText("Untuk setiap pasang posisi (i, k), balik urutan segmen di antaranya. Bila total jarak berkurang, simpan. Ulangi sampai tak ada perbaikan (local optimum).",
  { x: 1.4, y: 8.45, w: 8, h: 1.0, fontFace: FT, fontSize: 15.5, color: MUTE, lineSpacingMultiple: 1.22 });
s.addText([{ text: "Efeknya: ", options: { bold: true, color: BRI } }, { text: "menghapus persilangan rute — jalur menyilang hampir selalu lebih panjang. ", options: { color: MUTE } }, { text: "O(n\u00b2)/iterasi, konvergen cepat \u226440 titik/hari.", options: { bold: true, color: TEAL } }], { x: 1.4, y: 9.55, w: 8, h: 0.7, fontFace: FT, fontSize: 14.5, lineSpacingMultiple: 1.15 });
s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: 10.25, y: 4.9, w: 8.75, h: 5.45, rectRadius: 0.1, fill: { color: INKBL } });
s.addText("Inti 2-opt", { x: 10.65, y: 5.1, w: 5, h: 0.4, fontFace: FTB, fontSize: 16, bold: true, color: AMBER });
s.addText([
  { text: "def two_opt(la, lo, order):\n", options: { color: "EAF1FB" } },
  { text: "  best = order; improved = True\n", options: { color: "EAF1FB" } },
  { text: "  while improved:\n", options: { color: SKY } },
  { text: "    improved = False\n", options: { color: "EAF1FB" } },
  { text: "    for i in range(1, n-1):\n", options: { color: SKY } },
  { text: "      for k in range(i+1, n):\n", options: { color: SKY } },
  { text: "        new = (best[:i] +\n", options: { color: "EAF1FB" } },
  { text: "          best[i:k+1][::-1] +   ", options: { color: AMBER } },
  { text: "# balik segmen\n", options: { color: "7FA3C9" } },
  { text: "          best[k+1:])\n", options: { color: "EAF1FB" } },
  { text: "        if route_len(new) < best_len:\n", options: { color: SKY } },
  { text: "          best = new           ", options: { color: "8FE3CF" } },
  { text: "# simpan\n", options: { color: "7FA3C9" } },
  { text: "          improved = True\n", options: { color: "EAF1FB" } },
  { text: "  return best", options: { color: "8FE3CF" } },
], { x: 10.65, y: 5.6, w: 8.1, h: 4.6, fontFace: "Consolas", fontSize: 14.5, lineSpacingMultiple: 1.2 });

// SLIDE 10 — EXAMPLE
s = contentSlide("Metode · Contoh nyata", "Anatomi satu hari: rute berputar vs rute optimal",
  "Contoh dari data \u2014 " + D.example.uker.replace("UNIT ", "") + ", " + D.example.tgl + ". Titik kunjungan identik; hanya urutannya yang disusun ulang oleh model.", 11);
s.addImage({ path: "route-opt/docs/route_actual.png", x: 1.6, y: 4.9, w: 6.8, h: 5.1 });
s.addImage({ path: "route-opt/docs/route_optimal.png", x: 11.6, y: 4.9, w: 6.8, h: 5.1 });
s.addShape(p.shapes.OVAL, { x: 9.1, y: 6.85, w: 1.8, h: 1.8, fill: { color: AMBER } });
const exSave = Math.round((D.example.act_km - D.example.opt_km) / D.example.act_km * 100);
s.addText("\u2212" + exSave + "%", { x: 9.1, y: 7.3, w: 1.8, h: 0.7, fontFace: FTB, fontSize: 26, bold: true, color: INKBL, align: "center" });
s.addText("jarak", { x: 9.1, y: 8.0, w: 1.8, h: 0.4, fontFace: FT, fontSize: 14, color: INKBL, align: "center" });
s.addText("Jarak tempuh turun dari " + D.example.act_km + " km menjadi " + D.example.opt_km + " km untuk kunjungan yang sama — tanpa melewatkan satu pun titik. Angka pada simpul = urutan kunjungan.",
  { x: 1.0, y: 10.3, w: 18, h: 0.5, fontFace: FT, fontSize: 14.5, italic: true, color: MUTE, align: "center", lineSpacingMultiple: 1.1 });

// SLIDE 11 — CLOSING
s = p.addSlide(); s.background = { color: PAPER };
s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: 0.3, y: 0.3, w: W - 0.6, h: H - 0.6, rectRadius: 0.35, fill: { type: "none" }, line: { color: SKY, width: 3 } });
brandHeader(s);
s.addImage({ path: PHONE, x: 12.5, y: 1.7, w: 6.0, h: 6.0 * 1350 / 752 });
s.addText("Terima Kasih", { x: 1.6, y: 4.4, w: 11, h: 1.6, fontFace: FTB, fontSize: 76, bold: true, color: BRI });
s.addText("Micro Risk Management Group · Juni 2026", { x: 1.65, y: 6.1, w: 11, h: 0.6, fontFace: FT, fontSize: 22, color: BRI2 });
s.addText("Dashboard interaktif & repo analitik dapat diakses untuk eksplorasi rute per Kanwil, unit kerja, dan mantri.",
  { x: 1.65, y: 6.8, w: 10, h: 0.9, fontFace: FT, fontSize: 16, color: MUTE, lineSpacingMultiple: 1.2 });
pageNum(s, 12);

p.writeFile({ fileName: "Route_Optimization_Deck.pptx" }).then(f => console.log("written", f));
