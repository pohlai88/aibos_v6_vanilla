/* global navigator, fetch, setTimeout */
import React, { useState } from "react";
import Header from "./Header";

const footerHeight = "56px"; // 14 * 4 = 56px (h-14)

const defaultServices = [
  { name: "Network", key: "network" },
  { name: "API", key: "api" },
  { name: "Database", key: "db" },
  { name: "Auth", key: "auth" },
  { name: "Storage", key: "storage" },
];

const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [diagnosing, setDiagnosing] = useState(false);
  const [results, setResults] = useState<{ [key: string]: boolean } | null>(
    null
  );
  const [networkMs, setNetworkMs] = useState<number | null>(null);
  // Overall status: true = all green, false = any red
  const overallStatus = results ? Object.values(results).every(Boolean) : true;

  // Simulate diagnosis (could be replaced with real checks)
  const runDiagnosis = async () => {
    setDiagnosing(true);
    setResults(null);
    setNetworkMs(null);
    // Network check
    let networkOk = false;
    let pingMs: number | null = null;
    if (navigator.onLine) {
      const start = Date.now();
      try {
        // Use a fast, reliable endpoint (Google DNS)
        await fetch("https://dns.google/resolve?name=example.com", {
          method: "GET",
          cache: "no-store",
        });
        pingMs = Date.now() - start;
        networkOk = true;
      } catch {
        networkOk = false;
      }
    }
    setNetworkMs(networkOk && pingMs !== null ? pingMs : null);
    // Simulate async checks for other services
    setTimeout(() => {
      // For demo, randomly fail one non-network service 20% of the time
      const failIndex =
        Math.random() < 0.2
          ? 1 + Math.floor(Math.random() * (defaultServices.length - 1))
          : -1;
      const newResults: { [key: string]: boolean } = { network: networkOk };
      defaultServices.slice(1).forEach((svc, idx) => {
        newResults[svc.key] = failIndex === idx + 1 ? false : true;
      });
      setResults(newResults);
      setDiagnosing(false);
    }, 1200);
  };

  return (
    <div
      className="flex flex-col min-h-screen bg-gray-50"
      style={{ fontFamily: "Inter, ui-sans-serif, system-ui" }}
    >
      {/* Static Header */}
      <div className="fixed top-0 left-0 w-full z-40 bg-white border-b border-gray-100 shadow-sm">
        <Header />
      </div>
      {/* Main content, offset by header height */}
      <main className="flex-1 flex flex-col items-stretch w-full px-0 pt-16">
        {children}
      </main>
      {/* System Status Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 relative animate-slide-up">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
              aria-label="Close"
              onClick={() => setModalOpen(false)}
            >
              ×
            </button>
            <h2 className="text-2xl font-semibold text-gray-900 mb-1">
              System Status
            </h2>
            <p
              className={`mb-6 text-sm ${
                overallStatus ? "text-green-600" : "text-red-600"
              }`}
            >
              {overallStatus ? "All systems operational" : "Issues detected"}
            </p>
            <ul className="mb-6 space-y-3">
              {defaultServices.map((svc) => (
                <li key={svc.key} className="flex items-center justify-between">
                  <span className="text-gray-700">{svc.name}</span>
                  {svc.key === "network" ? (
                    diagnosing ? (
                      <span className="flex items-center space-x-2">
                        <span className="text-xs text-gray-400 min-w-[32px] text-right">
                          …
                        </span>
                        <span className="w-3 h-3 rounded-full bg-gray-300 animate-pulse" />
                      </span>
                    ) : results ? (
                      <span className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500 min-w-[32px] text-right">
                          {results[svc.key] && networkMs !== null
                            ? `${networkMs} ms`
                            : "N/A"}
                        </span>
                        <span
                          className={`w-3 h-3 rounded-full ${
                            results[svc.key] ? "bg-green-500" : "bg-red-500"
                          }`}
                          title={results[svc.key] ? "Online" : "Offline"}
                        />
                      </span>
                    ) : (
                      <span className="flex items-center space-x-2">
                        <span className="text-xs text-gray-400 min-w-[32px] text-right">
                          —
                        </span>
                        <span className="w-3 h-3 rounded-full bg-gray-200" />
                      </span>
                    )
                  ) : diagnosing ? (
                    <span className="w-3 h-3 rounded-full bg-gray-300 animate-pulse" />
                  ) : results ? (
                    <span
                      className={`w-3 h-3 rounded-full ${
                        results[svc.key] ? "bg-green-500" : "bg-red-500"
                      }`}
                      title={results[svc.key] ? "Operational" : "Issue"}
                    />
                  ) : (
                    <span className="w-3 h-3 rounded-full bg-gray-200" />
                  )}
                </li>
              ))}
            </ul>
            <button
              className="w-full h-11 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium tracking-wide transition disabled:opacity-60"
              onClick={runDiagnosis}
              disabled={diagnosing}
            >
              {diagnosing ? "Running system checks…" : "Run Diagnosis"}
            </button>
          </div>
        </div>
      )}
      {/* Footer */}
      <footer
        className="w-full h-14 flex flex-col md:flex-row items-center justify-between border-t border-gray-100 px-4 text-xs text-gray-400 bg-white"
        style={{ minHeight: footerHeight, height: footerHeight }}
      >
        <div className="flex flex-col md:flex-row items-center md:space-x-4 mb-1 md:mb-0">
          <span>© 2025 De Lettuce Bear Berhad (1482863-D).</span>
          <button
            type="button"
            className="ml-0 md:ml-2 flex items-center space-x-1 hover:text-gray-600 transition focus:outline-none"
            onClick={() => setModalOpen(true)}
          >
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                overallStatus ? "bg-green-500" : "bg-red-500"
              } border border-gray-300`}
              aria-label={
                overallStatus ? "All systems operational" : "Issues detected"
              }
            />
            <span>System Status</span>
          </button>
        </div>
        <div className="flex flex-wrap items-center space-x-2 border-t md:border-t-0 md:border-l border-gray-100 pl-0 md:pl-4 mt-1 md:mt-0">
          <a href="#" className="hover:text-gray-600 transition">
            PDPA Notice
          </a>
          <span>·</span>
          <a href="#" className="hover:text-gray-600 transition">
            Privacy Policy
          </a>
          <span>·</span>
          <span>ISO 27001</span>
          <span>·</span>
          <span>SOC 2</span>
          <span>·</span>
          <span>GDPR Compliant</span>
        </div>
      </footer>
    </div>
  );
};

export default AppShell;
