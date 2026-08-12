PATCH FORMULIR PUBLIK — UPLOAD FILE

File Admin v5.5 mengembalikan jenis pertanyaan "Kirim File / Berkas".
Agar pengguna benar-benar dapat upload PDF/JPEG/PNG/MP4/MOV/DOC/DOCX:

1. Di repo website BEING, taruh:
   voice-public-v2-file-upload.js
   menjadi:
   assets/voice-public.js

2. Pastikan suara-anda.html masih memanggil:
   <script src="assets/voice-api.js"></script>
   <script src="assets/voice-public.js"></script>

3. Backend Voice/Formulir yang aktif harus masih memiliki action:
   public.uploadFile
   dan fungsi publicUploadFile_().
   Backend Voice lama yang kita gunakan memang sudah punya fungsi ini.

4. Opsional:
   di Script Properties backend Voice tambahkan:
   UPLOAD_FOLDER_ID = ID folder Google Drive khusus upload formulir.
   Jika kosong, file masuk ke My Drive root akun pemilik Apps Script.
