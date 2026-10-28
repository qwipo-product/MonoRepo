import { Action } from "../components/Action";
export default function NotFound() {
  return (
    <section className="not-found section-space">
      <span className="eyebrow">404 / A SMALL DETOUR</span>
      <h1>
        This route <br />
        ends here.
      </h1>
      <p>Let’s get you back to the right connection.</p>
      <Action href="/">Back to DigiDukaan</Action>
    </section>
  );
}
