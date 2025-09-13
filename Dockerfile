# 1. استفاده از ایمیج پایه
FROM docker.arvancloud.ir/node:18

# 2. تنظیم دایرکتوری کاری داخل کانتینر
WORKDIR /app

# 3. کپی فایل‌های لازم
COPY package*.json ./

# 4. نصب پکیج‌ها (فقط پروڈاکشن)
RUN npm ci --omit=dev

# 5. کپی کد برنامه
COPY . .

# 6. کامپایل (اگه TypeScript هست)
RUN npm run build

# 7. پورت مورد استفاده
EXPOSE 3000

# 8. دستور اجرا
CMD ["node", "dist/index.js"]
