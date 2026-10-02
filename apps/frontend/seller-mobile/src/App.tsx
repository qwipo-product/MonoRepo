import Home from './screens/Home';

export default function App() {
  return (
      <div className="min-h-dvh bg-shell grid place-items-center p-4">
        {/* 390×844 ≈ iPhone 15. Design inside this frame.

            `relative` is load-bearing: @mockups/ui's Sheet renders
            `absolute inset-0` and fills its nearest positioned ancestor.
            Drop it and every bottom sheet escapes the phone and covers the
            whole browser window. */}
        <div className="relative w-[390px] h-[844px] overflow-hidden rounded-[2rem] bg-background text-foreground shadow-xl">
          <div className="h-full overflow-y-auto">
            <Home />
          </div>
        </div>
      </div>
  );
}
