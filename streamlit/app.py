"""
Rekomendasi Rute Kunjungan Mantri — Streamlit Dashboard
========================================================
Input : daftar titik kunjungan (NIK, Nama, tipe_kunjungan, longitude, latitude)
Output: urutan rute optimal (Nearest-Neighbor + 2-opt) + peta interaktif + ringkasan jarak

Jalankan lokal:  streamlit run app.py
Deploy gratis  :  share.streamlit.io  (lihat README)
"""
import io
import numpy as np
import pandas as pd
import streamlit as st
import folium
from folium.plugins import AntPath
from streamlit_folium import st_folium

# ----------------------------------------------------------------------
# Page config & BRI styling
# ----------------------------------------------------------------------
st.set_page_config(page_title="Rekomendasi Rute Mantri — BRI",
                   page_icon="🛵", layout="wide")

BRI = "#0857C3"
st.markdown(f"""
<style>
  .stApp {{ background: #F5F8FD; }}
  h1, h2, h3 {{ color: {BRI}; }}
  [data-testid="stMetricValue"] {{ color: {BRI}; font-weight: 700; }}
  .bri-badge {{ background:{BRI}; color:#fff; padding:2px 10px; border-radius:12px;
               font-size:0.75rem; font-weight:600; }}
  div[data-testid="stSidebar"] {{ background:#fff; }}
</style>
""", unsafe_allow_html=True)

REQUIRED_COLS = ["longitude", "latitude"]
COL_ALIASES = {
    "lon": "longitude", "lng": "longitude", "long": "longitude", "bujur": "longitude",
    "lat": "latitude", "lintang": "latitude",
    "nama": "Nama", "name": "Nama", "nasabah": "Nama",
    "nik": "NIK", "id": "NIK", "pn": "NIK",
    "tipe": "tipe_kunjungan", "tipe_kunjungan": "tipe_kunjungan", "jenis": "tipe_kunjungan",
}


# ----------------------------------------------------------------------
# Optimization core (haversine + Nearest-Neighbor + 2-opt)
# ----------------------------------------------------------------------
def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0
    p = np.pi / 180.0
    a = (0.5 - np.cos((lat2 - lat1) * p) / 2
         + np.cos(lat1 * p) * np.cos(lat2 * p) * (1 - np.cos((lon2 - lon1) * p)) / 2)
    return 2 * R * np.arcsin(np.sqrt(a))


def route_length(la, lo, order):
    if len(order) < 2:
        return 0.0
    idx = np.array(order)
    return float(haversine(la[idx[:-1]], lo[idx[:-1]], la[idx[1:]], lo[idx[1:]]).sum())


def nearest_neighbor(la, lo, start=0):
    n = len(la)
    cur, order, rem = start, [start], set(range(n)) - {start}
    while rem:
        nxt = min(rem, key=lambda k: haversine(la[cur], lo[cur], la[k], lo[k]))
        order.append(nxt); rem.discard(nxt); cur = nxt
    return order


def two_opt(la, lo, order, max_iter=60):
    best, best_len, improved, it = order[:], route_length(la, lo, order), True, 0
    while improved and it < max_iter:
        improved, it = False, it + 1
        for i in range(1, len(best) - 1):
            for k in range(i + 1, len(best)):
                cand = best[:i] + best[i:k + 1][::-1] + best[k + 1:]
                cl = route_length(la, lo, cand)
                if cl + 1e-9 < best_len:
                    best, best_len, improved = cand, cl, True
    return best, best_len


def optimize(df, start_idx=0):
    la, lo = df["latitude"].to_numpy(), df["longitude"].to_numpy()
    n = len(la)
    if n < 2:
        return list(range(n)), 0.0, 0.0
    actual_len = route_length(la, lo, list(range(n)))      # urutan input apa adanya
    nn = nearest_neighbor(la, lo, start=start_idx)
    opt, opt_len = two_opt(la, lo, nn)
    return opt, opt_len, actual_len


# ----------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------
def normalize_columns(df):
    ren = {}
    for c in df.columns:
        key = str(c).strip().lower()
        if key in COL_ALIASES:
            ren[c] = COL_ALIASES[key]
    df = df.rename(columns=ren)
    return df


def load_any(file):
    name = file.name.lower()
    if name.endswith((".xlsx", ".xls")):
        return pd.read_excel(file)
    return pd.read_csv(file)


def validate(df):
    df = normalize_columns(df)
    missing = [c for c in REQUIRED_COLS if c not in df.columns]
    if missing:
        return None, f"Kolom wajib hilang: {missing}. Minimal perlu 'longitude' & 'latitude'."
    df = df.dropna(subset=["longitude", "latitude"]).reset_index(drop=True)
    df["longitude"] = pd.to_numeric(df["longitude"], errors="coerce")
    df["latitude"] = pd.to_numeric(df["latitude"], errors="coerce")
    df = df.dropna(subset=["longitude", "latitude"]).reset_index(drop=True)
    if "Nama" not in df.columns:
        df["Nama"] = [f"Titik {i+1}" for i in range(len(df))]
    if "NIK" not in df.columns:
        df["NIK"] = ["" for _ in range(len(df))]
    if "tipe_kunjungan" not in df.columns:
        df["tipe_kunjungan"] = "kunjungan"
    if len(df) < 2:
        return None, "Minimal 2 titik kunjungan diperlukan untuk membuat rute."
    return df, None


TYPE_COLOR = {
    "penagihan": "#C0392B",
    "penagihan_extracomp": "#E67E22",
    "pembinaan": "#1F8A78",
    "kunjungan_pemasaran_pinjaman": "#0857C3",
    "kunjungan_pemasaran_kelolaan": "#307FE2",
}


def make_map(df, order):
    od = df.iloc[order].reset_index(drop=True)
    center = [od["latitude"].mean(), od["longitude"].mean()]
    m = folium.Map(location=center, zoom_start=14, tiles="cartodbpositron")
    coords = list(zip(od["latitude"], od["longitude"]))
    AntPath(coords, color=BRI, weight=4, delay=800).add_to(m)
    for seq, (_, r) in enumerate(od.iterrows(), 1):
        is_start = seq == 1
        color = "#0B2447" if is_start else BRI
        folium.Marker(
            [r["latitude"], r["longitude"]],
            tooltip=f"#{seq} · {r['Nama']} ({r['tipe_kunjungan']})",
            icon=folium.DivIcon(html=(
                f'<div style="background:{color};color:#fff;border:2px solid #fff;'
                f'border-radius:50%;width:30px;height:30px;line-height:26px;text-align:center;'
                f'font-weight:700;font-family:sans-serif;box-shadow:0 1px 4px rgba(0,0,0,.4);">'
                f'{seq}</div>'))
        ).add_to(m)
    bounds = [[od["latitude"].min(), od["longitude"].min()],
              [od["latitude"].max(), od["longitude"].max()]]
    m.fit_bounds(bounds, padding=(30, 30))
    return m


# ----------------------------------------------------------------------
# Sidebar — input
# ----------------------------------------------------------------------
with st.sidebar:
    st.markdown(f"### 🛵 Rute Mantri")
    st.caption("Micro Risk Management Group · BRI")
    st.markdown("---")
    st.markdown("**1. Sumber data titik kunjungan**")
    source = st.radio("Pilih sumber:",
                      ["Contoh (demo 12 titik)", "Sampel input (2 titik)",
                       "Input manual (ketik koordinat)", "Unggah file sendiri"],
                      label_visibility="collapsed")

    uploaded = None
    if source == "Unggah file sendiri":
        uploaded = st.file_uploader("CSV / Excel (kolom: NIK, Nama, tipe_kunjungan, longitude, latitude)",
                                    type=["csv", "xlsx", "xls"])
        st.caption("Wajib ada kolom **longitude** & **latitude**. Sisanya opsional.")
    elif source == "Input manual (ketik koordinat)":
        st.caption("Isi/ubah tabel titik kunjungan di area utama, lalu rute dihitung otomatis.")

st.title("Rekomendasi Rute Kunjungan Mantri")
st.markdown("Optimalkan urutan kunjungan harian agar **jarak tempuh minimal** — "
            "berbasis algoritma *Nearest-Neighbor + 2-opt* (varian Travelling Salesman Problem).")

# load data
import os
HERE = os.path.dirname(os.path.abspath(__file__))
if source == "Contoh (demo 12 titik)":
    raw = pd.read_csv(os.path.join(HERE, "demo_input.csv"))
elif source == "Sampel input (2 titik)":
    raw = pd.read_csv(os.path.join(HERE, "sampel_input.csv"))
elif source == "Input manual (ketik koordinat)":
    st.subheader("✍️ Input manual titik kunjungan")
    st.caption("Ketik atau tempel koordinat tiap titik. Tambah baris lewat tombol **+** di bawah tabel. "
               "Kolom **longitude** & **latitude** wajib diisi (format desimal, mis. 107.5688 / -6.9180).")
    TYPE_OPTIONS = ["penagihan", "penagihan_extracomp", "pembinaan",
                    "kunjungan_pemasaran_pinjaman", "kunjungan_pemasaran_kelolaan"]
    if "manual_df" not in st.session_state:
        st.session_state.manual_df = pd.DataFrame({
            "NIK": ["1111", "2222", "3333"],
            "Nama": ["Tio", "Astri", "Budi"],
            "tipe_kunjungan": ["penagihan", "penagihan", "pembinaan"],
            "longitude": [107.568838, 107.572601, 107.560000],
            "latitude": [-6.917995, -6.911114, -6.905000],
        })
    edited = st.data_editor(
        st.session_state.manual_df,
        num_rows="dynamic",
        use_container_width=True,
        key="manual_editor",
        column_config={
            "NIK": st.column_config.TextColumn("NIK", help="ID debitur (opsional)", width="small"),
            "Nama": st.column_config.TextColumn("Nama", help="Nama debitur / titik"),
            "tipe_kunjungan": st.column_config.SelectboxColumn("Tipe kunjungan", options=TYPE_OPTIONS, width="medium"),
            "longitude": st.column_config.NumberColumn("Longitude", format="%.6f", help="Bujur (95–141)"),
            "latitude": st.column_config.NumberColumn("Latitude", format="%.6f", help="Lintang (−11 s/d 6)"),
        },
    )
    st.session_state.manual_df = edited
    raw = edited.copy()
    n_valid = raw.dropna(subset=["longitude", "latitude"]).shape[0] if {"longitude", "latitude"}.issubset(raw.columns) else 0
    if n_valid < 2:
        st.info("Isi minimal **2 titik** dengan longitude & latitude untuk menghitung rute.")
        st.stop()
else:
    if uploaded is None:
        st.info("⬅️ Unggah file CSV/Excel pada panel kiri, atau pilih data contoh untuk mencoba.")
        st.stop()
    raw = load_any(uploaded)

df, err = validate(raw)
if err:
    st.error(err)
    st.stop()

# ----------------------------------------------------------------------
# Sidebar — options (after data is known)
# ----------------------------------------------------------------------
with st.sidebar:
    st.markdown("**2. Titik awal (start)**")
    names = [f"{i+1}. {n}" for i, n in enumerate(df["Nama"])]
    start_label = st.selectbox("Mulai dari:", names, index=0, label_visibility="collapsed")
    start_idx = names.index(start_label)
    st.markdown("---")
    st.caption(f"{len(df)} titik kunjungan dimuat.")
    st.markdown("---")
    st.markdown("**3. Asumsi estimasi tempuh**")
    speed = st.slider("Kecepatan rata-rata motor (km/jam)", 15, 60, 30, 5)
    visit_min = st.slider("Durasi tiap kunjungan (menit)", 0, 60, 15, 5)
    fuel_eff = st.slider("Konsumsi BBM motor (km/liter)", 20, 70, 45, 5)
    fuel_price = st.number_input("Harga BBM (Rp/liter)", min_value=0, value=12500, step=500)
    detour = st.slider("Faktor koreksi jarak jalan (×)", 1.0, 1.8, 1.3, 0.1,
                       help="Jarak garis-lurus dikalikan faktor ini agar mendekati jarak jalan nyata.")

# ----------------------------------------------------------------------
# Optimize
# ----------------------------------------------------------------------
order, opt_len, actual_len = optimize(df, start_idx=start_idx)
saving = (actual_len - opt_len) / actual_len * 100 if actual_len > 0 else 0.0

c1, c2, c3, c4 = st.columns(4)
c1.metric("Titik kunjungan", len(df))
c2.metric("Rute urutan input", f"{actual_len:.2f} km")
c3.metric("Rute rekomendasi", f"{opt_len:.2f} km", f"−{actual_len-opt_len:.2f} km",
          delta_color="inverse")
c4.metric("Penghematan jarak", f"{saving:.0f}%")

st.markdown("---")
left, right = st.columns([1.45, 1])

with left:
    st.subheader("🗺️ Peta rute rekomendasi")
    st.caption("Angka pada penanda = urutan kunjungan. Titik gelap = lokasi awal.")
    st_folium(make_map(df, order), height=520, use_container_width=True)

with right:
    st.subheader("📋 Urutan kunjungan")
    od = df.iloc[order].reset_index(drop=True)
    legs = [0.0]
    la, lo = od["latitude"].to_numpy(), od["longitude"].to_numpy()
    for i in range(1, len(od)):
        legs.append(round(float(haversine(la[i-1], lo[i-1], la[i], lo[i])), 2))
    out = pd.DataFrame({
        "Urutan": range(1, len(od) + 1),
        "Nama": od["Nama"],
        "Tipe": od["tipe_kunjungan"],
        "Jarak dari titik sebelumnya (km)": legs,
    })
    st.dataframe(out, hide_index=True, use_container_width=True, height=320)

    # ---- Estimasi jarak, waktu & BBM ----
    road_km = opt_len * detour                       # jarak jalan ≈ garis lurus × faktor koreksi
    travel_min = road_km / speed * 60 if speed else 0
    total_min = travel_min + visit_min * len(od)     # tempuh + waktu kunjungan
    liters = road_km / fuel_eff if fuel_eff else 0
    fuel_cost = liters * fuel_price

    def hhmm(m):
        h = int(m // 60); mm = int(round(m - h * 60))
        return (f"{h} jam {mm} mnt" if h else f"{mm} mnt")

    st.markdown("##### 🛵 Estimasi tempuh rute rekomendasi")
    e1, e2 = st.columns(2)
    e1.metric("Jarak jalan (≈)", f"{road_km:.1f} km", help=f"{opt_len:.2f} km garis lurus × {detour:.1f}")
    e2.metric("Waktu tempuh berkendara antar titik", hhmm(travel_min))
    e3, e4 = st.columns(2)
    e3.metric("Total waktu (+ kunjungan)", hhmm(total_min),
              help=f"termasuk {visit_min} mnt × {len(od)} kunjungan")
    e4.metric("Konsumsi BBM", f"{liters:.2f} L")
    st.metric("Estimasi biaya BBM", f"Rp {fuel_cost:,.0f}".replace(",", "."))
    st.caption(f"Asumsi: {speed} km/jam · {fuel_eff} km/L · Rp {fuel_price:,.0f}/L · faktor jalan ×{detour:.1f}".replace(",", "."))

    # add estimasi to CSV export
    summary = pd.DataFrame({
        "Keterangan": ["Jarak rute (garis lurus, km)", "Jarak jalan estimasi (km)",
                       "Waktu tempuh berkendara (menit)", "Total waktu incl. kunjungan (menit)",
                       "Konsumsi BBM (liter)", "Estimasi biaya BBM (Rp)"],
        "Nilai": [round(opt_len, 2), round(road_km, 2), round(travel_min, 1),
                  round(total_min, 1), round(liters, 2), round(fuel_cost, 0)],
    })
    csv = ("RUTE REKOMENDASI\n" + out.to_csv(index=False)
           + "\nRINGKASAN ESTIMASI\n" + summary.to_csv(index=False)).encode("utf-8")
    st.download_button("⬇️ Unduh rute + estimasi (CSV)", csv, "rute_rekomendasi.csv", "text/csv",
                       use_container_width=True)

st.markdown("---")
with st.expander("ℹ️ Tentang metode & format input"):
    st.markdown("""
**Metode.** Persoalan ini adalah varian *Travelling Salesman Problem (TSP)*: untuk sekumpulan
titik kunjungan, cari urutan dengan total jarak terpendek. Jarak antar titik dihitung dengan
**formula haversine** (great-circle, memperhitungkan kelengkungan bumi). Rute disusun dengan
**Nearest-Neighbor** (konstruksi cepat) lalu diperbaiki dengan **2-opt** (membalik segmen
selama jarak berkurang). Untuk akurasi jarak jalan nyata, matriks haversine dapat diganti
dengan OSRM / Google Distance Matrix.

**Format input.** File CSV atau Excel dengan kolom:
`NIK`, `Nama`, `tipe_kunjungan`, `longitude`, `latitude`. Hanya **longitude** & **latitude**
yang wajib; kolom lain opsional (alias seperti `lon`/`lat`/`nama` otomatis dikenali).

*Catatan: rute "urutan input" dihitung sesuai urutan baris pada file — penghematan menunjukkan
seberapa jauh pengurutan ulang dapat memangkas jarak.*
    """)

st.caption("Dibuat untuk perencanaan kunjungan lapangan mantri · Data agregat, tanpa identitas debitur dipublikasikan.")
