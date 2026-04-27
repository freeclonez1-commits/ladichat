# HƯỚNG DẪN QUY TRÌNH KỸ THUẬT (DEVELOPER WORKFLOW)

Tài liệu này hướng dẫn cách cập nhật và duy trì hệ thống LadiChat.

## 1. Quy trình Cập nhật Code Widget (Frontend)
Khi bạn sửa file `widget.js` hoặc `widget.html`:
1. **Kiểm tra local:** Mở file HTML để xem giao diện.
2. **Đẩy lên GitHub:** Widget trên Landing Page load từ GitHub Pages.
   ```powershell
   git add widget.js widget.html
   git commit -m "Mô tả thay đổi của bạn"
   git push
   ```
3. **Xóa Cache:** Chờ 1-2 phút, sau đó trên trình duyệt nhấn `Ctrl + Shift + R` để thấy thay đổi.

## 2. Quy trình Cập nhật Cloudflare Worker (Backend/AI)
Khi bạn sửa file `cloudflare-worker.js`:
1. **Kiểm tra cấu hình:** Đảm bảo các domain trong `ALLOWED_ORIGINS` là chính xác.
2. **Deploy:**
   ```powershell
   npx wrangler deploy
   ```
3. **Quản lý Secrets (API Keys):** Nếu đổi Token hoặc API Key, chạy:
   ```powershell
   echo "GIÁ_TRỊ_MỚI" | npx wrangler secret put BEE_API_KEY
   echo "GIÁ_TRỊ_MỚI" | npx wrangler secret put TG_TOKEN
   ```

## 3. Quy trình Tích hợp AI (Beeknoee)
- **Endpoint:** `https://platform-api.beeknoee.com/v1`
- **Model hiện tại:** `openai/gpt-oss-120b`
- **Cơ chế Handoff & Control:**
  - AI trả về JSON có `handoff: true` -> Worker báo Widget tắt `aiMode`.
  - **Admin Toggle:** Trong Admin Panel, dùng nút gạt "🤖 AI Bot" ở header để bật/tắt AI cho từng hội thoại cụ thể.
  - Admin nhắn tin từ Admin Panel -> Tự động tắt `aiMode` để chuyển sang thủ công.

## 4. Cấu trúc Firebase (Realtime DB)
- `nike-chat/conversations/{sessionId}/aiMode`: (Boolean) Bật/tắt bot.
- `nike-chat/conversations/{sessionId}/messages`: Danh sách tin nhắn.
- `nike-chat/quickReplies`: Danh sách câu hỏi nhanh.

## 6. Lưu ý Quan trọng khi Code (Critical)
- **Multiline Strings:** Trong `widget.js`, KHÔNG được xuống dòng trực tiếp trong chuỗi nháy đơn `'...'`. Điều này gây Syntax Error làm crash widget. Luôn dùng `\n` hoặc Template Literals (`` ` ``).
- **JSON Parsing:** Cloudflare Worker bóc tách JSON bằng Regex `\{[\s\S]*?\}`. Đảm bảo System Prompt yêu cầu AI trả về đúng định dạng này.
- **Firebase Paths:** Luôn kiểm tra đúng path `nike-chat/conversations` để tránh ghi đè dữ liệu cấu hình.

---
*Auto-updated by Antigravity AI Assistant | 24/04/2026*
