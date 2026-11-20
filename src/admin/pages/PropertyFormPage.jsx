import { useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import { IoArrowBackOutline } from "react-icons/io5";
import PropertyForm from "@/admin/components/PropertyForm";
import { useAgents } from "@/admin/context/AgentsContext";
import { useCatalog } from "@/admin/context/CatalogContext";
import { useNeighborhoods } from "@/admin/context/NeighborhoodsContext";
import { useProperties } from "@/admin/context/PropertiesContext";
import { useToast } from "@/admin/context/ToastContext";
import { handleSaveError } from "@/admin/lib/handleSaveError";
import { syncImages } from "@/admin/lib/syncImages";
import useBodyScrollLock from "@/shared/hooks/useBodyScrollLock";

const FORM_ID = "property-form";

const CANCEL_BUTTON_CLASS =
  "rounded-[12px] border border-accent-500/10 bg-white px-4 text-sm font-medium text-secondary transition-colors hover:border-accent-500/30 hover:text-accent-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 disabled:cursor-not-allowed disabled:opacity-50";
const SAVE_BUTTON_CLASS =
  "rounded-[12px] bg-accent-500 px-4 text-sm font-medium text-white transition-colors hover:bg-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 disabled:cursor-not-allowed disabled:opacity-60";

export default function PropertyFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { categories, amenities, getAmenityIdsForCategory, getSubcategoriesForCategory } = useCatalog();
  const {
    properties,
    addProperty,
    updateProperty,
    setPropertyImages,
    getAmenityIdsForProperty,
    setPropertyAmenityIds,
  } = useProperties();
  const { agents } = useAgents();
  const { neighborhoods } = useNeighborhoods();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  // A create that fails after the property row was inserted (at the amenity or
  // photo step) leaves that row behind, already in the list. Remembering its
  // id lets a retry update that row instead of inserting a second copy.
  const createdPropertyIdRef = useRef(null);

  useBodyScrollLock(true);

  const isEditMode = Boolean(id);
  const existingProperty = isEditMode ? properties.find((property) => property.id === id) : null;

  // The properties list keeps its tab/category/status/search/sort state in
  // its own URL — navigating back into real browser history (rather than a
  // bare navigate to a fresh /admin/properties) is what restores it exactly
  // as it was, instead of resetting to "All" every time. `location.key ===
  // "default"` means this page was opened with no history before it in
  // this session (e.g. a direct link), so there's nothing to go back to.
  function goBackToProperties() {
    if (location.key === "default") {
      navigate("/admin/properties");
    } else {
      navigate(-1);
    }
  }

  function handleCancel() {
    goBackToProperties();
  }

  async function handleSubmit({ amenityIds, images, ...fields }) {
    setIsSubmitting(true);
    try {
      // syncImages owns the whole file side of this save, in the only safe
      // order: upload the new photos (each compressed, then given its
      // resized copies when the site is in "variants" mode) -> run the
      // database writes below -> and only once those succeed, delete the
      // files of photos that were removed or replaced (originals and their
      // copies). If anything fails before the images are saved, everything
      // it uploaded is removed again, so a failed save leaves no orphaned
      // files and the old photos untouched. Photos that haven't changed
      // (they still just have a `url`) are never re-uploaded or re-processed.
      const { variantsSkipped, cleanupFailed } = await syncImages({
        bucket: "property-images",
        images,
        previousUrls: existingProperty?.images?.map((image) => image.url) ?? [],
        commit: async (finalImages) => {
          let propertyId;
          if (isEditMode) {
            await updateProperty(existingProperty.id, fields, existingProperty.updated_at);
            propertyId = existingProperty.id;
          } else if (createdPropertyIdRef.current) {
            propertyId = createdPropertyIdRef.current;
            const createdProperty = properties.find((property) => property.id === propertyId);
            await updateProperty(propertyId, fields, createdProperty?.updated_at);
          } else {
            propertyId = await addProperty(fields);
            createdPropertyIdRef.current = propertyId;
          }
          // The amenity link goes before the photos on purpose: the photos are
          // the last database write, so a failure anywhere in here still counts
          // as "before the images are saved" — syncImages removes the new
          // uploads and leaves the old photo files alone.
          await setPropertyAmenityIds(propertyId, amenityIds);
          await setPropertyImages(
            propertyId,
            finalImages.map((image) => ({
              url: image.url,
              focal_x: image.focal_x ?? 0.5,
              focal_y: image.focal_y ?? 0.5,
            })),
          );
          return propertyId;
        },
      });

      // Not failures — the property is saved — but worth telling the admin.
      const notes = [];
      if (variantsSkipped) {
        notes.push(
          "This browser can't create the optimized copies of new photos, so they will load at full size. Saving from a different browser (e.g. Chrome) avoids that.",
        );
      }
      if (cleanupFailed) {
        notes.push("Some replaced photo files could not be deleted from storage.");
      }
      showToast([isEditMode ? "Property updated." : "Property added.", ...notes].join(" "));
      goBackToProperties();
    } catch (error) {
      setIsSubmitting(false);
      // On NOT_FOUND there's nothing left to save to — the edit form doesn't make
      // sense to stay on, so leave rather than let them retry into the same wall.
      // On CONFLICT, unlike NOT_FOUND, their edits might still be worth keeping (the
      // conflict could be on a field they didn't even touch) — stay on the form
      // rather than discard what they typed, and let them decide whether to reload
      // and reapply.
      const detail = error?.message || error?.error_description || "Unknown error";
      handleSaveError(error, {
        showToast,
        closeForm: goBackToProperties,
        fallbackMessage: `Something went wrong saving this property: ${detail}`,
      });
    }
  }

  if (isEditMode && !existingProperty) {
    return (
      <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-primary-500 p-6 text-center">
        <p className="text-sm text-trenary">This property doesn&rsquo;t exist or was deleted.</p>
        <button
          type="button"
          onClick={() => navigate("/admin/properties")}
          className="rounded-[12px] bg-accent-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-600"
        >
          Back to properties
        </button>
      </div>
    );
  }

  const pageTitle = isEditMode ? "Edit property" : "Add property";
  const saveLabel = isSubmitting ? "Saving…" : isEditMode ? "Save changes" : "Save property";

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-primary-500 font-space_grotest">
      <header className="shrink-0 border-b border-accent-500/10 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-[1480px] items-center px-3.5 sm:h-[70px] sm:px-[30px]">
          <button
            type="button"
            onClick={handleCancel}
            aria-label="Back to properties"
            className="flex min-h-10 items-center gap-2 rounded-[10px] px-2.5 text-sm font-medium text-secondary transition-colors hover:bg-primary-600 hover:text-accent-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 max-sm:w-10 max-sm:justify-center max-sm:px-0"
          >
            <IoArrowBackOutline size={18} />
            <span className="max-sm:hidden">Properties</span>
          </button>
          <div className="mx-[17px] hidden h-7 w-px bg-accent-500/10 sm:block" />
          <div className="ml-2 grid min-w-0 gap-0.5 sm:ml-0">
            <p className="truncate text-base font-semibold text-main sm:text-lg">{pageTitle}</p>
            <p className="hidden truncate text-xs text-trenary sm:block">{existingProperty?.title ?? "New listing"}</p>
          </div>
          <div className="ml-auto hidden gap-2.5 sm:flex">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className={`min-h-11 ${CANCEL_BUTTON_CLASS}`}
            >
              Cancel
            </button>
            <button type="submit" form={FORM_ID} disabled={isSubmitting} className={`min-h-11 ${SAVE_BUTTON_CLASS}`}>
              {saveLabel}
            </button>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1480px] px-3 pb-7 pt-6 sm:px-[30px] sm:pb-[90px] sm:pt-[38px]">
          <PropertyForm
            formId={FORM_ID}
            key={existingProperty?.id ?? "create"}
            heading={pageTitle}
            description={
              isEditMode
                ? "Keep the listing details accurate and ready for prospective buyers."
                : "Fill in the details to publish a new listing."
            }
            initialProperty={existingProperty}
            initialAmenityIds={isEditMode ? getAmenityIdsForProperty(existingProperty?.id) : []}
            categories={categories}
            amenities={amenities}
            agents={agents}
            neighborhoods={neighborhoods}
            getAmenityIdsForCategory={getAmenityIdsForCategory}
            getSubcategoriesForCategory={getSubcategoriesForCategory}
            onSubmit={handleSubmit}
          />
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-[minmax(100px,0.65fr)_1fr] gap-2.5 border-t border-accent-500/10 bg-white/95 px-3 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2.5 backdrop-blur sm:hidden">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSubmitting}
          className={`min-h-12 ${CANCEL_BUTTON_CLASS}`}
        >
          Cancel
        </button>
        <button type="submit" form={FORM_ID} disabled={isSubmitting} className={`min-h-12 ${SAVE_BUTTON_CLASS}`}>
          {saveLabel}
        </button>
      </div>
    </div>
  );
}
