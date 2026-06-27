# Dashboard Rekomendasi Rute Kunjungan Mantri (Streamlit)

Aplikasi web interaktif untuk **merekomendasikan urutan rute kunjungan harian mantri** agar jarak tempuh minimal. Mantri/supervisor cukup mengunggah daftar titik debitur yang akan dikunjungi, dan aplikasi mengembalikan urutan rute optimal beserta peta interaktif dan estimasi penghematan jarak.

Algoritma: **Nearest-Neighbor + 2-opt** (varian Travelling Salesman Problem), jarak antar titik dihitung dengan formula **haversine**.

---

## Cara menjalankan secara lokal

```bash
cd streamlit
pip install -r requirements.txt
streamlit run app.py
```

Aplikasi terbuka di `http://localhost:8501`.

---

## Deploy GRATIS ke internet — Streamlit Community Cloud

1. Push folder repo ini ke GitHub (lihat README utama).
2. Buka **[share.streamlit.io](https://share.streamlit.io)** → login dengan GitHub.
3. **New app** → pilih repo Anda, branch `main`, dan set **Main file path** ke:
   ```
   streamlit/app.py
   ```
4. Klik **Deploy**. Dalam ~2 menit aplikasi live di URL publik gratis seperti
   `https://<nama-app>.streamlit.app`.

> Streamlit Community Cloud membaca `streamlit/requirements.txt` secara otomatis untuk memasang dependensi.

### Alternatif gratis lain
- **Hugging Face Spaces** (pilih SDK: Streamlit), unggah isi folder `streamlit/`.
- **Railway / Render** (free tier) dengan start command: `streamlit run app.py --server.port $PORT`.

---

## Format file input

CSV atau Excel dengan kolom berikut (hanya `longitude` & `latitude` yang **wajib**):

| Kolom | Wajib | Keterangan |
|---|---|---|
| `longitude` | ✅ | Bujur (95–141 untuk Indonesia) |
| `latitude` | ✅ | Lintang (−11 s/d 6 untuk Indonesia) |
| `Nama` | – | Nama debitur/titik (default: "Titik N") |
| `NIK` | – | ID debitur (opsional) |
| `tipe_kunjungan` | – | penagihan / pembinaan / pemasaran |

Alias kolom umum dikenali otomatis (`lon`, `lng`, `lat`, `nama`, `pn`, dll).

Contoh: `sampel_input.csv` (2 titik, format dari user) dan `demo_input.csv` (12 titik di area Bandung untuk demonstrasi optimalisasi).

Selain unggah file, tersedia juga **Input manual** — ketik/tempel koordinat tiap titik langsung di tabel editable pada aplikasi (tambah/hapus baris dinamis), cocok untuk perencanaan rute cepat tanpa menyiapkan file.

---

## Cara kerja singkat

1. **Input** — daftar titik kunjungan (koordinat GPS).
2. **Matriks jarak** — haversine antar seluruh titik.
3. **Nearest-Neighbor** — bangun rute awal dari titik start.
4. **2-opt** — balik segmen rute selama total jarak berkurang.
5. **Output** — urutan optimal + peta + jarak per leg + total penghematan.

Untuk akurasi jarak jalan sebenarnya (bukan garis lurus), matriks haversine dapat diganti dengan **OSRM** atau **Google Distance Matrix API**.
