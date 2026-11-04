package ir.mehdinews.app;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * MehdiNews for Android: a WebView that shows the same interface as the Windows app
 * (assets/index.html + app.js). assets/shim.js re-implements the desktop API (window.api)
 * and uses AndroidBridge.fetchText() below to download RSS feeds with native networking.
 */
public class MainActivity extends Activity {
    private WebView web;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(0xFF14234A);
        getWindow().setNavigationBarColor(0xFF14234A);

        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#14234A"));
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        s.setTextZoom(100);

        web.addJavascriptInterface(new Bridge(), "AndroidBridge");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url.startsWith("file:")) return false;
                openExternal(url);
                return true;
            }
        });
        web.loadUrl("file:///android_asset/index.html");
    }

    private void openExternal(String url) {
        if (url != null && (url.startsWith("http://") || url.startsWith("https://"))) {
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
            } catch (Exception ignored) {
            }
        }
    }

    /** Sends the result of a fetch back to shim.js (window.__nf). */
    private void deliver(final int id, final boolean ok, final String text) {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (web == null) return;
                web.evaluateJavascript("window.__nf(" + id + "," + ok + "," + JSONObject.quote(text) + ")", null);
            }
        });
    }

    private class Bridge {
        @JavascriptInterface
        public void fetchText(final int id, final String url) {
            new Thread(new Runnable() {
                @Override
                public void run() {
                    HttpURLConnection c = null;
                    try {
                        c = (HttpURLConnection) new URL(url).openConnection();
                        c.setConnectTimeout(12000);
                        c.setReadTimeout(15000);
                        c.setInstanceFollowRedirects(true);
                        c.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 13) MehdiNews/1.0");
                        c.setRequestProperty("Accept", "application/rss+xml, application/atom+xml, application/xml, text/xml, */*");
                        int code = c.getResponseCode();
                        if (code < 200 || code >= 300) throw new Exception("HTTP " + code);
                        InputStream in = c.getInputStream();
                        ByteArrayOutputStream out = new ByteArrayOutputStream();
                        byte[] buf = new byte[8192];
                        int n;
                        while ((n = in.read(buf)) > 0) {
                            out.write(buf, 0, n);
                            if (out.size() > 6 * 1024 * 1024) throw new Exception("too large");
                        }
                        in.close();
                        deliver(id, true, new String(out.toByteArray(), "UTF-8"));
                    } catch (Exception e) {
                        deliver(id, false, String.valueOf(e.getMessage()));
                    } finally {
                        if (c != null) c.disconnect();
                    }
                }
            }).start();
        }

        @JavascriptInterface
        public void open(String url) {
            openExternal(url);
        }
    }

    @Override
    protected void onDestroy() {
        if (web != null) {
            web.removeJavascriptInterface("AndroidBridge");
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }
}
