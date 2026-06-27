"""
Route Optimization — Evaluasi & Model Optimalisasi Rute Mantri
================================================================
Modul ini:
  1. Membersihkan data kunjungan mantri (penagihan / pembinaan / pemasaran)
  2. Mengevaluasi rute aktual per mantri-hari (jarak tempuh berdasar urutan waktu)
  3. Membangun rute optimal (Nearest-Neighbor + 2-opt) sebagai benchmark
  4. Menghasilkan KPI agregat & data.json untuk dashboard web

Penggunaan:
    python src/route_optimizer.py --input data/Route_Optimization.xlsx --out docs/data.json
"""

import argparse
import json
import numpy as np
import pandas as pd


# ----------------------------------------------------------------------
# Geospatial helpers
# ----------------------------------------------------------------------
def haversine(lat1, lon1, lat2, lon2):
    """Jarak great-circle (km) — vektorisasi numpy."""
    R = 6371.0
    p = np.pi / 180.0
    a = (0.5 - np.cos((lat2 - lat1) * p) / 2
         + np.cos(lat1 * p) * np.cos(lat2 * p) * (1 - np.cos((lon2 - lon1) * p)) / 2)
    return 2 * R * np.arcsin(np.sqrt(a))


def _pair_dist(la, lo, i, j):
    return haversine(la[i], lo[i], la[j], lo[j])


# ----------------------------------------------------------------------
# Optimizer: Nearest-Neighbor construction + 2-opt improvement
# ----------------------------------------------------------------------
def nearest_neighbor(la, lo, start=0):
    """Bangun rute awal dengan greedy nearest-neighbor."""
    n = len(la)
    cur = start
    rem = set(range(n)) - {start}
    order = [start]
    while rem:
        nxt = min(rem, key=lambda k: _pair_dist(la, lo, cur, k))
        order.append(nxt)
        rem.discard(nxt)
        cur = nxt
    return order


def route_length(la, lo, order):
    if len(order) < 2:
        return 0.0
    idx = np.array(order)
    return float(haversine(la[idx[:-1]], lo[idx[:-1]], la[idx[1:]], lo[idx[1:]]).sum())


def two_opt(la, lo, order, max_iter=50):
    """Perbaikan rute dengan 2-opt (open path, tanpa kembali ke titik awal)."""
    best = order[:]
    best_len = route_length(la, lo, best)
    improved = True
    it = 0
    while improved and it < max_iter:
        improved = False
        it += 1
        for i in range(1, len(best) - 1):
            for k in range(i + 1, len(best)):
                new = best[:i] + best[i:k + 1][::-1] + best[k + 1:]
                nl = route_length(la, lo, new)
                if nl + 1e-9 < best_len:
                    best, best_len = new, nl
                    improved = True
    return best, best_len


def optimize_route(la, lo):
    """Return (optimal_order, optimal_km). Untuk titik kecil pakai NN+2-opt."""
    if len(la) < 2:
        return list(range(len(la))), 0.0
    order = nearest_neighbor(la, lo, start=0)
    if 3 <= len(la) <= 40:
        order, km = two_opt(la, lo, order)
    else:
        km = route_length(la, lo, order)
    return order, km


# ----------------------------------------------------------------------
# Data cleaning & evaluation
# ----------------------------------------------------------------------
def load_and_clean(path):
    df = pd.read_excel(path)
    # Skema dataset dapat berbeda antar ekstraksi: samakan nama kolom jam,
    # dan filter status hanya bila kolomnya tersedia.
    if "Jam kunjungan" in df.columns and "Jam Kunjungan" not in df.columns:
        df = df.rename(columns={"Jam kunjungan": "Jam Kunjungan"})
    if "status_kunjungan" in df.columns:
        df = df[df["status_kunjungan"] == "DONE"].copy()
    # Buang baris dengan koordinat / jam / wilayah kosong
    df = df.dropna(subset=["longitude", "latitude", "Jam Kunjungan",
                           "region_desc", "pn"]).copy()
    # Filter koordinat di luar bounding-box Indonesia (GPS error)
    mask = df["longitude"].between(95, 141) & df["latitude"].between(-11, 6)
    df = df[mask].copy()
    df["tgl"] = pd.to_datetime(df["tgl_kunjungan"])
    t = pd.to_datetime(df["Jam Kunjungan"].astype(str), format="%H:%M:%S", errors="coerce")
    df["jam"] = t.dt.hour + t.dt.minute / 60
    return df.sort_values(["pn", "tgl", "jam"])


def evaluate(df, max_visits=40, max_day_km=500):
    """Hitung jarak aktual vs optimal per mantri-hari."""
    recs = []
    for (pn, d), sub in df.groupby(["pn", "tgl"]):
        if not (2 <= len(sub) <= max_visits):
            continue
        la = sub["latitude"].values
        lo = sub["longitude"].values
        act = route_length(la, lo, list(range(len(sub))))  # urutan kronologis aktual
        if act >= max_day_km:
            continue
        _, opt = optimize_route(la, lo)
        recs.append(dict(
            pn=int(pn), uker=sub["nama_uker"].iloc[0], region=sub["region_desc"].iloc[0],
            branch=(sub["branch"].iloc[0] if "branch" in sub.columns
                    else sub.get("mainbr_desc", pd.Series([""])).iloc[0]),
            tgl=str(d.date()), n=int(len(sub)),
            act=round(float(act), 2), opt=round(float(opt), 2),
        ))
    return pd.DataFrame(recs)


# ----------------------------------------------------------------------
# Dashboard data export
# ----------------------------------------------------------------------
def build_dashboard_json(df_raw, r, out_path):
    tot_act, tot_opt = r["act"].sum(), r["opt"].sum()
    reg = r.groupby("region").agg(days=("act", "size"), act=("act", "sum"),
                                  opt=("opt", "sum"), avgn=("n", "mean")).reset_index()
    reg["saving"] = (reg["act"] - reg["opt"]) / reg["act"] * 100
    uk = r.groupby(["uker", "region"]).agg(days=("act", "size"), act_km=("act", "mean"),
                                           opt_km=("opt", "mean"), avgn=("n", "mean")).reset_index()
    uk["saving"] = (uk["act_km"] - uk["opt_km"]) / uk["act_km"] * 100
    uk = uk.sort_values("saving", ascending=False)
    r = r.copy()
    r["week"] = pd.to_datetime(r["tgl"]).dt.isocalendar().week
    wk = r.groupby("week").agg(act=("act", "mean"), opt=("opt", "mean"),
                               days=("act", "size")).reset_index()
    out = dict(
        kpi=dict(
            total_visits=int(df_raw.shape[0]), n_mantri=int(df_raw["pn"].nunique()),
            n_uker=int(df_raw["nama_uker"].nunique()), n_region=int(df_raw["region_desc"].nunique()),
            mantri_days=int(len(r)), avg_visits_day=round(float(r["n"].mean()), 1),
            avg_km_day=round(float(r["act"].mean()), 2), opt_km_day=round(float(r["opt"].mean()), 2),
            saving_pct=round(float((tot_act - tot_opt) / tot_act * 100), 1),
            km_saved_total=int(tot_act - tot_opt),
        ),
        region=[dict(name=x["region"], days=int(x["days"]), act=round(x["act"] / x["days"], 2),
                     opt=round(x["opt"] / x["days"], 2), saving=round(x["saving"], 1),
                     avgn=round(x["avgn"], 1)) for _, x in reg.iterrows()],
        uker=[dict(name=x["uker"], region=x["region"], days=int(x["days"]),
                   act=round(x["act_km"], 2), opt=round(x["opt_km"], 2),
                   saving=round(x["saving"], 1), avgn=round(x["avgn"], 1)) for _, x in uk.iterrows()],
        weekly=[dict(week=int(x["week"]), act=round(x["act"], 2), opt=round(x["opt"], 2),
                     days=int(x["days"])) for _, x in wk.iterrows() if x["days"] > 20],
    )
    with open(out_path, "w") as f:
        json.dump(out, f)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", default="data/Route_Optimization_2.xlsx")
    ap.add_argument("--out", default="docs/data.json")
    args = ap.parse_args()

    print("Loading & cleaning ...")
    df = load_and_clean(args.input)
    print(f"  {len(df):,} valid visits | {df['pn'].nunique()} mantri | {df['nama_uker'].nunique()} uker")

    print("Evaluating routes (NN + 2-opt) ...")
    r = evaluate(df)
    saving = (r["act"].sum() - r["opt"].sum()) / r["act"].sum() * 100
    print(f"  {len(r):,} mantri-days | avg actual {r['act'].mean():.2f} km | "
          f"avg optimal {r['opt'].mean():.2f} km | saving {saving:.1f}%")

    print("Writing dashboard JSON ...")
    build_dashboard_json(df, r, args.out)
    print(f"  -> {args.out}")


if __name__ == "__main__":
    main()
