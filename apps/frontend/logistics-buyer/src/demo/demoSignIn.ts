// One-click sign-in for the three demo users (login page cards and the mock panel switcher).
// It runs the normal OTP send + verify against the mock backend with the mock OTP, so the session is the same as
// one made by typing the number and OTP.
import { authService, authStore } from '../api/services/auth.service';
import { getControls } from '../mock/controls';
import { homeFor, PROFILES, type ProfileKey } from '../profiles';

/** Signs in as the given demo user and returns the page they should land on. */
export async function signInAs(key: ProfileKey): Promise<string> {
  const { mobile } = PROFILES[key];
  await authService.sendOtp(mobile, false);
  authStore.setMobileNumber(mobile);
  await authService.verifyOtp(mobile, getControls().otp);
  return homeFor(authService.getCurrentUser());
}
