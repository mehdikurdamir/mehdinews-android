plugins {
    id("com.android.application")
}

base {
    archivesName.set("MehdiNews")
}

android {
    namespace = "ir.mehdinews.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "ir.mehdinews.app"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            // امضا با کلید دیباگ تا APK مستقیم نصب شود. برای انتشار رسمی از keystore خودتان استفاده کنید.
            signingConfig = signingConfigs.getByName("debug")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }

    lint {
        abortOnError = false
        checkReleaseBuilds = false
    }
}
