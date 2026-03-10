type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
  light?: boolean;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  light = false,
}: SectionHeadingProps) {
  return (
    <div className="max-w-3xl">
      <p
        className={`text-sm font-semibold uppercase tracking-[0.26em] ${
          light ? "text-white/64" : "text-primary-soft"
        }`}
      >
        {eyebrow}
      </p>
      <h1
        className={`display-font mt-4 text-[1.75rem] font-semibold leading-tight md:text-[2.25rem] ${
          light ? "text-white" : "text-primary"
        }`}
      >
        {title}
      </h1>
      <p
        className={`mt-5 text-base leading-8 ${
          light ? "text-white/76" : "text-muted"
        }`}
      >
        {description}
      </p>
    </div>
  );
}
