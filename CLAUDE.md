# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Tổng quan dự án

**DuHoc24 – Cổng Tiếp Nhận Hồ Sơ Du Học**: repo mẫu cho khoá lập trình 6 tuần. Bản hiện tại là **Tuần 1**: chỉ có UI tĩnh, mọi dữ liệu lấy từ mock viết cứng trong `lib/mock-data.ts`. Chưa có API route, server action, database hay auth. Lộ trình các tuần sau (Gemini chatbot → Supabase → đọc giấy tờ bằng Gemini → Make.com → Supabase Auth magic link + RLS) nằm trong `README.md`. Khi thêm tính năng, đối chiếu với đúng tuần trong lộ trình đó và đừng làm trước phần của tuần sau nếu không được yêu cầu.

Toàn bộ nội dung giao diện bằng tiếng Việt (`<html lang="vi">`, font Be Vietnam Pro).

## Lệnh thường dùng

```bash
npm install      # cài dependencies (node_modules chưa có sẵn)
npm run dev      # dev server tại http://localhost:3000
npm run build    # build production, cũng là bước kiểm tra type
npm run lint     # ESLint 9 flat config (next core-web-vitals + typescript)
```

Chưa có test runner nào được cấu hình. Không cần biến môi trường để chạy bản này; `.env.example` liệt kê biến Supabase và `NEXT_PUBLIC_SITE_URL` dùng từ Tuần 3 trở đi.

## Phiên bản & lưu ý framework

- **Next.js 16.3** (App Router), **React 19.2**, TypeScript strict, **Tailwind CSS v4** (cấu hình qua CSS trong `app/globals.css`, không có `tailwind.config`).
- Như `AGENTS.md` nhấn mạnh: API Next.js bản này có thể khác kiến thức cũ, phải đọc docs trong `node_modules/next/dist/docs/` (sau khi `npm install`) trước khi viết code liên quan đến routing, data fetching, caching, metadata…
- Dùng type toàn cục do Next sinh ra như `LayoutProps<"/">` (xem `app/layout.tsx`).
- Ảnh từ xa chỉ được phép từ `images.unsplash.com` (`next.config.ts`); thêm host mới phải khai báo ở đó.
- Alias import: `@/*` trỏ về gốc repo.

## Kiến trúc

Ba khu vực, mỗi khu một kiểu layout:

- **Landing `/`** (`app/page.tsx`): ghép các section từ `components/landing/` (hero, form báo giá, highlights, chat widget nổi) cùng `SiteHeader`/`SiteFooter` dùng chung.
- **Cổng học viên `/portal`**: trang server component đọc `currentStudent` từ mock, truyền props xuống `components/portal/` (giấy tờ, thông tin trích xuất, đối chiếu điểm chuẩn với `schools`).
- **Admin `/admin/*`**: `app/admin/layout.tsx` bọc sidebar (desktop) + mobile nav. `/admin` chỉ `redirect("/admin/requests")`. Danh sách menu nằm ở `adminNavItems` trong `components/admin/sidebar.tsx`, thêm trang admin mới thì cập nhật mảng này. Mỗi trang dùng `AdminPageHeader` + bảng `components/ui/table`.

Page mặc định là **server component**; chỉ các component cần state/hook mới có `"use client"` (form báo giá, chat widget, site header, admin sidebar và vài primitive UI).

### Dữ liệu và trạng thái

- `lib/mock-data.ts` vừa chứa **type/interface miền** (`School`, `AdmissionRequest`, `StudentProfile`, `Conversation`…) vừa chứa dữ liệu mẫu. Khi nối Supabase, giữ nguyên hình dạng type để các component không phải sửa, chỉ thay nguồn dữ liệu.
- Giá trị enum trạng thái là chuỗi tiếng Việt không dấu dạng snake_case (`cho_duyet`, `da_duyet`, `tu_choi`, `chua_nop`, `dang_xu_ly`, `hop_le`, `can_nop_lai`, `co_ban`, `toan_dien`). Nhãn hiển thị và màu nằm tập trung ở `docStatusMeta` / `requestStatusMeta` trong `components/status-badge.tsx`; thêm trạng thái mới thì cập nhật cả type lẫn bảng meta này.

### UI

- shadcn/ui style **`base-nova`**, primitive dựa trên **Base UI** (`@base-ui/react`), không phải Radix. Biến thể dùng `class-variance-authority`, gộp class bằng `cn()` trong `lib/utils.ts`. Icon: `lucide-react`; animation: `motion` + `tw-animate-css`.
- Thêm component shadcn: `npx shadcn add <tên>` (cấu hình ở `components.json`, có thêm registry `@tailark-oss`). Giao diện nền lấy từ khối Tailark `dusk-landing-2`, đã chuyển sang light theme.
- Màu theme khai báo bằng CSS variables trong `app/globals.css` (`@theme inline`); dùng token (`bg-primary`, `text-muted-foreground`…) thay vì mã màu cứng, trừ các tone trạng thái trong `status-badge.tsx`.
