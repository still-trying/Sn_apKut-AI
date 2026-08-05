import logo from "@/assets/snapkut-logo.png.asset.json";

export function Footer() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <img src={logo.url} alt="" className="h-8 w-8 object-contain" />
            <span className="font-bold">
              Sn_apKut <span className="text-gradient">AI</span>
            </span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            One click. No background. Perfect. Images are auto-deleted after 24 hours.
          </p>
        </div>
        {[
          { title: "Product", items: ["Features", "Pricing", "API Docs", "Changelog"] },
          { title: "Company", items: ["About", "Blog", "Contact"] },
          { title: "Legal", items: ["Privacy Policy", "Terms", "Security"] },
        ].map((col) => (
          <div key={col.title}>
            <h3 className="text-sm font-semibold">{col.title}</h3>
            <ul className="mt-3 space-y-2">
              {col.items.map((i) => (
                <li key={i}>
                  <a
                    href="#"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {i}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Sn_apKut AI. All rights reserved.
      </div>
    </footer>
  );
}
