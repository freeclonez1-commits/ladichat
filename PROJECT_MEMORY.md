# PROJECT MEMORY - LadiChat (Nike-branded Live Chat)

## 1. Tổng quan dự án (Overview)
- **Tên dự án:** LadiChat (Nike Mind Chat)
- **Mục tiêu:** Xây dựng một hệ thống Live Chat hai chiều, siêu nhẹ và được thiết kế tùy chỉnh theo nhận diện thương hiệu Nike.
- **Nền tảng tích hợp:** Hệ thống được thiết kế đặc biệt để nhúng trực tiếp vào các trang **Landing Page (LadiPage)** dưới dạng mã HTML/JS tùy chỉnh, giúp thu thập thông tin khách hàng và tư vấn trực tiếp mà không cần dùng đến các nền tảng bên thứ ba (như Tawk.to, vChat, FB Messenger).

## 2. Cấu trúc và Thành phần chính
### A. Khách hàng (`widget.html`)
- **Giao diện nổi (Floating Widget):** Nút tròn (logo Nike) ở góc dưới màn hình.
- **Màn hình Onboarding:** Yêu cầu khách hàng nhập **Tên** và **Số điện thoại** trước khi bắt đầu chat để thu thập Lead.
- **Chat Interface:** Giao diện tin nhắn thời gian thực, bong bóng chat bo tròn hình viên thuốc (border-radius: 50px).
- **Tính năng:**
  - Nhận biết tin nhắn "Đã gửi" / "Đã xem".
  - Có âm thanh thông báo và chấm đỏ khi có tin nhắn mới từ Admin mà khách chưa mở cửa sổ chat.

### B. Quản trị viên (`admin-panel.html`)
- **Đăng nhập:** Màn hình bảo mật bằng mật khẩu tĩnh (`ADMIN_PASSWORD`).
- **Sidebar (Trái):** Danh sách khách hàng đang chat, có tìm kiếm, hiển thị trạng thái tin nhắn mới, thời gian, tên và tin nhắn cuối.
- **Khu vực chat (Phải):** Xem lịch sử chat, reply khách hàng lập tức.
- **Tính năng:**
  - Quản lý đồng thời nhiều hội thoại.
  - Trạng thái "Khách đã xem" hoặc "Đã gửi" cập nhật realtime.

## 3. Công nghệ và Dịch vụ tích hợp
- **Frontend:** HTML5, CSS3 thuần (sử dụng Flexbox, không dùng Framework để tối ưu dung lượng), Vanilla Javascript.
- **Database/Backend:** **Firebase Realtime Database** (Firebase v10.12.0) xử lý đồng bộ dữ liệu hai chiều siêu tốc, quản lý cấu trúc dữ liệu theo `sessionId` của từng khách hàng.
- **Thông báo (Notifications):** Tích hợp **Telegram Bot API**. Khi có khách điền form hoặc nhắn tin, bot sẽ tự động ping tin nhắn về nhóm/chat Telegram của Admin, giúp Admin không cần phải túc trực 24/24 trên tab quản trị.

## 4. Nhật ký phát triển (Changelog)

### Ngày 22/04/2026
- **Fix lỗi UI (Flexbox Overflow):** Khắc phục lỗi khung chat bị tràn xuống dưới màn hình khiến khung nhập liệu bị che khuất ở `admin-panel.html` và `widget.html` (sử dụng `min-height: 0` cho các thẻ flex).
- **Tính năng Read Receipt (Đã xem/Đã gửi):** Thêm logic tracking việc đọc tin nhắn. Khách/Admin sẽ nhìn thấy trạng thái "✓ Đã gửi" và "✓ Đã xem" ở dưới cùng khung chat dựa vào việc người kia đã mở khung chat hay chưa.
- **Sửa bug Listener Leak:** Sửa lỗi rò rỉ bộ lắng nghe `child_added` trong Admin Panel (Lỗi khiến tin nhắn của khách bị đánh dấu "Đã xem" ngay lập tức dù Admin đang mở cửa sổ chat của người khác). Đảm bảo ngắt (off) listener cũ trước khi chuyển hội thoại.
- **Cải tiến UI:** 
  - Sửa `border-radius` của bong bóng chat thành `50px` tạo hiệu ứng hình viên thuốc (pill shape).
  - Thu nhỏ kích thước ảnh trong nút bật/tắt widget (`#nk-toggle-btn img`) xuống `28px`.

- **Sửa bug Listener Leak:** Sửa lỗi rò rỉ bộ lắng nghe `child_added` trong Admin Panel (Lỗi khiến tin nhắn của khách bị đánh dấu "Đã xem" ngay lập tức dù Admin đang mở cửa sổ chat của người khác). Đảm bảo ngắt (off) listener cũ trước khi chuyển hội thoại.
- **Cải tiến UI:** 
  - Sửa `border-radius` của bong bóng chat thành `50px` tạo hiệu ứng hình viên thuốc (pill shape).
  - Thu nhỏ kích thước ảnh trong nút bật/tắt widget (`#nk-toggle-btn img`) xuống `28px`.

### Ngày 22/04/2026 (Batch 2)
- **Greeting Tooltip (widget.html):** Khi lần đầu vào trang, sau 1.2s sẽ hiện bong bóng tooltip `"Trò chuyện cùng Support Nike 👋"` phía trên nút chat. Tự ẩn sau 5s, và dùng `sessionStorage` để không hiện lại khi cuộn trang. Tooltip ẩn ngay khi người dùng bấm mở chat.
- **Quick Replies (widget.html):** Khi khách hàng vào chat, phía trên ô nhập tin nhắn sẽ hiển thị các nút câu hỏi đề xuất. Bấm vào nút là gửi câu hỏi đó ngay. Danh sách được đọc từ Firebase path `nike-chat/quickReplies`, cập nhật realtime.
- **Quick Replies Management (admin-panel.html):** Thêm tab "⚡ Quick Replies" trong sidebar. Admin có thể thêm câu hỏi mới (nhập text + Enter/bấm +) và xóa từng câu hỏi. Tất cả cập nhật ngay lập tức trên widget của khách hàng qua Firebase.
- **Admin Sound Notification (admin-panel.html):** Khi có khách nhắn tin mới (unread = true), Admin sẽ nghe tiếng "Ting" cảnh báo. Âm thanh được tạo bằng `Web AudioContext` (không cần file mp3 ngoài) nên không bị trình duyệt chặn tải tài nguyên. Chỉ phát khi `lastMessageAt` thay đổi để tránh phát liên tục.
- **Tối ưu cho LadiPage (widget.html):**
  - Toàn bộ CSS đặt trong scope `#nk-chat-wrap *` để không ảnh hưởng style của LadiPage.
  - Thêm `margin: 0; padding: 0;` trong selector scope để ngăn LadiPage ghi đè.
  - Firebase `initializeApp` được bảo vệ bằng `if (!firebase.apps.length)` để tránh lỗi nếu Firebase đã được khởi tạo ở nơi khác trên trang.

### Ngày 22/04/2026 (Security Audit & Fixes)
- **Xóa lộ lọt Token Telegram:** Chuyển API request gọi sang Telegram Bot từ `widget.js` & `widget.html` sang một proxy an toàn viết bằng Cloudflare Worker (`cloudflare-worker.js`). Điều này giúp token bot ẩn hoàn toàn trên server thay vì lưu ở client-side.
- **Bảo mật Đăng nhập Admin Panel:** Chuyển đổi cơ chế đăng nhập từ một mật khẩu cứng (hardcoded password `nike2024`) trên frontend sang sử dụng **Firebase Authentication (Email/Password)**. Giao diện `admin-panel.html` đã được thêm trường nhập Email để tương thích và toàn bộ quản lý xác thực được xử lý qua Firebase Auth API, đảm bảo an toàn tối đa.

### C. AI Auto-Reply (Beeknoee AI Proxy)
- **Cơ chế:** Khi `aiMode` trong Firebase của hội thoại là `true`, tin nhắn khách hàng sẽ được gửi qua Cloudflare Worker tới Beeknoee API.
- **Model:** Sử dụng `openai/gpt-oss-120b` (hoặc các model khác qua Beeknoee proxy).
- **Tính năng thông minh:**
  - **Natural Thai Conversationalist:** Bot được tối ưu để trả lời bằng tiếng Thái tự nhiên (hoặc Việt/Anh theo khách), có chủ ngữ vị ngữ, xuống dòng rõ ràng thay vì câu trả lời ngắn ngủn.
  - **Product Awareness:** Bot nắm rõ thông tin sản phẩm Nike Mind 001 (giá 1,500 ฿, 6 màu), Nike Mind 002 (hết hàng), chính sách giao hàng và đổi trả.
  - **Typing Indicator:** Hiệu ứng dấu "..." nhấp nháy khi AI đang soạn thảo.
  - **AI Badge:** Tin nhắn từ bot có nhãn `🤖 Nike Bot` để phân biệt.
  - **Handoff Logic:** AI tự nhận diện khi khách muốn gặp người thật và trả về `handoff: true` để chuyển sang nhân viên.
  - **Handoff Divider:** Dòng kẻ ngăn cách thông báo khi khách thoát chế độ AI.

## 5. Quy trình Vận hành & Deploy
1. **Cloudflare Worker:**
   - Cần set các secret: `TG_TOKEN`, `TG_CHAT_ID`, `BEE_API_KEY`.
   - Command: `npx wrangler secret put <KEY>`
   - Deploy: `npx wrangler deploy`
2. **Frontend (Widget):**
   - File `widget.js` được host trên GitHub Pages (hoặc CDN).
   - Khi chỉnh sửa code widget, cần push lên GitHub để cập nhật cho Landing Page.
   - Command: `git add . && git commit -m "..." && git push`
3. **Firebase:**
   - Quản lý hội thoại tại `nike-chat/conversations`.
   - Quản lý Quick Replies tại `nike-chat/quickReplies`.

## 6. Nhật ký phát triển (Changelog) - Tiếp theo

### Ngày 24/04/2026 (AI & Admin Upgrade)
- **Natural Thai-first AI:** Nâng cấp System Prompt toàn diện. Bot trả lời bằng tiếng Thái tự nhiên, thân thiện ("warm & conversational"), biết xuống dòng và dùng emoji hợp lý.
- **Product Knowledge Injection:** AI đã "học" toàn bộ thông tin sản phẩm từ `http://www.nike-mind.online/test`, bao gồm giá ưu đãi 1,500 ฿, giá gốc 3,200 ฿, và tình trạng kho hàng của Nike Mind 001/002.
- **AI Toggle Switch (Admin Panel):** Thêm nút gạt Bật/Tắt AI ngay trong khung chat của Admin Panel. 
  - Admin có quyền can thiệp và tắt AI bất cứ lúc nào để chuyển sang chat 1-1.
  - Trạng thái AI được đồng bộ realtime qua Firebase (`aiMode`).
- **Robust JSON Parsing:** Cải tiến logic xử lý phản hồi từ AI trong Cloudflare Worker:
  - Tự động bóc tách JSON khỏi markdown code blocks (```json).
  - Loại bỏ các ký tự rác giúp ngăn lỗi hiển thị `{"reply":...}` thô trên màn hình khách hàng.
  - Tăng `max_tokens` lên 450 để AI trả lời đầy đủ, không bị cắt cụt.
- **Welcome Message Update:** Cập nhật tin nhắn chào mừng (Welcome Message) tự động bằng tiếng Thái, giới thiệu Nike Bot và hướng dẫn khách cách gọi nhân viên bằng từ khóa ("ขอคุยกับพนักงาน").
- **Fix Bug (Syntax Error):** Sửa lỗi widget crash do sử dụng xuống dòng thật trong chuỗi JS (Fix bằng cách dùng `\n` escape sequences).

---
*Ghi chú: File này được cập nhật vào lúc 17:05 ngày 24/04/2026 bởi Antigravity AI.*
