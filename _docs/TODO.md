## Phase 1
- [x] initiate bun cloudflare worker
- [x] konek waha webhook dan berhasil
- [x] simple command dan berhasil
- [x] terapin env best practice menggunakan secret store
- [x] terapin fitur ai dan berhasil
- [x] modular function dan workflow
- [x] terapkan cron dan berhasil
- [x] terapkan crud assignment pake sqlite dan berhasil
- [x] tambahin prettier
- [x] rapihin folder structure
- [x] tambahin fungsi pantun
- [x] tambahin data pantun yang berkualitas
- [x] tiap kali berada di grup baru, otomatis insert data di db
- [x] sesuaikan lagi schema.ts
- [x] pindah ke bun
- [x] terapin agents.md
- [x] rapihin agents.md
- [x] migrasi postgres ke d1 db
- [x] balik fokus ke skema dan db
- [x] sederhanakan skema database
- [x] atur settings di skema database
- [x] lakuin testing dulu ygy
- [ ] implementasi fitur quiz
- [ ] implementasi banyak api yang bisa dipake
- [ ] tambahin fitur pengingat sholat
- [x] tambahin fitur bitcoin
- [x] tambahin fitur soal math
- [ ] tambahin fitur soal math difficult easy, medium, hard
- [ ] fitur tagall admin
<!-- - [ ] ubah assignment dari sqlite ke drizzle orm -->
- [ ] fitur download yt/ig/fb
- [x] fitur open close group (hanya admin)
- [ ] fitur kick orang di grup (hanya admin)
- [ ] deteksi link physing pake thrid party API
- [ ] fitur note yang bisa dipakai X
- [ ] fitur note dihapus setelah X

# prompt update besar besaran cuy (anjir claude code ini kebanyakan types wak)

AGENTS.md dan docs + db schema
---
buatkan saya fitur command /set dengan fungsi sebagai berikut

sesuaikan fungsi tagall supaya bisa disetting lewat database, yg bisa make tagall tuh admin, atau semua orang, cara ngesetnya tuh /set tagall 
admin /set tagall admin

sesuaikan fungsi welcome supaya bisa diaktifin /dinonaktifin, /set welcome on untuk nyala dan /set welcome off untuk matiin

bisa set on off jadwal sholat

semua set ini itu buat ngubah setting di database dari command message yg didapat 
---
buatkan saya fitur untuk mencari judul anime dengan referensi seperti berikut ...
---
setiap masuk ke grup lakukan fetch informasi dan simpan informasi nya ke database, contoh event datanya seperti ini ...
---
kick dan add member dgn parameter number tergantung yang nyuruh siapa, kalau admin boleh
---
doa harian yang mengirim informasi doa secara acak dari data/doaharian.jsosn
---
buatkan saya kuis kuis kuis nay adaa beberap ajenis, ada kuis t ebak tebakan ada kuis dimana orangvny diberi hadiah berupa permen dan dinosasuru sselanjuy na disini say ahany amkenulis fitur fitur saya yang digunakan oleh orang lain dan saya juga saay itu diberikan oleh roang lain kebahagiaan untuk menemukan apa yang b isa say ajad
---
buatkan saya fitur untuk mendeteksi jika itu link termasuk iklan apa nggak, jadi tiap ada deteksi link itu dilakukan pengecekan, jika terdeteksi iklan maka peringati user tersebut
---
/dev menampilkan developer info yang telah didefinisikan

nanti baru fokus buat ngerjain magna partner
---
fitur utk download media dari link yg dilampirin, bisa youtube, tiktok, fb, ig

/download link
---
buat function untuk ngambil data owner pada tiap grup untuk dikirimin pesan tertentu, pesannya bakal panjang jadi formatnya markdown di @send 
- fitur tag all hanya bisa dilakukan oleh admin, kecuali bisa 
- sesuaikan kembali fitur admin bisa kik, add, tutup grup
- ngambil data owner pada tiap grup buat dimasukin ke database
- buat function untuk ngambil data owner pada tiap grup untuk dikirimin pesan tertentu, pesannya bakal panjang jadi formatnya markdown