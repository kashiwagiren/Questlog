import React from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Menu, X } from "lucide-react";

interface HeaderProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const menuItems = [
    { id: "home", label: "Home" },
    { id: "quests", label: "Quests" },
    { id: "badges", label: "Badges" },
    { id: "create", label: "Create Quest" },
    { id: "profile", label: "Profile" },
    { id: "admin", label: "Admin" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo */}
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => setActiveTab?.("home")}
          >
            <div className="relative w-8 h-8 sm:w-10 sm:h-10">
              <img
                src="/logo.png"
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold font-retro bg-gradient-to-r from-neon-pink via-neon-purple to-neon-blue bg-clip-text text-transparent retro-glow">
                Questlog
              </h1>
              <p className="text-xs text-gray-400 font-mono tracking-wider hidden sm:block">
                Web3 Achievement Tracker
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-4 xl:space-x-8">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab?.(item.id)}
                className={`text-sm font-medium transition-all duration-200 px-2 xl:px-3 py-2 rounded-lg hover:bg-gray-800/50 ${
                  activeTab === item.id
                    ? "text-purple-400 bg-purple-500/10 border border-purple-500/30"
                    : "text-gray-300 hover:text-white hover:scale-105"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center space-x-2">
            {/* Mobile Connect Button */}
            <div className="lg:hidden">
              <ConnectButton.Custom>
                {({
                  account,
                  chain,
                  openAccountModal,
                  openChainModal,
                  openConnectModal,
                  mounted,
                }) => {
                  const ready = mounted;
                  const connected = ready && account && chain;

                  return (
                    <div
                      {...(!ready && {
                        "aria-hidden": true,
                        style: {
                          opacity: 0,
                          pointerEvents: "none",
                          userSelect: "none",
                        },
                      })}
                    >
                      {(() => {
                        if (!connected) {
                          return (
                            <button
                              onClick={openConnectModal}
                              type="button"
                              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-3 py-2 rounded-lg font-medium transition-all duration-200 text-sm"
                            >
                              Connect
                            </button>
                          );
                        }

                        if (chain.unsupported) {
                          return (
                            <button
                              onClick={openChainModal}
                              type="button"
                              className="bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm"
                            >
                              Wrong
                            </button>
                          );
                        }

                        return (
                          <button
                            onClick={openAccountModal}
                            type="button"
                            className="bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors"
                          >
                            <span className="font-mono text-xs">
                              {account.displayName}
                            </span>
                          </button>
                        );
                      })()}
                    </div>
                  );
                }}
              </ConnectButton.Custom>
            </div>

            <button
              className="lg:hidden text-gray-300 hover:text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Connect Button */}
          <div className="hidden lg:flex items-center space-x-4">
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                mounted,
              }) => {
                const ready = mounted;
                const connected = ready && account && chain;

                return (
                  <div
                    {...(!ready && {
                      "aria-hidden": true,
                      style: {
                        opacity: 0,
                        pointerEvents: "none",
                        userSelect: "none",
                      },
                    })}
                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <button
                            onClick={openConnectModal}
                            type="button"
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-purple-500/25"
                          >
                            Connect Wallet
                          </button>
                        );
                      }

                      if (chain.unsupported) {
                        return (
                          <button
                            onClick={openChainModal}
                            type="button"
                            className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                          >
                            Wrong network
                          </button>
                        );
                      }

                      return (
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={openChainModal}
                            type="button"
                            className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors"
                          >
                            {chain.hasIcon && (
                              <div
                                style={{
                                  background: chain.iconBackground,
                                  width: 16,
                                  height: 16,
                                  borderRadius: 999,
                                  overflow: "hidden",
                                  marginRight: 4,
                                }}
                              >
                                {chain.iconUrl && (
                                  <img
                                    alt={chain.name ?? "Chain icon"}
                                    src={chain.iconUrl}
                                    style={{ width: 16, height: 16 }}
                                  />
                                )}
                              </div>
                            )}
                            <span className="text-sm">{chain.name}</span>
                          </button>

                          <button
                            onClick={openAccountModal}
                            type="button"
                            className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
                          >
                            <span className="font-mono text-sm">
                              {account.displayName}
                            </span>
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-700/50 bg-gray-900/95 backdrop-blur-md">
            <div className="px-4 py-4 space-y-4">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab?.(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`block w-full text-left text-sm font-medium transition-colors ${
                    activeTab === item.id
                      ? "text-purple-400"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
