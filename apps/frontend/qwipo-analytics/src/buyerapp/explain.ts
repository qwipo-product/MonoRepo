// Hover-tip copy for every tile, row and funnel step on the Buyer app
// analytics boards, in three parts:
//   what  — what the number is
//   why   — why the team looks at it
//   check — how to check it: what to compare it with and where to look next
import type { BoardSpec } from './boards';
import type { EventSpec, FunnelStepSpec, KpiSpec } from './engine';

export interface Explain { what: string; why: string; check: string }

const lc = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/* ── KPI tiles ──────────────────────────────────────────────────────── */

export function explainKpi(board: Pick<BoardSpec, 'title'>, k: KpiSpec): Explain {
  const down = k.good === 'down';
  const what = {
    users: `The number of different buyers who ${lc(k.hint)} in the selected period. A buyer is counted once, however often they did it.`,
    count: `How many times it happened in the selected period (${lc(k.hint)}), repeats included.`,
    pct: `The share of buyers for whom this is true: ${lc(k.hint)}.`,
    time: `The typical (median) time: ${lc(k.hint)}. Half of visits are shorter, half longer.`,
    secs: `The typical (median) wait, in seconds: ${lc(k.hint)}.`,
    ratio: `An average per buyer or per visit: ${lc(k.hint)}.`,
    inr: 'The total value of orders placed in the selected period, in ₹.',
  }[k.kind];
  const why = `Headline number for ${board.title}. ${down ? 'Lower is better, so a rise is the thing to investigate.' : 'Higher is better, so a fall is the thing to investigate.'}`;
  const check = `Read “Now” against “Before” (the previous period of the same length); the coloured pill shows ${k.kind === 'pct' ? 'the move in percentage points' : 'the % change'} and whether it is better or worse. Hover the line for each day, then narrow the filters (city, platform, version) to see where it moved.`;
  return { what, why, check };
}

/* ── event rows ─────────────────────────────────────────────────────── */

export function explainEvent(board: Pick<BoardSpec, 'title'>, sectionTitle: string, e: EventSpec): Explain {
  const down = e.good === 'down';
  const query = /most searched|no results/i.test(sectionTitle);

  const what = `The buyers behind “${e.say ?? e.name}”, each counted once, then what they did straight after and how many didn’t carry on.`;

  const why = down
    ? 'Tracks a problem, so product, ops and tech can size it and decide what to fix first. Fewer is better.'
    : query
      ? 'Shows what buyers look for, so category and catalogue teams can stock and rank the right products.'
      : `Shows whether this part of ${board.title} is noticed and used, so product and design know what earns its place.`;

  const check = down
    ? 'Compare Buyers with Before; a rising pill is red. Times ÷ Buyers shows how often the same buyer hits it again. Narrow the filters to see whether one city, platform or version causes most of it.'
    : 'Compare Buyers with Before and read the Change pill (green is better). Times ÷ Buyers shows how often the same buyer repeats it, and the trend line shows the day-by-day pattern.';
  return { what, why, check };
}

/* ── funnel steps ───────────────────────────────────────────────────── */

export function explainStep(funnelTitle: string, s: FunnelStepSpec | { label: string }, i: number): Explain {
  return i === 0
    ? {
        what: `The buyers who start the ${funnelTitle} journey at “${s.label}”. Every later percentage is measured against this number.`,
        why: 'It sets the size of the journey, so the steps after it can be compared fairly.',
        check: 'Compare with the previous period using the filters, then read down the table to see how many carry on at each step.',
      }
    : {
        what: `The buyers who reached “${s.label}” after the step above, in order. Step ${i + 1} of the ${funnelTitle} journey.`,
        why: 'The gap from the step above is the drop-off, so product can find where buyers give up and fix that step first.',
        check: 'Subtract this step’s Buyers from the step above to see who was lost; the red “biggest” label marks the worst gap. Switch platform or version in the filters to see if one of them leaks more.',
      };
}

export function explainFunnelTile(label: string): Explain {
  const tiles: Record<string, Explain> = {
    Started: {
      what: 'The buyers who began this journey, counted once each.',
      why: 'It is the base for every other number on this page.',
      check: 'Compare with another date range or city; a smaller start means fewer people entered, not that the journey got worse.',
    },
    Finished: {
      what: 'The buyers who reached the last step of the journey.',
      why: 'It is the outcome the journey exists to produce, such as an order or a completed KYC.',
      check: 'Divide by Started to get Conversion, and look at the table below to see where the missing buyers left.',
    },
    Conversion: {
      what: 'The share of buyers who started and also finished.',
      why: 'The one number for how healthy the journey is, comparable week to week.',
      check: 'Compare with the previous period. A drop with a steady Started count means the journey got harder.',
    },
    'Biggest drop-off': {
      what: 'The step where the most buyers are lost compared with the step before it.',
      why: 'It tells product which step to fix first, since closing this gap lifts the whole funnel.',
      check: 'Find the red “biggest” row in the table below and open that screen’s board to see what buyers did there.',
    },
  };
  return tiles[label];
}

export function explainFunnelRow(title: string, steps: string[]): Explain {
  return {
    what: `The ${title} journey: ${steps.join(' → ')}. Started and Finished are buyers counted once each.`,
    why: 'One line per journey, so leadership can compare how many buyers finish each one and where each loses people.',
    check: 'Compare the Conversion bars across rows, then click the funnel name for the step-by-step view of where buyers leave.',
  };
}

/* ── overview-only tiles ────────────────────────────────────────────── */

export const OVERVIEW: Record<string, Explain> = {
  'Weekly ordering buyers': {
    what: 'The number of different shops that placed at least one order in the week.',
    why: 'The north-star number: the one the whole team works to grow. Every other board feeds it.',
    check: 'Compare with the same number last period; if it falls, open Funnels to see which step lost the buyers.',
  },
  'Active buyers': {
    what: 'The number of different buyers who opened the app in the period.',
    why: 'The size of the audience, and the top of every journey.',
    check: 'Compare with Before. If this is steady but Orders fall, the problem is after opening the app, so look at the funnels.',
  },
  Orders: {
    what: 'The number of successful orders placed in the period.',
    why: 'The outcome all the screen boards are trying to move.',
    check: 'Compare with Before and read it next to Active buyers; the Orders per day chart shows which days dipped.',
  },
  'Sales (GMV)': {
    what: 'The total value of orders placed in the period, in ₹.',
    why: 'Lets leadership tie behaviour changes to revenue.',
    check: 'Compare with Before and with Orders: sales rising faster than orders means larger baskets.',
  },
  'Buyer conversion': {
    what: 'The share of buyers who opened the app and went on to place an order.',
    why: 'The overall health of the buying journey in one number.',
    check: 'Compare with Before in percentage points, then open the Purchase funnel to find the step that explains a move.',
  },
  ordersChart: {
    what: 'Orders placed, plotted for each day (or week for the 90-day view).',
    why: 'Shows whether volume is trending up, flat or dropping, and which days dip. Sundays are quieter.',
    check: 'Hover the line for the exact number on a day, and switch the date range to compare short and long trends.',
  },
};

/* ── session recordings ─────────────────────────────────────────────── */

const SIGNAL_CHECK: Record<string, string> = {
  'Rage clicks': 'Click the row to list only those recordings, then watch the top few; the buyer is usually tapping something that is not responding.',
  'Dead clicks': 'Click the row to list those recordings and watch where the taps land; the element probably looks tappable but is not.',
  'Excessive scrolling': 'Click the row, then watch where the buyer scrolls up and down; they are usually looking for something they cannot find.',
  'Repeated navigation': 'Click the row and watch which two screens the buyer bounces between; it usually points to a missing link or unclear step.',
  'Unexpected back': 'Click the row and watch the screen just before the back press; that is where the flow lost the buyer.',
  'Failed interaction': 'Click the row, then check the “What happened” note on each recording for the error that came back.',
  'Left without finishing': 'Click the row and watch the last screen in each recording; it shows where buyers gave up.',
};

export function explainSignal(signal: string): Explain {
  return {
    what: 'The number of recorded buyer visits that show this problem.',
    why: 'Helps support and product choose which buyer sessions to watch first.',
    check: SIGNAL_CHECK[signal],
  };
}

export const RECORDINGS_INFO: Record<'problems' | 'list' | 'watch', Explain> = {
  problems: {
    what: 'A count of recorded visits by the kind of problem they show, for the page you picked.',
    why: 'A quick read on what is going wrong on a page, ranked by how many recordings show it.',
    check: 'Pick a page above, find the biggest number, and click that problem to see the matching recordings.',
  },
  list: {
    what: 'Individual recorded visits: the buyer ID, city, page, what happened and how long it lasted.',
    why: 'Real sessions to watch, so product and support can see exactly where a buyer got stuck and call them.',
    check: 'Read the “What happened” note first, then press Watch on the ones that match the problem you are chasing.',
  },
  watch: {
    what: 'A link to the replay of this visit.',
    why: 'Lets you see the buyer’s taps and screens instead of guessing from numbers.',
    check: 'Press Watch. Replays open in PostHog, which is not connected in this mockup.',
  },
};
