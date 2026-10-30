#!/usr/bin/env bash
# Build MehdiNews.apk without Gradle (Ubuntu/Debian toolchain).
set -euo pipefail
cd "$(dirname "$0")"

AJ=/usr/lib/android-sdk/platforms/android-23/android.jar
DX=/usr/lib/android-sdk/build-tools/debian/dx
KS=${KS:-mehdinews-release.jks}
KS_PASS=${KS_PASS:-changeit-please}

rm -rf build && mkdir -p build/classes build/dex

javac --release 8 -nowarn -classpath "$AJ" -d build/classes src/ir/mehdinews/app/MainActivity.java
"$DX" --dex --min-sdk-version=24 --output=build/dex/classes.dex build/classes
aapt package -f -M AndroidManifest.xml -S res -A assets -I "$AJ" -F build/app-unsigned.apk
(cd build/dex && aapt add ../app-unsigned.apk classes.dex >/dev/null)
zipalign -f 4 build/app-unsigned.apk build/app-aligned.apk

if [ ! -f "$KS" ]; then
  keytool -genkeypair -keystore "$KS" -storepass "$KS_PASS" -keypass "$KS_PASS" \
    -alias mehdinews -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=MehdiNews"
fi
apksigner sign --ks "$KS" --ks-pass "pass:$KS_PASS" --key-pass "pass:$KS_PASS" \
  --out build/MehdiNews.apk build/app-aligned.apk
echo "Done: build/MehdiNews.apk"
