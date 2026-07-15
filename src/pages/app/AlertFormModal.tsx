import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, SelectField } from "@/components/ui/Input";
import { humanizeSnakeCase, toTitleCase } from "@/lib/utils/format";
import { ALERT_FREQUENCY_VALUES, ALERT_CHANNEL_VALUES, type AlertChannel, type AlertFrequency } from "@/lib/data";

const FREQUENCY_OPTIONS = ALERT_FREQUENCY_VALUES.map((v) => ({
  value: v,
  label: toTitleCase(humanizeSnakeCase(v)),
}));
const CHANNEL_OPTIONS = ALERT_CHANNEL_VALUES.map((v) => ({
  value: v,
  label: toTitleCase(humanizeSnakeCase(v)),
}));

function toggleChannel(channels: AlertChannel[], channel: AlertChannel): AlertChannel[] {
  return channels.includes(channel)
    ? channels.filter((c) => c !== channel)
    : [...channels, channel];
}

export interface AlertFormState {
  name: string;
  city: string;
  locality: string;
  priceMin: string;
  priceMax: string;
  frequency: AlertFrequency;
  channels: AlertChannel[];
}

export function AlertFormModal({
  open,
  isEditing,
  form,
  onFormChange,
  isSaving,
  canSave,
  onClose,
  onSave
}: {
  open: boolean;
  isEditing: boolean;
  form: AlertFormState;
  onFormChange: (updater: (prev: AlertFormState) => AlertFormState) => void;
  isSaving: boolean;
  canSave: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  const frequencyLabel = toTitleCase(humanizeSnakeCase(form.frequency));

  return (
    <Modal
      open={open}
      title={isEditing ? "Edit Search Alert" : "Create Search Alert"}
      description="Get notified when new listings match your search criteria."
      onClose={onClose}
      footer={
        <>
          <Button variant="tertiary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={onSave}
            loading={isSaving}
            disabled={!canSave}
          >
            {isEditing ? "Save changes" : "Create alert"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Alert name"
          placeholder="e.g. 1BHK in Koramangala under 15k"
          value={form.name}
          onChange={(e) =>
            onFormChange((prev) => ({ ...prev, name: e.target.value }))
          }
        />

        <div className="flex flex-col gap-2">
          <p className="text-eyebrow font-semibold uppercase tracking-[0.16em] text-ink-3">
            Filters
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City"
              placeholder="Gurugram"
              value={form.city}
              onChange={(e) =>
                onFormChange((prev) => ({ ...prev, city: e.target.value }))
              }
            />
            <Input
              label="Locality"
              placeholder="DLF Phase 1"
              value={form.locality}
              onChange={(e) =>
                onFormChange((prev) => ({ ...prev, locality: e.target.value }))
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Min price (₹)"
              type="number"
              placeholder="10000"
              value={form.priceMin}
              onChange={(e) =>
                onFormChange((prev) => ({ ...prev, priceMin: e.target.value }))
              }
            />
            <Input
              label="Max price (₹)"
              type="number"
              placeholder="20000"
              value={form.priceMax}
              onChange={(e) =>
                onFormChange((prev) => ({ ...prev, priceMax: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-eyebrow font-semibold uppercase tracking-[0.16em] text-ink-3">
            Frequency
          </p>
          <SelectField
            options={FREQUENCY_OPTIONS}
            value={form.frequency}
            onChange={(e) =>
              onFormChange((prev) => ({
                ...prev,
                frequency: e.target.value as AlertFrequency,
              }))
            }
            helperText={`Currently ${frequencyLabel}`}
          />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-eyebrow font-semibold uppercase tracking-[0.16em] text-ink-3">
            Channels
          </p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Alert channels">
            {CHANNEL_OPTIONS.map((opt) => {
              const selected = form.channels.includes(opt.value as AlertChannel);
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="checkbox"
                  aria-checked={selected}
                  onClick={() =>
                    onFormChange((prev) => ({
                      ...prev,
                      channels: toggleChannel(prev.channels, opt.value as AlertChannel),
                    }))
                  }
                  className={
                    "rounded-full border px-3 py-1.5 text-caption font-semibold transition-colors " +
                    (selected
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-line bg-surface text-ink-2 hover:border-accent/40")
                  }
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          {form.channels.length === 0 && (
            <p className="text-caption text-error">Select at least one channel.</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
