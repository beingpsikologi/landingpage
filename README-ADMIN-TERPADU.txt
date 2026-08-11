BEING ADMIN TERPADU v1
======================
Tujuan:
- Satu login admin untuk Pengembangan Diri + Suara Anda/Formulir.
- Satu Database Kontak (sheet KONTAK di Spreadsheet Pengembangan Diri).
- Data peserta lama tetap dipertahankan.
- Data formulir lama SURVEYS / QUESTIONS / RESPONSES tetap dipertahankan.
- Istilah yang tampil ke pengguna/admin: FORMULIR, bukan SURVEI.
- Analitik respons berupa ringkasan batang seperti Google Forms + respons individual + ekspor CSV.

PENTING: jangan hapus spreadsheet lama.

A. APPS SCRIPT PENGEMBANGAN DIRI (adminbeing)
------------------------------------------------
1. Buka Apps Script yang sekarang dipakai bangdir.beingpsikologi.com.
2. Backup Code.gs lama.
3. Timpa Code.gs dengan:
   apps-script/Code-Bangdir-v2.3.gs
4. Pastikan CONFIG (rekening, folder pembayaran, WEB_BASE_URL) tetap sesuai data resmi Anda.
5. Jalankan setupBeingLite() SATU KALI.
   Ini akan menambahkan sheet KONTAK dan header baru tanpa menghapus data lama.
6. Deploy > Manage deployments > Edit > New version > Deploy.
7. PERTAHANKAN URL deployment yang sama bila memungkinkan.
8. Salin URL Web App /exec; nanti tempel pada assets/admin-config.js sebagai BANGDIR_API_URL.

B. APPS SCRIPT SUARA ANDA / FORMULIR
-------------------------------------
1. Buka Apps Script yang terhubung dengan spreadsheet "being voice" lama.
2. Backup Code.gs lama.
3. Timpa dengan:
   apps-script/Code-Formulir-v2.0.gs
4. Jalankan setupBeingVoice() SATU KALI.
   Header RESPONSES lama tidak dihapus; sistem hanya menambahkan:
   respondentEmail, respondentWA, respondentInstitution.
5. Jalankan setUnifiedAdminPin() SATU KALI.
   Ini menyamakan PIN Formulir dengan kunci Bangdir saat ini: being123456.
   Jika nanti kunci Bangdir diganti, ubah juga fungsi ini/ADMIN_PIN agar sama.
6. Jalankan setMasterSpreadsheetId() SATU KALI.
   Ini mengarahkan kontak Formulir ke spreadsheet Pengembangan Diri:
   1jzx2Sna9p0a3wbhxAcqubxqGBcHEo585Ku34AInfG14
7. Deploy > Manage deployments > Edit > New version > Deploy.
8. Jika URL deployment berubah, update VOICE_API_URL pada assets/admin-config.js dan assets/config.js.

C. GITHUB dash-being / landingpage
----------------------------------
File yang ditambah/ditimpa:
- admin.html                      -> Dashboard Admin Terpadu
- suara-anda.html                 -> istilah Formulir + identitas baru
- assets/admin-unified.css
- assets/admin-unified.js
- assets/admin-config.js
- assets/voice-public-v2.js

1. Buka assets/admin-config.js.
2. VOICE_API_URL sudah diisi dari config lama Anda.
3. Isi BANGDIR_API_URL dengan URL /exec Apps Script adminbeing yang saat ini berfungsi.
4. Upload/timpa file ke repository landingpage.
5. Tunggu GitHub Pages selesai deploy lalu Ctrl+F5.

D. MIGRASI DATA LAMA
--------------------
Setelah berhasil login ke admin.html:
1. Buka Database Kontak.
2. Klik "Sinkronkan peserta lama".
3. Klik "Sinkronkan respons formulir lama".

Catatan respons Formulir lama:
- SURVEYS, QUESTIONS, RESPONSES tidak dipindah atau dihapus.
- Dashboard membaca data lama langsung dari sheet tersebut.
- respondentContact lama akan dicoba dikenali sebagai email atau WA.
- Jika respons lama anonim/tidak berisi identitas, respons tetap ada untuk grafik tetapi tidak dibuat sebagai kontak.

E. SATU LOGIN
-------------
Login terpadu bekerja bila PIN Formulir dan ADMIN_KEY Bangdir sama.
Versi ini mengikuti ADMIN_KEY Bangdir yang dikirim: being123456.
Jangan tampilkan PIN ini di halaman publik.

F. DATABASE KONTAK
------------------
Sheet KONTAK berada di spreadsheet Pengembangan Diri dan menjadi master orang:
ContactID | Nama | Email | WA | Instansi | Sumber | PertamaMasuk | TerakhirAktif | TotalInteraksi | ProgramIDs | FormulirIDs

Pencocokan kontak:
1. Email sama -> orang yang sama.
2. Bila email kosong/tidak sama, WA sama -> orang yang sama.
3. Satu orang dapat mempunyai banyak ProgramIDs dan FormulirIDs.

G. URUTAN TES
-------------
1. Login admin.html dengan PIN terpadu.
2. Pastikan Dashboard menampilkan Program dan Formulir.
3. Buka Database Kontak dan sinkronkan data lama.
4. Buat satu Formulir tes, aktifkan, isi identitas + jawaban.
5. Cek Respons & Analitik.
6. Cek Database Kontak: identitas pengisi harus muncul dengan sumber FORMULIR.
7. Daftar program Pengembangan Diri dengan email/WA yang sama.
8. Cek Database Kontak: tetap satu orang, sumber menjadi FORMULIR | PENGEMBANGAN DIRI.
