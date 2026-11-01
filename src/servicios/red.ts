import * as Network from 'expo-network';

/** `isInternetReachable` puede venir vacío: entonces vale `isConnected`. Nunca lanza. */
export async function hayConexion() {
  try {
    const red = await Network.getNetworkStateAsync();
    return (red.isInternetReachable ?? red.isConnected) === true;
  } catch {
    return true;
  }
}
