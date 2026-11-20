import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  IoCallOutline,
  IoChatbubbleOutline,
  IoCalendarOutline,
  IoPhonePortraitOutline,
  IoTrendingUpOutline,
  IoTrendingDownOutline,
  IoRemoveOutline,
  IoStatsChartOutline,
  IoRefreshOutline,
} from "react-icons/io5";
import { fetchContactInsights } from "@/admin/api/contactInsights";
import EmptyState from "@/admin/components/EmptyState";
import RankedList from "@/admin/components/RankedList";
import SegmentedControl from "@/admin/components/SegmentedControl";
import TrendBars from "@/admin/components/TrendBars";
import { getTrend } from "@/admin/lib/contactInsights";
import { CONTACT_EVENT_TYPES } from "@/shared/config/contactEvents";

const RANGE_OPTIONS = [
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
];

// One tile per event type stored in contact_events.event_type.
const TYPE_META = {
  call: { label: "Calls", icon: IoCallOutline },
  message: { label: "Messages", icon: IoChatbubbleOutline },
  tour: { label: "Tour requests", icon: IoCalendarOutline },
  sticky_contact: { label: "Mobile bar", icon: IoPhonePortraitOutline },
};

function TrendBadge({ total, previousTotal, days }) {
  const { direction, percent } = getTrend(total, previousTotal);

  if (direction === "none") return null;
  if (direction === "new") {
    return <span className="text-xs text-trenary">No earlier data to compare yet</span>;
  }

  const tone = {
    up: { Icon: IoTrendingUpOutline, classes: "bg-accent-500/10 text-accent-500", text: `${percent}%` },
    down: { Icon: IoTrendingDownOutline, classes: "bg-error-500/10 text-error-500", text: `${percent}%` },
    flat: { Icon: IoRemoveOutline, classes: "bg-primary-600 text-trenary", text: "No change" },
  }[direction];

  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${tone.classes}`}>
        <tone.Icon size={13} />
        {tone.text}
      </span>
      <span className="text-xs text-trenary">vs previous {days} days</span>
    </span>
  );
}

function TypeTile({ type, count, total }) {
  const { label, icon: Icon } = TYPE_META[type];
  const share = total ? Math.round((count / total) * 100) : 0;

  return (
    <div className="rounded-[12px] border border-accent-500/10 p-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-accent-500/10 text-accent-500">
          <Icon size={16} />
        </div>
        <p className="text-xl font-semibold text-main">{count}</p>
      </div>
      <p className="mt-2.5 truncate text-xs font-medium text-main sm:text-[13px]">{label}</p>
      <p className="mt-0.5 text-[11px] text-trenary">{share}% of contacts</p>
    </div>
  );
}

// Presentational: everything it shows comes in through props, so it can be
// rendered in any state. `status` is 'loading' | 'ready' | 'error'; while a
// new range is loading, the numbers already on screen stay visible but dimmed.
function ContactInsightsView({ days, onDaysChange, status, data, onRetry, onOpenProperty }) {
  const propertyRows = (data?.topProperties ?? []).map((row, index) => ({
    key: row.propertyId ?? `deleted-${index}`,
    name: row.title ?? "Deleted property",
    subtitle: row.title ? row.location : null,
    count: row.count,
    muted: !row.title,
    onClick: row.propertyId && row.title ? () => onOpenProperty(row.propertyId) : undefined,
  }));

  const agentRows = (data?.topAgents ?? []).map((row, index) => ({
    key: row.agentId ?? `unassigned-${index}`,
    name: row.name ?? "No agent assigned",
    count: row.count,
    muted: !row.name,
  }));

  let body;
  if (status === "error") {
    body = (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <p className="text-sm text-trenary">Could not load contact activity.</p>
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-2 rounded-[12px] border border-accent-500/30 px-4 py-2 text-sm font-medium text-accent-500 hover:bg-accent-500/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
        >
          <IoRefreshOutline size={16} />
          Try again
        </button>
      </div>
    );
  } else if (!data) {
    body = (
      <div className="flex min-h-[280px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-500/20 border-t-accent-500" />
      </div>
    );
  } else if (data.total === 0) {
    body = (
      <EmptyState
        icon={IoStatsChartOutline}
        title="No contacts yet"
        description={`Nobody has called or messaged an agent from a listing in the last ${data.days} days.`}
      />
    );
  } else {
    body = (
      <div className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-[210px_minmax(0,1fr)] lg:items-stretch lg:gap-8">
          <div className="flex flex-col justify-center rounded-[12px] bg-primary-500 p-4 sm:p-[18px]">
            <p className="text-xs text-trenary">Contacts · last {data.days} days</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight text-main sm:text-[40px] sm:leading-[1.05]">
              {data.total}
            </p>
            <div className="mt-3">
              <TrendBadge total={data.total} previousTotal={data.previousTotal} days={data.days} />
            </div>
          </div>
          <TrendBars daily={data.daily} />
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
          {CONTACT_EVENT_TYPES.map((type) => (
            <TypeTile key={type} type={type} count={data.byType[type]} total={data.total} />
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <RankedList title="Top properties" rows={propertyRows} emptyText="No contacts yet." />
          <RankedList title="Top agents" rows={agentRows} emptyText="No contacts yet." />
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[16px] border border-accent-500/10 bg-white shadow-[0_9px_28px_rgba(53,35,42,0.045)]">
      <div className="flex flex-col gap-3 border-b border-accent-500/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h3 className="text-[15px] font-semibold tracking-tight text-main">Contact activity</h3>
          <p className="mt-0.5 text-xs text-trenary">Anonymous clicks on the agent contact buttons of listing pages.</p>
        </div>
        <SegmentedControl options={RANGE_OPTIONS} value={days} onChange={onDaysChange} />
      </div>

      <div
        className={`p-5 transition-opacity sm:p-6 ${status === "loading" && data ? "opacity-60" : ""}`}
        aria-busy={status === "loading"}
      >
        {body}
      </div>
    </div>
  );
}

export default function ContactInsights() {
  const navigate = useNavigate();
  const [days, setDays] = useState(7);
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState({ status: "loading", data: null });

  useEffect(() => {
    let active = true;

    fetchContactInsights(days).then(({ data, error }) => {
      if (!active) return;
      if (error) {
        console.error(error);
        setState({ status: "error", data: null });
        return;
      }
      setState({ status: "ready", data });
    });

    return () => {
      active = false;
    };
  }, [days, reloadKey]);

  // Keep whatever is on screen while the next range loads (the view dims it).
  function showLoading() {
    setState((current) => ({ ...current, status: "loading" }));
  }

  function handleDaysChange(nextDays) {
    // Choosing the range that's already shown changes nothing, so no new load
    // starts — setting "loading" here would leave the panel dimmed for good.
    if (nextDays === days) return;
    setDays(nextDays);
    showLoading();
  }

  function handleRetry() {
    setReloadKey((key) => key + 1);
    showLoading();
  }

  return (
    <ContactInsightsView
      days={days}
      onDaysChange={handleDaysChange}
      onRetry={handleRetry}
      status={state.status}
      data={state.data}
      onOpenProperty={(id) => navigate(`/admin/properties/${id}/edit`)}
    />
  );
}
