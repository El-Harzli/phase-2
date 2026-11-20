import { useRef, useState } from "react";
import { motion, Reorder, useDragControls } from "framer-motion";
import {
  IoCloudUploadOutline,
  IoCloseCircle,
  IoImageOutline,
  IoLocateOutline,
  IoReorderThreeOutline,
} from "react-icons/io5";
import FocalPointEditor from "@/admin/components/FocalPointEditor";
import ThumbImage from "@/admin/components/ThumbImage";
import useLocalImageCleanup from "@/admin/hooks/useLocalImageCleanup";
import { isLocalUrl } from "@/admin/lib/localImageUrl";

// A native HTML5 `draggable` grid (what this used before) only fires drag
// events on mouse input — touch devices never dispatch them at all, which
// is why reordering silently fell back to iOS's own long-press image menu
// instead. It also meant the hover-only Remove button stayed invisible
// but still clickable on touch, since there's no hover state to reveal
// it — an accidental tap in that corner would delete a photo with no
// visible target. Framer Motion's Reorder fixes both: it's pointer-based
// (works identically for mouse and touch), and only the small grab handle
// starts a drag (`dragListener={false}` + a dedicated handle), so tapping
// the photo itself does nothing and Position/Remove are their own
// always-visible buttons. This is the same fix already applied to
// FeaturedPage.jsx — see the comment there.
//
// One consequence: Reorder only reorders reliably along a single axis, so
// this is a horizontally-scrolling strip rather than a wrapping grid —
// a wrapping multi-row grid doesn't have a well-defined "the item is
// between these two" order to fall back to, e.g. what does dragging into
// row 2 mean for the item's new position?
function GalleryTile({ image, isCover, onPosition, onRemove, onMakeCover, onDragEnd }) {
  const dragControls = useDragControls();
  const objectPosition = `${(image.focal_x ?? 0.5) * 100}% ${(image.focal_y ?? 0.5) * 100}%`;

  return (
    <Reorder.Item
      value={image.id}
      dragListener={false}
      dragControls={dragControls}
      onDragEnd={onDragEnd}
      className={`relative h-32 w-32 sm:h-36 sm:w-36 shrink-0 select-none overflow-hidden rounded-[16px] bg-primary-600 ${
        isCover ? "border-2 border-accent-500" : "border border-accent-500/10"
      }`}
    >
      {/* The tile is at most 144px wide, so the 480px copy covers 3x density. */}
      <ThumbImage url={image.url} width={480} className="h-full w-full object-cover" style={{ objectPosition }} />

      {isCover ? (
        <span className="absolute left-1.5 top-1.5 rounded-full bg-accent-500 px-2 py-0.5 text-[11px] font-medium text-white">
          Cover
        </span>
      ) : (
        <button
          type="button"
          onClick={onMakeCover}
          className="absolute left-1.5 top-1.5 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          Make cover
        </button>
      )}

      <span
        onPointerDown={(event) => dragControls.start(event)}
        aria-hidden="true"
        className="absolute bottom-1.5 left-1.5 flex h-6 w-6 touch-none cursor-grab items-center justify-center rounded-full bg-black/55 text-white active:cursor-grabbing"
      >
        <IoReorderThreeOutline size={14} />
      </span>

      <button
        type="button"
        onClick={onPosition}
        aria-label="Set photo position"
        className="absolute bottom-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <IoLocateOutline size={14} />
      </button>

      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove image"
        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <IoCloseCircle size={16} />
      </button>
    </Reorder.Item>
  );
}

export default function ImageGallery({ images, onChange, preserveOnUnmountRef }) {
  const fileInputRef = useRef(null);
  const [positioningId, setPositioningId] = useState(null);
  useLocalImageCleanup(
    images.map((image) => image.url),
    preserveOnUnmountRef,
  );

  // The order shown live during a drag — synced from `images` whenever it
  // changes from outside a drag (add/remove/position). Reorder.Group
  // drives this live via onReorder; the actual sort_order commit happens
  // once, on drop — same pattern as FeaturedPage.jsx's orderedIds.
  // The sync compares the list of ids (not the array itself), so it only
  // re-runs when photos were really added, removed or reordered.
  const imageIds = images.map((image) => image.id);
  const imageIdsKey = imageIds.join(",");
  const [orderedIds, setOrderedIds] = useState(imageIds);
  const [syncedKey, setSyncedKey] = useState(imageIdsKey);
  if (syncedKey !== imageIdsKey) {
    setSyncedKey(imageIdsKey);
    setOrderedIds(imageIds);
  }

  const imagesById = new Map(images.map((image) => [image.id, image]));
  const displayedImages = orderedIds.map((id) => imagesById.get(id)).filter(Boolean);

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function handleFiles(fileList) {
    const files = Array.from(fileList);
    const newImages = files.map((file, index) => ({
      id: `local-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
      url: URL.createObjectURL(file),
      file,
      sort_order: images.length + index,
      // Default to dead-center until the admin explicitly repositions it —
      // matches plain `object-fit: cover` behavior, so nothing looks
      // different for photos nobody's bothered to adjust.
      focal_x: 0.5,
      focal_y: 0.5,
    }));
    onChange([...images, ...newImages]);
  }

  function handleRemove(id) {
    const removed = images.find((image) => image.id === id);
    if (isLocalUrl(removed?.url)) URL.revokeObjectURL(removed?.url);
    const next = images.filter((image) => image.id !== id).map((image, index) => ({ ...image, sort_order: index }));
    onChange(next);
  }

  function handleMakeCover(id) {
    const chosen = images.find((image) => image.id === id);
    if (!chosen) return;
    const next = [chosen, ...images.filter((image) => image.id !== id)].map((image, index) => ({
      ...image,
      sort_order: index,
    }));
    onChange(next);
  }

  function handleFocalSave(id, focal) {
    onChange(images.map((image) => (image.id === id ? { ...image, focal_x: focal.x, focal_y: focal.y } : image)));
    setPositioningId(null);
  }

  function handleDragEnd() {
    onChange(orderedIds.map((id, index) => ({ ...imagesById.get(id), sort_order: index })));
  }

  const positioningImage = images.find((image) => image.id === positioningId) ?? null;

  return (
    <div className="min-w-0">
      {images.length === 0 ? (
        <button
          type="button"
          onClick={openFilePicker}
          className="flex min-h-[170px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-accent-500/25 bg-primary-500 px-4 text-center transition-colors hover:border-accent-500 hover:bg-accent-500/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 sm:min-h-[190px]"
        >
          <span className="grid h-11 w-11 place-items-center rounded-[10px] bg-white text-accent-500 shadow-[0_3px_12px_rgba(53,35,42,0.07)]">
            <IoCloudUploadOutline size={20} />
          </span>
          <strong className="mt-3 text-sm font-semibold text-main">Add property photos</strong>
          <small className="mt-1 text-xs text-trenary">Upload JPG, PNG, or WebP images</small>
          <span className="mt-3.5 rounded-[8px] border border-accent-500/10 bg-white px-3 py-1.5 text-xs font-semibold text-accent-500">
            Choose files
          </span>
        </button>
      ) : (
        <>
          <motion.div layoutScroll className="flex gap-3 overflow-x-auto pb-2">
            <Reorder.Group axis="x" values={orderedIds} onReorder={setOrderedIds} className="flex shrink-0 gap-3">
              {displayedImages.map((image, index) => (
                <GalleryTile
                  key={image.id}
                  image={image}
                  isCover={index === 0}
                  onPosition={() => setPositioningId(image.id)}
                  onRemove={() => handleRemove(image.id)}
                  onMakeCover={() => handleMakeCover(image.id)}
                  onDragEnd={handleDragEnd}
                />
              ))}
            </Reorder.Group>

            <button
              type="button"
              onClick={openFilePicker}
              className="flex h-28 w-28 shrink-0 flex-col items-center justify-center gap-1.5 rounded-[16px] border border-dashed border-accent-500/20 text-secondary transition-colors hover:border-accent-500/40 hover:text-accent-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              <IoCloudUploadOutline size={20} />
              <span className="text-xs font-medium">Add photos</span>
            </button>
          </motion.div>

          <p className="mt-3 flex items-center gap-1.5 text-sm text-trenary">
            <IoImageOutline size={16} className="shrink-0" />
            Drag the handle to reorder. The first photo is the cover image.
          </p>
        </>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(event) => {
          if (event.target.files?.length) handleFiles(event.target.files);
          event.target.value = "";
        }}
        className="hidden"
      />

      <FocalPointEditor
        isOpen={positioningImage !== null}
        imageUrl={positioningImage?.url}
        initialFocal={
          positioningImage ? { x: positioningImage.focal_x ?? 0.5, y: positioningImage.focal_y ?? 0.5 } : undefined
        }
        onCancel={() => setPositioningId(null)}
        onSave={(focal) => handleFocalSave(positioningId, focal)}
      />
    </div>
  );
}
