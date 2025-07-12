// App.js
import React, { useEffect, useState, useRef } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Button,
  TextInput,
  NativeModules,
  Platform,
  Alert,
} from 'react-native';

import messaging from '@react-native-firebase/messaging';
import { Colors } from 'react-native/Libraries/NewAppScreen';

// Destructure the custom native module
const { RNNotificationModule } = NativeModules;

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
    flex: 1,
  };

  const [fcmToken, setFcmToken] = useState('');
  const [notificationData, setNotificationData] = useState({});
  const [badgeCount, setBadgeCount] = useState(0);
  const [messageTitle, setMessageTitle] = useState('Incoming Call');
  const [messageBody, setMessageBody] = useState('John Doe is calling...');
  const [deepLinkScreen, setDeepLinkScreen] = useState('CallScreen'); // Default deep link target

  const scrollViewRef = useRef();

  // Function to scroll to the bottom of the ScrollView
  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  };

  useEffect(() => {
    // Request permission for notifications
    async function requestUserPermission() {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Authorization status:', authStatus);
        getFcmToken();
      } else {
        console.log('Notification permission denied');
        Alert.alert('Permission Denied', 'Please enable notification permissions in settings.');
      }
    }

    // Get FCM token
    async function getFcmToken() {
      const token = await messaging().getToken();
      setFcmToken(token);
      console.log('FCM Token:', token);
    }

    // Configure notification channels on Android (for custom sounds, importance)
    if (Platform.OS === 'android' && RNNotificationModule) {
      RNNotificationModule.createNotificationChannels();
      console.log('Notification channels created/updated.');
    }

    // Foreground messages
    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
      console.log('FCM Message received in foreground:', remoteMessage);
      setNotificationData(remoteMessage.data || {});
      setBadgeCount(prev => prev + 1); // Increment badge count
      scrollToBottom();

      // Optionally, show a local notification for foreground messages
      if (Platform.OS === 'android' && RNNotificationModule) {
        RNNotificationModule.showLocalNotification(
          remoteMessage.notification?.title || 'New Message',
          remoteMessage.notification?.body || 'You have a new message.',
          remoteMessage.data?.screen || 'Home', // Deep link target
          'default_channel_id', // Use a default channel for general messages
          false // Not a full screen intent for foreground
        );
      }
    });

    // Background messages (when app is in background or killed)
    // This listener is triggered when the user taps on the notification
    const unsubscribeBackground = messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notification caused app to open from background state:', remoteMessage);
      setNotificationData(remoteMessage.data || {});
      setBadgeCount(prev => Math.max(0, prev - 1)); // Decrement badge count
      // Handle deep linking here based on remoteMessage.data.screen
      if (remoteMessage.data?.screen) {
        Alert.alert(
          'Deep Link',
          `Navigating to ${remoteMessage.data.screen} with data: ${JSON.stringify(remoteMessage.data)}`
        );
        // In a real app, you would use React Navigation to navigate
        // navigation.navigate(remoteMessage.data.screen, remoteMessage.data);
      }
      scrollToBottom();
    });

    // Initial app open from a quit state
    messaging().getInitialNotification().then(remoteMessage => {
      if (remoteMessage) {
        console.log('Notification caused app to open from quit state:', remoteMessage);
        setNotificationData(remoteMessage.data || {});
        setBadgeCount(prev => Math.max(0, prev - 1)); // Decrement badge count
        if (remoteMessage.data?.screen) {
          Alert.alert(
            'Deep Link (Initial)',
            `App opened to ${remoteMessage.data.screen} with data: ${JSON.stringify(remoteMessage.data)}`
          );
        }
        scrollToBottom();
      }
    });

    requestUserPermission();

    return () => {
      unsubscribeForeground();
      unsubscribeBackground();
    };
  }, []);

  // Function to simulate an incoming call notification using the native module
  const simulateCallNotification = () => {
    if (Platform.OS === 'android' && RNNotificationModule) {
      console.log(`Simulating call notification: ${messageTitle} - ${messageBody}`);
      RNNotificationModule.showCallNotification(
        messageTitle,
        messageBody,
        deepLinkScreen, // Pass the deep link screen
        'call_channel_id', // Use the specific call channel
        true // This is a full screen intent
      );
      setBadgeCount(prev => prev + 1); // Increment for simulated call
    } else {
      Alert.alert('Platform Not Supported', 'Call simulation is only available on Android.');
    }
  };

  const clearBadgeCount = () => {
    setBadgeCount(0);
    // In a real app, you might also clear all notifications here
    if (Platform.OS === 'android' && RNNotificationModule) {
      RNNotificationModule.clearAllNotifications();
    }
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <ScrollView
        ref={scrollViewRef}
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}
        contentContainerStyle={styles.scrollViewContent}
      >
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>React Native Push Notifications</Text>
          <Text style={styles.highlight}>FCM Token:</Text>
          <TextInput
            style={styles.tokenBox}
            value={fcmToken}
            editable={false}
            multiline
            selectTextOnFocus
          />
          <Text style={styles.sectionDescription}>
            Copy this token and use it to send test messages from Firebase Console.
          </Text>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Notification Data</Text>
          <Text style={styles.highlight}>Last Received Data:</Text>
          <Text style={styles.description}>
            {JSON.stringify(notificationData, null, 2) || 'No data yet'}
          </Text>
          <Text style={styles.highlight}>Badge Count: {badgeCount}</Text>
          <Button title="Clear Badge Count" onPress={clearBadgeCount} />
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Simulate WhatsApp-like Call</Text>
          <Text style={styles.description}>
            This uses a native module to show a high-priority notification.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Notification Title (e.g., Incoming Call)"
            value={messageTitle}
            onChangeText={setMessageTitle}
          />
          <TextInput
            style={styles.input}
            placeholder="Notification Body (e.g., John Doe is calling...)"
            value={messageBody}
            onChangeText={setMessageBody}
          />
          <TextInput
            style={styles.input}
            placeholder="Deep Link Screen (e.g., CallScreen)"
            value={deepLinkScreen}
            onChangeText={setDeepLinkScreen}
          />
          <View style={styles.buttonSpacing}>
            <Button title="Simulate Incoming Call" onPress={simulateCallNotification} />
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Backend Trigger Explanation</Text>
          <Text style={styles.description}>
            To send a real notification from a backend, you would use the FCM Server API.
            A typical payload for a high-priority call notification might look like this:
          </Text>
          <Text style={styles.codeBlock}>
            {`{
  "to": "${fcmToken || 'YOUR_DEVICE_FCM_TOKEN'}",
  "priority": "high",
  "content_available": true,
  "data": {
    "title": "Incoming Video Call",
    "body": "Alice is calling you...",
    "screen": "CallScreen",
    "callId": "12345",
    "type": "call"
  },
  "notification": {
    "title": "Incoming Video Call",
    "body": "Alice is calling you...",
    "android_channel_id": "call_channel_id"
  }
}`}
          </Text>
          <Text style={styles.description}>
            The `data` payload is crucial for handling in the native module when the app is killed/background.
            The `notification` payload is used by the system when the app is in the background/killed and `data` is not handled by custom logic.
            `android_channel_id` ensures it uses the high-priority channel.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollViewContent: {
    paddingBottom: 20, // Add some padding at the bottom
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 10,
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
    color: Colors.dark,
  },
  highlight: {
    fontWeight: '700',
    color: Colors.black,
    marginTop: 10,
  },
  description: {
    fontSize: 16,
    color: Colors.dark,
    marginTop: 5,
  },
  tokenBox: {
    backgroundColor: '#f0f0f0',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    fontSize: 14,
    color: '#333',
    maxHeight: 100, // Limit height for token display
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginTop: 10,
    color: Colors.black,
  },
  buttonSpacing: {
    marginTop: 20,
  },
  codeBlock: {
    backgroundColor: '#e0e0e0',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    color: '#333',
  },
});

export default App;

