import Link from "next/link";

export default function Footer() {
    return (
      <footer
        className="relative bg-background z-10">
          <div className="glass-panel mx-6 mb-6 p-8">
              <div className="max-w-6xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {/* Logo and Description */}
                      <div className="space-y-4">
                          <div className="flex items-center space-x-3">
                              <h3 className="text-2xl brand-logo-header">swap.show</h3>
                          </div>
                          <p className="text-muted-foreground">
                              Your Gateway to DeFi. Cross-chain aggregator for seamless trading across multiple
                              blockchains.
                          </p>
                      </div>

                      {/* Quick Links */}
                      <div className="space-y-4">
                          <h4 className="font-semibold text-foreground">Product</h4>
                          <ul className="space-y-2 text-muted-foreground">
                              <li>
                                  <Link href="/dashboard" className="hover:text-primary transition-colors">
                                      Swap
                                  </Link>
                              </li>
                              <li>
                                  <Link href="/pool" className="hover:text-primary transition-colors">
                                      Pool
                                  </Link>
                              </li>
                              <li>
                                  <Link href="/" className="hover:text-primary transition-colors">
                                      Explore
                                  </Link>
                              </li>
                              <li>
                                  <Link href="/lend" className="hover:text-primary transition-colors">
                                      Lend & Borrow
                                  </Link>
                              </li>
                              <li>
                                  <Link href="/stake" className="hover:text-primary transition-colors">
                                      Stake
                                  </Link>
                              </li>
                          </ul>
                      </div>

                      {/* Community */}
                      <div className="space-y-4">
                          <h4 className="font-semibold text-foreground">Community</h4>
                          <ul className="space-y-2 text-muted-foreground">
                              <li><a href="#" className="hover:text-primary transition-colors">Documentation</a></li>
                              <li><a href="#" className="hover:text-primary transition-colors">Support</a></li>
                              <li><a href="#" className="hover:text-primary transition-colors">Bug Bounty</a></li>
                              <li><a href="#" className="hover:text-primary transition-colors">Brand Kit</a></li>
                          </ul>
                      </div>
                  </div>

                  {/* Bottom Section */}
                  <div
                    className="border-t border-[hsl(var(--card-border))] mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
                      <p className="text-muted-foreground text-sm">
                          © 2025 swap.show. All rights reserved.
                      </p>
                      <div className="flex space-x-6 mt-4 md:mt-0">
                          <a href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                              Privacy Policy
                          </a>
                          <a href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                              Terms of Service
                          </a>
                      </div>
                  </div>
              </div>
          </div>
      </footer>
    );
};
