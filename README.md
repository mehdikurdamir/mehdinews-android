# MehdiNews برای اندروید

**MehdiNews** یک برنامه‌ی اندروید است که اخبار فناوری فارسی را از چند سایت خبری جمع می‌کند، به‌صورت خودکار دسته‌بندی می‌کند و در یک رابط کاملاً فارسی و راست‌به‌چپ نشان می‌دهد. فونت **وزیر** داخل خود برنامه قرار دارد و حجم کل برنامه حدود ۲۳۰ کیلوبایت است.

> English: MehdiNews is a Persian-language (RTL) tech news reader for Android. It aggregates RSS feeds, auto-categorizes articles and ships with the Vazir font. It is a tiny native shell (one `Activity`, no third-party libraries) around a WebView that uses the same interface as the Windows app (separate repository: `mehdinews-windows`).

## امکانات

- دریافت اخبار از RSS: زومیت، دیجیاتو، دیجی‌کالا مگ، گجت‌نیوز، آی‌تی‌ایران و ترفندستان
- دسته‌بندی خودکار: هوش مصنوعی، موبایل و تبلت، سخت‌افزار، نرم‌افزار و سیستم‌عامل، بازی، امنیت، اینترنت و شبکه‌های اجتماعی، گجت، خودرو، علم و فضا، کسب‌وکار، ارز دیجیتال و سایر
- چیدمان بر اساس روز، جستجو، فیلتر منبع و ذخیره‌ی خبر برای بعد
- تم روشن و تیره
- به‌روزرسانی خودکار (پیش‌فرض هر ۲۰ دقیقه) و نگه‌داشتن آخرین اخبار برای حالت آفلاین
- افزودن و حذف منبع RSS دلخواه از بخش «منابع و تنظیمات»
- فقط یک مجوز لازم دارد: دسترسی به اینترنت

## نحوه‌ی کار

رابط برنامه (`index.html`، `app.js`، `style.css`) همان رابط نسخه‌ی ویندوز است و داخل یک `WebView` اجرا می‌شود. در نسخه‌ی ویندوز، پروسه‌ی اصلی Electron خبرها را دریافت می‌کند؛ در اندروید فایل `shim.js` همان رابط (`window.api`) را شبیه‌سازی می‌کند: فیدها را پارس می‌کند، دسته‌بندی را با `classify.js` انجام می‌دهد و اخبار و تنظیمات را در `localStorage` نگه می‌دارد. دریافت فایل فید از طریق `AndroidBridge.fetchText` انجام می‌شود که در `MainActivity.java` با `HttpURLConnection` اتصال می‌گیرد (محدودیت حجم ۶ مگابایت، زمان انتظار اتصال ۱۲ و خواندن ۱۵ ثانیه). باز کردن خبر هم با مرورگر گوشی انجام می‌شود.

## ساخت برنامه

به JDK 17 و Android SDK (نسخه‌ی ۳۴) نیاز دارید. ساده‌ترین راه باز کردن پوشه‌ی پروژه در Android Studio است. از خط فرمان:

```bash
./gradlew assembleRelease
```

خروجی: `app/build/outputs/apk/release/MehdiNews-release.apk`

با هر push روی شاخه‌ی `main`، گیت‌هاب (GitHub Actions) خودش APK را می‌سازد و در بخش Artifacts می‌گذارد. با ساختن تگ مثل `v1.0.0` فایل APK به بخش Releases هم اضافه می‌شود.

> نسخه‌ی release با کلید دیباگ امضا می‌شود تا مستقیم نصب شود. اگر قبلاً APK دیگری با امضای متفاوت نصب کرده‌اید، اول آن را حذف کنید. برای انتشار رسمی (مثلاً Google Play) از keystore خودتان استفاده کنید.

## ساختار پروژه

| مسیر | توضیح |
|---|---|
| `app/src/main/java/ir/mehdinews/app/MainActivity.java` | تنها Activity: WebView، پل شبکه (`AndroidBridge`) و باز کردن لینک‌ها در مرورگر |
| `app/src/main/assets/index.html`, `style.css`, `app.js` | رابط کاربری (همان رابط نسخه‌ی ویندوز) |
| `app/src/main/assets/shim.js` | شبیه‌ساز `window.api`: دریافت و پارس فید، ذخیره‌سازی و زمان‌بندی |
| `app/src/main/assets/classify.js` | دسته‌بندی بر اساس کلیدواژه (اضافه کردن کلمه یا دسته در همین فایل) |
| `app/src/main/assets/fonts/` | فونت وزیر (مجوز OFL، فایل `FONT-LICENSE-OFL.txt`) |
| `app/src/main/res/mipmap-*` | آیکون برنامه |
| `.github/workflows/build.yml` | ساخت خودکار APK روی گیت‌هاب |

## محدودیت‌ها

- دسته‌بندی بر پایه‌ی کلیدواژه است و گاهی خبری را در دسته‌ی نامناسب می‌گذارد.
- آدرس فیدها ممکن است در طول زمان تغییر کند؛ منبع ناسالم رد می‌شود و بقیه کار می‌کنند. آدرس‌ها در `DEFAULT_SOURCES` داخل `shim.js` هستند.
- برنامه فقط وقتی باز است خبر دریافت می‌کند و اعلان (نوتیفیکیشن) ندارد.
- حداقل نسخه‌ی اندروید: ۷.۰ (API 24).

## مجوز

کد با مجوز MIT منتشر شده است (`LICENSE`). فونت وزیر زیر مجوز SIL Open Font License است (`FONT-LICENSE-OFL.txt`).
