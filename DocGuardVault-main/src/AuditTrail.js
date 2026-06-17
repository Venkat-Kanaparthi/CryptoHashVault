import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

const shorten = (addr) =>
  addr ? addr.slice(0, 6) + "..." + addr.slice(-4) : "";
const formatDate = (ts) => (ts ? new Date(ts * 1000).toLocaleString() : "");

function AuditTrail() {
  const navigate = useNavigate();
  const [auditTrail, setAuditTrail] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Load audit trail data from backend
  const loadAuditTrail = async () => {
    setAuditTrail([]);
    setLoading(true);
    setError("");
    try {
      const resp = await fetch("http://localhost:5000/auditTrail");
      const text = await resp.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error("Server returned non-JSON response:\n" + text);
      }
      if (json.status === "success") {
        setAuditTrail(json.data);
      } else {
        setError(json.error || "Unknown error loading audit trail.");
      }
    } catch (e) {
      setError("Error fetching audit trail: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadAuditTrail();
  }, []);

  const getStatusClass = (statusText) => {
    if (!statusText) return "";
    const s = statusText.toLowerCase();
    if (s.includes("successful") || s.includes("verified") || s.includes("found")) {
      return "status success";
    }
    if (s.includes("failed") || s.includes("denied") || s.includes("not found") || s.includes("error")) {
      return "status error";
    }
    return "status info";
  };

  const filteredAuditTrail = auditTrail.filter(
    (ev) =>
      ev.fileHash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.uploader.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="app">
      <div className="container">
        
        {/* Navigation Logo & Badges */}
        <div className="header-wrapper" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => navigate("/")}>
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span style={{ fontWeight: 800, fontFamily: 'var(--font-headings)', fontSize: '18px', background: 'var(--gradient-glow)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              DocGuard Vault
            </span>
          </div>
          <div className="title-badge" style={{ margin: 0 }}>
            Audit Log Console
          </div>
        </div>

        {/* Audit Panel Card */}
        <div className="panel">
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ fontFamily: 'var(--font-headings)', fontSize: '18px', fontWeight: 700 }}>
              Immutable Audit Logs
            </h3>
            
            {/* Search Input Bar */}
            <div className="search-container" style={{ minWidth: '260px' }}>
              <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by hash or uploader..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-text-muted)', padding: '30px 0', justifyContent: 'center' }}>
              <span className="spinner"></span>
              <span>Retrieving audit trail logs from ledger...</span>
            </div>
          )}

          {/* Error Message */}
          {error && <div className={getStatusClass(error)}>{error}</div>}

          {/* Empty State */}
          {!loading && !error && filteredAuditTrail.length === 0 && (
            <div className="status info" style={{ padding: '24px', textAlign: 'center', borderRadius: '14px' }}>
              No document verification logs found in your records.
            </div>
          )}

          {/* Audit Trail List Grid */}
          {!loading && !error && filteredAuditTrail.length > 0 && (
            <ul className="audit-list">
              {filteredAuditTrail.map((ev) => (
                <li key={ev.fileHash} className="audit-card">
                  
                  {/* First row: shortened Hash & View on IPFS link */}
                  <div className="audit-card-row">
                    <span className="audit-card-hash">
                      {ev.fileHash.slice(0, 16)}...{ev.fileHash.slice(-8)}
                    </span>
                    <a
                      href={`https://ipfs.io/ipfs/${ev.ipfsCID}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="audit-card-ipfs"
                    >
                      View IPFS File
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>

                  {/* Second row: metadata grid */}
                  <div className="audit-card-meta">
                    <div className="audit-meta-item">
                      <svg className="audit-meta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Uploader: <strong style={{ color: 'var(--color-text-primary)' }}>{shorten(ev.uploader)}</strong></span>
                    </div>
                    <div className="audit-meta-item">
                      <svg className="audit-meta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Timestamp: <strong style={{ color: 'var(--color-text-primary)' }}>{formatDate(ev.timestamp)}</strong></span>
                    </div>

                    {/* Location Lock Security Indicator */}
                    {ev.hasLocationLock && (
                      <div className="audit-meta-item" style={{ gridColumn: '1 / -1', color: '#fbbf24', fontWeight: 600 }}>
                        <svg className="audit-meta-icon" style={{ color: '#fbbf24' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                        </svg>
                        <span>Location Lock Enforced (±{ev.radius}m radius)</span>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

        </div>

        {/* Back navigation footer button */}
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '4px' }}>
          <button
            className="action-btn"
            onClick={() => navigate("/emr")}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              background: 'var(--gradient-dark)',
              border: '1px solid var(--color-border-subtle)',
              width: 'auto',
              borderRadius: '12px'
            }}
          >
            ← Return to Vault Console
          </button>
        </div>

      </div>
    </div>
  );
}

export default AuditTrail;
