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

1. AGENTS.md dan docs terlebih dahulu
1. DB terlebih dahulu
1. masih soal lib, fungsi fungsi pentinngnya apa dulu

dari lib ini fitur chatting udah bekerja dengan baik, selanjutnya adalah membuat fungsi fungsi yang nantinya bakal 

perbaiki fitur bitcoin
tebak tebakan matematika pake kirim list interaktif
kick dan add member dgn parameter number tergantung yang nyuruh siapa, kalau admin boleh
doa harian yang mengirim informasi doa secara acak dari data/doaharian.jsosn
/dev menampilkan developer info yang telah didefinisikan
- /opengroup membuka grup supaya semua orang bisa mengirim pesan
- /menutup grup supaya hanya admin yang bisa mengirim pesan
- /taglall mention all group, tapi kkni semua orang dan admin dan membner untuk menggunnakan fitur tersebut 
- /pantun random pantun indonesia
- /mendeteksi jika itu link termasuk iklan apa nggak
- /kuis kuis nay adaa beberap ajenis, ada kuis t ebak tebakan ada kuis dimana orangvny diberi hadiah berupa permen dan dinosasuru sselanjuy na disini say ahany amkenulis fitur fitur saya yang digunakan oleh orang lain dan saya juga saay itu diberikan oleh roang lain kebahagiaan untuk menemukan apa yang b isa say ajad

nanti baru fokus buat ngerjain magna partner


- ini aja dari fondasi prompt guide awal harus clear duluan bro
- buatkan saya fitur untuk download tiktok/yt/fb
- buatkan saya fitur untuk mendeteksi bahwa postingannya itu memuat link
- fitur tag all hanya bisa dilakukan oleh admin, kecuali bisa 
- sesuaikan kembali fitur admin bisa kik, add, tutup grup
- ngambil data owner pada tiap grup buat dimasukin ke database
- buat function untuk ngambil data owner pada tiap grup untuk dikirimin pesan tertentu, pesannya bakal panjang jadi formatnya markdown