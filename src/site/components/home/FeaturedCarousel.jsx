import { useState, useRef } from "react";
import PropertyCard from "@/site/components/PropertyCard";
import { Swiper, SwiperSlide } from "swiper/react";
import { IoChevronBackOutline, IoChevronForwardOutline } from "react-icons/io5";
import "swiper/css";

// The Featured Properties carousel, split out of FeaturedPropertiesSection so that
// Swiper and its CSS are downloaded only when that section is about to be seen
// (the section loads this file with React.lazy once it is near the screen) and
// not with the first page load. Everything here is exactly what the section used to
// render itself; the section still owns the tabs, the data and the empty message.

// How wide a card renders at each Swiper breakpoint below (slidesPerView 1.15
// / 1.5 / 2.5 / 3.5 / 4.5 / 5.2 of the content width), rounded UP a little so
// the browser never picks a file that's too small. Keep in step with the
// `breakpoints` prop on the Swiper — this is what stops a ~300px card from
// downloading a 1200px photo.
const CARD_IMAGE_SIZES =
  "(min-width: 1536px) 19vw, (min-width: 1280px) 22vw, (min-width: 1024px) 28vw, (min-width: 768px) 38vw, (min-width: 640px) 62vw, 85vw";

function FeaturedCarousel({ properties, favorites, onToggleFavorite }) {
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);

  const swiperRef = useRef(null);

  return (
    <div className="relative">
      <Swiper
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
          setIsBeginning(swiper.isBeginning);
          setIsEnd(swiper.isEnd);
        }}
        onSlideChange={(swiper) => {
          setIsBeginning(swiper.isBeginning);
          setIsEnd(swiper.isEnd);
        }}
        watchOverflow
        grabCursor
        className="!px-0.5 !pt-2 !pb-8"
        breakpoints={{
          0: { slidesPerView: 1.15, spaceBetween: 12 },
          640: { slidesPerView: 1.5, spaceBetween: 16 }, // sm
          768: { slidesPerView: 2.5, spaceBetween: 18 }, // md (bump to 3.5 if you want it denser)
          1024: { slidesPerView: 3.5, spaceBetween: 20 }, // lg
          1280: { slidesPerView: 4.5, spaceBetween: 24 }, // xl
          1536: { slidesPerView: 5.2, spaceBetween: 24 }, // 2xl - keeps cards from stretching too wide
        }}
      >
        {properties.map((property) => (
          <SwiperSlide key={property.id} className="h-auto self-stretch">
            <PropertyCard
              property={property}
              imageSizes={CARD_IMAGE_SIZES}
              isFavorited={favorites.has(property.id)}
              onToggleFavorite={() => onToggleFavorite(property.id)}
            />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Nav arrows for mouse/trackpad users; hidden on touch-first
          breakpoints where swipe is the natural gesture */}
      <button
        type="button"
        onClick={() => swiperRef.current?.slidePrev()}
        disabled={isBeginning}
        aria-label="Previous properties"
        className="hidden md:flex absolute top-1/2 -translate-y-1/2 -left-4 lg:-left-5 z-10 w-10 h-10 rounded-full bg-white shadow-[0_4px_16px_rgba(0,0,0,0.12)] items-center justify-center text-main transition-all duration-300 hover:bg-accent-500 hover:text-white disabled:opacity-30 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2"
      >
        <IoChevronBackOutline className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => swiperRef.current?.slideNext()}
        disabled={isEnd}
        aria-label="Next properties"
        className="hidden md:flex absolute top-1/2 -translate-y-1/2 -right-4 lg:-right-5 z-10 w-10 h-10 rounded-full bg-white shadow-[0_4px_16px_rgba(0,0,0,0.12)] items-center justify-center text-main transition-all duration-300 hover:bg-accent-500 hover:text-white disabled:opacity-30 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2"
      >
        <IoChevronForwardOutline className="w-4 h-4" />
      </button>
    </div>
  );
}

export default FeaturedCarousel;