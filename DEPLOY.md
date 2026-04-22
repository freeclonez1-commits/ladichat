# LadiChat Widget — Hướng dẫn Deploy

## 🎯 Cách nhúng vào LadiPage (chỉ 1 dòng)

```html
<script src="https://nike-mind.online/widget.js" async></script>
```

---

## 📦 Cách 1: Upload lên server `nike-mind.online` (nếu có FTP/cPanel)

1. Upload file `widget.js` vào thư mục gốc (`public_html/` hoặc `www/`)
2. Dán đoạn script trên vào LadiPage → **Thiết lập → Tùy chỉnh HTML/JS (Footer)**

---

## 🐙 Cách 2: GitHub Pages (FREE — không cần server)

### Bước 1: Tạo repository
- Vào https://github.com → **New repository**
- Đặt tên: `nikechat` (hoặc bất kỳ)
- Chọn **Public** → **Create**

### Bước 2: Upload file
- Vào repo vừa tạo → **Add file → Upload files**
- Upload file `widget.js`
- Commit

### Bước 3: Bật GitHub Pages
- Vào **Settings → Pages**
- Source: `Deploy from a branch` → `main` → `/ (root)`
- **Save**

### Bước 4: Lấy URL
URL widget sẽ là:
```
https://<tên-github-của-bạn>.github.io/nikechat/widget.js
```

### Bước 5: Nhúng vào LadiPage
```html
<script src="https://<tên-github>.github.io/nikechat/widget.js" async></script>
```

---

## ⚡ Cách 3: jsDelivr CDN (tự động từ GitHub, siêu nhanh)

Sau khi push lên GitHub, dùng URL jsDelivr để load nhanh hơn:
```
https://cdn.jsdelivr.net/gh/<username>/<repo>/widget.js
```

---

## 🔧 Khi cần cập nhật widget

Chỉ cần thay file `widget.js` trên server/GitHub → tất cả trang đang nhúng
sẽ **tự động cập nhật** mà không cần chỉnh sửa LadiPage.

---

## 📌 Lưu ý

- File `widget.html` (cũ): giữ lại để tham khảo, không cần nhúng nữa
- File `widget.js` (mới): đây là file chính thức để nhúng
- File `admin-panel.html`: dùng để quản lý, mở trực tiếp trên trình duyệt

---

## 🔒 Bảo mật: Thiết lập Đăng nhập Admin bằng Firebase

Hệ thống đã được nâng cấp để sử dụng **Firebase Authentication** thay vì mật khẩu cố định (hardcoded) nhằm đảm bảo an toàn tối đa.

1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Mở Project của bạn → chọn **Authentication** ở menu bên trái.
3. Click **Get Started** (nếu chưa bật).
4. Ở tab **Sign-in method**, chọn **Email/Password** và bật trạng thái **Enable**. Lưu lại.
5. Chuyển sang tab **Users**, click **Add user**.
6. Nhập Email (vd: `admin@nike-mind.online`) và một Mật khẩu an toàn.
7. Click **Add user**.
8. Bây giờ bạn có thể sử dụng Email và Mật khẩu vừa tạo để đăng nhập vào trang `admin-panel.html`.
