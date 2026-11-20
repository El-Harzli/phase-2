import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { IoInformationCircleOutline, IoLocationOutline } from "react-icons/io5";
import AmenityMultiSelect from "@/admin/components/AmenityMultiSelect";
import FormField from "@/admin/components/FormField";
import FormSection from "@/admin/components/FormSection";
import ImageGallery from "@/admin/components/ImageGallery";
import LocationPicker from "@/admin/components/LocationPicker";
import PropertySummaryCard from "@/admin/components/PropertySummaryCard";
import SegmentedControl from "@/admin/components/SegmentedControl";
import SelectField from "@/admin/components/SelectField";
import Toggle from "@/admin/components/Toggle";
import { EDITOR_LABEL_CLASS } from "@/admin/config/editorFieldStyles";
import { focusFirstInvalidField } from "@/admin/lib/focusFirstInvalidField";
import { blockNonWholeNumberKeys } from "@/admin/lib/numberInputKeys";
import { buildPropertyPayload, propertyToFormValues, validatePropertyForm } from "@/admin/lib/propertyForm";

const FIELD_ORDER = [
  { key: "title", id: "title-input" },
  { key: "category", id: "category-select" },
  { key: "neighborhood", id: "neighborhood-select" },
  { key: "agent", id: "agent-select" },
  { key: "price", id: "price-input" },
  { key: "beds", id: "beds-input" },
  { key: "baths", id: "baths-input" },
  { key: "area", id: "area-input" },
  { key: "garage", id: "garage-input" },
  { key: "yearBuilt", id: "year-built-input" },
  { key: "location", id: "location-input" },
  { key: "lat", id: "lat-input" },
  { key: "lng", id: "lng-input" },
];

export default function PropertyForm({
  formId,
  heading,
  description,
  initialProperty,
  initialAmenityIds,
  categories,
  amenities,
  agents,
  neighborhoods,
  getAmenityIdsForCategory,
  getSubcategoriesForCategory,
  onSubmit,
}) {
  const [values, setValues] = useState(() => propertyToFormValues(initialProperty));
  const [images, setImages] = useState(initialProperty?.images ?? []);
  const [amenityIds, setAmenityIds] = useState(initialAmenityIds ?? []);
  const [errors, setErrors] = useState({});
  const preserveImagesRef = useRef(false);

  function setValue(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  function clearError(errorKey) {
    if (errors[errorKey]) setErrors((current) => ({ ...current, [errorKey]: undefined }));
  }

  // Typing in a field updates it and clears just that field's error.
  function handleChange(name, errorKey = name) {
    return (event) => {
      setValue(name, event.target.value);
      clearError(errorKey);
    };
  }

  function handleSelectChange(name, errorKey) {
    return (value) => {
      setValue(name, value);
      clearError(errorKey);
    };
  }

  const applicableAmenityIds = values.categoryId ? getAmenityIdsForCategory(values.categoryId) : [];
  const applicableAmenities = amenities.filter((amenity) => applicableAmenityIds.includes(amenity.id));
  const amenitiesEmptyMessage = !values.categoryId
    ? "Choose a category to see its applicable amenities."
    : "This category has no amenities assigned yet — add some from the Categories page.";

  const applicableSubcategories = values.categoryId ? getSubcategoriesForCategory(values.categoryId) : [];
  const selectedCategory = categories.find((category) => category.id === values.categoryId);
  const selectedNeighborhood = neighborhoods.find((neighborhood) => neighborhood.id === values.neighborhoodId);

  function handleCategoryChange(newCategoryId) {
    const applicable = getAmenityIdsForCategory(newCategoryId);
    setAmenityIds((current) => current.filter((id) => applicable.includes(id)));
    const applicableSubcategoryIds = getSubcategoriesForCategory(newCategoryId).map((subcategory) => subcategory.id);
    setValues((current) => ({
      ...current,
      categoryId: newCategoryId,
      subcategoryId: applicableSubcategoryIds.includes(current.subcategoryId) ? current.subcategoryId : "",
    }));
    clearError("category");
  }

  function toggleAmenity(id) {
    setAmenityIds((current) =>
      current.includes(id) ? current.filter((existing) => existing !== id) : [...current, id],
    );
  }

  function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validatePropertyForm(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      focusFirstInvalidField(FIELD_ORDER, nextErrors);
      return;
    }

    preserveImagesRef.current = true;

    onSubmit({ ...buildPropertyPayload(values), images, amenityIds });
  }

  const isPublished = values.status === "published";

  return (
    <>
      <section className="flex items-start justify-between gap-6 sm:items-end">
        <div>
          <span className="font-anonymous text-[11px] font-bold tracking-[0.16em] text-accent-500">
            PROPERTY LISTING
          </span>
          <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-main md:text-[31px] md:leading-[1.15]">
            {heading}
          </h2>
          <p className="mt-1.5 max-w-[280px] text-xs text-trenary sm:max-w-none sm:text-sm">{description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-full border border-accent-500/10 bg-white px-3 py-2 text-[11px] text-trenary">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isPublished ? "bg-accent-500 shadow-[0_0_0_3px_rgba(109,33,60,0.1)]" : "bg-gold-500"
            }`}
          />
          {isPublished ? "Published" : "Draft"}
        </div>
      </section>

      <form
        id={formId}
        onSubmit={handleSubmit}
        noValidate
        className="mt-5 grid grid-cols-1 items-start gap-3 sm:mt-7 lg:grid-cols-[minmax(0,1.3fr)_minmax(380px,1fr)] lg:gap-[18px]"
      >
        {/* Two columns from `lg` up. Below that both wrappers vanish (`contents`) and
            the cards stack in the order given by their `order-*` numbers, which is
            the order they appear in on a phone. */}
        <div className="contents lg:grid lg:grid-cols-[minmax(0,1fr)] lg:gap-[18px]">
          <FormSection
            className="order-1"
            title="Basic information"
            description="The key information visitors see first."
          >
            <FormField
              variant="editor"
              id="title-input"
              label="Property title"
              required
              type="text"
              value={values.title}
              onChange={handleChange("title")}
              placeholder="e.g. Maple Hollow Residence"
              error={errors.title}
            />
            <FormField
              variant="editor"
              id="description-input"
              label="Description"
              multiline
              rows={4}
              value={values.description}
              onChange={handleChange("description")}
              placeholder="A short, appealing description for the listing"
              hint="Describe the property’s strongest features, layout, and surroundings."
            />
          </FormSection>

          <FormSection
            className="order-3"
            title="Property details"
            description="Pricing, capacity, and physical specifications."
          >
            <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3 sm:gap-y-[18px]">
              <FormField
                variant="editor"
                id="price-input"
                label="Price (MAD)"
                required
                type="text"
                inputMode="numeric"
                suffix="MAD"
                onKeyDown={blockNonWholeNumberKeys}
                value={values.price}
                onChange={handleChange("price")}
                error={errors.price}
              />
              <FormField
                variant="editor"
                id="beds-input"
                label="Bedrooms"
                type="text"
                inputMode="numeric"
                onKeyDown={blockNonWholeNumberKeys}
                value={values.beds}
                onChange={handleChange("beds")}
                error={errors.beds}
              />
              <FormField
                variant="editor"
                id="baths-input"
                label="Bathrooms"
                type="text"
                inputMode="numeric"
                onKeyDown={blockNonWholeNumberKeys}
                value={values.baths}
                onChange={handleChange("baths")}
                error={errors.baths}
              />
              <FormField
                variant="editor"
                id="area-input"
                label="Area"
                type="text"
                inputMode="numeric"
                suffix="m²"
                onKeyDown={blockNonWholeNumberKeys}
                value={values.area}
                onChange={handleChange("area")}
                error={errors.area}
              />
              <FormField
                variant="editor"
                id="garage-input"
                label="Garage"
                type="text"
                inputMode="numeric"
                onKeyDown={blockNonWholeNumberKeys}
                value={values.garage}
                onChange={handleChange("garage")}
                error={errors.garage}
              />
              <FormField
                variant="editor"
                id="year-built-input"
                label="Year built"
                type="text"
                inputMode="numeric"
                onKeyDown={blockNonWholeNumberKeys}
                value={values.yearBuilt}
                onChange={handleChange("yearBuilt")}
                error={errors.yearBuilt}
              />
            </div>
          </FormSection>

          <FormSection
            className="order-4"
            title="Location"
            description="Set the public address and fine-tune its map position."
          >
            <FormField
              variant="editor"
              id="location-input"
              label="Address"
              required
              type="text"
              icon={IoLocationOutline}
              value={values.location}
              onChange={handleChange("location")}
              placeholder="e.g. Malabata, Tangier"
              error={errors.location}
            />
            <LocationPicker
              lat={values.lat}
              lng={values.lng}
              latError={errors.lat}
              lngError={errors.lng}
              onChange={(nextLat, nextLng) => {
                setValues((current) => ({ ...current, lat: nextLat, lng: nextLng }));
                if (errors.lat || errors.lng) {
                  setErrors((current) => ({ ...current, lat: undefined, lng: undefined }));
                }
              }}
            />
          </FormSection>

          <FormSection
            className="order-6"
            title="Photos"
            description="Add listing images and choose the cover shown in search results."
          >
            <ImageGallery images={images} onChange={setImages} preserveOnUnmountRef={preserveImagesRef} />
          </FormSection>
        </div>

        <div className="contents lg:grid lg:grid-cols-[minmax(0,1fr)] lg:gap-[18px]">
          <FormSection
            className="order-2"
            title="Listing configuration"
            description="Control how and where this property appears."
          >
            <div className="grid gap-[7px]">
              <span className={EDITOR_LABEL_CLASS}>Listing type</span>
              <SegmentedControl
                variant="editor"
                options={[
                  { value: "sale", label: "Sale" },
                  { value: "rent", label: "Rent" },
                ]}
                value={values.listingType}
                onChange={(value) => setValue("listingType", value)}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className={EDITOR_LABEL_CLASS}>Status</p>
                <p className="mt-0.5 text-xs text-trenary">
                  {isPublished ? "Published — visible on the public site" : "Draft — hidden from the public site"}
                </p>
              </div>
              <Toggle
                compact
                checked={isPublished}
                onChange={(checked) => setValue("status", checked ? "published" : "draft")}
                label="Published"
              />
            </div>

            {/* Two columns at every screen size: Category | Neighborhood, then
                Subtype | Agent. With no sub-types for the chosen category, Agent
                sits alone in the left cell. */}
            <div className="grid grid-cols-2 gap-3">
              <SelectField
                variant="editor"
                id="category-select"
                label="Category"
                required
                value={values.categoryId}
                onChange={handleCategoryChange}
                placeholder="Select…"
                options={categories.map((category) => ({ value: category.id, label: category.name }))}
                error={errors.category}
              />
              <SelectField
                variant="editor"
                id="neighborhood-select"
                label="Neighborhood"
                required
                value={values.neighborhoodId}
                onChange={handleSelectChange("neighborhoodId", "neighborhood")}
                placeholder="Select…"
                options={neighborhoods.map((neighborhood) => ({ value: neighborhood.id, label: neighborhood.name }))}
                error={errors.neighborhood}
                hint={
                  neighborhoods.length === 0
                    ? "No neighborhoods yet — add one from the Neighborhoods page first."
                    : undefined
                }
              />
              {applicableSubcategories.length > 0 && (
                <motion.div
                  key="subcategory-field"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="min-w-0"
                >
                  <SelectField
                    variant="editor"
                    id="subcategory-select"
                    label="Subtype (optional)"
                    value={values.subcategoryId}
                    onChange={(value) => setValue("subcategoryId", value)}
                    placeholder="None"
                    options={applicableSubcategories.map((subcategory) => ({
                      value: subcategory.id,
                      label: subcategory.name,
                    }))}
                    hint={selectedCategory?.name ? `Specific to ${selectedCategory.name}.` : undefined}
                  />
                </motion.div>
              )}
              <SelectField
                variant="editor"
                id="agent-select"
                label="Agent"
                required
                value={values.agentId}
                onChange={handleSelectChange("agentId", "agent")}
                placeholder="Select…"
                options={agents.map((agent) => ({ value: agent.id, label: agent.name }))}
                error={errors.agent}
              />
            </div>
          </FormSection>

          <FormSection
            className="order-5"
            title="Amenities"
            description="Select the features available at this property."
          >
            <AmenityMultiSelect
              layout="checklist"
              amenities={applicableAmenities}
              selectedIds={amenityIds}
              onToggle={toggleAmenity}
              emptyMessage={amenitiesEmptyMessage}
            />
            <p className="flex items-start gap-1.5 text-xs leading-snug text-trenary">
              <IoInformationCircleOutline size={14} className="mt-px shrink-0" />
              Only amenities available for the selected category are shown.
            </p>
          </FormSection>

          <FormSection
            className="order-7"
            title="Additional settings"
            description="Optional controls for this listing."
          >
            <div className="flex items-center justify-between gap-4 max-sm:items-start">
              <div className="min-w-0">
                <p className={EDITOR_LABEL_CLASS}>Popular listing</p>
                <p className="mt-0.5 text-xs text-trenary">
                  Show a “Popular” badge and prioritize this property in the default public-site sort.
                </p>
              </div>
              <Toggle
                compact
                checked={values.popular}
                onChange={(value) => setValue("popular", value)}
                label="Popular"
              />
            </div>
          </FormSection>

          <div className="hidden lg:order-8 lg:block">
            <PropertySummaryCard
              title={values.title}
              categoryName={selectedCategory?.name}
              neighborhoodName={selectedNeighborhood?.name}
              listingType={values.listingType}
              status={values.status}
              price={values.price}
            />
          </div>
        </div>
      </form>
    </>
  );
}
