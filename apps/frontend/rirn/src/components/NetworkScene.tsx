/** Lightweight vector scenes for the four handoffs in the distribution network. */
export function NetworkScene({ stage }: { stage: number }) {
  return (
    <svg
      viewBox="0 0 180 140"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="network-scene"
    >
      {stage === 0 && (
        <>
          <path className="scene-soft" d="M18 34h94v82H18z" />
          <path d="M18 60h94M18 88h94M18 116h94M28 116v9m74-9v9" />
          <path
            className="scene-paper"
            d="M29 44h16v16H29zm25-5h14v21H54zm26 8h19v13H80zM28 70h16v18H28zm26 3h18v15H54zm29-6h17v21H83z"
          />
          <path className="scene-accent" d="M28 98h19v18H28zm31-2h17v20H59z" />
          <rect
            className="scene-paper"
            x="103"
            y="45"
            width="50"
            height="79"
            rx="7"
          />
          <path d="M120 52h16m-12 64h8" />
          <circle className="scene-accent" cx="127" cy="80" r="12" />
          <path d="m136 90 8 9m-21-19h8m-4-4v8" />
          <path
            className="scene-detail"
            d="M34 24h26m7 0h10M162 64v17m-4-12h8"
          />
        </>
      )}
      {stage === 4 && (
        <>
          <path className="scene-soft" d="M21 51h92v69H21z" />
          <path className="scene-paper" d="m14 51 53-29 53 29zM35 65h54v55H35z" />
          <path d="M35 77h54m-54 12h54m-54 12h54" />
          <path className="scene-accent" d="M76 82h56v37H76z" />
          <path className="scene-paper" d="M132 92h17l15 16v11h-32z" />
          <path d="M139 99h8l9 10h-17M84 94h23m-23 9h14" />
          <circle className="scene-paper" cx="91" cy="120" r="8" />
          <circle className="scene-paper" cx="148" cy="120" r="8" />
          <path className="scene-detail" d="M125 36h30m-30 9h19" />
        </>
      )}
      {stage === 1 && (
        <>
          <path
            className="scene-soft"
            d="M29 19h74v103l-9-5-10 5-10-5-10 5-10-5-10 5-15-6z"
          />
          <path className="scene-paper" d="M38 27h55v37H38z" />
          <path className="scene-accent" d="M47 37h13v17H47zm21-3h15v20H68z" />
          <path d="M42 78h9m9 0h28M42 91h9m9 0h21M42 104h9m9 0h10" />
          <path
            className="scene-paper"
            d="m92 82 29-15 36 17v29l-29 15-36-17z"
          />
          <path className="scene-accent" d="m110 73 36 17v16l-11 5V95L99 79z" />
          <path d="m92 82 36 17 29-15m-29 15v29M102 105l13 6" />
          <path className="scene-detail" d="M120 32h29m-29 10h18m17 14h9" />
        </>
      )}
      {stage === 2 && (
        <>
          <path className="scene-soft" d="M25 52h132v73H25z" />
          <path
            className="scene-paper"
            d="m18 52 73-35 73 35zM41 67h48v58H41zM103 67h38v22h-38z"
          />
          <path d="M41 79h48m-48 12h48m-48 12h48m-48 12h48M98 102h48" />
          <path
            className="scene-accent"
            d="M101 109h22v16h-22zm24-14h24v30h-24z"
          />
          <path d="M112 109v7m25-21v7M79 36h24" />
          <path className="scene-detail" d="M9 66v18m-4-9h8m149 21h8" />
        </>
      )}
      {stage === 3 && (
        <>
          <path className="scene-soft" d="M112 32h47v84h-47z" />
          <path
            className="scene-paper"
            d="m107 32 7-15h43l7 15v8h-57zM123 66h24v50h-24z"
          />
          <path className="scene-accent" d="M12 61h86v51H12z" />
          <path className="scene-paper" d="M98 78h24l18 20v14H98z" />
          <path className="scene-soft" d="M106 85h13l12 14h-25z" />
          <path d="M12 112h128M25 75h30m-30 9h20m104-37h9" />
          <circle className="scene-paper" cx="35" cy="115" r="10" />
          <circle className="scene-paper" cx="119" cy="115" r="10" />
          <path d="M35 112v6m84-6v6" />
          <path className="scene-detail" d="M8 43h46m-37 8h24m116 74h15" />
        </>
      )}
      <path className="scene-ground" d="M8 128h156" />
    </svg>
  );
}
