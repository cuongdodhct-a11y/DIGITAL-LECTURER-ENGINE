# OCI Always Free deployment

## Mục tiêu

Triển khai Digital Lecturer Engine độc lập với Vercel trên Oracle Cloud Infrastructure (OCI) Always Free, ưu tiên Ampere A1 ARM64.

## Tài nguyên mục tiêu

- Ampere A1: tối đa 4 OCPU và 24 GB RAM trong hạn mức Always Free.
- Block Volume: tổng 200 GB cho boot + block volumes trong home region.
- Outbound data: 10 TB/tháng Always Free.

## Nguyên tắc an toàn

1. Không sửa hoặc xóa project Vercel digital-lecturer-2026.
2. Không dùng project Vercel cũ cho Engine.
3. OCI là môi trường triển khai độc lập.
4. Chỉ mở cổng 3000 trong giai đoạn smoke test; khi đưa ra Internet chính thức, dùng HTTPS reverse proxy (Caddy/Nginx) và chỉ mở 80/443.
5. Không commit secrets. Tạo .env trực tiếp trên VM.
6. Gắn /app/data vào OCI Block Volume để giữ dữ liệu runtime.
7. Backup volume trước các thay đổi hạ tầng lớn.

## Kiến trúc

GitHub (deploy-oci-free)
→ OCI Ampere A1 VM (ARM64)
→ Podman/Docker container
→ Express + Vite SPA
→ /api/*
→ dữ liệu /app/data

## Cấu hình VM đề xuất

- Shape: VM.Standard.A1.Flex
- CPU: bắt đầu 2 OCPU
- RAM: bắt đầu 12 GB
- Boot volume: 50 GB
- Có thể tăng lên 4 OCPU / 24 GB RAM nếu cần, trong tổng hạn mức Always Free.

Bắt đầu nhỏ giúp giảm rủi ro và vẫn đủ dư địa cho Node/Vite và các workload CPU. Không cần dùng toàn bộ hạn mức ngay từ đầu.

## Tạo VM

Trong OCI Console:

1. Compute → Instances → Create instance.
2. Chọn Oracle Linux 8/9 ARM64 hoặc Oracle Linux Cloud Developer ARM.
3. Chọn VM.Standard.A1.Flex.
4. Chọn 2 OCPU + 12 GB RAM cho smoke test đầu tiên.
5. Gán public IPv4.
6. Tạo/chọn SSH key.
7. Security List/NSG: tạm mở TCP 22 và 3000 từ IP quản trị để smoke test. Sau khi có HTTPS reverse proxy, đóng 3000 khỏi Internet.

## Cài runtime trên Oracle Linux

Oracle Linux hỗ trợ Podman; có thể dùng Podman thay Docker mà không thay đổi container image.

~~~bash
sudo dnf module install container-tools:ol8
sudo dnf install -y git
~~~

Clone code:

~~~bash
git clone -b deploy-oci-free https://github.com/cuongdodhct-a11y/DIGITAL-LECTURER-ENGINE.git
cd DIGITAL-LECTURER-ENGINE
cp .env.example .env
~~~

Điền secret thật vào .env nếu môi trường cần Gemini. Không commit .env.

Build/run:

~~~bash
podman build --platform linux/arm64 -t digital-lecturer-engine:oci .
podman run -d \
  --name digital-lecturer-engine \
  --restart=unless-stopped \
  -p 3000:3000 \
  --env-file .env \
  -v "$(pwd)/data:/app/data:Z" \
  digital-lecturer-engine:oci
~~~

Smoke test:

~~~bash
curl -fsS http://127.0.0.1:3000/healthz
curl -fsS http://127.0.0.1:3000/api/status
~~~

## HTTPS

Sau khi smoke test thành công, trỏ một subdomain riêng vào public IP OCI và đặt Caddy/Nginx phía trước container. Không expose port 3000 công khai lâu dài.

## Rollback

Giữ image tag cũ trên VM trước khi cập nhật. Rollback bằng cách dừng container mới và chạy image tag trước đó. Không xóa image cũ cho đến khi bản mới được xác minh.

## Lưu ý về VieNeu

VieNeu v3 Turbo CPU/ONNX có thể chạy trên CPU; tài liệu VieNeu khuyến nghị v3 Nano cho ARM yếu. OCI A1 có 4 OCPU/24 GB RAM Always Free, nên cần benchmark thực tế trước khi khóa cấu hình TTS production. Không đưa mô hình TTS lớn vào Git history; tải model vào persistent volume/cache trên VM.
