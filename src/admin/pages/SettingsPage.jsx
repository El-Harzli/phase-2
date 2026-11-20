import { useState } from "react";
import { useSiteSettings } from "@/admin/context/SiteSettingsContext";
import { useToast } from "@/admin/context/ToastContext";
import ContentSpinner from "@/admin/components/ContentSpinner";
import FormField from "@/admin/components/FormField";
import SectionCard from "@/admin/components/SectionCard";
import { buildSettingsPatch, settingsToFormValues, validateSettingsForm } from "@/admin/lib/settingsForm";
import { digitsOnly } from "@/shared/lib/phone";
import { focusFirstInvalidField } from "@/admin/lib/focusFirstInvalidField";
import { blockExponentAndPlusKeys, blockNonWholeNumberKeys } from "@/admin/lib/numberInputKeys";

const FIELD_ORDER = [
  { key: "priceMin", id: "price-min-input" },
  { key: "priceMax", id: "price-max-input" },
  { key: "agencyName", id: "agency-name-input" },
  { key: "email", id: "agency-email-input" },
  { key: "instagramUrl", id: "instagram-url-input" },
  { key: "instagramHandle", id: "instagram-handle-input" },
  { key: "address", id: "address-input" },
  { key: "officeLat", id: "office-lat-input" },
  { key: "officeLng", id: "office-lng-input" },
  { key: "phoneNumber", id: "phone-number-input" },
  { key: "phoneDisplay", id: "phone-display-input" },
];

export default function SettingsPage() {
  const { settings, loading, updateSettings } = useSiteSettings();
  const { showToast } = useToast();

  if (loading || !settings) {
    return <ContentSpinner />;
  }

  return <SettingsForm initialSettings={settings} updateSettings={updateSettings} showToast={showToast} />;
}

function SettingsForm({ initialSettings, updateSettings, showToast }) {
  const [values, setValues] = useState(() => settingsToFormValues(initialSettings));
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Typing in a field updates it and clears just that field's error.
  // `transform` cleans the typed value first (used by the phone number).
  function handleChange(name, transform = (value) => value) {
    return (event) => {
      const value = transform(event.target.value);
      setValues((current) => ({ ...current, [name]: value }));
      if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validateSettingsForm(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      focusFirstInvalidField(FIELD_ORDER, nextErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await updateSettings(buildSettingsPatch(values), initialSettings.updated_at);
      showToast("Settings saved.");
    } catch (error) {
      console.error(error);
      if (error?.code === "CONFLICT") {
        // Keep their typed values on screen rather than discarding them —
        // the conflict might be on a field they never touched, so it's
        // their call whether to reload and reapply or just save again.
        showToast(error.message, "error");
      } else {
        showToast("Could not save settings.", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-main md:text-2xl">Settings</h2>
        <p className="mt-1 text-sm text-trenary">Site-wide configuration for the public browsing site.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <SectionCard
          title="Price filter range"
          description="The min/max bounds for the price slider on the public site."
        >
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6">
            <FormField
              id="price-min-input"
              label="Minimum (MAD)"
              type="number"
              min="0"
              onKeyDown={blockNonWholeNumberKeys}
              value={values.priceMin}
              onChange={handleChange("priceMin")}
              error={errors.priceMin}
            />
            <FormField
              id="price-max-input"
              label="Maximum (MAD)"
              type="number"
              min="0"
              onKeyDown={blockNonWholeNumberKeys}
              value={values.priceMax}
              onChange={handleChange("priceMax")}
              error={errors.priceMax}
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Agency identity"
          description="Shown in the footer's brand mark, copyright line, and browser tab title."
        >
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6">
            <FormField
              id="agency-name-input"
              label="Agency name"
              type="text"
              value={values.agencyName}
              onChange={handleChange("agencyName")}
              placeholder="e.g. BSI Properties"
              error={errors.agencyName}
              hint='In the footer, the first word is styled bold and the rest in accent italic — works best as two words, e.g. "BSI Properties".'
            />
            <FormField
              id="agency-email-input"
              label="Contact email"
              type="email"
              value={values.email}
              onChange={handleChange("email")}
              placeholder="hello@example.com"
              error={errors.email}
            />
          </div>
        </SectionCard>

        <SectionCard title="Social links" description="Shown in the footer.">
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6">
            <FormField
              id="instagram-url-input"
              label="Instagram URL"
              type="url"
              value={values.instagramUrl}
              onChange={handleChange("instagramUrl")}
              placeholder="https://instagram.com/youraccount"
              error={errors.instagramUrl}
            />
            <FormField
              id="instagram-handle-input"
              label="Displayed handle"
              type="text"
              value={values.instagramHandle}
              onChange={handleChange("instagramHandle")}
              placeholder="@youraccount"
              error={errors.instagramHandle}
            />
            <FormField
              className="sm:col-span-2"
              id="linkedin-url-input"
              label="LinkedIn URL"
              optional
              type="url"
              value={values.linkedinUrl}
              onChange={handleChange("linkedinUrl")}
              placeholder="https://linkedin.com/company/youragency"
              hint="Leave blank to hide the LinkedIn icon in the footer entirely, rather than showing a dead link."
            />
          </div>
        </SectionCard>

        <SectionCard title="Office location" description="Shown in the footer and on the map on the Contact page.">
          <div className="space-y-4 p-5 sm:p-6">
            <FormField
              id="address-input"
              label="Address"
              type="text"
              value={values.address}
              onChange={handleChange("address")}
              placeholder="e.g. 12 Avenue Mohammed VI, Tangier, Morocco"
              error={errors.address}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                id="office-lat-input"
                label="Latitude"
                type="number"
                step="any"
                onKeyDown={blockExponentAndPlusKeys}
                value={values.officeLat}
                onChange={handleChange("officeLat")}
                error={errors.officeLat}
              />
              <FormField
                id="office-lng-input"
                label="Longitude"
                type="number"
                step="any"
                onKeyDown={blockExponentAndPlusKeys}
                value={values.officeLng}
                onChange={handleChange("officeLng")}
                error={errors.officeLng}
              />
            </div>
            <p className="text-xs text-trenary">
              Right-click the spot on Google Maps and copy the coordinates it shows — that pastes in as &quot;lat,
              lng&quot;, which you can split across the two fields above.
            </p>
          </div>
        </SectionCard>

        <SectionCard
          title="Agency phone number"
          description="Used for the Call/WhatsApp links in the header, footer, homepage, and Contact page. Property detail pages are the one exception — those always show the assigned agent's own number instead."
        >
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6">
            <FormField
              id="phone-number-input"
              label="Number (for call/WhatsApp links)"
              type="tel"
              value={values.phoneNumber}
              inputMode="numeric"
              onChange={handleChange("phoneNumber", digitsOnly)}
              placeholder="e.g. 212661234567"
              error={errors.phoneNumber}
              hint="Country code + number, no spaces or symbols — this is what actually opens the call/chat."
            />
            <FormField
              id="phone-display-input"
              label="Displayed as"
              type="text"
              value={values.phoneDisplay}
              onChange={handleChange("phoneDisplay")}
              placeholder="e.g. +212 (0) 661 23 45 67"
              error={errors.phoneDisplay}
              hint="However you'd like it shown to visitors — spacing, brackets, etc."
            />
          </div>
        </SectionCard>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-[12px] bg-accent-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
