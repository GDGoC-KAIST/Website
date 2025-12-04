import Image from "next/image";
import Link from "next/link";
import Container from "@/components/layout/Container";
import CardSurface from "@/components/ui/cards/CardSurface";

const ACTIVITY_IMAGES = [
  {
    id: "main-event",
    src: "/main.jpg",
    alt: "Members hosting a GDG on Campus KAIST event",
  },
  {
    id: "banner-blue",
    src: "/GDG-Campus-Digital-WebsiteBanner-640x500-Blue.png",
    alt: "Campus banner blue",
  },
  {
    id: "banner-wide",
    src: "/GDG-Campus-Digital-WebsiteBanner-1440x500-Blue.png",
    alt: "Wide GDG banner",
  },
  {
    id: "sticker-assembly",
    src: "/GDG-Sticker-Assembly.gif",
    alt: "Sticker assembly animation",
    unoptimized: true,
  },
  {
    id: "sticker-brackets",
    src: "/GDG-Sticker-Brackets.gif",
    alt: "Sticker brackets animation",
    unoptimized: true,
  },
  {
    id: "sticker-slider",
    src: "/GDG-Sticker-Slider.gif",
    alt: "Sticker slider animation",
    unoptimized: true,
  },
] as const;

export default function SectionActivities() {
  return (
    <section className="w-full">
      <Container className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="font-mono text-xs uppercase tracking-[0.35em] text-muted-foreground">
              Activities & Photos
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-[var(--text-1)]">
              Workshops, stickers, late-night builds
            </h2>
            <p className="text-sm text-muted-foreground">
              Snapshots from seminars, hack sessions, sticker swaps, and roadshows.
            </p>
          </div>
          <Link
            href="/about"
            className="text-sm font-semibold text-primary hover:underline"
          >
            See how we work →
          </Link>
        </div>

        <CardSurface className="bg-[var(--surface-2)]/70 p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ACTIVITY_IMAGES.map((image, index) => (
              <div
                key={image.id}
                className={`relative overflow-hidden rounded-[var(--r-card)] ${
                  index === 4 ? "md:col-span-2 lg:col-span-1" : ""
                } aspect-[4/3]`}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  className="object-cover"
                  unoptimized={Boolean(image.unoptimized)}
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 text-xs font-medium text-white">
                  {image.alt}
                </div>
              </div>
            ))}
          </div>
        </CardSurface>
      </Container>
    </section>
  );
}
