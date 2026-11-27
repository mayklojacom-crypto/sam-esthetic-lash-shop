import christmasFrame from '@/assets/christmas-frame.webp.asset.json';

/** Seasonal decoration only; no changes to offers or shopping rules. */
const WelcomeStrip = () => {
  return (
    <section aria-label="Boas festas da Sam Esthetic" className="seasonal-welcome relative isolate mx-4 mt-4 mb-4 overflow-hidden">
      <img src={christmasFrame.url} width={1536} height={1024} alt="" aria-hidden="true" fetchPriority="high" className="absolute inset-0 -z-10 h-full w-full object-cover" />
      <div className="mx-auto flex h-full w-[62%] flex-col items-center justify-center text-center">
        <p className="text-[9px] sm:text-[10px] font-semibold uppercase text-primary">Boas festas · Sam Esthetic</p>
        <h1 className="mt-2 font-hand text-[30px] md:text-[42px] leading-none text-primary">Seu talento merece<br />brilhar nas festas.</h1>
        <p className="mt-3 max-w-60 text-[10px] md:text-xs leading-relaxed text-foreground">Um Natal cheio de carinho.<br className="md:hidden" /> Um Ano Novo de novas conquistas.</p>
      </div>
    </section>
  );
};

export default WelcomeStrip;
