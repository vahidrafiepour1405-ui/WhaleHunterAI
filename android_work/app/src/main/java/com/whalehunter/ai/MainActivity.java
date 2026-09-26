package com.whalehunter.ai;
import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.view.Window;
import android.graphics.Color;
public class MainActivity extends Activity {
  @Override public void onCreate(Bundle b) {
    super.onCreate(b);
    requestWindowFeature(Window.FEATURE_NO_TITLE);
    getWindow().setStatusBarColor(Color.rgb(5,8,20));
    getWindow().setNavigationBarColor(Color.rgb(5,8,20));
    WebView w = new WebView(this);
    setContentView(w);
    WebSettings s = w.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true);
    s.setBuiltInZoomControls(false);
    s.setDisplayZoomControls(false);
    s.setLoadWithOverviewMode(false);
    s.setUseWideViewPort(false);
    w.setBackgroundColor(Color.rgb(5,8,20));
    w.setWebViewClient(new WebViewClient());
    w.loadUrl("file:///android_asset/index.html");
  }
}