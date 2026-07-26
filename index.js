import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';
import App from './App';

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const iconFonts = `
    @font-face {
      font-family: 'Ionicons';
      src: url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@14.0.0/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf') format('truetype');
    }
    @font-face {
      font-family: 'Entypo';
      src: url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@14.0.0/build/vendor/react-native-vector-icons/Fonts/Entypo.ttf') format('truetype');
    }
    @font-face {
      font-family: 'FontAwesome';
      src: url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@14.0.0/build/vendor/react-native-vector-icons/Fonts/FontAwesome.ttf') format('truetype');
    }
    @font-face {
      font-family: 'MaterialIcons';
      src: url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@14.0.0/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf') format('truetype');
    }
    @font-face {
      font-family: 'MaterialCommunityIcons';
      src: url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@14.0.0/build/vendor/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf') format('truetype');
    }
    @font-face {
      font-family: 'Feather';
      src: url('https://cdn.jsdelivr.net/npm/@expo/vector-icons@14.0.0/build/vendor/react-native-vector-icons/Fonts/Feather.ttf') format('truetype');
    }
  `;
  const style = document.createElement('style');
  style.type = 'text/css';
  style.appendChild(document.createTextNode(iconFonts));
  document.head.appendChild(style);
}

registerRootComponent(App);
