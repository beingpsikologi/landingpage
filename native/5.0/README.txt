BEING ADMIN TERPADU v5.0 NATIVE

Tujuan:
Menghentikan seluruh masalah fetch / JSONP / redirect script.googleusercontent.com pada Admin Terpadu.

ARSITEKTUR:
Browser Admin -> google.script.run -> Apps Script yang sama -> Spreadsheet langsung.
Tidak ada fetch ke Voice API.
Tidak ada fetch ke Bangdir API.
Tidak ada JSONP.

PASANG DI PROJECT BARU YANG TERIKAT KE SPREADSHEET "being voice":
1. Buka spreadsheet being voice dengan akun adminbeing.
2. Ekstensi -> Apps Script.
3. Sebaiknya buat project BARU khusus Admin Native agar tidak mengganggu Code Voice publik yang sudah ada.
   Jika lewat spreadsheet hanya membuka project lama, buat project Apps Script standalone baru lalu tambahkan Script Property VOICE_SPREADSHEET_ID secara manual.
4. Buat file Code.gs dan Index.html dari paket ini.
5. Bila project TERIKAT ke being voice:
   jalankan setupBeingAdminNative() sekali.
6. Jalankan loginAdmin('being123456') dari editor bila ingin tes.
7. Deploy -> New deployment -> Web app.
   Execute as: Me
   Who has access: Anyone
8. Buka URL /exec. Login PIN: being123456.

PENTING:
- Bangdir Spreadsheet dibaca langsung dari ID:
  1jzx2Sna9p0a3wbhxAcqubxqGBcHEo585Ku34AInfG14
- Spreadsheet Voice tidak dimigrasi; setup menyimpan ID spreadsheet being voice ke Script Properties.
- Website BEING dan Bangdir tidak perlu diubah untuk mulai memakai Admin Native ini.
- Admin lama di GitHub boleh dibiarkan sebagai cadangan, tetapi jangan dipakai sebagai baseline lagi.

FITUR v5.0:
- Dashboard
- Database Kontak + sinkron peserta lama
- Program: buat/edit/buka-tutup/hapus
- Peserta: salin link/WA/email/hapus
- Pembayaran: approve/tolak/hapus
- Sesi: buat/edit/publikasi-draf/zoom/hapus
- Materi: buat/edit/publikasi-draf/hapus
- Formulir: daftar/buat/edit/hapus
- Tidak mengubah data spreadsheet yang sudah ada
