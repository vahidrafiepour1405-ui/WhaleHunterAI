package com.whalehunter.ai;
import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.graphics.Color;
import android.content.Intent;
import android.net.Uri;
import android.view.Window;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity {
 @Override public void onCreate(Bundle b){
  super.onCreate(b);
  requestWindowFeature(Window.FEATURE_NO_TITLE);
  getWindow().setStatusBarColor(Color.rgb(5,8,20));
  getWindow().setNavigationBarColor(Color.rgb(5,8,20));
  final WebView w=new WebView(this);
  setContentView(w);
  WebSettings s=w.getSettings();
  s.setJavaScriptEnabled(true);
  s.setDomStorageEnabled(true);
  s.setDatabaseEnabled(true);
  s.setAllowFileAccess(false);
  s.setAllowContentAccess(false);
  s.setAllowFileAccessFromFileURLs(false);
  s.setAllowUniversalAccessFromFileURLs(false);
  s.setBuiltInZoomControls(false);
  s.setDisplayZoomControls(false);
  s.setSupportMultipleWindows(false);
  s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
  w.setBackgroundColor(Color.rgb(5,8,20));
  w.setWebViewClient(new WebViewClient(){
   @Override public boolean shouldOverrideUrlLoading(WebView view,String url){ return openExternal(url); }
   @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest req){ return openExternal(req.getUrl().toString()); }
   private boolean openExternal(String url){
    if(url==null) return false;
    if(url.startsWith("https://appassets.androidplatform.net/")) return false;
    if(url.startsWith("https://")||url.startsWith("http://")||url.startsWith("tg:")||url.startsWith("mailto:")){
     try{ startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))); return true; }catch(Exception e){}
    }
    return false;
   }
  });
  try{
   InputStream in=getAssets().open("index.html");
   byte[] data=new byte[in.available()];
   int off=0,n;
   while((n=in.read(data,off,data.length-off))>0) off+=n;
   in.close();
   String html=new String(data,0,off,StandardCharsets.UTF_8);
   w.loadDataWithBaseURL("https://appassets.androidplatform.net/assets/",""+html,"text/html","UTF-8",null);
  }catch(Exception e){ w.loadDataWithBaseURL("https://appassets.androidplatform.net/assets/","<h2 style='color:white'>Whale Hunter AI</h2><p style='color:#aaa'>خطا در بارگذاری برنامه.</p>","text/html","UTF-8",null); }
 }
 @Override protected void onDestroy(){ super.onDestroy(); }
}