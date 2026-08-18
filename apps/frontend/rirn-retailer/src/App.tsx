import { Companies } from './screens/Companies';
import { Login } from './screens/Login';
import { useRetailerSession } from './lib/retailer-session';

export default function App() {
  const { retailer } = useRetailerSession();

  return (
    <div className="min-h-dvh bg-shell grid place-items-center p-4">
      {/* 390×844 ≈ iPhone 15. This surface ships inside a buyer app's WebView,
          so it is designed at phone width — never as a desktop page.

          `relative` is load-bearing: @mockups/ui's Sheet renders
          `absolute inset-0` and fills its nearest positioned ancestor. Without
          it the bottom sheet escapes the frame and covers the whole browser
          window. Scrolling lives on the inner div so the sheet stays put while
          the screen behind it scrolls. */}
      <div className="relative w-[390px] h-[844px] overflow-hidden rounded-[2rem] bg-background text-foreground shadow-xl">
        <div className="h-full overflow-y-auto">
          {retailer ? <Companies /> : <Login />}
        </div>
      </div>
    </div>
  );
}
