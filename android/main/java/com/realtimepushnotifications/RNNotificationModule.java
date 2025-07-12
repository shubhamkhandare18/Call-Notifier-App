package com.realtimepushnotifications; 

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class RNNotificationModule extends ReactContextBaseJavaModule {
    private static final String TAG = "RNNotificationModule";
    private final ReactApplicationContext reactContext;

    public RNNotificationModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @NonNull
    @Override
    public String getName() {
        return "RNNotificationModule";
    }

  
    @ReactMethod
    public void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            
            String callChannelId = "call_channel_id";
            CharSequence callChannelName = "Incoming Calls";
            String callChannelDescription = "Notifications for incoming voice and video calls.";
            int callImportance = NotificationManager.IMPORTANCE_HIGH; // or IMPORTANCE_MAX

            NotificationChannel callChannel = new NotificationChannel(callChannelId, callChannelName, callImportance);
            callChannel.setDescription(callChannelDescription);
            callChannel.enableLights(true);
            callChannel.setLightColor(Color.RED);
            callChannel.enableVibration(true);
            callChannel.setVibrationPattern(new long[]{0, 1000, 500, 1000}); // Vibrate for 1s, pause 0.5s, vibrate 1s

            
            String defaultChannelId = "default_channel_id";
            CharSequence defaultChannelName = "General Notifications";
            String defaultChannelDescription = "General application notifications.";
            int defaultImportance = NotificationManager.IMPORTANCE_DEFAULT;

            NotificationChannel defaultChannel = new NotificationChannel(defaultChannelId, defaultChannelName, defaultImportance);
            defaultChannel.setDescription(defaultChannelDescription);
            defaultChannel.enableLights(true);
            defaultChannel.setLightColor(Color.BLUE);
            defaultChannel.enableVibration(true);

            NotificationManager notificationManager = reactContext.getSystemService(NotificationManager.class);
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(callChannel);
                notificationManager.createNotificationChannel(defaultChannel);
                Log.d(TAG, "Notification channels created: " + callChannelId + ", " + defaultChannelId);
            }
        }
    }

   
    @ReactMethod
    public void showCallNotification(String title, String body, String deepLinkScreen, String channelId, boolean isFullScreenIntent) {
        Log.d(TAG, "Showing call notification: " + title + ", " + body + ", DeepLink: " + deepLinkScreen);

        
        Intent intent = new Intent(reactContext, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        
        if (deepLinkScreen != null && !deepLinkScreen.isEmpty()) {
           
            intent.setData(Uri.parse("myapp://app/" + deepLinkScreen + "?source=notification&title=" + Uri.encode(title)));
        }

        PendingIntent pendingIntent;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            pendingIntent = PendingIntent.getActivity(reactContext, 0, intent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        } else {
            pendingIntent = PendingIntent.getActivity(reactContext, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT);
        }

        // Build the notification
        NotificationCompat.Builder builder = new NotificationCompat.Builder(reactContext, channelId)
                .setSmallIcon(android.R.drawable.ic_menu_call) 
                .setContentTitle(title)
                .setContentText(body)
                .setPriority(NotificationCompat.PRIORITY_HIGH) 
                .setCategory(NotificationCompat.CATEGORY_CALL) 
                .setContentIntent(pendingIntent)
                .setAutoCancel(true) 
                .setFullScreenIntent(pendingIntent, true); 

        
        Intent answerIntent = new Intent(reactContext, MainActivity.class);
        answerIntent.setAction("ANSWER_CALL");
        answerIntent.setData(Uri.parse("myapp://app/CallScreen?action=answer&title=" + Uri.encode(title))); // Deep link for answer
        PendingIntent answerPendingIntent;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            answerPendingIntent = PendingIntent.getActivity(reactContext, 1, answerIntent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        } else {
            answerPendingIntent = PendingIntent.getActivity(reactContext, 1, answerIntent, PendingIntent.FLAG_UPDATE_CURRENT);
        }

        Intent declineIntent = new Intent(reactContext, MainActivity.class);
        declineIntent.setAction("DECLINE_CALL");
        declineIntent.setData(Uri.parse("myapp://app/HomeScreen?action=decline&title=" + Uri.encode(title))); // Deep link for decline
        PendingIntent declinePendingIntent;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            declinePendingIntent = PendingIntent.getActivity(reactContext, 2, declineIntent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        } else {
            declinePendingIntent = PendingIntent.getActivity(reactContext, 2, declineIntent, PendingIntent.FLAG_UPDATE_CURRENT);
        }

        builder.addAction(0, "Answer", answerPendingIntent);
        builder.addAction(0, "Decline", declinePendingIntent);


        NotificationManagerCompat notificationManager = NotificationManagerCompat.from(reactContext);
        
        int notificationId = (int) System.currentTimeMillis();
        notificationManager.notify(notificationId, builder.build());
        Log.d(TAG, "Notification displayed with ID: " + notificationId);
    }

    
    @ReactMethod
    public void showLocalNotification(String title, String body, String deepLinkScreen, String channelId, boolean isFullScreenIntent) {
        Log.d(TAG, "Showing local notification: " + title + ", " + body + ", DeepLink: " + deepLinkScreen);

        Intent intent = new Intent(reactContext, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        if (deepLinkScreen != null && !deepLinkScreen.isEmpty()) {
            intent.setData(Uri.parse("myapp://app/" + deepLinkScreen + "?source=local_notification&title=" + Uri.encode(title)));
        }

        PendingIntent pendingIntent;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            pendingIntent = PendingIntent.getActivity(reactContext, 0, intent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        } else {
            pendingIntent = PendingIntent.getActivity(reactContext, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT);
        }

        NotificationCompat.Builder builder = new NotificationCompat.Builder(reactContext, channelId)
                .setSmallIcon(android.R.drawable.ic_dialog_info) // Use a built-in icon
                .setContentTitle(title)
                .setContentText(body)
                .setPriority(isFullScreenIntent ? NotificationCompat.PRIORITY_HIGH : NotificationCompat.PRIORITY_DEFAULT)
                .setContentIntent(pendingIntent)
                .setAutoCancel(true);

        if (isFullScreenIntent) {
            builder.setFullScreenIntent(pendingIntent, true);
        }

        NotificationManagerCompat notificationManager = NotificationManagerCompat.from(reactContext);
        int notificationId = (int) System.currentTimeMillis();
        notificationManager.notify(notificationId, builder.build());
        Log.d(TAG, "Local notification displayed with ID: " + notificationId);
    }

  
    @ReactMethod
    public void clearAllNotifications() {
        NotificationManagerCompat notificationManager = NotificationManagerCompat.from(reactContext);
        notificationManager.cancelAll();
        Log.d(TAG, "All notifications cleared.");
    }
}
