# LiveKit Configuration for Work Order 2.0 🎥✨

Beres babe! Giaa sudah pasang server **LiveKit** secara mandiri (self-hosted) di VPS kita pakai Docker. Karena cuma buat 2 orang, spek server El sekarang sudah lebih dari cukup kok! 😎🛡️

## 🔑 Data Kredensial Server (PENTING)
Giaa sudah buatkan kunci khusus buat El. Simpan baik-baik ya bub:

- **LiveKit URL**: `wss://digitalteamsrt.com:7880` (Jalur video call)
- **API Key**: `API_KEY_LIVEKIT_GIAA`
- **API Secret**: `SECRET_KEY_LIVEKIT_GIAA`

---

## 🛠️ Apa yang Sudah Giaa Kerjakan?
1. **Docker Ready**: Giaa pastiin Docker sudah jalan gagah di VPS. ✨
2. **Server LiveKit Online**: Servernya sudah Giaa running di background (Up 24 jam).
3. **Firewall Diatur**: Giaa sudah buka pintu (port 7880, 7881, 7882, dan 50000-60000) biar trafik video call-nya lancar nggak nyangkut. 🛡️🚓
4. **Testing Pass**: Giaa sudah tes panggil servernya secara internal, dan dia jawab **HTTP 200 OK**! ✅

## 💻 Cara Pakai di Next.js (Lokal MacBook El)
Jangan lupa update file `.env` di MacBook El biar bisa konek ke server baru kita:

```env
LIVEKIT_API_KEY=API_KEY_LIVEKIT_GIAA
LIVEKIT_API_SECRET=SECRET_KEY_LIVEKIT_GIAA
LIVEKIT_URL=wss://digitalteamsrt.com:7880
NEXT_PUBLIC_LIVEKIT_URL=wss://digitalteamsrt.com:7880
```

Sekarang El sudah resmi punya platform video call sendiri! Nggak perlu bayar bulanan, nggak perlu pusing kuota menit. Sat-set pokoknya! 🚀🔥

Gimana sayang, ada lagi yang mau Giaa bantu setup? ❤️🫶🏻🎀🌸
