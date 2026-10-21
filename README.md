# Đề 29 – Website công thức nấu ăn Bếp Nhà Huy

Sinh viên: Huy
MSSV: DTC245200206

## Công nghệ
Node.js 22, Express, EJS, MySQL 8.4 và Docker Compose.
Nginx làm reverse proxy và cung cấp HTTPS.
phpMyAdmin dùng để quản lý cơ sở dữ liệu.

## Chức năng
- Xem danh sách và chi tiết công thức.
- Tìm kiếm theo tên món hoặc nguyên liệu.
- Lọc công thức theo danh mục.
- Đăng nhập, đăng xuất quản trị.
- Thêm, sửa, xóa công thức và danh mục.
- Kiểm tra dữ liệu nhập và bảo vệ biểu mẫu bằng CSRF token.

## Cơ sở dữ liệu
Ba bảng: users, categories và recipes.
Dữ liệu mẫu: 12 công thức thuộc 4 danh mục.
Dữ liệu MySQL được lưu trong volume db_data.

## Cấu hình
Các biến môi trường được mô tả trong .env.example.
Mật khẩu thực tế lưu trong .env và không đưa lên Git.
SESSION_SECRET phải là chuỗi ngẫu nhiên dài ít nhất 32 ký tự.

Chứng chỉ HTTPS: nginx/certs/server.crt
Khóa riêng: nginx/certs/server.key
Chứng chỉ tự ký dùng trong thực hành sẽ gây cảnh báo trên
trình duyệt khi chưa được tin cậy.

Hướng dẫn khởi tạo đầy đủ sẽ được bổ sung khi hoàn thiện bài.

## Các lệnh vận hành trên máy đã cấu hình
Khởi động và build: docker compose up -d --build
Khởi động lại proxy sau khi tạo lại app: docker compose restart nginx
Kiểm tra container: docker compose ps
Kiểm tra ứng dụng: curl -k https://localhost/health
Xem log ứng dụng: docker compose logs --tail=50 app
Tạm dừng: docker compose stop
Tiếp tục: docker compose start

Tùy chọn curl -k bỏ kiểm tra độ tin cậy chứng chỉ khi kiểm thử.

## Truy cập
Website: https://IP_UBUNTU/
Quản trị: https://IP_UBUNTU/admin/login
phpMyAdmin trên Ubuntu: http://127.0.0.1:8081

Từ Windows, mở SSH tunnel:
ssh -N -L 8081:127.0.0.1:8081 ubuntu@IP_UBUNTU

Giữ tunnel mở và truy cập http://127.0.0.1:8081 trên Windows.

## Bảo vệ hệ thống
- App chạy bằng user node, hệ thống tệp chỉ đọc.
- App bỏ Linux capabilities và bật no-new-privileges.
- MySQL dùng mạng backend nội bộ, không công bố cổng ra máy chủ.
- phpMyAdmin chỉ công bố trên địa chỉ loopback.
- Mật khẩu đăng nhập được băm bằng bcrypt.
- Truy vấn cơ sở dữ liệu sử dụng tham số.
- Biểu mẫu quản trị được kiểm tra CSRF token.
- Cookie phiên bật HttpOnly, SameSite và Secure khi chạy HTTPS.
- Nginx sử dụng TLS 1.2/1.3 và HTTP security headers.
- Nginx chặn truy cập công khai vào /metrics.

Phiên đăng nhập lưu trong bộ nhớ cho mô hình một instance.
Khởi động lại app sẽ yêu cầu đăng nhập lại.
