const ErrorUtils = global.ErrorUtils;
const defaultHandler = ErrorUtils.getGlobalHandler();

ErrorUtils.setGlobalHandler((error, isFatal) => {
  try {
    fetch(process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL + '/debug/globalError.json', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error && error.message ? String(error.message) : String(error),
        stack: error && error.stack ? String(error.stack).slice(0, 1800) : 'no stack',
        isFatal: !!isFatal,
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  } catch (e) {}

  if (defaultHandler) defaultHandler(error, isFatal);
});

require('expo-router/entry');
