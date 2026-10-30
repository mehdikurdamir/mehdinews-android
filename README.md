# MehdiNews برای اندروید

**MehdiNews** برنامه‌ی اندروید برای خواندن اخبار فناوری فارسی است. اخبار را از چند سایت خبری می‌گیرد، خودکار دسته‌بندی می‌کند و در رابطی فارسی و راست‌به‌چپ با فونت **وزیر** نشان می‌دهد. نسخه‌ی ویندوز در ریپوزیتوری جداگانه‌ی `mehdinews-windows` است.

> English: MehdiNews is a Persian-language (RTL) tech news reader for Android. It is a small native Java shell around a WebView: the UI is plain HTML/CSS/JS, feeds are fetched natively and parsed in the page. The Vazir font is bundled. No Gradle needed: see `build.sh`.

## امکانات

- منابع پیش‌فرض: زومیت، دیجیاتو، دیجی‌کالا مگ، گجت‌نیوز، آی‌تی‌ایران و ترفندستان (قابل ویرایش در برنامه)
- دسته‌بندی خودکار، چیدمان بر اساس روز، جستجو، فیلتر منبع و ذخیره‌ی خبر
- تم روشن و تیره، چیدمان مخصوص گوشی (نوار دسته‌ها در بالا)
- نمایش آخرین اخبار بدون اینترنت و به‌روزرسانی خودکار هنگام بازگشت به برنامه
- حداقل نسخه‌ی اندروید: ۷ (API 24)

## ساختار پروژه

| مسیر | توضیح |
|---|---|
| `src/ir/mehdinews/app/MainActivity.java` | اکتیویتی با WebView و پل جاوا برای دریافت فیدها (بدون محدودیت CORS) و باز کردن لینک‌ها در مرورگر |
| `assets/index.html`, `style.css`, `app.js` | رابط کاربری (همان رابط نسخه‌ی ویندوز با چیدمان موبایل) |
| `assets/shim.js` | پیاده‌سازی `window.api` در خود صفحه: پارس RSS با `DOMParser`، کش و تنظیمات در `localStorage` |
| `assets/classify.js` | دسته‌بندی بر اساس کلیدواژه |
| `assets/fonts/` | فونت وزیر (مجوز OFL) |
| `AndroidManifest.xml`, `res/` | مانیفست و آیکون برنامه |
| `build.sh` | ساخت APK با ابزارهای خط فرمان |

## ساخت APK

این پروژه Gradle ندارد و با ابزارهای خط فرمان ساخته می‌شود. روی Ubuntu / Debian:

```bash
sudo apt install openjdk-17-jdk-headless aapt apksigner zipalign \
  android-sdk-platform-23 dalvik-exchange
./build.sh
```

خروجی: `build/MehdiNews.apk`. اگر کلید امضا وجود نداشته باشد، اسکریپت یک `mehdinews-release.jks` تازه می‌سازد. این فایل را نگه دارید و هرگز در گیت قرار ندهید؛ برای به‌روزرسانی برنامه باید با همان کلید امضا کنید.

اگر Android Studio دارید، می‌توانید همین فایل‌ها را در یک پروژه‌ی Gradle خالی کپی کنید (جاوا در `src`، بقیه در `res` و `assets`).

## نصب

فایل APK را روی گوشی باز کنید و اجازه‌ی نصب از منبع ناشناس را بدهید.

## محدودیت‌ها

- دسته‌بندی بر پایه‌ی کلیدواژه است و گاهی خبری را در دسته‌ی نامناسب می‌گذارد.
- آدرس فیدها ممکن است تغییر کند؛ منبع ناسالم رد می‌شود و بقیه کار می‌کنند.
- برنامه اعلان (نوتیفیکیشن) ندارد و در پس‌زمینه خبر نمی‌گیرد.

## مجوز

کد با مجوز MIT منتشر شده است. فونت وزیر زیر مجوز SIL Open Font License است (`assets/fonts/OFL.txt`).
