package com.whalehunter.ai;
import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.graphics.Color;
import android.content.Intent;
import android.net.Uri;
import android.view.Window;
public class MainActivity extends Activity {
 @Override public void onCreate(Bundle b){
  super.onCreate(b);
  requestWindowFeature(Window.FEATURE_NO_TITLE);
  getWindow().setStatusBarColor(Color.rgb(5,8,20));
  getWindow().setNavigationBarColor(Color.rgb(5,8,20));
  WebView w=new WebView(this);
  setContentView(w);
  WebSettings s=w.getSettings();
  s.setJavaScriptEnabled(true);
  s.setDomStorageEnabled(true);
  s.setDatabaseEnabled(true);
  s.setAllowFileAccess(true);
  s.setAllowContentAccess(true);
  s.setAllowFileAccessFromFileURLs(true);
  s.setAllowUniversalAccessFromFileURLs(true);
  s.setBuiltInZoomControls(false);
  s.setDisplayZoomControls(false);
  w.setBackgroundColor(Color.rgb(5,8,20));
  w.setWebViewClient(new WebViewClient(){ @Override public boolean shouldOverrideUrlLoading(WebView view,String url){ if(url.startsWith("https://")||url.startsWith("http://")){ try{ startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))); return true; }catch(Exception e){} } return false; }});
  w.loadUrl("file:///android_asset/index.html");
 }
}