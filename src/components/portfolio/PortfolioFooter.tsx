interface PortfolioFooterProps {
  name: string;
}

export function PortfolioFooter({ name }: PortfolioFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-8 px-6 border-t border-border/30">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <p>© {currentYear} {name}. All rights reserved.</p>
        <p>
          Built with{" "}
          <a 
            href="/" 
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Portfolify
          </a>
        </p>
      </div>
    </footer>
  );
}
