import React from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="app">
      <div className="container">
        
        {/* Title Badge & Badge Group */}
        <div className="header-wrapper">
          <div className="title-badge">
            <span style={{ display: "inline-block", width: "6px", height: "6px", backgroundColor: "#10b981", borderRadius: "50%", marginRight: "4px" }}></span>
            Web3 Security Active
          </div>
          <h1 className="title">
            DocGuard Vault
          </h1>
        </div>

        {/* Hero Section */}
        <div className="hero-wrapper">
          
          {/* Glowing Animated Shield Visual */}
          <div className="hero-visual">
            <div className="hero-glow-ring"></div>
            <svg
              className="hero-shield-svg"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>

          <p className="hero-tagline">
            A trusted, high-security decentralized platform for handling sensitive documents. 
            Cryptographically protect, lock, and verify your files immutably.
          </p>

          {/* Features Grid */}
          <div className="hero-features">
            
            {/* Feature 1 */}
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
                </svg>
              </div>
              <h3 className="feature-title">Cryptographic Hash</h3>
              <p className="feature-desc">
                Every file is hashed locally with Keccak256 before upload, ensuring zero-knowledge privacy.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <h3 className="feature-title">Immutable Logging</h3>
              <p className="feature-desc">
                Logs are written directly to smart contracts to guarantee permanent tampering detection.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <h3 className="feature-title">Location Lock</h3>
              <p className="feature-desc">
                Optionally secure files with geolocation locks, making them verifiable only from specified boundaries.
              </p>
            </div>

          </div>

          {/* Action Button */}
          <div className="hero-action-wrapper">
            <button
              className="hero-btn"
              onClick={() => navigate("/emr")}
            >
              Proceed to Vault
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
              </svg>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}

export default HomePage;
